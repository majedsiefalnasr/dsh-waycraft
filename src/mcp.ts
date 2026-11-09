/**
 * Waycraft MCP Manager — host-side component entry point.
 *
 * V1 (Option D — Supported-only V1) scope: default-disabled Loader row.
 * #163: Owner-authorized management RPC + browser panel integration.
 * #165: safe persistent CRUD for MCP server entries in DSH cordis.patch.yml
 * (atomic replace, optimistic concurrency, unknown-field preservation).
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { McpCordisConfigStore } from './mcp-config-store.js';
import { sanitizeMcpObservable } from './mcp-credentials.js';

export const name = 'dsh-waycraft/mcp';
export const inject = ['connection'] as const;

const MCP_ROUTE = '/api/waycraft-mcp.manage';
const MCP_HEADER = 'x-waycraft-mcp';
const MAX_REQUEST = 64 * 1024;

export interface Config {}

function json(data: unknown, status = 200): Response {
  const safe = sanitizeMcpObservable(data);
  return new Response(JSON.stringify(safe), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function reject(status: number, message: string, extra?: Record<string, unknown>): Response {
  return json({ ok: false, error: sanitizeMcpObservable(message), ...sanitizeMcpObservable(extra || {}) }, status);
}

function isOwnerRequest(request: Request): boolean {
  // Defense in depth. DSH's connection fetch layer owner-gates exact /api routes
  // for non-owner peers before the handler runs; this guard protects against
  // misconfiguration and makes authorization explicit in tests/harnesses.
  const peer = (request as any).peer ?? (request as any).__dshPeer;
  if (peer && typeof peer === 'object') {
    if (peer.owner === true) return true;
    if (peer.role === 'owner') return true;
    if (peer.isOwner === true) return true;
    if (peer.owner === false || peer.role === 'paired' || peer.isOwner === false)
      return false;
  }
  return true;
}

function resolveCordisPatchPath(): string {
  if (process.env.DSH_CORDIS_PATCH_PATH) return process.env.DSH_CORDIS_PATCH_PATH;
  const home = process.env.DSH_HOME || join(homedir(), '.dsh');
  const profile = process.env.DSH_PROFILE || 'desktop';
  return join(home, 'profiles', profile, 'cordis.patch.yml');
}

function mapPersistenceStatus(code?: string): number {
  switch (code) {
    case 'validation': return 400;
    case 'conflict': return 409;
    case 'not_found': return 404;
    case 'exists': return 409;
    case 'parse': return 422;
    default: return 500;
  }
}

export function apply(ctx: any, _config: Config = {}): void {
  ctx.inject?.(['connection'], (target: any) => {
    const connection = target.get?.('connection');
    if (!connection?.fetch?.register) return;
    const store = new McpCordisConfigStore({ configPath: resolveCordisPatchPath() });
    const dispose = connection.fetch.register({
      path: MCP_ROUTE,
      methods: ['POST'],
      requestBody: 'buffered',
      async fetch(request: Request) {
        if (!isOwnerRequest(request)) return reject(403, 'Owner authorization required');
        if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
          return reject(415, 'JSON required');
        }
        const origin = request.headers.get('origin');
        if (origin && origin !== new URL(request.url).origin) return reject(403, 'Origin rejected');
        if (request.headers.get('sec-fetch-site') === 'cross-site') return reject(403, 'Origin rejected');
        if (request.headers.get(MCP_HEADER) !== '1') return reject(400, 'Missing MCP client marker');
        let body: any;
        try {
          const text = await request.text();
          if (text.length > MAX_REQUEST) return reject(413, 'Request too large');
          body = text ? JSON.parse(text) : {};
        } catch {
          return reject(400, 'Invalid JSON');
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) return reject(400, 'Invalid request');
        const action = body.action;
        const expectedFingerprint = typeof body.expectedFingerprint === 'string' ? body.expectedFingerprint : undefined;
        if (action === 'status') {
          return json({ ok: true, component: 'mcp', authorized: true, version: 1 });
        }
        if (action === 'list') {
          const result = await store.list();
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to list MCP servers', { code: result.code, fingerprint: result.fingerprint });
          return json({ ok: true, fingerprint: result.fingerprint, servers: result.servers });
        }
        if (action === 'create') {
          const result = await store.create(body.config ?? body.server ?? body, expectedFingerprint);
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to create MCP server', { code: result.code, issues: result.issues, fingerprint: result.fingerprint });
          return json({ ok: true, fingerprint: result.fingerprint, server: result.server, servers: result.servers });
        }
        if (action === 'update') {
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          const result = await store.update(serverName, body.patch ?? body.config ?? {}, expectedFingerprint);
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to update MCP server', { code: result.code, issues: result.issues, fingerprint: result.fingerprint });
          return json({ ok: true, fingerprint: result.fingerprint, server: result.server, servers: result.servers });
        }
        if (action === 'remove' || action === 'delete') {
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          const result = await store.remove(serverName, expectedFingerprint);
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to remove MCP server', { code: result.code, fingerprint: result.fingerprint });
          return json({ ok: true, fingerprint: result.fingerprint, servers: result.servers });
        }
        return reject(400, 'Unknown action');
      },
    });
    if (typeof ctx.on === 'function') ctx.on('dispose', dispose);
    else if (typeof ctx.effect === 'function') ctx.effect(() => dispose);
  });
}
