// #186: the Claude card says what the managers give an Official CLI session: the MCP manager's state and the servers it
// leaves out (names and reasons only), and the skills that ship inside a CLI plugin. Real card, fake RPC, en and ar.
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
const dictionary = (locale) =>
  JSON.parse(readFileSync(`locale/${locale}.json`, 'utf8')).subscriptions;
const text = (node) =>
  typeof node === 'string' ? node : (node?.children ?? []).map(text).join('');

async function mount(locale, cliGovernance) {
  const words = dictionary(locale);
  const t = (key) => words[key] ?? `MISSING:${key}`;
  const Card = createClaudeCard(
    React,
    {},
    {
      async call(_path, method) {
        return {
          ok: true,
          value: method.endsWith('.status')
            ? {
                providers: {
                  claude: {
                    accounts: [],
                    busy: false,
                    cliSettings: { cliMaxConcurrent: 4 },
                    ...(cliGovernance ? { cliGovernance } : {}),
                  },
                },
              }
            : { available: false },
        };
      },
    },
    t,
  );
  let page;
  await act(async () => {
    page = Renderer.create(
      React.createElement(Card, { initialExpanded: true }),
    );
  });
  return { page, words };
}

const reasons = [
  ['disabled', 'cliMcpReasonDisabled'],
  ['untrusted', 'cliMcpReasonUntrusted'],
  ['changed', 'cliMcpReasonChanged'],
  ['needs-credential', 'cliMcpReasonNeedsCredential'],
  ['unsupported', 'cliMcpReasonUnsupported'],
];

for (const locale of ['en', 'ar']) {
  test(`${locale}: the card names each MCP server left out of CLI sessions with its reason`, async () => {
    const { page, words } = await mount(locale, {
      mcp: {
        state: 'ok',
        included: ['alpha'],
        excluded: reasons.map(([reason], index) => ({
          serverName: `server-${index}`,
          reason,
        })),
      },
      pluginSkills: [],
    });
    try {
      const panel = page.root.findAllByProps({
        'data-waycraft-cli-governance': true,
      });
      assert.ok(panel.length > 0, 'the governance panel is shown');
      assert.ok(text(page.toJSON()).includes(words.cliGovernanceTitle));
      reasons.forEach(([, key], index) => {
        assert.ok(words[key], `${key} has copy in ${locale}`);
        const row = page.root
          .findAll(
            (node) =>
              typeof node.type === 'string' &&
              node.props['data-waycraft-cli-mcp-excluded'] ===
                `server-${index}`,
          )
          .map((node) => text(node))
          .join('');
        assert.ok(row.includes(`server-${index}`), 'the server is named');
        assert.ok(row.includes(words[key]), `${key} is its reason`);
      });
      const given = page.root
        .findAll(
          (node) =>
            typeof node.type === 'string' &&
            node.props['data-waycraft-cli-mcp-included'] !== undefined,
        )
        .map((node) => text(node))
        .join('');
      assert.ok(given.includes('1'), 'the number of servers given is shown');
    } finally {
      await act(async () => page.unmount());
    }
  });

  test(`${locale}: an MCP manager that is off or cannot be read is said so plainly`, async () => {
    for (const [state, key] of [
      ['component-off', 'cliMcpManagerOff'],
      ['unreadable', 'cliMcpManagerUnreadable'],
    ]) {
      const { page, words } = await mount(locale, {
        mcp: { state, included: [], excluded: [] },
        pluginSkills: [],
      });
      try {
        assert.ok(words[key], `${key} has copy in ${locale}`);
        assert.ok(text(page.toJSON()).includes(words[key]), `${state}: ${key}`);
      } finally {
        await act(async () => page.unmount());
      }
    }
  });

  test(`${locale}: skills that ship inside a CLI plugin are marked as following the plugin`, async () => {
    const { page, words } = await mount(locale, {
      mcp: { state: 'ok', included: [], excluded: [] },
      pluginSkills: [
        { plugin: 'tools', skill: 'review' },
        { plugin: 'tools', skill: 'deploy' },
      ],
    });
    try {
      const shown = text(page.toJSON());
      assert.ok(words.cliPluginSkillsNote, `copy exists in ${locale}`);
      assert.ok(shown.includes(words.cliPluginSkillsNote));
      assert.ok(
        shown.includes('tools') &&
          shown.includes('review') &&
          shown.includes('deploy'),
      );
    } finally {
      await act(async () => page.unmount());
    }
  });
}

test('without governance data from the host the card shows no governance panel', async () => {
  const { page } = await mount('en', undefined);
  try {
    assert.equal(
      page.root.findAllByProps({ 'data-waycraft-cli-governance': true }).length,
      0,
    );
  } finally {
    await act(async () => page.unmount());
  }
});
