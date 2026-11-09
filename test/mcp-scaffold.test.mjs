import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('waycraft-mcp component is registered as default-off in cordis.patch.yml', async () => {
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8');
  assert.match(patch, /id:\s*waycraft-mcp/);
  assert.match(patch, /name:\s*'dsh-waycraft\/mcp'/);
  // default-off
  const idx = patch.indexOf('id: waycraft-mcp');
  assert.ok(idx >= 0);
  const tail = patch.slice(idx, idx + 120);
  assert.match(tail, /disabled:\s*true/);
});

test('mcp component exports are declared in package.json', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.exports['./mcp'], './dist/mcp.js');
});
