/**
 * MCP manager V1 — JSON configuration import (#171).
 * Spec §14.2: parse, validate, normalize, preview, duplicate detection,
 * credential reference validation, conflict handling, explicit registration approval.
 * Supported explicitly defined verified formats only. No auto-execution.
 * V1 single scope only (no project runtime scope selection).
 */
import { normalizeMcpServerConfig, validateMcpServerConfig } from './mcp-schema.js';
import { sanitizeMcpObservable } from './mcp-credentials.js';
function isRecord(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}
function collectCredentialRefs(value, out = new Set()) {
    if (typeof value === 'string') {
        const re = /\$\{credential:([^}]+)\}/g;
        let m;
        while ((m = re.exec(value)))
            out.add(m[1]);
        return [...out];
    }
    if (Array.isArray(value))
        value.forEach((v) => collectCredentialRefs(v, out));
    else if (isRecord(value))
        Object.values(value).forEach((v) => collectCredentialRefs(v, out));
    return [...out];
}
function normalizeScopeForV1(config) {
    // V1 has no project runtime scope selection. Preserve unknown/unverified scope field
    // only when safe; do not interpret project scope. Report single-scope behavior.
    const rawScope = config.scope;
    if (rawScope == null)
        return { config };
    if (typeof rawScope === 'string' && /project|workspace|local/i.test(rawScope)) {
        const next = { ...config };
        delete next.scope;
        return { config: next, note: 'Project scope selection is not supported in V1; imported entry uses V1 single scope.' };
    }
    return { config, note: 'V1 uses a single verified scope; scope metadata was preserved without runtime project isolation.' };
}
function inferTransportForImport(config) {
    if (config.transport === 'stdio' || config.transport === 'streamable-http')
        return config;
    if (typeof config.url === 'string' && config.url)
        return { ...config, transport: 'streamable-http' };
    if (typeof config.command === 'string' && config.command)
        return { ...config, transport: 'stdio' };
    return config;
}
function detectFormat(raw) {
    if (!isRecord(raw))
        return { error: 'Unsupported import structure: JSON root must be an object.' };
    if (raw.waycraftMcpImport === 1 && Array.isArray(raw.servers))
        return { format: 'waycraft-mcp-v1' };
    if (isRecord(raw.mcpServers))
        return { format: 'mcpServers-map' };
    return { error: 'Unsupported import structure. Supported formats: Waycraft MCP export {"waycraftMcpImport":1,"servers":[...]} or MCP servers map {"mcpServers":{"name":{...}}}.' };
}
function extractRawServers(raw, format) {
    if (format === 'waycraft-mcp-v1') {
        const servers = raw.servers;
        return servers.map((item, i) => {
            if (!isRecord(item))
                return { config: item, path: `servers[${i}]` };
            const cfg = isRecord(item.config) ? item.config : item;
            const serverName = typeof cfg.serverName === 'string' ? cfg.serverName : (typeof item.serverName === 'string' ? item.serverName : undefined);
            return { serverName, config: cfg, path: `servers[${i}]` };
        });
    }
    const map = raw.mcpServers;
    return Object.entries(map).map(([name, cfg]) => ({ serverName: name, config: isRecord(cfg) ? { serverName: name, ...cfg } : cfg, path: `mcpServers.${name}` }));
}
export function previewMcpImport(raw, opts = {}) {
    const existing = new Set((opts.existingServerNames || []).map((s) => s.trim()).filter(Boolean));
    const base = () => ({
        issues: [],
        stats: { total: 0, valid: 0, invalid: 0, conflicts: 0, credentialRefs: 0 },
        scope: { mode: 'single-v1', projectScopeSupported: false, note: 'V1 uses a single verified scope. Project runtime scope selection is not supported.' },
    });
    const detected = detectFormat(raw);
    if (!detected.format) {
        return sanitizeMcpObservable({ ok: false, candidates: [], ...base(), issues: [{ path: '', message: detected.error || 'Unsupported import structure', code: 'unsupported' }] });
    }
    const items = extractRawServers(raw, detected.format);
    const candidates = [];
    const seenInImport = new Set();
    for (const item of items) {
        const norm = normalizeMcpServerConfig(item.config);
        let config = norm.value;
        const issues = [...norm.issues];
        let scopeNote;
        if (config) {
            config = inferTransportForImport(config);
            const scoped = normalizeScopeForV1(config);
            config = scoped.config;
            scopeNote = scoped.note;
        }
        if (!config) {
            candidates.push(sanitizeMcpObservable({ serverName: item.serverName || '(invalid)', format: detected.format, config: (item.config || {}), issues, valid: false, credentialRefs: collectCredentialRefs(item.config), unknownKeys: norm.preservedUnknownKeys || [] }));
            continue;
        }
        const validation = validateMcpServerConfig(config, { mode: 'create' });
        issues.push(...validation.issues);
        const finalConfig = validation.value || config;
        const name = finalConfig.serverName || item.serverName || '(unnamed)';
        let conflict;
        if (name && existing.has(name))
            conflict = { serverName: name, kind: 'duplicate_existing', message: `Server already exists: ${name}` };
        else if (name && seenInImport.has(name))
            conflict = { serverName: name, kind: 'duplicate_import', message: `Duplicate server name in import: ${name}` };
        if (name)
            seenInImport.add(name);
        const credentialRefs = collectCredentialRefs(finalConfig);
        candidates.push(sanitizeMcpObservable({ serverName: name, format: detected.format, config: finalConfig, issues, valid: validation.ok, credentialRefs, conflict, scopeNote, unknownKeys: norm.preservedUnknownKeys || [] }));
    }
    const stats = {
        total: candidates.length,
        valid: candidates.filter((c) => c.valid && !c.conflict).length,
        invalid: candidates.filter((c) => !c.valid).length,
        conflicts: candidates.filter((c) => !!c.conflict).length,
        credentialRefs: candidates.filter((c) => c.credentialRefs.length > 0).length,
    };
    return sanitizeMcpObservable({ ok: true, format: detected.format, candidates, issues: [], stats, scope: base().scope });
}
/** Explicit registration approval. Never executes imported servers. */
export async function registerMcpImport(preview, approvals, deps) {
    if (!preview.ok)
        return { ok: false, results: [], stats: { registered: 0, replaced: 0, skipped: 0, rejected: 0, failed: 1 } };
    const approvalByName = new Map(approvals.filter((a) => a && typeof a.serverName === 'string').map((a) => [a.serverName, a]));
    const existing = new Set(await deps.existingServerNames());
    const results = [];
    for (const candidate of preview.candidates) {
        const approval = approvalByName.get(candidate.serverName);
        if (!approval || !approval.approved) {
            results.push({ serverName: candidate.serverName, status: 'skipped', message: 'Import candidate was not explicitly approved for registration.' });
            continue;
        }
        if (!candidate.valid) {
            results.push({ serverName: candidate.serverName, status: 'rejected', message: 'Candidate failed validation.', code: 'validation' });
            continue;
        }
        const conflict = existing.has(candidate.serverName) ? 'duplicate_existing' : candidate.conflict?.kind;
        if (conflict) {
            if (approval.onConflict === 'replace' && deps.replace) {
                const r = await deps.replace(candidate.serverName, candidate.config);
                if (r.ok) {
                    existing.add(candidate.serverName);
                    results.push({ serverName: candidate.serverName, status: 'replaced' });
                }
                else
                    results.push({ serverName: candidate.serverName, status: 'failed', message: r.message, code: r.code });
            }
            else {
                results.push({ serverName: candidate.serverName, status: 'skipped', message: conflict === 'duplicate_import' ? 'Duplicate name in import; not registered.' : 'Server already exists; explicit conflict resolution required.', code: 'conflict' });
            }
            continue;
        }
        const r = await deps.create(candidate.config);
        if (r.ok) {
            existing.add(candidate.serverName);
            results.push({ serverName: candidate.serverName, status: 'registered' });
        }
        else
            results.push({ serverName: candidate.serverName, status: r.code === 'exists' ? 'skipped' : 'failed', message: r.message, code: r.code });
    }
    const stats = {
        registered: results.filter((r) => r.status === 'registered').length,
        replaced: results.filter((r) => r.status === 'replaced').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
        rejected: results.filter((r) => r.status === 'rejected').length,
        failed: results.filter((r) => r.status === 'failed').length,
    };
    return { ok: stats.failed === 0, results, stats };
}
