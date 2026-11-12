import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ActualReact from 'react';
import { Context, Service } from '@deepseek-ai/cordis';
import * as jsxRuntime from 'react/jsx-runtime';
import { create, act } from 'react-test-renderer';
import { readFile } from 'node:fs/promises';
const code = await readFile(
  new URL('../dist/subscriptions-client.js', import.meta.url),
  'utf8',
);
function browser(locale = 'en', initialAnswer, options = {}) {
  let api,
    timer,
    reconnect,
    dictionary,
    registrations = 0;
  const timers = new Set();
  // Live registrations keyed by slot entry id (the Settings section plus the #131 composer surfaces).
  const live = new Map();
  let referenceAnswer = () =>
    Promise.reject(
      new Error(
        'transport failure for /api/subscriptions-auth.proxyGet: HTTP 404',
      ),
    );
  let answer =
    initialAnswer ??
    (() =>
      Promise.resolve({ ok: true, value: { component: 'subscriptions' } }));
  const cleanups = [];
  const commandService = options.commandService;
  const React = options.React ?? {
    Component: class {},
    forwardRef: (fn) => fn,
    createElement: (tag, props, ...children) => ({ tag, props, children }),
    useSyncExternalStore: (_, read) => read(),
  };
  vm.runInNewContext(code + '\nresult(waycraftSubscriptionsFactory);', {
    result: (factory) => {
      api = factory((id) =>
        id === 'react'
          ? React
          : id === 'react/jsx-runtime'
            ? jsxRuntime
            : {
                IconSettingsOutlineMedium: 'svg',
                SegmentedControl: ({ options, value, onChange, disabled }) =>
                  React.createElement(
                    'div',
                    { role: 'tablist' },
                    ...options.map((option) =>
                      React.createElement(
                        'button',
                        {
                          role: 'tab',
                          disabled: disabled || option.disabled,
                          'aria-selected': option.value === value,
                          onClick: () => onChange(option.value),
                        },
                        option.label,
                      ),
                    ),
                  ),
              },
      );
    },
    window: {
      open() {},
      localStorage: { getItem: () => null },
      addEventListener() {},
      removeEventListener() {},
    },
    setInterval: (fn) => {
      timer = fn;
      timers.add(fn);
      return fn;
    },
    clearInterval: (fn) => timers.delete(fn),
    Error,
  });
  let referenceCalls = 0;
  let statusCalls = 0;
  const connection = {
    rpc: {
      call: (...args) =>
        args[1] === 'subscriptions-auth.proxyGet'
          ? (referenceCalls++, referenceAnswer(...args))
          : (statusCalls++, answer(...args)),
    },
    state: {
      subscribe: (fn) => {
        reconnect = fn;
        return () => {};
      },
      getSnapshot: () => 'connected',
    },
  };
  const ctx = {
    effect: (fn) => cleanups.push(fn()),
    locale: {
      register: (_, dictionaries) => {
        dictionary = dictionaries[locale];
        return () => {};
      },
      bind: () => (key) => dictionary[key],
    },
    slots: {
      inject: (slotName, fn) => {
        if (options.failSlot === slotName)
          throw new Error(`${slotName} failed`);
        let off;
        const run = () => {
          off = fn();
        };
        run();
        return () => {
          off?.();
        };
      },
      register: (options, component) => {
        assert.equal(
          live.has(options.id),
          false,
          `no duplicate registration of ${options.id}`,
        );
        if (options.id === 'waycraft-subscriptions') registrations++;
        live.set(options.id, { options, component });
        return () => {
          live.delete(options.id);
        };
      },
    },
    get: (name) => (name === 'modelDirectories' ? models : connection),
  };
  const models = {
    directoryFor: () => ({
      load: async () => ({
        current: { provider: 'codex', model: 'fast-model' },
      }),
    }),
  };
  ctx.get = (name) => (name === 'modelDirectories' ? models : connection);
  ctx.inject = (names, fn) => {
    if (names.includes('remote.settings')) {
      if (options.remoteContext)
        return options.remoteContext.inject(Array.from(names), fn);
      if (!options.remote) return;
      // Even the lightweight fixture must not grant undeclared root access.
      return fn({
        get remote() {
          assert.ok(names.includes('remote'), 'remote root must be injected');
          return options.remote;
        },
      });
    }
    if (names.includes('commandUi')) {
      if (!commandService) return;
      const scope = {
        get: () => commandService,
        effect: (run) => cleanups.push(run()),
      };
      return fn(scope);
    }
    return fn(ctx);
  };
  api.applySubscriptions(ctx);
  return {
    setReferenceAnswer(fn) {
      referenceAnswer = fn;
    },
    get registrations() {
      return registrations;
    },
    setAnswer(fn) {
      answer = fn;
    },
    tickAuth: () => {
      for (const fn of [...timers]) fn();
    },
    tick: () => timer(),
    /** `count` heartbeats of the 3 second interval (10 heartbeats are 30 s), letting each answer land first. */
    async ticks(count) {
      for (let beat = 0; beat < count; beat++) {
        timer();
        await new Promise((done) => setImmediate(done));
      }
    },
    get referenceCalls() {
      return referenceCalls;
    },
    get statusCalls() {
      return statusCalls;
    },
    get timerCount() {
      return timers.size;
    },
    reconnect: () => reconnect(),
    async settle() {
      await Promise.resolve();
      await Promise.resolve();
    },
    get section() {
      return live.get('waycraft-subscriptions');
    },
    live,
    get surfaces() {
      return [...live.keys()]
        .filter((id) => id !== 'waycraft-subscriptions')
        .sort();
    },
    cleanup() {
      cleanups.reverse().forEach((fn) => fn?.());
    },
  };
}
test('actual public and alias video outlets recover after reference withdrawal and component remount', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const page = browser('en', undefined, { React: ActualReact });
  await page.settle();
  try {
    for (const key of ['video_generate', 'dsh_waycraft_video_generate']) {
      const entry = page.live.get(`waycraft-toolview-${key}`);
      assert.equal(entry.options.key, key);
      let renderer;
      await act(async () => {
        renderer = create(
          ActualReact.createElement(entry.component, {
            t: (key) => key,
            block: {
              kind: 'result',
              call: { argsRaw: '{}' },
              content: [
                {
                  type: 'text',
                  text: 'Saved video to /fixture/video-outlet.mp4',
                },
              ],
            },
            loadVideo: async (name) => {
              assert.equal(name, 'video-outlet.mp4');
              throw new Error('fixture storage unavailable');
            },
          }),
        );
      });
      assert.match(JSON.stringify(renderer.toJSON()), /videoLoadFailed/);
      await act(async () => renderer.unmount());
    }
    for (const key of ['image_generate', 'dsh_waycraft_image_generate']) {
      const entry = page.live.get(`waycraft-toolview-${key}`);
      assert.equal(entry.options.key, key);
      let renderer;
      await act(async () => {
        renderer = create(
          ActualReact.createElement(entry.component, {
            t: (key) => key,
            block: {
              kind: 'result',
              call: { argsRaw: '{}' },
              content: [
                {
                  type: 'image',
                  attachment: {
                    attachmentId: 'fixture',
                    width: 20,
                    height: 20,
                  },
                },
              ],
              isError: false,
            },
            load: async () => {
              throw new Error('fixture unavailable');
            },
          }),
        );
      });
      assert.match(JSON.stringify(renderer.toJSON()), /imageLoadFailed/);
      await act(async () => renderer.unmount());
    }
    page.setReferenceAnswer(() => Promise.resolve({ ok: true }));
    page.reconnect();
    await page.settle();
    assert.ok(!page.surfaces.some((id) => id.includes('toolview')));
    page.setReferenceAnswer(() =>
      Promise.reject(
        new Error(
          'transport failure for /api/subscriptions-auth.proxyGet: HTTP 404',
        ),
      ),
    );
    page.reconnect();
    await page.settle();
    assert.ok(page.live.has('waycraft-toolview-dsh_waycraft_video_generate'));
    page.setAnswer(() =>
      Promise.reject(
        new Error(
          'transport failure for /api/waycraft-subscriptions.status: HTTP 404',
        ),
      ),
    );
    page.reconnect();
    await page.settle();
    assert.ok(!page.live.has('waycraft-toolview-video_generate'));
    page.setAnswer(() =>
      Promise.resolve({ ok: true, value: { component: 'subscriptions' } }),
    );
    page.reconnect();
    await page.settle();
    assert.ok(page.live.has('waycraft-toolview-video_generate'));
  } finally {
    page.cleanup();
  }
});
function text(node) {
  return typeof node === 'string'
    ? node
    : (node?.children?.flat(Infinity).map(text).join(' ') ?? '');
}
test('present component registers accounts and native-remotes availability, then withdraws on absence', async () => {
  const page = browser();
  await page.settle();
  assert.equal(page.section.options.id, 'waycraft-subscriptions');
  assert.equal(page.section.options.label(), 'AI Providers');
  assert.equal(
    page.section
      .component()
      .children.flat()
      .some((node) => node?.props?.className === 'waycraft-providers-identity'),
    true,
  );
  assert.match(
    text(page.section.component()),
    /Manage subscription accounts and usage/,
  );
  page.setAnswer(() =>
    Promise.reject(
      new Error(
        'transport failure for /api/waycraft-subscriptions.status: HTTP 404',
      ),
    ),
  );
  page.tick();
  await page.settle();
  assert.equal(page.section, undefined);
  page.cleanup();
});
for (const locale of ['en', 'ar'])
  test(
    'redesign keeps collapsed groups scannable and reveals login guidance only in Add: ' +
      locale,
    async () => {
      globalThis.IS_REACT_ACT_ENVIRONMENT = true;
      const dict = JSON.parse(
        await readFile(
          new URL('../locale/' + locale + '.json', import.meta.url),
          'utf8',
        ),
      ).subscriptions;
      const providers = Object.fromEntries(
        ['codex', 'claude'].map((id) => [
          id,
          {
            accounts: [
              { key: id + '-fixture', account: 'Long fixture identity' },
            ],
          },
        ]),
      );
      const page = browser(
        locale,
        (_channel, method) =>
          Promise.resolve({
            ok: true,
            value:
              method === 'waycraft-subscriptions.status'
                ? { component: 'subscriptions', providers }
                : {},
          }),
        { React: ActualReact },
      );
      await page.settle();
      let renderer;
      try {
        await act(async () => {
          renderer = create(ActualReact.createElement(page.section.component));
        });
        const group = (id) =>
          renderer.root.find(
            (n) =>
              n.type === 'li' &&
              n.props['data-waycraft-subscription-row'] === id,
          );
        for (const [id, hint] of [
          ['codex', 'addAccountHint'],
          ['claude', 'claudeAddAccountHint'],
        ]) {
          assert.ok(
            !group(id)
              .findAllByType('p')
              .some((n) => n.children.includes(dict[hint])),
            'login instructions do not crowd collapsed inventory',
          );
        }
        assert.equal(
          renderer.root
            .findAll(
              (n) =>
                n.type === 'li' && n.props['data-waycraft-subscription-row'],
            )
            .flatMap((n) => n.findAllByType('button'))
            .filter((n) => n.children.includes(dict.addAccount)).length,
          0,
          'cards do not duplicate Add',
        );
        const add = renderer.root.find(
          (n) =>
            n.type === 'button' &&
            n.props.className === 'waycraft-subscription-add-trigger',
        );
        await act(async () => add.props.onClick());
        const auth = renderer.root
          .findAll((n) => n.props['data-waycraft-codex-card'] === true)
          .at(-1);
        assert.ok(
          auth
            .findAllByType('p')
            .some((n) => n.children.includes(dict.addAccountHint)),
          'guidance remains available in the selected login flow',
        );
        assert.equal(
          auth.findAll((n) => n.props['data-waycraft-codex-part'] === 'header')
            .length,
          0,
          'selected provider summary is not repeated under its selector',
        );
        assert.ok(
          !auth
            .findAllByType('p')
            .some((n) => n.children.join('').includes(dict.connected)),
          'existing account count is not login guidance',
        );
        assert.equal(
          renderer.root.findAll(
            (n) =>
              n.type === 'button' && n.children.includes(dict.subscriptionAdd),
          ).length,
          0,
          'subscription Add replaces its own entry',
        );
        assert.equal(
          renderer.root.findAll(
            (n) => n.props['data-waycraft-provider-group'] === 'api',
          ).length,
          0,
          'API group is not rendered',
        );
        assert.equal(
          renderer.root.findAll(
            (n) => n.props.className === 'waycraft-subscription-add-trigger',
          ).length,
          0,
          'inline form replaces the bottom entry',
        );
        const select = () =>
          renderer.root.find(
            (n) =>
              n.type === 'select' &&
              n.props['aria-label'] === dict.apiSubscription,
          );
        assert.equal(
          select().findAllByType('option').length,
          5,
          'all supported providers remain selectable',
        );
        await act(async () =>
          select().props.onChange({ target: { value: 'claude' } }),
        );
        const claudeAuth = renderer.root
          .findAll((n) => n.props['data-waycraft-claude-card'] === true)
          .at(-1);
        assert.ok(
          claudeAuth
            .findAllByType('p')
            .some((n) => n.children.includes(dict.claudeAddAccountHint)),
        );
        const panel = renderer.root.find(
          (n) =>
            n.type === 'div' &&
            n.props.role === 'group' &&
            n.props['aria-label'] === dict.subscriptionAdd,
        );
        const cancel = panel
          .findAllByType('button')
          .find((n) => n.children.includes(dict.cancel));
        assert.equal(
          cancel.parent.props.className,
          'waycraft-subscription-add-actions',
          'Cancel sits in its trailing action row instead of stretching as a form field',
        );
        await act(async () => cancel.props.onClick());
        assert.equal(
          renderer.root.findAll(
            (n) =>
              n.type === 'button' &&
              n.props.className === 'waycraft-subscription-add-trigger',
          ).length,
          1,
          'cancel restores a single bottom entry',
        );
      } finally {
        if (renderer) await act(async () => renderer.unmount());
        page.cleanup();
      }
    },
  );

