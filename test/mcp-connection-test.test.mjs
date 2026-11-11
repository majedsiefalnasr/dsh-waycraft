import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { testMcpConnection } from '../dist/mcp-connection-test.js';
import { McpCordisConfigStore } from '../dist/mcp-config-store.js';
import { apply } from '../dist/mcp.js';

function tempStore(initial = '[]\n') {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-conn-'));
  const configPath = join(dir, 'cordis.patch.yml');
  writeFileSync(configPath, initial);
  const store = new McpCordisConfigStore({ configPath });
  return {
    dir,
    configPath,
    store,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const STDIO_SERVER_CODE = `
import { McpServer } from ${JSON.stringify(import.meta.resolve('@modelcontextprotocol/sdk/server/mcp.js'))};
import { StdioServerTransport } from ${JSON.stringify(import.meta.resolve('@modelcontextprotocol/sdk/server/stdio.js'))};
const server = new McpServer({ name: 'fixture-stdio', version: '1.0.0' });
server.tool('ping', 'ping fixture', {}, async () => ({ content: [{ type: 'text', text: 'pong' }] }));
const transport = new StdioServerTransport();
await server.connect(transport);
`;

async function startHttpFixture() {
  const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
  const { WebStandardStreamableHTTPServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
  );
  // Stateless mode: transport cannot be reused across requests, so create fresh per request.
  const nodeServer = http.createServer(async (req, res) => {
    let transport;
    try {
      const server = new McpServer({ name: 'fixture-http', version: '1.0.0' });
      server.tool('echo', 'echo fixture', {}, async () => ({
        content: [{ type: 'text', text: 'ok' }],
      }));
      transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      await server.connect(transport);
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks);
      const url = new URL(
        req.url || '/',
        `http://${req.headers.host || '127.0.0.1'}`,
      );
      const webReq = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : body,
      });
      const webRes = await transport.handleRequest(webReq);
      res.statusCode = webRes.status;
      webRes.headers.forEach((v, k) => res.setHeader(k, v));
      const ab = await webRes.arrayBuffer();
      res.end(Buffer.from(ab));
    } catch (e) {
      if (!res.headersSent) res.statusCode = 500;
      if (!res.writableEnded) res.end(String(e?.message || e));
    } finally {
      try {
        await transport?.close?.();
      } catch {}
    }
  });
  await new Promise((resolve) => nodeServer.listen(0, '127.0.0.1', resolve));
  const { port } = nodeServer.address();
  return {
    url: `http://127.0.0.1:${port}/mcp`,
    async close() {
      await new Promise((r) => nodeServer.close(r));
    },
  };
}

test('#168 controlled stdio fixture: direct MCP SDK probe reports connected', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-stdio-fixture-'));
  const script = join(dir, 'server.mjs');
  writeFileSync(script, STDIO_SERVER_CODE);
  const r = await testMcpConnection(
    'fixture-stdio',
    {
      serverName: 'fixture-stdio',
      transport: 'stdio',
      command: process.execPath,
      args: [script],
      cwd: dir,
    },
    { timeoutMs: 15000 },
  );
  rmSync(dir, { recursive: true, force: true });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.capability, 'direct-mcp-sdk');
  assert.equal(r.capabilityVerified, true);
  assert.match(r.message, /connected/i);
  assert.ok(Array.isArray(r.toolNames));
  assert.ok(r.toolNames.includes('ping'));
});

test('#168 controlled HTTP fixture: direct MCP SDK probe reports connected', async () => {
  const fx = await startHttpFixture();
  try {
    const r = await testMcpConnection(
      'fixture-http',
      {
        serverName: 'fixture-http',
        transport: 'streamable-http',
        url: fx.url,
      },
      { timeoutMs: 15000 },
    );
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.capability, 'direct-mcp-sdk');
    assert.match(r.message, /connected/i);
    assert.ok((r.toolNames || []).includes('echo'));
  } finally {
    await fx.close();
  }
});

test('#168 failure reporting is actionable and redacted', async () => {
  const secret = 'ghp_abcdefghijklmnopqrstuvwxyz0123456789ABCD';
  const r = await testMcpConnection(
    'bad',
    {
      serverName: 'bad',
      transport: 'stdio',
      command: process.execPath,
      args: ['-e', `console.error(${JSON.stringify(secret)}); process.exit(2)`],
    },
    { timeoutMs: 10000 },
  );
  assert.equal(r.ok, false);
  assert.ok(r.message.length > 0);
  assert.ok(
    !JSON.stringify(r).includes(secret),
    'secret leaked in probe result',
  );
});

