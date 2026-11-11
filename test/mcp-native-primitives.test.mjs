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
async function mountMcp(primitives) {
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
    fetch: async (_url, options) => ({
      ok: true,
      status: 200,
      json: async () =>
        JSON.parse(options.body).action === 'list'
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
    }),
  });
  let Section;
  const dict = {};
  exports.applyMcp({
    inject: (_n, f) =>
      f({
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
      }),
  });
  await new Promise((r) => setTimeout(r, 0));
  let renderer;
  await Renderer.act(async () => {
    renderer = Renderer.create(React.createElement(Section));
  });
  return renderer;
}

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
  const renderer = await mountMcp(primitives);
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

test('MCP registers Add, Import and Confirm with the native modal layer and current dirty-close callbacks', async () => {
  const layers = new Map();
  const renderer = await mountMcp({
    useModalLayer(ref, open, onClose) {
      const close = React.useRef(onClose);
      close.current = onClose;
      React.useLayoutEffect(() => {
        const layer = { ref, open, close: () => close.current() };
        layers.set(ref, layer);
        return () => layers.delete(ref);
      }, [ref, open]);
    },
  });
  const root = renderer.root;
  const click = async (node) => Renderer.act(async () => node.props.onClick());
  const button = (label) =>
    root
      .findAllByType('button')
      .find(
        (n) => n.props['aria-label'] === label || n.children.join('') === label,
      );
  const active = () => [...layers.values()].filter((l) => l.open);
  const close = async (layer) => Renderer.act(async () => layer.close());
  const dialog = () =>
    root.findByProps({ 'aria-labelledby': 'waycraft-mcp-dialog-title' });
  const confirm = () => root.findByProps({ role: 'alertdialog' });
  try {
    await click(button('Add server'));
    assert.equal(
      active().length,
      1,
      'Add must register with the shared host modal stack',
    );
    assert.equal(
      dialog().props.onKeyDown,
      undefined,
      'native hook exclusively owns keyboard handling',
    );
    const addLayer = active()[0];
    await Renderer.act(async () =>
      dialog()
        .findAllByType('input')[0]
        .props.onInput({ target: { value: 'draft' } }),
    );
    await close(addLayer);
    assert.ok(
      confirm(),
      'callback retained at mount sees the current dirty form',
    );
    assert.equal(
      layers.get(addLayer.ref).open,
      false,
      'parent yields while discard confirmation is open',
    );
    assert.equal(
      active().length,
      1,
      'only the discard confirmation owns input',
    );
    assert.equal(confirm().props.onKeyDown, undefined);
    await close(active()[0]);
    assert.equal(root.findAllByProps({ role: 'alertdialog' }).length, 0);
    assert.equal(active().length, 1, 'cancel discard reactivates Add');
    await close(active()[0]);
    await click(button('Discard'));
    assert.equal(active().length, 0, 'confirm discard closes both layers');

    await click(button('Add server'));
    await close(active()[0]);
    assert.equal(
      active().length,
      0,
      'clean Add closes without a discard prompt',
    );

    await click(button('Import MCP configuration'));
    assert.equal(
      active().length,
      1,
      'Import must register with the shared stack',
    );
    const importLayer = active()[0];
    const importDialog = root.findByProps({
      'aria-labelledby': 'waycraft-mcp-import-title',
    });
    assert.equal(importDialog.props.onKeyDown, undefined);
    await Renderer.act(async () =>
      importDialog
        .findByType('textarea')
        .props.onInput({ target: { value: '{}' } }),
    );
    await close(importLayer);
    assert.ok(confirm(), 'Import close sees text entered after mount');
    assert.equal(
      layers.get(importLayer.ref).open,
      false,
      'suspended Import yields to confirmation',
    );
    assert.equal(active().length, 1);
    await close(active()[0]);
    assert.equal(active().length, 1, 'cancel discard reactivates Import');
    await Renderer.act(async () =>
      root
        .findByProps({ 'aria-labelledby': 'waycraft-mcp-import-title' })
        .findByType('textarea')
        .props.onInput({ target: { value: '' } }),
    );
    await close(importLayer);
    assert.equal(
      active().length,
      0,
      'latest clean Import state closes without confirmation',
    );
  } finally {
    await Renderer.act(async () => renderer.unmount());
  }
  assert.equal(layers.size, 0, 'all native registrations clean up');
});
