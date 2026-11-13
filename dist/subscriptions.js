import { readFileSync } from 'node:fs';
import { RpcFailure, rpcErrorKind } from './rpc-errors.js';
import { VIDEO_FILE_ROUTE, openVideoFile, readVideoFile, streamVideoFile, } from './video-file.js';
import { fileURLToPath } from 'node:url';
import { LEGACY_RPC_PREFIX } from './legacy-names.js';
import { ZenAdapter } from './providers/zen.js';
import { AntigravityAuthController } from './auth/antigravity-controller.js';
import { AntigravityAdapter, ANTIGRAVITY_SETUP_REQUIRED, ANTIGRAVITY_PREEMPT_MS, refreshAntigravity, isAntigravityPermanentRefreshError, fetchAntigravityUsage, resolveAntigravityOAuthConfig, } from './providers/antigravity.js';
import { DeviceFlowManager } from './auth/device-flow.js';
import { CopilotAuthController } from './auth/copilot-controller.js';
import { CopilotAdapter, COPILOT_PREEMPT_MS, refreshCopilot, isCopilotPermanentRefreshError, } from './providers/copilot.js';
import z from '@deepseek-ai/schemastery';
import { OAuthFlowManager } from './auth/oauth-flow.js';
import { CodexAuthController } from './auth/controller.js';
import { AccountTokenManager } from './providers/accounts.js';
import { CodexAdapter, CODEX_PREEMPT_MS, CODEX_CLIENT_VERSION, refreshCodex, isCodexPermanentRefreshError, fetchCodexUsage, fetchCodexResetCredits, consumeCodexResetCredit, } from './providers/codex.js';
import { CodexClientVersionCache } from './providers/codex-client-version.js';
import { catalogStore, accountCatalogStore, } from './providers/catalog-store.js';
import { startCatalogRefresh } from './providers/catalog-refresh.js';
import { PoolAdapter } from './providers/pool.js';
import { PoolHealthRegistry } from './providers/pool-health.js';
import { PoolUsageTracker } from './providers/pool-usage.js';
import { buildAccountPools, poolKey, } from './providers/pool-family.js';
import { ResetRedemption } from './providers/reset-redemption.js';
import { proxiedFetch, proxyGetConfig, proxySetConfig, proxyTestConnection, safeDiagnostic, disposeProxyTransport, } from './http.js';
import { DISCOVERY_TIMEOUT_MS, OAuthEndpointError, deadlineSignal, withTimeout, } from './providers/common.js';
import { ProviderSettingsStore, PROVIDER_TOOLS, validatePreferences, } from './provider-settings.js';
import { defaultEffortOf, loadModelDefaults, setDefaultEffort, } from './model-defaults.js';
import { ImageAccountPool } from './providers/image-pool.js';
import { CodexWebSearchProvider } from './providers/codex-search.js';
import { createImageGenerateTool } from './tools/image-generate.js';
import { registerWithAlias } from './tools/registration.js';
import { subscriptionAccountKey } from './providers/account-kind.js';
import { AccountPreferencesAdapter, accountAllowsPool, accountModelId, parseAccountModelId, } from './providers/account-preferences.js';
import { planReviewTextFor } from './auth/claude-cli-plan-text.js';
import { CLAUDE_CAPABILITIES } from './provider-capabilities.js';
import { ClaudeCliLogin, discoverClaudeCli, } from './auth/claude-cli.js';
import { ClaudeAuthController, } from './auth/claude-controller.js';
import { readClaudeCodeCredentials, recordClaudeEmail, refreshClaudeSynced, SYSTEM_CLAUDE_CREDS_IO, } from './auth/claude-code-creds.js';
import { ClaudeAdapter, CLAUDE_PREEMPT_MS, fetchClaudeProfile, fetchClaudeUsage, isClaudePermanentRefreshError, refreshClaude, } from './providers/claude.js';
import { ClaudeCliVersionCache } from './providers/claude-cli-version.js';
import { DEFAULT_PROMPT_CACHE_TTL, } from './translate/anthropic.js';
import { GrokAuthController } from './auth/grok-controller.js';
import { GrokAdapter, GROK_PREEMPT_MS, refreshGrok, isGrokPermanentRefreshError, fetchGrokUsage, } from './providers/grok.js';
import { createVideoGenerateTool } from './tools/video-generate.js';
import { createXSearchTool } from './tools/x-search.js';
import { presentedVersion } from './providers/npm-cli-version.js';
/** Plugin version from the shipped package.json (the status RPC reports it); `unknown` if unreadable. */
const PLUGIN_VERSION = (() => {
    try {
        const parsed = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'));
        return parsed.version ?? 'unknown';
    }
    catch {
        return 'unknown';
    }
})();
export const name = 'dsh-waycraft/subscriptions';
export const inject = ['llm'];
/** Bound on one account's catalog read while assembling pools: a hung account sits out instead of failing the pool. */
export const POOL_USAGE_TIMEOUT_MS = DISCOVERY_TIMEOUT_MS;
/**
 * Reference index.ts `claude background sync timer`: keychain-bound Claude accounts re-read Claude Code's own store
 * every five minutes, so a token rotated by the `claude` CLI is picked up before the next turn needs it.
 */
export const CLAUDE_KEYCHAIN_SYNC_MS = 5 * 60_000;
// Same-named schemastery schema, as in the reference (index.ts `Config`). Only the Codex slice is owned here;
// `@deepseek-ai/schemastery` is the host's public schema package (peer in the reference), no host patch involved.
const modelEntrySchema = z.object({
    id: z.string().required(),
    name: z.string(),
    contextWindow: z.number().step(1).min(1),
    maxTokens: z.number().step(1).min(1),
    inputModalities: z.array(z.union(['text', 'image'])),
    wire: z.union(['chat-completions', 'responses']),
});
const poolMemberSchema = z.object({
    provider: z
        .union(['codex', 'claude', 'grok', 'copilot', 'antigravity'])
        .required(),
    account: z.string(),
    model: z.string().required(),
});
export const Config = z.object({
    antigravity: z.object({
        clientId: z.string(),
        clientSecret: z.string(),
        baseURL: z.string(),
        userAgent: z.string(),
        onboard: z.boolean(),
    }),
    codexClientVersion: z.string(),
    // Reference `claudePromptCacheTtl`: the plugin-wide default cache lifetime; the Settings choice overrides it per save.
    claudePromptCacheTtl: z.union(['5m', '1h']).default(DEFAULT_PROMPT_CACHE_TTL),
    models: z.object({
        codex: z.array(modelEntrySchema),
        claude: z.array(modelEntrySchema),
        grok: z.array(modelEntrySchema),
        copilot: z.array(modelEntrySchema),
        antigravity: z.array(modelEntrySchema),
    }),
    pool: z.object({
        enabled: z.boolean().default(true),
        strategy: z.union(['priority', 'quota_aware']).default('quota_aware'),
        switchMargin: z.number().min(1).default(2),
        autoAccounts: z.boolean().default(true),
        autoFamilies: z.boolean(),
        families: z.dict(z.array(poolMemberSchema)),
        tiers: z.dict(z.array(poolMemberSchema)),
    }),
});
/** Reference `readSpeedTier`. */
function readSpeedTier(payload) {
    if (payload.tier !== 'standard' && payload.tier !== 'fast')
        throw new Error('payload.tier must be "standard" or "fast"');
    return payload.tier;
}
/** Reference `readForce`: the optional `force` flag must be a boolean when present. */
function readForce(payload) {
    const force = payload.force;
    if (force === undefined)
        return false;
    if (typeof force !== 'boolean')
        throw new Error('payload.force must be a boolean when present');
    return force;
}
/** Reference `readProxyTestPayload`, plus the draft fields the owned dialog sends (`enabled`, `bypass`, `password: null`). */
function readProxyTestPayload(payload) {
    const { url, proxy } = payload;
    if (url === undefined && proxy === undefined)
        return {};
    if (url !== undefined && (typeof url !== 'string' || url.length === 0))
        throw new Error('payload.url must be a non-empty string when present');
    let draft;
    if (proxy !== undefined) {
        if (typeof proxy !== 'object' || proxy === null || Array.isArray(proxy))
            throw new Error('payload.proxy must be an object when present');
        const record = proxy;
        if (typeof record.url !== 'string' || record.url.length === 0)
            throw new Error('payload.proxy.url must be a non-empty string');
        if (record.username !== undefined && typeof record.username !== 'string')
            throw new Error('payload.proxy.username must be a string when present');
        if (record.password !== undefined &&
            record.password !== null &&
            typeof record.password !== 'string')
            throw new Error('payload.proxy.password must be a string or null when present');
        if (record.enabled !== undefined && typeof record.enabled !== 'boolean')
            throw new Error('payload.proxy.enabled must be a boolean when present');
        if (record.bypass !== undefined &&
            (!Array.isArray(record.bypass) ||
                record.bypass.some((item) => typeof item !== 'string')))
            throw new Error('payload.proxy.bypass must be an array of strings when present');
        draft = {
            url: record.url,
            ...(record.username === undefined
                ? {}
                : { username: record.username }),
            ...(record.password === undefined
                ? {}
                : { password: record.password }),
            ...(record.enabled === undefined
                ? {}
                : { enabled: record.enabled }),
            ...(record.bypass === undefined
                ? {}
                : { bypass: record.bypass }),
        };
    }
    return {
        ...(url === undefined ? {} : { url: url }),
        ...(draft === undefined ? {} : { proxy: draft }),
    };
}
/**
 * Text for an error that is shown in the browser. An upstream HTTP error body is untrusted free text whose
 * secrets cannot be recognised, so only its status survives; every other failure goes through the bounded
 * structural sanitizer (known proxy credentials plus recognisable secret shapes; see docs/ai/ticket-130-verification.md for limits).
 */
