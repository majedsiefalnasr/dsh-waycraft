import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
// Use React + react-test-renderer from the same dependency tree to avoid dual-React dispatcher issues.
const rendererBase = '/Users/majedsiefalnasr/Documents/Work/DeepSeek Harness/dsh-majed/.agents/worktrees/impl/146-skill-manager/node_modules';
const React = (await import(pathToFileURL(`${rendererBase}/react/index.js`).href)).default;
const Rtr = await import(pathToFileURL(`${rendererBase}/react-test-renderer/cjs/react-test-renderer.development.js`).href);
const Renderer = Rtr.default || Rtr;
const { act } = Renderer;

const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
let ts;
try { ts = (await import('typescript')).default; } catch {}
if (!ts) {
  for (const p of [`${rendererBase}/typescript/lib/typescript.js`]) {
    try { ts = (await import(pathToFileURL(p).href)).default; break; } catch {}
  }
}
if (!ts) throw new Error('typescript module not found for mcp-browser-ui.test');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function loadMcpBrowser() {
  const path = resolve('src/mcp-browser.ts');
  const src = readFileSync(path, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: 'mcp-browser.ts',
  }).outputText;
  const exports = {};
  vm.runInNewContext(js, {
    exports, module: { exports }, console,
    require: (id) => id === 'react' ? React : (() => { throw new Error(`unexpected require ${id}`); })(),
    fetch: (...a) => globalThis.fetch(...a),
    Response, Headers,
    Promise, setTimeout, clearTimeout, JSON, Array, Object, String, Error,
  });
  return exports;
}

function makeCtx({ lang = 'en', fetchImpl } = {}) {
  const sections = [];
  const dictionaries = [];
  globalThis.fetch = fetchImpl;
  const ctx = {
    inject: (names, fn) => { if ([].concat(names).every(n => ['slots','locale','connection'].includes(n))) fn(ctx); },
    effect: (fn) => fn(),
    locale: {
      register: (ns, dicts) => dictionaries.push({ ns, dicts }),
      bind: (ns) => (key) => {
        const d = dictionaries.find(x => x.ns === ns)?.dicts?.[lang] || {};
        return d[key] || key;
      },
      language: { getSnapshot: () => lang },
    },
    slots: {
      inject: (name, fn) => fn(),
      register: (spec, component) => { sections.push({ spec, component }); return () => {}; },
    },
  };
  return { ctx, sections, dictionaries };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function sampleData() {
  return {
    ok: true, fingerprint: 'fp1',
    servers: [{
      serverName: 'demo', ownership: 'waycraft', disabled: false,
      config: { serverName: 'demo', transport: 'stdio', command: 'node' },
      reviewedConfigFingerprint: 'rfp1',
      trust: { status: 'untrusted', reviewedFingerprint: '' },
    }],
    trashedServers: [{
      serverName: 'old', ownership: 'waycraft', disabled: true,
      config: { serverName: 'old', transport: 'stdio', command: 'node' },
      reviewedConfigFingerprint: 'rfp2',
      trust: { status: 'invalidated', reviewedFingerprint: 'x' },
      trash: { trashed: true, trashedAt: '2026-01-01T00:00:00Z', operationallyInactive: true, provenance: { ownership: 'waycraft', hadWaycraftMeta: true } },
    }],
  };
}

function allText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(allText).join('');
  return (node.children || []).map(allText).join('');
}
function findAll(node, pred, out = []) {
  if (!node || typeof node === 'string') return out;
  if (pred(node)) out.push(node);
  for (const c of node.children || []) findAll(c, pred, out);
  return out;
}

async function renderPanel(lang) {
  const { applyMcp } = loadMcpBrowser();
  const { ctx, sections } = makeCtx({ lang, fetchImpl: async () => jsonResponse(sampleData()) });
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  assert.equal(sections.length, 1);
  assert.equal(sections[0].spec.id, 'waycraft-mcp');
  assert.equal(sections[0].spec.order, 92);
  let renderer;
  await act(async () => { renderer = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });
  return renderer;
}

