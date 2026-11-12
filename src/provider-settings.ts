import { readFileSync } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { dshHomePath } from '@deepseek-ai/dsh-home-paths';
import { readableStorePath } from './storage-migration.js';
import { PROVIDER_IDS, type ProviderId } from './auth/store.js';
import { mergeIntent } from './preference-merge.js';

export const PROVIDER_TOOLS = {
  codex: ['image_generate', 'web_search'],
  claude: [],
  grok: ['image_generate', 'video_generate', 'x_search'],
  copilot: [],
  antigravity: [],
} as const;
export type SubscriptionTool =
  | 'image_generate'
  | 'video_generate'
  | 'x_search'
  | 'web_search';
/** Mirrors `PromptCacheTtl` in translate/anthropic.ts; kept here so the client bundle needs no translate import. */
export const PROMPT_CACHE_TTLS = ['5m', '1h'] as const;
export type PromptCacheTtlSetting = (typeof PROMPT_CACHE_TTLS)[number];
export type SubagentSpeedTier = 'standard' | 'fast';
export interface AccountPreferences {
  alias?: string;
  /** Absent means included. */
  poolEnabled?: boolean;
  /** Absent means no separate picker entries. */
  independentEntry?: boolean;
  /** Absent allows every model; [] allows none. */
  poolModels?: string[];
}
export interface ProviderPreferences {
  /** Presentation only; never used as a provider or model routing key. */
  displayName?: string;
  modelDisplayNames?: Record<string, string>;
  accounts?: Record<string, AccountPreferences>;
  /** Absent follows discovery; an explicit selection hides newly discovered models. */
  visibleModels?: string[];
  contextWindows?: Record<string, number>;
  /** Codex only: per-model defaults for subagents, independent of main-session speed. */
  subagentSpeeds?: Record<string, SubagentSpeedTier>;
  tools?: Partial<Record<SubscriptionTool, boolean>>;
  /** Claude only: the access-method-prefixed account key serving new sessions; absent follows the legacy OAuth default. */
  defaultAccount?: string;
  cliMaxConcurrent?: number;
  /** Claude only: overrides the plugin config's `claudePromptCacheTtl`; absent follows config. */
  promptCacheTtl?: PromptCacheTtlSetting;
}
interface ToolRevision {
  at: number;
  provider: ProviderId;
  tools: Partial<Record<SubscriptionTool, boolean>>;
}
interface Document {
  zenEnabled?: boolean;
  providers: Partial<Record<ProviderId, ProviderPreferences>>;
  toolHistory: ToolRevision[];
}