for (const locale of ['en', 'ar'])
  test(
    'usage-first disclosures retain account quotas without duplicate counts: ' +
      locale,
    async () => {
      globalThis.IS_REACT_ACT_ENVIRONMENT = true;
      const dict = JSON.parse(
        await readFile(
          new URL('../locale/' + locale + '.json', import.meta.url),
          'utf8',
        ),
      ).subscriptions;
      const ids = ['codex', 'claude', 'grok', 'antigravity', 'copilot'];
      const providers = Object.fromEntries(
        ids.map((id) => [
          id,
          {
            accounts: [
              {
                key: id + '-fixture',
                account: id + '@example.invalid',
                isDefault: true,
                plan: 'Fixture Pro',
              },
            ],
            clientVersion: { version: '1.2.3-fixture', source: 'npm' },
          },
        ]),
      );
      const page = browser(
        locale,
        async (_channel, method) => ({
          ok: true,
          value: method.endsWith('.status')
            ? { component: 'subscriptions', providers }
            : method.endsWith('.usage')
              ? {
                  plan: 'Fixture Pro',
                  windows: [
                    {
                      kind: 'weekly',
                      usedPercent: 43,
                      resetsAt: 4000000000000,
                    },
                  ],
                }
              : {},
        }),
        { React: ActualReact },
      );
      await page.settle();
      let renderer;
      try {
        await act(async () => {
          renderer = create(ActualReact.createElement(page.section.component));
        });
        for (const [index, id] of ids.entries()) {
          const group = renderer.root.find(
            (n) =>
              n.type === 'li' &&
              n.props['data-waycraft-subscription-row'] === id,
          );
          const disclosure = () =>
            group.find(
              (n) =>
                n.type === 'button' && n.props['aria-expanded'] !== undefined,
            );
          assert.equal(
            disclosure().props['aria-expanded'],
            index === 0,
            'only first provider starts open',
          );
          assert.equal(
            group
              .findAllByType('span')
              .filter((n) => n.children.join('') === `1 ${dict.accountCount}`)
              .length,
            1,
            'one count per provider',
          );
          assert.ok(
            !group
              .findAllByType('p')
              .some((n) => n.children.join('') === `1 ${dict.connected}`),
            'healthy count is not repeated as status',
          );
          assert.equal(
            disclosure().findAllByType('span').length,
            0,
            'only the arrow is clickable, not the provider summary',
          );
          const header = group.find(
            (n) => n.props[`data-waycraft-${id}-part`] === 'header',
          );
          assert.equal(
            header.findAllByType('button').at(-1),
            disclosure(),
            'arrow is the last control in the row',
          );
          assert.equal(
            header.findByProps({ 'data-waycraft-provider-status': 'ready' })
              .props['aria-label'],
            dict.providerConfigured,
            'configured status does not claim verified inference',
          );
          assert.ok(
            header
              .findAllByType('bdi')
              .some((n) => n.children.includes('Fixture Pro')),
            'available plan stays in the summary',
          );
          assert.equal(
            header
              .findAllByType('button')
              .filter((n) => n.children.includes(dict.addAccount)).length,
            0,
            'Add account belongs below the list, not in the header',
          );
          const identity = header.findByProps({
            className: 'waycraft-provider-identity',
          });
          assert.ok(
            identity
              .findAllByType('bdi')
              .some((n) => n.children.includes('1.2.3-fixture')),
            'CLI version is beneath the name in the identity column',
          );
          assert.equal(
            identity.props.onClick,
            undefined,
            'provider identity does not toggle accounts',
          );
          assert.equal(
            header.props.onClick,
            undefined,
            'row does not toggle accounts',
          );
          assert.equal(
            group.findAll(
              (n) => n.props[`data-waycraft-${id}-part`] === 'actions',
            ).length,
            0,
            'no empty footer increases collapsed height',
          );
          if (index !== 0) await act(async () => disclosure().props.onClick());
          const account = group.find(
            (n) => n.props[`data-waycraft-${id}-part`] === 'account',
          );
          assert.ok(
            account
              .findAllByType('bdi')
              .some(
                (n) =>
                  n.props.dir === 'ltr' &&
                  n.children.includes(id + '@example.invalid'),
              ),
          );
          assert.equal(
            account.findByProps({ role: 'progressbar' }).props['aria-valuenow'],
            43,
          );
          assert.ok(
            account
              .findAllByType('bdi')
              .some((n) => n.children.includes('43%')),
            'visible percentage remains alongside the bar',
          );
          assert.ok(
            account
              .findAllByType('span')
              .some(
                (n) =>
                  n.children.includes(dict.resets) ||
                  n.children.some(
                    (c) => typeof c === 'string' && c.includes(dict.resets),
                  ),
              ),
            'reset information remains available',
          );
          await act(async () => disclosure().props.onClick());
          assert.equal(
            group.findAll(
              (n) => n.props[`data-waycraft-${id}-part`] === 'account',
            ).length,
            0,
          );
          assert.equal(disclosure().props['aria-expanded'], false);
        }
      } finally {
        if (renderer) await act(async () => renderer.unmount());
        page.cleanup();
      }
    },
  );

