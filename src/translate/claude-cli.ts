import type { StreamChunk } from '@deepseek-ai/dsh-llm';

/** Official Claude Code stream-json and Agent SDK source pages (checked 2026-11-12). */
export const CLAUDE_CLI_STREAM_SOURCES = [
  'https://code.claude.com/docs/en/headless',
  'https://code.claude.com/docs/en/agent-sdk/streaming-output',
  'https://code.claude.com/docs/en/agent-sdk/typescript',
] as const;

const TOOL_INPUT_LIMIT = 800;
const TOOL_RESULT_LIMIT = 1500;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const clip = (value: string, limit: number) =>
  value.length > limit
    ? `${value.slice(0, limit)}\n… (${value.length - limit} more characters)`
    : value;
const fence = (body: string, language = '') => {
  const mark = body.includes('```') ? '````' : '```';
  return `${mark}${language}\n${body}\n${mark}`;
};

/** A tool call as markdown: a bold name, the file or command it acts on, and the remaining arguments. */
function toolCallMarkdown(name: string, input: unknown): string {
  const args = isRecord(input) ? input : {};
  const target = ['file_path', 'path', 'url', 'pattern'].find(
    (key) => typeof args[key] === 'string',
  );
  const header = `⚙ **${name}**${target ? ` \`${String(args[target]).replaceAll('`', "'")}\`` : ''}`;
  if (typeof args.command === 'string')
    return `${header}\n\n${fence(clip(args.command, TOOL_INPUT_LIMIT), 'bash')}`;
  const rest = Object.fromEntries(
    Object.entries(args).filter(([key]) => key !== target),
  );
  return Object.keys(rest).length
    ? `${header}\n\n${fence(clip(JSON.stringify(rest, null, 2), TOOL_INPUT_LIMIT), 'json')}`
    : header;
}

/** The text of a tool result, which the CLI sends as a string or as content blocks. */
function toolResultText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) =>
      isRecord(part) && part.type === 'text' && typeof part.text === 'string'
        ? part.text
        : '[non-text result]',
    )
    .join('\n');
}

/** A tool result as markdown, under the name of the call it answers. */
function toolResultMarkdown(
  name: string,
  content: unknown,
  failed: boolean,
): string {
  const body = toolResultText(content).trim();
  const header = `↳ **${name}** ${failed ? 'error' : 'result'}`;
  return body
    ? `${header}\n\n${fence(clip(body, TOOL_RESULT_LIMIT))}`
    : `${header} (no output)`;
}

/**
 * Translate documented partial CLI events and completed Agent SDK messages. The CLI runs its own tools, so a tool call
 * and its result are drawn inline as markdown text blocks in stream order; DSH never runs them.
 */