export function validatePreferences(
  provider: ProviderId,
  input: unknown,
): ProviderPreferences {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('settings must be an object');
  const raw = input as Record<string, unknown>;
  const result: ProviderPreferences = {};
  const nameOf = (value: unknown): string => {
    if (
      typeof value !== 'string' ||
      value.trim().length > 80 ||
      /[\u0000-\u001f\u007f]/.test(value)
    ) {
      throw new Error(
        'display name must be a single line of at most 80 characters',
      );
    }
    return value.trim();
  };
  if (raw.displayName !== undefined) {
    const name = nameOf(raw.displayName);
    if (name) result.displayName = name;
  }
  if (raw.modelDisplayNames !== undefined) {
    if (
      !raw.modelDisplayNames ||
      typeof raw.modelDisplayNames !== 'object' ||
      Array.isArray(raw.modelDisplayNames)
    ) {
      throw new Error('modelDisplayNames must be a model-to-name map');
    }
    const names: Record<string, string> = Object.create(null) as Record<
      string,
      string
    >;
    for (const [id, value] of Object.entries(raw.modelDisplayNames)) {
      if (!id.trim()) throw new Error('model display name requires a model id');
      const name = nameOf(value);
      if (name) names[id] = name;
    }
    if (Object.keys(names).length) result.modelDisplayNames = names;
  }
  if (raw.accounts !== undefined) {
    if (
      !raw.accounts ||
      typeof raw.accounts !== 'object' ||
      Array.isArray(raw.accounts)
    )
      throw new Error('accounts must be an account-to-preferences map');
    result.accounts = Object.create(null) as Record<string, AccountPreferences>;
    for (const [key, value] of Object.entries(raw.accounts)) {
      if (
        !key.trim() ||
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value)
      )
        throw new Error('invalid account preferences');
      const account = value as Record<string, unknown>;
      const parsed: AccountPreferences = {};
      if (account.alias !== undefined) {
        if (typeof account.alias !== 'string')
          throw new Error('account alias must be a string');
        parsed.alias = account.alias.trim();
      }
      for (const field of ['poolEnabled', 'independentEntry'] as const) {
        if (account[field] !== undefined) {
          if (typeof account[field] !== 'boolean')
            throw new Error(`${field} must be a boolean`);
          parsed[field] = account[field];
        }
      }
      if (account.poolModels !== undefined) {
        if (
          !Array.isArray(account.poolModels) ||
          account.poolModels.some((id) => typeof id !== 'string' || !id.trim())
        )
          throw new Error('poolModels must be an array of model ids');
        parsed.poolModels = [...new Set(account.poolModels as string[])];
      }
      result.accounts[key] = parsed;
    }
  }
  if (raw.visibleModels !== undefined) {
    if (
      !Array.isArray(raw.visibleModels) ||
      raw.visibleModels.some((id) => typeof id !== 'string' || !id.trim())
    ) {
      throw new Error('visibleModels must be an array of model ids');
    }
    result.visibleModels = [...new Set(raw.visibleModels as string[])];
  }
  if (raw.contextWindows !== undefined) {
    if (provider !== 'codex')
      throw new Error(
        'context window overrides are currently supported only for Codex',
      );
    if (
      !raw.contextWindows ||
      typeof raw.contextWindows !== 'object' ||
      Array.isArray(raw.contextWindows)
    ) {
      throw new Error('contextWindows must be a model-to-token map');
    }
    result.contextWindows = Object.create(null) as Record<string, number>;
    for (const [model, value] of Object.entries(raw.contextWindows)) {
      if (
        !model.trim() ||
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value <= 0
      ) {
        throw new Error('context windows must be positive safe integers');
      }
      result.contextWindows[model] = value;
    }
  }
  for (const key of ['cliMaxConcurrent'] as const) {
    const value = raw[key];
    if (value === undefined) continue;
    if (provider !== 'claude' || typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > 1440)
      throw new Error(`${key} must be a positive integer no greater than 1440 for Claude`);
    result[key] = value;
  }
  if (raw.defaultAccount !== undefined) {
    if (provider !== 'claude')
      throw new Error('defaultAccount is currently supported only for Claude');
    if (typeof raw.defaultAccount !== 'string' || !raw.defaultAccount.trim())
      throw new Error('defaultAccount must be a non-empty account key');
    result.defaultAccount = raw.defaultAccount;
  }
  if (raw.promptCacheTtl !== undefined) {
    if (provider !== 'claude')
      throw new Error('promptCacheTtl is currently supported only for Claude');
    if (
      !(PROMPT_CACHE_TTLS as readonly unknown[]).includes(raw.promptCacheTtl)
    ) {
      throw new Error(
        `promptCacheTtl must be one of ${PROMPT_CACHE_TTLS.join(', ')}`,
      );
    }
    result.promptCacheTtl = raw.promptCacheTtl as PromptCacheTtlSetting;
  }
  if (raw.subagentSpeeds !== undefined) {
    if (provider !== 'codex')
      throw new Error('subagent speeds are currently supported only for Codex');
    if (
      !raw.subagentSpeeds ||
      typeof raw.subagentSpeeds !== 'object' ||
      Array.isArray(raw.subagentSpeeds)
    ) {
      throw new Error('subagent speeds must be a model-to-speed map');
    }
    result.subagentSpeeds = Object.create(null) as Record<
      string,
      SubagentSpeedTier
    >;
    for (const [model, tier] of Object.entries(raw.subagentSpeeds)) {
      if (!model.trim() || (tier !== 'standard' && tier !== 'fast')) {
        throw new Error(
          'subagent speeds require a model id and either "standard" or "fast"',
        );
      }
      result.subagentSpeeds[model] = tier;
    }
  }
  if (raw.tools !== undefined) {
    if (!raw.tools || typeof raw.tools !== 'object' || Array.isArray(raw.tools))
      throw new Error('tools must be an object');
    result.tools = {};
    for (const [tool, enabled] of Object.entries(raw.tools)) {
      if (
        !(PROVIDER_TOOLS[provider] as readonly string[]).includes(tool) ||
        typeof enabled !== 'boolean'
      ) {
        throw new Error(`unsupported tool setting: ${provider}/${tool}`);
      }
      result.tools[tool as SubscriptionTool] = enabled;
    }
  }
  return result;
}

/** Durable user preferences, independent of expiring discovery caches. */
export class ProviderSettingsStore {
  private current: Document = { providers: {}, toolHistory: [] };
  private writes: Promise<void> = Promise.resolve();
  readonly path: string;

  constructor(
    path = dshHomePath(
      'plugins',
      'waycraft',
      'subscriptions',
      'provider-settings.json',
    ),
  ) {
    this.path = path;
    try {
      const raw = JSON.parse(
        readFileSync(readableStorePath(path), 'utf8'),
      ) as Document;
      if (!raw.providers || !Array.isArray(raw.toolHistory))
        throw new Error('invalid settings document');
      if (raw.zenEnabled !== undefined && typeof raw.zenEnabled !== 'boolean')
        throw new Error('invalid Zen enablement');
      this.current.zenEnabled = raw.zenEnabled;
      for (const provider of PROVIDER_IDS) {
        if (Object.hasOwn(raw.providers, provider))
          this.current.providers[provider] = validatePreferences(
            provider,
            raw.providers[provider],
          );
      }
      this.current.toolHistory = raw.toolHistory
        .map((revision) => {
          if (
            !PROVIDER_IDS.includes(revision.provider) ||
            !Number.isSafeInteger(revision.at) ||
            revision.at < 0
          )
            throw new Error('invalid tool history');
          const tools =
            validatePreferences(revision.provider, { tools: revision.tools })
              .tools ?? {};
          return { at: revision.at, provider: revision.provider, tools };
        })
        .sort((a, b) => a.at - b.at);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw new Error(`Cannot read provider settings at ${path}`, {
          cause: error,
        });
    }
  }

