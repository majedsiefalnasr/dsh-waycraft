import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ClaudeAdapter } from '../dist/providers/claude.js';

for (const mode of ['disposal', 'caller abort']) test(`${mode} cancels and drains an in-flight discovery probe`, async (t) => {
  const home = await mkdtemp(join(tmpdir(), 'waycraft-cli-probe-'));
  const prior = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  t.after(async () => { if (prior === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = prior; await rm(home, { recursive: true, force: true }); });
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  let terminated = 0, drained = 0;
  const runtime = { resolveExecutable: async () => '/fixture/claude', spawn(spec) {
    const done = new Promise((_resolve, reject) => spec.signal.addEventListener('abort', () => reject(spec.signal.reason), { once: true }));
    started();
    return { done, terminate: async () => { terminated++; }, waitForExit: async () => { drained++; } };
  } };
  const adapter = new ClaudeAdapter({ models: [], cliRuntime: () => runtime });
  const caller = new AbortController();
  const stream = (async () => { for await (const _ of adapter.streamAccount({ signal: caller.signal, model: 'fixture', messages: [{role:'user',content:'hi'}] }, 'official-cli:fixture')) {} })();
  const rejected = assert.rejects(stream);
  await ready;
  if (mode === 'disposal') await adapter.disposeCliTurns();
  else caller.abort();
  await rejected;
  await adapter.disposeCliTurns();
  assert.equal(terminated, 1);
  assert.equal(drained, 1);
});
