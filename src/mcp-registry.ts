const ENDPOINT = 'https://registry.modelcontextprotocol.io/v0.1/servers';
const MAX_BYTES = 1024 * 1024;

export class McpRegistryError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export interface RegistryServer {
  name: string;
  description: string;
  version: string;
  remotes: { type: string; url: string; headers: { name: string; required: boolean }[] }[];
  hasPackages: boolean;
}

/** Anonymous metadata only. Never follows catalog links or runs server configuration. */
export async function searchMcpRegistry(
  input: { query?: unknown; cursor?: unknown; limit?: unknown },
  options: { fetch?: typeof fetch; signal?: AbortSignal } = {},
): Promise<{ servers: RegistryServer[]; nextCursor?: string }> {
  const fail = (code: string, message: string): never => { throw new McpRegistryError(code, message); };
  if (input.query !== undefined && (typeof input.query !== 'string' || input.query.length > 200)) fail('registry_input', 'Search must be at most 200 characters.');
  if (input.cursor !== undefined && (typeof input.cursor !== 'string' || input.cursor.length > 2048)) fail('registry_input', 'Invalid Registry page cursor.');
  const limit = input.limit ?? 20;
  if (!Number.isInteger(limit) || Number(limit) < 1 || Number(limit) > 25) fail('registry_input', 'Page size must be between 1 and 25.');
  const url = new URL(ENDPOINT);
  url.searchParams.set('version', 'latest');
  url.searchParams.set('limit', String(limit));
  if (input.query) url.searchParams.set('search', String(input.query));
  if (input.cursor) url.searchParams.set('cursor', String(input.cursor));
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) cancel();
  const timer = setTimeout(cancel, 10000);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    if (controller.signal.aborted) fail('registry_cancelled', 'Registry request cancelled.');
    const response = await (options.fetch ?? fetch)(url, { signal: controller.signal, redirect: 'error', headers: { accept: 'application/json' } });
    if (!response.ok) fail('registry_upstream', `Registry is unavailable (HTTP ${response.status}). Retry later.`);
    if (Number(response.headers.get('content-length')) > MAX_BYTES) fail('registry_size', 'Registry response is too large. Narrow your search.');
    if (!response.body) fail('registry_response', 'Registry returned an empty response.');
    reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let size = 0;
    let text = '';
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BYTES) fail('registry_size', 'Registry response is too large. Narrow your search.');
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    let data: any;
    try { data = JSON.parse(text); } catch { fail('registry_response', 'Registry returned invalid JSON.'); }
    const readBoundedString = (value: unknown, max: number): string => {
      if (typeof value !== 'string' || value.length > max) fail('registry_response', 'Registry returned invalid metadata.');
      return value as string;
    };
    if (!Array.isArray(data?.servers) || data.servers.length > 100) fail('registry_response', 'Registry returned an invalid server list.');
    const servers = data.servers.map((entry: any): RegistryServer => {
      const server = entry?.server;
      const name = readBoundedString(server?.name, 300);
      const version = readBoundedString(server?.version, 200);
      if (!name || !version) fail('registry_response', 'Registry metadata is missing identity.');
      if (server.remotes !== undefined && (!Array.isArray(server.remotes) || server.remotes.length > 20)) fail('registry_response', 'Invalid Registry transports.');
      return {
        name, version, description: readBoundedString(server.description ?? '', 5000), hasPackages: Array.isArray(server.packages) && server.packages.length > 0,
        remotes: (server.remotes ?? []).map((remote: any) => {
          if (!remote || typeof remote !== 'object') fail('registry_response', 'Invalid Registry transport.');
          if (remote.headers !== undefined && (!Array.isArray(remote.headers) || remote.headers.length > 50)) fail('registry_response', 'Invalid Registry headers.');
          return { type: readBoundedString(remote.type, 100), url: readBoundedString(remote.url, 4096), headers: (remote.headers ?? []).map((header: any) => {
            if (!header || typeof header !== 'object') fail('registry_response', 'Invalid Registry header.');
            return { name: readBoundedString(header.name, 200), required: header.isRequired === true };
          }) };
        }),
      };
    });
    const nextCursor = data.metadata?.nextCursor === undefined ? undefined : readBoundedString(data.metadata.nextCursor, 2048);
    return { servers, ...(nextCursor ? { nextCursor } : {}) };
  } catch (error) {
    if (error instanceof McpRegistryError) throw error;
    if (controller.signal.aborted) fail(options.signal?.aborted ? 'registry_cancelled' : 'registry_timeout', options.signal?.aborted ? 'Registry request cancelled.' : 'Registry timed out. Retry later.');
    return fail('registry_network', 'Unable to reach the Official Registry. Retry later.');
  } finally {
    if (reader) await reader.cancel().catch(() => {});
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}
