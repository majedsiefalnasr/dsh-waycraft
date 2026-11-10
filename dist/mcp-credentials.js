/**
 * MCP credential references and secret-safety helpers (#166).
 * Spec §12: support ${credential:REF} templates; never persist plaintext secrets;
 * secrets must not appear in UI responses, logs, error messages, config previews,
 * exported configs, test diagnostics, or browser-accessible state after submission.
 *
 * DSH credentials provider integration is a compatibility assumption in V1:
 * Waycraft preserves ${credential:REF} templates and enforces host-side boundary
 * handling/redaction; runtime resolution is delegated to DSH/mcp-client when supported.
 */
export const CREDENTIAL_REF_RE = /\$\{credential:([^}]+)\}/g;
export const EXACT_CREDENTIAL_REF_RE = /^\$\{credential:([^}]+)\}$/;
export function hasCredentialRef(value) {
    return /\$\{credential:[^}]+\}/.test(value);
}
export function isExactCredentialRef(value) {
    return EXACT_CREDENTIAL_REF_RE.test(value);
}
const SENSITIVE_ENV_KEY_RE = /(token|secret|password|passwd|api.?key|apikey|auth|authorization|cookie|credential|bearer|private.?key|access.?key|client.?secret|session)/i;
const SECRET_VALUE_RE = /(sk-[A-Za-z0-9]{12,}|gh[pousr]_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|AIza[0-9A-Za-z\-_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|Bearer\s+[A-Za-z0-9\-._~+/]+=*|Basic\s+[A-Za-z0-9+/]+=+)/;
export function isSensitiveEnvKey(key) {
    return SENSITIVE_ENV_KEY_RE.test(key);
}
export function looksLikePlaintextSecret(value) {
    if (typeof value !== 'string' || !value)
        return false;
    if (hasCredentialRef(value))
        return false;
    if (SECRET_VALUE_RE.test(value))
        return true;
    // Long opaque tokens in sensitive contexts are risky, but avoid false positives.
    return false;
}
export function validateCredentialSafety(config) {
    const issues = [];
    const env = config.env;
    if (env && typeof env === 'object' && !Array.isArray(env)) {
        for (const [k, v] of Object.entries(env)) {
            if (typeof v !== 'string')
                continue;
            if (hasCredentialRef(v))
                continue;
            if (isSensitiveEnvKey(k) || looksLikePlaintextSecret(v)) {
                issues.push({
                    path: `env.${k}`,
                    message: `Potential plaintext secret in env.${k}; use \${credential:REF} instead of storing secrets in config.`,
                });
            }
        }
    }
    const headers = config.headers;
    if (headers && typeof headers === 'object' && !Array.isArray(headers)) {
        for (const [k, v] of Object.entries(headers)) {
            if (typeof v !== 'string')
                continue;
            if (hasCredentialRef(v))
                continue;
            if (isSensitiveEnvKey(k) || looksLikePlaintextSecret(v)) {
                issues.push({
                    path: `headers.${k}`,
                    message: `Potential plaintext secret in headers.${k}; use \${credential:REF} instead of storing secrets in config.`,
                });
            }
        }
    }
    return issues;
}
function redactString(value) {
    if (hasCredentialRef(value))
        return value;
    if (SECRET_VALUE_RE.test(value))
        return '[REDACTED]';
    return value;
}
function redactValue(value, keyHint) {
    if (typeof value === 'string') {
        if (keyHint && isSensitiveEnvKey(keyHint) && !hasCredentialRef(value))
            return '[REDACTED]';
        return redactString(value);
    }
    if (Array.isArray(value))
        return value.map((v) => redactValue(v));
    if (value && typeof value === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(value))
            out[k] = redactValue(v, k);
        return out;
    }
    return value;
}
export function redactMcpConfigForSurface(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config))
        return config;
    const c = { ...config };
    if (c.env && typeof c.env === 'object' && !Array.isArray(c.env)) {
        const env = {};
        for (const [k, v] of Object.entries(c.env)) {
            env[k] = typeof v === 'string' ? (hasCredentialRef(v) ? v : '[REDACTED]') : v;
        }
        c.env = env;
    }
    if (c.headers && typeof c.headers === 'object' && !Array.isArray(c.headers)) {
        const headers = {};
        for (const [k, v] of Object.entries(c.headers)) {
            headers[k] = typeof v === 'string' ? (hasCredentialRef(v) ? v : '[REDACTED]') : v;
        }
        c.headers = headers;
    }
    if (Array.isArray(c.args))
        c.args = c.args.map((a) => (typeof a === 'string' ? redactString(a) : a));
    if (typeof c.url === 'string')
        c.url = redactString(c.url);
    if (typeof c.command === 'string')
        c.command = redactString(c.command);
    return c;
}
export function sanitizeMcpObservable(data) {
    return redactValue(data);
}
export function sanitizeMcpServerEntryForSurface(entry) {
    const out = { ...entry };
    if (out.config)
        out.config = redactMcpConfigForSurface(out.config);
    if (out.rawRow && typeof out.rawRow === 'object') {
        const row = { ...out.rawRow };
        if (row.config)
            row.config = redactMcpConfigForSurface(row.config);
        out.rawRow = row;
    }
    if (Array.isArray(out.servers))
        out.servers = out.servers.map((s) => s && typeof s === 'object' ? sanitizeMcpServerEntryForSurface(s) : s);
    if (Array.isArray(out.trashedServers))
        out.trashedServers = out.trashedServers.map((s) => s && typeof s === 'object' ? sanitizeMcpServerEntryForSurface(s) : s);
    if (out.server && typeof out.server === 'object')
        out.server = sanitizeMcpServerEntryForSurface(out.server);
    return out;
}
