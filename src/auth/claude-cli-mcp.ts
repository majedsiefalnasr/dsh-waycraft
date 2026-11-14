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

/** The name of the run's own server; no server of the MCP manager can take it. */
export const DSH_TOOLS_SERVER = 'waycraft-dsh-tools';

/** A server of the MCP manager in the Claude CLI's `--mcp-config` shape. */
export type ClaudeCliMcpServer = Record<string, unknown>;

/** Write one private run directory holding `mcp.json`, created exclusively with mode 0600. */
async function writeRunConfig(
  accountDirectory: string,
  servers: Record<string, ClaudeCliMcpServer>,
): Promise<{ directory: string; configPath: string }> {
  const directory = await mkdtemp(join(accountDirectory, '.waycraft-mcp-'));
  const configPath = join(directory, 'mcp.json');
  try {
    await writeFile(configPath, JSON.stringify({ mcpServers: servers }), {
      mode: 0o600,
      flag: 'wx',
    });
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
  return { directory, configPath };
}

/**
 * The per-turn MCP configuration: the servers the MCP manager allows and, when the session has an agent and a tool
 * service, the run-owned endpoint for DSH's tools. With no DSH tools there is no endpoint, only the private file.
 * Whatever it holds (a server's environment or headers may carry secrets) is never logged; the file is removed when
 * the turn ends or is aborted.
 */
export async function createClaudeCliMcpRun(input: {
  accountDirectory: string;
  signal: AbortSignal;
  managerServers?: Record<string, ClaudeCliMcpServer>;
  dshTools?: { runtime: ToolRuntime; agent: Agent };
}): Promise<ClaudeCliMcpRun> {
  const managerServers = input.managerServers ?? {};
  if (!input.dshTools) {
    input.signal.throwIfAborted();
    const written = await writeRunConfig(
      input.accountDirectory,
      managerServers,
    );
    let removed: Promise<void> | undefined;
    const close = () => {
      input.signal.removeEventListener('abort', abort);
      removed ??= rm(written.directory, { recursive: true, force: true });
      return removed;
    };
    const abort = () => {
      void close().catch(() => {});
    };
    input.signal.addEventListener('abort', abort, { once: true });
    if (input.signal.aborted) {
      await close();
      input.signal.throwIfAborted();
    }
    return { configPath: written.configPath, close };
  }
  const { runtime, agent } = input.dshTools;
  const token = randomBytes(32).toString('base64url');
  const tools = runtime
    .schemas(agent)
    .filter(({ name }) => ALLOWED_TOOLS.has(name));
  const endpoint = createServer();
  const server = new Server(
    { name: DSH_TOOLS_SERVER, version: '1.0.0' },
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
    const result = await runtime.execute({
      callId: ToolCallId(randomUUID()),
      name,
      arguments: request.params.arguments ?? {},
      agent: agent,
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
    const written = await writeRunConfig(input.accountDirectory, {
      ...managerServers,
      [DSH_TOOLS_SERVER]: {
        type: 'http',
        url: `http://127.0.0.1:${address.port}/mcp`,
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    configDirectory = written.directory;
    // Abort may have completed close() before the asynchronous file creation returned its directory.
    if (input.signal.aborted) {
      await rm(written.directory, { recursive: true, force: true });
      input.signal.throwIfAborted();
    }
    const configPath = written.configPath;
    return { configPath, close };
  } catch (error) {
    await close();
    throw error;
  }
}
