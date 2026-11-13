import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual, randomUUID } from 'node:crypto';
import { ToolCallId } from '@deepseek-ai/dsh-llm';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { ToolRuntime as DshToolRuntime } from '@deepseek-ai/dsh-tools';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CLAUDE_CAPABILITIES } from '../provider-capabilities.js';

type ToolRuntime = Pick<DshToolRuntime, 'schemas' | 'execute'>;

const ALLOWED_TOOLS = new Set(CLAUDE_CAPABILITIES.cliTools.allowlist);

/** Stands in the planned argv for the config path, which exists only once the run's endpoint is up. */
export const MCP_CONFIG_PLACEHOLDER = '__WAYCRAFT_MCP_CONFIG__';

/** The per-turn MCP endpoint and private Claude CLI config file. */
export interface ClaudeCliMcpRun {
  configPath: string;
  close(): Promise<void>;
}

/** Start the run-owned MCP endpoint and write its token-bearing config privately. */
export async function createClaudeCliMcpRun(input: {
  accountDirectory: string;
  runtime: ToolRuntime;
  agent: Agent;
  signal: AbortSignal;
}): Promise<ClaudeCliMcpRun> {
  const token = randomBytes(32).toString('base64url');
  const tools = input.runtime
    .schemas(input.agent)
    .filter(({ name }) => ALLOWED_TOOLS.has(name));
  const endpoint = createServer();
  const server = new Server(
    { name: 'waycraft-dsh-tools', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(({ name, description, parameters }) => ({
      name,
      description,
      inputSchema: parameters,
    })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    if (!tools.some((tool) => tool.name === name)) {
      return {
        content: [{ type: 'text', text: 'Unknown tool' }],
        isError: true,
      };
    }
    const result = await input.runtime.execute({
      callId: ToolCallId(randomUUID()),
      name,
      arguments: request.params.arguments ?? {},
      agent: input.agent,
      signal: input.signal,
    });
    return { content: result.content as never, isError: result.isError };
  });
  let configDirectory: string | undefined;
  let endpointStarted = false;
  let connected = false;
  let closing: Promise<void> | undefined;
  const abort = () => {
    void close().catch(() => {});
  };
  const close = () => {
    if (closing) return closing;
    input.signal.removeEventListener('abort', abort);
    closing = (async () => {
      try {
        if (connected) await transport.close();
      } finally {
        try {
          if (connected) await server.close();
        } finally {
          if (endpointStarted && endpoint.listening) {
            await new Promise<void>((resolve) =>
              endpoint.close(() => resolve()),
            );
          }
          if (configDirectory)
            await rm(configDirectory, { recursive: true, force: true });
        }
      }
    })();
    return closing;
  };
  try {
    input.signal.throwIfAborted();
    await server.connect(transport);
    connected = true;
    input.signal.throwIfAborted();
    endpoint.on('request', (request, response) => {
      const address = endpoint.address();
      const port =
        address && typeof address !== 'string' ? address.port : undefined;
      const authorization = request.headers.authorization ?? '';
      const supplied = Buffer.from(
        authorization.startsWith('Bearer ') ? authorization.slice(7) : '',
      );
      const expected = Buffer.from(token);
      const sameLength = supplied.length === expected.length;
      const matches = timingSafeEqual(
        expected,
        sameLength ? supplied : Buffer.alloc(expected.length),
      );
      if (
        request.url !== '/mcp' ||
        request.headers.host !== `127.0.0.1:${port}` ||
        request.headers.origin !== undefined ||
        !matches
      ) {
        response.writeHead(401).end();
        return;
      }
      void transport.handleRequest(request, response).catch(() => {
        if (!response.headersSent) response.writeHead(500).end();
        else response.destroy();
      });
    });
    input.signal.addEventListener('abort', abort, { once: true });
    input.signal.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        endpoint.off('listening', onListening);
        reject(error);
      };
      const onListening = () => {
        endpoint.off('error', onError);
        endpointStarted = true;
        resolve();
      };
      endpoint.once('error', onError);
      endpoint.once('listening', onListening);
      endpoint.listen(0, '127.0.0.1');
    });
    const address = endpoint.address();
    if (!address || typeof address === 'string') {
      throw new Error('Claude CLI MCP endpoint failed to bind');
    }
    configDirectory = await mkdtemp(
      join(input.accountDirectory, '.waycraft-mcp-'),
    );
    input.signal.throwIfAborted();
    const configPath = join(configDirectory, 'mcp.json');
    await writeFile(
      configPath,
      JSON.stringify({
        mcpServers: {
          'waycraft-dsh-tools': {
            type: 'http',
            url: `http://127.0.0.1:${address.port}/mcp`,
            headers: { Authorization: `Bearer ${token}` },
          },
        },
      }),
      { mode: 0o600, flag: 'wx' },
    );
    return { configPath, close };
  } catch (error) {
    await close();
    throw error;
  }
}
