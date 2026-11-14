// Owned-agent disposal and status degradation (ticket #130 item 7, plus the reference rpc.spec.ts corrupt-entry case,
// V1ki/dsh-plugin-subscriptions v0.9.12 b802311, MIT). Real cordis Context and LlmRuntime; no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, access } from 'node:fs/promises';
import { LlmRuntime } from '@deepseek-ai/dsh-llm';
import { Context } from '@deepseek-ai/cordis';
import { ToolRuntime } from '@deepseek-ai/dsh-tools';
import { WebRuntime } from '@deepseek-ai/dsh-web';
import * as plugin from '../dist/subscriptions.js';

function mount(ctx, options = {}, services = true) {
  const routes = new Map();
  // Real DSH services: registrations are owned by the calling fiber, so plugin disposal must release them.
  if (services) {
    ctx.provide('systemPrompt', {
      tools() {},
      section() {
        return () => undefined;
      },
      getSectionOrder() {
        return 0;
      },
    });
    ctx.set('llm', new LlmRuntime(ctx));
    ctx.set('tools', new ToolRuntime(ctx, {}));
    ctx.set(
      'web',
      new WebRuntime(ctx, {
        searchProvider: { get: () => undefined },
        fetchProvider: { get: () => undefined },
      }),
    );
  }
  const llm = ctx.llm,
    toolRuntime = ctx.tools,
    webRuntime = ctx.web;
  if (services)
    ctx.provide('connection', {
      fetch: {
        register(route) {
          routes.set(route.path, route);
          return async () => {
            routes.delete(route.path);
          };
        },
      },
    });
  else
    ctx.connection.fetch.register = (route) => {
      routes.set(route.path, route);
      return async () => {
        routes.delete(route.path);
      };
    };
  const runtime = ctx.plugin(plugin, {
    codexClientVersion: '1.2.3',
    models: { codex: [{ id: 'm1', name: 'Model 1' }] },
    ...options,
  });
  const call = async (endpoint, payload = {}) => {
    const method = `waycraft-subscriptions.${endpoint}`;
    const response = await routes.get(`/api/${method}`).fetch(
      new Request(`http://127.0.0.1/api/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'client-request',
          rpcId: 'r',
          method,
          payload,
        }),
      }),
    );
    return (await response.json()).result;
  };
  const tools = { has: (name) => toolRuntime.get(name) !== undefined };
  const search = (query) => webRuntime.search({ query });
  return { llm, routes, tools, search, runtime, call };
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

test('disposing the component removes every owned registration and stops owned work; remounting restores them', async () => {
  process.env.DSH_HOME = await mkdtemp('/tmp/waycraft-t130/lifecycle-');
  const savedFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error('network forbidden');
  };
  const ctx = new Context();
  const first = mount(ctx);
  try {
    await settle();
    assert.equal(
      first.routes.size,
      57,
      '28 owned routes under both the waycraft prefix and the deprecated legacy prefix, plus the binary videoFile GET route',
    );
    assert.equal(
      first.routes.has('/api/waycraft-subscriptions.setZenEnabled'),
      true,
    );
    assert.deepEqual(
      first.llm.listProviders().map((provider) => provider.id),
      ['opencode-zen', 'codex', 'claude', 'grok', 'copilot', 'antigravity'],
    );
    assert.equal(
      first.tools.has('image_generate'),
      true,
      'image_generate registered on the real tool runtime',
    );
    await assert.rejects(
      first.search('q'),
      (error) => error.code === 'CODEX_AUTH_REQUIRED',
      'the mounted Codex provider owns web search (no login → its own auth error)',
    );
    assert.equal(
      (await first.call('login', { provider: 'codex' })).ok,
      true,
      'a pending authorization exists',
    );
    const stale = first.routes.get('/api/waycraft-subscriptions.status');
    first.runtime.dispose();
    await settle();
    assert.equal(first.routes.size, 0, 'routes removed');
    assert.deepEqual(
      first.llm.listProviders(),
      [],
      'provider adapter unregistered',
    );
    assert.equal(first.tools.has('image_generate'), false, 'tool unregistered');
    await assert.rejects(
      first.search('q'),
      (error) => error.code === 'WEB_PROVIDER_UNAVAILABLE',
      'web search provider unregistered',
    );
    const late = await stale.fetch(
      new Request('http://127.0.0.1/api/waycraft-subscriptions.status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'client-request',
          rpcId: 'r',
          method: 'waycraft-subscriptions.status',
          payload: {},
        }),
      }),
    );
    const lateResult = (await late.json()).result;
    assert.equal(
      lateResult.ok,
      false,
      'a stale route handler refuses to work after disposal',
    );
    assert.match(
      lateResult.error?.message ?? JSON.stringify(lateResult),
      /disabled/,
    );
    assert.deepEqual(
      await (await import('../dist/auth/store.js')).listAccounts('codex'),
      [],
      'a cancelled authorization persists nothing',
    );
    assert.equal(requests, 0, 'no network request was made');
    // A second mount of the same module works and is independent of the disposed one.
    const second = mount(ctx, {}, false);
    await settle();
    assert.equal(second.routes.size, 57);
    assert.equal(
      second.routes.has('/api/waycraft-subscriptions.setZenEnabled'),
      true,
    );
    assert.equal((await second.call('status')).ok, true);
    second.runtime.dispose();
  } finally {
    globalThis.fetch = savedFetch;
  }
});

test('status degrades per entry: a corrupt saved account is skipped while the call still succeeds', async () => {
  const home = (process.env.DSH_HOME = await mkdtemp(
    '/tmp/waycraft-t130/corrupt-',
  ));
  const dir = `${home}/plugins/waycraft/subscriptions`;
  await mkdir(dir, { recursive: true });
  await writeFile(
    `${dir}/auth.json`,
    JSON.stringify({
      codex: {
        default: 'good',
        accounts: {
          good: {
            accessToken: 'synthetic-a',
            refreshToken: 'synthetic-r',
            expiresAt: Date.now() + 3600_000,
            accountId: 'good',
          },
          corrupt: { accessToken: '', refreshToken: '', expiresAt: 0 },
        },
      },
    }),
    { mode: 0o600 },
  );
  const ctx = new Context();
  const host = mount(ctx);
  try {
    await settle();
    const status = await host.call('status');
    assert.equal(status.ok, true, 'the status call itself succeeds');
    assert.deepEqual(
      status.value.providers.codex.accounts.map((account) => account.key),
      ['good'],
      'the corrupt entry is skipped',
    );
  } finally {
    host.runtime.dispose();
  }
});

test('a structurally broken store surfaces a safe actionable error without crashing mount', async () => {
  const home = (process.env.DSH_HOME = await mkdtemp(
    '/tmp/waycraft-t130/broken-',
  ));
  const dir = `${home}/plugins/waycraft/subscriptions`;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/auth.json`, '{ not json', { mode: 0o600 });
  const ctx = new Context();
  const host = mount(ctx);
  try {
    await settle();
    const status = await host.call('status');
    assert.equal(status.ok, false);
    assert.match(status.error.message, /not valid JSON/);
    assert.doesNotMatch(JSON.stringify(status), /not json/);
    assert.equal(
      (await host.call('proxyGet')).ok,
      true,
      'unrelated endpoints keep working',
    );
  } finally {
    host.runtime.dispose();
  }
});