  zenEnabled(): boolean {
    return this.current.zenEnabled !== false;
  }

  async setZenEnabled(enabled: boolean): Promise<void> {
    if (typeof enabled !== 'boolean') throw new Error('invalid Zen enablement');
    const run = this.writes.then(async () => {
      const next = structuredClone(this.current);
      next.zenEnabled = enabled;
      await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
      const temporary = `${this.path}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(next, null, 2), {
          mode: 0o600,
        });
        await rename(temporary, this.path);
      } finally {
        await rm(temporary, { force: true });
      }
      this.current = next;
    });
    // Safe: `writes` only orders the next write; the caller still receives `run` and its error.
    this.writes = run.catch(() => {});
    return run;
  }

  get(provider: ProviderId): ProviderPreferences {
    return structuredClone(this.current.providers[provider] ?? {});
  }

  visible(provider: ProviderId, model: string): boolean {
    return (
      this.current.providers[provider]?.visibleModels?.includes(model) ?? true
    );
  }

  modelName(provider: ProviderId, model: string, fallback: string): string {
    const names = this.current.providers[provider]?.modelDisplayNames;
    return names && Object.hasOwn(names, model) ? names[model] : fallback;
  }

  contextWindow(model: string): number | undefined {
    const windows = this.current.providers.codex?.contextWindows;
    return windows && Object.hasOwn(windows, model)
      ? windows[model]
      : undefined;
  }

  /** Read on every request so saved changes apply to the next subagent request. */
  subagentSpeed(model: string): SubagentSpeedTier {
    const speeds = this.current.providers.codex?.subagentSpeeds;
    return speeds && Object.hasOwn(speeds, model) ? speeds[model] : 'standard';
  }

  /** The Settings-page Claude cache TTL; undefined follows the plugin config. Read per request, so no clone. */
  promptCacheTtl(): PromptCacheTtlSetting | undefined {
    return this.current.providers.claude?.promptCacheTtl;
  }

  /** Creation-time policy survives restarts and never changes an existing session. */
  toolEnabled(
    provider: ProviderId,
    tool: SubscriptionTool,
    createdAt = Date.now(),
  ): boolean {
    let enabled = true;
    for (const revision of this.current.toolHistory) {
      if (revision.at > createdAt) break;
      if (revision.provider === provider)
        enabled = revision.tools[tool] !== false;
    }
    return enabled;
  }

  /** Replace the provider's whole preferences (legacy full-document save). */
  async set(provider: ProviderId, input: unknown): Promise<void> {
    const preferences = validatePreferences(provider, input);
    return this.commit(provider, () => preferences);
  }

  /**
   * Atomic field-level update: applies the editor's intent (`draft` against `original`, both as the
   * client loaded them) to the preferences current at write time, inside the serialized write chain.
   * Fields the editor did not change keep whatever a concurrent writer saved (account alias vs pool
   * selection vs model names vs tool switches); two edits of the very same field resolve last-writer-wins.
   */
  async update(
    provider: ProviderId,
    original: unknown,
    draft: unknown,
  ): Promise<void> {
    const before = validatePreferences(provider, original);
    const after = validatePreferences(provider, draft);
    return this.commit(provider, (latest) =>
      validatePreferences(provider, mergeIntent(latest, before, after)),
    );
  }

  private commit(
    provider: ProviderId,
    compute: (latest: ProviderPreferences) => ProviderPreferences,
  ): Promise<void> {
    const run = this.writes.then(async () => {
      const next = structuredClone(this.current);
      const before = next.providers[provider]?.tools ?? {};
      const preferences = compute(
        structuredClone(next.providers[provider] ?? {}),
      );
      next.providers[provider] = preferences;
      if (
        PROVIDER_TOOLS[provider].some(
          (tool) =>
            (before[tool] !== false) !== (preferences.tools?.[tool] !== false),
        )
      ) {
        next.toolHistory.push({
          at: Date.now(),
          provider,
          tools: preferences.tools ?? {},
        });
      }
      await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
      const temporary = `${this.path}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(next, null, 2), {
          mode: 0o600,
        });
        await rename(temporary, this.path);
      } finally {
        await rm(temporary, { force: true });
      }
      this.current = next;
    });
    // Safe: `writes` only orders the next write; the caller still receives `run` and its error.
    this.writes = run.catch(() => undefined);
    return run;
  }
}