test('assembled section renders injected native provider directory with actual React', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const ok = (value) => ({ ok: true, value });
  const remote = {
    $on: () => () => {},
    settings: {
      describe: async () =>
        ok({
          writable: false,
          namespaces: [
            {
              ns: 'fixture-settings',
              value: {},
              user: {},
              base: {},
              revision: 1,
            },
          ],
        }),
    },
    credentials: { describe: async () => ok({}) },
    llm: {
      listConfigurableProviders: async () =>
        ok([
          {
            provider: 'fixture-native',
            displayName: 'Native fixture directory',
            settingsNs: 'fixture-settings',
            settingsPath: [],
          },
        ]),
      listProviders: async () =>
        ok([{ id: 'fixture-native', name: 'Native fixture directory' }]),
    },
  };
  const page = browser(
    'en',
    (_channel, method) =>
      Promise.resolve({
        ok: true,
        value:
          method === 'waycraft-subscriptions.status'
            ? {
                component: 'subscriptions',
                providers: {
                  codex: {
                    accounts: [
                      { key: 'fixture-account', account: 'Fixture account' },
                    ],
                  },
                },
              }
            : {},
      }),
    { React: ActualReact, remote },
  );
  await page.settle();
  let renderer;
  try {
    await act(async () => {
      renderer = create(ActualReact.createElement(page.section.component));
    });
    const settings = renderer.root.findAll(
      (n) => n.type === 'section' && n.props['data-waycraft-settings'] === true,
    );
    assert.equal(
      settings.length,
      1,
      'Settings is an always-visible section, not a disclosure',
    );
    assert.equal(settings[0].findByType('h3').children.join(''), 'Settings');
    const free = renderer.root.find(
      (n) =>
        n.type === 'section' &&
        n.props['data-waycraft-provider-group'] === 'free',
    );
    assert.equal(free.findByType('h3').children.join(''), 'Free providers');
    assert.equal(
      free.findAll((n) => n.props['data-waycraft-zen-card'] === true).length,
      1,
    );
    assert.equal(
      renderer.root
        .findByProps({ 'data-waycraft-provider-group': 'subscription' })
        .findAll((n) => n.props['data-waycraft-zen-card'] === true).length,
      0,
    );
    assert.equal(
      settings[0].findAll(
        (n) => n.props.className === 'waycraft-proxy-settings',
      ).length,
      1,
      'Proxy belongs to page Settings',
    );
    assert.equal(
      renderer.root.findAll(
        (n) => n.props.className === 'waycraft-proxy-settings',
      ).length,
      1,
      'Proxy is mounted only once',
    );
    const subscriptionGroup = renderer.root.findByProps({
      'data-waycraft-provider-group': 'subscription',
    });
    assert.equal(
      renderer.root.findAll(
        (n) => n.props['data-waycraft-provider-group'] === 'api',
      ).length,
      0,
      'API section is not rendered',
    );
    assert.equal(
      renderer.root.findAll(
        (n) =>
          n.type === 'button' &&
          n.children.includes('Add subscription provider'),
      ).length,
      0,
      'no standalone subscription entry',
    );
    assert.equal(
      subscriptionGroup.findAll((n) => n.props['data-waycraft-api-provider'])
        .length,
      0,
    );
    const list = subscriptionGroup.findByProps({
      className: 'waycraft-api-rows',
    });
    assert.equal(
      list.findAll(
        (n) =>
          n.type === 'li' &&
          n.props['data-waycraft-subscription-row'] === 'codex',
      ).length,
      1,
    );
    assert.equal(
      renderer.root.findAll((n) => n.props['data-waycraft-claude-card']).length,
      0,
      'unconfigured controllers are not mounted',
    );
    assert.equal(
      list.findAll((n) => n.props['data-waycraft-codex-part'] === 'account')
        .length,
      1,
      'first configured provider exposes usage immediately',
    );
    const disclosure = () =>
      list
        .findAllByType('button')
        .find((n) => n.props['aria-expanded'] !== undefined);
    assert.equal(disclosure().props['aria-expanded'], true);
    await act(async () => disclosure().props.onClick());
    assert.equal(
      list.findAll((n) => n.props['data-waycraft-codex-part'] === 'account')
        .length,
      0,
    );
    await act(async () => disclosure().props.onClick());
    assert.equal(
      list.findAll((n) => n.props['data-waycraft-codex-part'] === 'account')
        .length,
      1,
    );
    assert.equal(
      list
        .findAllByType('button')
        .filter((n) => n.children.includes('Add account')).length,
      0,
    );
    const addAccount = subscriptionGroup.find(
      (n) =>
        n.type === 'button' &&
        n.props.className === 'waycraft-subscription-add-trigger',
    );
    assert.ok(
      addAccount.findByType('svg'),
      'bottom entry has the Models-like plus icon',
    );
    await act(async () => addAccount.props.onClick());
    assert.equal(
      renderer.root
        .findAllByType('select')
        .find((n) => n.props['aria-label'] === 'Subscription').props.value,
      'codex',
      'Add account preselects shared subscription mode',
    );
    assert.equal(
      renderer.root.findAll(
        (n) => n.type === 'button' && n.props.role === 'tab',
      ).length,
      0,
      'subscription Add does not offer unrelated API modes',
    );
    assert.doesNotMatch(
      JSON.stringify(renderer.toJSON()),
      /Native fixture directory/,
    );
    assert.equal(
      renderer.root.findAll((n) => n.props['data-waycraft-credential-status'])
        .length,
      0,
      'hidden API implementation does not mount credential rows',
    );
    assert.doesNotMatch(
      JSON.stringify(renderer.toJSON()),
      /No API providers yet|Browser admission must be verified/,
    );
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    page.cleanup();
  }
});
for (const locale of ['en', 'ar'])
  test(
    'registered Zen card refresh, pending, error recovery and pending unmount: ' +
      locale,
    async () => {
      globalThis.IS_REACT_ACT_ENVIRONMENT = true;
      const dictionary = JSON.parse(
        await readFile(
          new URL('../locale/' + locale + '.json', import.meta.url),
          'utf8',
        ),
      ).subscriptions;
      const pending = [];
      const page = browser(
        locale,
        (_channel, method) =>
          method === 'waycraft-subscriptions.zenStatus'
            ? new Promise((resolve, reject) =>
                pending.push({ resolve, reject }),
              )
            : Promise.resolve({
                ok: true,
                value: { component: 'subscriptions' },
              }),
        { React: ActualReact },
      );
      await page.settle();
      let renderer;
      const value = {
        ok: true,
        value: { reachable: true, modelCount: 2, source: 'gateway' },
      };
      try {
        await act(async () => {
          renderer = create(ActualReact.createElement(page.section.component));
        });
        const card = () =>
          renderer.root.findByProps({ 'data-waycraft-zen-card': true });
        const button = () =>
          card()
            .findAllByType('button')
            .find((n) => n.children.includes(dictionary.zenRefresh));
        const arrow = () =>
          card().find(
            (n) =>
              n.type === 'button' && n.props['aria-expanded'] !== undefined,
          );
        assert.equal(arrow().props['aria-expanded'], false);
        assert.equal(
          card().findAllByType('p').length,
          0,
          'free provider details start collapsed',
        );
        await act(async () => arrow().props.onClick());
        assert.equal(arrow().props['aria-expanded'], true);
        assert.equal(
          card().findByProps({ 'data-waycraft-provider-status': 'checking' })
            .props['aria-label'],
          dictionary.checking,
        );
        assert.equal(pending.length, 1);
        assert.equal(button().props.disabled, true);
        assert.equal(button().children.join(''), dictionary.zenRefresh);
        await act(async () => pending.shift().resolve(value));
        assert.equal(button().props.disabled, false);
        assert.equal(
          card().findByProps({ 'data-waycraft-provider-status': 'ready' })
            .props['aria-label'],
          dictionary.zenReachable,
        );
        await act(async () => arrow().props.onClick());
        assert.equal(card().findAllByType('p').length, 0);
        assert.equal(arrow().props['aria-expanded'], false);
        await act(async () => arrow().props.onClick());
        await act(async () => button().props.onClick());
        assert.equal(pending.length, 1);
        assert.equal(button().props.disabled, true);
        await act(async () =>
          pending.shift().reject(Error('fixture unavailable')),
        );
        assert.ok(
          JSON.stringify(
            card().findByProps({ role: 'status' }).children,
          ).includes(dictionary.zenUnavailable),
        );
        assert.equal(button().props.disabled, false);
        assert.equal(
          card().findByProps({ 'data-waycraft-provider-status': 'error' })
            .props['aria-label'],
          dictionary.zenUnavailable,
        );
        await act(async () => button().props.onClick());
        assert.equal(button().props.disabled, true);
        await act(async () => pending.shift().resolve(value));
        assert.ok(
          JSON.stringify(
            card().findByProps({ role: 'status' }).children,
          ).includes(dictionary.zenReachable),
        );
        assert.equal(button().props.disabled, false);
        await act(async () => button().props.onClick());
        assert.equal(pending.length, 1);
        await act(async () => renderer.unmount());
        renderer = null;
        await act(async () =>
          pending.shift().reject(Error('late fixture failure')),
        );
        assert.equal(pending.length, 0);
        assert.ok(
          page.section,
          'late completion does not withdraw registration',
        );
      } finally {
        if (renderer) await act(async () => renderer.unmount());
        page.cleanup();
      }
    },
  );
