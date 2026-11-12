// #181: the session card that explains the extra-usage 400 renders in English and Arabic with a fake RPC only.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import ActualReact from 'react';
import { create, act } from 'react-test-renderer';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../src/extra-usage-notice.ts', import.meta.url),
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
    const i = timers.indexOf(fn);
    if (i >= 0) timers.splice(i, 1);
  },
  Error,
  JSON,
  Object,
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

async function mount(locale, answer, realCard) {
  const words = await dictionary(locale);
  const t = (key) => words[key] ?? `MISSING:${key}`;
  const calls = [];
  const rpc = {
    async call(channel, method, payload) {
      calls.push({ channel, method, payload });
      return answer(method, payload);
    },
  };
  const addAccountProps = [];
  const AddAccount = (props) => {
    addAccountProps.push(props);
    return ActualReact.createElement(
      'div',
      { 'data-add-account': true },
      'ADD',
    );
  };
  const Modal = ({ open, children, onClose }) =>
    open
      ? ActualReact.createElement('div', { role: 'dialog', onClose }, children)
      : null;
  const Notice = exports.createExtraUsageNotice(
    ActualReact,
    { Modal },
    realCard?.(rpc, t) ?? AddAccount,
  );
  let tree;
  await act(async () => {
    tree = create(
      ActualReact.createElement(Notice, { rpc, sessionId: 's1', t }),
    );
  });
  mounted.push(tree);
  return {
    tree,
    calls,
    addAccountProps,
    words,
    switchSession: (sessionId) =>
      tree.update(ActualReact.createElement(Notice, { rpc, sessionId, t })),
  };
}

for (const locale of ['en', 'ar']) {
  test(`${locale}: an active notice explains the refusal and its action opens the add-account flow on Official CLI`, async () => {
    const page = await mount(locale, async () => ({
      ok: true,
      value: { active: true, revision: 1 },
    }));
    assert.deepEqual(JSON.parse(JSON.stringify(page.calls[0])), {
      channel: '/api',
      method: 'waycraft-subscriptions.extraUsageNotice',
      payload: { provider: 'claude', sessionId: 's1' },
    });
    const root = page.tree.toJSON();
    const alert = find(root, (n) => n.props?.role === 'alert');
    assert.equal(alert.length, 1);
    const shown = text(root);
    assert.ok(shown.includes(page.words.extraUsageTitle));
    assert.ok(shown.includes(page.words.extraUsageExplanation));
    assert.equal(
      page.addAccountProps.length,
      0,
      'the flow opens only on request',
    );
    const [action] = find(
      page.tree.root,
      (n) => n.props?.['data-waycraft-extra-usage-action'] !== undefined,
    );
    await act(async () => action.props.onClick());
    assert.equal(
      page.addAccountProps.at(-1).initialAccessMethod,
      'official-cli',
    );
    assert.equal(page.addAccountProps.at(-1).presentation, 'auth');
  });
}

test('both locales carry the same extra-usage keys with real text', async () => {
  const en = await dictionary('en');
  const ar = await dictionary('ar');
  for (const key of [
    'extraUsageTitle',
    'extraUsageExplanation',
    'extraUsageAction',
    'extraUsageDismiss',
  ]) {
    assert.ok(en[key]?.length > 0, `en ${key}`);
    assert.ok(ar[key]?.length > 0, `ar ${key}`);
    assert.notEqual(en[key], ar[key], `${key} is translated`);
  }
});

test('an inactive notice renders nothing', async () => {
  const page = await mount('en', async () => ({
    ok: true,
    value: { active: false },
  }));
  assert.equal(page.tree.toJSON(), null);
});

test('an RPC failure renders nothing instead of breaking the composer', async () => {
  const page = await mount('en', async () => {
    throw new Error('transport');
  });
  assert.equal(page.tree.toJSON(), null);
});

test('dismissing hides the card', async () => {
  let active = true;
  const page = await mount('en', async () => ({
    ok: true,
    value: { active, revision: 1 },
  }));
  const [dismiss] = find(
    page.tree.root,
    (n) => n.props?.['data-waycraft-extra-usage-dismiss'] !== undefined,
  );
  await act(async () => dismiss.props.onClick());
  assert.equal(page.tree.toJSON(), null);
});

const tick = async () => {
  await act(async () => {
    const fn = timers.shift();
    assert.ok(fn);
    fn();
  });
};
const button = (page, key) => page.tree.root.findByProps({ [key]: true });
test('dismissal is scoped to the refusal revision and polling is serialized', async () => {
  let revision = 1;
  const page = await mount('en', async () => ({
    ok: true,
    value: { active: true, revision },
  }));
  await act(async () =>
    button(page, 'data-waycraft-extra-usage-dismiss').props.onClick(),
  );
  await tick();
  assert.equal(page.tree.toJSON(), null);
  revision++;
  await tick();
  assert.ok(page.tree.toJSON());
  await act(async () => page.switchSession('s2'));
  assert.ok(page.tree.toJSON(), 'session dismissal does not leak');
  const count = page.calls.length;
  assert.equal(
    timers.length,
    1,
    'only the next completed-read poll is scheduled',
  );
  assert.ok(count >= 3);
});
test('a slow lookup schedules no overlapping poll and drops stale session answers', async () => {
  let resolve;
  const page = await mount('en', (method, payload) =>
    payload.sessionId === 's1'
      ? new Promise((done) => {
          resolve = done;
        })
      : { ok: true, value: { active: false } },
  );
  assert.equal(timers.length, 0);
  await act(async () => page.switchSession('s2'));
  await act(async () =>
    resolve({ ok: true, value: { active: true, revision: 8 } }),
  );
  assert.equal(page.tree.toJSON(), null);
  assert.equal(timers.length, 1);
});

