import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

/**
 * Smoke test for ticket #162: confirms toggle behavior at the manifest/contract
 * level without requiring a live DSH installation.
 */
test('MCP manager toggle smoke: default-off, independent row, clean scaffold contract', async () => {
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8');

  const rows = patch.split(/\n\s*- id:/).slice(1).map(r => '- id:' + r);
  const mcp = rows.find(r => r.includes('id: waycraft-mcp'));
  const subs = rows.find(r => r.includes('id: waycraft-subscriptions'));
  const skills = rows.find(r => r.includes('id: waycraft-skills'));
  assert.ok(mcp, 'waycraft-mcp row exists');
  assert.match(mcp, /disabled:\s*true/, 'waycraft-mcp default-off');
  assert.match(mcp, /name:\s*'dsh-waycraft\/mcp'/);
  assert.ok(subs && skills, 'subscriptions and skills rows exist independently');
  assert.notEqual(mcp, subs);
  assert.notEqual(mcp, skills);

  const src = await readFile(new URL('../src/mcp.ts', import.meta.url), 'utf8');
  assert.match(src, /export const name\s*=\s*['"]dsh-waycraft\/mcp['"]/);
  assert.match(src, /export function apply/);
  // No runtime background service/server connections in scaffold (ignore comments)
  const code = src.split('\n').filter(l => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*') && !l.trimStart().startsWith('/*')).join('\n');
  assert.doesNotMatch(code, /setInterval|setTimeout\s*\(\s*\(\)\s*=>\s*[^)]*connect|createServer|child_process|\.spawn\(|\.fork\(|new Worker/);
  assert.doesNotMatch(code, /from\s+['"]@deepseek-ai\/dsh-mcp-client['"]|mcpClient\.connect|startMcp/i);
});
