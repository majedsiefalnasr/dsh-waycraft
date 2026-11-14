/**
 * Claude Pro/Max subscription provider: OAuth against claude.ai /
 * platform.claude.com with the Claude Code client id, and streaming against
 * the Anthropic Messages API with the Claude Code identity headers.
 */

import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { StringDecoder } from 'node:string_decoder';
import {
  claudeCliMissingFlagMessage,
  claudeCliUpdateMessage,
  discoverClaudeCli,
  prepareClaudeCliAccountDirectory,
  probeClaudeCliFlags,
  SCRUBBED_ENV,
} from '../auth/claude-cli.js';
import {
  answerControlRequest,
  approvalsDisabled,
  controlErrorLine,
  controlResponseLine,
  permissionModeFor,
} from '../auth/claude-cli-control.js';
import type { CliControlServices } from '../auth/claude-cli-control.js';
import { planCliArguments, refusedFlag } from '../auth/cli-flags.js';
import type { CliArgument } from '../auth/cli-flags.js';
import type { ClaudeCliRuntime } from '../auth/claude-cli.js';
import {
  createClaudeCliMcpRun,
  MCP_CONFIG_PLACEHOLDER,
} from '../auth/claude-cli-mcp.js';
import {
  readHiddenSkills,
  readManagerMcp,
  skillSettingsArgument,
  type McpManagerState,
} from '../auth/claude-cli-governance.js';
import type { ToolRuntime } from '@deepseek-ai/dsh-tools';
import type { Agent } from '@deepseek-ai/dsh-agent';
import { translateClaudeCliStream } from '../translate/claude-cli.js';
import {
  EMPTY_RESPONSE_CODE,
  errorChain,
  LlmAdapter,
  LlmError,
  ReasoningEffortId,
} from '@deepseek-ai/dsh-llm';
import type {
  GenerateOptions,
  LlmModelInfo,
  LlmProviderInfo,
  LlmResolvedModelInfo,
  StreamChunk,
} from '@deepseek-ai/dsh-llm';
import type { FlowSpec } from '../auth/oauth-flow.js';
import type { ClaudeSession } from '../auth/store.js';
import type { ProviderId } from '../auth/store.js';
import type { PoolAdapter } from './pool.js';
import type { AttachmentStore } from '@deepseek-ai/dsh-attachment';
import {
  hostSupportsImageOffload,
  IMAGE_OFFLOAD_REQUIRED,
  requiredImageOffloadCount,
  resolveImages,
} from '../translate/resolved.js';
import type { TranslatableMessage } from '../translate/resolved.js';
import {
  markMessageCache,
  streamAnthropic,
  toAnthropicMessages,
  toAnthropicSystem,
  toAnthropicTools,
} from '../translate/anthropic.js';
import type { PromptCacheTtl } from '../translate/anthropic.js';
import {
  httpLlmError,
  idleWatchdog,
  mapFetchFailure,
  mergeReasoning,
  ModelCatalogCache,
  discoverAcrossAccounts,
  discoverOrRetryAuth,
  isDiscoveryAborted,
  isMissingOrInvalidCredential,
  oauthEndpointError,
  OAuthEndpointError,
} from './common.js';
import {
  AccountTokenManager,
  DISCOVERY_TIMEOUT_MS,
  unionAccountCatalogs,
} from './accounts.js';
import type {
  CatalogPersistence,
  DiscoveredModel,
  FetchFn,
  ModelEntry,
  ProviderUsage,
  UsageWindow,
} from './common.js';
import { EXTRA_USAGE_REQUIRED_CODE } from './common.js';
import { proxiedFetch } from '../http.js';
import { compareVersions } from './npm-cli-version.js';
import type { CliVersion } from './npm-cli-version.js';
import {
  DEFAULT_RATE_LIMIT_WAIT,
  DEFAULT_RETRY,
  earliestReset,
  jsonBody,
  resetFromFields,
  resetInstantFromHeader,
  subscriptionRetryPolicy,
} from './rate-limit.js';
import type { RateLimitResetReader, RateLimitWait } from './rate-limit.js';

export const CLAUDE_CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
export const CLAUDE_AUTHORIZE_URL = 'https://claude.ai/oauth/authorize';
export const CLAUDE_TOKEN_URL = 'https://claude.ai/v1/oauth/token';
export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages?beta=true';
export const CLAUDE_PROFILE_URL = 'https://api.anthropic.com/api/oauth/profile';
export const CLAUDE_MODELS_URL =
  'https://api.anthropic.com/v1/models?beta=true';
export const CLAUDE_SCOPE =
  'org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload';
export const CLAUDE_CALLBACK_PATH = '/callback';
// Fallbacks only when discovery is unavailable or the model omits its limits.
const CLAUDE_CONTEXT_WINDOW = 200_000;
const CLAUDE_DEFAULT_MAX_TOKENS = 32_000;
/** Refresh when the access token has less than this much life left. */
export const CLAUDE_PREEMPT_MS = 5 * 60_000;

/**
 * Body fields Anthropic uses to name a reset instant, read when the unified
 * headers are absent.
 */
const CLAUDE_RESET_FIELDS = [
  'resets_at',
  'resetsAt',
  'reset_at',
  'retry_after',
] as const;

/**
 * Reads the reset instant of the Anthropic window that rejected a request.
 *
 * `anthropic-ratelimit-unified-*` is the subscription-plan family — the one
 * Claude Code renders as "resets 3pm" — and is the only header that names the
 * window which actually rejected this request. The per-bucket
 * `anthropic-ratelimit-{requests,tokens,input-tokens,output-tokens}-reset`
 * headers are deliberately not read: they are rollover snapshots attached to
 * every response, so on a 429 they cannot say which bucket refused, and the
 * earliest of them is typically the bucket that still had room — a wait that
 * lands straight back in the closed window. They reach the operator through
 * `rateLimitDiagnostics` instead.
 */
export const claudeRateLimitReset: RateLimitResetReader = (
  response,
  body,
  now,
) => {
  const unified = earliestReset(
    resetInstantFromHeader(response, 'anthropic-ratelimit-unified-reset', now),
    resetInstantFromHeader(
      response,
      'anthropic-ratelimit-unified-fallback-reset',
      now,
    ),
  );
  if (unified !== undefined) return unified;
  return resetFromFields(jsonBody(body), CLAUDE_RESET_FIELDS, now);
};

/**
 * The subscription endpoint only serves requests presenting as Claude Code,
 * so these headers impersonate the CLI; the harness attribution user-agent
 * cannot be sent here (one user-agent slot, and the CLI's wins). The endpoint
 * also gates new models on the CLI version, so the version normally comes
 * from npm (`ClaudeCliVersionCache`); this is only the offline floor.
 */
export const CLAUDE_CLI_FALLBACK_VERSION = '2.1.283';

/**
 * Candidate invocations, in order of preference. Windows npm installs expose
 * Claude Code as a `.cmd` shim, which must run through a shell.
 */
const CLAUDE_VERSION_PROBES: readonly (readonly [
  string,
  readonly string[],
  { shell?: boolean },
])[] =
  process.platform === 'win32'
    ? [
        ['claude --version', [], { shell: true }],
        ['claude.cmd --version', [], { shell: true }],
      ]
    : [['claude', ['--version'], {}]];