test('real Cordis admits the remote root and namespaces before registered API directory RPC', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const root = new Context();
  const calls = [];
  const ok = (value) => ({ ok: true, value });
  class FixtureService extends Service {
    constructor(ctx, name, methods) {
      super(ctx, name);
      Object.assign(this, methods);
    }
  }
  // Cordis resolves namespace services, not plain nested objects on the root.
  const llmMethods = {
    listConfigurableProviders: async () => {
      calls.push('configurable');
      return ok([
        {
          provider: 'cordis-fixture',
          displayName: 'Cordis admitted directory',
          settingsNs: 'fixture-settings',
          settingsPath: [],
        },
      ]);
    },
    listProviders: async () => {
      calls.push('directory');
      return ok([{ id: 'cordis-fixture', name: 'Cordis admitted directory' }]);
    },
  };
  const services = root.plugin((ctx) => {
    new FixtureService(ctx, 'remote', { $on: () => () => {} });
    new FixtureService(ctx, 'remote.settings', {
      describe: async () => {
        calls.push('settings');
        return ok({
          writable: false,
          namespaces: [
            {
              ns: 'fixture-settings',
              value: {},
              user: {},
              base: {},
              revision: 1,
            },
          ],
        });
      },
    });
    new FixtureService(ctx, 'remote.credentials', {
      describe: async () => {
        calls.push('credentials');
        return ok({});
      },
    });
  });
  await services;
  const page = browser('en', undefined, {
    React: ActualReact,
    remoteContext: root,
  });
  let renderer, llm;
  try {
    await page.settle();
    await act(async () => {
      renderer = create(ActualReact.createElement(page.section.component));
    });
    assert.equal(
      renderer.root.findAll(
        (n) => n.props['data-waycraft-provider-group'] === 'subscription',
      ).length,
      1,
    );
    assert.deepEqual(
      calls,
      [],
      'no native RPC before all required services are admitted',
    );
    await act(async () => {
      llm = root.plugin((ctx) => {
        new FixtureService(ctx, 'remote.llm', llmMethods);
      });
      await llm;
    });
    assert.ok(
      !JSON.stringify(renderer.toJSON()).includes('Cordis admitted directory'),
      'native API directory is not duplicated in subscription-only Settings',
    );
    assert.deepEqual(
      calls,
      [],
      'subscription-only composition does not query native API directory',
    );
    await act(async () => {
      await llm.dispose();
    });
    assert.equal(
      renderer.root.findAll(
        (n) => n.props['data-waycraft-provider-group'] === 'subscription',
      ).length,
      1,
    );
    const withdrawnCalls = calls.length;
    await act(async () => {
      llm = root.plugin((ctx) => {
        new FixtureService(ctx, 'remote.llm', llmMethods);
      });
      await llm;
    });
    assert.ok(
      !JSON.stringify(renderer.toJSON()).includes('Cordis admitted directory'),
      'native API directory is not duplicated in subscription-only Settings',
    );
    assert.equal(
      calls.length,
      withdrawnCalls,
      'service remount preserves subscription-only ownership',
    );
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    page.cleanup();
    await root.fiber.dispose();
  }
});
test('unreachable known component displays a clear message; reconnect recovers', async () => {
  const page = browser();
  await page.settle();
  page.setAnswer(() => Promise.reject(new Error('offline')));
  page.tick();
  await page.settle();
  assert.match(text(page.section.component()), /cannot be reached/);
  page.setAnswer(() =>
    Promise.resolve({ ok: true, value: { component: 'subscriptions' } }),
  );
  page.reconnect();
  await page.settle();
  assert.doesNotMatch(text(page.section.component()), /cannot be reached/);
  page.cleanup();
});
test('404 on first probe leaves the section absent', async () => {
  const page = browser('en', () =>
    Promise.reject(
      new Error(
        'transport failure for /api/waycraft-subscriptions.status: HTTP 404',
      ),
    ),
  );
  await page.settle();
  assert.equal(page.section, undefined);
  page.cleanup();
});
for (const [failure, answer] of [
  ['transport', () => Promise.reject(new Error('offline'))],
  ['timeout', () => Promise.reject(new Error('timeout'))],
  [
    '5xx',
    () =>
      Promise.reject(
        new Error(
          'transport failure for /api/waycraft-subscriptions.status: HTTP 503',
        ),
      ),
  ],
  ['malformed body', () => Promise.resolve(null)],
]) {
  test(`enabled-but-unreachable on first probe shows the message: ${failure}`, async () => {
    const page = browser('en', answer);
    await page.settle();
    assert.match(text(page.section.component()), /cannot be reached/);
    page.cleanup();
  });
}
test('unreachable then 404 removes the section', async () => {
  const page = browser('en', () => Promise.reject(new Error('offline')));
  await page.settle();
  assert.ok(page.section);
  page.setAnswer(() =>
    Promise.reject(
      new Error(
        'transport failure for /api/waycraft-subscriptions.status: HTTP 404',
      ),
    ),
  );
  page.tick();
  await page.settle();
  assert.equal(page.section, undefined);
  page.cleanup();
});
test('unreachable then success restores both parts', async () => {
  const page = browser('ar', () => Promise.reject(new Error('offline')));
  await page.settle();
  assert.match(text(page.section.component()), /[\u0600-\u06ff]/);
  page.setAnswer(() =>
    Promise.resolve({ ok: true, value: { component: 'subscriptions' } }),
  );
  page.tick();
  await page.settle();
  assert.match(text(page.section.component()), /موفّرو الذكاء الاصطناعي/);
  assert.equal(
    page.section
      .component()
      .children.flat()
      .filter((node) => node?.props?.role === 'alert').length,
    0,
  );
  page.cleanup();
});

