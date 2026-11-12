// the Claude Manage dialog offers the prompt cache lifetime (follow config / 5 minutes / 1 hour) in English and
// Arabic and sends only the chosen value. Real component under react-test-renderer with a fake RPC; no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mirrors the automatic JSX runtime: `jsxs` children are static, so only explicit keys matter.
function element(tag, props, key) {
  const { children, ...rest } = props;
  const list =
    children === undefined
      ? []
      : Array.isArray(children)
        ? children
        : [children];
  return React.createElement(
    tag,
    key === undefined ? rest : { ...rest, key },
    ...list,
  );
}
function load(path) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(
    js,
    {
      exports,
      require(id) {
        if (id === 'react') return React;
        if (id === 'react/jsx-runtime')
          return { Fragment: React.Fragment, jsx: element, jsxs: element };
        const child = resolve(dirname(path), id.replace(/\.js$/, '.ts'));
        return load(existsSync(child) ? child : child + 'x');
      },
      document: { activeElement: null },
      HTMLElement: class {},
      window: { dispatchEvent() {} },
      CustomEvent: class {},
      console,
      setInterval,
      clearInterval,
      Error,
    },
    { filename: path },
  );
  return exports;
}
const { createClaudeCard } = load(resolve('src/claude-card.ts'));

for (const locale of ['en', 'ar']) {
  test(`Claude access methods use the real renderer in ${locale}`, async () => {
    const t = translator(locale);
    const calls = [];
    const Card = createClaudeCard(
      React,
      {},
      {
        async call(_path, method, payload) {
          calls.push({ method, payload });
          return {
            ok: true,
            value: method.endsWith('.status')
              ? {
                  providers: {
                    claude: {
                      accounts: [],
                      busy: false,
                      capabilities: {
                        defaultAccessMethod: 'official-cli',
                        accessMethods: [
                          {
                            id: 'official-cli',
                            warning: {
                              level: 'info',
                              text: 'claudeOfficialCliWarning',
                              source: 'https://example.test/policy',
                              lastReviewed: '2026-11-11',
                            },
                          },
                          {
                            id: 'direct',
                            warning: {
                              level: 'danger',
                              text: 'claudeDirectWarning',
                              source: 'https://example.test/policy',
                              lastReviewed: '2026-11-11',
                            },
                          },
                        ],
                      },
                    },
                  },
                }
              : { available: false, installCommand: 'fixture-install' },
          };
        },
      },
      t,
    );
    let page;
    try {
      await act(async () => {
        page = Renderer.create(React.createElement(Card));
      });
      const selector = page.root.findByProps({
        'data-waycraft-access-method': true,
      });
      assert.equal(selector.props.value, 'official-cli');
      assert.ok(text(page.root).includes(t('claudeOfficialCliWarning')));
      await act(async () => button(page.root, t('login')).props.onClick());
      assert.equal(
        calls.find((call) => call.method.endsWith('.login')).payload.method,
        'official-cli',
      );
      assert.ok(text(page.root).includes('fixture-install'));
    } finally {
      if (page) await act(async () => page.unmount());
    }
  });
}

const { ProviderAccountManager } = load(
  resolve('src/settings/ProviderAccountManager.tsx'),
);
const translator = (locale) => {
  const dictionary = JSON.parse(
    readFileSync(`locale/${locale}.json`),
  ).subscriptions;
  return (key, params = {}) =>
    Object.entries(params).reduce(
      (s, [k, v]) => s.replace(`{${k}}`, v),
      dictionary[key] ?? key,
    );
};
const deferred = () => {
  let resolveFn, rejectFn;
  const promise = new Promise((a, b) => {
    resolveFn = a;
    rejectFn = b;
  });
  return { promise, resolve: resolveFn, reject: rejectFn };
};
const nodeMock = () => ({ showModal() {}, close() {} });
const text = (node) =>
  node.children
    .map((child) => (typeof child === 'string' ? child : text(child)))
    .join('');
const button = (root, label) =>
  root.findAllByType('button').find((node) => text(node) === label);
const alerts = (root) =>
  root
    .findAll(
      (node) => node.props.role === 'alert' && typeof node.type === 'string',
    )
    .map(text);
const statuses = (root) =>
  root
    .findAll(
      (node) => node.props.role === 'status' && typeof node.type === 'string',
    )
    .map(text);
const warnings = [];
const origError = console.error;
console.error = (...args) => {
  const line = args.map(String).join(' ');
  if (!line.includes('react-test-renderer is deprecated')) warnings.push(line);
};
process.on('exit', () => {
  console.error = origError;
});

