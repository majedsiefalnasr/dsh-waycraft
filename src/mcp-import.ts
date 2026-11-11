/**
 * MCP manager V1 — JSON configuration import (#171).
 * Spec §14.2: parse, validate, normalize, preview, duplicate detection,
 * credential reference validation, conflict handling, explicit registration approval.
 * Supported explicitly defined verified formats only. No auto-execution.
 * V1 single scope only (no project runtime scope selection).
 */
import {
  normalizeMcpServerConfig,
  validateMcpServerConfig,
  type McpServerConfig,
  type ValidationIssue,
} from './mcp-schema.js';
import { hasCredentialRef, isExactCredentialRef } from './mcp-credentials.js';
import { sanitizeMcpObservable } from './mcp-credentials.js';

export type McpImportFormat = 'waycraft-mcp-v1' | 'mcpServers-map';

export interface McpImportConflict {
  serverName: string;
  kind: 'duplicate_existing' | 'duplicate_import';
  message: string;
}

export interface McpImportCandidate {
  serverName: string;
  format: McpImportFormat;
  config: McpServerConfig;
  issues: ValidationIssue[];
  valid: boolean;
  credentialRefs: string[];
  conflict?: McpImportConflict;
  scopeNote?: string; // V1 single scope only
  unknownKeys: string[];
}

export interface McpImportPreview {
  ok: boolean;
  format?: McpImportFormat;
  candidates: McpImportCandidate[];
  issues: Array<{ path: string; message: string; code: string }>;
  stats: {
    total: number;
    valid: number;
    invalid: number;
    conflicts: number;
    credentialRefs: number;
  };
  scope: { mode: 'single-v1'; projectScopeSupported: false; note: string };
}

export interface McpImportRegisterItem {
  serverName: string;
  approved: boolean;
  onConflict?: 'skip' | 'replace'; // explicit; default skip
}

export interface McpImportRegisterResult {
  serverName: string;
  status: 'registered' | 'replaced' | 'skipped' | 'rejected' | 'failed';
  message?: string;
  code?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function collectCredentialRefs(
  value: unknown,
  out = new Set<string>(),
): string[] {
  if (typeof value === 'string') {
    const re = /\$\{credential:([^}]+)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(value))) out.add(m[1]);
    return [...out];
  }
  if (Array.isArray(value)) value.forEach((v) => collectCredentialRefs(v, out));
  else if (isRecord(value))
    Object.values(value).forEach((v) => collectCredentialRefs(v, out));
  return [...out];
}

function normalizeScopeForV1(config: McpServerConfig): {
  config: McpServerConfig;
  note?: string;
} {
  // V1 has no project runtime scope selection. Preserve unknown/unverified scope field
  // only when safe; do not interpret project scope. Report single-scope behavior.
  const rawScope = (config as any).scope;
  if (rawScope == null) return { config };
  if (
    typeof rawScope === 'string' &&
    /project|workspace|local/i.test(rawScope)
  ) {
    const next = { ...config } as any;
    delete next.scope;
    return {
      config: next,
      note: 'Project scope selection is not supported in V1; imported entry uses V1 single scope.',
    };
  }
  return {
    config,
    note: 'V1 uses a single verified scope; scope metadata was preserved without runtime project isolation.',
  };
}

function inferTransportForImport(config: McpServerConfig): McpServerConfig {
  if (config.transport === 'stdio' || config.transport === 'streamable-http')
    return config;
  if (typeof config.url === 'string' && config.url)
    return { ...config, transport: 'streamable-http' };
  if (typeof config.command === 'string' && config.command)
    return { ...config, transport: 'stdio' };
  return config;
}

