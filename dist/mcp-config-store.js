import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseDocument } from 'yaml';
import { normalizeMcpServerConfig, validateMcpServerConfig, } from './mcp-schema.js';
import { sanitizeMcpObservable } from './mcp-credentials.js';
import { applyTrustApprovalMeta, detectMaterialChange, emptyTrust, invalidateTrustMeta, reviewedConfigFingerprint, trustFromRowMeta } from './mcp-trust.js';
const MCP_CLIENT_NAME = '@deepseek-ai/dsh-mcp-client';
function isRecord(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}
export function fingerprintOf(text) {
    return createHash('sha256').update(text).digest('hex');
}
function isMcpClientRow(row) {
    if (!isRecord(row))
        return false;
    if (row.name === MCP_CLIENT_NAME)
        return true;
    const config = row.config;
    return isRecord(config) && typeof config.serverName === 'string';
}
function ownershipOf(row) {
    const meta = row['x-waycraft-mcp'];
    if (isRecord(meta)) {
        const owner = meta.owner;
        if (owner === 'waycraft')
            return 'waycraft';
        if (typeof owner === 'string' && owner && owner !== 'dsh' && owner !== 'preexisting-dsh')
            return 'other';
    }
    // #170: pre-existing DSH/mcp-client rows without Waycraft ownership metadata.
    return 'preexisting-dsh';
}
function trashStateFromRow(row, ownership) {
    const meta = row['x-waycraft-mcp'];
    if (!isRecord(meta) || !isRecord(meta.trash) || meta.trash.trashed !== true)
        return undefined;
    const t = meta.trash;
    return {
        trashed: true,
        trashedAt: typeof t.trashedAt === 'string' ? t.trashedAt : undefined,
        trashedBy: typeof t.trashedBy === 'string' ? t.trashedBy : undefined,
        provenance: isRecord(t.provenance) ? { ownership, hadWaycraftMeta: t.provenance.hadWaycraftMeta === true, scope: t.provenance.scope, disabledBeforeTrash: typeof t.provenance.disabledBeforeTrash === 'boolean' ? t.provenance.disabledBeforeTrash : undefined } : { ownership, hadWaycraftMeta: true },
        operationallyInactive: true,
        limitation: typeof t.limitation === 'string' ? t.limitation : undefined,
    };
}
function toEntry(row) {
    const configRaw = isRecord(row.config) ? { ...row.config } : {};
    const serverName = typeof configRaw.serverName === 'string' ? configRaw.serverName.trim() : '';
    if (!serverName)
        return null;
    const norm = normalizeMcpServerConfig({ transport: configRaw.transport ?? 'stdio', ...configRaw, serverName });
    const config = (norm.value ?? { serverName, transport: 'stdio', ...configRaw });
    const ownership = ownershipOf(row);
    const trust = trustFromRowMeta(row['x-waycraft-mcp'], config);
    return {
        id: typeof row.id === 'string' ? row.id : `mcp-${serverName}`,
        rowName: typeof row.name === 'string' ? row.name : undefined,
        serverName,
        config,
        disabled: typeof row.disabled === 'boolean' ? row.disabled : undefined,
        ownership,
        trust,
        reviewedConfigFingerprint: reviewedConfigFingerprint(config),
        trash: trashStateFromRow(row, ownership),
        rawRow: row,
    };
}
async function readText(path) {
    try {
        const [text, st] = await Promise.all([readFile(path, 'utf8'), stat(path)]);
        return { text, mtimeMs: st.mtimeMs };
    }
    catch (err) {
        if (err?.code === 'ENOENT')
            return null;
        throw err;
    }
}
async function writeAtomic(path, text) {
    await mkdir(dirname(path), { recursive: true });
    const tmp = `${path}.tmp-${process.pid}-${randomBytes(6).toString('hex')}`;
    try {
        await writeFile(tmp, text, 'utf8');
        await rename(tmp, path);
    }
    catch (err) {
        await rm(tmp, { force: true }).catch(() => { });
        throw err;
    }
}
function makeRow(serverName, config, ownership) {
    const row = {
        id: `mcp-${serverName.replace(/[^a-zA-Z0-9._-]+/g, '-')}`,
        name: MCP_CLIENT_NAME,
        config: { ...config, serverName },
    };
    // #167: saving does not imply trust. New/reviewed rows start untrusted.
    if (ownership === 'waycraft')
        row['x-waycraft-mcp'] = { owner: 'waycraft', version: 1, trust: emptyTrust('save_does_not_imply_trust') };
    return row;
}
function dump(rows) {
    const fresh = parseDocument('[]\n');
    fresh.contents = fresh.createNode(rows);
    const text = String(fresh);
    return text.endsWith('\n') ? text : text + '\n';
}
function getServerName(row) {
    if (!isMcpClientRow(row) || !isRecord(row.config))
        return null;
    const n = row.config.serverName;
    return typeof n === 'string' && n.trim() ? n.trim() : null;
}
function hasCredentialRef(value) {
    if (typeof value === 'string')
        return /\$\{credential:[^}]+\}/.test(value);
    if (Array.isArray(value))
        return value.some(hasCredentialRef);
    if (isRecord(value))
        return Object.values(value).some(hasCredentialRef);
    return false;
}
export class McpCordisConfigStore {
    configPath;
    writeChains;
    constructor(opts) {
        this.configPath = opts.configPath;
        this.writeChains = opts.writeChains ?? new Map();
    }
    async serialize(action) {
        const prev = this.writeChains.get(this.configPath) ?? Promise.resolve();
        let release;
        const gate = new Promise((r) => (release = r));
        const chain = prev.then(() => gate);
        this.writeChains.set(this.configPath, chain);
        await prev.catch(() => { });
        try {
            return await action();
        }
        finally {
            release();
            if (this.writeChains.get(this.configPath) === chain)
                this.writeChains.delete(this.configPath);
        }
    }
    async snapshot() {
        const file = await readText(this.configPath);
        if (!file)
            return { fingerprint: fingerprintOf(''), servers: [], trashedServers: [], mtimeMs: null, text: '' };
        const doc = parseDocument(file.text);
        if (doc.errors?.length)
            throw Object.assign(new Error('Failed to parse MCP config'), { code: 'parse', errors: doc.errors });
        const arr = doc.toJS();
        const rows = Array.isArray(arr) ? arr : [];
        const all = rows.filter(isMcpClientRow).map((r) => toEntry(r)).filter(Boolean);
        const trashedServers = all.filter((s) => s.trash?.trashed);
        const servers = all.filter((s) => !s.trash?.trashed);
        return { fingerprint: fingerprintOf(file.text), servers, trashedServers, mtimeMs: file.mtimeMs, text: file.text };
    }
    async list() {
        try {
            const snap = await this.snapshot();
            return { ok: true, fingerprint: snap.fingerprint, servers: sanitizeMcpObservable(snap.servers), trashedServers: sanitizeMcpObservable(snap.trashedServers) };
        }
        catch (err) {
            return { ok: false, code: err?.code === 'parse' ? 'parse' : 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) };
        }
    }
    async listTrash() {
        return this.list();
    }
    conflict(actual) {
        return { ok: false, code: 'conflict', message: 'Config changed externally; reload before saving.', fingerprint: fingerprintOf(actual) };
    }
    async commit(rows, readFingerprint, expectedFingerprint) {
        const next = dump(rows);
        // Commit-time conflict check: protect lost updates/external edits.
        const current = await readText(this.configPath);
        const currentText = current?.text ?? '';
        const currentFp = fingerprintOf(currentText);
        if (expectedFingerprint && expectedFingerprint !== currentFp)
            return this.conflict(currentText);
        if (currentFp !== readFingerprint)
            return this.conflict(currentText);
        await writeAtomic(this.configPath, next);
        const snap = await this.snapshot();
        return { ok: true, fingerprint: snap.fingerprint, servers: sanitizeMcpObservable(snap.servers), trashedServers: sanitizeMcpObservable(snap.trashedServers) };
    }
    async create(input, expectedFingerprint) {
        return this.serialize(() => this.mutateCreate(input, expectedFingerprint));
    }
    async mutateCreate(input, expectedFingerprint) {
        try {
            const validation = validateMcpServerConfig(input, { mode: 'create' });
            if (!validation.ok || !validation.value)
                return { ok: false, code: 'validation', message: 'Invalid server config', issues: validation.issues };
            const file = await readText(this.configPath);
            const text = file?.text ?? '[]\n';
            const readFp = fingerprintOf(text);
            if (expectedFingerprint && expectedFingerprint !== readFp)
                return this.conflict(text);
            const doc = parseDocument(text);
            if (doc.errors?.length)
                return { ok: false, code: 'parse', message: 'Failed to parse config' };
            const js = doc.toJS();
            if (!Array.isArray(js))
                return { ok: false, code: 'parse', message: 'Config root must be an array' };
            const rows = js.slice();
            const existing = rows.find((r) => getServerName(r) === validation.value.serverName);
            if (existing) {
                const meta = isRecord(existing['x-waycraft-mcp']) ? existing['x-waycraft-mcp'] : null;
                if (isRecord(meta?.trash) && meta.trash.trashed === true) {
                    return { ok: false, code: 'exists', message: `Server exists in trash; restore it explicitly before reusing the name: ${validation.value.serverName}`, fingerprint: readFp };
                }
                return { ok: false, code: 'exists', message: `Server already exists: ${validation.value.serverName}`, fingerprint: readFp };
            }
            rows.push(makeRow(validation.value.serverName, validation.value, 'waycraft'));
            const result = await this.commit(rows, readFp, expectedFingerprint);
            if (result.ok) {
                const sv = result.servers?.find((s) => s.serverName === validation.value.serverName);
                if (sv)
                    result.server = sanitizeMcpObservable(sv);
            }
            return result;
        }
        catch (err) {
            return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) };
        }
    }
    async update(serverName, patch, expectedFingerprint) {
        return this.serialize(() => this.mutateUpdate(serverName, patch, expectedFingerprint));
    }
    async mutateUpdate(serverName, patch, expectedFingerprint) {
        try {
            const file = await readText(this.configPath);
            const text = file?.text ?? '[]\n';
            const readFp = fingerprintOf(text);
            if (expectedFingerprint && expectedFingerprint !== readFp)
                return this.conflict(text);
            const doc = parseDocument(text);
            if (doc.errors?.length)
                return { ok: false, code: 'parse', message: 'Failed to parse config' };
            const rows = doc.toJS().slice();
            let found = false;
            const nextRows = rows.map((row) => {
                if (!isMcpClientRow(row))
                    return row;
                const r = row;
                const cfg = isRecord(r.config) ? r.config : {};
                if (cfg.serverName !== serverName)
                    return row;
                found = true;
                const meta = isRecord(r['x-waycraft-mcp']) ? r['x-waycraft-mcp'] : null;
                if (isRecord(meta?.trash) && meta.trash.trashed === true)
                    throw Object.assign(new Error('trashed'), { trashed: true });
                const merged = { ...cfg, ...patch, serverName };
                const validation = validateMcpServerConfig(merged, { mode: 'update', existingServerName: serverName });
                if (!validation.ok || !validation.value)
                    throw Object.assign(new Error('validation'), { validation });
                const nextConfig = { ...cfg, ...validation.value, serverName };
                // #167: material changes invalidate trust; non-material saves preserve existing trust if fingerprint unchanged.
                const material = detectMaterialChange(cfg, nextConfig);
                let nextMeta = isRecord(r['x-waycraft-mcp']) ? { ...r['x-waycraft-mcp'] } : { owner: 'waycraft', version: 1 };
                if (material.changed)
                    nextMeta = invalidateTrustMeta(nextMeta, 'material_change');
                return { ...r, config: nextConfig, 'x-waycraft-mcp': nextMeta };
            });
            if (!found)
                return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: readFp };
            const result = await this.commit(nextRows, readFp, expectedFingerprint);
            if (result.ok) {
                const sv = result.servers?.find((s) => s.serverName === serverName);
                if (sv)
                    result.server = sanitizeMcpObservable(sv);
            }
            return result;
        }
        catch (err) {
            if (err?.trashed)
                return { ok: false, code: 'blocked', message: `Server is in trash and cannot be modified; restore explicitly first: ${serverName}` };
            if (err?.validation)
                return { ok: false, code: 'validation', message: 'Invalid server config', issues: sanitizeMcpObservable(err.validation.issues) };
            return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) };
        }
    }
    /**
     * Backward-compatible permanent delete path (#165 behavior). #173 requires explicit
     * confirmation for permanent delete; callers should use `permanentDelete` for the
     * destructive Trash workflow. This method remains for compatibility and existing tests.
     */
    async remove(serverName, expectedFingerprint) {
        return this.serialize(() => this.mutatePermanentDelete(serverName, expectedFingerprint, { confirm: true, legacyRemove: true }));
    }
    async moveToTrash(serverName, expectedFingerprint) {
        return this.serialize(() => this.mutateMoveToTrash(serverName, expectedFingerprint));
    }
    async mutateMoveToTrash(serverName, expectedFingerprint) {
        try {
            const file = await readText(this.configPath);
            const text = file?.text ?? '[]\n';
            const readFp = fingerprintOf(text);
            if (expectedFingerprint && expectedFingerprint !== readFp)
                return this.conflict(text);
            const doc = parseDocument(text);
            if (doc.errors?.length)
                return { ok: false, code: 'parse', message: 'Failed to parse config' };
            const rows = doc.toJS().slice();
            let found = false;
            let limitation;
            const nextRows = rows.map((row) => {
                if (!isMcpClientRow(row))
                    return row;
                const r = { ...row };
                if (getServerName(r) !== serverName)
                    return row;
                found = true;
                const ownership = ownershipOf(r);
                const existingMeta = isRecord(r['x-waycraft-mcp']) ? r['x-waycraft-mcp'] : null;
                if (isRecord(existingMeta?.trash) && existingMeta.trash.trashed === true)
                    throw Object.assign(new Error('already_trashed'), { already: true });
                if (ownership === 'other') {
                    // #173: safe trash semantics may be limited for externally owned entries.
                    // Define supported behavior: block destructive mutation and document limitation.
                    throw Object.assign(new Error('ownership'), { ownership, limitation: 'Externally owned MCP entry cannot be safely moved to Waycraft trash without risking ownership/conflict; remove or manage it via its owning component.' });
                }
                limitation = ownership === 'preexisting-dsh'
                    ? 'Entry is marked disabled in persisted config to make it operationally inactive; pre-existing DSH runtime behavior can only be fully stopped through verified DSH mechanisms.'
                    : 'Entry is marked disabled in persisted config to make it operationally inactive where supported.';
                const meta = existingMeta ? { ...existingMeta } : { owner: 'waycraft', version: 1 };
                meta.trash = {
                    trashed: true,
                    trashedAt: new Date().toISOString(),
                    trashedBy: 'waycraft-owner',
                    provenance: { ownership, hadWaycraftMeta: !!existingMeta, scope: isRecord(r.config) ? r.config.scope : undefined, disabledBeforeTrash: typeof r.disabled === 'boolean' ? r.disabled : undefined },
                    operationallyInactive: true,
                    limitation,
                };
                // Operational, not cosmetic: set disabled flag (representable/unverified runtime field)
                // and preserve config/credentials/policies/trust/unknown fields for restore.
                r.disabled = true;
                r['x-waycraft-mcp'] = meta;
                return r;
            });
            if (!found)
                return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: readFp };
            const result = await this.commit(nextRows, readFp, expectedFingerprint);
            if (result.ok) {
                const sv = [...(result.trashedServers || []), ...(result.servers || [])].find((s) => s.serverName === serverName);
                if (sv)
                    result.server = sanitizeMcpObservable(sv);
                result.limitation = limitation;
            }
            return result;
        }
        catch (err) {
            if (err?.already)
                return { ok: false, code: 'blocked', message: `Server is already in trash: ${serverName}` };
            if (err?.ownership)
                return { ok: false, code: 'ownership', message: 'Safe trash semantics are not supported for this externally owned entry.', limitation: sanitizeMcpObservable(err.limitation) };
            return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) };
        }
    }
    async restore(serverName, expectedFingerprint) {
        return this.serialize(() => this.mutateRestore(serverName, expectedFingerprint));
    }
    async mutateRestore(serverName, expectedFingerprint) {
        try {
            const file = await readText(this.configPath);
            const text = file?.text ?? '[]\n';
            const readFp = fingerprintOf(text);
            if (expectedFingerprint && expectedFingerprint !== readFp)
                return this.conflict(text);
            const doc = parseDocument(text);
            if (doc.errors?.length)
                return { ok: false, code: 'parse', message: 'Failed to parse config' };
            const rows = doc.toJS().slice();
            let found = false;
            const activeNames = new Set(rows.map(getServerName).filter((n) => !!n));
            const nextRows = rows.map((row) => {
                if (!isMcpClientRow(row))
                    return row;
                const r = { ...row };
                if (getServerName(r) !== serverName)
                    return row;
                found = true;
                const meta = isRecord(r['x-waycraft-mcp']) ? { ...r['x-waycraft-mcp'] } : null;
                if (!isRecord(meta?.trash) || meta.trash.trashed !== true)
                    throw Object.assign(new Error('not_trashed'), { notTrashed: true });
                // #173: revalidate identity conflicts.
                const otherActive = [...activeNames].filter((n) => n === serverName).length > 1; // should not happen; defensive
                if (otherActive)
                    throw Object.assign(new Error('conflict_name'), { conflictName: true });
                // Validate current config still parses; credential refs remain refs (no plaintext recovery needed).
                const validation = validateMcpServerConfig(isRecord(r.config) ? r.config : {}, { mode: 'update', existingServerName: serverName });
                if (!validation.ok)
                    throw Object.assign(new Error('validation'), { validation });
                const restoredMeta = { ...meta };
                const prov = isRecord(meta.trash.provenance) ? meta.trash.provenance : {};
                delete restoredMeta.trash;
                // #173: default to non-running/disabled unless approved policy says otherwise.
                r.disabled = typeof prov.disabledBeforeTrash === 'boolean' ? prov.disabledBeforeTrash : true;
                // #173: trust requirements revalidated by invalidation; restoring config does not auto-approve trust.
                restoredMeta.trust = invalidateTrustMeta(restoredMeta, 'restored_requires_trust_revalidation');
                r['x-waycraft-mcp'] = restoredMeta;
                return r;
            });
            if (!found)
                return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: readFp };
            const result = await this.commit(nextRows, readFp, expectedFingerprint);
            if (result.ok) {
                const sv = result.servers?.find((s) => s.serverName === serverName);
                if (sv)
                    result.server = sanitizeMcpObservable(sv);
            }
            return result;
        }
        catch (err) {
            if (err?.notTrashed)
                return { ok: false, code: 'blocked', message: `Server is not in trash: ${serverName}` };
            if (err?.conflictName)
                return { ok: false, code: 'conflict', message: `Restore blocked by identity conflict: ${serverName}` };
            if (err?.validation)
                return { ok: false, code: 'validation', message: 'Cannot restore server: configuration or credential reference validation failed. Review and re-save before restore.', issues: sanitizeMcpObservable(err.validation.issues) };
            return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) };
        }
    }
    async permanentDelete(serverName, expectedFingerprint, opts) {
        return this.serialize(() => this.mutatePermanentDelete(serverName, expectedFingerprint, { confirm: opts?.confirm === true }));
    }
    async mutatePermanentDelete(serverName, expectedFingerprint, opts) {
        try {
            if (!opts?.confirm)
                return { ok: false, code: 'confirm_required', message: 'Permanent delete requires explicit confirmation.' };
            const file = await readText(this.configPath);
            const text = file?.text ?? '[]\n';
            const readFp = fingerprintOf(text);
            if (expectedFingerprint && expectedFingerprint !== readFp)
                return this.conflict(text);
            const doc = parseDocument(text);
            if (doc.errors?.length)
                return { ok: false, code: 'parse', message: 'Failed to parse config' };
            const rows = doc.toJS();
            const target = rows.find((row) => getServerName(row) === serverName);
            if (!target)
                return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: readFp };
            const ownership = ownershipOf(target);
            let limitation;
            if (ownership === 'other') {
                limitation = 'Externally owned MCP entry cannot be permanently deleted by Waycraft without risking ownership; supported behavior is to block deletion.';
                return { ok: false, code: 'ownership', message: 'Permanent delete blocked for externally owned entry.', limitation };
            }
            if (ownership === 'preexisting-dsh') {
                limitation = 'Deleting a pre-existing DSH MCP config row removes its persistent configuration from this profile config. Shared credential references are not deleted by Waycraft.';
            }
            else {
                limitation = 'Persistent MCP configuration removed from Waycraft/DSH config. Shared credential references are not deleted by Waycraft.';
            }
            const nextRows = rows.filter((row) => getServerName(row) !== serverName);
            const result = await this.commit(nextRows, readFp, expectedFingerprint);
            result.limitation = limitation;
            return result;
        }
        catch (err) {
            return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) };
        }
    }
    async approveTrust(serverName, expectedFingerprint) {
        return this.serialize(() => this.mutateApproveTrust(serverName, expectedFingerprint));
    }
    async mutateApproveTrust(serverName, expectedFingerprint) {
        try {
            const file = await readText(this.configPath);
            const text = file?.text ?? '[]\n';
            const readFp = fingerprintOf(text);
            if (expectedFingerprint && expectedFingerprint !== readFp)
                return this.conflict(text);
            const doc = parseDocument(text);
            if (doc.errors?.length)
                return { ok: false, code: 'parse', message: 'Failed to parse config' };
            const rows = doc.toJS().slice();
            let found = false;
            const nextRows = rows.map((row) => {
                if (!isMcpClientRow(row))
                    return row;
                const r = row;
                const cfg = isRecord(r.config) ? r.config : {};
                if (cfg.serverName !== serverName)
                    return row;
                found = true;
                const meta0 = isRecord(r['x-waycraft-mcp']) ? r['x-waycraft-mcp'] : null;
                if (isRecord(meta0?.trash) && meta0.trash.trashed === true)
                    throw Object.assign(new Error('trashed'), { trashed: true });
                const meta = applyTrustApprovalMeta(r['x-waycraft-mcp'], cfg);
                return { ...r, 'x-waycraft-mcp': meta };
            });
            if (!found)
                return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: readFp };
            const result = await this.commit(nextRows, readFp, expectedFingerprint);
            if (result.ok) {
                const sv = result.servers?.find((s) => s.serverName === serverName);
                if (sv)
                    result.server = sanitizeMcpObservable(sv);
            }
            return result;
        }
        catch (err) {
            if (err?.trashed)
                return { ok: false, code: 'blocked', message: `Server is in trash; restore explicitly before trust approval: ${serverName}` };
            return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) };
        }
    }
    async trustStatus(serverName) {
        try {
            const snap = await this.snapshot();
            const server = [...snap.servers, ...snap.trashedServers].find((s) => s.serverName === serverName);
            if (!server)
                return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: snap.fingerprint };
            return { ok: true, fingerprint: snap.fingerprint, server: sanitizeMcpObservable(server) };
        }
        catch (err) {
            return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) };
        }
    }
}
