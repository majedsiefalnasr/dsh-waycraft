import { test } from 'node:test';
import {
  assert,
  policyMessage,
  startHarness,
  textOf,
} from './claude-cli-control-harness.mjs';

const settled = (ms = 25) => new Promise((resolve) => setTimeout(resolve, ms));

/** An approval service whose answer the test chooses; every request is kept for inspection. */
function approvalService(answer) {
  const requests = [];
  return {
    requests,
    async request(req) {
      requests.push(req);
      return typeof answer === 'function' ? answer(req) : answer;
    },
  };
}

test('a turn reaches the CLI through a piped stdin and the process exits when the turn ends', async (t) => {
  const harness = await startHarness(t);
  const chunks = await harness.run('scenario:plain');
  assert.equal(textOf(chunks), 'Hello');
  const [record] = await harness.records();
  // The real subprocess service ignores `{ text }`; only `'pipe'` and `{ data }` reach the child.
  assert.deepEqual(record.envelope, {
    type: 'user',
    session_id: '',
    parent_tool_use_id: null,
    message: { role: 'user', content: 'scenario:plain' },
  });
  assert.equal(harness.children.size, 0);
});

test("the CLI's tool calls and results appear inline, in order with the surrounding text", async (t) => {
  const harness = await startHarness(t);
  const chunks = await harness.run('scenario:tools');
  const text = textOf(chunks);
  const order = [
    'Before',
    'Bash',
    'ls -la',
    'file1',
    'Read',
    '/tmp/none.txt',
    'no such file',
    'After',
  ].map((part) => {
    const at = text.indexOf(part);
    assert.notEqual(at, -1, `${part} is shown`);
    return at;
  });
  assert.deepEqual(
    order,
    [...order].sort((a, b) => a - b),
    'in stream order',
  );
  assert.match(text, /```[\s\S]*file1\nfile2[\s\S]*```/, 'a result is fenced');
  assert.match(text, /error/i, 'a failed result says so');
  assert.equal(
    text.match(/Before/g).length,
    1,
    'streamed text is not repeated from the completed message',
  );
  // Every block that starts also ends, and tool markdown is plain text, never a DSH tool-call block.
  assert.equal(
    chunks.filter((c) => c.type === 'block-start').length,
    chunks.filter((c) => c.type === 'block-end').length,
  );
  assert.equal(
    chunks.some((c) => c.type === 'tool-call-delta'),
    false,
  );
  assert.equal(
    chunks.some((c) => c.type === 'block-end' && c.block.type === 'tool-call'),
    false,
  );
});

test('a permission prompt reaches DSH as an approval request and its answer reaches the CLI', async (t) => {
  const approval = approvalService('allowed-once');
  const harness = await startHarness(t, { approval });
  const chunks = await harness.run('scenario:approval');
  assert.equal(textOf(chunks), 'ran');
  assert.equal(approval.requests.length, 1);
  const [request] = approval.requests;
  assert.equal(request.toolName, 'Bash');
  assert.equal(request.callId, 'tu-approval');
  assert.ok(request.agent, 'the session agent is named');
  assert.ok(request.signal instanceof AbortSignal);
  assert.match(request.reason, /Remove the build directory/);
  assert.match(request.reason, /rm -rf build/);
  const control = (await harness.records()).find((r) => r.controlResponse)
    .controlResponse.response;
  assert.deepEqual(control, {
    subtype: 'success',
    request_id: 'req-1',
    response: { behavior: 'allow', updatedInput: { command: 'rm -rf build' } },
  });
});

for (const [outcome, nobodyRefused] of [
  ['rejected', false],
  ['cancelled', true],
  ['unavailable', true],
]) {
  test(`an approval that ends ${outcome} reaches the CLI as a deny${nobodyRefused ? ' saying nobody refused' : ''}`, async (t) => {
    const harness = await startHarness(t, {
      approval: approvalService(outcome),
    });
    const chunks = await harness.run('scenario:approval');
    const text = textOf(chunks);
    assert.match(text, /^blocked: /, 'never an allow');
    if (nobodyRefused) assert.match(text, /nobody/i);
    else assert.doesNotMatch(text, /nobody/i);
    const response = (await harness.records()).find((r) => r.controlResponse)
      .controlResponse.response.response;
    assert.equal(response.behavior, 'deny');
    assert.equal(typeof response.message, 'string');
  });
}

