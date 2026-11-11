/**
 * MCP trust-based activation (#167). Spec §12, §12.1.
 * - Trust approval binds to reviewed configuration fingerprint.
 * - Saving does not imply trust. Material changes invalidate trust.
 * - Approval authorizes reviewed configuration only, not harmlessness.
 * - No new sandbox platform in V1; project scope not misrepresented as OS isolation.
 */
import { createHash } from 'node:crypto';
export const MCP_MATERIAL_CHANGE_FIELDS = [
    'transport',
    'command',
    'args',
    'cwd',
    'env',
    'url',
    'headers',
    'expandTemplates',
    'failOnStartupError',
    'reconnect',
    // security-significant/privilege-adjacent verified fields
    'toolCallTimeoutMs',
    'startupTimeoutMs',
    'closeTimeoutMs',
    'maxInstructionBytes',
];
function isRecord(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}
function stableValue(value) {
    if (Array.isArray(value))
        return value.map(stableValue);
    if (isRecord(value)) {
        const out = {};
        for (const k of Object.keys(value).sort())
            out[k] = stableValue(value[k]);
        return out;
    }
    return value;
}
export function materialTrustPayload(config) {
    const c = isRecord(config) ? config : {};
    const out = {};
    for (const field of MCP_MATERIAL_CHANGE_FIELDS) {
        if (c[field] !== undefined)
            out[field] = stableValue(c[field]);
    }
    // serverName included for binding clarity (immutable post-create), but identity is separate.
    if (typeof c.serverName === 'string')
        out.serverName = c.serverName;
    return out;
}
export function reviewedConfigFingerprint(config) {
    const payload = materialTrustPayload(config);
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
export function detectMaterialChange(before, after) {
    const beforeFingerprint = reviewedConfigFingerprint(before);
    const afterFingerprint = reviewedConfigFingerprint(after);
    return {
        changed: beforeFingerprint !== afterFingerprint,
        beforeFingerprint,
        afterFingerprint,
    };
}
export function emptyTrust(reason = 'not_approved') {
    return { state: 'untrusted', fingerprint: null, reason };
}
export function trustFromRowMeta(meta, config) {
    if (!isRecord(meta) || !isRecord(meta.trust))
        return emptyTrust();
    const t = meta.trust;
    const approvedFp = typeof t.fingerprint === 'string' ? t.fingerprint : null;
    const currentFp = reviewedConfigFingerprint(config);
    if (t.state === 'trusted' && approvedFp && approvedFp === currentFp) {
        return {
            state: 'trusted',
            fingerprint: approvedFp,
            approvedAt: typeof t.approvedAt === 'string' ? t.approvedAt : undefined,
        };
    }
    if (t.state === 'trusted' && approvedFp && approvedFp !== currentFp) {
        return {
            state: 'invalidated',
            fingerprint: approvedFp,
            invalidatedAt: new Date().toISOString(),
            reason: 'material_change',
        };
    }
    if (t.state === 'invalidated') {
        return {
            state: 'invalidated',
            fingerprint: approvedFp,
            invalidatedAt: typeof t.invalidatedAt === 'string' ? t.invalidatedAt : undefined,
            reason: typeof t.reason === 'string' ? t.reason : 'invalidated',
        };
    }
    return emptyTrust(typeof t.reason === 'string' ? t.reason : 'not_approved');
}
export function applyTrustApprovalMeta(rowMeta, config, now = new Date()) {
    const meta = isRecord(rowMeta)
        ? { ...rowMeta }
        : { owner: 'waycraft', version: 1 };
    meta.trust = {
        state: 'trusted',
        fingerprint: reviewedConfigFingerprint(config),
        approvedAt: now.toISOString(),
    };
    return meta;
}
export function invalidateTrustMeta(rowMeta, reason = 'material_change', now = new Date()) {
    const meta = isRecord(rowMeta)
        ? { ...rowMeta }
        : { owner: 'waycraft', version: 1 };
    const prev = isRecord(meta.trust)
        ? meta.trust
        : {};
    meta.trust = {
        state: 'invalidated',
        fingerprint: typeof prev.fingerprint === 'string' ? prev.fingerprint : null,
        invalidatedAt: now.toISOString(),
        reason,
    };
    return meta;
}
export function clearTrustForSave(rowMeta) {
    const meta = isRecord(rowMeta)
        ? { ...rowMeta }
        : { owner: 'waycraft', version: 1 };
    // Saving reviewed config through create path starts untrusted.
    if (!meta.trust)
        meta.trust = emptyTrust('save_does_not_imply_trust');
    return meta;
}
export function assertTrustApprovedForAction(trust, action) {
    if (trust.state === 'trusted')
        return;
    const msg = trust.state === 'invalidated'
        ? `Trust approval invalidated for this server; review material changes and re-approve before ${action}.`
        : `Trust approval required before ${action}. Saving does not imply trust.`;
    const err = new Error(msg);
    err.code = 'trust_required';
    err.trust = trust;
    throw err;
}
