import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '../dist');
function ensureBuild(name) {
  const distPath = join(distDir, `${name}.js`);
  const srcPath = join(here, `../src/${name}.ts`);
  let need = true;
  try { need = !readFileSync(distPath, 'utf8').includes('export'); } catch {}
  if (!need) return;
  const src = readFileSync(srcPath, 'utf8');
  const tsPaths = [
    '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed/.agents/worktrees/impl/146-skill-manager/node_modules/typescript/lib/typescript.js',
    '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed/.agents/worktrees/impl/150-import-uploads/node_modules/typescript/lib/typescript.js',
  ];
  return (async () => {
    let ts;
    for (const p of tsPaths) { try { ts = (await import(pathToFileURL(p).href)).default; break; } catch {} }
    if (!ts) throw new Error('typescript compiler not found');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }, fileName: `${name}.ts` }).outputText;
    mkdirSync(distDir, { recursive: true });
    writeFileSync(distPath, out);
  })();
}
await ensureBuild('mcp-credentials');
await ensureBuild('mcp-schema');
await ensureBuild('mcp-config-store');
await ensureBuild('mcp');

const { McpCordisConfigStore, fingerprintOf } = await import(pathToFileURL(join(distDir, 'mcp-config-store.js')).href);
let yamlMod;
for (const spec of ['yaml', pathToFileURL(join(here, '../node_modules/yaml/browser/index.js')).href, pathToFileURL('/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed/.agents/worktrees/impl/146-skill-manager/node_modules/yaml/browser/index.js').href]) {
  try { yamlMod = await import(spec); break; } catch {}
}
const yaml = yamlMod?.default?.parseDocument ? yamlMod.default : yamlMod;