test('an open flow survives inactive polling and refuses close while pending', async () => {
  let active = true;
  const page = await mount('en', async () => ({
    ok: true,
    value: { active, revision: 1 },
  }));
  await act(async () =>
    button(page, 'data-waycraft-extra-usage-action').props.onClick(),
  );
  let cancels = 0;
  page.addAccountProps.at(-1).onFlowState({
    busy: true,
    cancel: async () => {
      cancels++;
      return false;
    },
  });
  active = false;
  await tick();
  await act(async () =>
    page.tree.root.findByProps({ role: 'dialog' }).props.onClose(),
  );
  assert.equal(cancels, 1);
  assert.equal(page.tree.root.findAllByProps({ role: 'dialog' }).length, 1);
  page.addAccountProps.at(-1).onFlowState({
    busy: true,
    cancel: async () => {
      cancels++;
      return true;
    },
  });
  await act(async () =>
    page.tree.root.findByProps({ role: 'dialog' }).props.onClose(),
  );
  assert.equal(cancels, 2);
  assert.equal(page.tree.toJSON(), null);
});

test('real ClaudeCard Official CLI login is cancelled before dialog unmount', async () => {
  const presentation = {};
  const card = {};
  const compile = async (name, target, require) => {
    const input = await readFile(
      new URL(`../src/${name}.ts`, import.meta.url),
      'utf8',
    );
    vm.runInNewContext(
      ts.transpileModule(input, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
      {
        exports: target,
        require,
        setInterval: () => 1,
        clearInterval() {},
        Error,
        Date,
        JSON,
        Object,
      },
    );
  };
  await compile('codex-card', presentation, () => ({}));
  await compile('claude-card', card, () => ({
    ...presentation,
    ProviderAccountManager: 'manage-fixture',
  }));
  let finishLogin;
  const page = await mount(
    'en',
    async (method) => {
      const endpoint = method.split('.').at(-1);
      if (endpoint === 'extraUsageNotice')
        return { ok: true, value: { active: true, revision: 1 } };
      if (endpoint === 'status')
        return {
          ok: true,
          value: {
            providers: {
              claude: {
                accounts: [],
                busy: false,
                capabilities: {
                  defaultAccessMethod: 'official-cli',
                  accessMethods: [
                    {
                      id: 'official-cli',
                      label: 'Official CLI',
                      warning: {
                        level: 'info',
                        text: 'CLI warning',
                        source: 'https://example.test',
                      },
                    },
                  ],
                },
              },
            },
          },
        };
      if (endpoint === 'login')
        return new Promise((resolve) => {
          finishLogin = () => {
            resolve({
              ok: true,
              value: { loginId: 'fake-login', state: 'running' },
            });
          };
        });
      if (endpoint === 'cancel')
        assert.fail('CLI flow must not use OAuth cancellation');
      if (endpoint === 'cliCancel')
        assert.equal(
          page.tree.root.findAllByProps({ role: 'dialog' }).length,
          1,
          'terminal cancellation precedes unmount',
        );
      return { ok: true, value: {} };
    },
    (rpc, t) => card.createClaudeCard(ActualReact, {}, rpc, t),
  );
  await act(async () =>
    button(page, 'data-waycraft-extra-usage-action').props.onClick(),
  );
  const login = page.tree.root
    .findAllByType('button')
    .find((node) => text(node) === page.words.login);
  assert.ok(login, 'real CLI sign-in action is rendered');
  await act(async () => login.props.onClick());
  await act(async () =>
    page.tree.root.findByProps({ role: 'dialog' }).props.onClose(),
  );
  assert.equal(
    page.tree.root.findAllByProps({ role: 'dialog' }).length,
    1,
    'pending login stays mounted',
  );
  await act(async () => finishLogin());
  await act(async () =>
    page.tree.root.findByProps({ role: 'dialog' }).props.onClose(),
  );
  const cancellations = page.calls.filter(({ method }) =>
    method.endsWith('.cliCancel'),
  );
  assert.equal(cancellations.length, 1);
  assert.equal(cancellations[0].payload.loginId, 'fake-login');
  assert.equal(cancellations[0].payload.provider, 'claude');
  assert.equal(page.tree.root.findAllByProps({ role: 'dialog' }).length, 0);
});