test('assembled core entry completes registrations when Subscriptions setup throws or rejects', async () => {
  const assembled = await readFile(
    new URL('../dist/client.js', import.meta.url),
    'utf8',
  );
  for (const failure of [
    'inject',
    'primitives',
    'locale',
    'effect',
    'async inject',
    'async effect',
    'async locale',
  ]) {
    const registrations = [],
      effects = [],
      errors = [],
      pending = [];
    let entry;
    vm.runInNewContext(assembled, {
      window: {
        __ModuleLoader__: {
          load: ({ factory }) => {
            entry = factory((id) => {
              if (
                id === '@deepseek-ai/dsh-client-ui-primitives' &&
                failure === 'primitives'
              )
                throw new Error('primitives failed');
              return id === 'react'
                ? {
                    Component: class {},
                    forwardRef: (fn) => fn,
                    createElement() {},
                  }
                : {};
            });
          },
        },
      },
      console: { error: (...args) => errors.push(args) },
      Error,
      setInterval() {},
      clearInterval() {},
      // This registration fixture does not run presence polling or acquire live timers.
      setTimeout() {
        return { unref() {} };
      },
      clearTimeout() {},
    });
    const subscriptions = {
      get() {
        return {
          rpc: {
            call: () =>
              Promise.resolve({
                ok: true,
                value: { component: 'subscriptions' },
              }),
          },
          state: { subscribe: () => () => {}, getSnapshot: () => 'connected' },
        };
      },
      slots: { inject: () => () => {} },
      // The #131 /fast contribution asks the Subscriptions scope for the host command service.
      inject(_, callback) {
        callback({
          get: () => ({ register: () => () => {} }),
          effect: (fn) => fn(),
        });
      },
      locale: {
        register() {
          if (failure === 'async locale')
            return Promise.reject(new Error('async locale failed'));
          throw new Error('locale failed');
        },
        bind() {
          return () => '';
        },
      },
      effect(fn, label) {
        if (failure === 'effect' && label.endsWith('dictionaries'))
          throw new Error('effect failed');
        if (failure === 'async effect' && label.endsWith('dictionaries'))
          return Promise.reject(new Error('async effect failed'));
        return fn();
      },
    };
    const ctx = {
      effect: (_, label) => effects.push(label),
      slots: {
        inject: (_, fn) => fn(),
        register: (options) => registrations.push(options.id),
      },
      inject(names, callback) {
        // The #131 /fast contribution asks for the host command service; give it a minimal one.
        if (names.includes('commandUi')) {
          pending.push(
            Promise.resolve().then(() =>
              callback({
                get: () => ({ register: () => () => {} }),
                effect: (fn) => fn(),
              }),
            ),
          );
          return;
        }
        if (failure === 'inject') throw new Error('inject failed');
        if (failure === 'async inject')
          return Promise.reject(new Error('async inject failed'));
        // Exercise deferred injection callbacks as well as synchronous registration failures.
        pending.push(Promise.resolve().then(() => callback(subscriptions)));
      },
    };
    assert.doesNotThrow(() => entry.apply(ctx));
    await Promise.all(pending);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(registrations.length, 11, failure);
    assert.ok(registrations.includes('waycraft-notifications'), failure);
    assert.ok(registrations.includes('waycraft-ui-font-size'), failure);
    assert.ok(effects.includes('dsh-waycraft: apply settings'), failure);
    // Independent managers may log isolated setup failures; Subscriptions reports exactly one.
    const subscriptionErrors = errors.filter(([message]) =>
      /^dsh-waycraft: Subscriptions/.test(message),
    );
    assert.equal(subscriptionErrors.length, 1, failure);
    assert.ok(
      errors.every(([message]) =>
        /^dsh-waycraft: (Subscriptions|Skill manager|MCP manager)/.test(
          message,
        ),
      ),
      failure,
    );
  }
});
test('Arabic copy covers every new key and rendered content uses logical alignment', async () => {
  const en = JSON.parse(
    await readFile(new URL('../locale/en.json', import.meta.url)),
  ).subscriptions;
  const ar = JSON.parse(
    await readFile(new URL('../locale/ar.json', import.meta.url)),
  ).subscriptions;
  assert.deepEqual(Object.keys(ar).sort(), Object.keys(en).sort());
  Object.values(ar).forEach((value) => assert.match(value, /[\u0600-\u06ff]/));
  const page = browser('ar');
  await page.settle();
  const view = page.section.component();
  assert.match(text(view), /موفّرو الذكاء الاصطناعي/);
  assert.equal(view.props.style.textAlign, 'start');
  for (const part of view.children
    .flat()
    .filter((node) => node?.tag === 'section')) {
    assert.equal(part.props.style?.textAlign ?? 'start', 'start');
    assert.equal(part.props.style?.marginLeft, undefined);
    assert.equal(part.props.style?.marginRight, undefined);
  }
  page.cleanup();
  assert.equal(page.section, undefined);
});

