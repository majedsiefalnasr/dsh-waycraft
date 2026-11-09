import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '../dist');
function ensureBuild(name) {
  const distPath = join(distDir, `${name}.js`);
  const srcPath = join(here, `../src/${name}.ts`);
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

const { hasCredentialRef, isSensitiveEnvKey, looksLikePlaintextSecret, validateCredentialSafety, redactMcpConfigForSurface, sanitizeMcpObservable } = await import(pathToFileURL(join(distDir, 'mcp-credentials.js')).href);
const { validateMcpServerConfig } = await import(pathToFileURL(join(distDir, 'mcp-schema.js')).href);
const { McpCordisConfigStore } = await import(pathToFileURL(join(distDir, 'mcp-config-store.js')).href);
const { apply } = await import(pathToFileURL(join(distDir, 'mcp.js')).href);

const SECRET = 'ghp_ABCDEF1234567890SECRET'; // test fixture string; must never appear on observable surfaces
const TOKEN = 'sk-proj-SECRETPLAINTEXTTOKEN1234567890';

function assertNoLeak(text, label) {
  assert.ok(!String(text).includes(SECRET), `${label} leaked ghp secret`);
  assert.ok(!String(text).includes(TOKEN), `${label} leaked sk token`);
  assert.ok(!String(text).includes('SECRETPLAINTEXTTOKEN'), `${label} leaked token fragment`);
}

test('#166 credential refs: detection and template preservation', () => {
  assert.equal(hasCredentialRef('${credential:GITHUB_TOKEN}'), true);
  assert.equal(hasCredentialRef('Bearer ${credential:API_TOKEN}'), true);
  assert.equal(hasCredentialRef('plain'), false);
  assert.equal(isSensitiveEnvKey('GITHUB_TOKEN'), true);
  assert.equal(isSensitiveEnvKey('Authorization'), true);
  assert.equal(isSensitiveEnvKey('PATH'), false);
  assert.equal(looksLikePlaintextSecret(SECRET), true);
  assert.equal(looksLikePlaintextSecret('${credential:REF}'), false);
});

test('#166 validation: credential refs allowed, plaintext secrets rejected in sensitive fields', () => {
  const ok = validateMcpServerConfig({
    serverName: 'safe', transport: 'stdio', command: 'npx',
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${credential:GITHUB_TOKEN}', PATH: '/usr/bin' },
  }, { mode: 'create' });
  assert.equal(ok.ok, true, JSON.stringify(ok.issues));
  const bad = validateMcpServerConfig({
    serverName: 'leaky', transport: 'stdio', command: 'npx',
    env: { GITHUB_TOKEN: SECRET },
  }, { mode: 'create' });
  assert.equal(bad.ok, false);
  assert.ok(bad.issues.some(i => i.path.includes('GITHUB_TOKEN')));
  assertNoLeak(JSON.stringify(bad.issues), 'validation issues');
  const badHeader = validateMcpServerConfig({
    serverName: 'hdr', transport: 'streamable-http', url: 'https://example.test/mcp',
    headers: { Authorization: `Bearer ${TOKEN}` },
  }, { mode: 'create' });
  assert.equal(badHeader.ok, false);
  assertNoLeak(JSON.stringify(badHeader.issues), 'header validation issues');
});

test('#166 redaction: observable config never exposes plaintext secrets, preserves credential refs', () => {
  const redacted = redactMcpConfigForSurface({
    serverName: 'x', transport: 'stdio', command: 'npx',
    args: ['--token', SECRET],
    env: { API_KEY: TOKEN, SAFE_REF: '${credential:API_KEY}', PATH: '/bin' },
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const text = JSON.stringify(redacted);
  assertNoLeak(text, 'redacted config');
  assert.match(text, /\$\{credential:API_KEY\}/);
  assert.match(text, /REDACTED/);
  const safe = sanitizeMcpObservable({ err: new Error(`failed with ${SECRET}`), nested: { token: TOKEN } });
  assertNoLeak(JSON.stringify(safe), 'sanitized observable');
});

test('#166 store list/create/update errors do not leak plaintext secrets across observable surfaces', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-cred-'));
  const configPath = join(dir, 'cordis.patch.yml');
  writeFileSync(configPath, '[]\n');
  const store = new McpCordisConfigStore({ configPath });
  try {
    const fp = (await store.list()).fingerprint;
    const bad = await store.create({ serverName: 'bad', transport: 'stdio', command: 'npx', env: { API_KEY: TOKEN } }, fp);
    assert.equal(bad.ok, false);
    assertNoLeak(JSON.stringify(bad), 'create validation result');
    const ok = await store.create({ serverName: 'ok', transport: 'stdio', command: 'npx', env: { API_KEY: '${credential:API_KEY}' } }, fp);
    assert.equal(ok.ok, true, JSON.stringify(ok));
    assertNoLeak(JSON.stringify(ok), 'create success result');
    assert.match(JSON.stringify(ok), /\$\{credential:API_KEY\}/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('#166 host RPC responses redact secret-shaped values on observable surfaces', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-cred-rpc-'));
  const configPath = join(dir, 'cordis.patch.yml');
  // Pre-seed a row that accidentally contains a plaintext secret to verify read-path redaction.
  writeFileSync(configPath, `- id: mcp-x\n  name: "@deepseek-ai/dsh-mcp-client"\n  config:\n    serverName: x\n    transport: stdio\n    command: npx\n    env:\n      BAD_TOKEN: ${SECRET}\n      SAFE: "\${credential:SAFE}"\n`);
  process.env.DSH_CORDIS_PATCH_PATH = configPath;
  const routes = new Map();
  const services = { connection: { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } };
  const ctx = { logger: { warn() {}, info() {}, error() {} }, get: (n) => services[n], inject: (names, fn) => { if ([].concat(names).every((n) => services[n])) fn(ctx); }, effect: (fn) => fn(), on() {} };
  apply(ctx);
  const route = routes.get('/api/waycraft-mcp.manage');
  const req = new Request('http://localhost/api/waycraft-mcp.manage', { method: 'POST', headers: { 'content-type': 'application/json', 'x-waycraft-mcp': '1' }, body: JSON.stringify({ action: 'list' }) });
  const res = await route.fetch(req);
  const text = await res.text();
  assert.equal(res.status, 200, text);
  assertNoLeak(text, 'RPC list response');
  assert.match(text, /\$\{credential:SAFE\}/);
  delete process.env.DSH_CORDIS_PATCH_PATH;
  rmSync(dir, { recursive: true, force: true });
});

test('#166 DSH credentials provider integration is a compatibility assumption (documented boundary)', () => {
  // V1 host boundary: preserve ${credential:REF} templates and enforce no-plaintext/redaction.
  // Runtime resolution is delegated to DSH/mcp-client when supported (expandTemplates/provider).
  // No private DSH credential APIs are used by this component.
  assert.equal(hasCredentialRef('${credential:ANY}'), true);
});
