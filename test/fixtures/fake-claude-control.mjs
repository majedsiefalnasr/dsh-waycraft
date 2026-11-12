// Fake `claude` executable for the control-channel tests. It never contacts a provider or reads a real login.
// It answers --version and --help, reads one stream-json user envelope from stdin, then plays a scenario chosen by
// a marker in the prompt. Everything it receives (arguments, environment, envelope, control responses) is appended
// to the file named by FAKE_CLAUDE_RECORD.
import { appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);
if (args.includes('--version')) {
  console.log('2.1.322');
  process.exit(0);
}
if (args.includes('--help')) {
  console.log(
    [
      'Options:',
      '  -p, --print',
      '  --input-format <f>',
      '  --output-format <f>',
      '  --verbose',
      '  --include-partial-messages',
      '  --model <m>',
      '  --session-id <id>',
      '  --resume <id>',
      '  --system-prompt <p>',
      '  --permission-mode <m>',
      '  --permission-prompt-tool <t>',
      '  --tools <t>',
    ].join('\n'),
  );
  process.exit(0);
}

const record = (entry) =>
  appendFileSync(process.env.FAKE_CLAUDE_RECORD, `${JSON.stringify(entry)}\n`);
const say = (value) => console.log(JSON.stringify(value));
const lines = createInterface({ input: process.stdin })[Symbol.asyncIterator]();
const nextLine = async () => {
  const { value, done } = await lines.next();
  return done ? undefined : value;
};
const SESSION = '22222222-2222-4222-8222-222222222222';
const finish = () => {
  say({ type: 'result', session_id: SESSION, is_error: false });
  process.exit(0);
};
const text = (value) =>
  say({
    type: 'assistant',
    message: { content: [{ type: 'text', text: value }] },
  });
const control = async (id, request) => {
  say({ type: 'control_request', request_id: id, request });
  const line = await nextLine();
  const response = line === undefined ? undefined : JSON.parse(line);
  record({ controlResponse: response });
  return response?.response?.response;
};

const envelope = await nextLine();
const message = JSON.parse(envelope ?? '{}');
const content = message.message?.content;
const prompt = typeof content === 'string' ? content : JSON.stringify(content);
record({ args, env: process.env, envelope: message });

if (prompt.includes('scenario:plain')) {
  text('Hello');
  finish();
}
if (prompt.includes('scenario:tools')) {
  say({ type: 'stream_event', event: { type: 'message_start' } });
  say({
    type: 'stream_event',
    event: {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'Before' },
    },
  });
  say({ type: 'stream_event', event: { type: 'content_block_stop' } });
  say({
    type: 'assistant',
    message: {
      content: [
        { type: 'text', text: 'Before' },
        {
          type: 'tool_use',
          id: 'tu-1',
          name: 'Bash',
          input: { command: 'ls -la', description: 'List files' },
        },
      ],
    },
  });
  say({
    type: 'user',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tu-1',
          content: 'file1\nfile2',
          is_error: false,
        },
      ],
    },
  });
  say({
    type: 'assistant',
    message: {
      content: [
        {
          type: 'tool_use',
          id: 'tu-2',
          name: 'Read',
          input: { file_path: '/tmp/none.txt' },
        },
      ],
    },
  });
  say({
    type: 'user',
    message: {
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'tu-2',
          content: [{ type: 'text', text: 'no such file' }],
          is_error: true,
        },
      ],
    },
  });
  say({ type: 'stream_event', event: { type: 'message_start' } });
  say({
    type: 'stream_event',
    event: {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'After' },
    },
  });
  say({ type: 'stream_event', event: { type: 'content_block_stop' } });
  say({
    type: 'assistant',
    message: { content: [{ type: 'text', text: 'After' }] },
  });
  finish();
}
if (prompt.includes('scenario:approval')) {
  const reply = await control('req-1', {
    subtype: 'can_use_tool',
    tool_name: 'Bash',
    input: { command: 'rm -rf build' },
    tool_use_id: 'tu-approval',
    description: 'Remove the build directory',
  });
  text(
    reply?.behavior === 'allow'
      ? 'ran'
      : `blocked: ${reply?.message ?? 'no reply'}`,
  );
  finish();
}
if (prompt.includes('scenario:question')) {
  const reply = await control('req-2', {
    subtype: 'can_use_tool',
    tool_name: 'AskUserQuestion',
    tool_use_id: 'tu-question',
    input: {
      questions: [
        {
          question: 'Which framework?',
          header: 'Framework',
          multiSelect: prompt.includes('multi-select'),
          options: [
            { label: 'React', description: 'Component library' },
            { label: 'Vue', description: 'Progressive framework' },
          ],
        },
      ],
    },
  });
  text(
    reply?.behavior === 'allow'
      ? `answers: ${JSON.stringify(reply.updatedInput.answers)}`
      : `blocked: ${reply?.message ?? 'no reply'}`,
  );
  finish();
}
if (prompt.includes('scenario:plan')) {
  const reply = await control('req-3', {
    subtype: 'can_use_tool',
    tool_name: 'ExitPlanMode',
    tool_use_id: 'tu-plan',
    input: {
      plan: prompt.includes('empty-plan') ? '  ' : '# Plan\n\n1. Do the thing',
    },
  });
  text(
    reply?.behavior === 'allow'
      ? 'plan approved'
      : `plan blocked: ${reply?.message ?? 'no reply'}`,
  );
  finish();
}
if (prompt.includes('scenario:no-call-id')) {
  const reply = await control('req-6', {
    subtype: 'can_use_tool',
    tool_name: 'Bash',
    input: { command: 'make' },
  });
  text(reply?.behavior === 'allow' ? 'ran' : 'blocked');
  finish();
}
if (prompt.includes('scenario:cancelled-by-cli')) {
  say({
    type: 'control_request',
    request_id: 'req-4',
    request: {
      subtype: 'can_use_tool',
      tool_name: 'Bash',
      input: { command: 'sleep 1' },
      tool_use_id: 'tu-cancel',
    },
  });
  say({ type: 'control_cancel_request', request_id: 'req-4' });
  text('moved on');
  finish();
}
if (prompt.includes('scenario:hold-approval')) {
  say({
    type: 'control_request',
    request_id: 'req-5',
    request: {
      subtype: 'can_use_tool',
      tool_name: 'Bash',
      input: { command: 'make' },
      tool_use_id: 'tu-hold',
    },
  });
  setInterval(() => {}, 1000);
  await new Promise(() => {});
}
text('unknown scenario');
finish();
