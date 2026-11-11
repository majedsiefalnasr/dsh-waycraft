import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../dist/mcp.js';

test('Registry management route authenticates, validates, cancels and never mutates configuration on reads', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mcp-registry-route-'));
  const configPath = join(dir, 'cordis.patch.yml');
  const seed = '[]\n';
  await writeFile(configPath, seed);
  let route;
  let calls = 0;
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      calls++;
      return Response.json({ servers: [] });
    };
    apply(
      {
        inject: (_names, fn) =>
          fn({
            get: () => ({
              fetch: {
                register: (r) => {
                  route = r;
                  return () => {};
                },
              },
            }),
          }),
        on() {},
      },
      { configPath },
    );
    const call = (body, peer, signal) => {
      const request = new Request('http://localhost/api/waycraft-mcp.manage', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-waycraft-mcp': '1' },
        body: JSON.stringify({ action: 'registry_search', ...body }),
        signal,
      });
      if (peer) request.peer = peer;
      return route.fetch(request);
    };
    assert.equal((await call({}, { owner: false })).status, 403);
    assert.equal((await call({ limit: 100 })).status, 400);
    assert.equal(calls, 0);
    assert.equal((await call({ query: 'demo' })).status, 200);
    const controller = new AbortController();
    controller.abort();
    assert.equal((await call({}, undefined, controller.signal)).status, 499);
    assert.equal(calls, 1);
    assert.equal(await readFile(configPath, 'utf8'), seed);
  } finally {
    globalThis.fetch = original;
    await rm(dir, { recursive: true, force: true });
  }
});
