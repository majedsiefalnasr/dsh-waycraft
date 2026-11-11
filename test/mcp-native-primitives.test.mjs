import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const React = require('react');
const Renderer = require('react-test-renderer');
const ts = require('typescript');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
test('MCP delegates tooltip, actions and transient feedback to public native primitives', async () => {
  const seen = { tooltip: [], menu: [], toast: [] };
  const primitives = {
    Tooltip: (p) => {
      seen.tooltip.push(p);
      return p.children;
    },
    Menu: (p) => {
      seen.menu.push(p);
      return React.createElement(
        React.Fragment,
        null,
        p.anchor,
        p.open
          ? React.createElement(
              'button',
              { onClick: () => p.onSelect('0') },
              p.items[0].label,
            )
          : null,
      );
    },
    Toast: (p) => {
      seen.toast.push(p);
      return React.createElement('span', { role: 'status' }, p.text);
    },
  };
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(new URL('../src/mcp-browser.ts', import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    console,
    require: (id) =>
      id === 'react'
        ? React
        : id === '@deepseek-ai/dsh-client-ui-primitives'
          ? primitives
          : require(id),
    setTimeout,
    clearTimeout,
    fetch: async (_url, options) => {
      const action = JSON.parse(options.body).action;
      return {
        ok: true,
        status: 200,
        json: async () =>
          action === 'list'
            ? {
                ok: true,
                fingerprint: 'fp',
                servers: [
                  {
                    serverName: 'demo',
                    config: { transport: 'stdio', command: 'node' },
                    trust: { state: 'untrusted' },
                  },
                ],
                trashedServers: [],
              }
            : { ok: true },
      };
    },
  });
  let Section;
  const dict = {};
  const ctx = {
    effect: (f) => f(),
    locale: {
      register: (_n, d) => Object.assign(dict, d),
      bind: () => (k) => dict.en[k] || k,
      language: { getSnapshot: () => 'en' },
    },
    slots: {
      inject: (_n, f) => f(),
      register: (_s, c) => {
        Section = c;
        return () => {};
      },
    },
  };
  exports.applyMcp({ inject: (_n, f) => f(ctx) });
  await new Promise((r) => setTimeout(r, 0));
  let renderer;
  await Renderer.act(async () => {
    renderer = Renderer.create(React.createElement(Section));
  });
  assert.ok(
    seen.tooltip.some((p) => p.label === 'Refresh servers' && p.portal),
  );
  assert.ok(seen.tooltip.every((p) => p.children.props.title === undefined));
  const menu = seen.menu.at(-1);
  assert.equal(menu.autoFocus, true);
  assert.equal(menu.portal, true);
  assert.ok(menu.items.some((p) => p.label === 'Move to Trash' && p.danger));
  assert.equal(menu.listClassName, undefined, 'native menu owns its geometry');
  await Renderer.act(async () => {
    menu.onSelect(
      String(
        menu.items.findIndex((p) => p.label === 'Approve reviewed config'),
      ),
    );
  });
  assert.ok(seen.toast.length > 0, 'successful action uses native Toast');
  assert.equal(seen.toast.at(-1).tone, 'success');
  assert.equal(seen.toast.at(-1).holdMs, 5000);
  await Renderer.act(async () => renderer.unmount());
});
