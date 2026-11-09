/**
 * Waycraft MCP Manager — host-side component entry point.
 *
 * V1 (Option D — Supported-only V1) scope: default-disabled Loader row.
 * This ticket (#163) adds host-side Owner-authorized management RPC and
 * browser panel integration. Server CRUD/config/UI come in later tickets.
 */
export const name = 'dsh-waycraft/mcp';
export const inject = ['connection'] as const;

const MCP_ROUTE = '/api/waycraft-mcp.manage';
const MCP_HEADER = 'x-waycraft-mcp';
const MAX_REQUEST = 64 * 1024;

export interface Config {}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function reject(status: number, message: string): Response {
  return json({ ok: false, error: message }, status);
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
    // Explicit non-owner peer identity.
    if (peer.owner === false || peer.role === 'paired' || peer.isOwner === false)
      return false;
  }
  // When peer identity is not attached, rely on DSH connection-layer gating.
  return true;
}

export function apply(ctx: any, _config: Config = {}): void {
  ctx.inject?.(['connection'], (target: any) => {
    const connection = target.get?.('connection');
    if (!connection?.fetch?.register) return;
    const dispose = connection.fetch.register({
      path: MCP_ROUTE,
      methods: ['POST'],
      requestBody: 'buffered',
      async fetch(request: Request) {
        if (!isOwnerRequest(request)) {
          return reject(403, 'Owner authorization required');
        }
        if (
          request.headers.get('content-type')?.split(';')[0] !== 'application/json'
        ) {
          return reject(415, 'JSON required');
        }
        const origin = request.headers.get('origin');
        if (origin && origin !== new URL(request.url).origin) {
          return reject(403, 'Origin rejected');
        }
        if (request.headers.get('sec-fetch-site') === 'cross-site') {
          return reject(403, 'Origin rejected');
        }
        if (request.headers.get(MCP_HEADER) !== '1') {
          // Require explicit client marker to reduce ambient authority.
          return reject(400, 'Missing MCP client marker');
        }
        let body: any;
        try {
          const text = await request.text();
          if (text.length > MAX_REQUEST) return reject(413, 'Request too large');
          body = text ? JSON.parse(text) : {};
        } catch {
          return reject(400, 'Invalid JSON');
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return reject(400, 'Invalid request');
        }
        const action = body.action;
        if (action === 'status') {
          return json({
            ok: true,
            component: 'mcp',
            authorized: true,
            version: 1,
          });
        }
        return reject(400, 'Unknown action');
      },
    });
    // Register disposal if the context supports it.
    if (typeof ctx.on === 'function') ctx.on('dispose', dispose);
    else if (typeof ctx.effect === 'function') ctx.effect(() => dispose);
  });
}
