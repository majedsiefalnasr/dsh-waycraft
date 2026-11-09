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
for (const m of ['mcp-credentials', 'mcp-schema', 'mcp-trust', 'mcp-config-store', 'mcp-connection-test', 'mcp-tool-cache', 'mcp']) await ensureBuild(m);

const { McpCordisConfigStore } = await import(pathToFileURL(join(distDir, 'mcp-config-store.js')).href);
const { apply } = await import(pathToFileURL(join(distDir, 'mcp.js')).href);

function tempEnv(initial) {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-adopt-'));
  const home = join(dir, 'dsh-home');
  const configPath = join(home, 'profiles', 'desktop', 'cordis.patch.yml');
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, initial);
  process.env.DSH_CORDIS_PATCH_PATH = configPath;
  process.env.DSH_HOME = home;
  process.env.DSH_PROFILE = 'desktop';
  return {
    dir, configPath,
    read: () => readFileSync(configPath, 'utf8'),
    store: new McpCordisConfigStore({ configPath }),
    cleanup() { delete process.env.DSH_CORDIS_PATCH_PATH; delete process.env.DSH_HOME; delete process.env.DSH_PROFILE; rmSync(dir, { recursive: true, force: true }); },
  };
}

const EXISTING_CONFIG = `# DSH-managed entries (example)
- id: mcp-github
  name: '@deepseek-ai/dsh-mcp-client'
  disabled: false
  config:
    serverName: mcp-github
    transport: stdio
    command: npx
    args: ['-y', '@modelcontextprotocol/server-github']
    env:
      GITHUB_TOKEN: \${credential:GITHUB_TOKEN}
    scope: global
    disabledTools: []
    customFuture: keep-me
- id: mcp-playwright
  name: '@deepseek-ai/dsh-mcp-client'
  disabled: true
  config:
    serverName: mcp-playwright
    transport: stdio
    command: npx
    args: ['-y', '@playwright/mcp@latest']
    cwd: /tmp
    unknownNested:
      alpha: 1
- id: waycraft
  name: dsh-waycraft
  config:
    theme: dark
`;

test('#170 non-destructive adoption: existing entries read without mutation, states/credentials/unknown preserved', async () => {
  const env = tempEnv(EXISTING_CONFIG);
  try {
    const before = env.read();
    const r = await env.store.list();
    assert.equal(r.ok, true);
    const after = env.read();
    assert.equal(after, before, 'list must not mutate existing config');

    const gh = r.servers.find(s => s.serverName === 'mcp-github');
    const pw = r.servers.find(s => s.serverName === 'mcp-playwright');
    assert.ok(gh && pw, 'mcp-github and mcp-playwright adopted');
    assert.equal(gh.disabled, false);
    assert.equal(pw.disabled, true, 'enablement state preserved');
    assert.equal(gh.config.env.GITHUB_TOKEN, '${credential:GITHUB_TOKEN}', 'credential reference preserved');
    assert.equal(gh.config.scope, 'global');
    assert.deepEqual(gh.config.disabledTools, []);
    assert.equal(gh.config.customFuture, 'keep-me', 'unknown fields preserved');
    assert.deepEqual(pw.config.unknownNested, { alpha: 1 });

    // status/list via RPC also non-mutating
    let handler;
    const ctx = { inject: (_deps, fn) => fn({ get: () => ({ fetch: { register: (reg) => { handler = reg.fetch; return () => {}; } } }) }) };
    apply(ctx, {});
    const call = async (body) => { const req = new Request('http://127.0.0.1/api/waycraft-mcp.manage', { method:'POST', headers:{'content-type':'application/json','x-waycraft-mcp':'1'}, body: JSON.stringify(body)}); const res = await handler(req); return { status: res.status, json: await res.json() }; };
    const status = await call({ action: 'status' }); assert.equal(status.status, 200);
    const list = await call({ action: 'list' }); assert.equal(list.status, 200);
    assert.equal(list.json.servers.length, 2);
    assert.equal(env.read(), before, 'RPC status/list must not mutate config');
  } finally { env.cleanup(); }
});

test('#170 adoption: pre-existing configs not auto trust-approved; no silent activation/deactivation', async () => {
  const env = tempEnv(EXISTING_CONFIG);
  try {
    const before = env.read();
    const r = await env.store.list();
    for (const s of r.servers) {
      assert.equal(s.trust.state, 'untrusted', `${s.serverName} must not be auto trust-approved`);
      assert.ok(['not_approved', 'save_does_not_imply_trust'].includes(s.trust.reason || '') || s.trust.reason === undefined || s.trust.reason === 'not_approved');
    }
    assert.equal(env.read(), before, 'no mutation');
    // no auto-test/connection: list_tools returns never without probes
    let handler, probes = 0;
    const ctx = { mcpManager: { probe: async () => { probes++; return { ok: true, toolNames: [] }; } }, inject: (_deps, fn) => fn({ get: () => ({ fetch: { register: (reg) => { handler = reg.fetch; return () => {}; } } }) }) };
    apply(ctx, {});
    const req = new Request('http://127.0.0.1/api/waycraft-mcp.manage', { method:'POST', headers:{'content-type':'application/json','x-waycraft-mcp':'1'}, body: JSON.stringify({ action: 'list_tools', serverName: 'mcp-github' }) });
    const res = await handler(req); const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.cache.freshness, 'never');
    assert.equal(probes, 0, 'no auto-test/restart/connection on adoption/read');
    assert.equal(env.read(), before);
  } finally { env.cleanup(); }
});

test('#170 adoption distinguishes pre-existing DSH, Waycraft-created, and externally-owned entries', async () => {
  const mixed = `[]
- id: mcp-github
  name: '@deepseek-ai/dsh-mcp-client'
  config: { serverName: mcp-github, transport: stdio, command: npx, args: ['a'] }
- id: wc
  name: '@deepseek-ai/dsh-mcp-client'
  config: { serverName: waycraft-one, transport: stdio, command: node, args: ['x'] }
  x-waycraft-mcp: { owner: waycraft, version: 1 }
- id: other
  name: '@deepseek-ai/dsh-mcp-client'
  config: { serverName: other-one, transport: stdio, command: node, args: ['y'] }
  x-waycraft-mcp: { owner: other-component, version: 1 }
`;
  const env = tempEnv(mixed.replace('[]\n', ''));
  try {
    const r = await env.store.list();
    const by = Object.fromEntries(r.servers.map(s => [s.serverName, s]));
    assert.equal(by['mcp-github'].ownership, 'preexisting-dsh');
    assert.equal(by['waycraft-one'].ownership, 'waycraft');
    assert.equal(by['other-one'].ownership, 'other', 'entry owned by other component must be distinguished');
    for (const s of r.servers) assert.equal(s.trust.state, 'untrusted');
  } finally { env.cleanup(); }
});
