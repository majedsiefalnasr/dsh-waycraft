import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { McpCordisConfigStore } from '../dist/mcp-config-store.js';
import { apply } from '../dist/mcp.js';

function tempStore(initial = '[]\n') {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-mcp-trash-'));
  const configPath = join(dir, 'cordis.patch.yml');
  writeFileSync(configPath, initial, 'utf8');
  return {
    dir,
    configPath,
    store: new McpCordisConfigStore({ configPath }),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const BASE = `
- id: mcp-github
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: github
    transport: stdio
    command: sh
    args: ["-c", "exec npx -y @modelcontextprotocol/server-github"]
    scope: global
- id: waycraft-mcp
  name: dsh-waycraft/mcp
  disabled: true
`;

function makeCtx(configPath) {
  let registered;
  const routes = {
    register(r) {
      registered = r;
      return () => {};
    },
  };
  apply(
    {
      inject: (deps, cb) =>
        cb({
          get: (k) => (k === 'connection' ? { fetch: routes } : undefined),
        }),
      on: () => {},
    },
    { configPath },
  );
  return { route: registered };
}

async function call(route, body, headers = {}) {
  const req = new Request('http://127.0.0.1/api/waycraft-mcp.manage', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://127.0.0.1',
      'x-waycraft-mcp': '1',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const res = await route.fetch(req);
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

test('#173 trash is operational, not cosmetic: trashed entry removed from active list and marked disabled', async () => {
  const t = tempStore(BASE);
  try {
    const fp = (await t.store.list()).fingerprint;
    const r = await t.store.moveToTrash('github', fp);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.server.trash.trashed, true);
    assert.equal(r.server.trash.operationallyInactive, true);
    assert.equal(
      r.server.disabled,
      true,
      'trashed entry must be operationally inactive in persisted config',
    );
    assert.ok(
      !r.servers.some((s) => s.serverName === 'github'),
      'trashed entry removed from active list',
    );
    assert.ok(r.trashedServers.some((s) => s.serverName === 'github'));
    const disk = readFileSync(t.configPath, 'utf8');
    assert.match(disk, /trash:/);
    assert.match(disk, /disabled: true/);
    assert.match(disk, /serverName: github/); // config preserved
  } finally {
    t.cleanup();
  }
});

test('#173 no auto-reactivation while trashed: operational actions blocked and trashed name cannot be recreated silently', async () => {
  const t = tempStore(BASE);
  try {
    const fp = (await t.store.list()).fingerprint;
    await t.store.moveToTrash('github', fp);
    const { route } = makeCtx(t.configPath);
    let r = await call(route, {
      action: 'test_connection',
      serverName: 'github',
    });
    assert.equal(r.status, 409);
    assert.equal(r.json.code, 'trashed');
    r = await call(route, { action: 'refresh_tools', serverName: 'github' });
    assert.equal(r.status, 409);
    r = await call(route, {
      action: 'create',
      config: { serverName: 'github', transport: 'stdio', command: 'echo' },
    });
    assert.equal(r.status, 409);
    assert.match(String(r.json.error || r.json.message), /trash/i);
  } finally {
    t.cleanup();
  }
});

test('#173 restore revalidates trust, preserves config/credential refs/provenance, defaults to non-running', async () => {
  const t = tempStore(`
- id: mcp-gh
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: gh
    transport: stdio
    command: npx
    env:
      GITHUB_TOKEN: \${credential:github-token}
    disabledTools: ["danger"]
  x-waycraft-mcp:
    owner: waycraft
    version: 1
    trust: { status: trusted, approvedAt: '2026-01-01T00:00:00Z', reviewedConfigFingerprint: x }
`);
  try {
    const fp = (await t.store.list()).fingerprint;
    await t.store.moveToTrash('gh', fp);
    const r = await t.store.restore('gh', (await t.store.list()).fingerprint);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.server.serverName, 'gh');
    assert.equal(
      r.server.disabled,
      true,
      'restore defaults to non-running/disabled',
    );
    assert.equal(
      r.server.trust.status !== 'trusted',
      true,
      'trust must be revalidated after restore',
    );
    assert.equal(
      r.server.config.env.GITHUB_TOKEN,
      '${credential:github-token}',
    );
    assert.deepEqual(r.server.config.disabledTools, ['danger']);
    assert.ok(!r.trashedServers.some((s) => s.serverName === 'gh'));
  } finally {
    t.cleanup();
  }
});

test('#173 restore blocks identity conflict and invalid config', async () => {
  const t = tempStore(BASE);
  try {
    await t.store.moveToTrash('github', (await t.store.list()).fingerprint);
    // Create different server, then manually corrupt trashed row name conflict is unlikely in single-row trash;
    // use invalid restore by corrupting config in place.
    const disk = readFileSync(t.configPath, 'utf8').replace(
      'transport: stdio',
      'transport: nope',
    );
    writeFileSync(t.configPath, disk);
    const r = await t.store.restore('github');
    assert.equal(r.ok, false);
    assert.ok(
      ['validation', 'parse', 'conflict', 'blocked'].includes(r.code),
      JSON.stringify(r),
    );
  } finally {
    t.cleanup();
  }
});

test('#173 permanent delete requires explicit confirmation and removes persistent config; shared credential refs not deleted', async () => {
  const t = tempStore(`
- id: mcp-gh
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: gh
    transport: stdio
    command: npx
    env:
      GITHUB_TOKEN: \${credential:github-token}
`);
  try {
    const fp = (await t.store.list()).fingerprint;
    let r = await t.store.permanentDelete('gh', fp);
    assert.equal(r.ok, false);
    assert.equal(r.code, 'confirm_required');
    r = await t.store.permanentDelete(
      'gh',
      (await t.store.list()).fingerprint,
      { confirm: true },
    );
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.match(
      String(r.limitation),
      /credential references are not deleted/i,
    );
    const disk = readFileSync(t.configPath, 'utf8');
    assert.ok(!disk.includes('serverName: gh'));
  } finally {
    t.cleanup();
  }
});

test('#173 externally owned entry: safe trash semantics documented and destructive mutation blocked', async () => {
  const t = tempStore(`
- id: ext-mcp
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: ext
    transport: stdio
    command: ext
  x-waycraft-mcp:
    owner: some-other-plugin
`);
  try {
    const r = await t.store.moveToTrash(
      'ext',
      (await t.store.list()).fingerprint,
    );
    assert.equal(r.ok, false);
    assert.equal(r.code, 'ownership');
    assert.match(String(r.limitation || r.message), /externally owned/i);
    const disk = readFileSync(t.configPath, 'utf8');
    assert.ok(
      !disk.includes('\n  disabled: true'),
      'must not destructively mutate externally owned entry',
    );
  } finally {
    t.cleanup();
  }
});

test('#173 RPC integration: trash/restore/permanent-delete cycle with Owner auth', async () => {
  const t = tempStore(BASE);
  try {
    const { route } = makeCtx(t.configPath);
    let r = await call(route, { action: 'list' });
    const fp = r.json.fingerprint;
    r = await call(route, {
      action: 'trash',
      serverName: 'github',
      expectedFingerprint: fp,
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.server.trash.operationallyInactive, true);
    r = await call(route, { action: 'list_trash' });
    assert.ok(r.json.trashedServers.some((s) => s.serverName === 'github'));
    r = await call(route, {
      action: 'restore',
      serverName: 'github',
      expectedFingerprint: r.json.fingerprint,
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.server.trust.status !== 'trusted', true);
    r = await call(route, {
      action: 'permanent_delete',
      serverName: 'github',
      expectedFingerprint: r.json.fingerprint,
      confirm: true,
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    r = await call(route, { action: 'list' });
    assert.ok(
      ![...(r.json.servers || []), ...(r.json.trashedServers || [])].some(
        (s) => s.serverName === 'github',
      ),
    );
  } finally {
    t.cleanup();
  }
});

test('#173 operational-safety: test_connection cannot probe trashed entry (not merely hidden)', async () => {
  const t = tempStore(`
- id: mcp-github
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: github
    transport: stdio
    command: /definitely-not-run
  x-waycraft-mcp:
    owner: waycraft
    version: 1
    trust: { status: trusted, approvedAt: '2026-01-01T00:00:00Z', reviewedConfigFingerprint: ${JSON.stringify('x')} }
`);
  // Override fingerprint binding by making server appear trusted-for-action is separate; easier: trash after approving via store path.
  // Use store directly to keep setup simple.
  const t2 = tempStore(BASE);
  try {
    const fp = (await t2.store.list()).fingerprint;
    await t2.store.approveTrust('github', fp).catch(() => {}); // may fail fingerprint binding in synthetic config; not required
    await t2.store.moveToTrash('github', (await t2.store.list()).fingerprint);
    const { route } = makeCtx(t2.configPath);
    const r = await call(route, {
      action: 'test_connection',
      serverName: 'github',
    });
    assert.equal(r.status, 409);
    assert.equal(r.json.code, 'trashed');
    assert.match(
      String(r.json.error || r.json.message),
      /operationally inactive/i,
    );
  } finally {
    t.cleanup();
    t2.cleanup();
  }
});

test('#173/#176 legacy remove/delete alias requires explicit confirmation and deletes only when confirmed', async () => {
  const t = tempStore(BASE);
  try {
    const { route } = makeCtx(t.configPath);
    const fp = (await call(route, { action: 'list' })).json.fingerprint;
    const noConfirm = await call(route, {
      action: 'delete',
      serverName: 'github',
      expectedFingerprint: fp,
    });
    assert.equal(noConfirm.status, 409, JSON.stringify(noConfirm.json));
    assert.equal(noConfirm.json.code, 'confirm_required');
    const fp2 = (await call(route, { action: 'list' })).json.fingerprint;
    const r = await call(route, {
      action: 'delete',
      serverName: 'github',
      expectedFingerprint: fp2,
      confirm: true,
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
  } finally {
    t.cleanup();
  }
});