function catalog(settings = {}, extra = {}) {
  return {
    provider: 'claude',
    settings,
    accounts: [
      {
        key: 'one',
        label: 'fixture@example.test',
        models: [{ id: 'claude-sonnet-5', name: 'Claude Sonnet 5' }],
      },
    ],
    models: [
      {
        id: 'claude-sonnet-5',
        name: 'Claude Sonnet 5',
        efforts: [
          { id: 'low', name: 'Low' },
          { id: 'high', name: 'High' },
        ],
      },
    ],
    tools: [],
    promptCacheTtlDefault: '5m',
    ...extra,
  };
}
async function mount(locale, provider, handlers) {
  const t = translator(locale),
    calls = [],
    closed = [];
  const rpc = {
    async call(_, method, payload) {
      const name = method.replace('waycraft-subscriptions.', '');
      calls.push({ name, payload });
      return handlers[name](payload);
    },
  };
  let page;
  await act(async () => {
    page = Renderer.create(
      React.createElement(ProviderAccountManager, {
        provider,
        name: provider === 'claude' ? 'Claude' : 'Codex',
        rpc,
        t,
        onClose: () => closed.push(true),
      }),
      { createNodeMock: nodeMock },
    );
  });
  const root = page.root;
  const ttl = () =>
    root
      .findAllByType('select')
      .find(
        (node) =>
          node.props.id !== undefined &&
          root
            .findAllByType('label')
            .some((label) => label.props.htmlFor === node.props.id),
      );
  const save = () => button(root, t('modelsSave'));
  return {
    page,
    root,
    t,
    calls,
    closed,
    ttl,
    save,
    called: (name) => calls.filter((call) => call.name === name),
  };
}
const ok = (value) => ({ ok: true, value });

for (const locale of ['en', 'ar']) {
  test(`Claude Manage offers follow-config, 5 minutes and 1 hour in ${locale}`, async () => {
    warnings.length = 0;
    const ui = await mount(locale, 'claude', {
      providerSettings: () => ok(catalog({}, { promptCacheTtlDefault: '1h' })),
      setProviderSettings: () => ok({}),
      setModelDefault: () => ok({}),
    });
    const options = ui.ttl().findAllByType('option');
    assert.deepEqual(
      options.map((option) => option.props.value),
      ['', '5m', '1h'],
    );
    assert.deepEqual(options.map(text), [
      ui.t('claudePromptCacheTtlDefault', { ttl: '1h' }),
      ui.t('claudePromptCacheTtl5m'),
      ui.t('claudePromptCacheTtl1h'),
    ]);
    assert.ok(
      text(options[0]).includes('1h'),
      'the follow-config option names what config resolves to',
    );
    assert.equal(ui.ttl().props.value, '', 'nothing stored: follow config');
    assert.ok(
      ui.root.findAll(
        (node) =>
          typeof node.type === 'string' &&
          text(node) === ui.t('claudePromptCacheTtl'),
      ).length > 0,
      'label rendered',
    );
    if (locale === 'ar')
      for (const key of [
        'claudePromptCacheTtl',
        'claudePromptCacheTtl5m',
        'claudePromptCacheTtl1h',
      ])
        assert.match(ui.t(key), /[\u0600-\u06ff]/, key);
    assert.deepEqual(warnings, []);
    await act(async () => ui.page.unmount());
  });
}

test('choosing a lifetime sends it in the settings; an untouched dialog keeps the stored value', async () => {
  const ui = await mount('en', 'claude', {
    providerSettings: () => ok(catalog({ promptCacheTtl: '5m' })),
    setProviderSettings: () => ok({}),
    setModelDefault: () => ok({}),
  });
  assert.equal(ui.ttl().props.value, '5m', 'the stored value is preselected');
  assert.equal(ui.save().props.disabled, true, 'nothing changed yet');
  await act(async () => ui.ttl().props.onChange({ target: { value: '1h' } }));
  assert.equal(ui.save().props.disabled, false);
  await act(async () => ui.save().props.onClick());
  const call = ui.called('setProviderSettings').at(-1).payload;
  assert.equal(call.provider, 'claude');
  assert.equal(call.settings.promptCacheTtl, '1h');
  assert.equal(call.original.promptCacheTtl, '5m');
  assert.equal(ui.closed.length, 1);
  await act(async () => ui.page.unmount());
});

test('returning to follow config omits the field so the server removes it', async () => {
  const ui = await mount('en', 'claude', {
    providerSettings: () => ok(catalog({ promptCacheTtl: '1h' })),
    setProviderSettings: () => ok({}),
    setModelDefault: () => ok({}),
  });
  await act(async () => ui.ttl().props.onChange({ target: { value: '' } }));
  await act(async () => ui.save().props.onClick());
  const call = ui.called('setProviderSettings').at(-1).payload;
  assert.equal('promptCacheTtl' in call.settings, false);
  assert.equal(
    call.original.promptCacheTtl,
    '1h',
    'the loaded value travels as `original` so the server applies only the difference',
  );
  await act(async () => ui.page.unmount());
});

test('the cache lifetime option is Claude only', async () => {
  const ui = await mount('en', 'codex', {
    providerSettings: () =>
      ok({
        ...catalog(),
        provider: 'codex',
        tools: ['image_generate', 'web_search'],
      }),
    setProviderSettings: () => ok({}),
    setModelDefault: () => ok({}),
  });
  assert.equal(
    ui.root
      .findAllByType('select')
      .some((node) =>
        node
          .findAllByType('option')
          .some((option) => option.props.value === '1h'),
      ),
    false,
  );
  await act(async () => ui.page.unmount());
});