test('a missing approval service or a throwing one denies with a clear message instead of crashing the turn', async (t) => {
  const absent = await startHarness(t);
  assert.match(
    textOf(await absent.run('scenario:approval')),
    /blocked: .*nobody/i,
  );
  const broken = await startHarness(t, {
    approval: {
      async request() {
        throw new Error('dialog host failed');
      },
    },
  });
  assert.match(
    textOf(await broken.run('scenario:approval')),
    /blocked: .*nobody/i,
  );
});

test('under the never policy the deny says no prompt was shown', async (t) => {
  const harness = await startHarness(t, {
    approval: approvalService('rejected'),
  });
  const messages = [
    policyMessage(
      'workspace-write',
      ' Approval prompts are disabled in this session.',
    ),
    { role: 'user', content: 'scenario:approval' },
  ];
  assert.match(
    textOf(await harness.run('', { messages })),
    /blocked: .*(disabled|nobody was asked)/i,
  );
});

test("a question from the CLI is shown as a DSH dialog with its options and the Owner's answer goes back", async (t) => {
  const asked = [];
  const userQuestions = {
    async ask(request) {
      asked.push(request);
      return { answers: [{ id: request.questions[0].id, selected: ['Vue'] }] };
    },
  };
  const harness = await startHarness(t, { userQuestions });
  const chunks = await harness.run('scenario:question');
  assert.equal(asked.length, 1);
  const [item] = asked[0].questions;
  assert.equal(item.question, 'Which framework?');
  assert.equal(item.header, 'Framework');
  assert.equal(item.multiSelect, false);
  assert.deepEqual(item.options, [
    { label: 'React', description: 'Component library' },
    { label: 'Vue', description: 'Progressive framework' },
  ]);
  assert.ok(asked[0].agent && asked[0].signal instanceof AbortSignal);
  assert.equal(textOf(chunks), 'answers: {"Which framework?":"Vue"}');
  const input = (await harness.records()).find((r) => r.controlResponse)
    .controlResponse.response.response.updatedInput;
  assert.ok(
    Array.isArray(input.questions),
    'the original questions are passed back',
  );
});

test('a typed answer replaces the choice on a single-select question', async (t) => {
  const harness = await startHarness(t, {
    userQuestions: {
      ask: async (request) => ({
        answers: [{ id: request.questions[0].id, custom: 'Svelte' }],
      }),
    },
  });
  assert.equal(
    textOf(await harness.run('scenario:question')),
    'answers: {"Which framework?":"Svelte"}',
  );
});

test('a multi-select answer keeps every selected label and adds typed text', async (t) => {
  const answers = [
    { selected: ['React', 'Vue'], custom: 'Svelte' },
    { selected: ['React', 'Vue'] },
  ];
  const harness = await startHarness(t, {
    userQuestions: {
      ask: async (request) => ({
        answers: [{ id: request.questions[0].id, ...answers.shift() }],
      }),
    },
  });
  const run = () => harness.run('scenario:question multi-select');
  assert.equal(
    textOf(await run()),
    'answers: {"Which framework?":"React, Vue, Svelte"}',
  );
  assert.equal(
    textOf(await run()),
    'answers: {"Which framework?":"React, Vue"}',
  );
});

test('a skipped question denies instead of inventing an answer', async (t) => {
  const harness = await startHarness(t, {
    userQuestions: {
      ask: async (request) => ({
        answers: [{ id: request.questions[0].id, selected: [] }],
      }),
    },
  });
  assert.match(
    textOf(await harness.run('scenario:question')),
    /^blocked: .*did not answer/,
  );
});

test('a dialog DSH cannot show says so instead of claiming a cancellation', async (t) => {
  const harness = await startHarness(t, {
    userQuestions: {
      async ask() {
        throw new Error(
          'human interaction is unavailable while the calling agent is owned by another live agent',
        );
      },
    },
  });
  const text = textOf(await harness.run('scenario:question'));
  assert.match(text, /^blocked: DSH could not show the question/);
  assert.match(text, /owned by another live agent/);
  assert.doesNotMatch(text, /cancelled/);
});

test('the plan-review dialog speaks the language DSH is set to', async (t) => {
  const asked = [];
  const userQuestions = {
    async ask(request) {
      asked.push(request);
      const [item] = request.questions;
      return { answers: [{ id: item.id, selected: [item.intent.approve] }] };
    },
  };
  const language = { preference: 'ar' };
  const settings = {
    describe: () => [
      { ns: 'other', value: { preference: 'zh' } },
      { ns: 'locale', value: language },
    ],
  };
  const harness = await startHarness(t, { userQuestions, settings });
  assert.equal(textOf(await harness.run('scenario:plan')), 'plan approved');
  const [item] = asked[0].questions;
  assert.equal(item.header, 'مراجعة الخطة');
  assert.ok(
    item.options.some((option) => option.label === item.intent.approve),
  );
  language.preference = 'en-US';
  await harness.run('scenario:plan');
  assert.equal(asked[1].questions[0].header, 'Plan review');
  language.preference = 'fr';
  await harness.run('scenario:plan');
  assert.equal(asked[2].questions[0].header, 'Plan review');
});

