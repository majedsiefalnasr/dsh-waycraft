/**
 * MCP trust-based activation (#167). Spec §12, §12.1.
 * - Trust approval binds to reviewed configuration fingerprint.
 * - Saving does not imply trust. Material changes invalidate trust.
 * - Approval authorizes reviewed configuration only, not harmlessness.
 * - No new sandbox platform in V1; project scope not misrepresented as OS isolation.
 */

import { createHash } from 'node:crypto';
import type { McpServerConfig } from './mcp-schema.js';

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
] as const;

export type TrustState = 'untrusted' | 'trusted' | 'invalidated';

export interface McpTrustApproval {
  state: TrustState;
  fingerprint: string | null;
  approvedAt?: string;
  invalidatedAt?: string;
  reason?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value).sort()) out[k] = stableValue(value[k]);
    return out;
  }
  return value;
}

export function materialTrustPayload(config: unknown): Record<string, unknown> {
  const c = isRecord(config) ? config : {};
  const out: Record<string, unknown> = {};
  for (const field of MCP_MATERIAL_CHANGE_FIELDS) {
    if (c[field] !== undefined) out[field] = stableValue(c[field]);
  }
  // serverName included for binding clarity (immutable post-create), but identity is separate.
  if (typeof c.serverName === 'string') out.serverName = c.serverName;
  return out;
}

export function reviewedConfigFingerprint(config: unknown): string {
  const payload = materialTrustPayload(config);
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function detectMaterialChange(
  before: unknown,
  after: unknown,
): { changed: boolean; beforeFingerprint: string; afterFingerprint: string } {
  const beforeFingerprint = reviewedConfigFingerprint(before);
  const afterFingerprint = reviewedConfigFingerprint(after);
  return {
    changed: beforeFingerprint !== afterFingerprint,
    beforeFingerprint,
    afterFingerprint,
  };
}

export function emptyTrust(reason = 'not_approved'): McpTrustApproval {
  return { state: 'untrusted', fingerprint: null, reason };
}

export function trustFromRowMeta(
  meta: unknown,
  config: unknown,
): McpTrustApproval {
  if (!isRecord(meta) || !isRecord(meta.trust)) return emptyTrust();
  const t = meta.trust as Record<string, unknown>;
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
      invalidatedAt:
        typeof t.invalidatedAt === 'string' ? t.invalidatedAt : undefined,
      reason: typeof t.reason === 'string' ? t.reason : 'invalidated',
    };
  }
  return emptyTrust(typeof t.reason === 'string' ? t.reason : 'not_approved');
}

export function applyTrustApprovalMeta(
  rowMeta: unknown,
  config: unknown,
  now = new Date(),
): Record<string, unknown> {
  const meta: Record<string, unknown> = isRecord(rowMeta)
    ? { ...rowMeta }
    : { owner: 'waycraft', version: 1 };
  meta.trust = {
    state: 'trusted',
    fingerprint: reviewedConfigFingerprint(config),
    approvedAt: now.toISOString(),
  };
  return meta;
}

export function invalidateTrustMeta(
  rowMeta: unknown,
  reason = 'material_change',
  now = new Date(),
): Record<string, unknown> {
  const meta: Record<string, unknown> = isRecord(rowMeta)
    ? { ...rowMeta }
    : { owner: 'waycraft', version: 1 };
  const prev = isRecord(meta.trust)
    ? (meta.trust as Record<string, unknown>)
    : {};
  meta.trust = {
    state: 'invalidated',
    fingerprint: typeof prev.fingerprint === 'string' ? prev.fingerprint : null,
    invalidatedAt: now.toISOString(),
    reason,
  };
  return meta;
}

export function clearTrustForSave(rowMeta: unknown): Record<string, unknown> {
  const meta: Record<string, unknown> = isRecord(rowMeta)
    ? { ...rowMeta }
    : { owner: 'waycraft', version: 1 };
  // Saving reviewed config through create path starts untrusted.
  if (!meta.trust) meta.trust = emptyTrust('save_does_not_imply_trust');
  return meta;
}

export function assertTrustApprovedForAction(
  trust: McpTrustApproval,
  action: string,
): void {
  if (trust.state === 'trusted') return;
  const msg =
    trust.state === 'invalidated'
      ? `Trust approval invalidated for this server; review material changes and re-approve before ${action}.`
      : `Trust approval required before ${action}. Saving does not imply trust.`;
  const err = new Error(msg) as Error & {
    code: string;
    trust: McpTrustApproval;
  };
  err.code = 'trust_required';
  err.trust = trust;
  throw err;
}
