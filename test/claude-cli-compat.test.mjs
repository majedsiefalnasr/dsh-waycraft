import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { apply } from '../dist/subscriptions.js';

// Ticket #183: CLI version floor and flag compatibility, driven through the registered Claude adapter and the
// assembled RPC routes with fake executables only (no installed CLI, default config, credentials or provider).

const ALL_FLAGS = [
  '--print',
  '--input-format',
  '--output-format',
  '--verbose',
  '--include-partial-messages',
  '--model',
  '--session-id',
  '--resume',
  '--system-prompt',
];
const id = '11111111-1111-4111-8111-111111111111';

/**
 * Start the real component against a fake `claude`.
 * @param options.version - what `--version` prints.
 * @param options.help - flags `--help` advertises; `null` prints no flag list at all.
 * @param options.refuse - flags the executable rejects at run time as unknown options.
 */
async function start(t, { version = '2.1.322', help = ALL_FLAGS, refuse = [], refuseAlways = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-cli-compat-'));
  const original = process.env.DSH_HOME;
  process.env.DSH_HOME = root;
  t.after(async () => {
    if (original === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = original;
    await rm(root, { recursive: true, force: true });
  });
  const owned = join(root, 'plugins/waycraft/subscriptions/claude');
  await mkdir(owned, { recursive: true });
  await writeFile(
    join(owned, 'accounts.json'),
    JSON.stringify({ accounts: { [id]: { accessMethod: 'official-cli', email: 'fixture@example.test' } } }),
  );
  const record = join(root, 'record.jsonl');
  const executable = join(root, 'fake-claude.mjs');
  const helpText =
    help === null
      ? 'Claude Code\n'
      : `Usage: claude [options]\n\nOptions:\n${help.map((flag) => (flag === '--print' ? '  -p, --print  Print' : `  ${flag} <value>  Option`)).join('\n')}\n`;
  await writeFile(
    executable,
    `import {appendFileSync} from 'node:fs';
const args=process.argv.slice(2);
const log=x=>appendFileSync(${JSON.stringify(record)},JSON.stringify(x)+'\\n');
if(args.includes('--version')) { console.log(${JSON.stringify(version)}); }
else if(args.includes('--help')) { log({kind:'help'}); process.stdout.write(${JSON.stringify(helpText)}); }
else {
let input=''; for await(const chunk of process.stdin){ input+=chunk; if(input.includes('\\n')) break; }
log({kind:'turn',args,input});
const refused=${JSON.stringify(refuse)}.filter(flag=>args.includes(flag));
if(refused.length) { console.error("error: unknown option '"+refused[0]+"'"); process.exit(1); }
if(${JSON.stringify(refuseAlways)}) { console.error("error: unknown option '--include-partial-messages'"); process.exit(1); }
const say=x=>console.log(JSON.stringify(x));
if(args.includes('--include-partial-messages')) {
say({type:'stream_event',event:{type:'message_start'}});
say({type:'stream_event',event:{type:'content_block_delta',delta:{type:'text_delta',text:'Hello'}}});
say({type:'stream_event',event:{type:'content_block_stop'}});
}
say({type:'assistant',message:{content:[{type:'text',text:'Hello'}]}});
say({type:'result',session_id:'22222222-2222-4222-8222-222222222222',is_error:false});
}`,
  );
  const children = new Set();
  const runtime = {
    resolveExecutable: async () => executable,
    spawn(spec) {
      const env = { ...process.env, ANTHROPIC_API_KEY: 'fixture-key' };
      for (const [key, value] of Object.entries(spec.env)) {
        if (value === undefined) delete env[key];
        else env[key] = value;
      }
      const child = spawn(process.execPath, [spec.argv[0], ...spec.argv.slice(1)], { cwd: spec.cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
      children.add(child);
      let output = '';
      if (spec.stdio.stdout !== 'pipe') child.stdout.on('data', (chunk) => (output += chunk));
      let errors = '';
      child.stderr.on('data', (chunk) => (errors += chunk));
      // Follows the real subprocess service: 'pipe' stays open for the caller, { data } is written and ended.
      const stdinMode = spec.stdio.stdin; if (stdinMode === 'ignore') child.stdin.end(); else if (typeof stdinMode === 'object') child.stdin.end(stdinMode.data);
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
        stdin: stdinMode === 'pipe' ? child.stdin : undefined,
        stdout: child.stdout,
        done,
        collected: { stdout: { readFrom: () => ({ text: output, lossy: false }) }, stderr: { readFrom: () => ({ text: errors, lossy: false }) } },
        terminate: async () => {
          if (children.has(child)) child.kill();
        },
        waitForExit: () => done,
      };
    },
  };
  const adapters = {};
  const cleanups = [];
  const ctx = {
    logger: { warn() {} },
    llm: { registerAdapter(ids, adapter) { adapters[ids[0]] = adapter; return { replace() {} }; } },
    get(name) { return name === 'subprocess' ? runtime : undefined; },
    effect(fn) { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); },
    inject() {},
  };
  apply(ctx, { models: { claude: [{ id: 'claude-fixture' }] } }, { claudeCredsIo: { platform: 'linux', readFileRaw() { return undefined; }, readKeychainRaw() { throw new Error('Keychain forbidden'); } } });
  t.after(async () => {
    for (const cleanup of cleanups.reverse()) await cleanup();
    for (const child of children) child.kill();
  });
  const records = async () => {
    try {
      return (await readFile(record, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
    } catch {
      return [];
    }
  };
  const base = { provider: 'claude', model: 'claude-fixture', sessionId: 'fixture-session', messages: [{ role: 'user', content: 'hi' }] };
  const run = async (extra = {}) => {
    const chunks = [];
    for await (const chunk of adapters.claude.stream({ ...base, ...extra })) chunks.push(chunk);
    return chunks;
  };
  const text = (chunks) => chunks.filter((c) => c.type === 'text-delta').map((c) => c.text).join('');
  const turns = async () => (await records()).filter((r) => r.kind === 'turn');
  return { run, text, records, turns, children };
}

const reason = (error) => `${error.message} ${error.cause?.message ?? ''}`;

test('a CLI older than the provider minimum names the update command and no run starts', async (t) => {
  const cli = await start(t, { version: '1.9.4' });
  await assert.rejects(cli.run(), (error) => {
    const message = reason(error);
    assert.match(message, /1\.9\.4/);
    assert.match(message, /2\.0\.0/);
    assert.match(message, /claude update/);
    return true;
  });
  assert.deepEqual(await cli.turns(), []);
  assert.equal(cli.children.size, 0);
});

test('a run on a CLI without an optional flag completes without that flag', async (t) => {
  const cli = await start(t, { help: ALL_FLAGS.filter((flag) => flag !== '--include-partial-messages') });
  assert.equal(cli.text(await cli.run()), 'Hello');
  const [turn] = await cli.turns();
  assert.equal(turn.args.includes('--include-partial-messages'), false);
  for (const flag of ['--input-format', '--output-format', '--verbose', '--model', '--session-id'])
    assert.ok(turn.args.includes(flag), `${flag} stays`);
  assert.equal(cli.children.size, 0);
});

test('a run on a CLI without a required flag fails naming what is missing and starts nothing', async (t) => {
  const cli = await start(t, { help: ALL_FLAGS.filter((flag) => flag !== '--session-id') });
  await assert.rejects(cli.run(), (error) => {
    assert.match(reason(error), /--session-id/);
    assert.match(reason(error), /claude update/);
    return true;
  });
  assert.deepEqual(await cli.turns(), []);
});

test('a missing required flag is named when a system prompt needs --system-prompt', async (t) => {
  const cli = await start(t, { help: ALL_FLAGS.filter((flag) => flag !== '--system-prompt') });
  await assert.rejects(cli.run({ system: 'Be brief' }), (error) => /--system-prompt/.test(reason(error)));
  assert.deepEqual(await cli.turns(), []);
  // Without a system prompt that flag is never needed.
  assert.equal(cli.text(await cli.run()), 'Hello');
});

test('an unreadable help page never blocks a run', async (t) => {
  const cli = await start(t, { help: null });
  assert.equal(cli.text(await cli.run()), 'Hello');
});

test('the flag probe runs once per installed version, not once per turn', async (t) => {
  const cli = await start(t);
  await cli.run();
  await cli.run();
  assert.equal((await cli.records()).filter((r) => r.kind === 'help').length, 1);
});

test('an optional flag refused at run time is dropped once, retried once and never offered again', async (t) => {
  const cli = await start(t, { refuse: ['--include-partial-messages'] });
  assert.equal(cli.text(await cli.run()), 'Hello');
  let turns = await cli.turns();
  assert.equal(turns.length, 2);
  assert.ok(turns[0].args.includes('--include-partial-messages'));
  assert.equal(turns[1].args.includes('--include-partial-messages'), false);
  // The next turn does not try the refused flag again.
  await cli.run();
  turns = await cli.turns();
  assert.equal(turns.length, 3);
  assert.equal(turns[2].args.includes('--include-partial-messages'), false);
  assert.equal(cli.children.size, 0);
});

test('a refusal that keeps coming back fails after one retry instead of looping', async (t) => {
  const cli = await start(t, { refuseAlways: true });
  await assert.rejects(cli.run());
  assert.equal((await cli.turns()).length, 2);
  assert.equal(cli.children.size, 0);
});

test('a required flag refused at run time is reported by name with a single attempt', async (t) => {
  const cli = await start(t, { refuse: ['--verbose'] });
  await assert.rejects(cli.run(), (error) => /--verbose/.test(reason(error)));
  assert.equal((await cli.turns()).length, 1);
  assert.equal(cli.children.size, 0);
});

test('turns that arrive together share one flag probe', async (t) => {
  const cli = await start(t);
  await Promise.all([cli.run(), cli.run(), cli.run()]);
  assert.equal((await cli.records()).filter((r) => r.kind === 'help').length, 1);
});
