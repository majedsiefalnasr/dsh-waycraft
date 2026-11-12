import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply } from '../dist/subscriptions.js';
import { apply as coreApply } from '../index.js';
import { mkdtempSync } from 'node:fs';
process.env.DSH_HOME = mkdtempSync('/tmp/waycraft-t129-host-');

function harness() {
  const routes = new Map();
  let font;
  const services = {
    connection: {
      fetch: {
        register(route) {
          routes.set(route.path, route);
          return () => routes.delete(route.path);
        },
      },
    },
    webServer: {
      register(route) {
        font = route;
        return () => {
          font = undefined;
        };
      },
    },
  };
  const ctx = {
    llm: {
      registerAdapter() {
        return { replace() {} };
      },
    },
    logger: { warn() {} },
    get: (name) => services[name],
    reflect: { get: (name) => services[name] },
    inject: (names, fn) => {
      if ([].concat(names).every((name) => services[name] !== undefined))
        fn(ctx);
    },
    effect: (fn) => fn(),
  };
  return {
    ctx,
    services,
    routes,
    get font() {
      return font;
    },
    async call(owner = true, body = {}) {
      // DSH's shared /api transport authenticates and owner-gates exact routes.
      if (!owner) return new Response('unauthorized', { status: 401 });
      const route = routes.get('/api/waycraft-subscriptions.status');
      if (!route) return new Response('not found', { status: 404 });
      return route.fetch(
        new Request('http://localhost/api/waycraft-subscriptions.status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: 'client-request',
            rpcId: 'probe',
            method: 'waycraft-subscriptions.status',
            ...body,
          }),
        }),
      );
    },
  };
}

test('Owner can probe the mounted component; unauthenticated calls are rejected', async () => {
  const host = harness();
  apply(host.ctx);
  assert.equal(host.routes.size, 53);
  assert.ok(
    host.routes.has('/api/waycraft-subscriptions.zenStatus'),
    'dedicated lazy Zen status route',
  );
  assert.ok(
    host.routes.has('/api/waycraft-subscriptions.setZenEnabled'),
    'persisted Zen availability route',
  );
  const response = await host.call();
  assert.equal(response.status, 200);
  const envelope = await response.json();
  assert.equal(envelope.result.value.component, 'subscriptions');
  assert.deepEqual(envelope.result.value.providers.codex.accounts, []);
  assert.equal((await host.call(false)).status, 401);
});

test('invalid probe envelopes are rejected', async () => {
  const host = harness();
  apply(host.ctx);
  assert.equal((await host.call(true, { method: 'other' })).status, 400);
});

test('a component registration error leaves the independently mounted core font route running', async () => {
  const host = harness();
  coreApply(host.ctx);
  host.services.connection.fetch.register = () => {
    throw new Error('component failed');
  };
  assert.throws(() => apply(host.ctx), /component failed/);
  let status;
  await host.font.handler(
    {
      method: 'HEAD',
      url: '/plugins/dsh-waycraft/fonts/inter-latin-wght-normal.woff2',
    },
    {
      writeHead(value) {
        status = value;
      },
      end() {},
    },
  );
  assert.equal(status, 200);
});
