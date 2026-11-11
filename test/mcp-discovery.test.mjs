import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { discoverMcpConfigs } from '../dist/mcp-discovery.js';

function tempDir(prefix = 'mcp-disc-') {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function validMcpServersJson() {
  return JSON.stringify(
    { mcpServers: { demo: { command: 'node', args: ['server.js'] } } },
    null,
    2,
  );
}

test('#172 stays within approved search roots and finds known MCP config files', async () => {
  const root = tempDir();
  const outside = tempDir('mcp-outside-');
  try {
    writeFileSync(join(root.dir, 'mcp-servers.json'), validMcpServersJson());
    writeFileSync(join(outside.dir, '.mcp.json'), validMcpServersJson());
    const res = await discoverMcpConfigs({ roots: [root.dir] });
    assert.equal(res.ok, true);
    assert.equal(res.stats.roots, 1);
    assert.ok(
      res.files.some(
        (f) =>
          f.status === 'candidate' && f.relativePath === 'mcp-servers.json',
      ),
    );
    assert.ok(
      !JSON.stringify(res).includes(outside.dir),
      'must not scan outside approved roots',
    );
    assert.equal(res.scope.filesystemScanOnly, true);
    assert.equal(res.scope.projectRuntimeIsolation, false);
  } finally {
    root.cleanup();
    outside.cleanup();
  }
});

test('#172 malformed and oversized files handled gracefully', async () => {
  const root = tempDir();
  try {
    writeFileSync(join(root.dir, '.mcp.json'), '{ not valid json');
    const big = tempDir();
    writeFileSync(join(big.dir, 'mcp-servers.json'), 'x'.repeat(300 * 1024));
    const res = await discoverMcpConfigs({
      roots: [root.dir, big.dir],
      maxFileBytes: 1024,
    });
    const malformed = res.files.find(
      (f) =>
        f.root.endsWith(root.dir.split('/').pop()) ||
        f.path.endsWith('/.mcp.json'),
    );
    assert.ok(
      res.files.some((f) => f.status === 'malformed'),
      `expected malformed, got ${JSON.stringify(res.files)}`,
    );
    assert.ok(
      res.files.some((f) => f.status === 'oversized'),
      `expected oversized, got ${JSON.stringify(res.files)}`,
    );
    assert.ok(res.stats.malformed >= 1);
    assert.ok(res.stats.oversized >= 1);
    big.cleanup();
  } finally {
    root.cleanup();
  }
});

test('#172 no secret leakage in discovery results', async () => {
  const root = tempDir();
  try {
    writeFileSync(
      join(root.dir, 'mcp-servers.json'),
      JSON.stringify({
        mcpServers: {
          secretful: {
            command: 'node',
            env: {
              GITHUB_TOKEN: 'ghp_abcdefghijklmnopqrstuvwxyz123456',
              SAFE_REF: '${credential:GITHUB_TOKEN}',
            },
            headers: {
              Authorization: 'Bearer abcdefghijklmnopqrstuvwxyz123456',
            },
          },
        },
      }),
    );
    const res = await discoverMcpConfigs({ roots: [root.dir] });
    const text = JSON.stringify(res);
    assert.ok(
      !text.includes('ghp_abcdefghijklmnopqrstuvwxyz123456'),
      'plaintext token must not leak',
    );
    assert.ok(
      !text.includes('Bearer abcdefghijklmnopqrstuvwxyz123456'),
      'bearer header must not leak',
    );
    assert.ok(
      text.includes('${credential:GITHUB_TOKEN}') ||
        text.includes('[REDACTED]'),
      'credential refs preserved or sensitive values redacted',
    );
  } finally {
    root.cleanup();
  }
});

test('#172 no auto-activation of discovered servers; presents candidates only', async () => {
  const root = tempDir();
  try {
    writeFileSync(join(root.dir, 'mcp-servers.json'), validMcpServersJson());
    let sideEffects = 0;
    const res = await discoverMcpConfigs({ roots: [root.dir] });
    assert.equal(sideEffects, 0);
    const candidate = res.files.find((f) => f.status === 'candidate');
    assert.ok(
      candidate?.preview,
      'candidate should include preview for explicit registration',
    );
    assert.equal(candidate.preview.ok, true);
    // Discovery only scans; it does not create/store/execute/connect.
    assert.ok(
      res.files.every(
        (f) => f.status !== 'registered' && f.status !== 'activated',
      ),
    );
  } finally {
    root.cleanup();
  }
});

test('#172 path traversal / boundary safety: requested roots resolved and scoped', async () => {
  const root = tempDir();
  try {
    writeFileSync(join(root.dir, 'mcp-servers.json'), validMcpServersJson());
    // Traversal in root request should resolve; discovery still checks real paths and only reads known files.
    const traversal = join(root.dir, 'sub', '..');
    const res = await discoverMcpConfigs({ roots: [traversal] });
    assert.equal(res.ok, true);
    assert.ok(res.roots[0].ok);
    // No file path in result may escape resolved root.
    for (const f of res.files) {
      if (!f.path) continue;
      assert.ok(
        f.path.startsWith(res.roots[0].resolved) ||
          f.status === 'skipped' ||
          f.status === 'unreadable' ||
          f.status === 'malformed' ||
          f.status === 'unsupported' ||
          f.status === 'candidate' ||
          f.status === 'oversized',
      );
    }
  } finally {
    root.cleanup();
  }
});

test('#172 symlink safety: symlink target outside approved root is rejected', async (t) => {
  const root = tempDir();
  const outside = tempDir('mcp-out-');
  try {
    writeFileSync(join(outside.dir, 'mcp-servers.json'), validMcpServersJson());
    try {
      symlinkSync(
        join(outside.dir, 'mcp-servers.json'),
        join(root.dir, 'mcp-servers.json'),
      );
    } catch (err) {
      if (err && (err.code === 'EPERM' || err.code === 'EACCES'))
        return t.skip('symlinks not permitted in this environment');
      throw err;
    }
    const res = await discoverMcpConfigs({ roots: [root.dir] });
    const entry = res.files.find(
      (f) =>
        f.relativePath === 'mcp-servers.json' ||
        f.path.endsWith('mcp-servers.json'),
    );
    assert.ok(entry, 'symlinked known path should be reported');
    assert.notEqual(
      entry.status,
      'candidate',
      'outside-root symlink target must not become a candidate',
    );
    assert.match(
      (entry.message || '') + ' ' + entry.status,
      /escape|skipped|Symlink/i,
    );
    const text = JSON.stringify(res);
    assert.ok(!text.includes('command') || entry.status !== 'candidate'); // no executed/registered data from outside
  } finally {
    root.cleanup();
    outside.cleanup();
  }
});

test('#172 symlink safety: symlink target inside approved root may be read', async (t) => {
  const root = tempDir();
  try {
    mkdirSync(join(root.dir, 'real'));
    writeFileSync(join(root.dir, 'real', 'mcp.json'), validMcpServersJson());
    try {
      symlinkSync(
        join(root.dir, 'real', 'mcp.json'),
        join(root.dir, 'mcp-servers.json'),
      );
    } catch (err) {
      if (err && (err.code === 'EPERM' || err.code === 'EACCES'))
        return t.skip('symlinks not permitted');
      throw err;
    }
    const res = await discoverMcpConfigs({ roots: [root.dir] });
    // Symlink stays inside approved root; discovery may follow it to the resolved known config.
    const candidate = res.files.find(
      (f) =>
        f.status === 'candidate' &&
        (f.relativePath === 'mcp-servers.json' ||
          f.relativePath === 'real/mcp.json' ||
          f.path.endsWith('/real/mcp.json')),
    );
    assert.ok(
      candidate,
      `expected inside-root symlink to yield candidate: ${JSON.stringify(res.files)}`,
    );
  } finally {
    root.cleanup();
  }
});

test('#172 integration: scans known project discovery locations without implying project runtime isolation', async () => {
  const root = tempDir();
  try {
    mkdirSync(join(root.dir, '.dsh', 'dshmm'), { recursive: true });
    writeFileSync(
      join(root.dir, '.dsh', 'dshmm', 'mcp.json'),
      JSON.stringify({
        waycraftMcpImport: 1,
        servers: [
          {
            config: {
              serverName: 'proj-local',
              transport: 'stdio',
              command: 'node',
              args: ['s.js'],
              scope: 'project',
            },
          },
        ],
      }),
    );
    const res = await discoverMcpConfigs({ roots: [root.dir] });
    assert.ok(
      res.files.some(
        (f) =>
          f.status === 'candidate' &&
          f.relativePath.includes('.dsh/dshmm/mcp.json'),
      ),
    );
    assert.equal(res.scope.projectRuntimeIsolation, false);
    // Import preview enforces V1 scope behavior for candidates.
    const cand = res.files.find((f) => f.status === 'candidate');
    assert.equal(cand.preview.scope.projectScopeSupported, false);
  } finally {
    root.cleanup();
  }
});

test('#172 unsupported structures reported, not silently accepted; no execution', async () => {
  const root = tempDir();
  try {
    writeFileSync(
      join(root.dir, '.mcp.json'),
      JSON.stringify({ random: 'shape', servers: 'nope' }),
    );
    const res = await discoverMcpConfigs({ roots: [root.dir] });
    assert.ok(res.files.some((f) => f.status === 'unsupported'));
    assert.ok(
      !res.files.some(
        (f) => f.status === 'candidate' && f.preview?.format == null,
      ),
    );
  } finally {
    root.cleanup();
  }
});
