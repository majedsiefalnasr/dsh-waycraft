// #181: the extra-usage HTTP 400 on a Direct sign-in Claude account, driven through the assembled component with a fake network.
// Every credential, token and HTTP exchange below is a fixture. Nothing touches the real Keychain, ~/.claude or Anthropic.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply, CLAUDE_KEYCHAIN_SYNC_MS } from '../dist/subscriptions.js';
import { refreshClaudeSynced } from '../dist/auth/claude-code-creds.js';
import { CLAUDE_TOKEN_URL } from '../dist/providers/claude.js';

const FAR = 4_000_000_000_000;
const blob = (extra = {}) =>
  JSON.stringify({
    claudeAiOauth: {
      accessToken: 'fake-a-access',
      refreshToken: 'fake-a-refresh',
      expiresAt: FAR,
      scopes: ['user:inference'],
      subscriptionType: 'max',
      emailAddress: 'a@example.test',
      ...extra,
    },
    other: { keep: true },
  });
const settle = () => new Promise((resolve) => setImmediate(resolve));
const until = async (condition, label) => {
  for (let i = 0; i < 300; i++) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(`timed out waiting for ${label}`);
};
// Absence checks need a quiet window: wait until the observed value stops changing for `turns` polls (bounded).
const quiet = async (read, turns = 15) => {
  let last = read();
  let stable = 0;
  for (let i = 0; i < 300 && stable < turns; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    const now = read();
    if (now === last) stable++;
    else {
      stable = 0;
      last = now;
    }
  }
};
const home = async (name) => {
  process.env.DSH_HOME = await mkdtemp(
    join(tmpdir(), `waycraft-t181-${name}-`),
  );
  return process.env.DSH_HOME;
};

function fakeIo({ keychain, platform = 'darwin' } = {}) {
  const state = { keychain, reads: 0, writes: [] };
  return {
    state,
    io: {
      platform,
      readKeychainRaw() {
        state.reads++;
        return state.keychain;
      },
      getKeychainAccountName() {
        return 'fixture-account';
      },
      writeKeychainRaw(account, raw) {
        state.writes.push({ account, raw });
        state.keychain = raw;
        return true;
      },
      credentialsFilePath() {
        return '/fixture/claude/.credentials.json';
      },
      readFileRaw() {
        state.reads++;
        return undefined;
      },
      writeFileRaw() {
        state.writes.push({ target: 'file' });
        return true;
      },
    },
  };
}

