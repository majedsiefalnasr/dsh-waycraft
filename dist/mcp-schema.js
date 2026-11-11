/**
 * MCP manager V1 — server config schema, validation, normalization, and CRUD contracts.
 * Spec: docs/specs/mcp-manager.md §7.2, §13.1, #164.
 *
 * Verified DSH mcp-client fields (0.2.2-rc.1): transport, serverName, command, args,
 * env, cwd, url, headers, toolCallTimeoutMs, startupTimeoutMs, closeTimeoutMs,
 * expandTemplates, maxInstructionBytes, failOnStartupError, reconnect.
 * UNVERIFIED (preserved without loss): scope, disabledTools, disabled.
 */
import { validateCredentialSafety } from './mcp-credentials.js';
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
function isRecord(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}
function isStringArray(v) {
    return Array.isArray(v) && v.every((x) => typeof x === 'string');
}
function isStringMap(v) {
    return isRecord(v) && Object.values(v).every((x) => typeof x === 'string');
}
export function normalizeTransport(raw) {
    if (raw === 'stdio')
        return 'stdio';
    if (raw === 'streamable-http' ||
        raw === 'streamable_http' ||
        raw === 'http' ||
        raw === 'sse')
        return 'streamable-http';
    return null;
}
/** Normalize raw input without losing unknown fields. serverName is trimmed but not invented. */
export function normalizeMcpServerConfig(raw) {
    const issues = [];
    const preservedUnknownKeys = [];
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
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
        if (!VERIFIED_KEYS.has(k))
            preservedUnknownKeys.push(k);
        out[k] = v;
    }
    if (typeof out.serverName === 'string')
        out.serverName = out.serverName.trim();
    const t = normalizeTransport(out.transport);
    if (t)
        out.transport = t;
    if (isRecord(out.reconnect))
        out.reconnect = { ...out.reconnect };
    if (isStringArray(out.args))
        out.args = [...out.args];
    if (isStringMap(out.env))
        out.env = { ...out.env };
    if (isStringMap(out.headers))
        out.headers = { ...out.headers };
    return {
        ok: issues.length === 0,
        issues,
        value: out,
        preservedUnknownKeys,
    };
}
export function validateMcpServerConfig(raw, opts = {}) {
    const norm = normalizeMcpServerConfig(raw);
    if (!norm.value)
        return { ok: false, issues: norm.issues };
    const value = norm.value;
    const issues = [...norm.issues];
    const mode = opts.mode ?? 'create';
    if (typeof value.serverName !== 'string' || !value.serverName) {
        issues.push({
            path: 'serverName',
            message: 'serverName is required',
            code: 'required',
        });
    }
    else if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.serverName)) {
        issues.push({
            path: 'serverName',
            message: 'serverName must be a safe identifier',
            code: 'invalid_value',
        });
    }
    if (mode === 'update' &&
        opts.existingServerName &&
        value.serverName !== opts.existingServerName) {
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
    }
    else if (transport === 'stdio') {
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
    }
    else if (transport === 'streamable-http') {
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
    ]) {
        const v = value[msField];
        if (v !== undefined &&
            (typeof v !== 'number' || !Number.isFinite(v) || v < 0))
            issues.push({
                path: msField,
                message: `${msField} must be a non-negative number`,
                code: 'invalid_type',
            });
    }
    for (const boolField of ['expandTemplates', 'failOnStartupError']) {
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
    for (const issue of validateCredentialSafety(value)) {
        issues.push({
            path: issue.path,
            message: issue.message,
            code: 'invalid_value',
        });
    }
    return { ok: issues.length === 0, issues, value };
}
export const MCP_SCHEMA_VERIFIED_FIELDS = [...VERIFIED_KEYS].filter((k) => !['scope', 'disabledTools', 'disabled'].includes(k));
export const MCP_SCHEMA_UNVERIFIED_PASSTHROUGH_FIELDS = [
    'scope',
    'disabledTools',
    'disabled',
];
