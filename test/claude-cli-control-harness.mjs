// Shared harness for the Claude Official CLI control-channel tests: the whole Subscriptions component against a fake
// executable, a private DSH home and fake DSH services. No installed CLI, default config, credentials or provider.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apply } from '../dist/subscriptions.js';

const FAKE = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'fake-claude-control.mjs',
);
export const ACCOUNT = '11111111-1111-4111-8111-111111111111';

/**
 * Start the component with a runtime that follows the real subprocess service's stdin contract: `'pipe'` exposes a
 * writable `stdin` that stays open, `{ data }` is written and ended, `'ignore'` is ended empty. Nothing else is
 * accepted, so a driver that sends the unsupported `{ text }` form hands the child an empty stdin.
 */
export async function startHarness(t, services = {}, options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-cli-control-'));
  const originalHome = process.env.DSH_HOME;
  const originalRecord = process.env.FAKE_CLAUDE_RECORD;
  process.env.DSH_HOME = root;
  process.env.FAKE_CLAUDE_RECORD = join(root, 'record.jsonl');
  const owned = join(root, 'plugins/waycraft/subscriptions/claude');
  await mkdir(owned, { recursive: true });
  await writeFile(
    join(owned, 'accounts.json'),
    JSON.stringify({
      accounts: {
        [ACCOUNT]: {
          accessMethod: 'official-cli',
          email: 'fixture@example.test',
        },
      },
    }),
  );
  const children = new Set();
  const defaultTools = {
    schemas: () => [],
    async execute() {
      throw new Error('unexpected DSH tool execution');
    },
  };
  const runtime = {
    resolveExecutable: async () => FAKE,
    spawn(spec) {
      const env = { ...process.env, ANTHROPIC_API_KEY: 'fixture-key' };
      for (const [key, value] of Object.entries(spec.env)) {
        if (value === undefined) delete env[key];
        else env[key] = value;
      }
      const child = spawn(
        process.execPath,
        [spec.argv[0], ...spec.argv.slice(1)],
        {
          cwd: spec.cwd,
          env,
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );
      children.add(child);
      let output = '';
      if (spec.stdio.stdout !== 'pipe')
        child.stdout.on('data', (chunk) => {
          output += chunk;
        });
      let errors = '';
      child.stderr.on('data', (chunk) => {
        errors += chunk;
      });
      const mode = spec.stdio.stdin;
      if (mode === 'ignore') child.stdin.end();
      else if (typeof mode === 'object') child.stdin.end(mode.data);
      else if (mode !== 'pipe') child.stdin.end();
      const done = new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (exitCode, signal) => {
          children.delete(child);
          resolve({ exitCode, signal });
        });
      });
      const stop = () => child.kill();
      spec.signal.addEventListener('abort', stop, { once: true });
      void done.finally(() => spec.signal.removeEventListener('abort', stop));
      return {
        stdin: mode === 'pipe' && !options.omitStdin ? child.stdin : undefined,
        stdout: child.stdout,
        done,
        collected: {
          stdout: { readFrom: () => ({ text: output, lossy: false }) },
          stderr: { readFrom: () => ({ text: errors, lossy: false }) },
        },
        terminate: async () => {
          if (children.has(child)) child.kill();
        },
        waitForExit: () => done,
      };
    },
  };
  const adapters = {};
  const cleanups = [];
  const warnings = [];
  const routes = new Map();
  const ctx = {
    logger: {
      warn(message) {
        warnings.push(String(message));
      },
    },
    llm: {
      registerAdapter(ids, adapter) {
        adapters[ids[0]] = adapter;
        return { replace() {} };
      },
    },
    get(name) {
      if (name === 'connection')
        return {
          fetch: {
            register(route) {
              routes.set(route.path, route);
              return () => routes.delete(route.path);
            },
          },
        };
      if (name === 'subprocess') return runtime;
      if (name === 'agents')
        return { get: (id) => ({ session: { id, header: {} } }) };
      return name === 'tools'
        ? (services[name] ?? defaultTools)
        : services[name];
    },
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
    { models: { claude: [{ id: 'claude-fixture' }] } },
    {
      claudeCredsIo: {
        platform: 'linux',
        readFileRaw() {
          return undefined;
        },
        readKeychainRaw() {
          throw new Error('Keychain forbidden');
        },
      },
    },
  );
  t.after(async () => {
    for (const cleanup of cleanups.reverse()) await cleanup();
    for (const child of children) child.kill();
    if (originalHome === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = originalHome;
    if (originalRecord === undefined) delete process.env.FAKE_CLAUDE_RECORD;
    else process.env.FAKE_CLAUDE_RECORD = originalRecord;
    await rm(root, { recursive: true, force: true });
  });
  const stream = (prompt, extra = {}) => {
    const messages = extra.messages ?? [{ role: 'user', content: prompt }];
    return adapters.claude.stream({
      provider: 'claude',
      model: 'claude-fixture',
      sessionId: 'fixture-session',
      ...extra,
      messages,
    });
  };
  const run = async (prompt, extra = {}) => {
    const chunks = [];
    for await (const chunk of stream(prompt, extra)) chunks.push(chunk);
    return chunks;
  };
  const records = async () => {
    try {
      return (await readFile(join(root, 'record.jsonl'), 'utf8'))
        .trim()
        .split('\n')
        .map(JSON.parse);
    } catch {
      return [];
    }
  };
  /** Call one of the component's RPC routes the way the browser half does; answers the route's `result`. */
  const call = async (endpoint, payload = {}) => {
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
  };
  const status = async () =>
    (await call('status', { provider: 'claude' })).value.providers;
  const notice = async (sessionId) =>
    (await call('cliGovernanceNotice', { provider: 'claude', sessionId }))
      .value;
  return {
    run,
    stream,
    records,
    children,
    root,
    directory: owned,
    warnings,
    call,
    status,
    notice,
  };
}

/** The visible text of a chunk list, in stream order. */
export const textOf = (chunks) =>
  chunks
    .filter((chunk) => chunk.type === 'text-delta')
    .map((chunk) => chunk.text)
    .join('');

/** A system context line the way DSH states the file policy, for the permission-mode mapping. */
export const policyMessage = (policy, extra = '') => ({
  role: 'user',
  content: `Current DSH file policy: ${policy}. Some platform temporary areas may also be writable.${extra}`,
});

export { assert };