export function detectClaudeVersion(): string {
  let lastError: unknown;
  for (const [command, args, options] of CLAUDE_VERSION_PROBES) {
    try {
      const raw = execFileSync(command, [...args], {
        timeout: 10_000,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        ...options,
      });
      const match = raw.match(/(\d+\.\d+\.\d+)/);
      if (match) return match[1];
    } catch (error) {
      lastError = error;
    }
  }
  // This is debug-only: the fallback is expected when Claude Code is absent.
  if (lastError !== undefined) {
    console.debug(
      'dsh-waycraft: Claude CLI version detection fell back',
      lastError,
    );
  }
  return CLAUDE_CLI_FALLBACK_VERSION;
}

/**
 * The lowest version to present: the local CLI or the bundled fallback,
 * whichever is newer. An outdated local install must not pin requests to a
 * version the endpoint already rejects for new models.
 * @param detect - local CLI probe (injectable for tests).
 */
export function claudeCliVersionFloor(
  detect: () => string = detectClaudeVersion,
): CliVersion {
  const local = detect();
  return compareVersions(local, CLAUDE_CLI_FALLBACK_VERSION) > 0
    ? { version: local, source: 'local' }
    : { version: CLAUDE_CLI_FALLBACK_VERSION, source: 'fallback' };
}

/** The User-Agent Claude Code sends at `version`. */
export function claudeCliUserAgent(version: string): string {
  return `claude-cli/${version} (external, cli)`;
}

// Lazy + memoized: the floor shells out to `claude --version`, so this must
// not run at module-evaluation time (it would fire for every consumer of this
// module regardless of whether Claude is a configured provider). Used when no
// npm-backed resolver is wired in.
let localCliVersion: string | undefined;
async function localClaudeCliVersion(): Promise<string> {
  localCliVersion ??= claudeCliVersionFloor().version;
  return localCliVersion;
}
export const CLAUDE_BETA_FALLBACK = [
  'claude-code-20250219',
  'oauth-2025-04-20',
  'interleaved-thinking-2025-05-14',
  'context-management-2025-06-27',
  'effort-2025-11-24',
  'compact-2026-01-12',
  'files-api-2025-04-14',
].join(',');

const CLAUDE_BETA_FLAGS = CLAUDE_BETA_FALLBACK;

/** Static claude flow facts for the OAuth flow engine. */
export const claudeFlow: FlowSpec = {
  callbackPath: CLAUDE_CALLBACK_PATH,
  // The redirect URI embeds the port, so it must be an ephemeral one.
  listen: { host: 'localhost', ports: [0] },
  buildAuthorizeUrl({ redirectUri, state, pkce }) {
    const params = new URLSearchParams({
      code: 'true',
      client_id: CLAUDE_CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: CLAUDE_SCOPE,
      code_challenge: pkce.challenge,
      code_challenge_method: 'S256',
      state,
    });
    return `${CLAUDE_AUTHORIZE_URL}?${params.toString()}`;
  },
};

/** Token endpoint response shape (subset). */
interface ClaudeTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

/** Best-effort account profile; login must not fail when this does (a failure or abort yields `{}`). */
export async function fetchClaudeProfile(
  accessToken: string,
  signal?: AbortSignal,
): Promise<Pick<ClaudeSession, 'emailAddress' | 'subscriptionType'>> {
  try {
    const response = await proxiedFetch(CLAUDE_PROFILE_URL, {
      ...(signal === undefined ? {} : { signal }),
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return {};
    const profile = (await response.json()) as Record<string, unknown>;
    const account =
      typeof profile.account === 'object' && profile.account !== null
        ? (profile.account as Record<string, unknown>)
        : {};
    const email =
      profile.emailAddress ??
      profile.email ??
      account.email_address ??
      account.email;
    const subscription =
      profile.subscriptionType ??
      profile.subscription_type ??
      account.subscription_type;
    return {
      ...(typeof email === 'string' && email.length > 0
        ? { emailAddress: email }
        : {}),
      ...(typeof subscription === 'string' && subscription.length > 0
        ? { subscriptionType: subscription }
        : {}),
    };
  } catch {
    // Profile lookup is decorative; only the token exchange owns login success.
    return {};
  }
}

/** Build a session from a token response. */
async function claudeSession(
  tokens: ClaudeTokenResponse,
  fallbackRefreshToken: string | undefined,
  withProfile: boolean,
): Promise<ClaudeSession> {
  if (
    typeof tokens.access_token !== 'string' ||
    tokens.access_token.length === 0
  ) {
    throw new Error('claude token endpoint returned no access token');
  }
  const refreshToken = tokens.refresh_token ?? fallbackRefreshToken;
  if (refreshToken === undefined)
    throw new Error('claude token endpoint returned no refresh token');
  if (typeof tokens.expires_in !== 'number' || tokens.expires_in <= 0) {
    throw new Error('claude token endpoint returned no usable expiry');
  }
  const profile = withProfile
    ? await fetchClaudeProfile(tokens.access_token)
    : {};
  return {
    accessToken: tokens.access_token,
    refreshToken,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    scopes: tokens.scope ?? CLAUDE_SCOPE,
    ...profile,
  };
}

/**
 * Exchange an authorization code for a claude session (JSON grant).
 * @param code - the authorization code from the callback.
 * @param verifier - the PKCE verifier minted for the attempt.
 * @param redirectUri - the attempt's redirect URI.
 * @param state - the attempt's state (echoed to the token endpoint).
 * @returns the session to store.
 */
export async function exchangeClaudeCode(
  code: string,
  verifier: string,
  redirectUri: string,
  state: string,
): Promise<ClaudeSession> {
  const response = await proxiedFetch(CLAUDE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: CLAUDE_CLIENT_ID,
      code_verifier: verifier,
      state,
    }),
  });
  if (!response.ok) throw await oauthEndpointError(response, 'claude');
  return claudeSession(
    (await response.json()) as ClaudeTokenResponse,
    undefined,
    true,
  );
}

/**
 * Refresh a claude session (JSON grant echoing the issued scope).
 * @param session - the stored session.
 * @param signal - optional cancellation (the component lifecycle) for the token request.
 * @returns the fresh session to store.
 */
export async function refreshClaude(
  session: ClaudeSession,
  signal?: AbortSignal,
): Promise<ClaudeSession> {
  const response = await proxiedFetch(CLAUDE_TOKEN_URL, {
    method: 'POST',
    ...(signal === undefined ? {} : { signal }),
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
      client_id: CLAUDE_CLIENT_ID,
      scope: session.scopes,
    }),
  });
  if (!response.ok) throw await oauthEndpointError(response, 'claude');
  const next = await claudeSession(
    (await response.json()) as ClaudeTokenResponse,
    session.refreshToken,
    false,
  );
  return {
    ...next,
    ...(session.emailAddress === undefined
      ? {}
      : { emailAddress: session.emailAddress }),
    ...(session.subscriptionType === undefined
      ? {}
      : { subscriptionType: session.subscriptionType }),
    ...(session.keychainBound === true ? { keychainBound: true } : {}),
  };
}

/**
 * Whether a claude refresh failure means the login is permanently gone.
 * @param error - the thrown refresh error.
 * @returns true when re-login is the only fix.
 */
export function isClaudePermanentRefreshError(error: unknown): boolean {
  return (
    error instanceof OAuthEndpointError &&
    (error.oauthCode === 'invalid_grant' || error.oauthCode === 'invalid_token')
  );
}

export const CLAUDE_USAGE_URL = 'https://api.anthropic.com/api/oauth/usage';