for (const locale of ['en', 'ar']) {
  test(`reference coexistence notice is localized and recovers on switch off: ${locale}`, async () => {
    const page = browser(locale);
    await page.settle();
    const notice = () =>
      page.section
        .component()
        .children.flat()
        .find((node) => node?.props?.role === 'status');
    assert.equal(notice(), undefined);
    page.setReferenceAnswer((channel, method, payload) => {
      assert.equal(channel, '/api');
      assert.equal(method, 'subscriptions-auth.proxyGet');
      assert.equal(JSON.stringify(payload), '{}');
      return Promise.resolve({ ok: true, value: {} });
    });
    page.reconnect();
    await page.settle();
    assert.match(
      text(notice()),
      locale === 'en'
        ? /reference plugin.*running.*only one.*switch.*off/i
        : /الإضافة المرجعية.*تعمل.*واحدة فقط.*أوقف/,
    );
    for (const id of ['codex', 'claude', 'grok', 'copilot', 'antigravity'])
      assert.ok(text(notice()).includes(id));
    assert.equal(
      page.section.options.label(),
      locale === 'en' ? 'AI Providers' : 'موفّرو الذكاء الاصطناعي',
    );
    page.reconnect();
    await page.settle();
    assert.equal(page.registrations, 1);
    page.setReferenceAnswer(() =>
      Promise.reject(
        new Error(
          'transport failure for /api/subscriptions-auth.proxyGet: HTTP 404',
        ),
      ),
    );
    page.reconnect();
    await page.settle();
    assert.equal(notice(), undefined);
    page.cleanup();
  });
}
for (const response of [
  () => Promise.reject(new Error('offline')),
  () =>
    Promise.reject(
      new Error(
        'transport failure for /api/subscriptions-auth.proxyGet: HTTP 503',
      ),
    ),
  () => Promise.resolve({ ok: false }),
  () => Promise.resolve(null),
]) {
  test('unknown reference probe never displays a notice or blocks our section', async () => {
    const page = browser();
    await page.settle();
    page.setReferenceAnswer(response);
    page.reconnect();
    await page.settle();
    assert.ok(page.section);
    assert.equal(
      page.section
        .component()
        .children.flat()
        .find((node) => node?.props?.role === 'status'),
      undefined,
    );
    page.cleanup();
  });
}

test('reference responses after a newer probe or disposal are ignored', async () => {
  const page = browser();
  await page.settle();
  let resolve;
  page.setReferenceAnswer(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  page.reconnect();
  page.setReferenceAnswer(() =>
    Promise.reject(
      new Error(
        'transport failure for /api/subscriptions-auth.proxyGet: HTTP 404',
      ),
    ),
  );
  page.reconnect();
  await page.settle();
  resolve({ ok: true });
  await page.settle();
  assert.equal(
    page.section
      .component()
      .children.flat()
      .find((node) => node?.props?.role === 'status'),
    undefined,
  );
  page.setReferenceAnswer(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  page.reconnect();
  page.cleanup();
  resolve({ ok: true });
  await page.settle();
  assert.equal(page.section, undefined);
});
test('owned global registrations in src use the Waycraft namespace', async () => {
  for (const file of ['browser.ts', 'subscriptions.ts']) {
    const source = await readFile(
      new URL(`../src/${file}`, import.meta.url),
      'utf8',
    );
    const ids = [
      ...source.matchAll(
        /(?:\bid:|\bpath:|\bmethod !==|\bNS =)\s*['"]([^'"]+)['"]/g,
      ),
    ].map((match) => match[1]);
    assert.ok(ids.length, file);
    // Deliberately shared provider-native model IDs and the reference's speed-tier option ids are not owned
    // global registrations (ADR-0002); the tier ids are values sent to the `setSpeed` endpoint.
    // Claude's provider-native model IDs (`claude-*`) are shared the same way, and `oauth`/`keychain` are the values of the
    // Claude login `method` enum sent to the `login` endpoint, not a registration.
    for (const id of ids.filter(
      (id) =>
        ![
          'gemini-3-flash',
          'gpt-4o',
          'gemini-2.5-pro',
          'gpt-4.1',
          'gpt-5.1-codex',
          'gpt-5.1-codex-mini',
          'gpt-5.1',
          'standard',
          'fast',
          'oauth',
          'official-cli',
          'keychain',
        ].includes(id) && !/^(claude|grok)-/.test(id),
    ))
      assert.match(id, /^(?:\/api\/)?waycraft[.-]/, `${file}: ${id}`);
    for (const [, label] of source.matchAll(/},?\)?\), ['"]([^'"]+)['"]\)/g))
      assert.match(label, /^(?:dsh-)?waycraft:/, `${file}: ${label}`);
  }
});

// ---- #131 composer surfaces: usage badge, Speed control and /fast ----
function commandService() {
  const commands = new Map();
  return {
    commands,
    register(command) {
      commands.set(command.name, command);
      return () => {
        commands.delete(command.name);
      };
    },
  };
}
const MEDIA_SURFACES = [
  'image_generate',
  'dsh_waycraft_image_generate',
  'video_generate',
  'dsh_waycraft_video_generate',
  // Deprecated toolview keys kept for one release so old transcripts still render.
  'dsh_majed_image_generate',
  'dsh_majed_video_generate',
]
  .map((key) => `waycraft-toolview-${key}`)
  .sort();
const SURFACES = [
  'waycraft-subscription-speed',
  'waycraft-subscription-usage',
  ...MEDIA_SURFACES,
].sort();
test('composer surfaces register with waycraft ids while present and withdraw when absent', async () => {
  const page = browser('en', undefined, { commandService: commandService() });
  await page.settle();
  assert.deepEqual(page.surfaces, SURFACES);
  assert.equal(
    page.live.get('waycraft-subscription-speed').options.name,
    'conversation.input.right',
  );
  assert.equal(
    page.live.get('waycraft-subscription-usage').options.name,
    'conversation.composer.dock',
  );
  assert.equal(page.live.get('waycraft-subscription-speed').options.order, 0);
  assert.equal(page.live.get('waycraft-subscription-usage').options.order, 10);
  assert.equal(
    page.live.get('waycraft-subscription-speed').options.locale,
    'waycraft.subscriptions',
  );
  page.setAnswer(() =>
    Promise.reject(
      new Error(
        'transport failure for /api/waycraft-subscriptions.status: HTTP 404',
      ),
    ),
  );
  page.reconnect();
  await page.settle();
  assert.deepEqual(
    page.surfaces,
    [],
    'component off: every composer surface is withdrawn',
  );
  page.setAnswer(() =>
    Promise.resolve({ ok: true, value: { component: 'subscriptions' } }),
  );
  page.reconnect();
  await page.settle();
  assert.deepEqual(
    page.surfaces,
    SURFACES,
    'component back on: surfaces return once, without duplicates',
  );
  page.cleanup();
  assert.deepEqual(page.surfaces, [], 'dispose unregisters every surface');
});
test('composer surfaces are withdrawn while the reference plugin serves and return when it stops', async () => {
  const page = browser('en', undefined, { commandService: commandService() });
  await page.settle();
  assert.deepEqual(page.surfaces, SURFACES);
  page.setReferenceAnswer(() => Promise.resolve({ ok: true, value: {} }));
  page.reconnect();
  await page.settle();
  assert.deepEqual(page.surfaces, []);
  assert.ok(
    page.section,
    'the Settings section stays (with its coexistence notice)',
  );
  page.setReferenceAnswer(() =>
    Promise.reject(
      new Error(
        'transport failure for /api/subscriptions-auth.proxyGet: HTTP 404',
      ),
    ),
  );
  page.reconnect();
  await page.settle();
  assert.deepEqual(page.surfaces, SURFACES);
});
test('a composer surface that fails to register does not affect the section or the other surface', async () => {
  const originalError = console.error;
  const reports = [];
  console.error = (...args) => reports.push(args);
  try {
    const page = browser('en', undefined, {
      commandService: commandService(),
      failSlot: 'conversation.input.right',
    });
    await page.settle();
    assert.ok(page.section, 'Settings section registered');
    assert.deepEqual(
      page.surfaces,
      ['waycraft-subscription-usage', ...MEDIA_SURFACES].sort(),
    );
  } finally {
    console.error = originalError;
  }
});
test('/fast registers as `fast`, is listed only while wanted, and offers Standard/Fast for a fast-capable model', async () => {
  const service = commandService();
  const calls = [];
  const page = browser(
    'en',
    (...args) => {
      calls.push(args);
      if (args[1] === 'waycraft-subscriptions.speed')
        return Promise.resolve({
          ok: true,
          value: { tier: 'fast', fastModels: ['fast-model'] },
        });
      if (args[1] === 'waycraft-subscriptions.setSpeed')
        return Promise.resolve({ ok: true, value: { ok: true } });
      return Promise.resolve({
        ok: true,
        value: { component: 'subscriptions' },
      });
    },
    { commandService: service },
  );
  await page.settle();
  const command = service.commands.get('fast');
  assert.ok(command, '/fast registered');
  assert.equal(
    command.description(),
    'Switch the Codex speed tier (Standard/Fast)',
  );
  assert.equal(command.available(), true);
  assert.equal(command.ui.kind, 'popupSelect');
  const options = await command.ui.options({ sessionId: 's1' });
  assert.deepEqual(
    JSON.parse(JSON.stringify(options.map((o) => [o.id, o.label, o.active]))),
    [
      ['standard', 'Standard', false],
      ['fast', 'Fast', true],
    ],
  );
  await command.ui.onSelect({ id: 'standard' }, { sessionId: 's1' });
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        calls
          .filter((c) => c[1] === 'waycraft-subscriptions.setSpeed')
          .map((c) => c[2]),
      ),
    ),
    [{ sessionId: 's1', tier: 'standard' }],
  );
  assert.ok(
    calls.some(
      (c) =>
        c[1] === 'waycraft-subscriptions.speed' &&
        c[2].sessionId === 's1' &&
        c[2].model === 'fast-model',
    ),
    'speed read carries the Codex model',
  );
  page.setAnswer(() =>
    Promise.reject(
      new Error(
        'transport failure for /api/waycraft-subscriptions.status: HTTP 404',
      ),
    ),
  );
  page.tick();
  await page.settle();
  assert.equal(
    command.available(),
    false,
    'component off: /fast is not offered',
  );
  await assert.rejects(
    () => command.ui.options({ sessionId: 's1' }),
    /no fast tier/,
  );
  const before = calls.length;
  await command.ui.onSelect({ id: 'fast' }, { sessionId: 's1' });
  assert.equal(calls.length, before, 'component off: selecting does nothing');
});
test('/fast refuses a model without a fast tier and surfaces speed errors as a rejected popup', async () => {
  const service = commandService();
  const page = browser(
    'en',
    (...args) =>
      args[1] === 'waycraft-subscriptions.speed'
        ? Promise.resolve({
            ok: true,
            value: { tier: 'standard', fastModels: ['other'] },
          })
        : Promise.resolve({ ok: true, value: { component: 'subscriptions' } }),
    { commandService: service },
  );
  await page.settle();
  await assert.rejects(
    () => service.commands.get('fast').ui.options({ sessionId: 's1' }),
    /no fast tier/,
  );
  const failing = browser(
    'en',
    (...args) =>
      args[1] === 'waycraft-subscriptions.speed'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve({ ok: true, value: { component: 'subscriptions' } }),
    { commandService: service },
  );
  await failing.settle();
  await assert.rejects(() =>
    service.commands.get('fast').ui.options({ sessionId: 's1' }),
  );
});
test('/fast contribution is removed on dispose and Arabic copy resolves', async () => {
  const service = commandService();
  const page = browser('ar', undefined, { commandService: service });
  await page.settle();
  assert.match(service.commands.get('fast').description(), /Codex/);
  assert.notEqual(service.commands.get('fast').description(), 'commandFast');
  page.cleanup();
  assert.equal(service.commands.has('fast'), false);
});