function host({ io, config = {} }) {
  const routes = new Map(),
    cleanups = [],
    adapters = {};
  const ctx = {
    logger: { warn() {} },
    llm: {
      registerAdapter(ids, value) {
        adapters[ids[0]] = value;
        return { replace() {} };
      },
    },
    get: () => ({
      fetch: {
        register(route) {
          routes.set(route.path, route);
          return () => routes.delete(route.path);
        },
      },
    }),
    effect(fn) {
      const cleanup = fn();
      if (cleanup) cleanups.push(cleanup);
    },
    inject(names, fn) {
      if ([].concat(names).includes('connection')) fn(ctx);
    },
  };
  apply(
    ctx,
    {
      models: { claude: [{ id: 'claude-fixture', name: 'Claude fixture' }] },
      ...config,
    },
    { claudeCredsIo: io },
  );
  return {
    adapters,
    async call(endpoint, payload = {}) {
      const method = `waycraft-subscriptions.${endpoint}`;
      const response = await routes.get(`/api/${method}`).fetch(
        new Request(`http://localhost/api/${method}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: 'client-request',
            rpcId: 'fixture',
            method,
            payload,
          }),
        }),
      );
      return (await response.json()).result;
    },
    dispose() {
      cleanups
        .splice(0)
        .reverse()
        .forEach((fn) => fn());
    },
  };
}

const sse = (events) =>
  new Response(
    events
      .map(
        (event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
      )
      .join(''),
    { headers: { 'content-type': 'text/event-stream' } },
  );
const reply = (text) =>
  sse([
    { type: 'message_start', message: { usage: { input_tokens: 1 } } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text' } },
    {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'text_delta', text },
    },
    { type: 'content_block_stop', index: 0 },
    {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn' },
      usage: { output_tokens: 1 },
    },
    { type: 'message_stop' },
  ]);
const session = (token, extra = {}) => ({
  accessToken: `fake-${token}-access`,
  refreshToken: `fake-${token}-refresh`,
  expiresAt: FAR,
  scopes: 's',
  ...extra,
});

const EXTRA_USAGE_BODY = {
  type: 'error',
  error: {
    type: 'invalid_request_error',
    message:
      'Third-party apps now draw from your extra usage, not your plan limits. Claim a credit and keep going.',
  },
};
const request = (sessionId) => ({
  provider: 'claude',
  model: 'claude-fixture',
  sessionId,
  messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
  signal: new AbortController().signal,
});
const drain = async (iterable) => {
  const chunks = [];
  for await (const chunk of iterable) chunks.push(chunk);
  return chunks;
};
const rejection = async (iterable) => {
  try {
    await drain(iterable);
  } catch (error) {
    return error;
  }
  assert.fail('expected the stream to fail');
};
async function twoAccounts() {
  const store = await import('../dist/auth/store.js');
  for (const token of ['a', 'b'])
    await store.saveAccountSession(
      'claude',
      `${token}@example.test`,
      session(token, { emailAddress: `${token}@example.test` }),
    );
}

test('the extra-usage 400 becomes a plain explanation, is not retried and tries no other account', async () => {
  await home('explain');
  await twoAccounts();
  const originalFetch = globalThis.fetch;
  const bearers = [];
  globalThis.fetch = async (url, init) => {
    if (!String(url).startsWith('https://api.anthropic.com/v1/messages'))
      throw new Error('network forbidden');
    bearers.push(
      String(init.headers.authorization ?? init.headers.Authorization),
    );
    return Response.json(EXTRA_USAGE_BODY, { status: 400 });
  };
  const component = host({
    io: fakeIo({}).io,
    config: { pool: { strategy: 'priority' } },
  });
  try {
    const error = await rejection(
      component.adapters.claude.stream(request('s1')),
    );
    assert.equal(error.code, 'EXTRA_USAGE_REQUIRED');
    assert.match(error.message, /extra usage/i);
    assert.match(error.message, /Official CLI/);
    assert.doesNotMatch(error.message, /invalid_request_error|HTTP 400/);
    await quiet(() => bearers.length);
    assert.equal(bearers.length, 1, 'one request: no retry, no second account');
    assert.ok(bearers[0].includes('fake-a-access'));
    const notice = await component.call('extraUsageNotice', {
      provider: 'claude',
      sessionId: 's1',
    });
    assert.deepEqual(notice.value, { active: true, revision: 1 });
    const other = await component.call('extraUsageNotice', {
      provider: 'claude',
      sessionId: 'unrelated',
    });
    assert.deepEqual(other.value, { active: false });
    await rejection(component.adapters.claude.stream(request('s1')));
    assert.deepEqual(
      (
        await component.call('extraUsageNotice', {
          provider: 'claude',
          sessionId: 's1',
        })
      ).value,
      { active: true, revision: 2 },
      'a repeated refusal has a new dismissal identity',
    );
  } finally {
    component.dispose();
    globalThis.fetch = originalFetch;
  }
});

test('any other 400 is reported as it is today and raises no notice', async () => {
  await home('other-400');
  await twoAccounts();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (!String(url).startsWith('https://api.anthropic.com/v1/messages'))
      throw new Error('network forbidden');
    return Response.json(
      {
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message: 'messages: bad shape',
        },
      },
      { status: 400 },
    );
  };
  const component = host({
    io: fakeIo({}).io,
    config: { pool: { strategy: 'priority' } },
  });
  try {
    const error = await rejection(
      component.adapters.claude.stream(request('s2')),
    );
    assert.equal(error.code, 'HTTP_400');
    assert.match(error.message, /HTTP 400/);
    assert.match(error.message, /messages: bad shape/);
    const notice = await component.call('extraUsageNotice', {
      provider: 'claude',
      sessionId: 's2',
    });
    assert.deepEqual(notice.value, { active: false });
  } finally {
    component.dispose();
    globalThis.fetch = originalFetch;
  }
});

test('the notice clears once a later turn of the same session succeeds', async () => {
  await home('clears');
  await twoAccounts();
  const originalFetch = globalThis.fetch;
  let blocked = true;
  globalThis.fetch = async (url) => {
    if (!String(url).startsWith('https://api.anthropic.com/v1/messages'))
      throw new Error('network forbidden');
    return blocked
      ? Response.json(EXTRA_USAGE_BODY, { status: 400 })
      : reply('now served');
  };
  const component = host({
    io: fakeIo({}).io,
    config: { pool: { strategy: 'priority' } },
  });
  try {
    await rejection(component.adapters.claude.stream(request('s3')));
    assert.deepEqual(
      (
        await component.call('extraUsageNotice', {
          provider: 'claude',
          sessionId: 's3',
        })
      ).value,
      { active: true, revision: 1 },
    );
    blocked = false;
    await drain(component.adapters.claude.stream(request('s3')));
    assert.deepEqual(
      (
        await component.call('extraUsageNotice', {
          provider: 'claude',
          sessionId: 's3',
        })
      ).value,
      { active: false },
    );
  } finally {
    component.dispose();
    globalThis.fetch = originalFetch;
  }
});
