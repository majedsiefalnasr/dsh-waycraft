/**
 * MCP manager V1 — read-only tool enumeration cache with freshness (#169).
 * Spec §13.2/13.3: enumerate only on explicit test/on-demand refresh; cache
 * with freshness indicators; invalidate on config/scope/policy changes; no
 * eager connections to populate UI.
 */
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { sanitizeMcpObservable } from './mcp-credentials.js';
import { reviewedConfigFingerprint } from './mcp-trust.js';
function nowIso() { return new Date().toISOString(); }
function emptyEntry(serverName, freshness = 'never', reason) {
    return { serverName, configFingerprint: '', freshness, status: freshness === 'error' ? 'error' : 'never', message: reason, tools: [], toolCount: 0, invalidatedAt: reason ? nowIso() : undefined, invalidationReason: reason };
}
async function readCache(path) {
    try {
        const text = await readFile(path, 'utf8');
        const parsed = JSON.parse(text);
        if (parsed && parsed.version === 1 && parsed.servers && typeof parsed.servers === 'object')
            return parsed;
    }
    catch { }
    return { version: 1, servers: {} };
}
async function writeAtomic(path, text) {
    await mkdir(dirname(path), { recursive: true });
    const tmp = `${path}.tmp-${process.pid}-${Math.random().toString(16).slice(2)}`;
    try {
        await writeFile(tmp, text, 'utf8');
        await rename(tmp, path);
    }
    catch (e) {
        await rm(tmp, { force: true }).catch(() => { });
        throw e;
    }
}
export class McpToolCacheStore {
    cachePath;
    writeChain = Promise.resolve();
    constructor(cachePath) {
        this.cachePath = cachePath;
    }
    get path() { return this.cachePath; }
    serialize(fn) {
        const run = this.writeChain.then(fn, fn);
        this.writeChain = run.catch(() => { });
        return run;
    }
    freshnessOf(entry, config) {
        if (!entry)
            return emptyEntry(config.serverName, 'never');
        const fp = reviewedConfigFingerprint(config);
        if (!entry.enumeratedAt && entry.status !== 'error')
            return { ...entry, serverName: config.serverName, configFingerprint: entry.configFingerprint || '', freshness: 'never', toolCount: entry.toolCount || 0, tools: entry.tools || [] };
        if (!entry.configFingerprint || entry.configFingerprint !== fp) {
            return { ...entry, freshness: 'stale', invalidationReason: entry.invalidationReason || 'config_scope_or_policy_changed' };
        }
        if (entry.freshness === 'invalidated')
            return entry;
        if (entry.status === 'error')
            return { ...entry, freshness: 'error' };
        return { ...entry, freshness: 'fresh' };
    }
    async get(serverName, config) {
        const file = await readCache(this.cachePath);
        return sanitizeMcpObservable(this.freshnessOf(file.servers[serverName], config));
    }
    async list(configsByName) {
        const file = await readCache(this.cachePath);
        const out = {};
        for (const [name, config] of Object.entries(configsByName))
            out[name] = sanitizeMcpObservable(this.freshnessOf(file.servers[name], config));
        return out;
    }
    async updateFromProbe(serverName, config, probe) {
        return this.serialize(async () => {
            const file = await readCache(this.cachePath);
            const tools = (probe.tools?.length ? probe.tools : (probe.toolNames || []).map(name => ({ name })))
                .map(t => sanitizeMcpObservable({ name: String(t.name || ''), description: t.description ? String(t.description) : undefined, inputSchema: t.inputSchema, title: t.title ? String(t.title) : undefined }))
                .filter((t) => t.name);
            const entry = {
                serverName,
                configFingerprint: reviewedConfigFingerprint(config),
                enumeratedAt: nowIso(),
                freshness: probe.ok ? 'fresh' : 'error',
                status: probe.ok ? 'ok' : 'error',
                message: sanitizeMcpObservable(probe.message),
                tools,
                toolCount: tools.length,
                truncated: !!probe.truncated,
                capability: probe.capability,
            };
            file.servers[serverName] = entry;
            await writeAtomic(this.cachePath, JSON.stringify(file, null, 2) + '\n');
            return sanitizeMcpObservable(entry);
        });
    }
    async invalidate(serverName, reason) {
        return this.serialize(async () => {
            const file = await readCache(this.cachePath);
            const prev = file.servers[serverName];
            if (!prev || (!prev.enumeratedAt && prev.status !== 'error')) {
                // No cached enumeration to invalidate; keep never state (no eager semantics).
                if (prev)
                    delete file.servers[serverName];
                await writeAtomic(this.cachePath, JSON.stringify(file, null, 2) + '\n');
                return;
            }
            file.servers[serverName] = {
                ...prev,
                serverName,
                freshness: 'invalidated',
                invalidatedAt: nowIso(),
                invalidationReason: String(reason || 'invalidated'),
            };
            await writeAtomic(this.cachePath, JSON.stringify(file, null, 2) + '\n');
        });
    }
    async remove(serverName) {
        return this.serialize(async () => {
            const file = await readCache(this.cachePath);
            delete file.servers[serverName];
            await writeAtomic(this.cachePath, JSON.stringify(file, null, 2) + '\n');
        });
    }
}
export function searchMcpTools(tools, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q)
        return tools;
    return tools.filter(t => [t.name, t.title, t.description].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
}
export function resolveMcpToolCachePath(opts) {
    // If config path is provided (e.g. tests use DSH_CORDIS_PATCH_PATH temp dirs),
    // keep cache beside that profile's cordis config to avoid polluting real state.
    const configPath = opts?.configPath || process.env.DSH_CORDIS_PATCH_PATH;
    if (configPath)
        return join(dirname(configPath), 'waycraft-mcp', 'tool-cache.json');
    const home = opts?.home || process.env.DSH_HOME || join(process.env.HOME || '/tmp', '.dsh');
    const profile = opts?.profile || process.env.DSH_PROFILE || 'desktop';
    // Waycraft-owned metadata cache (separate from DSH config). No secrets.
    return join(home, 'profiles', profile, 'waycraft-mcp', 'tool-cache.json');
}