/** RFC3339 `resets_at` value → epoch ms, or undefined when absent/unparsable. */
function claudeResetsAt(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Map one legacy `{utilization, resets_at}` bucket; undefined when null or unusable. */
function claudeLegacyWindow(
  value: unknown,
  kind: UsageWindow['kind'],
  scope?: string,
): UsageWindow | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const bucket = value as { utilization?: number; resets_at?: string };
  if (
    typeof bucket.utilization !== 'number' ||
    !Number.isFinite(bucket.utilization)
  )
    return undefined;
  const resetsAt = claudeResetsAt(bucket.resets_at);
  return {
    kind,
    ...(scope === undefined ? {} : { scope }),
    usedPercent: bucket.utilization,
    ...(resetsAt === undefined ? {} : { resetsAt }),
  };
}

/** One entry of the modern `limits` array (subset). */
interface ClaudeLimitEntry {
  kind?: string;
  percent?: number;
  resets_at?: string;
  scope?: { model?: { display_name?: string } };
}

/** Map the modern `limits` array; empty when absent or carrying nothing usable. */
function claudeLimitsWindows(value: unknown): UsageWindow[] {
  if (!Array.isArray(value)) return [];
  const windows: UsageWindow[] = [];
  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null) continue;
    const entry = raw as ClaudeLimitEntry;
    if (typeof entry.percent !== 'number' || !Number.isFinite(entry.percent))
      continue;
    const kind: UsageWindow['kind'] =
      entry.kind === 'session'
        ? 'session'
        : entry.kind === 'weekly_all' || entry.kind === 'weekly_scoped'
          ? 'weekly'
          : 'other';
    const scope = entry.scope?.model?.display_name;
    const resetsAt = claudeResetsAt(entry.resets_at);
    windows.push({
      kind,
      ...(typeof scope === 'string' && scope.length > 0 ? { scope } : {}),
      usedPercent: entry.percent,
      ...(resetsAt === undefined ? {} : { resetsAt }),
    });
  }
  return windows;
}

/**
 * Fetch the claude subscription usage from the OAuth usage endpoint (the
 * source of Claude Code's `/usage` screen). Newer responses carry a
 * structured `limits` array; older ones the flat `five_hour`/`seven_day*`
 * buckets — both shapes are read, the array winning when it has entries.
 * @param session - the stored session (used as-is; never refreshed here).
 * @param fetchFn - fetch implementation (injectable for tests).
 * @param signal - caller cancellation from the RPC transport.
 * @param cliVersion - resolves the Claude Code version to present; defaults to the local floor.
 * @returns the mapped usage snapshot.
 */
export async function fetchClaudeUsage(
  session: ClaudeSession,
  fetchFn: FetchFn = proxiedFetch,
  signal?: AbortSignal,
  cliVersion: () => Promise<string> = localClaudeCliVersion,
): Promise<ProviderUsage> {
  const userAgent = claudeCliUserAgent(await cliVersion());
  const response = await fetchFn(CLAUDE_USAGE_URL, {
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      'anthropic-beta': 'oauth-2025-04-20',
      // Unrecognized clients are aggressively rate-limited on this endpoint,
      // so it presents as the CLI like every other subscription request.
      'user-agent': userAgent,
      accept: 'application/json',
    },
    ...(signal === undefined ? {} : { signal }),
  });
  if (!response.ok) throw await oauthEndpointError(response, 'claude usage');
  const payload = (await response.json()) as Record<string, unknown>;
  const modern = claudeLimitsWindows(payload.limits);
  if (modern.length > 0) return { supported: true, windows: modern };
  const windows: UsageWindow[] = [];
  const legacy = [
    claudeLegacyWindow(payload.five_hour, 'session'),
    claudeLegacyWindow(payload.seven_day, 'weekly'),
    claudeLegacyWindow(payload.seven_day_opus, 'weekly', 'Opus'),
    claudeLegacyWindow(payload.seven_day_sonnet, 'weekly', 'Sonnet'),
  ];
  for (const window of legacy) {
    if (window !== undefined) windows.push(window);
  }
  return { supported: true, windows };
}

interface ClaudeModelCapabilities {
  thinking?: {
    types?: {
      enabled?: { supported?: boolean };
      adaptive?: { supported?: boolean };
    };
  };
  effort?: {
    supported?: boolean;
    low?: { supported?: boolean };
    medium?: { supported?: boolean };
    high?: { supported?: boolean };
    xhigh?: { supported?: boolean };
    max?: { supported?: boolean };
  };
}

function claudeThinkingType(
  capabilities: ClaudeModelCapabilities | undefined,
): 'enabled' | 'adaptive' | undefined {
  const types = capabilities?.thinking?.types;
  if (types?.enabled?.supported === true) return 'enabled';
  if (types?.adaptive?.supported === true) return 'adaptive';
  return undefined;
}

/** Effort levels in display order; a model exposes only the ones it advertises as supported. */
const CLAUDE_EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

function claudeReasoning(
  capabilities: ClaudeModelCapabilities | undefined,
): DiscoveredModel['reasoning'] {
  const effort = capabilities?.effort;
  if (effort?.supported !== true) return undefined;
  const efforts = CLAUDE_EFFORT_LEVELS.filter(
    (level) => effort[level]?.supported === true,
  ).map((level) => ({
    id: ReasoningEffortId(level),
    name: level[0].toUpperCase() + level.slice(1),
  }));
  return efforts.length > 0 ? { efforts } : undefined;
}

/** One entry of the `/v1/models` response; only the fields the plugin reads. */
interface ClaudeWireModel {
  id?: string;
  display_name?: string;
  capabilities?: ClaudeModelCapabilities;
  /** Advertised input context size in tokens. */
  max_input_tokens?: number;
  /** Advertised per-request output ceiling in tokens. */
  max_tokens?: number;
}

/** A token limit the endpoint disclosed, or undefined when absent or malformed. */
function positiveTokenCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : undefined;
}

/**
 * Fetch the live model catalog from the subscription endpoint. `signal`
 * cancels the request; `cliVersion` resolves the Claude Code version to
 * present (defaults to the local floor).
 */
export async function fetchClaudeModels(
  session: ClaudeSession,
  fetchFn: FetchFn = proxiedFetch,
  signal?: AbortSignal,
  cliVersion: () => Promise<string> = localClaudeCliVersion,
): Promise<DiscoveredModel[]> {
  const userAgent = claudeCliUserAgent(await cliVersion());
  const response = await fetchFn(CLAUDE_MODELS_URL, {
    headers: {
      authorization: `Bearer ${session.accessToken}`,
      'anthropic-version': '2023-06-01',
      'user-agent': userAgent,
      'anthropic-dangerous-direct-browser-access': 'true',
      accept: 'application/json',
    },
    ...(signal === undefined ? {} : { signal }),
  });
  if (!response.ok) throw await httpLlmError(response, 'claude models API');
  const payload = (await response.json()) as { data?: ClaudeWireModel[] };
  if (!Array.isArray(payload.data)) {
    throw new Error('claude models API returned an invalid catalog');
  }
  const models: DiscoveredModel[] = payload.data
    .filter(
      (m): m is ClaudeWireModel & { id: string } => typeof m.id === 'string',
    )
    .map((m) => {
      const thinkingType = claudeThinkingType(m.capabilities);
      const reasoning = claudeReasoning(m.capabilities);
      // The endpoint advertises each model's limits; carrying them through keeps
      // the route current for models newer than the bundled catalog.
      const contextWindow = positiveTokenCount(m.max_input_tokens);
      const maxOutputTokens = positiveTokenCount(m.max_tokens);
      return {
        id: m.id,
        name: m.display_name ?? m.id,
        ...(contextWindow === undefined ? {} : { contextWindow }),
        ...(maxOutputTokens === undefined ? {} : { maxOutputTokens }),
        ...(thinkingType === undefined ? {} : { thinkingType }),
        ...(reasoning === undefined ? {} : { reasoning }),
      };
    });
  if (models.length === 0) {
    throw new Error('claude models API returned an empty catalog');
  }
  return models;
}

