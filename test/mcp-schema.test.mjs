import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '../dist');
const distPath = join(distDir, 'mcp-schema.js');
const srcPath = join(here, '../src/mcp-schema.ts');
const src = readFileSync(srcPath, 'utf8');
const hasBuilt = (() => { try { return readFileSync(distPath, 'utf8').includes('normalizeMcpServerConfig'); } catch { return false; } })();
if (!hasBuilt) {
  const tsPaths = [
    '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed/.agents/worktrees/impl/146-skill-manager/node_modules/typescript/lib/typescript.js',
    '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed/.agents/worktrees/impl/150-import-uploads/node_modules/typescript/lib/typescript.js',
  ];
  let ts;
  for (const p of tsPaths) { try { ts = (await import(pathToFileURL(p).href)).default; break; } catch {} }
  if (!ts) throw new Error('typescript compiler not found for mcp-schema test build');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }, fileName: 'mcp-schema.ts' }).outputText;
  mkdirSync(distDir, { recursive: true });
  writeFileSync(distPath, out);
}
const mod = await import(pathToFileURL(distPath).href);
const { normalizeMcpServerConfig, validateMcpServerConfig, MCP_SCHEMA_VERIFIED_FIELDS, MCP_SCHEMA_UNVERIFIED_PASSTHROUGH_FIELDS } = mod;

test('#164 schema: validates stdio server with required fields', () => {
  const r = validateMcpServerConfig({ serverName: 'github', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] });
  assert.equal(r.ok, true, JSON.stringify(r.issues));
  assert.equal(r.value.serverName, 'github');
  assert.equal(r.value.transport, 'stdio');
});
test('#164 schema: validates streamable-http server with required url', () => {
  const r = validateMcpServerConfig({ serverName: 'remote', transport: 'streamable-http', url: 'https://example.com/mcp' });
  assert.equal(r.ok, true, JSON.stringify(r.issues));
});
test('#164 schema: missing required fields fail', () => {
  assert.equal(validateMcpServerConfig({ transport: 'stdio', command: 'x' }).ok, false);
  assert.equal(validateMcpServerConfig({ serverName: 'a', transport: 'stdio' }).ok, false);
  assert.equal(validateMcpServerConfig({ serverName: 'a', transport: 'streamable-http' }).ok, false);
  assert.equal(validateMcpServerConfig(null).ok, false);
});
test('#164 normalization: preserves unknown fields without loss', () => {
  const raw = { serverName: 'x', transport: 'stdio', command: 'echo', scope: 'global', disabledTools: ['a'], disabled: false, customFutureField: { nested: true } };
  const n = normalizeMcpServerConfig(raw);
  assert.equal(n.value.scope, 'global');
  assert.deepEqual(n.value.disabledTools, ['a']);
  assert.equal(n.value.disabled, false);
  assert.deepEqual(n.value.customFutureField, { nested: true });
  assert.ok(n.preservedUnknownKeys.includes('customFutureField'));
});
test('#164 immutability: serverName cannot change on update', () => {
  const r = validateMcpServerConfig({ serverName: 'new-name', transport: 'stdio', command: 'x' }, { mode: 'update', existingServerName: 'old-name' });
  assert.equal(r.ok, false);
  assert.ok(r.issues.some((i) => i.code === 'immutable' && i.path === 'serverName'));
});
test('#164: stdio and streamable-http transports supported; unknown transport rejected', () => {
  assert.equal(validateMcpServerConfig({ serverName: 'a', transport: 'stdio', command: 'x' }).ok, true);
  assert.equal(validateMcpServerConfig({ serverName: 'a', transport: 'streamable-http', url: 'https://x' }).ok, true);
  assert.equal(validateMcpServerConfig({ serverName: 'a', transport: 'websocket', url: 'ws://x' }).ok, false);
});
test('#164: credential reference templates are accepted as values', () => {
  const r = validateMcpServerConfig({ serverName: 'gh', transport: 'stdio', command: 'sh', args: ['-c', 'TOKEN=${credential:GITHUB_TOKEN} exec npx server'], env: { API_KEY: '${credential:API_KEY}' }, expandTemplates: true });
  assert.equal(r.ok, true, JSON.stringify(r.issues));
});
test('#164 contract: CRUD service interface shape is implementable (runtime smoke)', () => {
  assert.ok(Array.isArray(MCP_SCHEMA_VERIFIED_FIELDS));
  assert.ok(MCP_SCHEMA_VERIFIED_FIELDS.includes('serverName'));
  assert.ok(MCP_SCHEMA_VERIFIED_FIELDS.includes('transport'));
  assert.ok(MCP_SCHEMA_UNVERIFIED_PASSTHROUGH_FIELDS.includes('scope'));
  const mock = {
    async listServers() { return { servers: [] }; },
    async getServer() { return null; },
    async createServer(input) { return { config: validateMcpServerConfig(input.config).value }; },
    async updateServer(input) { return { config: validateMcpServerConfig(input.patch, { mode: 'update', existingServerName: input.serverName }).value }; },
    async removeServer(input) { return { removed: true, serverName: input.serverName }; },
    async testServer() { return { ok: true }; },
  };
  assert.equal(typeof mock.listServers, 'function');
  assert.equal(typeof mock.updateServer, 'function');
});
test('#164 preflight note: verified vs unverified fields are explicit', () => {
  assert.ok(!MCP_SCHEMA_VERIFIED_FIELDS.includes('scope'));
  assert.ok(!MCP_SCHEMA_VERIFIED_FIELDS.includes('disabledTools'));
  assert.ok(MCP_SCHEMA_UNVERIFIED_PASSTHROUGH_FIELDS.includes('disabledTools'));
});