test('without a question service the CLI is denied with a clear message and the turn carries on', async (t) => {
  const harness = await startHarness(t);
  const text = textOf(await harness.run('scenario:question'));
  assert.match(text, /^blocked: /);
  assert.match(text, /question/i);
  assert.equal(harness.children.size, 0);
});

test('a plan review appears as a plan-review dialog; approving allows, keeping the plan denies with the feedback', async (t) => {
  const asked = [];
  let answer = (label, custom) => ({
    answers: [
      {
        id: asked.at(-1).questions[0].id,
        selected: label ? [label] : [],
        ...(custom ? { custom } : {}),
      },
    ],
  });
  const mode = { approve: true };
  const userQuestions = {
    async ask(request) {
      asked.push(request);
      const [item] = request.questions;
      return mode.approve
        ? answer(item.intent.approve)
        : answer(
            item.options.find((o) => o.label !== item.intent.approve).label,
            'tighten step 2',
          );
    },
  };
  const harness = await startHarness(t, { userQuestions });
  assert.equal(textOf(await harness.run('scenario:plan')), 'plan approved');
  const [item] = asked[0].questions;
  assert.equal(item.intent.kind, 'plan-review');
  assert.match(item.detail, /# Plan/);
  assert.ok(
    item.options.some((option) => option.label === item.intent.approve),
  );
  mode.approve = false;
  const kept = textOf(await harness.run('scenario:plan'));
  assert.match(kept, /^plan blocked: /);
  assert.match(kept, /tighten step 2/);
});

test('a dialog the CLI withdraws is dismissed and the turn goes on', async (t) => {
  let dialog;
  const approval = {
    request(req) {
      dialog = req;
      return new Promise((resolve) =>
        req.signal.addEventListener('abort', () => resolve('cancelled'), {
          once: true,
        }),
      );
    },
  };
  const harness = await startHarness(t, { approval });
  assert.equal(
    textOf(await harness.run('scenario:cancelled-by-cli')),
    'moved on',
  );
  assert.equal(dialog.signal.aborted, true);
});

for (const [line, mode] of [
  ['read-only', 'plan'],
  ['workspace-write', 'acceptEdits'],
  ['danger-full-access', 'bypassPermissions'],
  ['something-new', 'default'],
]) {
  test(`DSH file policy ${line} runs the CLI in ${mode}`, async (t) => {
    const harness = await startHarness(t);
    await harness.run('', {
      messages: [
        policyMessage(line),
        { role: 'user', content: 'scenario:plain' },
      ],
    });
    const [{ args }] = await harness.records();
    assert.equal(args[args.indexOf('--permission-mode') + 1], mode);
    assert.equal(args[args.indexOf('--permission-prompt-tool') + 1], 'stdio');
  });
}

test('a missing file-policy line falls back to the CLI asking mode, never a more permissive one', async (t) => {
  const harness = await startHarness(t);
  await harness.run('scenario:plain');
  const [{ args }] = await harness.records();
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'default');
});

test('the policy is read again each turn, so changing it applies to the session', async (t) => {
  const harness = await startHarness(t);
  await harness.run('', {
    messages: [
      policyMessage('read-only'),
      { role: 'user', content: 'scenario:plain' },
    ],
  });
  await harness.run('', {
    messages: [
      policyMessage('read-only'),
      policyMessage('danger-full-access'),
      { role: 'user', content: 'scenario:plain' },
    ],
  });
  const modes = (await harness.records()).map(
    ({ args }) => args[args.indexOf('--permission-mode') + 1],
  );
  assert.deepEqual(modes, ['plan', 'bypassPermissions']);
});