export async function* translateClaudeCliStream(
  lines: AsyncIterable<string>,
  onWarn: (message: string) => void = () => {},
): AsyncIterable<StreamChunk> {
  let warned = false;
  let nextIndex = 0;
  let open:
    | { index: number; kind: 'text' | 'reasoning'; text: string }
    | undefined;
  let sessionId: string | undefined;
  let gotResult = false;
  let partial = false;
  const toolNames = new Map<string, string>();
  const unknown = (kind: string) => {
    if (!warned) {
      warned = true;
      onWarn(`Ignoring unsupported Claude CLI stream-json event: ${kind}`);
    }
  };
  const close = (): StreamChunk[] => {
    if (!open) return [];
    const block =
      open.kind === 'text'
        ? { type: 'text' as const, text: open.text }
        : { type: 'reasoning' as const, text: open.text };
    const end: StreamChunk = { type: 'block-end', index: open.index, block };
    open = undefined;
    return [end];
  };
  const emit = (kind: 'text' | 'reasoning', text: string): StreamChunk[] => {
    if (!text) return [];
    const chunks: StreamChunk[] = [];
    if (open?.kind !== kind) {
      chunks.push(...close());
      open = { index: nextIndex++, kind, text: '' };
      chunks.push({ type: 'block-start', index: open.index, blockType: kind });
    }
    open.text += text;
    chunks.push({
      type: kind === 'text' ? 'text-delta' : 'reasoning-delta',
      index: open.index,
      text,
    });
    return chunks;
  };
  const whole = (markdown: string): StreamChunk[] => {
    const chunks = close();
    const index = nextIndex++;
    chunks.push(
      { type: 'block-start', index, blockType: 'text' },
      { type: 'text-delta', index, text: markdown },
      { type: 'block-end', index, block: { type: 'text', text: markdown } },
    );
    return chunks;
  };
  /** Text and thinking stream live when partial events are on, so only the tool calls are read from the completed message. */
  const content = function* (
    blocks: unknown[],
    streamed: boolean,
  ): Generator<StreamChunk> {
    for (const item of blocks) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        unknown('content-block');
        continue;
      }
      const block = item as Record<string, unknown>;
      if (block.type === 'text' && typeof block.text === 'string') {
        if (!streamed) yield* emit('text', block.text);
      } else if (
        block.type === 'thinking' &&
        typeof block.thinking === 'string'
      ) {
        if (!streamed) yield* emit('reasoning', block.thinking);
      } else if (block.type === 'tool_use') {
        const name = typeof block.name === 'string' ? block.name : 'tool';
        if (typeof block.id === 'string') {
          if (toolNames.has(block.id)) continue;
          toolNames.set(block.id, name);
        }
        yield* whole(toolCallMarkdown(name, block.input));
      } else if (block.type !== 'tool_result')
        unknown(typeof block.type === 'string' ? block.type : 'content-block');
    }
  };
  const results = function* (blocks: unknown[]): Generator<StreamChunk> {
    for (const item of blocks) {
      if (!isRecord(item) || item.type !== 'tool_result') continue;
      const name =
        (typeof item.tool_use_id === 'string'
          ? toolNames.get(item.tool_use_id)
          : undefined) ?? 'tool';
      yield* whole(
        toolResultMarkdown(name, item.content, item.is_error === true),
      );
    }
  };
  for await (const line of lines) {
    if (!line.trim()) continue;
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      unknown('invalid-json');
      continue;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      unknown('invalid-record');
      continue;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.session_id === 'string') sessionId = record.session_id;
    if (record.type === 'stream_event') {
      if (
        !record.event ||
        typeof record.event !== 'object' ||
        Array.isArray(record.event)
      ) {
        unknown('stream_event');
        continue;
      }
      const event = record.event as Record<string, unknown>;
      if (event.type === 'message_start') partial = true;
      if (event.type === 'content_block_stop') yield* close();
      if (
        event.type === 'content_block_delta' &&
        event.delta &&
        typeof event.delta === 'object'
      ) {
        const delta = event.delta as Record<string, unknown>;
        if (delta.type === 'text_delta' && typeof delta.text === 'string')
          yield* emit('text', delta.text);
        else if (
          delta.type === 'thinking_delta' &&
          typeof delta.thinking === 'string'
        )
          yield* emit('reasoning', delta.thinking);
        else if (
          delta.type !== 'signature_delta' &&
          delta.type !== 'input_json_delta'
        )
          unknown(
            typeof delta.type === 'string' ? delta.type : 'content_block_delta',
          );
      } else if (
        ![
          'message_start',
          'content_block_start',
          'content_block_stop',
          'message_delta',
          'message_stop',
        ].includes(String(event.type))
      )
        unknown(typeof event.type === 'string' ? event.type : 'stream_event');
      continue;
    }
    // Completed SDK Message types are documented by the TypeScript Agent SDK.
    if (record.type === 'assistant' || record.type === 'user') {
      const message = record.message;
      if (
        !message ||
        typeof message !== 'object' ||
        Array.isArray(message) ||
        !Array.isArray((message as Record<string, unknown>).content)
      ) {
        unknown(String(record.type));
        continue;
      }
      const blocks = (message as { content: unknown[] }).content;
      if (record.type === 'assistant') yield* content(blocks, partial);
      else yield* results(blocks);
      if (record.type === 'assistant') partial = false;
      continue;
    }
    if (record.type === 'result') {
      yield* close();
      if (record.is_error === true)
        throw new Error(
          typeof record.result === 'string'
            ? record.result
            : 'Claude CLI turn failed',
        );
      if (!sessionId) throw new Error('Claude CLI result omitted session_id');
      yield {
        type: 'finish',
        reason: { kind: 'stop' },
        replayState: {
          response: { kind: 'waycraft-claude-cli-session', sessionId },
          blocks: [],
        },
      };
      gotResult = true;
      continue;
    }
    // Control frames belong to the driver, which answers them; they carry nothing to draw.
    if (
      record.type === 'control_request' ||
      record.type === 'control_cancel_request' ||
      record.type === 'control_response'
    )
      continue;
    if (record.type !== 'system')
      unknown(typeof record.type === 'string' ? record.type : 'missing-type');
  }
  if (!gotResult)
    throw new Error('Claude CLI stream ended without a result event');
}