test('#174 browser integration EN: server-centric UI renders, read-only tools, accurate trash labels, no scope/per-tool controls', async () => {
  const renderer = await renderPanel('en');
  const json = renderer.toJSON();
  const text = allText(json);
  assert.match(text, /MCP servers/);
  assert.match(text, /demo/);
  assert.match(text, /Move to Trash/);
  assert.match(text, /No Global\/Project scope selectors in V1\./);
  assert.match(text, /disconnected\/untested server is not implied to be permanently disabled/i);
  assert.match(text, /does not claim runtime tool enforcement guarantees/i);
  // Trash lifecycle labels present in EN dictionary; read-only/per-tool note is in Tools tab.
  const { applyMcp } = loadMcpBrowser();
  const { ctx, sections, dictionaries } = makeCtx({ lang: 'en', fetchImpl: async () => jsonResponse(sampleData()) });
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  const enDict = dictionaries.find(d => d.ns === 'waycraft.mcp')?.dicts?.en || {};
  assert.equal(enDict.restore, 'Restore');
  assert.equal(enDict.permanentDelete, 'Permanently delete');
  assert.match(enDict.readOnlyTools, /Read-only\. No per-tool enable\/disable controls in V1\./);
  let r2; await act(async () => { r2 = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });
  const toolsTab = findAll(r2.toJSON(), n => n.type === 'button' && n.props?.role === 'tab' && allText(n) === 'Tools')[0];
  assert.ok(toolsTab);
  await act(async () => { toolsTab.props.onClick(); await Promise.resolve(); });
  assert.match(allText(r2.toJSON()), /Read-only\. No per-tool enable\/disable controls in V1\./);
  r2.unmount();
  // responsive style present
  assert.ok(findAll(json, n => n.type === 'style' && allText(n).includes('@container (max-width: 560px)')).length > 0);
  // accessibility
  assert.ok(findAll(json, n => n.props?.role === 'search').length > 0);
  assert.ok(findAll(json, n => n.props?.role === 'tablist').length > 0);
  assert.ok(findAll(json, n => n.props?.['aria-label'] === 'Search servers').length > 0);
  assert.ok(findAll(json, n => n.props?.dir === 'ltr' && n.props?.['data-waycraft-mcp-ui'] === '174').length > 0);
  renderer.unmount();
});

test('#174 browser integration AR: Arabic RTL, translated labels, technical LTR isolation, trash labels', async () => {
  const { applyMcp } = loadMcpBrowser();
  const { ctx, sections, dictionaries } = makeCtx({ lang: 'ar', fetchImpl: async () => jsonResponse(sampleData()) });
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  let renderer;
  await act(async () => { renderer = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });
  const json = renderer.toJSON();
  const text = allText(json);
  assert.match(text, /خوادم MCP/);
  assert.match(text, /نقل إلى سلة المهملات/); // active server action
  assert.match(text, /لا توجد محددات نطاق عام\/مشروع/);
  // Accurate trash lifecycle labels are present in Arabic dictionary (Restore/Permanent delete shown in trash view).
  const arDict = dictionaries.find(d => d.ns === 'waycraft.mcp')?.dicts?.ar || {};
  assert.equal(arDict.restore, 'استعادة');
  assert.equal(arDict.permanentDelete, 'حذف نهائي');
  assert.equal(arDict.moveToTrash, 'نقل إلى سلة المهملات');
  assert.equal(arDict.readOnlyTools, 'للقراءة فقط. لا توجد عناصر تحكم تفعيل/تعطيل لكل أداة في V1.');
  // Tools tab shows read-only note.
  const toolsTab = findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.role === 'tab' && allText(n) === 'الأدوات')[0];
  assert.ok(toolsTab, 'Arabic tools tab not found');
  await act(async () => { toolsTab.props.onClick(); await Promise.resolve(); });
  const toolsText = allText(renderer.toJSON());
  assert.match(toolsText, /للقراءة فقط/);
  assert.match(toolsText, /لا توجد عناصر تحكم تفعيل\/تعطيل لكل أداة/);
  // Switch to trash filter to render trashed server actions.
  const select = findAll(renderer.toJSON(), n => n.type === 'select')[0];
  await act(async () => { select.props.onChange({ target: { value: 'trashed' } }); await Promise.resolve(); });
  const trashText = allText(renderer.toJSON());
  assert.match(trashText, /استعادة/);
  assert.match(trashText, /حذف نهائي/);
  assert.match(trashText, /old/);
  const container = findAll(renderer.toJSON(), n => n.props?.['data-waycraft-mcp-ui'] === '174')[0];
  assert.equal(container.props.dir, 'rtl');
  // technical identifiers rendered with bdi dir=ltr
  assert.ok(findAll(renderer.toJSON(), n => n.type === 'bdi' && n.props?.dir === 'ltr').length > 0);
  // accessibility preserved
  assert.ok(findAll(renderer.toJSON(), n => n.props?.role === 'search').length > 0);
  renderer.unmount();
});

test('#174 unauthorized state shown for non-owner responses', async () => {
  const { applyMcp } = loadMcpBrowser();
  const { ctx, sections } = makeCtx({ fetchImpl: async () => jsonResponse({ ok:false, error:'Owner authorization required' }, 403) });
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  let renderer;
  await act(async () => { renderer = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });
  assert.match(allText(renderer.toJSON()), /Owner authorization required/);
  renderer.unmount();
});
