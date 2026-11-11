import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
function api(timers = {}) {
  const exports = {};
  const js = ts.transpileModule(readFileSync('src/mcp-registry.ts', 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(js, {
    exports,
    URL,
    Response,
    AbortController,
    setTimeout,
    clearTimeout,
    TextDecoder,
    fetch,
    ...timers,
  });
  return exports;
}

test('Registry rejects invalid input before network and fails closed on unbounded or malformed metadata', async () => {
  const { searchMcpRegistry } = api();
  let calls = 0;
  const network = {
    fetch: async () => {
      calls++;
      return Response.json({ servers: [] });
    },
  };
  for (const input of [
    { query: 'x'.repeat(201) },
    { cursor: 'x'.repeat(2049) },
    { limit: 26 },
    { limit: '20' },
  ]) {
    await assert.rejects(searchMcpRegistry(input, network), {
      code: 'registry_input',
    });
  }
  assert.equal(calls, 0);
  await assert.rejects(
    searchMcpRegistry(
      {},
      {
        fetch: async () =>
          Response.json({ servers: [{ server: { name: 'demo' } }] }),
      },
    ),
    { code: 'registry_response' },
  );
  await assert.rejects(
    searchMcpRegistry(
      {},
      { fetch: async () => new Response('x'.repeat(1024 * 1024 + 1)) },
    ),
    { code: 'registry_size' },
  );
  await assert.rejects(
    searchMcpRegistry(
      {},
      { fetch: async () => new Response('', { status: 429 }) },
    ),
    { code: 'registry_upstream' },
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    searchMcpRegistry({}, { signal: controller.signal, ...network }),
    { code: 'registry_cancelled' },
  );
  assert.equal(calls, 0);
});
test('Registry timeout and cancellation abort transport and clean timers', async () => {
  let timeout;
  let cleared = 0;
  const { searchMcpRegistry } = api({
    setTimeout: (fn) => {
      timeout = fn;
      return 1;
    },
    clearTimeout: () => cleared++,
  });
  const blocked = async (_url, { signal }) =>
    new Promise((_resolve, reject) =>
      signal.addEventListener(
        'abort',
        () => reject(Error('private transport detail')),
        { once: true },
      ),
    );
  const timed = searchMcpRegistry({}, { fetch: blocked });
  timeout();
  await assert.rejects(timed, { code: 'registry_timeout' });
  const controller = new AbortController();
  const cancelled = searchMcpRegistry(
    {},
    { fetch: blocked, signal: controller.signal },
  );
  controller.abort();
  await assert.rejects(cancelled, { code: 'registry_cancelled' });
  assert.equal(cleared, 2);
});

test('Registry searches latest metadata at a fixed origin and preserves opaque pagination', async () => {
  const { searchMcpRegistry } = api();
  let requested;
  const result = await searchMcpRegistry(
    { query: 'demo', cursor: 'opaque/+?=', limit: 10 },
    {
      fetch: async (url, options) => {
        requested = new URL(url);
        assert.equal(options.redirect, 'error');
        return Response.json({
          servers: [
            {
              server: {
                name: 'org.example/demo',
                description: 'Demo',
                version: '1.0',
                remotes: [
                  { type: 'streamable-http', url: 'https://example.com/mcp' },
                ],
              },
            },
          ],
          metadata: { nextCursor: 'next/+' },
        });
      },
    },
  );
  assert.equal(requested.origin, 'https://registry.modelcontextprotocol.io');
  assert.equal(requested.searchParams.get('version'), 'latest');
  assert.equal(requested.searchParams.get('cursor'), 'opaque/+?=');
  assert.equal(requested.searchParams.get('search'), 'demo');
  assert.equal(result.servers[0].name, 'org.example/demo');
  assert.equal(result.nextCursor, 'next/+');
});