for (const provider of ['codex', 'claude', 'grok', 'antigravity', 'copilot'])
  for (const apiState of ['absent', 'failed'])
    test(`assembled ${provider} success/cancel/failure/reentry with ${apiState} API`, async () => {
      globalThis.IS_REACT_ACT_ENVIRONMENT = true;
      const dict = JSON.parse(
        await readFile(new URL('../locale/en.json', import.meta.url), 'utf8'),
      ).subscriptions;
      let state = {
        accounts: [{ key: 'same', account: 'Existing identity' }],
        busy: false,
        authRevision: 0,
      };
      let usage = 0,
        cancelFails = false;
      const remote =
        apiState === 'absent'
          ? undefined
          : {
              $on: () => () => {},
              settings: {
                describe: async () => {
                  throw Error('fixture API unavailable');
                },
              },
              llm: {
                listConfigurableProviders: async () => ({
                  ok: true,
                  value: [],
                }),
                listProviders: async () => ({ ok: true, value: [] }),
              },
            };
      const page = browser(
        'en',
        async (_channel, method) => {
          if (method.endsWith('.status'))
            return {
              ok: true,
              value: {
                component: 'subscriptions',
                providers: { [provider]: structuredClone(state) },
              },
            };
          if (method.endsWith('.login')) {
            state.busy = true;
            state.pendingAuth = {
              authorizeUrl: 'https://fixture.invalid',
              userCode: 'DUMMY',
            };
            return { ok: true, value: state.pendingAuth };
          }
          if (method.endsWith('.cancel')) {
            if (cancelFails)
              return {
                ok: false,
                error: { message: 'Fixture cancellation failed' },
              };
            state.busy = false;
            delete state.pendingAuth;
          }
          if (method.endsWith('.usage')) usage++;
          return { ok: true, value: {} };
        },
        { React: ActualReact, remote },
      );
      await page.settle();
      let renderer;
      const buttons = (key) =>
        renderer.root.findAll(
          (n) =>
            n.type === 'button' &&
            (key === 'subscriptionAdd'
              ? n.props.className === 'waycraft-subscription-add-trigger'
              : key === 'cancel'
                ? n.parent.props.className ===
                  'waycraft-subscription-add-actions'
                : n.children.join('') === dict[key]),
        );
      const click = async (key) => {
        const b = buttons(key)[0];
        assert.ok(b, key);
        assert.equal(b.props.disabled, false, key);
        await act(async () => b.props.onClick());
      };
      const open = async () => {
        await click('subscriptionAdd');
        const select = renderer.root
          .findAllByType('select')
          .find((n) => n.props['aria-label'] === dict.apiSubscription);
        await act(async () =>
          select.props.onChange({ target: { value: provider } }),
        );
      };
      const start = async () => {
        const auth = renderer.root
          .findAll((n) => n.props[`data-waycraft-${provider}-card`] === true)
          .at(-1);
        const login = auth
          .findAllByType('button')
          .find((n) =>
            [dict.addAccount, dict.addAccountOAuth, dict.login].includes(
              n.children.join(''),
            ),
          );
        assert.ok(login, 'provider login remains reachable');
        await act(async () => login.props.onClick());
      };
      try {
        await act(async () => {
          renderer = create(ActualReact.createElement(page.section.component));
        });
        assert.equal(
          renderer.root.findAll(
            (n) =>
              n.type === 'li' &&
              n.props['data-waycraft-subscription-row'] === provider,
          ).length,
          1,
        );
        const initialUsage = usage;
        await open();
        await start();
        assert.equal(
          usage,
          initialUsage,
          'Add owns no duplicate usage requests',
        );
        const group = () =>
          renderer.root.find(
            (n) =>
              n.type === 'li' &&
              n.props['data-waycraft-subscription-row'] === provider,
          );
        assert.equal(
          group().findAllByType('input').length,
          0,
          'group has no callback',
        );
        cancelFails = true;
        await click('cancel');
        assert.equal(
          buttons('subscriptionAdd').length,
          0,
          'failed cancellation retains flow',
        );
        cancelFails = false;
        await click('cancel');
        assert.equal(
          buttons('subscriptionAdd').length,
          1,
          'successful footer cancellation closes Add',
        );
        await click('subscriptionAdd');
        const select = renderer.root
          .findAllByType('select')
          .find((n) => n.props['aria-label'] === dict.apiSubscription);
        await act(async () =>
          select.props.onChange({ target: { value: provider } }),
        );
        await start();
        state.busy = false;
        delete state.pendingAuth;
        state.authRevision++;
        await act(async () => page.tickAuth());
        assert.equal(
          buttons('subscriptionAdd').length,
          1,
          'same identity success closes Add',
        );
        await open();
        await start();
        state.accounts.push({ key: 'new', account: 'New identity' });
        state.busy = false;
        state.authRevision++;
        await act(async () => page.tickAuth());
        assert.ok(
          group()
            .findAllByType('span')
            .some((n) => n.children.join('') === `2 ${dict.accountCount}`),
          'existing group reloads admitted membership',
        );
      } finally {
        if (renderer) await act(async () => renderer.unmount());
        page.cleanup();
      }
    });