function detectFormat(raw: unknown): {
  format?: McpImportFormat;
  error?: string;
} {
  if (!isRecord(raw))
    return {
      error: 'Unsupported import structure: JSON root must be an object.',
    };
  if (raw.waycraftMcpImport === 1 && Array.isArray(raw.servers))
    return { format: 'waycraft-mcp-v1' };
  if (isRecord(raw.mcpServers)) return { format: 'mcpServers-map' };
  return {
    error:
      'Unsupported import structure. Supported formats: Waycraft MCP export {"waycraftMcpImport":1,"servers":[...]} or MCP servers map {"mcpServers":{"name":{...}}}.',
  };
}

function extractRawServers(
  raw: Record<string, unknown>,
  format: McpImportFormat,
): Array<{ serverName?: string; config: unknown; path: string }> {
  if (format === 'waycraft-mcp-v1') {
    const servers = raw.servers as unknown[];
    return servers.map((item, i) => {
      if (!isRecord(item)) return { config: item, path: `servers[${i}]` };
      const cfg = isRecord(item.config) ? item.config : item;
      const serverName =
        typeof (cfg as any).serverName === 'string'
          ? (cfg as any).serverName
          : typeof item.serverName === 'string'
            ? item.serverName
            : undefined;
      return { serverName, config: cfg, path: `servers[${i}]` };
    });
  }
  const map = raw.mcpServers as Record<string, unknown>;
  return Object.entries(map).map(([name, cfg]) => ({
    serverName: name,
    config: isRecord(cfg) ? { serverName: name, ...cfg } : cfg,
    path: `mcpServers.${name}`,
  }));
}

export function previewMcpImport(
  raw: unknown,
  opts: { existingServerNames?: string[] } = {},
): McpImportPreview {
  const existing = new Set(
    (opts.existingServerNames || []).map((s) => s.trim()).filter(Boolean),
  );
  const base = (): Pick<McpImportPreview, 'issues' | 'stats' | 'scope'> => ({
    issues: [],
    stats: { total: 0, valid: 0, invalid: 0, conflicts: 0, credentialRefs: 0 },
    scope: {
      mode: 'single-v1',
      projectScopeSupported: false,
      note: 'V1 uses a single verified scope. Project runtime scope selection is not supported.',
    },
  });
  const detected = detectFormat(raw);
  if (!detected.format) {
    return sanitizeMcpObservable({
      ok: false,
      candidates: [],
      ...base(),
      issues: [
        {
          path: '',
          message: detected.error || 'Unsupported import structure',
          code: 'unsupported',
        },
      ],
    }) as McpImportPreview;
  }
  const items = extractRawServers(
    raw as Record<string, unknown>,
    detected.format,
  );
  const candidates: McpImportCandidate[] = [];
  const seenInImport = new Set<string>();
  for (const item of items) {
    const norm = normalizeMcpServerConfig(item.config);
    let config = norm.value as McpServerConfig | undefined;
    const issues: ValidationIssue[] = [...norm.issues];
    let scopeNote: string | undefined;
    if (config) {
      config = inferTransportForImport(config);
      const scoped = normalizeScopeForV1(config);
      config = scoped.config;
      scopeNote = scoped.note;
    }
    if (!config) {
      candidates.push(
        sanitizeMcpObservable({
          serverName: item.serverName || '(invalid)',
          format: detected.format!,
          config: (item.config || {}) as any,
          issues,
          valid: false,
          credentialRefs: collectCredentialRefs(item.config),
          unknownKeys: norm.preservedUnknownKeys || [],
        }) as McpImportCandidate,
      );
      continue;
    }
    const validation = validateMcpServerConfig(config, { mode: 'create' });
    issues.push(...validation.issues);
    const finalConfig = validation.value || config;
    const name = finalConfig.serverName || item.serverName || '(unnamed)';
    let conflict: McpImportConflict | undefined;
    if (name && existing.has(name))
      conflict = {
        serverName: name,
        kind: 'duplicate_existing',
        message: `Server already exists: ${name}`,
      };
    else if (name && seenInImport.has(name))
      conflict = {
        serverName: name,
        kind: 'duplicate_import',
        message: `Duplicate server name in import: ${name}`,
      };
    if (name) seenInImport.add(name);
    const credentialRefs = collectCredentialRefs(finalConfig);
    candidates.push(
      sanitizeMcpObservable({
        serverName: name,
        format: detected.format!,
        config: finalConfig,
        issues,
        valid: validation.ok,
        credentialRefs,
        conflict,
        scopeNote,
        unknownKeys: norm.preservedUnknownKeys || [],
      }) as McpImportCandidate,
    );
  }
  const stats = {
    total: candidates.length,
    valid: candidates.filter((c) => c.valid && !c.conflict).length,
    invalid: candidates.filter((c) => !c.valid).length,
    conflicts: candidates.filter((c) => !!c.conflict).length,
    credentialRefs: candidates.filter((c) => c.credentialRefs.length > 0)
      .length,
  };
  return sanitizeMcpObservable({
    ok: true,
    format: detected.format,
    candidates,
    issues: [],
    stats,
    scope: base().scope,
  }) as McpImportPreview;
}

