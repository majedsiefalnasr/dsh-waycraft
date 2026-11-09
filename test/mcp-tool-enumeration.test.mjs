import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '../dist');
const repoNodeModules = '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed/node_modules';

async function ensureBuild(name) {
  const distPath = join(distDir, `${name}.js`);
  const srcPath = join(here, `../src/${name}.ts`);
  const src = readFileSync(srcPath, 'utf8');
  const tsPaths = [
    '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed/.agents/worktrees/impl/146-skill-manager/node_modules/typescript/lib/typescript.js',
    '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed/.agents/worktrees/impl/150-import-uploads/node_modules/typescript/lib/typescript.js',
  ];
  let ts;
  for (const p of tsPaths) { try { ts = (await import(pathToFileURL(p).href)).default; break; } catch {} }
  if (!ts) throw new Error('typescript compiler not found');
  const out = ts.transpileModule(src, { compilerOptions: { module: 99, target: 99 }, fileName: `${name}.ts` }).outputText;
  mkdirSync(distDir, { recursive: true });
  writeFileSync(distPath, out);
}
for (const m of ['mcp-credentials', 'mcp-schema', 'mcp-trust', 'mcp-config-store', 'mcp-connection-test', 'mcp-tool-cache', 'mcp']) await ensureBuild(m);

const { McpToolCacheStore, resolveMcpToolCachePath, searchMcpTools } = await import(pathToFileURL(join(distDir, 'mcp-tool-cache.js')).href);
const { McpCordisConfigStore } = await import(pathToFileURL(join(distDir, 'mcp-config-store.js')).href);
const { apply } = await import(pathToFileURL(join(distDir, 'mcp.js')).href);
const { reviewedConfigFingerprint } = await import(pathToFileURL(join(distDir, 'mcp-trust.js')).href);

