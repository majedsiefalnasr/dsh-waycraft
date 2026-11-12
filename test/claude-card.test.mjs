// the Claude Settings card renders in English and Arabic and drives the owned RPC with fake data only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
const source = await readFile(
  new URL('../src/claude-card.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const presentation = {};
const presentationSource = await readFile(
  new URL('../src/codex-card.ts', import.meta.url),
  'utf8',
);
vm.runInNewContext(
  ts.transpileModule(presentationSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { exports: presentation, require: () => ({}) },
);
const requireText = (locale) =>
  readFileSync(new URL(`../locale/${locale}.json`, import.meta.url), 'utf8');
function fixture(
  locale,
  status,
  respond,
  open = () => ({ location: {}, close() {} }),
) {
  const dictionary = JSON.parse(requireText(locale)).subscriptions;
  let cursor = 0,
    effects = [],
    view;
  const slots = [],
    calls = [],
    cleanups = [];
  const React = {
    createElement: (tag, props, ...children) => ({
      tag,
      props: props ?? {},
      children,
    }),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (value) => {
          slots[index] =
            typeof value === 'function' ? value(slots[index]) : value;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      return (slots[index] ??= { current: initial });
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) {
        slots[index] = deps;
        effects.push(fn);
      }
    },
  };
  const exports = {};
  const shared = { ...presentation, ProviderAccountManager: 'ManageFixture' };
  vm.runInNewContext(compiled, {
    exports,
    require: () => shared,
    window: { open },
    setInterval: () => 1,
    clearInterval() {},
    Date,
    Error,
    JSON,
    Object,
  });
  const rpc = {
    async call(_, method, payload) {
      calls.push({ method, payload });
      const endpoint = method.split('.').pop();
      if (respond) {
        const result = await respond(endpoint, payload);
        if (result) return result;
      }
      if (endpoint === 'status')
        return { ok: true, value: { providers: { claude: status } } };
      if (endpoint === 'usage')
        return {
          ok: true,
          value: {
            supported: true,
            windows: [
              { kind: 'session', usedPercent: 40, resetsAt: 2000000000000 },
            ],
          },
        };
      return { ok: true, value: { ok: true } };
    },
  };
  const Card = exports.createClaudeCard(
    React,
    {},
    rpc,
    (key) => dictionary[key],
  );
  const render = () => {
    cursor = 0;
    view = Card();
    const pending = effects;
    effects = [];
    pending.forEach((fn) => {
      const cleanup = fn();
      if (cleanup) cleanups.push(cleanup);
    });
    return view;
  };
  const settle = async () => {
    for (let frame = 0; frame < 4; frame++) {
      for (let i = 0; i < 12; i++) await Promise.resolve();
      render();
    }
  };
  const nodes = (node = view) => [
    node,
    ...(node?.children
      ?.flat(Infinity)
      .flatMap((child) =>
        typeof child === 'object' && child ? nodes(child) : [],
      ) ?? []),
  ];
  const text = (node) =>
    node?.tag === 'style'
      ? ''
      : typeof node === 'string' || typeof node === 'number'
        ? String(node)
        : (node?.children?.flat(Infinity).map(text).join(' ') ?? '');
  return {
    render,
    settle,
    nodes,
    textOf: text,
    unmount: () => cleanups.reverse().forEach((fn) => fn()),
    text: () => text(view),
    calls,
    dictionary,
    click(key) {
      const button = nodes().find(
        (node) => node.tag === 'button' && text(node) === dictionary[key],
      );
      assert.ok(button, `button ${key}`);
      button.props.onClick();
    },
    has(key) {
      return nodes().some(
        (node) => node.tag === 'button' && text(node) === dictionary[key],
      );
    },
  };
}
test('Claude account setup defaults to the capability-declared Official CLI method', async () => {
  const page = fixture('en', {
    busy: false,
    accounts: [],
    capabilities: {
      defaultAccessMethod: 'official-cli',
      accessMethods: [
        {
          id: 'official-cli',
          warning: {
            level: 'info',
            text: 'claudeOfficialCliWarning',
            source: 'https://code.claude.com/docs/en/legal-and-compliance',
            lastReviewed: '2026-11-11',
          },
        },
        {
          id: 'direct',
          warning: {
            level: 'danger',
            text: 'claudeDirectWarning',
            source: 'https://code.claude.com/docs/en/legal-and-compliance',
            lastReviewed: '2026-11-11',
          },
        },
      ],
    },
  });
  try {
    page.render();
    await page.settle();
    const selector = page
      .nodes()
      .find(
        (node) =>
          node.tag === 'select' && node.props['data-waycraft-access-method'],
      );
    assert.ok(selector);
    assert.equal(selector.props.value, 'official-cli');
    page.click('login');
    await page.settle();
    assert.equal(
      page.calls.filter((call) => call.method.endsWith('.login'))[0].payload
        .method,
      'official-cli',
    );
    assert.ok(page.text().includes('2026-11-11'));
    assert.ok(
      page
        .nodes()
        .some(
          (node) =>
            node.tag === 'a' &&
            node.props.href ===
              'https://code.claude.com/docs/en/legal-and-compliance',
        ),
    );
  } finally {
    page.unmount();
  }
});

test('Claude account cards identify the stored access method', async () => {
  const page = fixture('en', {
    busy: false,
    accounts: [
      {
        key: 'cli-account',
        account: 'fixture@example.test',
        accessMethod: 'official-cli',
        cliPath: '/fixture/bin/claude',
        cliVersion: '2.1.322',
      },
    ],
    capabilities: {
      defaultAccessMethod: 'official-cli',
      accessMethods: [
        {
          id: 'official-cli',
          warning: {
            level: 'info',
            text: 'claudeOfficialCliWarning',
            source: 'https://code.claude.com/docs/en/legal-and-compliance',
            lastReviewed: '2026-11-11',
          },
        },
      ],
    },
  });
  try {
    page.render();
    await page.settle();
    assert.ok(page.text().includes(page.dictionary.officialCli));
    assert.ok(page.text().includes('/fixture/bin/claude'));
    assert.ok(page.text().includes('2.1.322'));
    assert.ok(page.text().includes(page.dictionary.claudeOfficialCliWarning));
    assert.ok(page.text().includes(page.dictionary.warningInfo));
    assert.ok(page.text().includes(page.dictionary.cliApiKeysRemoved));
    assert.equal(
      page.calls.some(
        (call) =>
          call.method.endsWith('.usage') &&
          call.payload.account === 'cli-account',
      ),
      false,
    );
    assert.equal(page.has('refreshUsage'), false);
    const logout = page
      .nodes()
      .find(
        (node) =>
          node.tag === 'button' && page.textOf(node) === page.dictionary.logout,
      );
    assert.equal(logout.props.disabled, true);
    const defaultButton = page
      .nodes()
      .find(
        (node) =>
          node.tag === 'button' &&
          node.props['aria-label'] === page.dictionary.makeDefault,
      );
    assert.equal(defaultButton.props.disabled, false);
    assert.equal(page.has('addAccountKeychain'), false);
    assert.equal(
      page.text().includes(page.dictionary.claudeAddAccountHint),
      false,
    );
  } finally {
    page.unmount();
  }
});

test('Claude drops the terminal and reports the error when the attempt is gone on the host', async () => {
  const page = fixture(
    'en',
    {
      busy: false,
      accounts: [],
      capabilities: { defaultAccessMethod: 'official-cli', accessMethods: [] },
    },
    async (endpoint) =>
      endpoint === 'login'
        ? { ok: true, value: { loginId: 'gone-login' } }
        : endpoint === 'cliRead'
          ? { ok: false, error: { message: 'Claude CLI login is not active' } }
          : undefined,
  );
  try {
    page.render();
    await page.settle();
    page.click('login');
    await page.settle();
    page.render();
    assert.equal(
      page.nodes().some((node) => node.props['data-waycraft-cli-terminal']),
      false,
    );
    assert.ok(page.text().includes('Claude CLI login is not active'));
  } finally {
    page.unmount();
  }
});

test('A legacy account without a stored access method shows Direct sign-in and its warning', async () => {
  const warning = (level, text) => ({
    level,
    text,
    source: 'https://code.claude.com/docs/en/legal-and-compliance',
    lastReviewed: '2026-11-11',
  });
  const page = fixture('en', {
    busy: false,
    accounts: [{ key: 'legacy', account: 'legacy@example.test', plan: 'pro' }],
    capabilities: {
      defaultAccessMethod: 'official-cli',
      accessMethods: [
        {
          id: 'official-cli',
          warning: warning('info', 'claudeOfficialCliWarning'),
        },
        { id: 'direct', warning: warning('danger', 'claudeDirectWarning') },
      ],
    },
  });
  try {
    page.render();
    await page.settle();
    const card = page.text();
    assert.ok(card.includes(page.dictionary.directSignIn));
    assert.ok(card.includes(page.dictionary.claudeDirectWarning));
    assert.ok(card.includes(page.dictionary.warningDanger));
    assert.ok(card.includes('legacy@example.test'));
  } finally {
    page.unmount();
  }
});

test('Claude reports a failed CLI login without discarding its terminal output', async () => {
  const page = fixture(
    'en',
    {
      busy: false,
      accounts: [],
      capabilities: {
        defaultAccessMethod: 'official-cli',
        accessMethods: [],
      },
    },
    async (endpoint) =>
      endpoint === 'login'
        ? { ok: true, value: { loginId: 'failed-login' } }
        : endpoint === 'cliRead'
          ? {
              ok: true,
              value: { state: 'failed', output: 'fixture login declined' },
            }
          : undefined,
  );
  try {
    page.render();
    await page.settle();
    page.click('login');
    await page.settle();
    assert.ok(page.text().includes(page.dictionary.cliLoginFailed));
    assert.ok(page.text().includes('fixture login declined'));
  } finally {
    page.unmount();
  }
});

test('Claude releases a successful CLI terminal before clearing its presentation', async () => {
  const page = fixture(
    'en',
    {
      busy: false,
      accounts: [],
      capabilities: {
        defaultAccessMethod: 'official-cli',
        accessMethods: [],
      },
    },
    async (endpoint) =>
      endpoint === 'login'
        ? { ok: true, value: { loginId: 'completed-login' } }
        : endpoint === 'cliRead'
          ? { ok: true, value: { state: 'authenticated', output: '' } }
          : undefined,
  );
  try {
    page.render();
    await page.settle();
    page.click('login');
    await page.settle();
    assert.ok(
      page.calls.some(
        (call) =>
          call.method.endsWith('.cliCancel') &&
          call.payload.loginId === 'completed-login',
      ),
    );
  } finally {
    page.unmount();
  }
});

test('Claude retains an active Official CLI login for embedded terminal presentation', async () => {
  const page = fixture(
    'en',
    {
      busy: false,
      accounts: [],
      capabilities: {
        defaultAccessMethod: 'official-cli',
        accessMethods: [],
      },
    },
    async (endpoint) =>
      endpoint === 'login'
        ? {
            ok: true,
            value: {
              state: 'authenticating',
              loginId: 'fixture-login',
              path: '/fixture/bin/claude',
              version: '2.1.322',
            },
          }
        : undefined,
  );
  try {
    page.render();
    await page.settle();
    page.click('login');
    await page.settle();
    assert.ok(
      page.nodes().some((node) => node.props['data-waycraft-cli-terminal']),
    );
    assert.ok(page.text().includes('/fixture/bin/claude'));
    assert.ok(page.text().includes('2.1.322'));
    assert.ok(
      page.calls.some(
        (call) =>
          call.method.endsWith('.cliRead') &&
          call.payload.loginId === 'fixture-login',
      ),
    );
    const input = page
      .nodes()
      .find((node) => node.props['data-waycraft-cli-input']);
    assert.ok(input);
    input.props.onKeyDown({ key: 'Enter', preventDefault() {} });
    await page.settle();
    assert.ok(
      page.calls.some(
        (call) =>
          call.method.endsWith('.cliInput') && call.payload.data === '\r',
      ),
    );
    page.click('cancelLogin');
    await page.settle();
    assert.ok(
      page.calls.some(
        (call) =>
          call.method.endsWith('.cliCancel') &&
          call.payload.loginId === 'fixture-login',
      ),
    );
  } finally {
    page.unmount();
  }
});

test('Claude shows installation guidance when Official CLI is missing', async () => {
  const page = fixture(
    'en',
    {
      busy: false,
      accounts: [],
      capabilities: {
        defaultAccessMethod: 'official-cli',
        accessMethods: [],
      },
    },
    async (endpoint) =>
      endpoint === 'login'
        ? {
            ok: true,
            value: {
              available: false,
              installCommand: 'fixture-install-claude',
              source: 'https://code.claude.com/docs/en/setup',
            },
          }
        : undefined,
  );
  try {
    page.render();
    await page.settle();
    page.click('login');
    await page.settle();
    assert.ok(page.text().includes('fixture-install-claude'));
  } finally {
    page.unmount();
  }
});

test('Claude hides the access selector when the provider declares only one method', async () => {
  const page = fixture('en', {
    busy: false,
    accounts: [],
    capabilities: {
      defaultAccessMethod: 'official-cli',
      accessMethods: [
        {
          id: 'official-cli',
          warning: {
            level: 'info',
            text: 'claudeOfficialCliWarning',
            source: 'https://code.claude.com/docs/en/legal-and-compliance',
            lastReviewed: '2026-11-11',
          },
        },
      ],
    },
  });
  try {
    page.render();
    await page.settle();
    assert.equal(
      page.nodes().some((node) => node.props['data-waycraft-access-method']),
      false,
    );
    page.click('login');
    await page.settle();
    assert.equal(
      page.calls.filter((call) => call.method.endsWith('.login'))[0].payload
        .method,
      'official-cli',
    );
  } finally {
    page.unmount();
  }
});

const loginCalls = (page) =>
  page.calls.filter((call) => call.method.endsWith('.login'));

for (const locale of ['en', 'ar'])
  test(`Claude card groups identity, account controls and usage with its own data attributes in ${locale}`, async () => {
    const page = fixture(locale, {
      busy: false,
      accounts: [
        {
          key: 'a',
          account: 'fixture@example.test',
          plan: 'max',
          isDefault: true,
          expiresAt: 2000000000000,
        },
      ],
      clientVersion: { version: '2.1.0', source: 'fallback' },
    });
    page.render();
    await page.settle();
    assert.equal(
      page.nodes().some((n) => n.props['data-waycraft-claude-card']),
      true,
    );
    assert.equal(
      page
        .nodes()
        .some(
          (n) =>
            n.props['data-waycraft-codex-card'] ||
            n.props['data-waycraft-codex-part'],
        ),
      false,
      'no Codex attributes leak into the Claude card',
    );
    const group = (name) =>
      page.nodes().find((n) => n.props['data-waycraft-claude-part'] === name);
    assert.match(page.textOf(group('header')), /Claude.*2\.1\.0/);
    assert.equal(
      page.nodes(group('account-header')).filter((n) => n.tag === 'button')
        .length,
      2,
    );
    assert.match(page.text(), /fixture@example.test/);
    assert.match(page.text(), /max/);
    assert.match(page.text(), /40%/);
    assert.ok(page.text().includes(page.dictionary.connected));
    // With a connected account both ways of adding another one are offered, and each carries its translated label.
    assert.equal(page.has('addAccountOAuth'), true);
    assert.equal(page.has('addAccountKeychain'), true);
    assert.notEqual(page.dictionary.addAccountOAuth, 'addAccountOAuth');
    if (locale === 'ar')
      assert.match(page.dictionary.addAccountKeychain, /[\u0600-\u06ff]/);
    assert.ok(
      page.calls.every((call) => call.payload.provider === 'claude'),
      'every call names the claude provider',
    );
  });

test('with no account the single login button asks for the import-first path (no method)', async () => {
  const page = fixture('en', { busy: false, accounts: [] });
  page.render();
  await page.settle();
  assert.ok(page.text().includes(page.dictionary.notLoggedIn));
  assert.equal(page.has('addAccountOAuth'), false);
  page.click('login');
  await page.settle();
  assert.deepEqual(
    loginCalls(page).map((call) => JSON.parse(JSON.stringify(call.payload))),
    [{ provider: 'claude' }],
  );
});

test('the account buttons send the explicit method values the server validates', async () => {
  const page = fixture('en', { busy: false, accounts: [{ key: 'a' }] });
  page.render();
  await page.settle();
  page.click('addAccountOAuth');
  await page.settle();
  page.click('addAccountKeychain');
  await page.settle();
  assert.deepEqual(
    loginCalls(page).map((call) => call.payload.method),
    ['oauth', 'keychain'],
  );
});

test('an imported login (empty authorize URL) opens no window and refreshes status', async () => {
  const opened = [];
  const status = { busy: false, accounts: [] };
  const page = fixture(
    'en',
    status,
    (endpoint) => {
      if (endpoint === 'login') {
        status.accounts = [{ key: 'a', account: 'imported@example.test' }];
        return { ok: true, value: { authorizeUrl: '' } };
      }
    },
    (...args) => {
      opened.push(args);
      return null;
    },
  );
  page.render();
  await page.settle();
  page.click('login');
  await page.settle();
  assert.deepEqual(opened, []);
  assert.match(page.text(), /imported@example.test/);
  assert.equal(
    page.nodes().some((n) => n.tag === 'a'),
    false,
  );
});

test('browser authorization opens the returned URL after the RPC with noopener, then cancel clears it', async () => {
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const status = { busy: false, accounts: [] };
  const opened = [];
  const authorizeUrl = 'https://authorization.example.test/claude?state=fake';
  const page = fixture(
    'en',
    status,
    (endpoint) => {
      if (endpoint === 'login') return pending;
      if (endpoint === 'cancel') status.busy = false;
    },
    (...args) => {
      opened.push(args);
      return null;
    },
  );
  try {
    page.render();
    await page.settle();
    page.click('login');
    await page.settle();
    assert.deepEqual(opened, [], 'no early or blank window');
    status.busy = true;
    release({ ok: true, value: { authorizeUrl } });
    await page.settle();
    assert.deepEqual(opened, [[authorizeUrl, '_blank', 'noopener']]);
    const link = page.nodes().find((n) => n.tag === 'a');
    assert.equal(link.props.href, authorizeUrl);
    assert.equal(link.props.rel, 'noopener noreferrer');
    assert.ok(page.text().includes(page.dictionary.loginProgress));
    page.click('cancelLogin');
    await page.settle();
    assert.equal(
      page.calls.filter((c) => c.method.endsWith('.cancel')).length,
      1,
    );
    assert.equal(opened.length, 1);
  } finally {
    release({ ok: false, error: { message: 'cleanup' } });
    page.unmount();
  }
});

test('a failed login shows its message and opens nothing; an unmounted card does not navigate', async () => {
  const opened = [];
  const failing = fixture(
    'en',
    { busy: false, accounts: [] },
    (endpoint) =>
      endpoint === 'login'
        ? { ok: false, error: { message: 'no Claude Code credentials found' } }
        : undefined,
    (...args) => {
      opened.push(args);
      return null;
    },
  );
  failing.render();
  await failing.settle();
  failing.click('login');
  await failing.settle();
  assert.equal(
    failing.nodes().find((n) => n.props.role === 'alert').children[0],
    'no Claude Code credentials found',
  );
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const page = fixture(
    'en',
    { busy: false, accounts: [] },
    (endpoint) => (endpoint === 'login' ? pending : undefined),
    (...args) => {
      opened.push(args);
      return null;
    },
  );
  page.render();
  await page.settle();
  page.click('login');
  await page.settle();
  page.unmount();
  release({
    ok: true,
    value: { authorizeUrl: 'https://authorization.example.test/late' },
  });
  for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.deepEqual(opened, []);
});

test('a collision shows the concise Claude unavailable status and disables login', async () => {
  const page = fixture('en', { busy: false, accounts: [] }, (endpoint) =>
    endpoint === 'status'
      ? {
          ok: true,
          value: {
            providers: { claude: { busy: false, accounts: [] } },
            claudeRegistrationError: 'Claude registration is unavailable',
          },
        }
      : undefined,
  );
  page.render();
  await page.settle();
  assert.ok(page.text().includes(page.dictionary.claudeProviderUnavailable));
  assert.equal(
    page
      .nodes()
      .find(
        (n) => n.tag === 'button' && page.textOf(n) === page.dictionary.login,
      ).props.disabled,
    true,
  );
});

test('a status without a Claude entry (component older than the card) still renders as not logged in', async () => {
  const page = fixture('en', undefined, (endpoint) =>
    endpoint === 'status'
      ? { ok: true, value: { providers: { codex: { accounts: [] } } } }
      : undefined,
  );
  page.render();
  await page.settle();
  assert.ok(page.text().includes(page.dictionary.notLoggedIn));
});

test('confirmed logout waits for confirmation and sends only the chosen account', async () => {
  const page = fixture('en', {
    busy: false,
    accounts: [{ key: 'a', account: 'fake@example.test' }],
  });
  page.render();
  await page.settle();
  page.click('logout');
  page.render();
  assert.equal(
    page.calls.some((c) => c.method.endsWith('.logout')),
    false,
    'logout waits for confirmation',
  );
  const dialog = page.nodes().find((n) => n.props.role === 'dialog');
  page
    .nodes(dialog)
    .find(
      (n) => n.tag === 'button' && n.children.includes(page.dictionary.logout),
    )
    .props.onClick();
  await page.settle();
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        page.calls.find((c) => c.method.endsWith('.logout')).payload,
      ),
    ),
    { provider: 'claude', account: 'a' },
  );
});

