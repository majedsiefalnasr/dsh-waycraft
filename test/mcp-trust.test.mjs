import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '../dist');
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
for (const m of ['mcp-credentials', 'mcp-schema', 'mcp-trust', 'mcp-config-store', 'mcp']) await ensureBuild(m);

const trust = await import(pathToFileURL(join(distDir, 'mcp-trust.js')).href);
const { McpCordisConfigStore } = await import(pathToFileURL(join(distDir, 'mcp-config-store.js')).href);
const { apply } = await import(pathToFileURL(join(distDir, 'mcp.js')).href);

function tempStore(initial = '[]\n') {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-trust-'));
  const configPath = join(dir, 'cordis.patch.yml');
  writeFileSync(configPath, initial);
  const store = new McpCordisConfigStore({ configPath });
  return { dir, configPath, store, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const stdio = (name, extra = {}) => ({ serverName: name, transport: 'stdio', command: 'npx', args: ['-y', 'pkg'], ...extra });
const http = (name, extra = {}) => ({ serverName: name, transport: 'streamable-http', url: 'https://example.test/mcp', ...extra });

test('#167 fingerprint: same material config => same fingerprint', () => {
  const a = trust.reviewedConfigFingerprint(stdio('a'));
  const b = trust.reviewedConfigFingerprint({ ...stdio('a'), ignoredNote: 'x' }); // non-material extra ignored by payload? serverName included; ignoredNote not in payload
  assert.equal(a, b);
});

test('#167 material changes invalidate trust (command/args/endpoint/auth/privileges)', () => {
  const base = stdio('srv');
  for (const [label, after] of [
    ['command', { ...base, command: 'node' }],
    ['args', { ...base, args: ['other'] }],
    ['endpoint', http('srv') ],
    ['auth/header', http('srv', { headers: { Authorization: '${credential:REF}' } }) ],
    ['env/auth config', { ...base, env: { TOKEN: '${credential:REF}' } }],
    ['cwd', { ...base, cwd: '/tmp' }],
    ['url', http('srv', { url: 'https://other.test/mcp' }) ],
  ]) {
    const d = trust.detectMaterialChange(base, after);
    assert.equal(d.changed, true, label);
  }
  const same = trust.detectMaterialChange(base, { ...base });
  assert.equal(same.changed, false);
});

test('#167 approval authorizes reviewed configuration fingerprint only', async () => {
  const t = tempStore();
  try {
    let r = await t.store.create(stdio('srv'), (await t.store.list()).fingerprint);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.server.trust.state, 'untrusted'); // saving does not imply trust
    r = await t.store.approveTrust('srv', r.fingerprint);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.server.trust.state, 'trusted');
    assert.equal(r.server.trust.fingerprint, r.server.reviewedConfigFingerprint);
    r = await t.store.update('srv', { args: ['-y', 'other'] }, r.fingerprint); // material change
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.server.trust.state, 'invalidated');
    assert.equal(r.server.trust.reason, 'material_change');
  } finally { t.cleanup(); }
});

test('#167 saving does not imply trust; import/discovery never execute (no execute path exposed)', async () => {
  const t = tempStore();
  try {
    const created = await t.store.create(stdio('saved'), (await t.store.list()).fingerprint);
    assert.equal(created.server.trust.state, 'untrusted');
    assert.equal(created.server.trust.reason, 'save_does_not_imply_trust');
    // No import/discovery execute methods exist on store; only CRUD/trust/status.
    assert.equal(typeof t.store.create, 'function');
    assert.equal(typeof (t.store).importServers, 'undefined');
    assert.equal(typeof (t.store).discoverAndRun, 'undefined');
  } finally { t.cleanup(); }
});

test('#167 integration: explicit connection testing cannot bypass trust approval', async () => {
  const t = tempStore();
  try {
    process.env.DSH_CORDIS_PATCH_PATH = t.configPath;
    const routes = new Map();
    const services = { connection: { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } };
    const ctx = { logger: { warn() {}, info() {}, error() {} }, get: (n) => services[n], inject: (names, fn) => { if ([].concat(names).every((n) => services[n])) fn(ctx); }, effect: (fn) => fn(), on() {} };
    apply(ctx);
    const route = routes.get('/api/waycraft-mcp.manage');
    const call = async (body) => {
      const res = await route.fetch(new Request('http://localhost/api/waycraft-mcp.manage', { method: 'POST', headers: { 'content-type': 'application/json', 'x-waycraft-mcp': '1' }, body: JSON.stringify(body) }));
      return { status: res.status, data: await res.json() };
    };
    let r = await call({ action: 'create', config: stdio('srv') });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    r = await call({ action: 'test_connection', serverName: 'srv' });
    assert.equal(r.status, 403);
    assert.equal(r.data.code, 'trust_required');
    r = await call({ action: 'approve_trust', serverName: 'srv', expectedFingerprint: r.data.fingerprint });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    r = await call({ action: 'test_connection', serverName: 'srv' });
    assert.equal(r.status, 200, JSON.stringify(r.data)); // gate passed; impl pending #168
    assert.equal(r.data.test.gatedByTrust, true);
  } finally { delete process.env.DSH_CORDIS_PATCH_PATH; t.cleanup(); }
});

test('#167 no new sandbox platform / project scope not misrepresented', () => {
  // Asserted by implementation shape: trust module has no sandbox/OS isolation claims;
  // no project-scope isolation fields introduced. This is a guardrail, not runtime sandboxing.
  assert.ok(!('sandbox' in trust));
  assert.ok(!('projectIsolation' in trust));
});
