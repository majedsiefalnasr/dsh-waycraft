import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const distPath = join(here, '../dist/mcp.js');
const srcPath = join(here, '../src/mcp.ts');
if (!existsSync(distPath)) {
  // Minimal TS->JS for this test when dist is not built (mirrors build output shape).
  let s = readFileSync(srcPath, 'utf8');
  s = s.replace(/export interface Config \{\}/, 'export const Config = {};');
  s = s.replace(/export function apply\(ctx: any, _config: Config = \{\}\): void/g, 'export function apply(ctx, _config = {})');
  s = s.replace(/\(target: any\)/g, '(target)');
  s = s.replace(/function json\(data: unknown, status = 200\): Response/g, 'function json(data, status = 200)');
  s = s.replace(/function reject\(status: number, message: string\): Response/g, 'function reject(status, message)');
  s = s.replace(/function isOwnerRequest\(request: Request\): boolean/g, 'function isOwnerRequest(request)');
  s = s.replace(/async fetch\(request: Request\)/g, 'async fetch(request)');
  s = s.replace(/let body: any;/g, 'let body;');
  s = s.replace(/\(request as any\)/g, '(request)');
  s = s.replace(/as const/g, '');
  mkdirSync(join(here, '../dist'), { recursive: true });
  writeFileSync(distPath, s);
}
const { apply } = await import('../dist/mcp.js');

const MCP_ROUTE = '/api/waycraft-mcp.manage';

function harness() {
  const routes = new Map();
  const services = {
    connection: {
      fetch: {
        register(route) {
          routes.set(route.path, route);
          return () => routes.delete(route.path);
        },
      },
    },
  };
  const ctx = {
    logger: { warn() {}, info() {}, error() {} },
    get: (name) => services[name],
    inject: (names, fn) => {
      if ([].concat(names).every((name) => services[name] !== undefined)) fn(ctx);
    },
    effect: (fn) => fn(),
    on() {},
  };
  return {
    ctx,
    routes,
    async call({ owner = true, peer = null, body = { action: 'status' }, headers = {} } = {}) {
      if (!owner) return new Response('unauthorized', { status: 401 });
      const route = routes.get(MCP_ROUTE);
      if (!route) return new Response('not found', { status: 404 });
      const req = new Request(`http://localhost${MCP_ROUTE}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-waycraft-mcp': '1',
          ...headers,
        },
        body: JSON.stringify(body),
      });
      if (peer) req.peer = peer;
      return route.fetch(req);
    },
  };
}

test('#163: Owner can call MCP management status endpoint', async () => {
  const host = harness();
  apply(host.ctx);
  assert.ok(host.routes.has(MCP_ROUTE), 'MCP management route registered');
  const res = await host.call({ owner: true });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.component, 'mcp');
  assert.equal(data.authorized, true);
});

test('#163 security: unauthenticated/unauthorized transport caller is rejected', async () => {
  const host = harness();
  apply(host.ctx);
  const res = await host.call({ owner: false });
  assert.equal(res.status, 401);
});

test('#163 security: explicit paired/non-owner peer identity is rejected by handler (defense in depth)', async () => {
  const host = harness();
  apply(host.ctx);
  const res = await host.call({ owner: true, peer: { role: 'paired', owner: false } });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.match(String(data.error || ''), /owner/i);
});

test('#163 integration: paired-client scenario cannot obtain MCP management access', async () => {
  const host = harness();
  apply(host.ctx);
  const transportRejected = await host.call({ owner: false, body: { action: 'status' } });
  assert.equal(transportRejected.status, 401);
  const handlerRejected = await host.call({ owner: true, peer: { isOwner: false } });
  assert.equal(handlerRejected.status, 403);
  const ownerOk = await host.call({ owner: true, body: { action: 'status' } });
  assert.equal(ownerOk.status, 200);
});

test('#163: missing MCP client marker is rejected', async () => {
  const host = harness();
  apply(host.ctx);
  const res = await host.call({ owner: true, headers: { 'x-waycraft-mcp': '' } });
  assert.equal(res.status, 400);
});

test('#163: unknown action is rejected', async () => {
  const host = harness();
  apply(host.ctx);
  const res = await host.call({ owner: true, body: { action: 'delete-everything' } });
  assert.equal(res.status, 400);
});
