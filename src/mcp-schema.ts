/**
 * MCP manager V1 — server config schema, validation, normalization, and CRUD contracts.
 * Spec: docs/specs/mcp-manager.md §7.2, §13.1, #164.
 *
 * Verified DSH mcp-client fields (0.2.2-rc.1): transport, serverName, command, args,
 * env, cwd, url, headers, toolCallTimeoutMs, startupTimeoutMs, closeTimeoutMs,
 * expandTemplates, maxInstructionBytes, failOnStartupError, reconnect.
 * UNVERIFIED (preserved without loss): scope, disabledTools, disabled.
 */

export type McpTransport = 'stdio' | 'streamable-http';

export interface McpReconnectConfig {
  enabled?: boolean;
  initialDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
  [key: string]: unknown;
}

import { validateCredentialSafety } from './mcp-credentials.js';

/** Normalized server config stored/managed by Waycraft. Unknown fields preserved. */
export interface McpServerConfig {
  serverName: string;
  transport: McpTransport;
  // stdio
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  // streamable-http
  url?: string;
  headers?: Record<string, string>;
  // common verified
  toolCallTimeoutMs?: number;
  startupTimeoutMs?: number;
  closeTimeoutMs?: number;
  expandTemplates?: boolean;
  maxInstructionBytes?: number;
  failOnStartupError?: boolean;
  reconnect?: McpReconnectConfig;
  // UNVERIFIED in official mcp-client schema — preserved for compatibility/adoption
  scope?: unknown;
  disabledTools?: unknown;
  disabled?: unknown;
  [key: string]: unknown;
}

export interface ValidationIssue {
  path: string;
  message: string;
  code:
    | 'required'
    | 'invalid_type'
    | 'invalid_value'
    | 'immutable'
    | 'unsupported';
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  value?: McpServerConfig;
}

export interface NormalizeResult {
  ok: boolean;
  issues: ValidationIssue[];
  value?: McpServerConfig;
  preservedUnknownKeys: string[];
}

const VERIFIED_KEYS = new Set([
  'transport',
  'serverName',
  'command',
  'args',
  'env',
  'cwd',
  'url',
  'headers',
  'toolCallTimeoutMs',
  'startupTimeoutMs',
  'closeTimeoutMs',
  'expandTemplates',
  'maxInstructionBytes',
  'failOnStartupError',
  'reconnect',
  'scope',
  'disabledTools',
  'disabled',
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isStringMap(v: unknown): v is Record<string, string> {
  return isRecord(v) && Object.values(v).every((x) => typeof x === 'string');
}

export function normalizeTransport(raw: unknown): McpTransport | null {
  if (raw === 'stdio') return 'stdio';
  if (
    raw === 'streamable-http' ||
    raw === 'streamable_http' ||
    raw === 'http' ||
    raw === 'sse'
  )
    return 'streamable-http';
  return null;
}

/** Normalize raw input without losing unknown fields. serverName is trimmed but not invented. */
export function normalizeMcpServerConfig(raw: unknown): NormalizeResult {
  const issues: ValidationIssue[] = [];
  const preservedUnknownKeys: string[] = [];
  if (!isRecord(raw)) {
    return {
      ok: false,
      issues: [
        {
          path: '',
          message: 'Server config must be an object',
          code: 'invalid_type',
        },
      ],
      preservedUnknownKeys,
    };
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!VERIFIED_KEYS.has(k)) preservedUnknownKeys.push(k);
    out[k] = v;
  }
  if (typeof out.serverName === 'string')
    out.serverName = out.serverName.trim();
  const t = normalizeTransport(out.transport);
  if (t) out.transport = t;
  if (isRecord(out.reconnect)) out.reconnect = { ...out.reconnect };
  if (isStringArray(out.args)) out.args = [...out.args];
  if (isStringMap(out.env)) out.env = { ...out.env };
  if (isStringMap(out.headers)) out.headers = { ...out.headers };
  return {
    ok: issues.length === 0,
    issues,
    value: out as McpServerConfig,
    preservedUnknownKeys,
  };
}

export function validateMcpServerConfig(
  raw: unknown,
  opts: { mode?: 'create' | 'update'; existingServerName?: string } = {},
): ValidationResult {
  const norm = normalizeMcpServerConfig(raw);
  if (!norm.value) return { ok: false, issues: norm.issues };
  const value = norm.value;
  const issues: ValidationIssue[] = [...norm.issues];
  const mode = opts.mode ?? 'create';

  if (typeof value.serverName !== 'string' || !value.serverName) {
    issues.push({
      path: 'serverName',
      message: 'serverName is required',
      code: 'required',
    });
  } else if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.serverName)) {
    issues.push({
      path: 'serverName',
      message: 'serverName must be a safe identifier',
      code: 'invalid_value',
    });
  }
  if (
    mode === 'update' &&
    opts.existingServerName &&
    value.serverName !== opts.existingServerName
  ) {
    issues.push({
      path: 'serverName',
      message: 'serverName is immutable after creation',
      code: 'immutable',
    });
  }

  const transport = normalizeTransport(value.transport);
  if (!transport) {
    issues.push({
      path: 'transport',
      message: 'transport must be stdio or streamable-http',
      code: mode === 'create' ? 'required' : 'invalid_value',
    });
  } else if (transport === 'stdio') {
    if (typeof value.command !== 'string' || !value.command.trim())
      issues.push({
        path: 'command',
        message: 'command is required for stdio transport',
        code: 'required',
      });
    if (value.args !== undefined && !isStringArray(value.args))
      issues.push({
        path: 'args',
        message: 'args must be an array of strings',
        code: 'invalid_type',
      });
    if (value.env !== undefined && !isStringMap(value.env))
      issues.push({
        path: 'env',
        message: 'env must be a string map',
        code: 'invalid_type',
      });
  } else if (transport === 'streamable-http') {
    if (typeof value.url !== 'string' || !value.url.trim())
      issues.push({
        path: 'url',
        message: 'url is required for streamable-http transport',
        code: 'required',
      });
    if (value.headers !== undefined && !isStringMap(value.headers))
      issues.push({
        path: 'headers',
        message: 'headers must be a string map',
        code: 'invalid_type',
      });
  }

  for (const msField of [
    'toolCallTimeoutMs',
    'startupTimeoutMs',
    'closeTimeoutMs',
    'maxInstructionBytes',
  ] as const) {
    const v = value[msField];
    if (
      v !== undefined &&
      (typeof v !== 'number' || !Number.isFinite(v) || v < 0)
    )
      issues.push({
        path: msField,
        message: `${msField} must be a non-negative number`,
        code: 'invalid_type',
      });
  }
  for (const boolField of ['expandTemplates', 'failOnStartupError'] as const) {
    const v = value[boolField];
    if (v !== undefined && typeof v !== 'boolean')
      issues.push({
        path: boolField,
        message: `${boolField} must be boolean`,
        code: 'invalid_type',
      });
  }
  if (value.reconnect !== undefined && !isRecord(value.reconnect))
    issues.push({
      path: 'reconnect',
      message: 'reconnect must be an object',
      code: 'invalid_type',
    });

  // #166: Credential refs are allowed as ${credential:REF}. Never persist plaintext secrets.
  for (const issue of validateCredentialSafety(
    value as Record<string, unknown>,
  )) {
    issues.push({
      path: issue.path,
      message: issue.message,
      code: 'invalid_value',
    });
  }
  return { ok: issues.length === 0, issues, value };
}