/**
 * The output cap for one model: configuration may lower the default, but never
 * exceeds a server-advertised ceiling; the built-in constant is the last resort.
 */
function claudeMaxTokens(
  configured: ModelEntry | undefined,
  disc: DiscoveredModel | undefined,
): number {
  const outputLimit = disc?.maxOutputTokens;
  const preferred =
    configured?.maxTokens ?? outputLimit ?? CLAUDE_DEFAULT_MAX_TOKENS;
  return outputLimit === undefined
    ? preferred
    : Math.min(preferred, outputLimit);
}

/** Constructor dependencies for {@link ClaudeAdapter}. */
export interface ClaudeAdapterOptions {
  models: readonly ModelEntry[];
  cliRuntime?: () => ClaudeCliRuntime;
  cliSettings?: () => { cliMaxConcurrent?: number };
  cliMaxConcurrent?: number;
  /** The DSH services a CLI turn raises permission, question and plan-review dialogs through, for one session. */
  cliServices?: (
    sessionId: string | undefined,
  ) => CliControlServices & { agent?: Agent };
  cliTools?: () => ToolRuntime | undefined;
  /** Told, at the start of every CLI turn, whether the MCP manager's saved configuration could be read. */
  onManagerMcp?: (
    sessionId: string | undefined,
    state: McpManagerState,
  ) => void;
  streamIdleTimeoutMs: number;
  tokens: AccountTokenManager<ClaudeSession>;
  /** Late-bound pool facade (wired after adapter construction); pools list under their first member's provider. */
  pool?: () => PoolAdapter | undefined;
  /** Whether to fetch the live catalog when logged in (false when config `models` overrides). */
  discovery: boolean;
  fetchFn?: FetchFn;
  onWarn?: (message: string) => void;
  /** How long this route may hold a turn open waiting for a rate-limit window; defaults to waiting on, six-hour ceiling. */
  rateLimit?: RateLimitWait;
  /** Resolve the attachment service per request; absent means image requests fail loudly. */
  resolveAttachments?: () => AttachmentStore | undefined;
  /** Durable catalog store seeding capability metadata across restarts. */
  catalogStore?: CatalogPersistence;
  onCatalogChanged?: () => void;
  accountCatalogStore?: (account: string) => CatalogPersistence;
  /**
   * Per-model default reasoning effort override (the Settings page's picker).
   * Returns the user-configured default for one model, or undefined to follow
   * the provider's own default.
   */
  defaultEffortOf?: (model: string) => string | undefined;
  /** Resolves the Claude Code version to present (npm-backed); absent means the local floor. */
  resolveCliVersion?: () => Promise<string>;
  /** Lifetime of the request's cache breakpoints; absent means Anthropic's five-minute default. */
  promptCacheTtl?: PromptCacheTtl;
  /**
   * The user's Settings-page choice, read per request so a save applies to
   * the next turn without a restart; undefined falls back to `promptCacheTtl`.
   */
  promptCacheTtlOverride?: () => PromptCacheTtl | undefined;
  /** A turn of this session was refused with the extra-usage 400 (Direct sign-in billing policy). */
  onExtraUsage?: (sessionId: string) => void;
  /** A turn of this session was accepted, so an earlier extra-usage refusal no longer describes it. */
  onTurnAccepted?: (sessionId: string) => void;
}

/** The sentence Anthropic's 400 carries; matched case-insensitively against the error body. */
const EXTRA_USAGE_PATTERN =
  /third-party apps now draw from your extra usage, not your plan limits/i;

/** Plain explanation replacing the raw 400; the Settings and session surfaces localise their own copy. */
export const EXTRA_USAGE_EXPLANATION =
  'Claude refused this request because Anthropic now bills Direct sign-in requests to your extra usage instead of your plan limits. ' +
  'Add this account through Official CLI to use your plan again.';

/**
 * Anthropic rejects any image edge over 2000px once a request carries many
 * images, and every later turn resends the history, so one oversized
 * screenshot would fail the session for good. Images are sent within
 * this cap; 3.75MB encoded stays under the 5MB base64 per-image limit.
 */
const CLAUDE_IMAGE_LIMIT = { maxEdge: 2000, maxBytes: 3_750_000 };

/**
 * Inline image data a Claude request may carry, in base64 bytes. Every turn
 * resends the history, so screenshots accumulate until the request passes the
 * API's 32MB body limit and every later turn and compaction fails with HTTP
 * 413 `request_too_large`. Past this budget the host offloads the oldest
 * images to text and retries; the remaining 12MB holds prompts, tools, and text.
 */
export const CLAUDE_REQUEST_IMAGE_BUDGET = 20 * 1024 * 1024;

/** The Claude 4.5 family accepts image input. */
const CLAUDE_MODALITIES: readonly ('text' | 'image')[] = ['text', 'image'];

/**
 * Assemble the Anthropic request body.
 *
 * Extracted from the adapter so the wire shape — cache breakpoints above all —
 * is testable without a network round trip. The message array is marked before
 * it is placed so the breakpoints land on the blocks the body ships: one on the
 * last `system` block (covering `tools` + `system`, which render ahead of it)
 * and up to three across the history, Anthropic's four-slot maximum.
 * @param options - the generate request.
 * @param messages - conversation messages with images already resolved.
 * @param maxTokens - the resolved output cap.
 * @param thinking - the thinking parameter, when the model takes one.
 * @param effort - the reasoning effort, when the model advertises efforts.
 * @param cacheTtl - lifetime of every cache breakpoint; defaults to five minutes.
 * Requests that carry a `purpose` (compaction, session titles) always use five
 * minutes to preserve their existing auxiliary-request behavior. A five-minute
 * mark can still read an entry a one-hour mark wrote.
 * @returns the JSON body to POST.
 */
export function claudeRequestBody(
  options: GenerateOptions,
  messages: readonly TranslatableMessage[],
  maxTokens: number,
  thinking?: Record<string, unknown>,
  effort?: string,
  cacheTtl?: PromptCacheTtl,
): Record<string, unknown> {
  const ttl = options.purpose === undefined ? cacheTtl : undefined;
  const anthropicMessages = toAnthropicMessages(messages);
  markMessageCache(anthropicMessages, ttl);
  return {
    model: options.model,
    max_tokens: maxTokens,
    system: toAnthropicSystem(options.system, messages, ttl),
    messages: anthropicMessages,
    ...(options.tools !== undefined && options.tools.length > 0
      ? { tools: toAnthropicTools(options.tools) }
      : {}),
    ...(thinking === undefined ? {} : { thinking }),
    ...(effort === undefined ? {} : { output_config: { effort } }),
    stream: true,
    ...(options.sessionId !== undefined
      ? { metadata: { user_id: String(options.sessionId) } }
      : {}),
  };
}

/** Claude wire adapter: one instance serves the `claude` provider route. */
export class ClaudeAdapter extends LlmAdapter {
  /** `--help` flags per installed executable and version, so a turn does not pay for a probe each time. */
  private readonly cliFlags = new Map<
    string,
    Promise<Set<string> | undefined>
  >();
  /** Optional flags an installed CLI refused once: they are not offered to it again. */
  private readonly cliRefused = new Map<string, Set<string>>();
  private readonly cliOperations = new Set<Promise<void>>();
  private readonly cliAdmission = new Map<string, number>();
  private readonly cliWaiters = new Set<() => void>();
  private readonly cliQueueAbort = new AbortController();
  private readonly cliTurns = new Set<{
    controller: AbortController;
    closed: Promise<unknown>;
  }>();
  private disposed = false;