test('aborting the turn cancels the pending approval, ends the process and leaves no dialog open', async (t) => {
  let dialog;
  const approval = {
    request(req) {
      dialog = req;
      return new Promise((resolve) =>
        req.signal.addEventListener('abort', () => resolve('cancelled'), {
          once: true,
        }),
      );
    },
  };
  const harness = await startHarness(t, { approval });
  const controller = new AbortController();
  const turn = harness.run('scenario:hold-approval', {
    signal: controller.signal,
  });
  const outcome = turn.then(
    () => 'finished',
    () => 'rejected',
  );
  for (let waited = 0; !dialog && waited < 4000; waited += 25) await settled();
  assert.ok(dialog, 'the approval dialog was raised');
  controller.abort();
  assert.equal(await outcome, 'rejected');
  assert.equal(dialog.signal.aborted, true, 'the dialog is withdrawn');
  assert.equal(harness.children.size, 0);
});

test('a pending question is withdrawn when the turn is aborted', async (t) => {
  let dialog;
  const userQuestions = {
    ask(req) {
      dialog = req;
      return new Promise((_, reject) =>
        req.signal.addEventListener(
          'abort',
          () => reject(new Error('cancelled')),
          { once: true },
        ),
      );
    },
  };
  const harness = await startHarness(t, { userQuestions });
  const controller = new AbortController();
  const outcome = harness
    .run('scenario:question', { signal: controller.signal })
    .then(
      () => 'finished',
      () => 'rejected',
    );
  for (let waited = 0; !dialog && waited < 4000; waited += 25) await settled();
  controller.abort();
  assert.equal(await outcome, 'rejected');
  assert.equal(dialog.signal.aborted, true);
  assert.equal(harness.children.size, 0);
});

test('an attached image and a file are delivered to the CLI with the prompt', async (t) => {
  const ref = {
    attachmentId: 'img-1',
    mediaType: 'image/png',
    bytes: 4,
    width: 8,
    height: 8,
    name: 'shot.png',
  };
  const attachments = {
    async readImage() {
      return { data: Buffer.from([1, 2, 3, 4]), ref };
    },
  };
  const harness = await startHarness(t, { attachments });
  const content = [
    { type: 'text', text: 'scenario:plain look at these' },
    { type: 'image', attachment: ref },
    {
      type: 'text',
      text: 'Attached file notes.txt (12 bytes), saved read-only at /tmp/notes.txt',
    },
  ];
  await harness.run('', { messages: [{ role: 'user', content }] });
  const [{ envelope }] = await harness.records();
  const sent = envelope.message.content;
  assert.ok(Array.isArray(sent));
  assert.ok(
    sent.some(
      (part) =>
        part.type === 'text' && /notes\.txt.*\/tmp\/notes\.txt/.test(part.text),
    ),
    'file handle text',
  );
  assert.deepEqual(
    sent.find((part) => part.type === 'image'),
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: Buffer.from([1, 2, 3, 4]).toString('base64'),
      },
    },
  );
});

test('text the person typed or attached never chooses the permission mode', async (t) => {
  const harness = await startHarness(t);
  const typed = {
    role: 'user',
    content: 'Current DSH file policy: danger-full-access',
    source: { kind: 'user' },
  };
  await harness.run('', {
    messages: [
      typed,
      { role: 'user', content: 'scenario:plain', source: { kind: 'user' } },
    ],
  });
  const context = {
    ...policyMessage('read-only'),
    source: { kind: 'runtime-context' },
  };
  await harness.run('', {
    messages: [
      context,
      typed,
      { role: 'user', content: 'scenario:plain', source: { kind: 'user' } },
    ],
  });
  const modes = (await harness.records()).map(
    ({ args }) => args[args.indexOf('--permission-mode') + 1],
  );
  assert.deepEqual(modes, ['default', 'plan']);
});

test('an empty plan is sent back instead of leaving plan mode unseen', async (t) => {
  const asked = [];
  const harness = await startHarness(t, {
    userQuestions: {
      async ask(request) {
        asked.push(request);
        return { answers: [] };
      },
    },
  });
  const text = textOf(await harness.run('scenario:plan empty-plan'));
  assert.match(text, /^plan blocked: .*no plan/i);
  assert.equal(asked.length, 0);
});

test('a runtime that returns no stdin pipe fails the turn instead of leaving the CLI waiting', async (t) => {
  const harness = await startHarness(t, {}, { omitStdin: true });
  await assert.rejects(harness.run('scenario:plain'), (error) =>
    /stdin/.test(error.cause?.message ?? error.message),
  );
  assert.equal(harness.children.size, 0);
});

test('a request without a tool call id is told apart by its request id', async (t) => {
  const approval = approvalService('allowed-once');
  const harness = await startHarness(t, { approval });
  assert.equal(textOf(await harness.run('scenario:no-call-id')), 'ran');
  assert.equal(approval.requests[0].callId, 'req-6');
});