/** Explicit registration approval. Never executes imported servers. */
export async function registerMcpImport(
  preview: McpImportPreview,
  approvals: McpImportRegisterItem[],
  deps: {
    existingServerNames: () => Promise<string[]>;
    create: (
      config: McpServerConfig,
    ) => Promise<{ ok: boolean; message?: string; code?: string }>;
    replace?: (
      serverName: string,
      config: McpServerConfig,
    ) => Promise<{ ok: boolean; message?: string; code?: string }>;
  },
): Promise<{
  ok: boolean;
  results: McpImportRegisterResult[];
  stats: {
    registered: number;
    replaced: number;
    skipped: number;
    rejected: number;
    failed: number;
  };
}> {
  if (!preview.ok)
    return {
      ok: false,
      results: [],
      stats: { registered: 0, replaced: 0, skipped: 0, rejected: 0, failed: 1 },
    };
  const approvalByName = new Map(
    approvals
      .filter((a) => a && typeof a.serverName === 'string')
      .map((a) => [a.serverName, a]),
  );
  const existing = new Set(await deps.existingServerNames());
  const results: McpImportRegisterResult[] = [];
  for (const candidate of preview.candidates) {
    const approval = approvalByName.get(candidate.serverName);
    if (!approval || !approval.approved) {
      results.push({
        serverName: candidate.serverName,
        status: 'skipped',
        message:
          'Import candidate was not explicitly approved for registration.',
      });
      continue;
    }
    if (!candidate.valid) {
      results.push({
        serverName: candidate.serverName,
        status: 'rejected',
        message: 'Candidate failed validation.',
        code: 'validation',
      });
      continue;
    }
    const conflict = existing.has(candidate.serverName)
      ? 'duplicate_existing'
      : candidate.conflict?.kind;
    if (conflict) {
      if (approval.onConflict === 'replace' && deps.replace) {
        const r = await deps.replace(candidate.serverName, candidate.config);
        if (r.ok) {
          existing.add(candidate.serverName);
          results.push({
            serverName: candidate.serverName,
            status: 'replaced',
          });
        } else
          results.push({
            serverName: candidate.serverName,
            status: 'failed',
            message: r.message,
            code: r.code,
          });
      } else {
        results.push({
          serverName: candidate.serverName,
          status: 'skipped',
          message:
            conflict === 'duplicate_import'
              ? 'Duplicate name in import; not registered.'
              : 'Server already exists; explicit conflict resolution required.',
          code: 'conflict',
        });
      }
      continue;
    }
    const r = await deps.create(candidate.config);
    if (r.ok) {
      existing.add(candidate.serverName);
      results.push({ serverName: candidate.serverName, status: 'registered' });
    } else
      results.push({
        serverName: candidate.serverName,
        status: r.code === 'exists' ? 'skipped' : 'failed',
        message: r.message,
        code: r.code,
      });
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
