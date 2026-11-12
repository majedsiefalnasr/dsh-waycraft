import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { apply } from '../dist/subscriptions.js';

// Fake executable and private home only: no installed CLI, default config, credentials or provider.
test('registered Claude adapter streams once, resumes on its bound account, and aborts its child', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-cli-turn-'));
  const original = process.env.DSH_HOME;
  process.env.DSH_HOME = root;
  t.after(async () => { if (original === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = original; await rm(root, { recursive: true, force: true }); });
  const id = '11111111-1111-4111-8111-111111111111';
  const owned = join(root, 'plugins/waycraft/subscriptions/claude');
  await mkdir(owned, { recursive: true });
  const id2 = '33333333-3333-4333-8333-333333333333';
  await writeFile(join(owned, 'accounts.json'), JSON.stringify({ accounts: { [id]: { accessMethod: 'official-cli', email: 'fixture@example.test' }, [id2]: { accessMethod: 'official-cli', email: 'second@example.test' } } }));
  await writeFile(join(root, 'plugins/waycraft/subscriptions/provider-settings.json'), JSON.stringify({ providers: { claude: { accounts: { [`official-cli:${id2}`]: { independentEntry: true } } } }, toolHistory: [] }));
  const executable = join(root, 'fake-claude.mjs');
  await writeFile(executable, `import {appendFileSync} from 'node:fs';
const args=process.argv.slice(2); if(args.includes('--version')) { console.log('2.1.322'); } else if(args.includes('--help')) { console.log('Options:\\n  -p, --print\\n  --input-format <f>\\n  --output-format <f>\\n  --verbose\\n  --include-partial-messages\\n  --model <m>\\n  --session-id <id>\\n  --resume <id>\\n  --system-prompt <p>'); } else {
let input=''; for await(const chunk of process.stdin){ input+=chunk; if(input.includes('\\n')) break; }
appendFileSync(${JSON.stringify(join(root, 'record.jsonl'))},JSON.stringify({args,env:process.env,input})+'\\n');
if(args.includes('--resume') && input.includes('missing-session')) { console.log(JSON.stringify({type:'result',is_error:true,result:'No conversation found with session ID: fixture'})); process.exit(1); }
if(args.includes('--resume') && input.includes('stderr-missing')) { console.error('Error: session not found'); process.exit(1); }
if(args.includes('--resume') && input.includes('chatty-fail')) { console.log(JSON.stringify({type:'assistant',message:{content:[{type:'text',text:'No conversation found, the session is missing'}]}})); process.exit(1); }
if(input.includes('oversize')) { process.stdout.write('x'.repeat(1024*1024+1)); setInterval(()=>{},1000); } else {
const say=x=>console.log(JSON.stringify(x));
say({type:'stream_event',event:{type:'message_start'}});
say({type:'stream_event',event:{type:'content_block_delta',delta:{type:'thinking_delta',thinking:'Think'}}});
say({type:'stream_event',event:{type:'content_block_stop'}});
say({type:'stream_event',event:{type:'content_block_delta',delta:{type:'text_delta',text:'Hello'}}});
say({type:'assistant',message:{content:[{type:'text',text:'Hello'}]}});
if(input.includes('hold')) { setInterval(()=>{},1000); } else say({type:'result',session_id:'22222222-2222-4222-8222-222222222222',is_error:false});
}}`);
  const children = new Set();
  const runtime = {
    resolveExecutable: async () => executable,
    spawn(spec) {
      const env = { ...process.env, ANTHROPIC_API_KEY: 'fixture-key' };
      for (const [key, value] of Object.entries(spec.env)) { if (value === undefined) delete env[key]; else env[key] = value; }
      const child = spawn(process.execPath, [spec.argv[0], ...spec.argv.slice(1)], { cwd: spec.cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
      children.add(child);
      let output = ''; if (spec.stdio.stdout !== 'pipe') child.stdout.on('data', chunk => output += chunk);
      let errors = ''; child.stderr.on('data', chunk => errors += chunk);
      // Follows the real subprocess service: 'pipe' stays open for the caller, { data } is written and ended.
      const stdinMode = spec.stdio.stdin; if (stdinMode === 'ignore') child.stdin.end(); else if (typeof stdinMode === 'object') child.stdin.end(stdinMode.data);
      const done = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (exitCode, signal) => { children.delete(child); resolve({ exitCode, signal }); }); });
      const stop = () => child.kill(); spec.signal.addEventListener('abort', stop, { once: true });
      void done.finally(() => spec.signal.removeEventListener('abort', stop));
      return { stdin: stdinMode === 'pipe' ? child.stdin : undefined, stdout: child.stdout, done, collected: { stdout: { readFrom: () => ({ text: output, lossy: false }) }, stderr: { readFrom: () => ({ text: errors, lossy: false }) } }, terminate: async () => { if (children.has(child)) child.kill(); }, waitForExit: () => done };
    },
  };
  const adapters = {}, cleanups = [];
  const ctx = { logger: { warn() {} }, llm: { registerAdapter(ids, adapter) { adapters[ids[0]] = adapter; return { replace() {} }; } }, get(name) { return name === 'subprocess' ? runtime : undefined; }, effect(fn) { const cleanup = fn(); if (cleanup) cleanups.push(cleanup); }, inject() {} };
  apply(ctx, { models: { claude: [{ id: 'claude-fixture' }] } }, { claudeCredsIo: { platform: 'linux', readFileRaw() { return undefined; }, readKeychainRaw() { throw new Error('Keychain forbidden'); } } });
  t.after(async () => { for (const cleanup of cleanups.reverse()) await cleanup(); for (const child of children) child.kill(); });
  const base = { provider: 'claude', model: 'claude-fixture', sessionId: 'fixture-session', messages: [{ role: 'user', content: 'hi' }] };
  const chunks = []; for await (const chunk of adapters.claude.stream(base)) chunks.push(chunk);
  assert.equal(chunks.filter(c => c.type === 'text-delta').map(c => c.text).join(''), 'Hello');
  assert.equal(chunks.filter(c => c.type === 'reasoning-delta').map(c => c.text).join(''), 'Think');
  const finish = chunks.find(c => c.type === 'finish');
  const messages = [...base.messages, { role: 'assistant', content: 'Hello', source: { provider: 'claude', model: base.model, replayState: finish.replayState } }, { role: 'user', content: 'again' }];
  for await (const _ of adapters.claude.stream({ ...base, messages })) {}
  const records = (await readFile(join(root, 'record.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.ok(records[0].args.includes('--session-id'));
  assert.ok(records[1].args.includes('--resume'));
  assert.equal(records[1].args.at(-1), '22222222-2222-4222-8222-222222222222');
  assert.equal(JSON.parse(records[1].input).message.content, 'again');
  assert.equal(children.size, 0);
  for await (const _ of adapters.claude.stream({ ...base, messages: [...messages.slice(0, -1), { role: 'user', content: 'missing-session' }] })) {}
  const retried = (await readFile(join(root, 'record.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse).slice(-2);
  assert.ok(retried[0].args.includes('--resume'));
  assert.ok(retried[1].args.includes('--session-id'));
  assert.match(JSON.parse(retried[1].input).message.content, /\[assistant\]\nHello/);
  assert.equal(children.size, 0);
  // A rejection reported only on stderr also falls back to history; assistant text that merely mentions a missing session does not.
  const recordCount = async () => (await readFile(join(root, 'record.jsonl'), 'utf8')).trim().split('\n').length;
  let before = await recordCount();
  for await (const _ of adapters.claude.stream({ ...base, messages: [...messages.slice(0, -1), { role: 'user', content: 'stderr-missing' }] })) {}
  assert.equal(await recordCount(), before + 2);
  before = await recordCount();
  await assert.rejects(async () => { for await (const _ of adapters.claude.stream({ ...base, messages: [...messages.slice(0, -1), { role: 'user', content: 'chatty-fail' }] })) {} });
  assert.equal(await recordCount(), before + 1);
  assert.equal(children.size, 0);
  assert.equal(records[0].env.ANTHROPIC_API_KEY, undefined);
  assert.equal(records[0].env.CLAUDE_CONFIG_DIR, join(owned, 'accounts', id));
  assert.deepEqual(JSON.parse(records[0].input), { type: 'user', session_id: '', parent_tool_use_id: null, message: { role: 'user', content: 'hi' } });
  const controller = new AbortController();
  await assert.rejects(async () => { for await (const chunk of adapters.claude.stream({ ...base, signal: controller.signal, messages: [{ role: 'user', content: 'hold' }] })) if (chunk.type === 'text-delta') controller.abort(); });
  assert.equal(children.size, 0);
  await assert.rejects(async () => { for await (const _ of adapters.claude.stream({ ...base, messages: [{ role: 'user', content: 'oversize' }] })) {} }, (error) => /exceeds 1 MiB/.test(error.cause?.message ?? error.message));
  assert.equal(children.size, 0);
  const history = [{ role: 'user', content: 'earlier question' }, { role: 'assistant', content: 'earlier reply' }, { role: 'user', content: 'new question' }];
  for await (const _ of adapters.claude.stream({ ...base, messages: history })) {}
  const last = JSON.parse((await readFile(join(root, 'record.jsonl'), 'utf8')).trim().split('\n').at(-1));
  assert.match(JSON.parse(last.input).message.content, /earlier question/);
  assert.match(JSON.parse(last.input).message.content, /earlier reply/);
  // Switching to another account never resumes the first account's CLI session: fresh session with the full history.
  const switchModel = `~account:${encodeURIComponent(`official-cli:${id2}`)}:${encodeURIComponent('claude-fixture')}`;
  for await (const _ of adapters.claude.stream({ ...base, model: switchModel, messages })) {}
  const switched = JSON.parse((await readFile(join(root, 'record.jsonl'), 'utf8')).trim().split('\n').at(-1));
  assert.ok(switched.args.includes('--session-id'));
  assert.equal(switched.args.includes('--resume'), false);
  assert.ok(switched.env.CLAUDE_CONFIG_DIR.endsWith(id2));
  assert.match(JSON.parse(switched.input).message.content, /\[assistant\]\nHello/);
  assert.match(JSON.parse(switched.input).message.content, /again/);
  const held = Array.from({ length: 4 }, () => new AbortController());
  let ready = 0;
  let allReady;
  const started = new Promise((resolve) => { allReady = resolve; });
  const running = held.map((signal) => (async () => {
    try { for await (const chunk of adapters.claude.stream({ ...base, signal: signal.signal, messages: [{ role: 'user', content: 'hold' }] })) if (chunk.type === 'text-delta' && ++ready === 4) allReady(); } catch {}
  })());
  await started;
  const beforeQueue = (await readFile(join(root, 'record.jsonl'), 'utf8')).trim().split('\n').length;
  const queuedAbort = new AbortController();
  const queued = (async () => { for await (const _ of adapters.claude.stream({ ...base, signal: queuedAbort.signal })) {} })();
  queuedAbort.abort();
  await assert.rejects(queued);
  assert.equal((await readFile(join(root, 'record.jsonl'), 'utf8')).trim().split('\n').length, beforeQueue);
  for (const controller of held) controller.abort();
  await Promise.all(running);
  let disposing;
  await assert.rejects(async () => {
    for await (const chunk of adapters.claude.stream({ ...base, messages: [{ role: 'user', content: 'hold' }] })) {
      if (chunk.type === 'text-delta') {
        disposing = (async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); })();
      }
    }
  });
  await disposing;
  assert.equal(children.size, 0);
});
