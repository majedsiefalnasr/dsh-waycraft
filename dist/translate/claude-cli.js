/** Official Claude Code stream-json and Agent SDK source pages (checked 2026-11-12). */
export const CLAUDE_CLI_STREAM_SOURCES = [
    'https://code.claude.com/docs/en/headless',
    'https://code.claude.com/docs/en/agent-sdk/streaming-output',
    'https://code.claude.com/docs/en/agent-sdk/typescript',
];
/** Translate documented partial CLI events and completed Agent SDK messages. */
export async function* translateClaudeCliStream(lines, onWarn = () => { }) {
    let warned = false;
    let nextIndex = 0;
    let open;
    let sessionId;
    let gotResult = false;
    let partial = false;
    const unknown = (kind) => {
        if (!warned) {
            warned = true;
            onWarn(`Ignoring unsupported Claude CLI stream-json event: ${kind}`);
        }
    };
    const close = () => {
        if (!open)
            return [];
        const block = open.kind === 'text'
            ? { type: 'text', text: open.text }
            : { type: 'reasoning', text: open.text };
        const end = { type: 'block-end', index: open.index, block };
        open = undefined;
        return [end];
    };
    const emit = (kind, text) => {
        if (!text)
            return [];
        const chunks = [];
        if (open?.kind !== kind) {
            chunks.push(...close());
            open = { index: nextIndex++, kind, text: '' };
            chunks.push({ type: 'block-start', index: open.index, blockType: kind });
        }
        open.text += text;
        chunks.push({ type: kind === 'text' ? 'text-delta' : 'reasoning-delta', index: open.index, text });
        return chunks;
    };
    const content = function* (blocks) {
        for (const item of blocks) {
            if (!item || typeof item !== 'object' || Array.isArray(item)) {
                unknown('content-block');
                continue;
            }
            const block = item;
            if (block.type === 'text' && typeof block.text === 'string')
                yield* emit('text', block.text);
            else if (block.type === 'thinking' && typeof block.thinking === 'string')
                yield* emit('reasoning', block.thinking);
            else if (block.type !== 'tool_use' && block.type !== 'tool_result')
                unknown(typeof block.type === 'string' ? block.type : 'content-block');
        }
    };
    for await (const line of lines) {
        if (!line.trim())
            continue;
        let value;
        try {
            value = JSON.parse(line);
        }
        catch {
            unknown('invalid-json');
            continue;
        }
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            unknown('invalid-record');
            continue;
        }
        const record = value;
        if (typeof record.session_id === 'string')
            sessionId = record.session_id;
        if (record.type === 'stream_event') {
            if (!record.event || typeof record.event !== 'object' || Array.isArray(record.event)) {
                unknown('stream_event');
                continue;
            }
            const event = record.event;
            if (event.type === 'message_start')
                partial = true;
            if (event.type === 'content_block_stop')
                yield* close();
            if (event.type === 'content_block_delta' && event.delta && typeof event.delta === 'object') {
                const delta = event.delta;
                if (delta.type === 'text_delta' && typeof delta.text === 'string')
                    yield* emit('text', delta.text);
                else if (delta.type === 'thinking_delta' && typeof delta.thinking === 'string')
                    yield* emit('reasoning', delta.thinking);
                else if (delta.type !== 'signature_delta' && delta.type !== 'input_json_delta')
                    unknown(typeof delta.type === 'string' ? delta.type : 'content_block_delta');
            }
            else if (!['message_start', 'content_block_start', 'content_block_stop', 'message_delta', 'message_stop'].includes(String(event.type)))
                unknown(typeof event.type === 'string' ? event.type : 'stream_event');
            continue;
        }
        // Completed SDK Message types are documented by the TypeScript Agent SDK.
        if (record.type === 'assistant' || record.type === 'user') {
            const message = record.message;
            if (!message || typeof message !== 'object' || Array.isArray(message) || !Array.isArray(message.content)) {
                unknown(String(record.type));
                continue;
            }
            if (record.type === 'assistant' && !partial)
                yield* content(message.content);
            if (record.type === 'assistant')
                partial = false;
            continue;
        }
        if (record.type === 'result') {
            yield* close();
            if (record.is_error === true)
                throw new Error(typeof record.result === 'string' ? record.result : 'Claude CLI turn failed');
            if (!sessionId)
                throw new Error('Claude CLI result omitted session_id');
            yield { type: 'finish', reason: { kind: 'stop' }, replayState: { response: { kind: 'waycraft-claude-cli-session', sessionId }, blocks: [] } };
            gotResult = true;
            continue;
        }
        if (record.type !== 'system')
            unknown(typeof record.type === 'string' ? record.type : 'missing-type');
    }
    if (!gotResult)
        throw new Error('Claude CLI stream ended without a result event');
}