test('the card does not render reset-credit controls (Codex only) and Manage opens the Claude manager', async () => {
  const page = fixture('en', { busy: false, accounts: [{ key: 'a' }] });
  page.render();
  await page.settle();
  assert.equal(
    page
      .nodes()
      .some(
        (n) => n.tag === 'details' && /reset/.test(n.props.className ?? ''),
      ),
    false,
  );
  page.click('accountsManage');
  page.render();
  const manager = page.nodes().find((n) => n.tag === 'ManageFixture');
  assert.equal(manager.props.provider, 'claude');
});

for (const locale of ['en', 'ar']) {
  test(`Claude card tells the Owner to update an outdated CLI with the official command (${locale})`, async () => {
    const cli = (version, updateRequired) => ({ version, minimumVersion: '2.0.0', updateRequired, updateCommand: 'claude update', source: 'https://code.claude.com/docs/en/setup' });
    const status = (state) => ({
      busy: false,
      accounts: [{ key: 'cli-account', account: 'fixture@example.test', accessMethod: 'official-cli', cliPath: '/fixture/bin/claude', cliVersion: '1.9.4' }],
      capabilities: { defaultAccessMethod: 'official-cli', accessMethods: [] },
      cli: state,
    });
    const outdated = fixture(locale, status(cli('1.9.4', true)));
    try {
      outdated.render();
      await outdated.settle();
      const text = outdated.text();
      assert.ok(text.includes(outdated.dictionary.cliUpdateRequired));
      assert.ok(text.includes('claude update'));
      assert.ok(text.includes('1.9.4') && text.includes('2.0.0'));
    } finally {
      outdated.unmount();
    }
    const current = fixture(locale, status(cli('2.1.322', false)));
    try {
      current.render();
      await current.settle();
      assert.equal(current.text().includes(current.dictionary.cliUpdateRequired), false);
    } finally {
      current.unmount();
    }
  });
}

test('Claude card explains an outdated CLI instead of reporting it missing when sign-in is refused', async () => {
  const page = fixture(
    'en',
    { busy: false, accounts: [], capabilities: { defaultAccessMethod: 'official-cli', accessMethods: [] } },
    async (endpoint) =>
      endpoint === 'login'
        ? { ok: true, value: { available: false, updateRequired: true, version: '1.9.4', minimumVersion: '2.0.0', installCommand: 'claude update', source: 'https://code.claude.com/docs/en/setup' } }
        : undefined,
  );
  try {
    page.render();
    await page.settle();
    page.click('login');
    await page.settle();
    assert.ok(page.text().includes(page.dictionary.cliUpdateRequired));
    assert.ok(page.text().includes('claude update'));
    assert.equal(page.text().includes(page.dictionary.claudeCliMissing), false);
  } finally {
    page.unmount();
  }
});
