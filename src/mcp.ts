/**
 * Waycraft MCP Manager — host-side component entry point.
 *
 * V1 (Option D — Supported-only V1) scope: default-disabled Loader row.
 * #163: Owner-authorized management RPC + browser panel integration.
 * #165: safe persistent CRUD for MCP server entries in DSH cordis.patch.yml
 * (atomic replace, optimistic concurrency, unknown-field preservation).
 * #168: explicit connection testing/status reporting (trust-gated).
 * #169: read-only tool enumeration/cache with freshness (explicit only, no eager connections).
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { McpCordisConfigStore } from './mcp-config-store.js';
import { testMcpConnection } from './mcp-connection-test.js';
import { sanitizeMcpObservable } from './mcp-credentials.js';
import { assertTrustApprovedForAction } from './mcp-trust.js';
import { McpToolCacheStore, resolveMcpToolCachePath, searchMcpTools } from './mcp-tool-cache.js';
import { previewMcpImport, registerMcpImport, type McpImportRegisterItem } from './mcp-import.js';
import { discoverMcpConfigs } from './mcp-discovery.js';

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
  // Fail closed for explicit peer metadata that is not Owner; when no peer metadata
  // is present, rely on DSH transport owner-gating (primary enforcement).
  const peer = (request as any).peer ?? (request as any).__dshPeer;
  if (peer && typeof peer === 'object') {
    if (peer.owner === true) return true;
    if (peer.role === 'owner') return true;
    if (peer.isOwner === true) return true;
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
    case 'trust_required': return 403;
    case 'confirm_required': return 409;
    case 'ownership': return 403;
    case 'blocked': return 409;
    case 'trashed': return 409;
    default: return 500;
  }
}

export function apply(ctx: any, config: Config = {}): void {
  ctx.inject?.(['connection'], (target: any) => {
    const connection = target.get?.('connection');
    if (!connection?.fetch?.register) return;
    const configPath = typeof config?.configPath === 'string' && config.configPath ? config.configPath : resolveCordisPatchPath();
    const store = new McpCordisConfigStore({ configPath });
    const toolCache = new McpToolCacheStore(resolveMcpToolCachePath({ configPath }));
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
          // #169: read-only listing. Never probes/enumerates tools.
          // #173: includes trashed entries separately; trashed entries are operationally inactive.
          const result = await store.list();
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to list MCP servers', { code: result.code, fingerprint: result.fingerprint });
          return json({ ok: true, fingerprint: result.fingerprint, servers: result.servers, trashedServers: result.trashedServers || [] });
        }
        if (action === 'list_trash' || action === 'trash_list') {
          const result = await store.listTrash();
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to list trashed MCP servers', { code: result.code, fingerprint: result.fingerprint });
          return json({ ok: true, fingerprint: result.fingerprint, trashedServers: result.trashedServers || [] });
        }
        if (action === 'list_tools') {
          // #169: read-only cached enumeration. No eager connections.
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          const query = typeof body.query === 'string' ? body.query : undefined;
          if (typeof serverName === 'string' && serverName) {
            const trust = await store.trustStatus(serverName);
            if (!trust.ok || !trust.server) return reject(mapPersistenceStatus(trust.code), trust.message || 'Server not found', { code: trust.code, fingerprint: trust.fingerprint });
            const entry = await toolCache.get(serverName, (trust.server as any).config);
            const tools = searchMcpTools(entry.tools || [], query);
            return json({ ok: true, fingerprint: trust.fingerprint, serverName, cache: sanitizeMcpObservable({ ...entry, tools }), query: query || undefined });
          }
          const result = await store.list();
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to list MCP servers', { code: result.code, fingerprint: result.fingerprint });
          const configsByName = Object.fromEntries((result.servers || []).map((s: any) => [s.serverName, s.config]));
          const cache = await toolCache.list(configsByName);
          const filtered = query ? Object.fromEntries(Object.entries(cache).map(([k, v]) => [k, sanitizeMcpObservable({ ...v, tools: searchMcpTools(v.tools || [], query) })])) : cache;
          return json({ ok: true, fingerprint: result.fingerprint, cache: filtered, query: query || undefined });
        }
        if (action === 'refresh_tools' || action === 'enumerate_tools') {
          // #169: explicit on-demand enumeration only. Trust-gated. Never eager on import/list.
          // #173: trashed entries are operationally inactive; do not connect/probe.
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          const trust = await store.trustStatus(serverName);
          if (!trust.ok || !trust.server) return reject(mapPersistenceStatus(trust.code), trust.message || 'Failed to get trust status', { code: trust.code, fingerprint: trust.fingerprint });
          if ((trust.server as any).trash?.trashed) return reject(409, `Server is in trash and operationally inactive: ${serverName}`, { code: 'trashed', fingerprint: trust.fingerprint });
          try { assertTrustApprovedForAction((trust.server as any).trust, 'refresh_tools'); } catch (err: any) {
            return reject(403, err.message, { code: err.code || 'trust_required', trust: err.trust, fingerprint: trust.fingerprint });
          }
          const server = trust.server as any;
          const probe = await testMcpConnection(serverName, server.config, {
            ctx,
            timeoutMs: typeof body.timeoutMs === 'number' ? body.timeoutMs : undefined,
            maxPages: typeof body.maxPages === 'number' ? body.maxPages : undefined,
            maxToolNames: typeof body.maxToolNames === 'number' ? body.maxToolNames : undefined,
          });
          const cacheEntry = await toolCache.updateFromProbe(serverName, server.config, { ok: probe.ok, message: probe.message, tools: (probe as any).tools, toolNames: probe.toolNames, truncated: probe.truncated, capability: probe.capability });
          const query = typeof body.query === 'string' ? body.query : undefined;
          const tools = searchMcpTools(cacheEntry.tools || [], query);
          return json({ ok: probe.ok, fingerprint: trust.fingerprint, server: sanitizeMcpObservable(server), probe: sanitizeMcpObservable(probe), cache: sanitizeMcpObservable({ ...cacheEntry, tools }), query: query || undefined }, probe.ok ? 200 : 502);
        }
        if (action === 'create') {
          const result = await store.create(body.config ?? body.server ?? body, expectedFingerprint);
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to create MCP server', { code: result.code, issues: result.issues, fingerprint: result.fingerprint });
          if (result.server?.serverName) await toolCache.invalidate(result.server.serverName, 'config_changed');
          return json({ ok: true, fingerprint: result.fingerprint, server: result.server, servers: result.servers });
        }
        if (action === 'update') {
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          const result = await store.update(serverName, body.patch ?? body.config ?? {}, expectedFingerprint);
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to update MCP server', { code: result.code, issues: result.issues, fingerprint: result.fingerprint });
          // #169: config/scope/policy changes invalidate enumeration cache.
          await toolCache.invalidate(serverName, 'config_scope_or_policy_changed');
          return json({ ok: true, fingerprint: result.fingerprint, server: result.server, servers: result.servers });
        }
        if (action === 'trash' || action === 'move_to_trash') {
          // #173: move to trash (operationally inactive, removed from active list, preserved for restore).
          // Not cosmetic: store sets disabled + trash metadata; ownership limitations documented.
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          const result = await store.moveToTrash(serverName, expectedFingerprint);
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to move MCP server to trash', { code: result.code, fingerprint: result.fingerprint, limitation: result.limitation });
          await toolCache.invalidate(serverName, 'trashed');
          return json({ ok: true, fingerprint: result.fingerprint, server: result.server, servers: result.servers, trashedServers: result.trashedServers, limitation: result.limitation });
        }
        if (action === 'restore' || action === 'restore_trash') {
          // #173: restore revalidates identity/conflicts, credential refs, trust requirements.
          // Default restored state is non-running/disabled; trust requires revalidation.
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          const result = await store.restore(serverName, expectedFingerprint);
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to restore MCP server', { code: result.code, fingerprint: result.fingerprint, issues: result.issues, limitation: result.limitation });
          await toolCache.invalidate(serverName, 'restored');
          return json({ ok: true, fingerprint: result.fingerprint, server: result.server, servers: result.servers, trashedServers: result.trashedServers });
        }
        if (action === 'permanent_delete' || action === 'delete_permanent' || action === 'remove' || action === 'delete') {
          // #173/#176: permanent deletion always requires explicit confirmation (spec §250).
          // `remove`/`delete` remain as compatibility aliases but are never implicit/destructive.
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          if (body.confirm !== true) return reject(409, 'Explicit confirmation required for permanent delete', { code: 'confirm_required' });
          const result = await store.permanentDelete(serverName, expectedFingerprint, { confirm: true });
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to delete MCP server', { code: result.code, fingerprint: result.fingerprint, limitation: result.limitation });
          await toolCache.remove(serverName);
          return json({ ok: true, fingerprint: result.fingerprint, servers: result.servers, trashedServers: result.trashedServers, limitation: result.limitation, removed: true });
        }
        if (action === 'trust_status') {
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          const result = await store.trustStatus(serverName);
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to get trust status', { code: result.code, fingerprint: result.fingerprint });
          return json({ ok: true, fingerprint: result.fingerprint, server: result.server });
        }
        if (action === 'approve_trust') {
          // #167: explicit Owner trust approval binds to reviewed configuration fingerprint.
          // #169: policy/trust activation changes invalidate cached enumeration.
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          const result = await store.approveTrust(serverName, expectedFingerprint);
          if (!result.ok) return reject(mapPersistenceStatus(result.code), result.message || 'Failed to approve trust', { code: result.code, fingerprint: result.fingerprint });
          await toolCache.invalidate(serverName, 'policy_change');
          return json({ ok: true, fingerprint: result.fingerprint, server: result.server, servers: result.servers });
        }
        if (action === 'test_connection') {
          // #167/#168: explicit connection testing cannot bypass required trust approval.
          // No auto-test on import/create (action is explicit only).
          // #169: explicit test refreshes enumeration cache on success/failure.
          // #173: trashed entries are operationally inactive; do not connect/probe.
          const serverName = typeof body.serverName === 'string' ? body.serverName : body.config?.serverName;
          if (typeof serverName !== 'string' || !serverName) return reject(400, 'serverName required');
          const trust = await store.trustStatus(serverName);
          if (!trust.ok || !trust.server) return reject(mapPersistenceStatus(trust.code), trust.message || 'Failed to get trust status', { code: trust.code, fingerprint: trust.fingerprint });
          if ((trust.server as any).trash?.trashed) return reject(409, `Server is in trash and operationally inactive: ${serverName}`, { code: 'trashed', fingerprint: trust.fingerprint });
          try { assertTrustApprovedForAction((trust.server as any).trust, 'test_connection'); } catch (err: any) {
            return reject(403, err.message, { code: err.code || 'trust_required', trust: err.trust, fingerprint: trust.fingerprint });
          }
          const server = trust.server as any;
          const test = await testMcpConnection(serverName, server.config, {
            ctx,
            timeoutMs: typeof body.timeoutMs === 'number' ? body.timeoutMs : undefined,
            maxPages: typeof body.maxPages === 'number' ? body.maxPages : undefined,
            maxToolNames: typeof body.maxToolNames === 'number' ? body.maxToolNames : undefined,
          });
          const cacheEntry = await toolCache.updateFromProbe(serverName, server.config, { ok: test.ok, message: test.message, tools: (test as any).tools, toolNames: test.toolNames, truncated: test.truncated, capability: test.capability });
          // Return actionable success/failure; never expose raw secrets.
          return json({ ok: test.ok, fingerprint: trust.fingerprint, server: sanitizeMcpObservable(server), test: sanitizeMcpObservable(test), toolCache: sanitizeMcpObservable(cacheEntry) }, test.ok ? 200 : 502);
        }
        if (action === 'import_preview') {
          // #171: parse/validate/normalize/preview. Never executes imported servers.
          if (!body || typeof body !== 'object' || !('input' in body)) return reject(400, 'input required');
          const input = (body as any).input;
          const list = await store.list();
          const preview = previewMcpImport(input, { existingServerNames: list.servers.map((s: any) => s.serverName) });
          return json({ ok: preview.ok, fingerprint: list.fingerprint, preview: sanitizeMcpObservable(preview) }, preview.ok ? 200 : 400);
        }
        if (action === 'import_register') {
          // #171: explicit registration approval only. No auto-execution, no auto-trust.
          if (!body || typeof body !== 'object' || !('preview' in body)) return reject(400, 'preview required');
          const preview = (body as any).preview;
          const approvals = Array.isArray((body as any).approvals) ? (body as any).approvals as McpImportRegisterItem[] : [];
          if (!approvals.some((a) => a && a.approved)) return reject(400, 'At least one explicitly approved candidate is required');
          const result = await registerMcpImport(preview, approvals, {
            existingServerNames: async () => (await store.list()).servers.map((s: any) => s.serverName),
            create: async (config) => {
              const created = await store.create(config);
              if (created.ok && created.server) await toolCache.invalidate((created.server as any).serverName, 'policy_change');
              return { ok: !!created.ok, message: created.message, code: created.code };
            },
            replace: async (serverName, config) => {
              // Explicit conflict resolution only. Preserve identity; do not test/connect.
              const fp = (await store.list()).fingerprint;
              const updated = await store.update(serverName, config, fp);
              if (updated.ok) await toolCache.invalidate(serverName, 'config_change');
              return { ok: !!updated.ok, message: updated.message, code: updated.code };
            },
          });
          const list = await store.list();
          return json({ ok: result.ok, fingerprint: list.fingerprint, import: sanitizeMcpObservable(result), servers: list.servers }, result.ok ? 200 : 207);
        }
        if (action === 'discover' || action === 'discover_filesystem') {
          // #172: scan only user-approved folders for known MCP config files.
          // Explicit Owner action; no command execution; no auto-activation/registration.
          const roots = Array.isArray(body?.roots) ? body.roots.filter((r: unknown): r is string => typeof r === 'string') : [];
          if (!roots.length) return reject(400, 'roots required (approved search roots)');
          const list = await store.list();
          const discovery = await discoverMcpConfigs({
            roots,
            existingServerNames: list.servers.map((s: any) => s.serverName),
            maxFileBytes: typeof body?.maxFileBytes === 'number' ? body.maxFileBytes : undefined,
            maxFiles: typeof body?.maxFiles === 'number' ? body.maxFiles : undefined,
          });
          return json({ ok: discovery.ok, fingerprint: list.fingerprint, discovery: sanitizeMcpObservable(discovery) }, 200);
        }
        return reject(400, 'Unknown action');
      },
    });
    if (typeof ctx.on === 'function') ctx.on('dispose', dispose);
    else if (typeof ctx.effect === 'function') ctx.effect(() => dispose);
  });
}
