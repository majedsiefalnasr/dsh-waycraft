// registered UI -> actual host routes/controllers -> dummy HTTP/credential IO.
// No status revision is fabricated; the real controller must persist each admission.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { create, act } from 'react-test-renderer';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../dist/subscriptions.js';

const code = await readFile(
  new URL('../dist/subscriptions-client.js', import.meta.url),
  'utf8',
);
const dict = JSON.parse(
  await readFile(new URL('../locale/en.json', import.meta.url), 'utf8'),
).subscriptions;
const turn = () => new Promise((resolve) => setImmediate(resolve));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const jwt = (claims) =>
  `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.dummy`;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function fixture(provider) {
  const previousHome = process.env.DSH_HOME;
  const fixtureHome = await mkdtemp(join(tmpdir(), 'waycraft-ui138-host-'));
  process.env.DSH_HOME = fixtureHome;
  const pendingRpc = new Set();
  const routes = new Map(),
    cleanups = [],
    calls = [],
    timers = new Set(),
    live = new Map(),
    denied = [];
  let imported,
    identity = 'first',
    mode = 'success',
    release,
    focused = 0,
    renderer,
    dictionary,
    importReads = 0;
  const exchanges = new Set();
  const originalFetch = globalThis.fetch;
  async function dispose() {
    try {
      if (renderer) await act(async () => renderer.unmount());
      renderer = undefined;
      cleanups.reverse().forEach((fn) => fn?.());
      release?.();
      release = undefined;
      await Promise.all([...exchanges]);
      await turn();
    } finally {
      globalThis.fetch = originalFetch;
      if (previousHome === undefined) delete process.env.DSH_HOME;
      else process.env.DSH_HOME = previousHome;
      assert.equal(
        fixtureHome.startsWith(join(tmpdir(), 'waycraft-ui138-host-')),
        true,
      );
      await rm(fixtureHome, { recursive: true, force: true });
    }
    assert.equal(routes.size, 0);
    assert.equal(timers.size, 0);
  }
  try {
    const tokenBody = () => ({
      access_token: 'dummy-access',
      refresh_token: 'dummy-refresh',
      expires_in: 3600,
      id_token: jwt({
        email: `${identity}@example.invalid`,
        'https://api.openai.com/auth': {
          chatgpt_account_id: identity,
          chatgpt_plan_type: 'plus',
        },
      }),
      account: { email_address: `${identity}@example.invalid` },
    });
    globalThis.fetch = async (url, init) => {
      url = String(url);
      if (url === 'https://opencode.ai/inference/v1/models')
        return Response.json({ data: [] });
      if (url === 'https://models.dev/api.json')
        return Response.json({ opencode: { models: {} } });
      if (url.startsWith('https://registry.npmjs.org/'))
        return Response.json({ version: '1.0.0' });
      if (url.endsWith('/rate-limit-reset-credits')) return Response.json({});
      if (url.includes('openid-configuration'))
        return Response.json({
          authorization_endpoint: 'https://accounts.x.ai/authorize',
          token_endpoint: 'https://accounts.x.ai/token',
        });
      if (url.endsWith('/login/device/code'))
        return Response.json({
          device_code: 'dummy-private',
          user_code: 'DUMMY-CODE',
          verification_uri: 'https://github.com/login/device',
          interval: 0.001,
        });
      if (
        url.endsWith('/login/oauth/access_token') ||
        url.endsWith('/oauth/token') ||
        url === 'https://accounts.x.ai/token' ||
        url.includes('oauth2.googleapis.com/token')
      ) {
        if (mode === 'hold' || provider === 'copilot') {
          const exchange = new Promise((resolve) => {
            release = resolve;
          });
          exchanges.add(exchange);
          await exchange;
          exchanges.delete(exchange);
        }
        if (mode === 'failure')
          return Response.json({ error: 'invalid_grant' }, { status: 400 });
        return Response.json(
          provider === 'copilot'
            ? { access_token: 'dummy-github' }
            : tokenBody(),
        );
      }
      if (url.includes('/api/oauth/profile'))
        return Response.json({
          account: { email: `${identity}@example.invalid` },
          organization: { organization_type: 'claude_pro' },
        });
      if (url.endsWith('loadCodeAssist'))
        return Response.json({
          cloudaicompanionProject: 'dummy-project',
          currentTier: { name: 'Dummy' },
        });
      if (url.includes('userinfo'))
        return Response.json({ email: `${identity}@example.invalid` });
      if (url.endsWith('/user')) return Response.json({ login: identity });
      if (url.endsWith('/copilot_internal/v2/token'))
        return Response.json({
          token: 'dummy-copilot',
          expires_at: 4000000000,
        });
      if (url.includes('/api/releases/stable'))
        return Response.json(['1.107.0']);
      // Existing grouped cards request usage on membership change, never during auth alone.
      if (
        url.includes('/usage') ||
        url.includes('/billing') ||
        url.endsWith('fetchAvailableModels') ||
        url.includes('reset_credits')
      )
        return Response.json({});
      denied.push(url);
      throw Error('unexpected dummy HTTP request');
    };
    const host = {
      logger: { warn() {} },
      llm: {
        registerAdapter() {
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
      inject(names, fn) {
        if (names.includes('connection')) fn(host);
      },
      effect(fn) {
        const off = fn();
        if (off) cleanups.push(off);
      },
    };
    const io = {
      platform: 'linux',
      credentialsFilePath: () => '/dummy/claude.json',
      readFileRaw: () => {
        importReads++;
        return imported;
      },
      readKeychainRaw() {
        throw Error('Keychain forbidden');
      },
      getKeychainAccountName() {
        throw Error('Keychain forbidden');
      },
      writeFileRaw() {
        throw Error('credential write-back forbidden');
      },
      writeKeychainRaw() {
        throw Error('Keychain forbidden');
      },
    };
    apply(
      host,
      {
        antigravity: { clientId: 'dummy-authorized-client' },
        models: Object.fromEntries(
          ['codex', 'claude', 'grok', 'antigravity', 'copilot'].map((p) => [
            p,
            [{ id: 'dummy-model', name: 'Dummy' }],
          ]),
        ),
        pool: { enabled: false },
      },
      { claudeCredsIo: io },
    );
    async function dispatch(_channel, method, payload = {}) {
      if (method === 'subscriptions-auth.proxyGet') throw Error('HTTP 404');
      calls.push({ method, payload });
      // Exercise cold-run IO latency instead of relying on a warm local filesystem.
      if (
        method === 'waycraft-subscriptions.status' &&
        !live.has('waycraft-subscriptions')
      )
        await delay(100);
      const route = routes.get(`/api/${method}`);
      assert.ok(route, `registered route ${method}`);
      const response = await route.fetch(
        new Request(`http://localhost/api/${method}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            type: 'client-request',
            rpcId: 'dummy',
            method,
            payload,
          }),
        }),
      );
      return (await response.json()).result;
    }
    function rpc(...args) {
      const request = dispatch(...args);
      pendingRpc.add(request);
      request.then(
        () => pendingRpc.delete(request),
        () => pendingRpc.delete(request),
      );
      return request;
    }
    // Await real route/file IO, then flush React effects; effects can enqueue more RPC.
    async function settle() {
      do {
        await act(async () => {
          await Promise.all([...pendingRpc]);
        });
      } while (pendingRpc.size);
    }
    const connection = {
      rpc: { call: rpc },
      state: { subscribe: () => () => {}, getSnapshot: () => 'connected' },
    };
    let api;
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
                      ...options.map((o) =>
                        React.createElement(
                          'button',
                          {
                            key: o.value,
                            disabled,
                            role: 'tab',
                            'aria-selected': value === o.value,
                            onClick: () => onChange(o.value),
                          },
                          o.label,
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
      navigator: {
        clipboard: {
          writeText: async (value) => assert.equal(value, 'DUMMY-CODE'),
        },
      },
      setInterval: (fn) => {
        timers.add(fn);
        return fn;
      },
      clearInterval: (fn) => timers.delete(fn),
      Error,
    });
    const ctx = {
      get: () => connection,
      effect: (fn) => {
        const off = fn();
        if (off) cleanups.push(off);
      },
      locale: {
        register: (_, dictionaries) => {
          dictionary = dictionaries.en;
          return () => {};
        },
        bind: () => (key) => dictionary[key],
      },
      slots: {
        inject: (_, fn) => fn(),
        register: (options, component) => {
          live.set(options.id, component);
          return () => live.delete(options.id);
        },
      },
      inject(names, fn) {
        if (names.includes('remote.settings') || names.includes('commandUi'))
          return;
        return fn(ctx);
      },
    };
    api.applySubscriptions(ctx);
    const status = async () =>
      (await rpc('api', 'waycraft-subscriptions.status')).value.providers[
        provider
      ];
    async function until(predicate, label) {
      for (let i = 0; i < 150; i++) {
        if (await predicate()) return;
        await turn();
      }
      assert.fail(label);
    }
    // A turn count can expire before cold filesystem IO resolves on CI.
    // Wait for the observable registration, not unrelated/rejected reference probes.
    const registrationDeadline = performance.now() + 5000;
    while (
      !live.has('waycraft-subscriptions') &&
      performance.now() < registrationDeadline
    )
      await delay(5);
    assert.equal(
      live.has('waycraft-subscriptions'),
      true,
      'section registration within 5 seconds',
    );
    await act(async () => {
      renderer = create(
        React.createElement(live.get('waycraft-subscriptions')),
        {
          createNodeMock: (node) =>
            node.type === 'button'
              ? {
                  focus() {
                    focused++;
                  },
                }
              : null,
        },
      );
      await turn();
    });
    await settle();
    const buttons = (key) =>
      renderer.root.findAll(
        (n) =>
          n.type === 'button' &&
          (key === 'subscriptionAdd'
            ? n.props.className === 'waycraft-subscription-add-trigger'
            : n.children.join('') ===
              dict[key === 'apiCancel' ? 'cancel' : key]),
      );
    const click = async (key) => {
      const button = buttons(key).at(-1);
      assert.ok(button, key);
      assert.equal(!!button.props.disabled, false, key);
      await act(async () => {
        button.props.onClick();
        await turn();
      });
      await settle();
    };
    const tick = async () => {
      await act(async () => {
        for (const fn of [...timers]) fn();
      });
      await settle();
    };
    const group = () =>
      renderer.root.findAll(
        (n) =>
          n.type === 'li' &&
          n.props['data-waycraft-subscription-row'] === provider,
      );
    return {
      calls,
      denied,
      status,
      until,
      tick,
      click,
      buttons,
      group,
      get renderer() {
        return renderer;
      },
      get focused() {
        return focused;
      },
      get importReads() {
        return importReads;
      },
      set identity(value) {
        identity = value;
      },
      set mode(value) {
        mode = value;
      },
      importCredentials() {
        imported = JSON.stringify({
          claudeAiOauth: {
            accessToken: 'dummy-import',
            refreshToken: 'dummy-refresh',
            expiresAt: 4000000000000,
            emailAddress: `${identity}@example.invalid`,
            scopes: ['user:inference'],
          },
        });
      },
      async open() {
        await click('subscriptionAdd');
        const select = renderer.root
          .findAllByType('select')
          .find((n) => n.props['aria-label'] === dict.apiSubscription);
        await act(async () =>
          select.props.onChange({ target: { value: provider } }),
        );
        await settle();
        if (provider === 'claude') {
          // Official CLI is the preselected Claude access method; these flows exercise Direct sign-in.
          const method = () =>
            renderer.root
              .findAll(
                (n) =>
                  n.type === 'select' && n.props['data-waycraft-access-method'],
              )
              .at(-1);
          // While an attempt is pending the selector is hidden and the pending view owns the flow.
          await until(
            () => !!method() || buttons('cancelLogin').length > 0,
            'Claude access method selector',
          );
          if (method()) {
            await act(async () =>
              method().props.onChange({ target: { value: 'direct' } }),
            );
            await settle();
          }
        }
      },
      async start(key) {
        await click(key ?? 'login');
        await until(
          async () =>
            (await status()).busy || buttons('subscriptionAdd').length === 1,
          'login reached controller',
        );
      },
      async submit(input) {
        const field = renderer.root
          .findAllByType('input')
          .find((n) => n.props['aria-label'] === dict.pasteCallback);
        assert.ok(field, 'manual callback reachable');
        await act(async () =>
          field.props.onChange({ target: { value: input } }),
        );
        await click('submitCallback');
      },
      async complete() {
        if (provider === 'copilot') {
          await until(() => !!release, 'device poll');
          release();
          release = undefined;
        } else {
          const url = new URL((await status()).pendingAuth.authorizeUrl);
          const callback = new URL(url.searchParams.get('redirect_uri'));
          callback.searchParams.set('state', url.searchParams.get('state'));
          callback.searchParams.set('code', 'dummy-code');
          await this.submit(callback.href);
        }
      },
      async holdExchange() {
        mode = 'hold';
        if (provider !== 'copilot') await this.complete();
        await until(() => !!release, 'token exchange held');
      },
      async releaseLate() {
        release?.();
        release = undefined;
        await Promise.all([...exchanges]);
        await turn();
        await settle();
      },
      dispose,
    };
  } catch (error) {
    await dispose();
    throw error;
  }
}

for (const provider of ['codex', 'claude', 'grok', 'antigravity', 'copilot']) {
  test(`${provider}: registered UI admits new and same identities through real host controllers`, async () => {
    const f = await fixture(provider);
    try {
      for (const [identity, count] of [
        ['first', 1],
        ['first', 1],
        ['second', 2],
      ]) {
        f.identity = identity;
        await f.open();
        const prior = await f.status();
        await f.start(
          prior.accounts.length
            ? ['claude', 'grok', 'antigravity'].includes(provider)
              ? 'addAccountOAuth'
              : 'addAccount'
            : 'login',
        );
        await f.complete();
        await f.until(
          async () => !(await f.status()).busy,
          'controller settles',
        );
        await f.tick();
        const status = await f.status();
        assert.equal(
          status.accounts.length,
          count,
          'real persisted admission, including same-identity replacement',
        );
        assert.equal(
          status.authRevision,
          prior.authRevision + 1,
          'controller supplies successful outcome',
        );
        assert.equal(
          f.buttons('subscriptionAdd').length,
          1,
          'real status closes Add',
        );
        assert.equal(f.group().length, 1, 'one configured group');
        assert.ok(
          f
            .group()[0]
            .findAllByType('span')
            .some(
              (n) => n.children.join('') === `${count} ${dict.accountCount}`,
            ),
          'existing group refreshes without remount',
        );
        assert.equal(
          f.group()[0].findAllByType('input').length,
          0,
          'callback exists only in Add',
        );
      }
      assert.ok(
        f.focused >= 3,
        'completion invokes Add focus callback (not DOM focus proof)',
      );
      assert.ok(
        f.calls.some(
          (c) => c.method.endsWith('.login') && c.payload.provider === provider,
        ),
      );
      assert.deepEqual(f.denied, []);
    } finally {
      await f.dispose();
    }
  });
}

for (const provider of ['codex', 'claude', 'grok', 'antigravity', 'copilot']) {
  test(`${provider}: Add cancellation reaches controller and permits reentry after token failure`, async () => {
    const f = await fixture(provider);
    try {
      await f.open();
      const prior = await f.status();
      await f.start();
      await f.click('apiCancel');
      if (provider === 'copilot') await f.releaseLate();
      await f.until(
        async () => !(await f.status()).busy,
        'cancel settles controller',
      );
      assert.ok(
        f.calls.some(
          (c) =>
            c.method.endsWith('.cancel') && c.payload.provider === provider,
        ),
        'Add invokes real cancel route',
      );
      assert.equal(
        f.buttons('subscriptionAdd').length,
        1,
        'cancel restores Add',
      );
      assert.equal((await f.status()).accounts.length, 0);
      assert.equal((await f.status()).authRevision, prior.authRevision);

      await f.open();
      f.mode = 'failure';
      await f.start();
      await f.complete();
      await f.until(
        async () => !(await f.status()).busy,
        'failed token exchange settles',
      );
      await f.tick();
      const failed = await f.status();
      assert.equal(failed.accounts.length, 0, 'token failure never admits');
      assert.equal(failed.authRevision, prior.authRevision);
      assert.ok(failed.detail, 'real controller exposes failure');
      assert.equal(
        f.buttons('subscriptionAdd').length,
        0,
        'failure retains Add flow',
      );
      assert.equal(f.group().length, 0);

      f.mode = 'success';
      await f.start();
      await f.complete();
      await f.until(async () => !(await f.status()).busy, 'recovery settles');
      await f.tick();
      const recovered = await f.status();
      assert.equal(recovered.accounts.length, 1);
      assert.equal(recovered.authRevision, prior.authRevision + 1);
      assert.ok(!recovered.detail, 'successful retry clears failure');
      assert.equal(f.buttons('subscriptionAdd').length, 1);
      assert.equal(f.group().length, 1);
      assert.deepEqual(f.denied, []);
    } finally {
      await f.dispose();
    }
  });

  test(`${provider}: held token completion after Add cancellation cannot admit or close a reentered flow`, async () => {
    const f = await fixture(provider);
    try {
      await f.open();
      const prior = await f.status();
      await f.start();
      await f.holdExchange();
      await f.click('apiCancel');
      assert.equal(f.buttons('subscriptionAdd').length, 1);
      await f.open();
      const focused = f.focused;
      await f.releaseLate();
      await f.until(
        async () => !(await f.status()).busy,
        'cancelled late exchange settles',
      );
      await f.tick();
      const late = await f.status();
      assert.equal(
        late.accounts.length,
        0,
        'late token cannot persist admission',
      );
      assert.equal(late.authRevision, prior.authRevision);
      assert.equal(f.group().length, 0);
      assert.equal(
        f.buttons('subscriptionAdd').length,
        0,
        'late completion cannot close new Add flow',
      );
      assert.equal(
        f.focused,
        focused,
        'late completion cannot invoke success focus callback',
      );
      assert.equal(
        f.renderer.root
          .findAllByType('input')
          .filter((n) => n.props['aria-label'] === dict.pasteCallback).length,
        0,
        'no stale callback UI',
      );
      await f.click('apiCancel');
      assert.equal(f.buttons('subscriptionAdd').length, 1);
      assert.deepEqual(f.denied, []);
    } finally {
      await f.dispose();
    }
  });
}

test('claude: actual Add imports existing CLI credentials through injected IO, including same identity', async () => {
  const f = await fixture('claude');
  try {
    f.importCredentials();
    for (const [key, revision] of [
      ['login', 1],
      ['addAccountKeychain', 2],
    ]) {
      await f.open();
      await f.click(key);
      await f.tick();
      const imported = await f.status();
      assert.equal(imported.accounts.length, 1);
      assert.equal(imported.authRevision, revision);
      assert.equal(imported.busy, false);
      assert.equal(f.buttons('subscriptionAdd').length, 1);
      assert.equal(f.group().length, 1);
      assert.ok(
        f
          .group()[0]
          .findAllByType('span')
          .some((n) => n.children.join('') === `1 ${dict.accountCount}`),
      );
    }
    assert.ok(f.importReads >= 2, 'genuine injected credential IO read');
    assert.ok(
      f.calls.some(
        (c) => c.method.endsWith('.login') && c.payload.method === 'keychain',
      ),
    );
    assert.deepEqual(f.denied, []);
  } finally {
    await f.dispose();
  }
});