for (const provider of ['codex', 'claude', 'grok', 'antigravity', 'copilot'])
  test(`reopened ${provider} group observes pending authentication completion`, async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    let busy = true;
    const page = browser(
      'en',
      async (_channel, method) => ({
        ok: true,
        value: method.endsWith('.status')
          ? {
              component: 'subscriptions',
              providers: {
                [provider]: {
                  accounts: [
                    { key: 'existing', account: 'Synthetic identity' },
                  ],
                  busy,
                },
              },
            }
          : {},
      }),
      { React: ActualReact },
    );
    await page.settle();
    let renderer;
    try {
      await act(async () => {
        renderer = create(ActualReact.createElement(page.section.component));
      });
      const group = () =>
        renderer.root.find(
          (n) =>
            n.type === 'li' &&
            n.props['data-waycraft-subscription-row'] === provider,
        );
      const status = () =>
        group().find(
          (n) => n.props['data-waycraft-provider-status'] !== undefined,
        );
      assert.equal(status().props['data-waycraft-provider-status'], 'warning');
      busy = false;
      await act(async () => page.tickAuth());
      assert.equal(status().props['data-waycraft-provider-status'], 'ready');
      assert.equal(
        group().findAllByType('input').length,
        0,
        'observation does not duplicate auth controls',
      );
    } finally {
      if (renderer) await act(async () => renderer.unmount());
      page.cleanup();
    }
  });

// #207: the 3 s heartbeat reconciles presence, but an answer that is a settled "no" must not be asked again every 3 s
// (the browser prints each 404), and a failed probe of the reference plugin must not read as "the reference is off".
const REFERENCE_404 = () =>
  Promise.reject(
    new Error(
      'transport failure for /api/subscriptions-auth.proxyGet: HTTP 404',
    ),
  );
const REFERENCE_ON = () => Promise.resolve({ ok: true, value: {} });
const STATUS_404 = () =>
  Promise.reject(
    new Error(
      'transport failure for /api/waycraft-subscriptions.status: HTTP 404',
    ),
  );
const referenceNotice = (page) =>
  page.section
    .component()
    .children.flat()
    .find((node) => node?.props?.role === 'status');
const MINUTE = 20; // heartbeats

test('an absent reference plugin is asked at most twice in a minute', async () => {
  const page = browser();
  await page.settle();
  await page.ticks(MINUTE);
  assert.ok(
    page.referenceCalls <= 2,
    `${page.referenceCalls} reference requests in 60 s`,
  );
  await page.ticks(MINUTE);
  assert.ok(
    page.referenceCalls <= 3,
    `${page.referenceCalls} reference requests in 120 s`,
  );
  page.cleanup();
});

test('an absent component is asked at most twice in a minute and stays absent', async () => {
  const page = browser('en', STATUS_404);
  await page.settle();
  await page.ticks(MINUTE);
  assert.ok(
    page.statusCalls <= 2,
    `${page.statusCalls} status requests in 60 s`,
  );
  const steady = page.statusCalls;
  await page.ticks(MINUTE);
  assert.ok(
    page.statusCalls - steady <= 1,
    `${page.statusCalls - steady} status requests in the next 60 s`,
  );
  assert.equal(page.section, undefined);
  page.cleanup();
});

test('a present component is still reconciled on every heartbeat', async () => {
  const page = browser();
  await page.settle();
  const before = page.statusCalls;
  await page.ticks(5);
  assert.equal(page.statusCalls, before + 5);
  page.cleanup();
});

for (const [failure, answer] of [
  ['network error', () => Promise.reject(new Error('offline'))],
  ['timeout', () => Promise.reject(new Error('timeout'))],
  [
    '5xx',
    () =>
      Promise.reject(
        new Error(
          'transport failure for /api/subscriptions-auth.proxyGet: HTTP 503',
        ),
      ),
  ],
  ['malformed answer', () => Promise.resolve(null)],
  ['refusal', () => Promise.resolve({ ok: false })],
]) {
  test(`a reference that was running stays running through a ${failure}`, async () => {
    const page = browser();
    await page.settle();
    page.setReferenceAnswer(REFERENCE_ON);
    page.reconnect();
    await page.settle();
    assert.ok(referenceNotice(page));
    page.setReferenceAnswer(answer);
    page.reconnect();
    await page.settle();
    assert.ok(referenceNotice(page), 'notice survives the failed probe');
    await page.ticks(MINUTE);
    assert.ok(referenceNotice(page), 'and keeps surviving the retries');
    page.cleanup();
  });
}

test('a reference that was running and now answers 404 is off', async () => {
  const page = browser();
  await page.settle();
  page.setReferenceAnswer(REFERENCE_ON);
  page.reconnect();
  await page.settle();
  assert.ok(referenceNotice(page));
  page.setReferenceAnswer(REFERENCE_404);
  page.reconnect();
  await page.settle();
  assert.equal(referenceNotice(page), undefined);
  page.cleanup();
});

test('a running reference is re-checked at most once a minute and its switch-off is noticed without a reconnect', async () => {
  const page = browser();
  await page.settle();
  page.setReferenceAnswer(REFERENCE_ON);
  page.reconnect();
  await page.settle();
  const before = page.referenceCalls;
  await page.ticks(MINUTE - 1);
  assert.equal(page.referenceCalls, before, 'quiet until the minute is up');
  page.setReferenceAnswer(REFERENCE_404);
  await page.ticks(1);
  assert.equal(page.referenceCalls, before + 1);
  assert.equal(referenceNotice(page), undefined);
  page.cleanup();
});

test('a failed reference probe is retried instead of trusted', async () => {
  const page = browser();
  await page.settle();
  page.setReferenceAnswer(() => Promise.reject(new Error('offline')));
  page.reconnect();
  await page.settle();
  assert.equal(referenceNotice(page), undefined);
  page.setReferenceAnswer(REFERENCE_ON);
  await page.ticks(10);
  assert.ok(referenceNotice(page), 'the retry found the running reference');
  page.cleanup();
});

test('a reconnect asks the reference again at once and starts the back-off over', async () => {
  const page = browser();
  await page.settle();
  await page.ticks(2 * MINUTE); // deep into the steady one-a-minute cadence
  const before = page.referenceCalls;
  page.setReferenceAnswer(REFERENCE_ON);
  page.reconnect();
  await page.settle();
  assert.equal(page.referenceCalls, before + 1, 'asked at once');
  assert.ok(referenceNotice(page));
  page.setReferenceAnswer(REFERENCE_404);
  page.reconnect();
  await page.settle();
  const base = page.referenceCalls;
  await page.ticks(9);
  assert.equal(page.referenceCalls, base, 'first re-check is 30 s away');
  await page.ticks(1);
  assert.equal(page.referenceCalls, base + 1);
  page.cleanup();
});

test('a reconnect asks a component that was absent again at once', async () => {
  const page = browser('en', STATUS_404);
  await page.settle();
  await page.ticks(2 * MINUTE);
  assert.equal(page.section, undefined);
  page.setAnswer(() =>
    Promise.resolve({ ok: true, value: { component: 'subscriptions' } }),
  );
  page.reconnect();
  await page.settle();
  assert.ok(page.section);
  page.cleanup();
});

test('an absent component that appears is found within a minute without a reconnect', async () => {
  const page = browser('en', STATUS_404);
  await page.settle();
  await page.ticks(2 * MINUTE);
  page.setAnswer(() =>
    Promise.resolve({ ok: true, value: { component: 'subscriptions' } }),
  );
  await page.ticks(MINUTE);
  assert.ok(page.section);
  page.cleanup();
});

test('disposal stops every timer and nothing updates afterwards', async () => {
  const page = browser();
  await page.settle();
  assert.ok(page.timerCount > 0);
  let resolveReference;
  page.setReferenceAnswer(
    () =>
      new Promise((done) => {
        resolveReference = done;
      }),
  );
  page.reconnect();
  page.cleanup();
  assert.equal(page.timerCount, 0);
  resolveReference(REFERENCE_ON());
  await page.settle();
  assert.equal(page.section, undefined);
  await page.ticks(MINUTE);
  assert.equal(page.section, undefined);
});
