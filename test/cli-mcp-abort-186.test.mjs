import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClaudeCliMcpRun } from '../dist/auth/claude-cli-mcp.js';

test('abort during private MCP file creation removes the directory after creation completes', async (t) => {
  const root = await fs.mkdtemp(join(tmpdir(), 'waycraft-abort-186-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const controller = new AbortController();
  const write = fs.writeFile;
  const mocked = t.mock.method(fs, 'writeFile', async (...args) => {
    if (String(args[0]).startsWith(root)) controller.abort();
    return write(...args);
  });
  syncBuiltinESMExports();
  try {
    await assert.rejects(
      createClaudeCliMcpRun({
        accountDirectory: root,
        signal: controller.signal,
        dshTools: { runtime: { schemas: () => [] }, agent: {} },
      }),
    );
    assert.deepEqual(await fs.readdir(root), []);
  } finally {
    mocked.mock.restore();
    syncBuiltinESMExports();
  }
});