function browserSafeError(error, label) {
    if (error instanceof OAuthEndpointError) {
        // The provider's error code is kept only when it looks like a code (never free text).
        const code = error.oauthCode !== undefined &&
            /^[A-Za-z0-9_.:-]{1,64}$/.test(error.oauthCode)
            ? `: ${error.oauthCode}`
            : '';
        return `${label} endpoint error (HTTP ${String(error.status)})${code}`;
    }
    return safeDiagnostic(error);
}
/** The provider a route serves: Codex unless the payload names Claude. Any other value is rejected. */
function readRouteProvider(value) {
    if (value === undefined || value === 'codex')
        return 'codex';
    if (value === 'claude' ||
        value === 'grok' ||
        value === 'copilot' ||
        value === 'antigravity')
        return value;
    throw new Error('payload.provider must be one of codex, claude, grok, copilot, antigravity');
}
/** Reference `readLoginMethod`: `method` selects the Claude login route and is valid for Claude only. */
function readLoginMethod(payload, provider) {
    const method = payload.method;
    if (method === undefined)
        return undefined;
    if (provider !== 'claude')
        throw new Error('payload.method is only valid for claude');
    if (method !== 'oauth' && method !== 'keychain' && method !== 'official-cli')
        throw new Error('payload.method must be "oauth", "keychain" or "official-cli"');
    return method;
}
/** Endpoints that serve Claude; every other endpoint (speed, reset, proxy, image, video) stays Codex-only. */
const CLAUDE_ENDPOINTS = new Set([
    'extraUsageNotice',
    'cliDiscover',
    'cliInput',
    'cliRead',
    'cliCancel',
    'status',
    'login',
    'manual',
    'cancel',
    'logout',
    'setDefault',
    'usage',
    'providerSettings',
    'setProviderSettings',
    'modelDefaults',
    'setModelDefault',
]);
export function apply(ctx, config = {}, options = {}) {
    const preferences = new ProviderSettingsStore();
    const zen = new ZenAdapter(() => preferences.zenEnabled());
    let zenRegistrationError = false;
    try {
        ctx.llm.registerAdapter(['opencode-zen'], zen);
    }
    catch {
        zenRegistrationError = true;
    }
    ctx.effect(() => () => zen.dispose(), 'dsh-waycraft: zen disposal');
    const claudeCredsIo = options.claudeCredsIo ?? SYSTEM_CLAUDE_CREDS_IO;
    const claudeIdentity = {
        profile: options.claudeProfile ?? fetchClaudeProfile,
    };
    void loadModelDefaults().catch(() => ctx.logger.warn('dsh-waycraft: model defaults unavailable'));
    const flows = new OAuthFlowManager();
    const version = new CodexClientVersionCache();
    const health = new PoolHealthRegistry();
    const imagePool = new ImageAccountPool({
        enabled: config.pool?.enabled !== false &&
            (config.pool?.autoAccounts ?? config.pool?.autoFamilies ?? true),
        onWarn: (message) => ctx.logger.warn(`dsh-waycraft: ${message}`),
    });
    let handle;
    // The raw registration error stays server-side; the browser gets `collisionText()`, built after the stored proxy
    // credential has loaded so safeDiagnostic can redact it. `collision` is only the presence flag.
    let collision;
    let collisionError;
    let claudeCollision;
    let claudeCollisionError;
    let disposed = false;
    const ownAlias = (provider, key) => {
        const settings = preferences.get(provider).accounts;
        return settings && Object.hasOwn(settings, key)
            ? settings[key]?.alias
            : undefined;
    };
    /** The registration handle serving one provider; Codex and Claude register separately (ADR-0002). */
    const handleFor = (provider) => provider === 'antigravity'
        ? antigravityHandle
        : provider === 'grok'
            ? grokHandle
            : provider === 'copilot'
                ? copilotHandle
                : provider === 'claude'
                    ? claudeHandle
                    : handle;
    /** Providers whose settings read lists their own models next to the pool tiers (one implementation, data-driven). */
    const OWN_CATALOG_PROVIDERS = {
        antigravity: {
            get adapter() {
                return antigravityAdapter;
            },
            get tokens() {
                return antigravityTokens;
            },
            handle: () => antigravityHandle,
        },
        copilot: {
            get adapter() {
                return copilotAdapter;
            },
            get tokens() {
                return copilotTokens;
            },
            handle: () => copilotHandle,
        },
    };
    // Composer Speed (reference src/index.ts speedBySession/selectedSpeed). Explicit choices are
    // per session and reset on restart. A subagent without an explicit choice uses its saved model default, and
    // every request still gates Fast on the model's discovered capability.
    const speedBySession = new Map();
    const SPEED_SESSIONS_MAX = 256;
    const selectedSpeed = (sessionId, model) => {
        const explicit = speedBySession.get(sessionId);
        if (explicit !== undefined)
            return explicit;
        const registry = ctx.get('agents');
        if (model !== undefined &&
            registry?.get(sessionId)?.session.header.origin === 'subagent')
            return preferences.subagentSpeed(parseAccountModelId(model)?.model ?? model);
        return 'standard';
    };
    const collisionText = async () => {
        await proxyGetConfig().catch(() => undefined); // loads the stored proxy credential so it can be redacted
        return browserSafeError(collisionError, 'codex registration');
    };
    let pool;
    let adapter;
    let claudeHandle;
    const changed = (account) => {
        if (disposed)
            return;
        adapter?.clearAccountCatalog(account);
        health.clear('codex', account);
        imagePool.clear('codex', account);
        usage.invalidate('codex', account);
        pool?.invalidate();
        handle?.replace(['codex']);
    };
    const tokens = new AccountTokenManager({
        provider: 'codex',
        displayName: 'ChatGPT (Codex)',
        makeOptions: () => ({
            preemptMs: CODEX_PREEMPT_MS,
            refresh: refreshCodex,
            isPermanent: isCodexPermanentRefreshError,
        }),
        onAccountRemoved: changed,
    });
    const readUsage = async (account, signal) => {
        const session = await tokens.session(account);
        const snapshot = await fetchCodexUsage(session, proxiedFetch, signal);
        try {
            return {
                ...snapshot,
                resetCredits: await fetchCodexResetCredits(session, proxiedFetch, signal),
            };
        }
        catch (error) {
            return {
                ...snapshot,
                resetCreditsError: browserSafeError(error, 'codex reset credits'),
            };
        }
    };
    // Claude (reference v0.9.12 `case 'claude'`): its own token manager, catalog, client version, and cache lifetime.
    const claudeLifecycle = new AbortController();
    const claudeVersion = new ClaudeCliVersionCache();
    const presentClaudeVersion = presentedVersion(claudeVersion);
    const claudeChanged = (account) => {
        if (!disposed) {
            claudeAdapter.clearAccountCatalog(account);
            health.clear('claude', account);
            usage.invalidate('claude', account);
            pool?.invalidate();
            claudeHandle?.replace(['claude']);
        }
    };
    const claudeTokens = new AccountTokenManager({
        provider: 'claude',
        displayName: 'Claude (Subscription)',
        makeOptions: () => ({
            preemptMs: CLAUDE_PREEMPT_MS,
            // Only keychain-imported accounts sync with Claude Code's own store; OAuth accounts refresh standalone so
            // several accounts never fight over the Keychain entry (reference index.ts).
            // The lifecycle signal stops a refresh that outlives disposal: no token request, no store read or write-back,
            // and the final check below keeps a late result from reaching the TokenManager save.
            refresh: async (session) => {
                const lifecycle = claudeLifecycle.signal;
                lifecycle.throwIfAborted();
                const next = session.keychainBound === true
                    ? await refreshClaudeSynced(session, (bound) => refreshClaude(bound, lifecycle), claudeCredsIo, lifecycle, claudeIdentity)
                    : await refreshClaude(session, lifecycle);
                lifecycle.throwIfAborted();
                return next;
            },
            isPermanent: isClaudePermanentRefreshError,
        }),
        onAccountRemoved: claudeChanged,
    });
    let grokHandle;
    let grokCollision;
    const grokChanged = (account) => {
        if (!disposed) {
            grokAdapter.clearAccountCatalog(account);
            health.clear('grok', account);
            imagePool.clear('grok', account);
            usage.invalidate('grok', account);
            pool?.invalidate();
            grokHandle?.replace(['grok']);
        }
    };
    const grokTokens = new AccountTokenManager({
        provider: 'grok',
        displayName: 'Grok',
        makeOptions: () => ({
            preemptMs: GROK_PREEMPT_MS,
            refresh: refreshGrok,
            isPermanent: isGrokPermanentRefreshError,
        }),
        onAccountRemoved: grokChanged,
    });
    const grokAuth = new GrokAuthController(flows, grokChanged, (error) => browserSafeError(error, 'grok login'));
    const grokAdapter = new GrokAdapter({
        tokens: grokTokens,
        models: config.models?.grok ?? [{ id: 'grok-4', name: 'Grok 4' }],
        discovery: !config.models?.grok?.length,
        streamIdleTimeoutMs: 300_000,
        pool: () => pool,
        defaultEffortOf: (model) => defaultEffortOf('grok', model),
        resolveAttachments: () => ctx.get('attachments'),
        catalogStore: catalogStore('grok'),
        accountCatalogStore: (account) => accountCatalogStore('grok', account),
        onCatalogChanged: () => {
            if (!disposed) {
                pool?.invalidate();
                grokHandle?.replace(['grok']);
            }
        },
        onWarn: (message) => ctx.logger.warn(`dsh-waycraft: ${message}`),
    });
    const antigravityLifecycle = new AbortController();
    const antigravityOAuth = resolveAntigravityOAuthConfig(config.antigravity);
    let antigravityHandle;
    let antigravityCollision = false;
    const antigravityChanged = (account) => {
        if (!disposed) {
            antigravityAdapter.clearAccountCatalog(account);
            health.clear('antigravity', account);
            usage.invalidate('antigravity', account);
            pool?.invalidate();
            antigravityHandle?.replace(['antigravity']);
        }
    };
    const antigravityTokens = new AccountTokenManager({
        provider: 'antigravity',
        displayName: 'Google Antigravity',
        makeOptions: () => ({
            preemptMs: ANTIGRAVITY_PREEMPT_MS,
            refresh: async (session) => {
                const next = await withTimeout((signal) => refreshAntigravity(session, antigravityOAuth, undefined, signal), DISCOVERY_TIMEOUT_MS, antigravityLifecycle.signal);
                antigravityLifecycle.signal.throwIfAborted();
                if (!next)
                    throw new Error('Antigravity refresh timed out');
                return next;
            },
            isPermanent: isAntigravityPermanentRefreshError,
        }),
        onAccountRemoved: antigravityChanged,
    });
    // Guard before TokenManager can refresh or classify/delete a stored session.
    const antigravitySession = antigravityTokens.session.bind(antigravityTokens);
    antigravityTokens.session = async (...args) => {
        if (!antigravityOAuth)
            throw new Error(ANTIGRAVITY_SETUP_REQUIRED);
        return antigravitySession(...args);
    };
    const antigravityAuth = new AntigravityAuthController(flows, antigravityOAuth, config.antigravity ?? {}, antigravityChanged, (error) => browserSafeError(error, 'antigravity login'));
    const antigravityAdapter = new AntigravityAdapter({
        tokens: antigravityTokens,
        setupRequired: !antigravityOAuth,
        models: config.models?.antigravity ?? [
            { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
        ],
        runtime: config.antigravity,
        discovery: !config.models?.antigravity?.length,
        streamIdleTimeoutMs: 300_000,
        pool: () => pool,
        catalogStore: catalogStore('antigravity'),
        accountCatalogStore: (account) => accountCatalogStore('antigravity', account),
        defaultEffortOf: (model) => defaultEffortOf('antigravity', model),
        resolveAttachments: () => ctx.get('attachments'),
        onCatalogChanged: () => {
            if (!disposed) {
                pool?.invalidate();
                antigravityHandle?.replace(['antigravity']);
            }
        },
        onWarn: (message) => ctx.logger.warn(`dsh-waycraft: ${message}`),
    });
    const usage = new PoolUsageTracker((provider, account) => provider === 'codex'
        ? () => readUsage(account, AbortSignal.timeout(20_000))
        : provider === 'antigravity'
            ? async () => {
                const result = await withTimeout(async (signal) => fetchAntigravityUsage(await antigravityTokens.session(account), config.antigravity, proxiedFetch, signal), DISCOVERY_TIMEOUT_MS, antigravityLifecycle.signal);
                if (!result)
                    throw new Error('Antigravity usage timed out');
                return result;
            }
            : provider === 'claude'
                ? async () => fetchClaudeUsage(await claudeTokens.session(account), proxiedFetch, AbortSignal.timeout(20_000), () => claudeVersion.resolve())
                : provider === 'grok'
                    ? async () => fetchGrokUsage(await grokTokens.session(account), proxiedFetch, AbortSignal.timeout(20_000))
                    : undefined);
    const auth = new CodexAuthController(flows, changed, (error) => browserSafeError(error, 'codex login'));
    const claudeCliLogin = new ClaudeCliLogin();
    // `subprocess` is optional: a composition without it keeps every other provider working, and only Official CLI
    // operations report that the service is missing.
    const cliRuntime = () => {
        const runtime = ctx.get('subprocess');
        if (!runtime)
            throw new Error('Official CLI requires the DSH subprocess service, which is not available in this composition');
        return runtime;
    };
    // What the account card shows about the installed CLI: its version against the provider minimum. A short cache
    // keeps repeated status reads from starting a process each time; any failure just means nothing is shown.
    const CLI_STATUS_TTL_MS = 30_000;
    let claudeCliProbe;
    const claudeCliStatus = () => {
        if (claudeCliProbe && Date.now() - claudeCliProbe.at < CLI_STATUS_TTL_MS)
            return claudeCliProbe.value;
        const { minimumVersion, updateCommand, source } = CLAUDE_CAPABILITIES.cli;
        const value = (async () => {
            const found = await discoverClaudeCli(cliRuntime());
            return found.version
                ? {
                    version: found.version,
                    minimumVersion,
                    updateRequired: found.updateRequired === true,
                    updateCommand,
                    source,
                }
                : undefined;
        })().catch(() => undefined);
        claudeCliProbe = { at: Date.now(), value };
        return value;
    };
    const claudeAuth = new ClaudeAuthController(flows, claudeChanged, (error) => browserSafeError(error, 'claude login'), () => readClaudeCodeCredentials(claudeCredsIo), (session) => recordClaudeEmail(session, claudeIdentity, claudeLifecycle.signal));
    const resets = new ResetRedemption(readUsage, async (account, credit, request, signal) => consumeCodexResetCredit(await tokens.session(account), credit, request, proxiedFetch, signal), (account) => usage.invalidate('codex', account));
    adapter = new CodexAdapter({
        tokens,
        models: config.models?.codex ?? [
            { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex' },
            { id: 'gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini' },
            { id: 'gpt-5.1', name: 'GPT-5.1' },
        ],
        streamIdleTimeoutMs: 300_000,
        discovery: !config.models?.codex?.length,
        defaultEffortOf: (model) => defaultEffortOf('codex', model),
        contextWindowOf: (model) => preferences.contextWindow(model),
        speedFor: async (sessionId, model) => sessionId !== undefined &&
            selectedSpeed(sessionId, model) === 'fast' &&
            (await adapter.supportsFastTier(model)),
        clientVersion: config.codexClientVersion,
        resolveClientVersion: () => version.resolve(),
        catalogStore: catalogStore('codex'),
        accountCatalogStore: (account) => accountCatalogStore('codex', account),
        onCatalogChanged: () => {
            if (!disposed) {
                pool?.invalidate();
                handle?.replace(['codex']);
            }
        },
        resolveAttachments: () => ctx.get('attachments'),
        pool: () => pool,
        onWarn: (message) => ctx.logger.warn(`dsh-waycraft: ${message}`),
    });
    // Claude adapter (reference v0.9.12 `case 'claude'`). Registered under the shared provider id `claude` (ADR-0002);
    // a reference Claude registration already present makes this one fail, and the component reports it.
    const claudeModels = config.models?.claude?.length
        ? config.models.claude
        : [
            {
                id: 'claude-opus-5-5',
                name: 'Claude Opus 5.5',
                maxTokens: 128_000,
                contextWindow: 1_000_000,
            },
            {
                id: 'claude-opus-5',
                name: 'Claude Opus 5',
                maxTokens: 128_000,
                contextWindow: 1_000_000,
            },
            {
                id: 'claude-sonnet-5',
                name: 'Claude Sonnet 5',
                maxTokens: 128_000,
                contextWindow: 1_000_000,
            },
            {
                id: 'claude-fable-5',
                name: 'Claude Fable 5',
                maxTokens: 128_000,
                contextWindow: 1_000_000,
            },
            {
                id: 'claude-haiku-4-5-20251001',
                name: 'Claude Haiku 4.5',
                maxTokens: 64_000,
            },
        ];
    const extraUsageSessions = new Map();
    let extraUsageRevision = 0;
    const claudeAdapter = new ClaudeAdapter({
        onExtraUsage: (sessionId) => {
            // Re-insert to retain recency; a revision distinguishes consecutive refusals after dismissal.
            extraUsageSessions.delete(sessionId);
            extraUsageSessions.set(sessionId, ++extraUsageRevision);
            while (extraUsageSessions.size > SPEED_SESSIONS_MAX) {
                const oldest = extraUsageSessions.keys().next().value;
                if (oldest === undefined)
                    break;
                extraUsageSessions.delete(oldest);
            }
        },
        onTurnAccepted: (sessionId) => {
            extraUsageSessions.delete(sessionId);
        },
        tokens: claudeTokens,
        cliRuntime,
        // Optional services: a composition without one still runs turns, and the CLI is told nobody could be asked.
        cliTools: () => ctx.get('tools'),
        cliServices: (sessionId) => ({
            approval: ctx.get('approval'),
            userQuestions: ctx.get('userQuestions'),
            agent: sessionId === undefined
                ? undefined
                : ctx.get('agents')?.get(sessionId),
            planReviewText: planReviewTextFor(ctx.get('settings')),
        }),
        cliSettings: () => preferences.get('claude'),
        models: claudeModels,
        streamIdleTimeoutMs: 300_000,
        discovery: !config.models?.claude?.length,
        defaultEffortOf: (model) => defaultEffortOf('claude', model),
        resolveCliVersion: () => claudeVersion.resolve(),
        catalogStore: catalogStore('claude'),
        accountCatalogStore: (account) => accountCatalogStore('claude', account),
        onCatalogChanged: () => {
            if (!disposed) {
                pool?.invalidate();
                claudeHandle?.replace(['claude']);
            }
        },
        resolveAttachments: () => ctx.get('attachments'),
        pool: () => pool,
        promptCacheTtl: config.claudePromptCacheTtl ?? DEFAULT_PROMPT_CACHE_TTL,
        promptCacheTtlOverride: () => preferences.promptCacheTtl(),
        onWarn: (message) => ctx.logger.warn(`dsh-waycraft: ${message}`),
    });
    let copilotHandle;
    let copilotCollision = false;
    const copilotChanged = (account) => {
        if (!disposed) {
            copilotAdapter.clearAccountCatalog(account);
            copilotAdapter.clearReplayState();
            health.clear('copilot', account);
            usage.invalidate('copilot', account);
            pool?.invalidate();
            copilotHandle?.replace(['copilot']);
        }
    };
    const copilotTokens = new AccountTokenManager({
        provider: 'copilot',
        displayName: 'GitHub Copilot',
        makeOptions: () => ({
            preemptMs: COPILOT_PREEMPT_MS,
            refresh: refreshCopilot,
            isPermanent: isCopilotPermanentRefreshError,
        }),
        onAccountRemoved: copilotChanged,
    });
    const copilotAuth = new CopilotAuthController(new DeviceFlowManager(), copilotChanged, (error) => browserSafeError(error, 'copilot login'));
    const copilotAdapter = new CopilotAdapter({
        tokens: copilotTokens,
        models: config.models?.copilot ?? [
            { id: 'gpt-4.1', name: 'GPT-4.1', inputModalities: ['text', 'image'] },
            { id: 'gpt-4o', name: 'GPT-4o', inputModalities: ['text', 'image'] },
            {
                id: 'claude-sonnet-4.5',
                name: 'Claude Sonnet 4.5',
                inputModalities: ['text', 'image'],
            },
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                inputModalities: ['text', 'image'],
            },
        ],
        discovery: !config.models?.copilot?.length,
        streamIdleTimeoutMs: 300_000,
        pool: () => pool,
        catalogStore: catalogStore('copilot'),
        accountCatalogStore: (account) => accountCatalogStore('copilot', account),
        defaultEffortOf: (model) => defaultEffortOf('copilot', model),
        resolveAttachments: () => ctx.get('attachments'),
        onCatalogChanged: () => {
            if (!disposed) {
                pool?.invalidate();
                copilotHandle?.replace(['copilot']);
            }
        },
        onWarn: (message) => ctx.logger.warn(`dsh-waycraft: ${message}`),
    });
    const presentedCopilot = new AccountPreferencesAdapter({
        provider: 'copilot',
        adapter: copilotAdapter,
        settings: preferences,
        accounts: async () => (await copilotTokens.list()).map(({ key, session }) => ({
            key,
            label: session.account ?? key,
        })),
        pool: () => pool,
    });
    const presented = new AccountPreferencesAdapter({
        provider: 'codex',
        adapter,
        settings: preferences,
        accounts: async () => (await tokens.list()).map(({ key, session }) => ({
            key,
            label: session.emailAddress ?? key,
        })),
        pool: () => pool,
    });
    const presentedClaude = new AccountPreferencesAdapter({
        provider: 'claude',
        adapter: claudeAdapter,
        settings: preferences,
        accounts: async () => {
            const direct = (await claudeTokens.list()).map(({ key, session }) => ({
                accessMethod: 'direct', key: subscriptionAccountKey('direct', key), label: session.emailAddress ?? key, session,
            }));
            const cli = (await claudeCliLogin.accounts()).map((account) => ({
                accessMethod: 'official-cli', key: subscriptionAccountKey('official-cli', account.key), label: account.emailAddress ?? account.key,
            }));
            const all = [...direct, ...cli];
            const preferred = preferences.get('claude').defaultAccount;
            const legacy = direct[0]?.key;
            const first = preferred ?? legacy;
            return [...all.filter((account) => account.key === first), ...all.filter((account) => account.key !== first)];
        },
        pool: () => pool,
    });
    const presentedGrok = new AccountPreferencesAdapter({
        provider: 'grok',
        adapter: grokAdapter,
        settings: preferences,
        accounts: async () => (await grokTokens.list()).map(({ key, session }) => ({
            key,
            label: session.account ?? key,
        })),
        pool: () => pool,
    });
    const presentedAntigravity = new AccountPreferencesAdapter({
        provider: 'antigravity',
        adapter: antigravityAdapter,
        settings: preferences,
        accounts: async () => (await antigravityTokens.list()).map(({ key, session }) => ({
            key,
            label: session.account ?? key,
        })),
        pool: () => pool,
    });
    pool = new PoolAdapter({
        adapters: {
            ...(antigravityOAuth
                ? { antigravity: presentedAntigravity.poolMember() }
                : {}),
            grok: presentedGrok.poolMember(),
            copilot: presentedCopilot.poolMember(),
            codex: presented.poolMember(),
            claude: presentedClaude.poolMember(),
        },
        health,
        usage,
        strategy: config.pool?.strategy ?? 'quota_aware',
        switchMargin: config.pool?.switchMargin ?? 2,
        defaultAccount: (provider) => provider === 'antigravity'
            ? antigravityTokens.defaultAccount()
            : provider === 'grok'
                ? grokTokens.defaultAccount()
                : provider === 'copilot'
                    ? copilotTokens.defaultAccount()
                    : provider === 'claude'
                        ? claudeTokens.defaultAccount()
                        : tokens.defaultAccount(),
        resolveAccount: (provider, account) => provider === 'antigravity'
            ? antigravityTokens.resolveAccount(account)
            : provider === 'grok'
                ? grokTokens.resolveAccount(account)
                : provider === 'copilot'
                    ? copilotTokens.resolveAccount(account)
                    : provider === 'claude'
                        ? claudeTokens.resolveAccount(account)
                        : tokens.resolveAccount(account),
        families: async () => {
            if (config.pool?.enabled === false)
                return new Map();
            const families = new Map();
            if (config.pool?.autoAccounts ?? config.pool?.autoFamilies ?? true) {
                // Discover each account separately and bound each read: a hang or failure sits that account out
                // instead of failing the whole assembly (reference index.ts `families`). Codex and Claude alike.
                const sources = {};
                await Promise.all([
                    ['antigravity', antigravityTokens, antigravityAdapter],
                    ['codex', tokens, adapter],
                    ['claude', claudeTokens, claudeAdapter],
                    ['grok', grokTokens, grokAdapter],
                    ['copilot', copilotTokens, copilotAdapter],
                ].map(async ([provider, accountTokens, raw]) => {
                    try {
                        if (provider === 'antigravity' && !antigravityOAuth)
                            return;
                        const accounts = (await accountTokens.list()).map((entry) => entry.key);
                        const catalogs = (await Promise.all(accounts.map(async (account) => {
                            const models = await withTimeout((signal) => raw.listOwnModels(provider, account, signal, true), POOL_USAGE_TIMEOUT_MS).catch(() => undefined);
                            const settings = preferences.get(provider).accounts;
                            const policy = settings && Object.hasOwn(settings, account)
                                ? settings[account]
                                : undefined;
                            return models === undefined
                                ? undefined
                                : {
                                    account,
                                    models: models.filter((model) => accountAllowsPool(policy, model.id)),
                                };
                        }))).filter((entry) => entry !== undefined);
                        if (catalogs.length > 0)
                            sources[provider] = { catalogs };
                    }
                    catch {
                        /* Discovery failures are already reported by the owning adapter. */
                    }
                }));
                for (const [key, definition] of buildAccountPools(sources))
                    families.set(key, definition);
            }
            for (const [id, members] of Object.entries(config.pool?.families ?? {})) {
                const owner = members[0]?.provider;
                if (!owner)
                    continue;
                const kept = members.filter((member) => member.provider === owner);
                if (kept.length < members.length)
                    ctx.logger.warn(`dsh-waycraft: pool "${id}": cross-provider members are ignored; only ${owner} accounts are pooled`);
                families.set(poolKey(owner, id), { members: kept });
            }
            return families;
        },
        tiers: config.pool?.enabled === false ? {} : (config.pool?.tiers ?? {}),
        onWarn: (message) => ctx.logger.warn(`dsh-waycraft: ${message}`),
    });
    try {
        handle = ctx.llm.registerAdapter(['codex'], presented);
    }
    catch (error) {
        collisionError = error;
        collision = 'Codex registration is unavailable';
    }
    try {
        claudeHandle = ctx.llm.registerAdapter(['claude'], presentedClaude);
    }
    catch (error) {
        claudeCollisionError = error;
        claudeCollision = 'Claude registration is unavailable';
    }
    try {
        grokHandle = ctx.llm.registerAdapter(['grok'], presentedGrok);
    }
    catch (error) {
        ctx.logger.warn(`dsh-waycraft: grok registration failed (${error?.code ?? error?.name ?? 'unknown'})`);
        grokCollision = 'Grok registration is unavailable';
    }
    try {
        copilotHandle = ctx.llm.registerAdapter(['copilot'], presentedCopilot);
    }
    catch (error) {
        ctx.logger.warn(`dsh-waycraft: copilot registration failed (${error?.code ?? error?.name ?? 'unknown'})`);
        copilotCollision = true;
    }
    try {
        antigravityHandle = ctx.llm.registerAdapter(['antigravity'], presentedAntigravity);
    }
    catch (error) {
        ctx.logger.warn(`dsh-waycraft: antigravity registration failed (${error?.code ?? error?.name ?? 'unknown'})`);
        antigravityCollision = true;
    }
    ctx.effect(() => async () => {
        disposed = true;
        stopWebSearch?.();
        stopWebSearch = undefined;
        antigravityAuth.dispose();
        antigravityLifecycle.abort();
        grokAuth.dispose();
        copilotAuth.dispose();
        copilotAdapter.clearReplayState();
        claudeLifecycle.abort();
        auth.dispose();
        claudeAuth.dispose();
        await claudeAdapter.disposeCliTurns();
        await claudeCliLogin.dispose();
        // Transport teardown is async; a failure must be logged, not become an unhandled rejection.
        return disposeProxyTransport().catch((error) => ctx.logger.warn(`dsh-waycraft: proxy transport disposal failed (${error?.code ?? error?.name ?? 'unknown'})`));
    }, 'dsh-waycraft: subscriptions auth disposal');
    // Keep keychain-bound Claude accounts synced with Claude Code's own store (reference `claude background sync timer`).
    // One interval, bounded: each tick reads the account list and refreshes only bound sessions, errors are swallowed
    // (TokenManager already reports permanent failures), and dispose clears the timer.
    ctx.effect(() => {
        const syncTimer = setInterval(() => {
            if (disposed || !claudeHandle)
                return;
            void claudeTokens.list().then((accounts) => {
                for (const { key, session } of accounts) {
                    // The list read can outlive disposal: do nothing once the component is gone.
                    if (disposed || claudeLifecycle.signal.aborted)
                        return;
                    if (session.keychainBound !== true)
                        continue;
                    claudeTokens.session(key).catch(() => {
                        /* Best-effort: TokenManager surfaces failures via onRemoved. */
                    });
                }
            }, () => undefined);
        }, CLAUDE_KEYCHAIN_SYNC_MS);
        // Never keep the host process alive for a background sync.
        syncTimer.unref();
        return () => {
            clearInterval(syncTimer);
        };
    }, 'dsh-waycraft: claude background sync timer');
    if (handle)
        ctx.effect(() => startCatalogRefresh(async (signal) => {
            if ((await tokens.list()).length && !signal.aborted)
                await adapter.listOwnModels('codex', undefined, signal);
        }, () => ctx.logger.warn('dsh-waycraft: Codex catalog refresh failed')), 'dsh-waycraft: subscriptions catalog refresh');
    if (copilotHandle)
        ctx.effect(() => startCatalogRefresh(async (signal) => {
            if ((await copilotTokens.list()).length && !signal.aborted)
                await copilotAdapter.listOwnModels('copilot', undefined, signal);
        }, () => ctx.logger.warn('dsh-waycraft: Copilot catalog refresh failed')), 'dsh-waycraft: copilot catalog refresh');
    if (claudeHandle)
        ctx.effect(() => startCatalogRefresh(async (signal) => {
            if ((await claudeTokens.list()).length && !signal.aborted)
                await claudeAdapter.listOwnModels('claude', undefined, signal);
        }, () => ctx.logger.warn('dsh-waycraft: Claude catalog refresh failed')), 'dsh-waycraft: claude catalog refresh');
    if (antigravityHandle && antigravityOAuth)
        ctx.effect(() => startCatalogRefresh(async (signal) => {
            if ((await antigravityTokens.list()).length && !signal.aborted)
                await antigravityAdapter.listOwnModels('antigravity', undefined, signal);
        }, () => ctx.logger.warn('dsh-waycraft: Antigravity catalog refresh failed')), 'dsh-waycraft: antigravity catalog refresh');
    if (grokHandle)
        ctx.effect(() => startCatalogRefresh(async (signal) => {
            if ((await grokTokens.list()).length && !signal.aborted)
                await grokAdapter.listOwnModels('grok', undefined, signal);
        }, () => ctx.logger.warn('dsh-waycraft: Grok catalog refresh failed')), 'dsh-waycraft: grok catalog refresh');
    // `web` is optional on headless/minimal compositions. The Codex switch gates this provider's
    // `available()` rather than the host's web_search tool, so other providers keep working.
    let stopWebSearch;
    ctx.inject(['web'], (webCtx) => {
        stopWebSearch?.();
        stopWebSearch = webCtx.web.registerSearchProvider(new CodexWebSearchProvider({
            tokens,
            enabled: () => preferences.toolEnabled('codex', 'web_search'),
            fetchFn: proxiedFetch,
        }));
    });
    // `tools` is optional too. Definitions stay registered globally so already-open sessions keep their
    // schema and execution path; each new agent is restricted from the switches in force at its creation.
    ctx.inject(['tools'], (toolsCtx) => {
        const registeredNames = new Map();
        const result = registerWithAlias(toolsCtx.tools, createImageGenerateTool({
            imagePool,
            codexTokens: tokens,
            grokTokens,
            resolveAttachments: () => ctx.get('attachments'),
            resolveLlm: () => ctx.get('llm'),
            providerEnabled: (provider, createdAt) => preferences.toolEnabled(provider, 'image_generate', createdAt),
        }), (message) => ctx.logger.warn(message));
        if (result !== undefined)
            registeredNames.set('image_generate', result.names);
        for (const tool of [
            createVideoGenerateTool({ tokens: grokTokens }),
            createXSearchTool({ tokens: grokTokens }),
        ]) {
            const entry = registerWithAlias(toolsCtx.tools, tool, (message) => ctx.logger.warn(message));
            if (entry)
                registeredNames.set(tool.name, entry.names);
        }
        toolsCtx.on('agent/created', ({ agent }) => {
            const at = agent.session.header.createdAt;
            const deny = [];
            const registered = registeredNames.get('image_generate');
            if (registered !== undefined &&
                !preferences.toolEnabled('codex', 'image_generate', at) &&
                !preferences.toolEnabled('grok', 'image_generate', at))
                deny.push(...registered);
            for (const name of ['video_generate', 'x_search']) {
                const actual = registeredNames.get(name);
                if (actual && !preferences.toolEnabled('grok', name, at))
                    deny.push(...actual);
            }
            if (deny.length)
                agent.ctx.tools.restrict({ deny });
            return undefined;
        });
    });
    /**
     * Each account's own catalog, one bounded read per account: a hung or failing account is marked
     * `unavailable` after DISCOVERY_TIMEOUT_MS (or when the caller's signal aborts) instead of hanging the RPC.
     */
    const readAccountCatalogs = async (preferCached, signal) => readAccountCatalogsFor(adapter, tokens, preferCached, signal, 'codex');
    /** Per-account catalog read for one provider (Codex or Claude); the same bounded per-account contract. */
    async function readAccountCatalogsFor(route, manager, preferCached, signal, provider = 'claude') {
        const accounts = await manager.list();
        return Promise.all(accounts.map(async ({ key, session }) => {
            const models = await withTimeout((accountSignal) => route.listOwnModels(provider, key, accountSignal, preferCached), DISCOVERY_TIMEOUT_MS, signal).catch(() => undefined);
            return {
                key,
                label: session.emailAddress ?? session.account ?? key,
                models: models ?? [],
                ...(models === undefined ? { unavailable: true } : {}),
            };
        }));
    }
    /**
     * The context bounds shown AND enforced for one model: the minimum default and the minimum maximum over every
     * account that lists it, so the UI limit is a value each account can honour. Undefined when no account lists it.
     */
    const boundsFor = async (model, catalogs, signal) => {
        const limits = (await Promise.all(catalogs
            .filter((account) => account.models.some((entry) => entry.id === model))
            .map((account) => adapter
            .contextLimits(model, account.key, signal)
            .catch(() => undefined)))).filter((entry) => entry !== undefined);
        return limits.length
            ? {
                default: Math.min(...limits.map((entry) => entry.default)),
                max: Math.min(...limits.map((entry) => entry.max)),
            }
            : undefined;
    };
    ctx.inject(['connection'], (ctx) => {
        const connection = ctx.get('connection');
        const endpoints = [
            'zenStatus',
            'setZenEnabled',
            'image',
            'video',
            'extraUsageNotice',
            'cliDiscover',
            'cliInput',
            'cliRead',
            'cliCancel',
            'status',
            'login',
            'manual',
            'cancel',
            'logout',
            'setDefault',
            'usage',
            'prepareReset',
            'consumeReset',
            'providerSettings',
            'setProviderSettings',
            'modelDefaults',
            'setModelDefault',
            'proxyGet',
            'proxySet',
            'proxyTest',
            'speed',
            'setSpeed',
        ];
        // The new prefix plus the deprecated legacy prefix (one release) for stale browser clients.
        for (const [endpoint, NS] of endpoints.flatMap((e) => ['waycraft-subscriptions.', LEGACY_RPC_PREFIX].map((p) => [e, p]))) {
            const method = `${NS}${endpoint}`;
            ctx.effect(() => connection.fetch.register({
                path: `/api/${method}`,
                methods: ['POST'],
                requestBody: 'buffered',
                async fetch(request) {
                    if (request.headers
                        .get('content-type')
                        ?.split(';')[0]
                        ?.trim()
                        .toLowerCase() !== 'application/json')
                        return new Response('content type must be application/json', {
                            status: 415,
                        });
                    let body;
                    try {
                        body = (await request.json());
                    }
                    catch {
                        return new Response('invalid JSON', { status: 400 });
                    }
                    if (body?.type !== 'client-request' ||
                        typeof body.rpcId !== 'string' ||
                        body.method !== method)
                        return new Response('invalid RPC envelope', { status: 400 });
                    const payload = body.payload ?? {};
                    const string = (key) => {
                        const value = payload[key];
                        if (typeof value !== 'string' || !value)
                            throw new RpcFailure('invalid-request', `payload.${key} must be a non-empty string`);
                        return value;
                    };
                    let result;
                    const releases = [];
                    try {
                        if (disposed)
                            throw new RpcFailure('unavailable', 'Subscriptions component is disabled');
                        // Claude is served by the endpoints in CLAUDE_ENDPOINTS; every other provider stays unavailable.
                        const provider = endpoint === 'status'
                            ? 'codex'
                            : readRouteProvider(payload.provider);
                        if (provider !== 'codex' && !CLAUDE_ENDPOINTS.has(endpoint))
                            throw new Error('Only Codex is available');
                        let value = { ok: true };
                        switch (endpoint) {
                            case 'setZenEnabled':
                                if (typeof payload.enabled !== 'boolean')
                                    throw new Error('enabled must be a boolean');
                                await preferences.setZenEnabled(payload.enabled);
                                value = {
                                    ...zen.snapshot(),
                                    registrationError: zenRegistrationError,
                                };
                                break;
                            case 'zenStatus':
                                value = {
                                    ...(await zen.status(request.signal)),
                                    registrationError: zenRegistrationError,
                                };
                                break;
                            case 'image': {
                                const ref = payload;
                                if (!ref ||
                                    typeof ref.attachmentId !== 'string' ||
                                    !/^sha256:[a-f0-9]{64}$/.test(ref.attachmentId))
                                    throw new Error('Invalid image reference');
                                const attachments = ctx.get('attachments');
                                if (!attachments)
                                    throw new Error('Image storage unavailable');
                                const stored = await attachments.readImage(ref, request.signal);
                                value = {
                                    mediaType: stored.ref.mediaType,
                                    dataBase64: Buffer.from(stored.data).toString('base64'),
                                };
                                break;
                            }
                            case 'video': {
                                // Deprecated: base64 inside JSON. The binary GET `video-file` route replaces it.
                                const data = await readVideoFile(string('name'), request.signal);
                                value = {
                                    mediaType: 'video/mp4',
                                    dataBase64: data.toString('base64'),
                                };
                                break;
                            }
                            case 'extraUsageNotice': {
                                if (provider !== 'claude')
                                    throw new Error('The extra-usage notice is only available for Claude');
                                const revision = extraUsageSessions.get(string('sessionId'));
                                value =
                                    revision === undefined
                                        ? { active: false }
                                        : { active: true, revision };
                                break;
                            }
                            case 'cliRead': {
                                if (provider !== 'claude')
                                    throw new Error('Official CLI terminal is only available for Claude');
                                value = await claudeCliLogin.read(string('loginId'));
                                break;
                            }
                            case 'cliInput': {
                                if (provider !== 'claude')
                                    throw new Error('Official CLI terminal is only available for Claude');
                                await claudeCliLogin.input(string('loginId'), string('data'));
                                value = { accepted: true };
                                break;
                            }
                            case 'cliCancel': {
                                if (provider !== 'claude')
                                    throw new Error('Official CLI terminal is only available for Claude');
                                await claudeCliLogin.cancel(string('loginId'));
                                value = { cancelled: true };
                                break;
                            }
                            case 'cliDiscover': {
                                if (provider !== 'claude')
                                    throw new Error('Official CLI discovery is only available for Claude');
                                value = await discoverClaudeCli(cliRuntime());
                                break;
                            }
                            case 'status': {
                                const state = await auth.status();
                                // Never resolve npm client metadata for a provider with no saved login.
                                if (state.accounts.length &&
                                    !collision &&
                                    !config.codexClientVersion)
                                    await version.resolve();
                                // Claude presents its own CLI version (reference status `presentedVersion(claudeVersion)`), only when a
                                // Claude account or the Claude route is in use; an unused provider does no network (spec story 61).
                                const claudeState = await claudeAuth
                                    .status()
                                    .catch(() => undefined);
                                const claudeAccounts = await claudeTokens
                                    .list()
                                    .catch(() => []);
                                const grokState = await grokAuth.status();
                                const antigravityState = await antigravityAuth.status();
                                const copilotState = await copilotAuth.status();
                                value = {
                                    ok: true,
                                    component: 'subscriptions',
                                    version: PLUGIN_VERSION,
                                    registrationError: collision === undefined
                                        ? undefined
                                        : await collisionText(),
                                    antigravityRegistrationError: antigravityCollision,
                                    claudeRegistrationError: claudeCollision,
                                    copilotRegistrationError: copilotCollision,
                                    grokRegistrationError: grokCollision,
                                    providers: {
                                        'opencode-zen': {
                                            ...zen.snapshot(),
                                            registrationError: zenRegistrationError,
                                        },
                                        antigravity: {
                                            ...antigravityState,
                                            visibleModels: preferences.get('antigravity').visibleModels,
                                            displayName: preferences.get('antigravity').displayName,
                                            accounts: antigravityState.accounts.map((account) => ({
                                                ...account,
                                                alias: ownAlias('antigravity', account.key),
                                            })),
                                        },
                                        grok: {
                                            ...grokState,
                                            displayName: preferences.get('grok').displayName,
                                            accounts: grokState.accounts.map((account) => ({
                                                ...account,
                                                alias: ownAlias('grok', account.key),
                                            })),
                                        },
                                        copilot: {
                                            ...copilotState,
                                            accounts: copilotState.accounts.map((account) => ({
                                                ...account,
                                                alias: ownAlias('copilot', account.key),
                                            })),
                                            displayName: preferences.get('copilot').displayName,
                                        },
                                        codex: {
                                            ...state,
                                            displayName: preferences.get('codex').displayName,
                                            accounts: state.accounts.map((account) => ({
                                                ...account,
                                                alias: ownAlias('codex', account.key),
                                            })),
                                            clientVersion: config.codexClientVersion
                                                ? {
                                                    version: config.codexClientVersion,
                                                    source: 'config',
                                                }
                                                : (version.current() ?? {
                                                    version: CODEX_CLIENT_VERSION,
                                                    source: 'fallback',
                                                }),
                                        },
                                        ...(claudeState === undefined
                                            ? {}
                                            : {
                                                claude: {
                                                    ...claudeState,
                                                    capabilities: CLAUDE_CAPABILITIES,
                                                    ...((await claudeCliLogin.accounts()).length
                                                        ? { cli: await claudeCliStatus() }
                                                        : {}),
                                                    cliSettings: { cliMaxConcurrent: preferences.get('claude').cliMaxConcurrent ?? 4 },
                                                    displayName: preferences.get('claude').displayName,
                                                    accounts: [
                                                        ...claudeState.accounts.map((account) => ({
                                                            ...account,
                                                            accessMethod: 'direct',
                                                            isDefault: preferences.get('claude').defaultAccount ? preferences.get('claude').defaultAccount === subscriptionAccountKey('direct', account.key) : account.isDefault,
                                                            alias: ownAlias('claude', account.key),
                                                        })),
                                                        ...(await claudeCliLogin.accounts()).map((account) => ({
                                                            ...account,
                                                            key: subscriptionAccountKey('official-cli', account.key),
                                                            isDefault: preferences.get('claude').defaultAccount === subscriptionAccountKey('official-cli', account.key),
                                                            alias: ownAlias('claude', account.key),
                                                        })),
                                                    ],
                                                    clientVersion: claudeAccounts.length
                                                        ? await presentClaudeVersion()
                                                        : undefined,
                                                },
                                            }),
                                    },
                                };
                                break;
                            }
                            case 'proxyGet':
                                value = await proxyGetConfig();
                                break;
                            case 'proxySet': {
                                if (typeof payload.enabled !== 'boolean' ||
                                    typeof payload.url !== 'string')
                                    throw new Error('Invalid proxy settings');
                                if (payload.username !== undefined &&
                                    typeof payload.username !== 'string')
                                    throw new Error('Invalid proxy username');
                                if (payload.password !== undefined &&
                                    payload.password !== null &&
                                    typeof payload.password !== 'string')
                                    throw new Error('Invalid proxy password');
                                if (payload.bypass !== undefined &&
                                    (!Array.isArray(payload.bypass) ||
                                        payload.bypass.some((item) => typeof item !== 'string')))
                                    throw new Error('Invalid bypass list');
                                value = await proxySetConfig(payload);
                                break;
                            }
                            case 'proxyTest': {
                                const input = readProxyTestPayload(payload);
                                value = await proxyTestConnection(input.url, input.proxy, request.signal);
                                break;
                            }
                            case 'setProviderSettings': {
                                // Schema first: contextWindows is checked as positive safe integers before anything iterates it.
                                const draft = validatePreferences(provider, payload.settings);
                                // `original` (the snapshot the editor loaded) turns the save into an atomic field-level patch;
                                // without it the whole provider document is replaced (legacy full save).
                                const original = payload.original === undefined
                                    ? undefined
                                    : validatePreferences(provider, payload.original);
                                const touched = Object.entries(draft.contextWindows ?? {}).filter(([model, window]) => original?.contextWindows?.[model] !== window);
                                if (touched.length) {
                                    const catalogs = await readAccountCatalogs(false, request.signal);
                                    for (const [model, window] of touched) {
                                        const bound = (await boundsFor(model, catalogs, request.signal)) ??
                                            (await adapter.contextLimits(model, undefined, request.signal));
                                        if (window > bound.max)
                                            throw new Error('Context window is outside the advertised bounds');
                                    }
                                }
                                request.signal.throwIfAborted();
                                if (original === undefined)
                                    await preferences.set(provider, draft);
                                else
                                    await preferences.update(provider, original, draft);
                                pool.invalidate();
                                handleFor(provider)?.replace([provider]);
                                break;
                            }
                            case 'providerSettings': {
                                const force = readForce(payload);
                                // One overall budget for the whole read (sequential bounded steps would add up to several budgets).
                                const budget = deadlineSignal(DISCOVERY_TIMEOUT_MS, request.signal);
                                releases.push(budget.release);
                                const deadline = budget.signal;
                                await loadModelDefaults();
                                const own = provider === 'antigravity' || provider === 'copilot'
                                    ? OWN_CATALOG_PROVIDERS[provider]
                                    : undefined;
                                if (own) {
                                    if (force) {
                                        own.adapter.clearAccountCatalog();
                                        pool.invalidate();
                                        own.handle()?.replace([provider]);
                                    }
                                    const accounts = await readAccountCatalogsFor(own.adapter, own.tokens, !force, deadline, provider);
                                    const listed = await withTimeout((signal) => own.adapter.listOwnModels(provider, undefined, signal, !force), DISCOVERY_TIMEOUT_MS, deadline);
                                    const tiers = await withTimeout(() => pool.modelsForProvider(provider), DISCOVERY_TIMEOUT_MS, deadline);
                                    const tierIds = new Set((tiers ?? []).map((tier) => tier.id));
                                    const models = await Promise.all([
                                        ...(listed ?? []),
                                        ...(tiers ?? []).filter((tier) => !(listed ?? []).some((model) => model.id === tier.id)),
                                    ].map(async (model) => {
                                        const info = await withTimeout((signal) => own.adapter.resolveModel(provider, model.id, signal), DISCOVERY_TIMEOUT_MS, deadline);
                                        return {
                                            ...model,
                                            contextWindow: info?.context?.contextWindow,
                                            efforts: tierIds.has(model.id)
                                                ? []
                                                : (info?.reasoning?.efforts ?? []),
                                            configured: defaultEffortOf(provider, model.id),
                                        };
                                    }));
                                    value = {
                                        provider,
                                        settings: preferences.get(provider),
                                        accounts,
                                        models,
                                        tools: PROVIDER_TOOLS[provider],
                                    };
                                    break;
                                }
                                if (provider === 'grok') {
                                    if (force) {
                                        grokAdapter.clearAccountCatalog();
                                        pool.invalidate();
                                        grokHandle?.replace(['grok']);
                                    }
                                    const accounts = await readAccountCatalogsFor(grokAdapter, {
                                        list: async () => (await grokTokens.list()).map(({ key, session }) => ({
                                            key,
                                            session: { emailAddress: session.account },
                                        })),
                                    }, !force, deadline, 'grok');
                                    const listed = await withTimeout(() => grokAdapter.listModels('grok'), DISCOVERY_TIMEOUT_MS, deadline);
                                    const models = await Promise.all((listed ?? []).map(async (model) => {
                                        const info = await withTimeout(() => grokAdapter.resolveModel('grok', model.id), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined);
                                        return {
                                            ...model,
                                            contextWindow: info?.context?.contextWindow,
                                            efforts: info?.reasoning?.efforts.map(({ id, name }) => ({
                                                id,
                                                name,
                                            })) ?? [],
                                            configured: defaultEffortOf('grok', model.id),
                                        };
                                    }));
                                    value = {
                                        provider: 'grok',
                                        settings: preferences.get('grok'),
                                        accounts,
                                        models,
                                        tools: PROVIDER_TOOLS.grok,
                                    };
                                    break;
                                }
                                if (provider === 'claude') {
                                    // Reference `providerSettings` for Claude: same bounded reads, no context bounds or fast tier, and the
                                    // config value "follow config" resolves to (`promptCacheTtlDefault`).
                                    if (force) {
                                        version.invalidate();
                                        claudeVersion.invalidate();
                                        claudeAdapter.clearAccountCatalog();
                                        pool.invalidate();
                                        claudeHandle?.replace(['claude']);
                                    }
                                    const accounts = await readAccountCatalogsFor(claudeAdapter, claudeTokens, !force, deadline);
                                    const bounded = (work) => withTimeout(work, DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined);
                                    const [listed, tiers] = await Promise.all([
                                        bounded(() => claudeAdapter.listModels('claude')),
                                        bounded(() => pool.modelsForProvider('claude')),
                                    ]);
                                    const tierIds = new Set((tiers ?? []).map((tier) => tier.id));
                                    const rows = await Promise.all((listed ?? []).map(async (model) => {
                                        const info = await bounded(() => claudeAdapter.resolveModel('claude', model.id));
                                        return {
                                            ...model,
                                            contextWindow: info?.context?.contextWindow,
                                            efforts: tierIds.has(model.id)
                                                ? []
                                                : (info?.reasoning?.efforts.map(({ id, name }) => ({ id, name })) ?? []),
                                            configured: defaultEffortOf('claude', model.id),
                                        };
                                    }));
                                    value = {
                                        provider: 'claude',
                                        settings: preferences.get('claude'),
                                        accounts,
                                        models: rows,
                                        tools: PROVIDER_TOOLS.claude,
                                        promptCacheTtlDefault: config.claudePromptCacheTtl ??
                                            DEFAULT_PROMPT_CACHE_TTL,
                                    };
                                    break;
                                }
                                if (force) {
                                    adapter.clearAccountCatalog();
                                    pool.invalidate();
                                    handle?.replace(['codex']);
                                }
                                const catalogs = await readAccountCatalogs(!force, deadline);
                                const bounded = (work) => withTimeout(work, DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined);
                                const [listed, fastIds, tiers] = await Promise.all([
                                    bounded(() => adapter.listModels('codex')),
                                    bounded((signal) => adapter.fastCapableModels(signal)),
                                    bounded(() => pool.modelsForProvider('codex')),
                                ]);
                                const models = listed ?? [];
                                const fast = new Set(fastIds ?? []);
                                // Configured tier rows resolve through the pool, which never consults the per-model override or
                                // speed for the tier id: offering controls on them would save cleanly and change nothing.
                                const tierIds = new Set((tiers ?? []).map((tier) => tier.id));
                                const rows = await Promise.all(models.map(async (model) => {
                                    const info = await bounded((signal) => adapter.resolveModel('codex', model.id, signal));
                                    const bound = await boundsFor(model.id, catalogs, deadline);
                                    return {
                                        ...model,
                                        efforts: tierIds.has(model.id)
                                            ? []
                                            : (info?.reasoning?.efforts ?? []),
                                        configured: defaultEffortOf('codex', model.id),
                                        fastTier: !tierIds.has(model.id) && fast.has(model.id),
                                        ...(bound
                                            ? {
                                                defaultContextWindow: bound.default,
                                                maxContextWindow: bound.max,
                                            }
                                            : {}),
                                    };
                                }));
                                value = {
                                    provider: 'codex',
                                    settings: preferences.get('codex'),
                                    accounts: catalogs,
                                    models: rows,
                                    tools: PROVIDER_TOOLS.codex,
                                };
                                break;
                            }
                            case 'modelDefaults': {
                                // Reference `modelDefaults.catalog`: re-read from the live model info (the picker's own source), so the
                                // offered efforts match the picker exactly and the configured default merges in through the adapter.
                                const budget = deadlineSignal(DISCOVERY_TIMEOUT_MS, request.signal);
                                releases.push(budget.release);
                                const deadline = budget.signal;
                                if (readForce(payload)) {
                                    antigravityAdapter.clearAccountCatalog();
                                    antigravityHandle?.replace(['antigravity']);
                                    version.invalidate();
                                    claudeVersion.invalidate();
                                    adapter.clearAccountCatalog();
                                    claudeAdapter.clearAccountCatalog();
                                    copilotAdapter.clearAccountCatalog();
                                    grokAdapter.clearAccountCatalog();
                                    grokHandle?.replace(['grok']);
                                    pool.invalidate();
                                    handle?.replace(['codex']);
                                    claudeHandle?.replace(['claude']);
                                    copilotHandle?.replace(['copilot']);
                                }
                                await loadModelDefaults();
                                const catalog = [];
                                // Both routes read the live picker source (`ctx.llm`) and merge the saved default per model.
                                for (const route of [
                                    'codex',
                                    'claude',
                                    'grok',
                                    'copilot',
                                    'antigravity',
                                ]) {
                                    if (!(await ctx.llm.listProviders()).some((entry) => entry.id === route))
                                        continue;
                                    const listed = await withTimeout(() => ctx.llm.listModels(route), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined);
                                    if (listed === undefined)
                                        continue;
                                    // Configured tier rows resolve through the pool and never consult the per-model default: leave them out.
                                    const tierIds = new Set(((await withTimeout(() => pool.modelsForProvider(route), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined)) ?? []).map((tier) => tier.id));
                                    const candidates = listed.filter((model) => !tierIds.has(model.id) &&
                                        !parseAccountModelId(model.id));
                                    const infos = await Promise.all(candidates.map((model) => withTimeout((signal) => ctx.llm.resolveModelInfo(route, model.id, signal), DISCOVERY_TIMEOUT_MS, deadline).catch(() => undefined)));
                                    const models = [];
                                    for (const [index, model] of candidates.entries()) {
                                        const info = infos[index];
                                        if (info === undefined)
                                            continue;
                                        const override = defaultEffortOf(route, model.id);
                                        models.push({
                                            id: model.id,
                                            name: model.name,
                                            efforts: info.reasoning?.efforts.map((effort) => ({
                                                id: effort.id,
                                                name: effort.name,
                                            })) ?? [],
                                            ...(override === undefined
                                                ? {}
                                                : { configured: override }),
                                        });
                                    }
                                    catalog.push({ provider: route, models });
                                }
                                value = catalog;
                                break;
                            }
                            case 'setModelDefault': {
                                const model = string('model');
                                const effort = payload.effort === undefined
                                    ? undefined
                                    : string('effort');
                                const info = provider === 'antigravity'
                                    ? await withTimeout(() => antigravityAdapter.resolveModel('antigravity', model), DISCOVERY_TIMEOUT_MS, request.signal)
                                    : provider === 'copilot'
                                        ? await withTimeout(() => copilotAdapter.resolveModel('copilot', model), DISCOVERY_TIMEOUT_MS, request.signal)
                                        : provider === 'grok'
                                            ? await withTimeout(() => grokAdapter.resolveModel('grok', model), DISCOVERY_TIMEOUT_MS, request.signal)
                                            : provider === 'claude'
                                                ? await withTimeout(() => claudeAdapter.resolveModel('claude', model), DISCOVERY_TIMEOUT_MS, request.signal).catch(() => undefined)
                                                : await withTimeout((signal) => adapter.resolveModel('codex', model, signal), DISCOVERY_TIMEOUT_MS, request.signal).catch(() => undefined);
                                if (effort &&
                                    info?.reasoning?.efforts.length &&
                                    !info.reasoning.efforts.some((entry) => entry.id === effort))
                                    throw new Error(`model ${model} does not advertise a "${effort}" reasoning effort`);
                                await setDefaultEffort(provider, model, effort);
                                handleFor(provider)?.replace([provider]);
                                break;
                            }
                            case 'login': {
                                // Claude route: the browser sends `method` ('oauth' or 'keychain'); absent means import-first.
                                const method = readLoginMethod(payload, provider);
                                if (provider === 'antigravity') {
                                    if (antigravityCollision)
                                        throw new Error('Antigravity registration unavailable');
                                    value = await antigravityAuth.login();
                                    break;
                                }
                                if (provider === 'copilot') {
                                    if (copilotCollision)
                                        throw new Error('Copilot is already registered. Disable the reference component first.');
                                    value = await copilotAuth.login();
                                    break;
                                }
                                if (provider === 'grok') {
                                    if (grokCollision)
                                        throw new Error(grokCollision);
                                    value = await grokAuth.login();
                                    break;
                                }
                                if (provider === 'claude') {
                                    if (claudeCollision)
                                        throw new Error('Claude is already registered. Disable the reference component first.');
                                    if (method === 'official-cli') {
                                        value = await claudeCliLogin.login(cliRuntime());
                                        break;
                                    }
                                    value = await claudeAuth.login(method);
                                    break;
                                }
                                if (collision)
                                    throw new Error('Codex is already registered. Disable the reference component first.');
                                value = await auth.login();
                                break;
                            }
                            case 'manual':
                                if (provider === 'antigravity')
                                    antigravityAuth.manual(string('input'));
                                else if (provider === 'copilot')
                                    throw new Error('Enter the device code on the verification page');
                                else if (provider === 'grok')
                                    grokAuth.manual(string('input'));
                                else if (provider === 'claude')
                                    claudeAuth.manual(string('input'));
                                else
                                    auth.manual(string('input'));
                                break;
                            case 'cancel':
                                if (provider === 'antigravity')
                                    antigravityAuth.cancel();
                                else if (provider === 'copilot')
                                    copilotAuth.cancel();
                                else if (provider === 'grok')
                                    grokAuth.cancel();
                                else if (provider === 'claude')
                                    claudeAuth.cancel();
                                else
                                    auth.cancel();
                                break;
                            case 'logout':
                                if (provider === 'antigravity')
                                    await antigravityAuth.logout(string('account'));
                                else if (provider === 'copilot')
                                    await copilotAuth.logout(string('account'));
                                else if (provider === 'grok')
                                    await grokAuth.logout(string('account'));
                                else if (provider === 'claude')
                                    await claudeAuth.logout(string('account'));
                                else
                                    await auth.logout(string('account'));
                                break;
                            case 'setDefault':
                                if (provider === 'antigravity')
                                    await antigravityAuth.setDefault(string('account'));
                                else if (provider === 'copilot')
                                    await copilotAuth.setDefault(string('account'));
                                else if (provider === 'grok')
                                    await grokAuth.setDefault(string('account'));
                                else if (provider === 'claude') {
                                    const requested = string('account');
                                    const accounts = [
                                        ...(await claudeTokens.list()).map(({ key }) => ({ accessMethod: 'direct', key: subscriptionAccountKey('direct', key) })),
                                        ...(await claudeCliLogin.accounts()).map(({ key }) => ({ accessMethod: 'official-cli', key: subscriptionAccountKey('official-cli', key) })),
                                    ];
                                    const selected = accounts.find((account) => account.key === requested || (account.accessMethod === 'direct' && account.key === subscriptionAccountKey('direct', requested)));
                                    if (!selected)
                                        throw new Error('Claude account unavailable');
                                    await preferences.set('claude', { ...preferences.get('claude'), defaultAccount: selected.key });
                                }
                                else
                                    await auth.setDefault(string('account'));
                                break;
                            case 'usage': {
                                if (provider === 'antigravity') {
                                    if (antigravityCollision)
                                        throw new Error('Antigravity registration unavailable');
                                    value = await usage.snapshotFor('antigravity', string('account'), readForce(payload));
                                    break;
                                }
                                if (provider === 'copilot') {
                                    value = await usage.snapshotFor('copilot', string('account'), readForce(payload));
                                    break;
                                }
                                if (provider === 'grok') {
                                    if (grokCollision)
                                        throw new Error(grokCollision);
                                    const account = string('account');
                                    const force = readForce(payload);
                                    value = await usage.snapshotFor('grok', account, force);
                                    break;
                                }
                                if (provider === 'claude') {
                                    if (claudeCollision)
                                        throw new Error('Claude registration is unavailable');
                                    const account = string('account');
                                    const force = readForce(payload);
                                    if (force)
                                        health.clear('claude', account);
                                    value = await usage.snapshotFor('claude', account, force);
                                    break;
                                }
                                if (collision)
                                    throw new Error('Codex registration is unavailable');
                                const account = string('account');
                                const force = readForce(payload);
                                if (force)
                                    health.clear('codex', account);
                                value = await usage.snapshotFor('codex', account, force);
                                break;
                            }
                            case 'speed': {
                                const sessionId = string('sessionId');
                                const model = payload.model === undefined ? undefined : string('model');
                                const fastModels = await adapter.fastCapableModels(request.signal);
                                const accountPreferences = preferences.get('codex').accounts;
                                for (const { key } of await tokens.list()) {
                                    if (!accountPreferences ||
                                        !Object.hasOwn(accountPreferences, key) ||
                                        accountPreferences[key]?.independentEntry !== true)
                                        continue;
                                    for (const candidate of [...fastModels]) {
                                        if (parseAccountModelId(candidate))
                                            continue;
                                        if (await adapter.supportsFastTier(candidate, key, request.signal))
                                            fastModels.push(accountModelId(key, candidate));
                                    }
                                }
                                value = {
                                    tier: selectedSpeed(sessionId, model),
                                    fastModels,
                                };
                                break;
                            }
                            case 'setSpeed': {
                                // An explicit Standard is kept as well, so a child can override a saved Fast default.
                                // Re-insert so the Map keeps recency order, then drop the oldest beyond the cap.
                                speedBySession.delete(string('sessionId'));
                                speedBySession.set(string('sessionId'), readSpeedTier(payload));
                                while (speedBySession.size > SPEED_SESSIONS_MAX) {
                                    const oldest = speedBySession.keys().next().value;
                                    if (oldest === undefined)
                                        break;
                                    speedBySession.delete(oldest);
                                }
                                break;
                            }
                            case 'prepareReset':
                                value = await resets.prepare(string('account'), AbortSignal.any([
                                    request.signal,
                                    AbortSignal.timeout(20_000),
                                ]));
                                break;
                            case 'consumeReset':
                                await resets.redeem(string('account'), string('ticket'), AbortSignal.any([
                                    request.signal,
                                    AbortSignal.timeout(20_000),
                                ]));
                                break;
                        }
                        result = { ok: true, value };
                    }
                    catch (error) {
                        result = {
                            ok: false,
                            error: {
                                // `code` is the legacy constant clients may read; `kind` is the stable classification.
                                code: 'subscriptions/error',
                                kind: rpcErrorKind(error),
                                message: error instanceof OAuthEndpointError
                                    ? browserSafeError(error, 'upstream')
                                    : safeDiagnostic(error, [
                                        payload.password,
                                        payload.proxy?.password,
                                    ], [
                                        payload.username,
                                        payload.proxy?.username,
                                    ]),
                                details: {},
                            },
                        };
                    }
                    finally {
                        for (const release of releases)
                            release();
                    }
                    return Response.json({
                        type: 'server-response',
                        rpcId: body.rpcId,
                        result,
                    });
                },
            }), `dsh-waycraft: ${method} route`);
        }
        // Binary video: same owner-only gate as the JSON routes (the host answers 403 to
        // anyone else), same name/ownership/size checks, streamed instead of base64-in-JSON.
        ctx.effect(() => connection.fetch.register({
            path: `/api/${VIDEO_FILE_ROUTE}`,
            methods: ['GET'],
            requestBody: 'buffered',
            async fetch(request) {
                const name = new URL(request.url).searchParams.get('name') ?? '';
                try {
                    const { handle, size } = await openVideoFile(name);
                    return streamVideoFile(handle, size, request.signal);
                }
                catch (error) {
                    const missing = error?.code === 'ENOENT';
                    return new Response(missing ? 'not found' : 'invalid video', {
                        status: missing ? 404 : 400,
                    });
                }
            },
        }), `dsh-waycraft: ${VIDEO_FILE_ROUTE} route`);
    });
}
