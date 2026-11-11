/**
 * MCP manager V1 — explicit connection testing (#168).
 * Spec #168: "Test button per server, status indicator, probe integration,
 * clear success/failure reporting. Uses verified public DSH capabilities only.
 * Connection testing cannot bypass trust approval."
 *
 * Capability order (verified-first, trust/auth never bypassed by caller mcp.ts):
 * 1. ctx.mcpManager.probe(name, options?) if available (DSH host manager).
 * 2. probeServer from @deepseek-ai/dsh-mcp-client if exported.
 * 3. Bounded direct MCP SDK probe (alternative mechanism) using installed
 *    @modelcontextprotocol/sdk. This performs the same explicit, owner-gated,
 *    trust-gated test without auto-import/auto-exec outside this action.
 *
 * Secrets: errors/diagnostics sanitized before returning.
 */
import { sanitizeMcpObservable } from './mcp-credentials.js';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_PAGES = 16;
const MAX_TOOL_NAMES = 512;
function now() {
    return Date.now();
}
function asText(err) {
    if (err instanceof Error)
        return err.message;
    if (typeof err === 'string')
        return err;
    try {
        return JSON.stringify(err);
    }
    catch {
        return String(err);
    }
}
function safeText(v) {
    return String(sanitizeMcpObservable(asText(v)));
}
function unavailable(message, stage = 'capability', started = now()) {
    return {
        ok: false,
        stage,
        message: safeText(message),
        durationMs: now() - started,
        capability: 'unavailable',
        capabilityVerified: false,
    };
}
async function tryMcpManagerProbe(serverName, opts, started) {
    // The component does not inject mcpManager; reading an uninjected Cordis service throws, which is "not available" here.
    let mgr;
    try {
        mgr = opts.ctx?.mcpManager ?? opts.ctx?.get?.('mcpManager');
    }
    catch {
        mgr = undefined;
    }
    if (!mgr || typeof mgr.probe !== 'function')
        return null;
    try {
        const raw = await mgr.probe(serverName, {
            signal: opts.signal,
            timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        });
        // Normalize a few common shapes without trusting private fields.
        const ok = !!(raw && typeof raw === 'object' && raw.ok === true);
        if (ok) {
            return {
                ok: true,
                message: 'Connected',
                durationMs: Number(raw.durationMs ?? now() - started),
                capability: 'mcpManager.probe',
                capabilityVerified: true,
                serverInfo: raw.serverInfo,
                toolNames: Array.isArray(raw.toolNames)
                    ? raw.toolNames.slice(0, MAX_TOOL_NAMES)
                    : undefined,
                tools: Array.isArray(raw.tools)
                    ? sanitizeMcpObservable(raw.tools.slice(0, MAX_TOOL_NAMES))
                    : Array.isArray(raw.toolNames)
                        ? raw.toolNames
                            .slice(0, MAX_TOOL_NAMES)
                            .map((n) => ({ name: String(n) }))
                        : undefined,
                truncated: !!raw.truncated,
                closeConfirmed: raw.closeConfirmed,
                cleanupError: raw.cleanupError
                    ? safeText(raw.cleanupError)
                    : undefined,
            };
        }
        return {
            ok: false,
            stage: raw?.stage || 'connect',
            message: safeText(raw?.message || 'Connection test failed'),
            durationMs: Number(raw?.durationMs ?? now() - started),
            capability: 'mcpManager.probe',
            capabilityVerified: true,
            closeConfirmed: raw?.closeConfirmed,
            cleanupError: raw?.cleanupError
                ? safeText(raw.cleanupError)
                : undefined,
        };
    }
    catch (err) {
        return {
            ok: false,
            stage: 'connect',
            message: safeText(err),
            durationMs: now() - started,
            capability: 'mcpManager.probe',
            capabilityVerified: true,
        };
    }
}
async function tryDshMcpClientProbe(config, opts, started) {
    try {
        // Dynamic import: installed version may not export probeServer.
        const optionalHostPackage = '@deepseek-ai/dsh-mcp-client';
        const mod = await import(optionalHostPackage).catch(() => null);
        if (!mod || typeof mod.probeServer !== 'function')
            return null;
        // probeServer(ctx, config, options) in current source; may differ in installed builds.
        const probeConfig = mapToProbeConfig(config);
        const raw = await mod.probeServer(opts.ctx ?? { logger: console }, probeConfig, {
            timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
            maxPages: opts.maxPages ?? MAX_PAGES,
            maxToolNames: opts.maxToolNames ?? MAX_TOOL_NAMES,
            signal: opts.signal,
        });
        const ok = !!(raw && raw.ok === true);
        if (ok) {
            return {
                ok: true,
                message: 'Connected',
                durationMs: Number(raw.durationMs ?? now() - started),
                capability: 'dsh-mcp-client.probeServer',
                capabilityVerified: true,
                serverInfo: raw.serverInfo,
                toolNames: Array.isArray(raw.toolNames)
                    ? raw.toolNames.slice(0, MAX_TOOL_NAMES)
                    : undefined,
                tools: Array.isArray(raw.tools)
                    ? sanitizeMcpObservable(raw.tools.slice(0, MAX_TOOL_NAMES))
                    : Array.isArray(raw.toolNames)
                        ? raw.toolNames
                            .slice(0, MAX_TOOL_NAMES)
                            .map((n) => ({ name: String(n) }))
                        : undefined,
                truncated: !!raw.truncated,
                closeConfirmed: raw.closeConfirmed,
                cleanupError: raw.cleanupError ? safeText(raw.cleanupError) : undefined,
            };
        }
        return {
            ok: false,
            stage: raw?.stage || 'connect',
            message: safeText(raw?.message || 'Connection test failed'),
            durationMs: Number(raw?.durationMs ?? now() - started),
            capability: 'dsh-mcp-client.probeServer',
            capabilityVerified: true,
            closeConfirmed: raw?.closeConfirmed,
            cleanupError: raw?.cleanupError ? safeText(raw.cleanupError) : undefined,
        };
    }
    catch {
        return null; // not a verified usable capability in this runtime
    }
}
function mapToProbeConfig(config) {
    const common = {
        serverName: config.serverName,
        toolCallTimeoutMs: config.toolCallTimeoutMs ?? 60_000,
        startupTimeoutMs: config.startupTimeoutMs,
        closeTimeoutMs: config.closeTimeoutMs ?? 5_000,
        expandTemplates: !!config.expandTemplates,
        failOnStartupError: !!config.failOnStartupError,
        maxInstructionBytes: config.maxInstructionBytes,
        reconnect: config.reconnect,
    };
    if (config.transport === 'streamable-http') {
        return {
            transport: 'streamable-http',
            ...common,
            url: config.url || '',
            headers: config.headers || {},
        };
    }
    return {
        transport: 'stdio',
        ...common,
        command: config.command || '',
        args: config.args || [],
        env: config.env || {},
        cwd: config.cwd || '',
    };
}
async function directSdkProbe(config, opts, started) {
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), Math.max(1, timeoutMs));
    const onAbort = () => controller.abort(opts.signal?.reason);
    if (opts.signal) {
        if (opts.signal.aborted)
            controller.abort(opts.signal.reason);
        else
            opts.signal.addEventListener('abort', onAbort, { once: true });
    }
    let transport;
    let client;
    let stage = 'connect';
    try {
        // Installed SDK paths (verified present in repo node_modules).
        const [{ Client }, stdioMod, httpMod] = await Promise.all([
            import('@modelcontextprotocol/sdk/client/index.js'),
            import('@modelcontextprotocol/sdk/client/stdio.js').catch(() => null),
            import('@modelcontextprotocol/sdk/client/streamableHttp.js').catch(() => null),
        ]);
        if (config.transport === 'streamable-http') {
            if (!httpMod?.StreamableHTTPClientTransport)
                return unavailable('Streamable HTTP client transport unavailable', 'capability', started);
            if (!config.url)
                return {
                    ok: false,
                    stage: 'config',
                    message: 'Missing URL',
                    durationMs: now() - started,
                    capability: 'direct-mcp-sdk',
                    capabilityVerified: true,
                };
            transport = new httpMod.StreamableHTTPClientTransport(new URL(config.url), {
                requestInit: config.headers ? { headers: config.headers } : undefined,
            });
        }
        else {
            if (!stdioMod?.StdioClientTransport)
                return unavailable('Stdio client transport unavailable', 'capability', started);
            if (!config.command)
                return {
                    ok: false,
                    stage: 'config',
                    message: 'Missing command',
                    durationMs: now() - started,
                    capability: 'direct-mcp-sdk',
                    capabilityVerified: true,
                };
            transport = new stdioMod.StdioClientTransport({
                command: config.command,
                args: config.args || [],
                env: config.env,
                cwd: config.cwd || undefined,
                stderr: 'ignore',
            });
        }
        client = new Client({ name: 'waycraft-mcp-probe', version: '1.0.0' }, { capabilities: {} });
        await client.connect(transport, { signal: controller.signal });
        stage = 'list';
        const serverInfo = typeof client.getServerVersion === 'function'
            ? client.getServerVersion()
            : undefined;
        const tools = [];
        let truncated = false;
        let cursor;
        const caps = typeof client.getServerCapabilities === 'function'
            ? client.getServerCapabilities()
            : undefined;
        if (caps?.tools !== undefined) {
            for (let page = 0; page < (opts.maxPages ?? MAX_PAGES); page++) {
                const res = await client.listTools(cursor ? { cursor } : undefined, {
                    signal: controller.signal,
                });
                for (const t of res?.tools || []) {
                    if (tools.length >= (opts.maxToolNames ?? MAX_TOOL_NAMES)) {
                        truncated = true;
                        break;
                    }
                    tools.push(sanitizeMcpObservable({
                        name: String(t.name),
                        description: t.description ? String(t.description) : undefined,
                        inputSchema: t.inputSchema,
                        title: t.title ? String(t.title) : undefined,
                    }));
                }
                cursor = res?.nextCursor;
                if (!cursor || truncated)
                    break;
            }
        }
        let closeConfirmed = true;
        let cleanupError;
        try {
            await client.close();
        }
        catch (e) {
            closeConfirmed = false;
            cleanupError = safeText(e);
        }
        return {
            ok: true,
            message: 'Connected',
            durationMs: now() - started,
            capability: 'direct-mcp-sdk',
            capabilityVerified: true,
            serverInfo,
            toolNames: tools.map((t) => t.name),
            tools,
            truncated,
            closeConfirmed,
            cleanupError,
        };
    }
    catch (err) {
        const msg = controller.signal.aborted && !opts.signal?.aborted
            ? `Connection test timed out after ${timeoutMs}ms`
            : safeText(err);
        let closeConfirmed = false;
        let cleanupError;
        try {
            await client?.close?.();
            closeConfirmed = true;
        }
        catch (e) {
            cleanupError = safeText(e);
        }
        try {
            await transport?.close?.();
        }
        catch { }
        return {
            ok: false,
            stage,
            message: msg,
            durationMs: now() - started,
            capability: 'direct-mcp-sdk',
            capabilityVerified: true,
            closeConfirmed,
            cleanupError,
        };
    }
    finally {
        clearTimeout(timer);
        opts.signal?.removeEventListener('abort', onAbort);
    }
}
export async function testMcpConnection(serverName, config, opts = {}) {
    const started = now();
    if (!config || typeof config !== 'object')
        return unavailable('Missing server config', 'config', started);
    // 1) Verified host capability if present.
    const mgr = await tryMcpManagerProbe(serverName, opts, started);
    if (mgr)
        return mgr;
    // 2) probeServer if present in runtime package.
    const ds = await tryDshMcpClientProbe(config, opts, started);
    if (ds)
        return ds;
    // 3) Alternative bounded mechanism (explicit, trust-gated by caller).
    return directSdkProbe(config, opts, started);
}