  async disposeCliTurns(): Promise<void> {
    this.disposed = true;
    this.cliQueueAbort.abort();
    for (const turn of this.cliTurns) turn.controller.abort();
    await Promise.allSettled([...this.cliTurns].map((turn) => turn.closed));
    await Promise.allSettled([...this.cliOperations]);
  }

  private readonly catalog: ModelCatalogCache;
  /** In-memory catalogs for non-default accounts (the persisted cache is the default's). */
  private readonly accountCatalogs = new Map<string, ModelCatalogCache>();
  private accountCatalogsInvalidated = false;
  private readonly invalidatedAccounts = new Set<string>();
  /** Account whose snapshot currently lives in {@link catalog}; cleared on default change. */
  private catalogOwner: string | undefined;

  constructor(private readonly options: ClaudeAdapterOptions) {
    super();
    this.catalog = new ModelCatalogCache(
      options.catalogStore,
      undefined,
      options.onCatalogChanged,
    );
  }

  private async fetchCatalog(
    account?: string,
    signal?: AbortSignal,
  ): Promise<DiscoveredModel[]> {
    return fetchClaudeModels(
      await this.options.tokens.session(account),
      this.options.fetchFn,
      signal,
      this.options.resolveCliVersion,
    );
  }

  /** Drop cached catalogs after login/logout so the next list does not reuse a stale plan. */
  clearAccountCatalog(account?: string): void {
    if (account === undefined) {
      this.accountCatalogsInvalidated = true;
      this.invalidatedAccounts.clear();
    } else this.invalidatedAccounts.add(account);
    if (account === undefined) {
      for (const cache of this.accountCatalogs.values()) cache.invalidate();
      this.accountCatalogs.clear();
    } else {
      this.accountCatalogs.get(account)?.invalidate();
      this.accountCatalogs.delete(account);
    }
    if (
      account === undefined ||
      this.catalogOwner === account ||
      this.catalogOwner === undefined
    ) {
      this.catalogOwner = undefined;
      this.catalog.invalidate();
    }
  }

  /** Default and secondary accounts each seed their own persisted catalog. */
  private async catalogFor(account?: string): Promise<ModelCatalogCache> {
    const defaultKey = await this.options.tokens.defaultAccount();
    const key = account ?? defaultKey;
    if (key === undefined || key === defaultKey) {
      if (this.catalogOwner !== undefined && this.catalogOwner !== defaultKey) {
        this.catalog.invalidate();
      }
      this.catalogOwner = defaultKey;
      return this.catalog;
    }
    let cache = this.accountCatalogs.get(key);
    if (cache === undefined) {
      cache = new ModelCatalogCache(
        this.options.accountCatalogStore?.(key),
        undefined,
        this.options.onCatalogChanged,
      );
      const invalidated = this.invalidatedAccounts.delete(key);
      if (this.accountCatalogsInvalidated || invalidated) cache.invalidate();
      this.accountCatalogs.set(key, cache);
    }
    return cache;
  }

  private async discovered(
    model: string,
  ): Promise<DiscoveredModel | undefined> {
    if (!this.options.discovery) return undefined;
    const accounts = (await this.options.tokens.list()).map(
      (entry) => entry.key,
    );
    return discoverAcrossAccounts(accounts, async (account) => {
      const catalog = await this.catalogFor(account);
      const models = await catalog.resolve(() => this.fetchCatalog(account));
      return models?.find((entry) => entry.id === model);
    });
  }

  private staticModels(provider: string): LlmModelInfo[] {
    return this.options.models.map((model) => ({
      provider,
      id: model.id,
      name: model.name ?? model.id,
      inputModalities: model.inputModalities ?? CLAUDE_MODALITIES,
    }));
  }

  override providerInfo(provider: string): LlmProviderInfo {
    return { id: provider, name: 'Claude (Subscription)' };
  }

  override providerRetryPolicy(provider: string) {
    return subscriptionRetryPolicy(
      DEFAULT_RETRY,
      this.options.rateLimit ?? DEFAULT_RATE_LIMIT_WAIT,
      `claude: provider "${provider}" retryPolicy`,
    );
  }

  override async listModels(
    provider: string,
  ): Promise<readonly LlmModelInfo[]> {
    const own = await this.listOwnModels(provider, undefined, undefined, true);
    const pool = this.options.pool?.();
    if (pool === undefined) return own;
    const extra = await pool.modelsForProvider(provider as ProviderId);
    const seen = new Set(own.map((model) => model.id));
    // Account pools reuse the catalog row; only configured tiers are extra.
    return [...own, ...extra.filter((model) => !seen.has(model.id))];
  }

  /** The provider's own catalog: union of every account, or one account when named. */
  async listOwnModels(
    provider: string,
    account?: string,
    signal?: AbortSignal,
    preferCached = false,
  ): Promise<readonly LlmModelInfo[]> {
    if (account === undefined) {
      const accounts = (await this.options.tokens.list()).map(
        (entry) => entry.key,
      );
      if (accounts.length === 0) return [];
      return unionAccountCatalogs(
        accounts,
        (key, accountSignal) =>
          this.listOwnModels(provider, key, accountSignal, preferCached),
        {
          timeoutMs: DISCOVERY_TIMEOUT_MS,
          ...(signal === undefined ? {} : { signal }),
        },
      );
    }
    if (account.startsWith('official-cli:')) return this.staticModels(provider);
    if (account.startsWith('direct:'))
      account = decodeURIComponent(account.slice('direct:'.length));
    if (!(await this.options.tokens.hasSession(account))) {
      return [];
    }
    if (!this.options.discovery) return this.staticModels(provider);
    const catalog = await this.catalogFor(account);
    try {
      const models = await catalog.get(
        () =>
          discoverOrRetryAuth(
            (force) => this.options.tokens.session(account, force),
            catalog,
            () => this.fetchCatalog(account, signal),
          ),
        preferCached,
      );
      return models.map((model) => ({
        provider,
        id: model.id,
        name: model.name,
        inputModalities: CLAUDE_MODALITIES,
      }));
    } catch (error: unknown) {
      if (isDiscoveryAborted(error, signal)) throw error;
      if (isMissingOrInvalidCredential(error)) return [];
      this.options.onWarn?.(
        `claude model discovery failed; using the built-in catalog (${errorChain(error)})`,
      );
      return this.staticModels(provider);
    }
  }

  override async resolveModel(
    provider: string,
    model: string,
  ): Promise<LlmResolvedModelInfo> {
    const pool = this.options.pool?.();
    if (
      pool !== undefined &&
      (await pool.owns(provider as ProviderId, model))
    ) {
      return pool.resolveModel(provider, model);
    }
    return this.resolveOwnModel(provider, model);
  }

