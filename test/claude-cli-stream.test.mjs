import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateClaudeCliStream } from '../dist/translate/claude-cli.js';

test('unknown CLI events warn once without hiding known following text', async () => {
  const warnings = [];
  async function* lines() {
    yield JSON.stringify({ type: 'future-a' });
    yield JSON.stringify({ type: 'future-b' });
    yield JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'text', text: 'visible' }] },
    });
    yield JSON.stringify({
      type: 'result',
      session_id: 'fixture',
      is_error: false,
    });
  }
  const chunks = [];
  for await (const chunk of translateClaudeCliStream(lines(), (warning) =>
    warnings.push(warning),
  ))
    chunks.push(chunk);
  assert.equal(warnings.length, 1);
  assert.equal(
    chunks.find((chunk) => chunk.type === 'text-delta').text,
    'visible',
  );
});
