import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseDocument } from 'yaml';
import {
  type McpServerConfig,
  normalizeMcpServerConfig,
  validateMcpServerConfig,
} from './mcp-schema.js';
import { sanitizeMcpObservable, sanitizeMcpServerEntryForSurface } from './mcp-credentials.js';
import { applyTrustApprovalMeta, detectMaterialChange, emptyTrust, invalidateTrustMeta, reviewedConfigFingerprint, trustFromRowMeta, type McpTrustApproval } from './mcp-trust.js';

const MCP_CLIENT_NAME = '@deepseek-ai/dsh-mcp-client';

export type McpServerOwnership = 'preexisting-dsh' | 'waycraft' | 'other' | 'unknown';

export interface McpServerEntry {
  id: string;
  rowName?: string;
  serverName: string;
  config: McpServerConfig;
  disabled?: boolean;
  ownership: McpServerOwnership;
  trust: McpTrustApproval;
  reviewedConfigFingerprint: string;
  rawRow: Record<string, unknown>;
}

export interface McpConfigSnapshot {
  fingerprint: string;
  servers: McpServerEntry[];
  mtimeMs: number | null;
  text: string;
}

export interface McpPersistenceResult<T = unknown> {
  ok: boolean;
  code?: 'validation' | 'conflict' | 'not_found' | 'exists' | 'io' | 'parse';
  message?: string;
  issues?: { path: string; message: string }[];
  fingerprint?: string;
  server?: McpServerEntry;
  servers?: McpServerEntry[];
  value?: T;
}

