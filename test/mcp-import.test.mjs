import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { previewMcpImport, registerMcpImport } from '../dist/mcp-import.js';
import { McpCordisConfigStore } from '../dist/mcp-config-store.js';

function tempConfig(content = '[]\n') {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-import-'));
  const configPath = join(dir, 'cordis.patch.yml');
  writeFileSync(configPath, content, 'utf8');
  return {
    dir,
    configPath,
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test('#171 parser: rejects unsupported structures (no silent accept)', () => {
  for (const bad of [
    null,
    42,
    'x',
    [],
    {},
    { servers: {} },
    { mcpServers: [] },
    { foo: 1 },
  ]) {
    const p = previewMcpImport(bad);
    assert.equal(p.ok, false, JSON.stringify(bad));
    assert.match(p.issues[0].message, /Unsupported import structure/i);
  }
});

test('#171 parser: supports verified mcpServers map format and normalizes', () => {
  const p = previewMcpImport({
    mcpServers: { demo: { command: 'node', args: ['s.js'], env: { A: '1' } } },
  });
  assert.equal(p.ok, true, JSON.stringify(p.issues));
  assert.equal(p.format, 'mcpServers-map');
  assert.equal(p.candidates.length, 1);
  assert.equal(p.candidates[0].serverName, 'demo');
  assert.equal(p.candidates[0].config.transport, 'stdio');
  assert.equal(p.candidates[0].valid, true);
});

test('#171 parser: supports Waycraft export format', () => {
  const p = previewMcpImport({
    waycraftMcpImport: 1,
    servers: [
      {
        serverName: 'http1',
        transport: 'streamable-http',
        url: 'https://example.test/mcp',
      },
    ],
  });
  assert.equal(p.ok, true, JSON.stringify(p.issues));
  assert.equal(p.format, 'waycraft-mcp-v1');
  assert.equal(p.candidates[0].valid, true);
});

test('#171 validator: credential refs validated/preserved, plaintext secrets rejected by schema', () => {
  const p = previewMcpImport({
    mcpServers: {
      safe: { command: 'npx', env: { TOKEN: '${credential:GH_TOKEN}' } },
      bad: { command: 'npx', env: { TOKEN: 'ghp_abcdefghijklmnopqrstuvwxyz' } },
    },
  });
  const by = Object.fromEntries(p.candidates.map((c) => [c.serverName, c]));
  assert.equal(by.safe.valid, true);
  assert.deepEqual(by.safe.credentialRefs, ['GH_TOKEN']);
  assert.equal(by.bad.valid, false);
  assert.ok(
    by.bad.issues.some((i) =>
      /credential references|plaintext/i.test(i.message),
    ),
    JSON.stringify(by.bad.issues),
  );
});

test('#171 duplicate detection and conflict handling in preview', () => {
  const p = previewMcpImport(
    {
      mcpServers: {
        dup: { command: 'a' },
        dup2: { serverName: 'dup', command: 'b' },
      },
    },
    { existingServerNames: ['dup'] },
  );
  const by = Object.fromEntries(
    p.candidates.map((c) => [c.serverName + ':' + c.config.command, c]),
  );
  assert.ok(
    p.candidates.some(
      (c) =>
        c.conflict?.kind === 'duplicate_existing' ||
        c.conflict?.kind === 'duplicate_import',
    ),
  );
  assert.ok(p.stats.conflicts >= 1);
});

test('#171 V1 single scope only; project scope not selected', () => {
  const p = previewMcpImport({
    mcpServers: { scoped: { command: 'a', scope: 'project:/tmp/repo' } },
  });
  assert.equal(p.ok, true);
  assert.equal(p.scope.projectScopeSupported, false);
  assert.match(
    p.candidates[0].scopeNote || p.scope.note,
    /single|Project runtime scope/i,
  );
  assert.equal(p.candidates[0].config.scope, undefined);
});

test('#171 integration: preview reviews candidates; registration requires explicit approval; no auto-execution', async () => {
  const t = tempConfig();
  const prev = process.env.DSH_CORDIS_PATCH_PATH;
  process.env.DSH_CORDIS_PATCH_PATH = t.configPath;
  let executed = 0;
  try {
    const store = new McpCordisConfigStore({ configPath: t.configPath });
    const preview = previewMcpImport(
      {
        mcpServers: {
          a: { command: 'node', args: ['a.js'] },
          b: { transport: 'streamable-http', url: 'https://x.test/mcp' },
        },
      },
      { existingServerNames: [] },
    );
    assert.equal(preview.ok, true);
    assert.equal(preview.candidates.length, 2);
    // Unapproved => skipped, nothing registered.
    const none = await registerMcpImport(preview, [], {
      existingServerNames: async () =>
        (await store.list()).servers.map((s) => s.serverName),
      create: async (config) => {
        executed++;
        return store.create(config);
      },
    });
    assert.equal((await store.list()).servers.length, 0);
    assert.equal(none.stats.registered, 0);
    assert.equal(executed, 0);
    // Explicit approval registers only approved candidates.
    const reg = await registerMcpImport(
      preview,
      [{ serverName: 'a', approved: true }],
      {
        existingServerNames: async () =>
          (await store.list()).servers.map((s) => s.serverName),
        create: async (config) => store.create(config),
      },
    );
    assert.equal(reg.stats.registered, 1);
    assert.equal(reg.stats.skipped, 1);
    const servers = (await store.list()).servers;
    assert.deepEqual(
      servers.map((s) => s.serverName),
      ['a'],
    );
    assert.equal(
      servers[0].trust.state,
      'untrusted',
      'import must not auto-trust',
    );
  } finally {
    if (prev == null) delete process.env.DSH_CORDIS_PATCH_PATH;
    else process.env.DSH_CORDIS_PATCH_PATH = prev;
    t.cleanup();
  }
});
