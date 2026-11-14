// #186: the session card that tells the Owner, once, that the MCP manager's configuration cannot be read. Fake RPC only.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import ActualReact from 'react';
import { create, act } from 'react-test-renderer';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../src/cli-governance-notice.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const timers = [];
const exports = {};
vm.runInNewContext(compiled, {
  exports,
  setTimeout: (fn) => {
    timers.push(fn);
    return fn;
  },
  clearTimeout: (fn) => {
    const at = timers.indexOf(fn);
    if (at >= 0) timers.splice(at, 1);
  },
  Error,
});
const dictionary = async (locale) =>
  JSON.parse(
    await readFile(
      new URL(`../locale/${locale}.json`, import.meta.url),
      'utf8',
    ),
  ).subscriptions;
const text = (node) =>
  typeof node === 'string' ? node : (node?.children ?? []).map(text).join(' ');
const find = (node, predicate, found = []) => {
  if (typeof node === 'string') return found;
  if (predicate(node)) found.push(node);
  for (const child of node.children ?? []) find(child, predicate, found);
  return found;
};

const mounted = [];
afterEach(() => {
  act(() => {
    for (const tree of mounted.splice(0)) tree.unmount();
  });
  timers.length = 0;
});

async function mount(locale, answer) {
  const words = await dictionary(locale);
  const t = (key) => words[key] ?? `MISSING:${key}`;
  const calls = [];
  const rpc = {
    async call(channel, method, payload) {
      calls.push({ channel, method, payload });
      return answer(method, payload);
    },
  };
  const Notice = exports.createCliGovernanceNotice(ActualReact, {});
  let tree;
  await act(async () => {
    tree = create(
      ActualReact.createElement(Notice, { rpc, sessionId: 's1', t }),
    );
  });
  mounted.push(tree);
  return { tree, calls, words };
}

for (const locale of ['en', 'ar']) {
  test(`${locale}: an active notice says the MCP manager's servers are unavailable in this session, and can be dismissed`, async () => {
    const page = await mount(locale, async () => ({
      ok: true,
      value: { active: true, kind: 'manager-config-unreadable', revision: 1 },
    }));
    assert.deepEqual(JSON.parse(JSON.stringify(page.calls[0])), {
      channel: '/api',
      method: 'waycraft-subscriptions.cliGovernanceNotice',
      payload: { provider: 'claude', sessionId: 's1' },
    });
    const shown = text(page.tree.toJSON());
    assert.ok(page.words.cliGovernanceNoticeTitle);
    assert.ok(shown.includes(page.words.cliGovernanceNoticeTitle));
    assert.ok(shown.includes(page.words.cliGovernanceNoticeBody));
    const [dismiss] = find(
      page.tree.root,
      (node) =>
        node.props?.['data-waycraft-cli-governance-dismiss'] !== undefined,
    );
    await act(async () => dismiss.props.onClick());
    assert.equal(
      text(page.tree.toJSON()),
      '',
      'nothing is shown once dismissed',
    );
  });

  test(`${locale}: no notice is shown while the session has none`, async () => {
    const page = await mount(locale, async () => ({
      ok: true,
      value: { active: false },
    }));
    assert.equal(page.tree.toJSON(), null);
  });
}

test('a dismissed notice stays dismissed on later polls and returns only as a new revision', async () => {
  let revision = 1;
  const page = await mount('en', async () => ({
    ok: true,
    value: { active: true, kind: 'manager-config-unreadable', revision },
  }));
  const [dismiss] = find(
    page.tree.root,
    (node) =>
      node.props?.['data-waycraft-cli-governance-dismiss'] !== undefined,
  );
  await act(async () => dismiss.props.onClick());
  await act(async () => {
    for (const poll of timers.splice(0)) await poll();
  });
  assert.equal(
    page.tree.toJSON(),
    null,
    'the same revision does not come back',
  );
  revision = 2;
  await act(async () => {
    for (const poll of timers.splice(0)) await poll();
  });
  assert.ok(
    text(page.tree.toJSON()).includes(page.words.cliGovernanceNoticeTitle),
  );
});