/** CRUD service contracts (interfaces/types). Implementations arrive in later tickets. */
export interface McpServerRecord {
  config: McpServerConfig;
  source?: 'dsh' | 'waycraft' | 'imported' | 'discovered';
  managed?: boolean;
  trustApproved?: boolean;
  lastTestedAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface McpServerListResult {
  servers: McpServerRecord[];
}

export interface McpCreateServerInput {
  config: unknown;
}

export interface McpUpdateServerInput {
  serverName: string;
  patch: unknown; // must not change serverName
}

export interface McpRemoveServerInput {
  serverName: string;
}

export interface McpToggleServerInput {
  serverName: string;
  enabled?: boolean; // only when DSH-native lifecycle field verified; V1 contract keeps shape explicit
}

export interface McpTestServerInput {
  serverName?: string;
  config?: unknown; // optional preview/test-unsaved per future UX; service may reject until supported
}

export interface McpServerCrudService {
  listServers(): Promise<McpServerListResult>;
  getServer(serverName: string): Promise<McpServerRecord | null>;
  createServer(input: McpCreateServerInput): Promise<McpServerRecord>;
  updateServer(input: McpUpdateServerInput): Promise<McpServerRecord>;
  removeServer(
    input: McpRemoveServerInput,
  ): Promise<{ removed: boolean; serverName: string }>;
  // test/toggle are V1 workflows (§13.1) but may be capability-gated at runtime.
  testServer?(
    input: McpTestServerInput,
  ): Promise<{ ok: boolean; serverName?: string; details?: unknown }>;
  toggleServer?(input: McpToggleServerInput): Promise<McpServerRecord>;
}

export const MCP_SCHEMA_VERIFIED_FIELDS = [...VERIFIED_KEYS].filter(
  (k) => !['scope', 'disabledTools', 'disabled'].includes(k),
);
export const MCP_SCHEMA_UNVERIFIED_PASSTHROUGH_FIELDS = [
  'scope',
  'disabledTools',
  'disabled',
] as const;