export interface McpStoreOptions {
  configPath: string;
  writeChains?: Map<string, Promise<unknown>>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function fingerprintOf(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function isMcpClientRow(row: unknown): row is Record<string, unknown> {
  if (!isRecord(row)) return false;
  if (row.name === MCP_CLIENT_NAME) return true;
  const config = row.config;
  return isRecord(config) && typeof config.serverName === 'string';
}

function ownershipOf(row: Record<string, unknown>): McpServerOwnership {
  const meta = row['x-waycraft-mcp'];
  if (isRecord(meta)) {
    const owner = meta.owner;
    if (owner === 'waycraft') return 'waycraft';
    if (typeof owner === 'string' && owner && owner !== 'dsh' && owner !== 'preexisting-dsh') return 'other';
  }
  // #170: pre-existing DSH/mcp-client rows without Waycraft ownership metadata.
  return 'preexisting-dsh';
}

function toEntry(row: Record<string, unknown>): McpServerEntry | null {
  const configRaw = isRecord(row.config) ? { ...row.config } : {};
  const serverName = typeof configRaw.serverName === 'string' ? configRaw.serverName.trim() : '';
  if (!serverName) return null;
  const norm = normalizeMcpServerConfig({ transport: configRaw.transport ?? 'stdio', ...configRaw, serverName });
  const config = (norm.value ?? ({ serverName, transport: 'stdio', ...configRaw } as McpServerConfig));
  const trust = trustFromRowMeta(row['x-waycraft-mcp'], config);
  return {
    id: typeof row.id === 'string' ? row.id : `mcp-${serverName}`,
    rowName: typeof row.name === 'string' ? row.name : undefined,
    serverName,
    config,
    disabled: typeof row.disabled === 'boolean' ? row.disabled : undefined,
    ownership: ownershipOf(row),
    trust,
    reviewedConfigFingerprint: reviewedConfigFingerprint(config),
    rawRow: row,
  };
}

async function readText(path: string): Promise<{ text: string; mtimeMs: number | null } | null> {
  try {
    const [text, st] = await Promise.all([readFile(path, 'utf8'), stat(path)]);
    return { text, mtimeMs: st.mtimeMs };
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeAtomic(path: string, text: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${randomBytes(6).toString('hex')}`;
  try {
    await writeFile(tmp, text, 'utf8');
    await rename(tmp, path);
  } catch (err) {
    await rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

function makeRow(serverName: string, config: McpServerConfig, ownership: McpServerOwnership): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: `mcp-${serverName.replace(/[^a-zA-Z0-9._-]+/g, '-')}`,
    name: MCP_CLIENT_NAME,
    config: { ...config, serverName },
  };
  // #167: saving does not imply trust. New/reviewed rows start untrusted.
  if (ownership === 'waycraft') row['x-waycraft-mcp'] = { owner: 'waycraft', version: 1, trust: emptyTrust('save_does_not_imply_trust') };
  return row;
}

function dump(rows: unknown[]): string {
  const fresh = parseDocument('[]\n');
  fresh.contents = fresh.createNode(rows) as any;
  const text = String(fresh);
  return text.endsWith('\n') ? text : text + '\n';
}

export class McpCordisConfigStore {
  private configPath: string;
  private writeChains: Map<string, Promise<unknown>>;

  constructor(opts: McpStoreOptions) {
    this.configPath = opts.configPath;
    this.writeChains = opts.writeChains ?? new Map();
  }

  private async serialize<T>(action: () => Promise<T>): Promise<T> {
    const prev = this.writeChains.get(this.configPath) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const chain = prev.then(() => gate);
    this.writeChains.set(this.configPath, chain);
    await prev.catch(() => {});
    try {
      return await action();
    } finally {
      release();
      if (this.writeChains.get(this.configPath) === chain) this.writeChains.delete(this.configPath);
    }
  }

  async snapshot(): Promise<McpConfigSnapshot> {
    const file = await readText(this.configPath);
    if (!file) return { fingerprint: fingerprintOf(''), servers: [], mtimeMs: null, text: '' };
    const doc = parseDocument(file.text);
    if (doc.errors?.length) throw Object.assign(new Error('Failed to parse MCP config'), { code: 'parse', errors: doc.errors });
    const arr = doc.toJS();
    const rows = Array.isArray(arr) ? arr : [];
    const servers = rows.filter(isMcpClientRow).map((r) => toEntry(r as Record<string, unknown>)).filter(Boolean) as McpServerEntry[];
    return { fingerprint: fingerprintOf(file.text), servers, mtimeMs: file.mtimeMs, text: file.text };
  }

  async list(): Promise<McpPersistenceResult> {
    try {
      const snap = await this.snapshot();
      return { ok: true, fingerprint: snap.fingerprint, servers: sanitizeMcpObservable(snap.servers) as McpServerEntry[] };
    } catch (err: any) {
      return { ok: false, code: err?.code === 'parse' ? 'parse' : 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) as string };
    }
  }

  private conflict(actual: string): McpPersistenceResult {
    return { ok: false, code: 'conflict', message: 'Config changed externally; reload before saving.', fingerprint: fingerprintOf(actual) };
  }

  private async commit(rows: unknown[], readFingerprint: string, expectedFingerprint?: string): Promise<McpPersistenceResult> {
    const next = dump(rows);
    // Commit-time conflict check: protect lost updates/external edits.
    const current = await readText(this.configPath);
    const currentText = current?.text ?? '';
    const currentFp = fingerprintOf(currentText);
    if (expectedFingerprint && expectedFingerprint !== currentFp) return this.conflict(currentText);
    if (currentFp !== readFingerprint) return this.conflict(currentText);
    await writeAtomic(this.configPath, next);
    const snap = await this.snapshot();
    return { ok: true, fingerprint: snap.fingerprint, servers: sanitizeMcpObservable(snap.servers) as McpServerEntry[] };
  }

  async create(input: Record<string, unknown>, expectedFingerprint?: string): Promise<McpPersistenceResult> {
    return this.serialize(() => this.mutateCreate(input, expectedFingerprint));
  }

  private async mutateCreate(input: Record<string, unknown>, expectedFingerprint?: string): Promise<McpPersistenceResult> {
    try {
      const validation = validateMcpServerConfig(input, { mode: 'create' });
      if (!validation.ok || !validation.value) return { ok: false, code: 'validation', message: 'Invalid server config', issues: validation.issues };
      const file = await readText(this.configPath);
      const text = file?.text ?? '[]\n';
      const readFp = fingerprintOf(text);
      if (expectedFingerprint && expectedFingerprint !== readFp) return this.conflict(text);
      const doc = parseDocument(text);
      if (doc.errors?.length) return { ok: false, code: 'parse', message: 'Failed to parse config' };
      const js = doc.toJS();
      if (!Array.isArray(js)) return { ok: false, code: 'parse', message: 'Config root must be an array' };
      const rows = (js as unknown[]).slice();
      if (rows.some((r) => isMcpClientRow(r) && isRecord((r as any).config) && (r as any).config.serverName === validation.value!.serverName)) {
        return { ok: false, code: 'exists', message: `Server already exists: ${validation.value.serverName}`, fingerprint: readFp };
      }
      rows.push(makeRow(validation.value.serverName, validation.value, 'waycraft'));
      const result = await this.commit(rows, readFp, expectedFingerprint);
      if (result.ok) { const sv = result.servers?.find((s) => s.serverName === validation.value!.serverName); if (sv) result.server = sanitizeMcpObservable(sv) as McpServerEntry; }
      return result;
    } catch (err: any) {
      return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) as string };
    }
  }

  async update(serverName: string, patch: Record<string, unknown>, expectedFingerprint?: string): Promise<McpPersistenceResult> {
    return this.serialize(() => this.mutateUpdate(serverName, patch, expectedFingerprint));
  }

  private async mutateUpdate(serverName: string, patch: Record<string, unknown>, expectedFingerprint?: string): Promise<McpPersistenceResult> {
    try {
      const file = await readText(this.configPath);
      const text = file?.text ?? '[]\n';
      const readFp = fingerprintOf(text);
      if (expectedFingerprint && expectedFingerprint !== readFp) return this.conflict(text);
      const doc = parseDocument(text);
      if (doc.errors?.length) return { ok: false, code: 'parse', message: 'Failed to parse config' };
      const rows = (doc.toJS() as unknown[]).slice();
      let found = false;
      const nextRows = rows.map((row) => {
        if (!isMcpClientRow(row)) return row;
        const r = row as Record<string, unknown>;
        const cfg = isRecord(r.config) ? r.config : {};
        if (cfg.serverName !== serverName) return row;
        found = true;
        const merged = { ...cfg, ...patch, serverName };
        const validation = validateMcpServerConfig(merged, { mode: 'update', existingServerName: serverName });
        if (!validation.ok || !validation.value) throw Object.assign(new Error('validation'), { validation });
        const nextConfig = { ...cfg, ...validation.value, serverName };
        // #167: material changes invalidate trust; non-material saves preserve existing trust if fingerprint unchanged.
        const material = detectMaterialChange(cfg, nextConfig);
        let meta = isRecord(r['x-waycraft-mcp']) ? { ...(r['x-waycraft-mcp'] as Record<string, unknown>) } : { owner: 'waycraft', version: 1 };
        if (material.changed) meta = invalidateTrustMeta(meta, 'material_change');
        return { ...r, config: nextConfig, 'x-waycraft-mcp': meta };
      });
      if (!found) return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: readFp };
      const result = await this.commit(nextRows, readFp, expectedFingerprint);
      if (result.ok) { const sv = result.servers?.find((s) => s.serverName === serverName); if (sv) result.server = sanitizeMcpObservable(sv) as McpServerEntry; }
      return result;
    } catch (err: any) {
      if (err?.validation) return { ok: false, code: 'validation', message: 'Invalid server config', issues: sanitizeMcpObservable(err.validation.issues) as any };
      return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) as string };
    }
  }

  async remove(serverName: string, expectedFingerprint?: string): Promise<McpPersistenceResult> {
    return this.serialize(() => this.mutateRemove(serverName, expectedFingerprint));
  }

  private async mutateRemove(serverName: string, expectedFingerprint?: string): Promise<McpPersistenceResult> {
    try {
      const file = await readText(this.configPath);
      const text = file?.text ?? '[]\n';
      const readFp = fingerprintOf(text);
      if (expectedFingerprint && expectedFingerprint !== readFp) return this.conflict(text);
      const doc = parseDocument(text);
      if (doc.errors?.length) return { ok: false, code: 'parse', message: 'Failed to parse config' };
      const rows = doc.toJS() as unknown[];
      const nextRows = rows.filter((row) => !(isMcpClientRow(row) && isRecord((row as any).config) && (row as any).config.serverName === serverName));
      if (nextRows.length === rows.length) return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: readFp };
      return await this.commit(nextRows, readFp, expectedFingerprint);
    } catch (err: any) {
      return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) as string };
    }
  }

  async approveTrust(serverName: string, expectedFingerprint?: string): Promise<McpPersistenceResult> {
    return this.serialize(() => this.mutateApproveTrust(serverName, expectedFingerprint));
  }

  private async mutateApproveTrust(serverName: string, expectedFingerprint?: string): Promise<McpPersistenceResult> {
    try {
      const file = await readText(this.configPath);
      const text = file?.text ?? '[]\n';
      const readFp = fingerprintOf(text);
      if (expectedFingerprint && expectedFingerprint !== readFp) return this.conflict(text);
      const doc = parseDocument(text);
      if (doc.errors?.length) return { ok: false, code: 'parse', message: 'Failed to parse config' };
      const rows = (doc.toJS() as unknown[]).slice();
      let found = false;
      const nextRows = rows.map((row) => {
        if (!isMcpClientRow(row)) return row;
        const r = row as Record<string, unknown>;
        const cfg = isRecord(r.config) ? r.config : {};
        if (cfg.serverName !== serverName) return row;
        found = true;
        const meta = applyTrustApprovalMeta(r['x-waycraft-mcp'], cfg);
        return { ...r, 'x-waycraft-mcp': meta };
      });
      if (!found) return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: readFp };
      const result = await this.commit(nextRows, readFp, expectedFingerprint);
      if (result.ok) { const sv = result.servers?.find((s) => s.serverName === serverName); if (sv) result.server = sanitizeMcpObservable(sv) as McpServerEntry; }
      return result;
    } catch (err: any) {
      return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) as string };
    }
  }

  async trustStatus(serverName: string): Promise<McpPersistenceResult> {
    try {
      const snap = await this.snapshot();
      const server = snap.servers.find((s) => s.serverName === serverName);
      if (!server) return { ok: false, code: 'not_found', message: `Server not found: ${serverName}`, fingerprint: snap.fingerprint };
      return { ok: true, fingerprint: snap.fingerprint, server: sanitizeMcpObservable(server) as McpServerEntry };
    } catch (err: any) {
      return { ok: false, code: 'io', message: sanitizeMcpObservable(String(err?.message || 'Operation failed')) as string };
    }
  }
}
