import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Exercise source without updating shared dist artifacts or requiring a build.
const sourceRoot = new URL('../src/', import.meta.url).href;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL?.startsWith(sourceRoot) &&
      specifier.startsWith('./') &&
      specifier.endsWith('.js')
    ) {
      return {
        url: new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL).href,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(sourceRoot) && url.endsWith('.ts')) {
      return {
        format: 'module',
        source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), {
          mode: 'transform',
        }),
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
let apply,
  McpToolCacheStore,
  resolveMcpToolCachePath,
  reviewedConfigFingerprint;
try {
  ({ apply } = await import('../src/mcp.ts'));
  ({ McpToolCacheStore, resolveMcpToolCachePath } = await import(
    '../src/mcp-tool-cache.ts'
  ));
  ({ reviewedConfigFingerprint } = await import('../src/mcp-trust.ts'));
} finally {
  hooks.deregister();
}

test('host list restores only current valid connection checks without probing or writing', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'waycraft-connection-checks-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const configPath = join(dir, 'cordis.patch.yml');
  const names = [
    'success',
    'failure',
    'mismatch',
    'invalidated',
    'never',
    'bad-date',
    'missing-date',
    'bad-status',
    'redacted',
    'trashed',
  ];
  const configs = Object.fromEntries(
    names.map((serverName) => [
      serverName,
      {
        serverName,
        transport: 'stdio',
        command: 'unused-fixture-command',
        args: [],
        ...(serverName === 'redacted'
          ? { env: { API_KEY: 'fixture-private-value' } }
          : {}),
      },
    ]),
  );
  await writeFile(
    configPath,
    JSON.stringify(
      names.map((serverName) => ({
        name: '@deepseek-ai/dsh-mcp-client',
        config: configs[serverName],
        ...(serverName === 'trashed'
          ? { 'x-waycraft-mcp': { trash: { trashed: true } } }
          : {}),
      })),
    ),
  );
  const checkedAt = '2026-11-10T12:34:56.000Z';
  const servers = Object.fromEntries(
    names
      .filter((name) => name !== 'never')
      .map((serverName) => [
        serverName,
        {
          serverName,
          configFingerprint: reviewedConfigFingerprint(configs[serverName]),
          enumeratedAt: checkedAt,
          status: 'ok',
          freshness: 'fresh',
          message: 'Not part of the connection check projection',
          tools: [{ name: 'private-tool' }],
          toolCount: 1,
        },
      ]),
  );
  servers.failure.status = 'error';
  servers.failure.freshness = 'error';
  servers.mismatch.configFingerprint = 'old-config';
  servers.invalidated.freshness = 'invalidated';
  servers['bad-date'].enumeratedAt = 'not-a-date';
  delete servers['missing-date'].enumeratedAt;
  servers['bad-status'].status = 'unknown';
  const cachePath = resolveMcpToolCachePath({ configPath });
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify({ version: 1, servers }));
  const cacheBefore = await readFile(cachePath, 'utf8');
  const configBefore = await readFile(configPath, 'utf8');
  let probes = 0;
  const probe = async () => {
    probes++;
    throw new Error('list must not probe');
  };
  const callList = async () => {
    let handler;
    const target = {
      get: () => ({
        fetch: {
          register: (route) => {
            handler = route.fetch;
            return async () => {};
          },
        },
      }),
      mcpManager: { probe },
    };
    apply(
      { mcpManager: { probe }, inject: (_deps, fn) => fn(target) },
      { configPath },
    );
    const response = await handler(
      new Request('http://localhost/api/waycraft-mcp.manage', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-waycraft-mcp': '1' },
        body: JSON.stringify({ action: 'list' }),
      }),
    );
    assert.equal(response.status, 200);
    return response.json();
  };
  const expected = Object.fromEntries(
    ['success', 'failure'].map((name) => [
      name,
      {
        ok: name === 'success',
        checkedAt,
        configFingerprint: servers[name].configFingerprint,
      },
    ]),
  );
  // A new host instance re-reads the persisted observations on every reopen.
  assert.deepEqual((await callList()).connectionChecks, expected);
  assert.deepEqual((await callList()).connectionChecks, expected);
  assert.equal(probes, 0);
  assert.equal(await readFile(cachePath, 'utf8'), cacheBefore);
  assert.equal(await readFile(configPath, 'utf8'), configBefore);
  const cache = new McpToolCacheStore(cachePath);
  await cache.invalidate('success', 'config_changed');
  assert.deepEqual((await callList()).connectionChecks, {
    failure: expected.failure,
  });
});