function tempStore(initial = '[]\n') {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-persist-'));
  const configPath = join(dir, 'cordis.patch.yml');
  writeFileSync(configPath, initial);
  const store = new McpCordisConfigStore({ configPath });
  return { dir, configPath, store, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const BASE_PROFILE = `# comment preserved semantically by being unrelated? (array replaced safely)
- id: ui-settings
  name: "@deepseek-ai/dsh-client-ui-settings"
  config:
    theme: dark
- id: mcp-github
  name: "@deepseek-ai/dsh-mcp-client"
  config:
    serverName: github
    transport: stdio
    scope: global
    toolCallTimeoutMs: 60000
    failOnStartupError: false
    disabledTools: []
    command: sh
    args: ["-c", "exec npx -y @modelcontextprotocol/server-github"]
- id: waycraft-mcp
  name: dsh-waycraft/mcp
  disabled: true
`;

test('#165 CRUD: create/update/delete persist and round-trip', async () => {
  const t = tempStore(BASE_PROFILE);
  try {
    let r = await t.store.list();
    assert.equal(r.ok, true);
    assert.equal(r.servers.length, 1);
    assert.equal(r.servers[0].serverName, 'github');
    r = await t.store.create({ serverName: 'local-fs', transport: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'] }, r.fingerprint);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.ok(r.servers.some(s => s.serverName === 'local-fs'));
    r = await t.store.update('local-fs', { args: ['-y', '@modelcontextprotocol/server-filesystem', '/var/tmp'], toolCallTimeoutMs: 30000 }, r.fingerprint);
    assert.equal(r.ok, true, JSON.stringify(r));
    const updated = r.servers.find(s => s.serverName === 'local-fs');
    assert.deepEqual(updated.config.args.slice(-1), ['/var/tmp']);
    assert.equal(updated.config.toolCallTimeoutMs, 30000);
    r = await t.store.remove('local-fs', r.fingerprint);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.ok(!r.servers.some(s => s.serverName === 'local-fs'));
    const disk = readFileSync(t.configPath, 'utf8');
    assert.ok(disk.includes('serverName: github'));
    assert.ok(!disk.includes('local-fs'));
  } finally { t.cleanup(); }
});

test('#165 preserves unknown/unverified fields and unrelated DSH settings', async () => {
  const t = tempStore(BASE_PROFILE);
  try {
    const listed = await t.store.list();
    const gh = listed.servers.find(s => s.serverName === 'github');
    assert.equal(gh.config.scope, 'global'); // UNVERIFIED passthrough preserved
    assert.deepEqual(gh.config.disabledTools, []);
    const r = await t.store.update('github', { toolCallTimeoutMs: 45000, customFuture: 'keep' }, listed.fingerprint);
    assert.equal(r.ok, true, JSON.stringify(r));
    const disk = readFileSync(t.configPath, 'utf8');
    assert.match(disk, /ui-settings/);
    assert.match(disk, /@deepseek-ai\/dsh-client-ui-settings/);
    assert.match(disk, /theme: dark/);
    assert.match(disk, /waycraft-mcp/);
    assert.match(disk, /scope: global/);
    assert.match(disk, /customFuture: keep/);
  } finally { t.cleanup(); }
});

test('#165 conflict detection: external newer edits are not overwritten', async () => {
  const t = tempStore(BASE_PROFILE);
  try {
    const a = await t.store.list();
    // External edit
    const external = readFileSync(t.configPath, 'utf8').replace('toolCallTimeoutMs: 60000', 'toolCallTimeoutMs: 99999');
    writeFileSync(t.configPath, external);
    const r = await t.store.update('github', { command: 'node' }, a.fingerprint);
    assert.equal(r.ok, false);
    assert.equal(r.code, 'conflict');
    const disk = readFileSync(t.configPath, 'utf8');
    assert.match(disk, /99999/); // external edit preserved
    assert.doesNotMatch(disk, /command: node/);
  } finally { t.cleanup(); }
});

test('#165 failed write leaves no partial config (pre-validation failure)', async () => {
  const t = tempStore(BASE_PROFILE);
  try {
    const before = readFileSync(t.configPath, 'utf8');
    const fp = (await t.store.list()).fingerprint;
    const r = await t.store.create({ serverName: 'bad' }, fp); // missing transport/command/url
    assert.equal(r.ok, false);
    assert.equal(r.code, 'validation');
    assert.equal(readFileSync(t.configPath, 'utf8'), before);
  } finally { t.cleanup(); }
});

test('#165 atomic replacement leaves no temp files on success', async () => {
  const t = tempStore(BASE_PROFILE);
  try {
    const fp = (await t.store.list()).fingerprint;
    const r = await t.store.create({ serverName: 'tmpcheck', transport: 'stdio', command: 'echo' }, fp);
    assert.equal(r.ok, true, JSON.stringify(r));
    const files = readdirSync(t.dir);
    assert.deepEqual(files.filter(f => f.includes('.tmp-')), []);
  } finally { t.cleanup(); }
});

test('#165 crash-boundary: stale tmp file is ignored by reads/recovery', async () => {
  const t = tempStore(BASE_PROFILE);
  try {
    writeFileSync(join(t.dir, 'cordis.patch.yml.tmp-crash-leftover'), 'BROKEN: [partial');
    const r = await t.store.list();
    assert.equal(r.ok, true);
    assert.equal(r.servers[0].serverName, 'github');
  } finally { t.cleanup(); }
});

test('#165 cross-platform-safe path handling smoke', async () => {
  const t = tempStore('[]\n');
  try {
    const r = await t.store.create({ serverName: 'win-safe.name_test', transport: 'streamable-http', url: 'https://example.test/mcp' });
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.server.id, 'mcp-win-safe.name_test');
  } finally { t.cleanup(); }
});

test('#165 serverName immutable enforced by schema path', async () => {
  const t = tempStore(BASE_PROFILE);
  try {
    const fp = (await t.store.list()).fingerprint;
    const r = await t.store.update('github', { serverName: 'hacked' }, fp);
    // update() merges serverName back to target; schema receives existingServerName and same name — should succeed while keeping original identity.
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.ok(r.servers.some(s => s.serverName === 'github'));
    assert.ok(!r.servers.some(s => s.serverName === 'hacked'));
  } finally { t.cleanup(); }
});