  /** Capability resolution of the provider's own models (the pool resolves members here). */
  async resolveOwnModel(
    provider: string,
    model: string,
  ): Promise<LlmResolvedModelInfo> {
    const disc = await this.discovered(model);
    const configured = this.options.models.find((entry) => entry.id === model);
    const reasoning = mergeReasoning(
      this.options.defaultEffortOf?.(model),
      disc?.reasoning,
    );
    return {
      provider,
      id: model,
      name: disc?.name ?? configured?.name ?? model,
      inputModalities: configured?.inputModalities ?? CLAUDE_MODALITIES,
      context: {
        contextWindow:
          disc?.contextWindow ??
          configured?.contextWindow ??
          CLAUDE_CONTEXT_WINDOW,
      },
      defaultMaxTokens: claudeMaxTokens(configured, disc),
      ...(reasoning === undefined ? {} : { reasoning }),
    };
  }

  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const pool = this.options.pool?.();
    if (
      pool !== undefined &&
      (await pool.owns(options.provider as ProviderId, options.model))
    ) {
      yield* pool.stream(options);
      return;
    }
    yield* this.streamCore(options);
  }

  /** Pool seam: account keys are internal and namespaced by access method. */
  streamAccount(
    options: GenerateOptions,
    account: string,
  ): AsyncIterable<StreamChunk> {
    if (account.startsWith('official-cli:'))
      return this.streamCliAccount(
        options,
        decodeURIComponent(account.slice('official-cli:'.length)),
      );
    return this.streamCore(
      options,
      account.startsWith('direct:')
        ? decodeURIComponent(account.slice('direct:'.length))
        : account,
    );
  }

  private async *streamCliAccount(
    options: GenerateOptions,
    loginId: string,
  ): AsyncIterable<StreamChunk> {
    const queueSignal = options.signal
      ? AbortSignal.any([options.signal, this.cliQueueAbort.signal])
      : this.cliQueueAbort.signal;
    const cap =
      this.options.cliSettings?.().cliMaxConcurrent ??
      this.options.cliMaxConcurrent ??
      4;
    while ((this.cliAdmission.get(loginId) ?? 0) >= cap) {
      queueSignal.throwIfAborted();
      await new Promise<void>((resolve, reject) => {
        const wake = () => {
          cleanup();
          resolve();
        };
        const abort = () => {
          cleanup();
          reject(queueSignal.reason);
        };
        const cleanup = () => {
          this.cliWaiters.delete(wake);
          queueSignal.removeEventListener('abort', abort);
        };
        this.cliWaiters.add(wake);
        queueSignal.addEventListener('abort', abort, { once: true });
      });
    }
    queueSignal.throwIfAborted();
    this.cliAdmission.set(loginId, (this.cliAdmission.get(loginId) ?? 0) + 1);
    let complete!: () => void;
    const operation = new Promise<void>((resolve) => {
      complete = resolve;
    });
    this.cliOperations.add(operation);
    try {
      yield* this.runCliAccount(options, loginId);
    } finally {
      complete();
      this.cliOperations.delete(operation);
      this.cliAdmission.set(loginId, (this.cliAdmission.get(loginId) ?? 1) - 1);
      for (const wake of [...this.cliWaiters]) wake();
    }
  }

  private async *runCliAccount(
    options: GenerateOptions,
    loginId: string,
    fresh = false,
  ): AsyncIterable<StreamChunk> {
    const runtime = this.options.cliRuntime?.();
    if (!runtime)
      throw new Error('Official CLI requires the DSH subprocess service');
    const discovery = await discoverClaudeCli(
      runtime,
      options.signal
        ? AbortSignal.any([options.signal, this.cliQueueAbort.signal])
        : this.cliQueueAbort.signal,
    );
    if (discovery.updateRequired)
      throw new Error(claudeCliUpdateMessage(discovery.version));
    if (!discovery.available || !discovery.path)
      throw new Error('Claude CLI is not available');
    const installed = `${discovery.path}@${discovery.version}`;
    const refused = this.cliRefused.get(installed) ?? new Set<string>();
    // One probe per installed version, shared by turns that arrive together. An unreadable help page is remembered
    // too (nothing is judged in advance and a refused flag is handled at run time); only an aborted probe is retried.
    let probe = this.cliFlags.get(installed);
    if (!probe) {
      probe = probeClaudeCliFlags(
        runtime,
        discovery.path,
        options.signal
          ? AbortSignal.any([options.signal, this.cliQueueAbort.signal])
          : this.cliQueueAbort.signal,
      );
      this.cliFlags.set(installed, probe);
      probe.catch(() => {
        if (this.cliFlags.get(installed) === probe)
          this.cliFlags.delete(installed);
      });
    }
    const supported = await probe;
    const directory = await prepareClaudeCliAccountDirectory(loginId);
    let prior = options.messages
      .flatMap((message) => {
        const state =
          message.role === 'assistant'
            ? message.source?.replayState
            : undefined;
        return state &&
          typeof state === 'object' &&
          'response' in state &&
          (state as { response?: unknown }).response &&
          typeof (state as { response: { kind?: unknown } }).response ===
            'object' &&
          (state as { response: { kind?: unknown } }).response.kind ===
            'waycraft-claude-cli-session'
          ? [
              (state as { response: { sessionId?: unknown } }).response
                .sessionId,
            ]
          : [];
      })
      .filter((value): value is string => typeof value === 'string')
      .at(-1);
    if (fresh) prior = undefined;
    const prompt = options.messages
      .filter((message) => message.role === 'user')
      .at(-1);
    if (!prompt) throw new Error('Claude CLI turn requires a user message');
    const messageText = (
      message: GenerateOptions['messages'][number],
    ): string =>
      typeof message.content === 'string'
        ? message.content
        : message.content
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join('');
    // A new CLI session has no transcript. Preserve DSH's text history as a
    // single contextual prompt; a resumed session already owns that history.
    const text =
      prior || options.messages.length === 1
        ? messageText(prompt)
        : options.messages
            .map((message) => `[${message.role}]\n${messageText(message)}`)
            .join('\n\n');
    const permissionMode = permissionModeFor(options.messages);
    const promptsDisabled = approvalsDisabled(options.messages);
    const images = await this.promptImages(prompt, options.signal);
    // Titles and summaries (the requests DSH tags with a purpose) are single-turn runs with no tools at all.
    const sideRequest = options.purpose !== undefined;
    const services = this.options.cliServices?.(options.sessionId) ?? {};
    const mcpTools = sideRequest ? undefined : this.options.cliTools?.();
    const agent = services.agent;
    const withDshTools = mcpTools !== undefined && agent !== undefined;
    if (!sideRequest && !withDshTools)
      this.options.onWarn?.(
        'Claude CLI turn runs without DSH tools: the tool service or the session agent is unavailable',
      );
    // The managers decide what the run can use (ADR-0006), read fresh each turn. A side request is tool-less, so neither applies.
    const managerMcp = sideRequest ? undefined : await readManagerMcp();
    if (managerMcp) {
      this.options.onManagerMcp?.(options.sessionId, managerMcp.state);
      if (managerMcp.state === 'unreadable')
        this.options.onWarn?.(
          'The MCP manager configuration cannot be read; its servers are not available in this session',
        );
    }
    const managerServers = managerMcp?.servers ?? {};
    const withMcpConfig =
      withDshTools || Object.keys(managerServers).length > 0;
    const skillSettings = sideRequest
      ? undefined
      : skillSettingsArgument(await readHiddenSkills());
    const parts: CliArgument[] = [
      ...(options.system
        ? [
            {
              flag: '--system-prompt',
              args: ['--system-prompt', options.system],
            },
          ]
        : []),
      { flag: '--print', args: ['-p'] },
      { flag: '--input-format', args: ['--input-format', 'stream-json'] },
      { flag: '--output-format', args: ['--output-format', 'stream-json'] },
      { flag: '--verbose', args: ['--verbose'] },
      // Without partial events the translator reads the completed messages instead.
      {
        flag: '--include-partial-messages',
        args: ['--include-partial-messages'],
        optional: true,
      },
      { flag: '--model', args: ['--model', options.model] },
      // Permission prompts, questions and plan reviews come back as control requests that become DSH dialogs.
      // An older CLI without these flags still runs: it then denies what needs a prompt instead of asking.
      {
        flag: '--permission-mode',
        args: ['--permission-mode', permissionMode],
        optional: true,
      },
      {
        flag: '--permission-prompt-tool',
        args: ['--permission-prompt-tool', 'stdio'],
        optional: true,
      },
      // A side request must not fall back to the CLI's tools when the flag is unsupported, so there it is required.
      {
        flag: '--tools',
        args: ['--tools', sideRequest ? '' : 'default'],
        optional: !sideRequest,
      },
      ...(sideRequest
        ? [{ flag: '--max-turns', args: ['--max-turns', '1'], optional: true }]
        : []),
      // The run sees only the servers Waycraft hands it (ADR-0006): none for a side request, the DSH tools otherwise.
      { flag: '--strict-mcp-config', args: ['--strict-mcp-config'] },
      ...(withMcpConfig
        ? [
            {
              flag: '--mcp-config',
              args: ['--mcp-config', MCP_CONFIG_PLACEHOLDER],
            },
          ]
        : []),
      // The skills the Skill manager keeps from DSH are switched off for the run; required, or a hidden skill would show.
      ...(skillSettings === undefined
        ? []
        : [{ flag: '--settings', args: ['--settings', skillSettings] }]),
      prior
        ? { flag: '--resume', args: ['--resume', prior] }
        : { flag: '--session-id', args: ['--session-id', randomUUID()] },
    ];
    const plan = planCliArguments(parts, supported, refused);
    if (plan.missing.length)
      throw new Error(
        claudeCliMissingFlagMessage(discovery.version, plan.missing.join(', ')),
      );
    if (this.disposed) throw new Error('Claude adapter is disposed');
    const controller = new AbortController();
    const caller = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal;
    const watchdog = idleWatchdog(caller, this.options.streamIdleTimeoutMs);
    const signal = watchdog.signal;
    signal.throwIfAborted();
    const mcpRun = withMcpConfig
      ? await createClaudeCliMcpRun({
          accountDirectory: directory,
          signal,
          managerServers,
          ...(withDshTools ? { dshTools: { runtime: mcpTools, agent } } : {}),
        })
      : undefined;
    const argv = [
      discovery.path,
      ...plan.argv.map((arg) =>
        arg === MCP_CONFIG_PLACEHOLDER ? mcpRun!.configPath : arg,
      ),
    ];
    let handle: ReturnType<ClaudeCliRuntime['spawn']>;
    try {
      // stdin stays open for the whole turn so control replies can be written; it is ended when the result arrives.
      handle = runtime.spawn({
        argv,
        cwd: directory,
        env: { CLAUDE_CONFIG_DIR: directory, ...SCRUBBED_ENV },
        stdio: {
          stdin: 'pipe',
          stdout: 'pipe',
          stderr: { maxBytes: 64 * 1024 },
        },
        graceMs: 1000,
        signal,
      });
    } catch (error) {
      await mcpRun?.close();
      throw error;
    }
    const turn = { controller, closed: handle.waitForExit() };
    this.cliTurns.add(turn);
    // Observe spawn failures immediately, including while the output iterator is pending.
    void handle.done.catch(() => {});
    const stdin = handle.stdin;
    stdin?.on('error', () => {});
    const writeToCli = (line: string): boolean => {
      if (!stdin || stdin.destroyed || stdin.writableEnded) return false;
      return stdin.write(line);
    };
    const endStdin = () => {
      if (stdin && !stdin.destroyed && !stdin.writableEnded) stdin.end();
    };
    // Dialogs the Owner has not answered yet, by request id. A dialog ends when answered, when the CLI withdraws it,
    // or when the turn ends or is aborted: its signal is the turn's signal, so none is left open.
    const dialogs = new Map<string, AbortController>();
    // A person thinking over a dialog is not an idle stream: keep the idle watchdog from ending the turn meanwhile.
    const keepAlive = setInterval(() => {
      if (dialogs.size > 0) watchdog.pulse();
    }, 15_000);
    keepAlive.unref();
    const handleControl = (frame: {
      request_id?: unknown;
      request?: unknown;
    }) => {
      const id =
        typeof frame.request_id === 'string' ? frame.request_id : undefined;
      const request =
        frame.request &&
        typeof frame.request === 'object' &&
        !Array.isArray(frame.request)
          ? (frame.request as Record<string, unknown>)
          : undefined;
      if (id === undefined || request === undefined) return;
      if (request.subtype !== 'can_use_tool') {
        writeToCli(
          controlErrorLine(
            id,
            `${String(request.subtype ?? 'unknown')} requests are not supported by Waycraft`,
          ),
        );
        return;
      }
      const dialog = new AbortController();
      dialogs.set(id, dialog);
      const dialogSignal = AbortSignal.any([signal, dialog.signal]);
      // Without a tool_use_id the request id keeps two concurrent prompts for one tool apart.
      const named =
        typeof request.tool_use_id === 'string'
          ? request
          : { ...request, tool_use_id: id };
      void answerControlRequest(named, services, dialogSignal, promptsDisabled)
        .then((result) => {
          // A dialog the CLI withdrew, or a turn that ended, has nobody left to read the answer.
          if (!dialog.signal.aborted && !signal.aborted)
            writeToCli(controlResponseLine(id, result));
        })
        .catch(() => {})
        .finally(() => {
          dialogs.delete(id);
        });
    };
    let retryMissing = false;
    let retryWithoutFlag = false;
    let emitted = false;
    let outputEvidence = '';
    try {
      if (!handle.stdout)
        throw new Error('Claude CLI subprocess omitted stdout pipe');
      // Without a writable stdin the prompt could not be sent and the CLI would wait on empty input.
      if (!stdin) throw new Error('Claude CLI subprocess omitted stdin pipe');
      writeToCli(
        JSON.stringify({
          type: 'user',
          session_id: '',
          parent_tool_use_id: null,
          message: {
            role: 'user',
            content: images.length ? [{ type: 'text', text }, ...images] : text,
          },
        }) + '\n',
      );
      const stdout = handle.stdout;
      async function* observedLines() {
        const decoder = new StringDecoder('utf8');
        let pending = '';
        for await (const chunk of stdout) {
          watchdog.pulse();
          pending += decoder.write(
            Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
          );
          let newline: number;
          while ((newline = pending.indexOf('\n')) !== -1) {
            const line = pending.slice(0, newline);
            pending = pending.slice(newline + 1);
            if (Buffer.byteLength(line, 'utf8') > 1024 * 1024)
              throw new Error('Claude CLI output frame exceeds 1 MiB');
            // Only the CLI's own error result is rejection evidence; assistant text never is.
            let frame:
              | {
                  type?: unknown;
                  is_error?: unknown;
                  result?: unknown;
                  request_id?: unknown;
                  request?: unknown;
                }
              | undefined;
            try {
              frame = JSON.parse(line);
            } catch {
              /* not a JSON frame */
            }
            if (
              frame?.type === 'result' &&
              frame.is_error === true &&
              typeof frame.result === 'string'
            )
              outputEvidence += frame.result + '\n';
            // Control frames are answered here and never reach the translator.
            if (frame?.type === 'control_request') {
              handleControl(frame);
              continue;
            }
            if (frame?.type === 'control_cancel_request') {
              if (typeof frame.request_id === 'string')
                dialogs.get(frame.request_id)?.abort();
              continue;
            }
            // The CLI waits for more input until stdin ends, so ending it after the result lets the process exit.
            if (frame?.type === 'result') endStdin();
            yield line;
          }
          if (Buffer.byteLength(pending, 'utf8') > 1024 * 1024)
            throw new Error('Claude CLI output frame exceeds 1 MiB');
        }
        pending += decoder.end();
        if (pending) yield pending;
      }
      for await (const chunk of translateClaudeCliStream(
        observedLines(),
        this.options.onWarn,
      )) {
        emitted = true;
        yield chunk;
      }
      const outcome = await handle.done;
      if (outcome.exitCode !== 0 || outcome.signal)
        throw new Error('Claude CLI turn failed');
    } catch (error) {
      const stderr = handle.collected?.stderr?.readFrom(0)?.text ?? '';
      // A refusal is the CLI's own startup complaint on stderr, before any output; never model text.
      const named = signal.aborted || emitted ? undefined : refusedFlag(stderr);
      // Only a flag this run actually passed can have been refused by it.
      const rejected =
        named !== undefined && argv.includes(named)
          ? parts.find((part) => part.flag === named)
          : undefined;
      if (rejected?.optional) {
        // Remembered before the retry, so one flag is refused at most once and the retry cannot loop.
        this.cliRefused.set(installed, new Set([...refused, rejected.flag]));
        retryWithoutFlag = true;
      } else if (rejected)
        throw new Error(
          claudeCliMissingFlagMessage(discovery.version, rejected.flag),
        );
      else if (
        prior &&
        !fresh &&
        !signal.aborted &&
        /(?:no (?:conversation|session) found|(?:session|conversation).*(?:not found|does not exist|missing))/i.test(
          `${outputEvidence} ${stderr}`,
        )
      )
        retryMissing = true;
      else throw mapFetchFailure('Claude CLI', error, watchdog, options.signal);
    } finally {
      clearInterval(keepAlive);
      for (const dialog of dialogs.values()) dialog.abort();
      endStdin();
      watchdog.stop();
      try {
        await handle.terminate();
        await turn.closed;
      } finally {
        this.cliTurns.delete(turn);
        await mcpRun?.close();
      }
    }
    if (retryWithoutFlag) yield* this.runCliAccount(options, loginId, fresh);
    else if (retryMissing) yield* this.runCliAccount(options, loginId, true);
  }

  /** The images attached to the prompt, as the CLI's stream-json image blocks; files already arrive as text with a read-only path. */
  private async promptImages(
    prompt: GenerateOptions['messages'][number],
    signal?: AbortSignal,
  ) {
    if (
      typeof prompt.content === 'string' ||
      !prompt.content.some((part) => part.type === 'image')
    )
      return [];
    const [resolved] = await resolveImages(
      [prompt as unknown as Parameters<typeof resolveImages>[0][number]],
      this.options.resolveAttachments?.(),
      signal,
      CLAUDE_IMAGE_LIMIT,
    );
    return (resolved?.content ?? []).flatMap((part) =>
      part.type === 'image' && 'dataBase64' in part
        ? [
            {
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: part.mediaType,
                data: part.dataBase64,
              },
            },
          ]
        : [],
    );
  }

  private async *streamCore(
    options: GenerateOptions,
    account?: string,
  ): AsyncIterable<StreamChunk> {
    const watchdog = idleWatchdog(
      options.signal,
      this.options.streamIdleTimeoutMs,
    );
    try {
      let session = await this.options.tokens.session(account);
      let response = await this.request(options, session, watchdog.signal);
      if (response.status === 401) {
        session = await this.options.tokens.session(account, true);
        response = await this.request(options, session, watchdog.signal);
      }
      if (!response.ok) {
        const failure = await httpLlmError(response, 'claude API', {
          rateLimitReset: claudeRateLimitReset,
          ...(this.options.onWarn === undefined
            ? {}
            : { onWarn: this.options.onWarn }),
        });
        if (
          response.status === 400 &&
          EXTRA_USAGE_PATTERN.test(failure.message)
        ) {
          if (options.sessionId !== undefined)
            this.options.onExtraUsage?.(String(options.sessionId));
          throw new LlmError(
            EXTRA_USAGE_EXPLANATION,
            EXTRA_USAGE_REQUIRED_CODE,
            {
              status: 400,
            },
          );
        }
        throw failure;
      }
      if (options.sessionId !== undefined)
        this.options.onTurnAccepted?.(String(options.sessionId));
      if (response.body === null) {
        throw new LlmError(
          'claude API returned no response body',
          EMPTY_RESPONSE_CODE,
        );
      }
      yield* streamAnthropic(response.body, () => {
        watchdog.pulse();
      });
    } catch (error: unknown) {
      throw mapFetchFailure('claude API', error, watchdog, options.signal);
    } finally {
      watchdog.stop();
    }
  }

  /**
   * `display: 'summarized'` is set explicitly on both shapes: `adaptive`-type
   * models default to `display: 'omitted'`, which returns thinking blocks with
   * an empty `thinking` field — without this override the "Think" panel would
   * always render empty even though real reasoning (and billed thinking_tokens)
   * ran.
   */
  private thinkingParam(
    thinkingType: 'enabled' | 'adaptive' | undefined,
    maxTokens: number,
  ): Record<string, unknown> | undefined {
    if (thinkingType === 'adaptive')
      return { type: 'adaptive', display: 'summarized' };
    if (thinkingType === 'enabled') {
      const budget = Math.min(
        Math.max(1_024, Math.floor(maxTokens * 0.5)),
        maxTokens - 100,
      );
      if (budget < 1_024) return undefined;
      return { type: 'enabled', budget_tokens: budget, display: 'summarized' };
    }
    return undefined;
  }

  private async request(
    options: GenerateOptions,
    session: ClaudeSession,
    signal: AbortSignal,
  ): Promise<Response> {
    const messages = await resolveImages(
      options.messages,
      this.options.resolveAttachments?.(),
      signal,
      CLAUDE_IMAGE_LIMIT,
    );
    if (hostSupportsImageOffload()) {
      const offloadImages = requiredImageOffloadCount(
        messages,
        CLAUDE_REQUEST_IMAGE_BUDGET,
      );
      if (offloadImages > 0) {
        // Older dsh-llm option types lack `offloadImages`; 0.2+ hosts read it.
        throw new LlmError(
          `claude request images exceed the ${CLAUDE_REQUEST_IMAGE_BUDGET}-byte base64 budget; ` +
            `${offloadImages} more oldest image(s) must be offloaded`,
          IMAGE_OFFLOAD_REQUIRED,
          { offloadImages } as ErrorOptions,
        );
      }
    }
    const disc = await this.discovered(options.model);
    const maxTokens =
      options.maxTokens ??
      claudeMaxTokens(
        this.options.models.find((entry) => entry.id === options.model),
        disc,
      );
    const thinking = this.thinkingParam(disc?.thinkingType, maxTokens);
    const effort =
      options.reasoningEffort !== undefined && disc?.reasoning !== undefined
        ? String(options.reasoningEffort)
        : undefined;
    const cacheTtl =
      this.options.promptCacheTtlOverride?.() ?? this.options.promptCacheTtl;
    const body = claudeRequestBody(
      options,
      messages,
      maxTokens,
      thinking,
      effort,
      cacheTtl,
    );
    const cliVersion = await (
      this.options.resolveCliVersion ?? localClaudeCliVersion
    )();
    return proxiedFetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${session.accessToken}`,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': CLAUDE_BETA_FLAGS,
        'user-agent': claudeCliUserAgent(cliVersion),
        'x-app': 'cli',
        'anthropic-dangerous-direct-browser-access': 'true',
        accept: 'text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });
  }
}