test('#168 no auto-test on import/create/list', async () => {
  let probes = 0;
  const ctx = {
    mcpManager: {
      probe: async () => {
        probes++;
        return { ok: true };
      },
    },
  };
  const { dir, configPath, cleanup } = tempStore();
  try {
    // create store entry (no probe)
    const store = new McpCordisConfigStore({ configPath });
    await store.create({
      serverName: 'srv',
      transport: 'stdio',
      command: 'echo',
      args: ['hi'],
    });
    await store.list();
    // module import side effects already happened; ensure our fake probe count untouched
    assert.equal(probes, 0);
    // explicit call probes
    await testMcpConnection(
      'srv',
      { serverName: 'srv', transport: 'stdio', command: 'echo', args: ['hi'] },
      { ctx },
    );
    assert.equal(probes, 1);
  } finally {
    cleanup();
  }
});

test('#168 trust-bypass prevention: RPC test_connection rejects untrusted and invalidated configs', async () => {
  const { configPath, cleanup } = tempStore();
  process.env.DSH_CORDIS_PATCH_PATH = configPath;
  try {
    let handler;
    const routes = [];
    const ctx = {
      inject: (_deps, fn) =>
        fn({
          get: () => ({
            fetch: {
              register: (r) => {
                routes.push(r);
                handler = r.fetch;
                return () => {};
              },
            },
          }),
        }),
    };
    apply(ctx, {});
    const call = async (body, peer) => {
      const req = new Request('http://127.0.0.1/api/waycraft-mcp.manage', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-waycraft-mcp': '1' },
        body: JSON.stringify(body),
      });
      if (peer) req.peer = peer;
      const r = await handler(req);
      return { status: r.status, json: await r.json() };
    };
    let r = await call({
      action: 'create',
      config: {
        serverName: 'srv',
        transport: 'stdio',
        command: process.execPath,
        args: ['-e', 'setTimeout(()=>{},1000)'],
      },
    });
    assert.equal(r.status, 200);
    r = await call({ action: 'test_connection', serverName: 'srv' });
    assert.equal(r.status, 403, JSON.stringify(r));
    assert.equal(r.json.code, 'trust_required');
    r = await call({ action: 'approve_trust', serverName: 'srv' });
    assert.equal(r.status, 200);
    r = await call({
      action: 'update',
      serverName: 'srv',
      patch: { args: ['-e', 'process.exit(0)'] },
    });
    assert.equal(r.status, 200);
    r = await call({ action: 'test_connection', serverName: 'srv' });
    assert.equal(
      r.status,
      403,
      'material change must invalidate trust before test',
    );
    assert.equal(r.json.code, 'trust_required');
  } finally {
    delete process.env.DSH_CORDIS_PATCH_PATH;
    cleanup();
  }
});

test('#168 uses ctx.mcpManager.probe when available (capability verified) and falls back when absent', async () => {
  const config = {
    serverName: 'srv',
    transport: 'stdio',
    command: 'echo',
    args: ['hi'],
  };
  let called = 0;
  const ok = await testMcpConnection('srv', config, {
    ctx: {
      mcpManager: {
        probe: async () => {
          called++;
          return {
            ok: true,
            toolNames: ['t1'],
            durationMs: 1,
            closeConfirmed: true,
          };
        },
      },
    },
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.capability, 'mcpManager.probe');
  assert.equal(ok.capabilityVerified, true);
  assert.equal(called, 1);
  const bad = await testMcpConnection('srv', config, {
    ctx: {
      mcpManager: {
        probe: async () => ({ ok: false, stage: 'connect', message: 'boom' }),
      },
    },
  });
  assert.equal(bad.ok, false);
  assert.equal(bad.capability, 'mcpManager.probe');
  assert.match(bad.message, /boom/);
  // fallback path (no mcpManager, dsh-mcp-client 0.0.1-rc.1 has no probeServer export): direct SDK reports unavailable/config/connect as appropriate
  const fallback = await testMcpConnection(
    'srv',
    {
      serverName: 'srv',
      transport: 'stdio',
      command: process.execPath,
      args: ['-e', 'process.exit(3)'],
    },
    { ctx: {} },
  );
  assert.equal(fallback.capability, 'direct-mcp-sdk'); // because probeServer not exported in installed version
  assert.equal(fallback.capabilityVerified, true);
});

test('an uninjected mcpManager service does not make the probe throw', async () => {
  const ctx = new Proxy(
    {},
    {
      get(_, k) {
        if (k === 'mcpManager')
          throw new Error('cannot get property "mcpManager" without inject');
        return undefined;
      },
    },
  );
  const r = await testMcpConnection(
    'x',
    {
      serverName: 'x',
      transport: 'stdio',
      command: 'sh',
      args: ['-c', 'exit 1'],
    },
    { ctx, timeoutMs: 3000 },
  );
  assert.equal(r.ok, false);
  assert.ok(r.message);
});