function tempEnv(initial = '[]\n') {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-tools-'));
  const home = join(dir, 'dsh-home');
  const profile = 'desktop';
  const configPath = join(home, 'profiles', profile, 'cordis.patch.yml');
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, initial);
  process.env.DSH_CORDIS_PATCH_PATH = configPath;
  process.env.DSH_HOME = home;
  process.env.DSH_PROFILE = profile;
  return {
    dir, home, profile, configPath,
    store: new McpCordisConfigStore({ configPath }),
    cache: new McpToolCacheStore(resolveMcpToolCachePath()),
    cleanup() {
      delete process.env.DSH_CORDIS_PATCH_PATH; delete process.env.DSH_HOME; delete process.env.DSH_PROFILE;
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

const STDIO_ENUM_SERVER = `
import { McpServer } from '${repoNodeModules}/@modelcontextprotocol/sdk/dist/esm/server/mcp.js';
import { StdioServerTransport } from '${repoNodeModules}/@modelcontextprotocol/sdk/dist/esm/server/stdio.js';
const server = new McpServer({ name: 'fixture-enum', version: '1.0.0' });
server.tool('alpha', 'Alpha tool for search', {}, async () => ({ content: [{ type: 'text', text: 'a' }] }));
server.tool('beta', 'Beta utility', {}, async () => ({ content: [{ type: 'text', text: 'b' }] }));
await server.connect(new StdioServerTransport());
`;

test('#169 cache unit: invalidation, config change staleness, probe update, freshness indicators', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-cache-unit-'));
  const cache = new McpToolCacheStore(join(dir, 'tool-cache.json'));
  const config = { serverName: 'srv', transport: 'stdio', command: 'node', args: ['a'] };
  let entry = await cache.get('srv', config);
  assert.equal(entry.freshness, 'never');
  assert.equal(entry.toolCount, 0);

  entry = await cache.updateFromProbe('srv', config, { ok: true, message: 'Connected', tools: [{ name: 't1', description: 'desc', inputSchema: { type: 'object' } }], capability: 'direct-mcp-sdk' });
  assert.equal(entry.freshness, 'fresh');
  assert.equal(entry.status, 'ok');
  assert.equal(entry.toolCount, 1);
  assert.equal(entry.tools[0].name, 't1');
  assert.deepEqual(entry.tools[0].inputSchema, { type: 'object' });
  assert.ok(entry.enumeratedAt);
  assert.equal(entry.configFingerprint, reviewedConfigFingerprint(config));

  const fresh = await cache.get('srv', config);
  assert.equal(fresh.freshness, 'fresh');

  await cache.invalidate('srv', 'policy_change');
  const inv = await cache.get('srv', config);
  assert.equal(inv.freshness, 'invalidated');
  assert.equal(inv.invalidationReason, 'policy_change');

  // config/scope/policy change => stale/never relative to new config fingerprint
  const changed = { ...config, args: ['b'] };
  const stale = await cache.get('srv', changed);
  assert.ok(['stale', 'never'].includes(stale.freshness), stale.freshness);

  const err = await cache.updateFromProbe('srv', config, { ok: false, message: 'boom' });
  assert.equal(err.freshness, 'error');
  assert.equal(err.status, 'error');

  rmSync(dir, { recursive: true, force: true });
});

test('#169 cache unit: search matches name/title/description', () => {
  const tools = [{ name: 'alpha', description: 'searches things' }, { name: 'beta', title: 'Build tool' }, { name: 'gamma' }];
  assert.equal(searchMcpTools(tools, 'alpha').length, 1);
  assert.equal(searchMcpTools(tools, 'search').length, 1);
  assert.equal(searchMcpTools(tools, 'build').length, 1);
  assert.equal(searchMcpTools(tools, '').length, 3);
  assert.equal(searchMcpTools(tools, 'zzz').length, 0);
});

test('#169 no eager connections: list/create/list_tools never probe', async () => {
  const env = tempEnv();
  let probes = 0;
  try {
    let handler;
    const ctx = { mcpManager: { probe: async () => { probes++; return { ok: true, toolNames: ['x'] }; } }, inject: (_deps, fn) => fn({ get: () => ({ fetch: { register: (r) => { handler = r.fetch; return () => {}; } } }) }) };
    apply(ctx, {});
    const call = async (body) => {
      const req = new Request('http://127.0.0.1/api/waycraft-mcp.manage', { method: 'POST', headers: { 'content-type': 'application/json', 'x-waycraft-mcp': '1' }, body: JSON.stringify(body) });
      const r = await handler(req); return { status: r.status, json: await r.json() };
    };
    let r = await call({ action: 'create', config: { serverName: 'srv', transport: 'stdio', command: process.execPath, args: ['-e', 'process.exit(0)'] } });
    assert.equal(r.status, 200);
    r = await call({ action: 'list' }); assert.equal(r.status, 200);
    r = await call({ action: 'list_tools', serverName: 'srv' }); assert.equal(r.status, 200);
    assert.equal(r.json.cache.freshness, 'never');
    assert.deepEqual(r.json.cache.tools, []);
    assert.equal(probes, 0, 'eager connection/probe happened');
  } finally { env.cleanup(); }
});

test('#169 integration: explicit refresh/test enumerates tools, cache read-only, invalidated on config change', async () => {
  const env = tempEnv();
  const dir = mkdtempSync(join(tmpdir(), 'mcp-enum-fixture-'));
  const script = join(dir, 'server.mjs');
  writeFileSync(script, STDIO_ENUM_SERVER);
  try {
    let handler;
    const ctx = { inject: (_deps, fn) => fn({ get: () => ({ fetch: { register: (r) => { handler = r.fetch; return () => {}; } } }) }) };
    apply(ctx, {});
    const call = async (body) => {
      const req = new Request('http://127.0.0.1/api/waycraft-mcp.manage', { method: 'POST', headers: { 'content-type': 'application/json', 'x-waycraft-mcp': '1' }, body: JSON.stringify(body) });
      const r = await handler(req); return { status: r.status, json: await r.json() };
    };
    let r = await call({ action: 'create', config: { serverName: 'srv', transport: 'stdio', command: process.execPath, args: [script], cwd: dir } });
    assert.equal(r.status, 200);
    r = await call({ action: 'approve_trust', serverName: 'srv' });
    assert.equal(r.status, 200);

    // tools enumerated only after explicit refresh
    r = await call({ action: 'list_tools', serverName: 'srv' });
    assert.equal(r.status, 200);
    assert.equal(r.json.cache.freshness, 'never');

    r = await call({ action: 'refresh_tools', serverName: 'srv', timeoutMs: 15000 });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.cache.freshness, 'fresh');
    assert.ok(r.json.cache.tools.some(t => t.name === 'alpha' && t.description && t.description.includes('Alpha')));
    assert.ok(r.json.cache.tools.some(t => t.name === 'beta'));
    const alpha = r.json.cache.tools.find(t => t.name === 'alpha');
    assert.ok(alpha, 'alpha tool listed');
    assert.ok('inputSchema' in alpha, 'schema inspection field available');

    // read-only cached
    r = await call({ action: 'list_tools', serverName: 'srv', query: 'alpha' });
    assert.equal(r.status, 200);
    assert.equal(r.json.cache.freshness, 'fresh');
    assert.equal(r.json.cache.tools.length, 1);
    assert.equal(r.json.cache.tools[0].name, 'alpha');

    // config change invalidates cache
    r = await call({ action: 'update', serverName: 'srv', patch: { args: [script, '--changed'], cwd: dir } });
    assert.equal(r.status, 200);
    r = await call({ action: 'list_tools', serverName: 'srv' });
    assert.equal(r.status, 200);
    assert.ok(['invalidated', 'stale', 'never'].includes(r.json.cache.freshness), r.json.cache.freshness);
  } finally {
    env.cleanup();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('#169 trust required for explicit enumeration', async () => {
  const env = tempEnv();
  try {
    let handler;
    const ctx = { inject: (_deps, fn) => fn({ get: () => ({ fetch: { register: (r) => { handler = r.fetch; return () => {}; } } }) }) };
    apply(ctx, {});
    const call = async (body) => {
      const req = new Request('http://127.0.0.1/api/waycraft-mcp.manage', { method: 'POST', headers: { 'content-type': 'application/json', 'x-waycraft-mcp': '1' }, body: JSON.stringify(body) });
      const r = await handler(req); return { status: r.status, json: await r.json() };
    };
    await call({ action: 'create', config: { serverName: 'srv', transport: 'stdio', command: 'echo', args: ['hi'] } });
    const r = await call({ action: 'refresh_tools', serverName: 'srv' });
    assert.equal(r.status, 403);
    assert.equal(r.json.code, 'trust_required');
  } finally { env.cleanup(); }
});
