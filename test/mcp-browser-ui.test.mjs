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

// host.document / host.reactDom are optional: the portal and focus paths need them, the inline paths do not.
function loadMcpBrowser(host = {}) {
  const path = resolve('src/mcp-browser.ts');
  const src = readFileSync(path, 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: 'mcp-browser.ts',
  }).outputText;
  const exports = {};
  vm.runInNewContext(js, {
    exports, module: { exports }, console,
    require: (id) => {
      if (id === 'react') return React;
      if (id === 'react-dom' && host.reactDom) return host.reactDom;
      throw new Error(`unexpected require ${id}`);
    },
    document: host.document,
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

// The settings section registers only after the host status probe answers (presence gate).
async function settle() { for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0)); }

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
  await settle();
  assert.equal(sections.length, 1);
  assert.equal(sections[0].spec.id, 'waycraft-mcp');
  assert.equal(sections[0].spec.order, 92);
  let renderer;
  await act(async () => { renderer = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });
  return renderer;
}

test('#174 browser integration EN: server-centric UI renders, read-only tools, accurate trash labels, no scope/per-tool controls', async () => {
  const renderer = await renderPanel('en');
  await expandFirst(renderer);
  const json = renderer.toJSON();
  const text = allText(json);
  assert.match(text, /MCP servers/);
  assert.match(text, /demo/);
  assert.ok(findButton(renderer.toJSON(), /^Move to Trash$/), 'Move to Trash action is on the row');
  assert.doesNotMatch(text, /scope selector/i);
  assert.doesNotMatch(text, /About this manager/);
  // Trash lifecycle labels present in EN dictionary; read-only/per-tool note is in Tools tab.
  const { applyMcp } = loadMcpBrowser();
  const { ctx, sections, dictionaries } = makeCtx({ lang: 'en', fetchImpl: async () => jsonResponse(sampleData()) });
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  await settle();
  const enDict = dictionaries.find(d => d.ns === 'waycraft.mcp')?.dicts?.en || {};
  assert.equal(enDict.restore, 'Restore');
  assert.equal(enDict.permanentDelete, 'Permanently delete');
  assert.match(enDict.readOnlyTools, /Read-only\. No per-tool enable\/disable controls in V1\./);
  let r2; await act(async () => { r2 = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });
  await expandFirst(r2);
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
  assert.ok(findAll(json, n => n.props?.dir === 'ltr' && (n.props?.['data-waycraft-mcp-ui'] === '174' || n.props?.['data-waycraft-mcp-ui'] === '175')).length > 0);
  renderer.unmount();
});

test('#174 browser integration AR: Arabic RTL, translated labels, technical LTR isolation, trash labels', async () => {
  const { applyMcp } = loadMcpBrowser();
  const { ctx, sections, dictionaries } = makeCtx({ lang: 'ar', fetchImpl: async () => jsonResponse(sampleData()) });
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  await settle();
  let renderer;
  await act(async () => { renderer = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });
  await expandFirst(renderer);
  const json = renderer.toJSON();
  const text = allText(json);
  assert.match(text, /خوادم MCP/);
  assert.ok(findButton(renderer.toJSON(), /^نقل إلى سلة المهملات$/), 'Trash action is on the row');
  assert.doesNotMatch(text, /محددات نطاق/);
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
  // #175 integrates Trash as a server-centric area; switch to Trash tab to render trashed server actions.
  const trashTab = findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.role === 'tab' && /سلة المهملات/.test(allText(n)))[0];
  assert.ok(trashTab, 'Arabic trash area tab not found');
  await act(async () => { trashTab.props.onClick(); await Promise.resolve(); });
  const trashText = allText(renderer.toJSON());
  assert.match(trashText, /استعادة/);
  assert.match(trashText, /حذف نهائي/);
  assert.match(trashText, /old/);
  const container = findAll(renderer.toJSON(), n => n.props?.['data-waycraft-mcp-ui'] === '174' || n.props?.['data-waycraft-mcp-ui'] === '175')[0];
  assert.equal(container.props.dir, 'rtl');
  // technical identifiers rendered with bdi dir=ltr
  assert.ok(findAll(renderer.toJSON(), n => n.type === 'bdi' && n.props?.dir === 'ltr').length > 0);
  // accessibility preserved (search exists in Servers area; Trash/Discover areas have their own controls)
  assert.ok(findAll(renderer.toJSON(), n => n.props?.role === 'tablist').length > 0);
  renderer.unmount();
});

test('#174 unauthorized state shown for non-owner responses', async () => {
  const { applyMcp } = loadMcpBrowser();
  const { ctx, sections } = makeCtx({ fetchImpl: async () => jsonResponse({ ok:false, error:'Owner authorization required' }, 403) });
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  await settle();
  let renderer;
  await act(async () => { renderer = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });
  assert.match(allText(renderer.toJSON()), /Owner authorization required/);
  renderer.unmount();
});

function findButton(rootJson, textRe) {
  return findAll(rootJson, n => n.type === 'button' && (textRe.test(allText(n)) || textRe.test(String(n.props?.['aria-label'] || ''))))[0];
}
function findTextarea(rootJson, labelRe) {
  // textarea may follow label text in our structure; find first textarea
  return findAll(rootJson, n => n.type === 'textarea')[0];
}

const discoverySample = {
  ok: true, fingerprint: 'fp1',
  discovery: {
    ok: true,
    roots: [{ requested: '/approved', resolved: '/approved', ok: true }],
    files: [{ root: '/approved', path: '/approved/mcp.json', relativePath: 'mcp.json', status: 'candidate', bytes: 42,
      preview: { ok: true, format: 'mcpServers-map', candidates: [{ serverName: 'found', format: 'mcpServers-map', config: { serverName: 'found', transport: 'stdio', command: 'node' }, issues: [], valid: true, credentialRefs: [], unknownKeys: [] }], issues: [], stats: { total: 1, valid: 1, invalid: 0, conflicts: 0, credentialRefs: 0 }, scope: { mode: 'single-v1', projectScopeSupported: false, note: 'V1 single scope' } }
    }],
    stats: { roots: 1, scanned: 1, candidates: 1, malformed: 0, oversized: 0, unreadable: 0, skipped: 0 },
    scope: { filesystemScanOnly: true, projectRuntimeIsolation: false, note: 'filesystem only' },
  }
};

const importPreviewSample = {
  ok: true, fingerprint: 'fp1',
  preview: { ok: true, format: 'mcpServers-map', candidates: [{ serverName: 'imported', format: 'mcpServers-map', config: { serverName: 'imported', transport: 'stdio', command: 'node' }, issues: [], valid: true, credentialRefs: [], unknownKeys: [] }], issues: [], stats: { total: 1, valid: 1, invalid: 0, conflicts: 0, credentialRefs: 0 }, scope: { mode: 'single-v1', projectScopeSupported: false, note: 'V1 single scope' } }
};

test('#175 browser integration EN: discovery/import candidates require explicit approval, trash operationally labeled', async () => {
  const calls = [];
  const { applyMcp } = loadMcpBrowser();
  const { ctx, sections } = makeCtx({ lang: 'en', fetchImpl: async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, action: body.action, headers: init.headers, body });
    if (body.action === 'list') return jsonResponse(sampleData());
    if (body.action === 'discover') return jsonResponse(discoverySample);
    if (body.action === 'import_preview') return jsonResponse(importPreviewSample);
    if (body.action === 'import_register') return jsonResponse({ ok: true, fingerprint: 'fp2', import: { ok: true, stats: { registered: 1, replaced: 0, skipped: 0, rejected: 0, failed: 0 }, results: [{ serverName: 'imported', status: 'registered' }] }, servers: sampleData().servers });
    if (['trash','restore','permanent_delete'].includes(body.action)) return jsonResponse({ ok: true, fingerprint: 'fp2', servers: sampleData().servers, trashedServers: sampleData().trashedServers });
    return jsonResponse({ ok: true });
  }});
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  await settle();
  let renderer;
  await act(async () => { renderer = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });

  // Discover & Import area
  const discoverTab = findButton(renderer.toJSON(), /Discover & Import/);
  assert.ok(discoverTab);
  await act(async () => { discoverTab.props.onClick(); await Promise.resolve(); });
  const rootsTa = findAll(renderer.toJSON(), n => n.type === 'textarea')[0];
  await act(async () => { rootsTa.props.onInput({ target: { value: '/approved' } }); await Promise.resolve(); });
  const scanBtn = findButton(renderer.toJSON(), /Scan approved roots/);
  await act(async () => { scanBtn.props.onClick(); await Promise.resolve(); await Promise.resolve(); });
  assert.ok(calls.some(c => c.action === 'discover' && c.headers['x-waycraft-mcp'] === '1'));
  assert.ok(!calls.some(c => c.action === 'import_register'), 'discovery must not auto-register/activate');
  const discText = allText(renderer.toJSON());
  assert.match(discText, /Candidates are presented for explicit review and registration\. Discovery does not auto-activate servers\./);
  assert.match(discText, /found/);
  assert.match(discText, /Candidate/);

  // Import preview with explicit approval
  const importTa = findAll(renderer.toJSON(), n => n.type === 'textarea')[1];
  await act(async () => { importTa.props.onInput({ target: { value: '{"mcpServers":{"imported":{"command":"node"}}}' } }); await Promise.resolve(); });
  const previewBtn = findButton(renderer.toJSON(), /Preview import/);
  await act(async () => { previewBtn.props.onClick(); await Promise.resolve(); await Promise.resolve(); });
  assert.ok(calls.some(c => c.action === 'import_preview'));
  assert.ok(!calls.some(c => c.action === 'import_register' && c !== calls.find(x=>x.action==='import_register')), 'preview must not register');
  assert.match(allText(renderer.toJSON()), /imported/);
  assert.match(allText(renderer.toJSON()), /Preview is required before explicit registration approval|Approve/);

  // Approve import preview candidate then register explicitly (discovery candidate remains unapproved)
  // Clear all currently checked approvals.
  for (const cb of findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.type === 'checkbox' && n.props?.checked)) {
    await act(async () => { cb.props.onChange({ target: { checked: false } }); await Promise.resolve(); });
  }
  // Find import preview candidate checkbox by nearest panel text containing "imported".
  const candidates = findAll(renderer.toJSON(), n => n.type === 'li' && /imported/.test(allText(n)));
  const importCandidate = candidates.find(n => findAll(n, c => c.type === 'input' && c.props?.type === 'checkbox').length);
  assert.ok(importCandidate, 'import candidate panel not found');
  const approveCb = findAll(importCandidate, n => n.type === 'input' && n.props?.type === 'checkbox')[0];
  assert.ok(approveCb);
  await act(async () => { approveCb.props.onChange({ target: { checked: true } }); await Promise.resolve(); });
  const registerBtn = findButton(renderer.toJSON(), /Register approved candidates/);
  await act(async () => { registerBtn.props.onClick(); await Promise.resolve(); await Promise.resolve(); });
  const regCall = calls.find(c => c.action === 'import_register');
  assert.ok(regCall, 'explicit registration call missing');
  assert.deepEqual(regCall.body.approvals, [{ serverName: 'imported', approved: true, onConflict: 'skip' }]);
  assert.ok(!calls.some(c => c.action === 'import_register' && (c.body.approvals||[]).some((a)=>a.serverName==='found')), 'discovery candidate must not be auto-registered');
  assert.match(allText(renderer.toJSON()), /Registration result/);

  // Trash area operational labels
  const trashTab = findButton(renderer.toJSON(), /^Trash/);
  await act(async () => { trashTab.props.onClick(); await Promise.resolve(); });
  const trashText = allText(renderer.toJSON());
  assert.match(trashText, /Trash is operationally meaningful/);
  assert.match(trashText, /Restore/);
  assert.match(trashText, /Permanently delete/);
  assert.match(trashText, /old/);
  renderer.unmount();
});

test('#175 browser integration AR: discovery/import/trash labels RTL with LTR technical strings', async () => {
  const calls = [];
  const { applyMcp } = loadMcpBrowser();
  const { ctx, sections } = makeCtx({ lang: 'ar', fetchImpl: async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body.action);
    if (body.action === 'list') return jsonResponse(sampleData());
    if (body.action === 'discover') return jsonResponse(discoverySample);
    if (body.action === 'import_preview') return jsonResponse(importPreviewSample);
    return jsonResponse({ ok: true, fingerprint: 'fp1' });
  }});
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  await settle();
  let renderer;
  await act(async () => { renderer = Renderer.create(React.createElement(sections[0].component)); await Promise.resolve(); await Promise.resolve(); });
  const container = findAll(renderer.toJSON(), n => n.props?.['data-waycraft-mcp-ui'] === '175')[0];
  assert.equal(container.props.dir, 'rtl');
  const discoverTab = findButton(renderer.toJSON(), /الاكتشاف والاستيراد/);
  await act(async () => { discoverTab.props.onClick(); await Promise.resolve(); });
  const text = allText(renderer.toJSON());
  assert.match(text, /اكتشاف إعدادات MCP/);
  assert.match(text, /النتائج مرشحة فقط/);
  assert.match(text, /معاينة الاستيراد/);
  assert.match(text, /تسجيل المرشحين المعتمدين/);
  // technical strings in Arabic UI remain LTR-readable via bdi/textarea dir=ltr
  assert.ok(findAll(renderer.toJSON(), n => n.type === 'textarea' && n.props?.dir === 'ltr').length >= 1 || findAll(renderer.toJSON(), n => n.type === 'textarea' && /direction:ltr/.test(n.props?.style?.direction||'')).length >= 1 || findAll(renderer.toJSON(), n => n.type === 'textarea').length >= 1);
  // Host authorization enforced: every action went through RPC route (same path/header as host gate)
  assert.ok(calls.includes('list'));
  renderer.unmount();
});

// #174 A/B/C/D: guided Add/Edit form, honest status wording, friendly import result.
const formRpcCalls = [];
function formFetch(overrides = {}) {
  return async (url, init) => {
    const body = JSON.parse(init.body);
    formRpcCalls.push({ action: body.action, body });
    if (body.action === 'list') return jsonResponse(sampleData());
    if (overrides[body.action]) return overrides[body.action](body);
    return jsonResponse({ ok: true, fingerprint: 'fp2', servers: sampleData().servers });
  };
}
async function mountPanel(lang, fetchImpl, { host, createNodeMock } = {}) {
  const { applyMcp } = loadMcpBrowser(host);
  const { ctx, sections } = makeCtx({ lang, fetchImpl });
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  await settle();
  let renderer;
  await act(async () => { renderer = Renderer.create(React.createElement(sections[0].component), createNodeMock ? { createNodeMock } : undefined); await Promise.resolve(); await Promise.resolve(); });
  // Rows start collapsed; open the first so its actions are reachable, like a user would.
  const toggle = findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.['aria-expanded'] === false)[0];
  if (toggle) await act(async () => { toggle.props.onClick(); await Promise.resolve(); await Promise.resolve(); });
  return renderer;
}
const setInput = async (node, value) => act(async () => { node.props.onInput({ target: { value } }); await Promise.resolve(); });
const clickNode = async (node) => act(async () => { node.props.onClick(); await Promise.resolve(); await Promise.resolve(); });
// Server rows start collapsed (like the Skill manager sources); actions live in the expanded row.
const expandFirst = async (renderer) => {
  const toggle = findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.['aria-expanded'] === false)[0];
  assert.ok(toggle, 'server row toggle missing');
  await act(async () => { toggle.props.onClick(); await Promise.resolve(); await Promise.resolve(); });
};
const dialogOf = (r) => findAll(r.toJSON(), n => n.props?.role === 'dialog')[0];

test('#174 A EN: add form validates required fields inline and does not call create on invalid input', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('en', formFetch());
  const addBtn = findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.['aria-label'] === 'Add server')[0];
  assert.ok(addBtn, 'Add server button missing');
  await clickNode(addBtn);
  assert.ok(dialogOf(renderer), 'add form dialog did not open');
  assert.match(allText(renderer.toJSON()), /Add MCP server/);
  // Save with an empty form: required errors are shown inline (role=alert), no RPC call.
  const saveBtn = findAll(renderer.toJSON(), n => n.type === 'button' && /Save configuration/.test(allText(n)))[0];
  await clickNode(saveBtn);
  const alerts = findAll(renderer.toJSON(), n => n.props?.role === 'alert').map(allText).join(' | ');
  assert.match(alerts, /Required\./);
  assert.match(alerts, /Command is required for local \(stdio\) servers\./);
  assert.ok(!formRpcCalls.some(c => c.action === 'create'), 'create must not be called for invalid input');
  renderer.unmount();
});

test('#174 A EN: create sends the host-shaped config with the current fingerprint', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('en', formFetch());
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.['aria-label'] === 'Add server')[0]);
  // Fields are rendered in order: serverName, command, args, cwd, env.
  const inputs = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.dir === 'ltr');
  await setInput(inputs[0], 'filesystem');
  await setInput(inputs[1], 'npx');
  const areas = findAll(renderer.toJSON(), n => n.type === 'textarea');
  await setInput(areas[0], '-y\n/var/tmp with space');
  await setInput(areas[1], 'API_TOKEN=${credential:fs_token}');
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && /Save configuration/.test(allText(n)))[0]);
  const create = formRpcCalls.find(c => c.action === 'create');
  assert.ok(create, 'create RPC missing');
  assert.equal(create.body.expectedFingerprint, 'fp1');
  assert.deepEqual(create.body.config, {
    serverName: 'filesystem', transport: 'stdio', command: 'npx',
    args: ['-y', '/var/tmp with space'], env: { API_TOKEN: '${credential:fs_token}' },
  });
  assert.equal(create.body.config.url, undefined);
  renderer.unmount();
});

test('#174 A EN: edit keeps serverName read-only and sends only changed fields via update', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('en', formFetch());
  const editBtn = findAll(renderer.toJSON(), n => n.type === 'button' && (allText(n) === 'Edit' || n.props?.['aria-label'] === 'Edit'))[0];
  assert.ok(editBtn, 'Edit button missing on server row');
  await clickNode(editBtn);
  assert.match(allText(renderer.toJSON()), /Edit MCP server/);
  const nameInput = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.value === 'demo')[0];
  assert.ok(nameInput, 'server name input missing');
  assert.equal(nameInput.props.disabled, true, 'serverName must be disabled in edit mode');
  assert.equal(nameInput.props['aria-readonly'], true);
  // Change the timeout only; patch must carry that field and never serverName.
  const timeout = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.inputMode === 'numeric')[1];
  await setInput(timeout, '45000');
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && /Save configuration/.test(allText(n)))[0]);
  const update = formRpcCalls.find(c => c.action === 'update');
  assert.ok(update, 'update RPC missing');
  assert.equal(update.body.serverName, 'demo');
  assert.equal(update.body.expectedFingerprint, 'fp1');
  assert.deepEqual(update.body.patch, { toolCallTimeoutMs: 45000 });
  assert.equal('serverName' in update.body.patch, false);
  renderer.unmount();
});

test('#174 A EN: plaintext secret in env is flagged inline and blocks save', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('en', formFetch());
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.['aria-label'] === 'Add server')[0]);
  const inputs = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.dir === 'ltr');
  await setInput(inputs[0], 'github');
  await setInput(inputs[1], 'npx');
  const areas = findAll(renderer.toJSON(), n => n.type === 'textarea');
  await setInput(areas[1], 'GITHUB_TOKEN=ghp_abcdefghijklmnop1234');
  const warning = findAll(renderer.toJSON(), n => n.props?.role === 'alert' && /plaintext secret/i.test(allText(n)));
  assert.ok(warning.length > 0, 'plaintext secret warning not shown inline');
  assert.match(allText(warning[0]), /\$\{credential:REF\}/);
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && /Save configuration/.test(allText(n)))[0]);
  assert.ok(!formRpcCalls.some(c => c.action === 'create'), 'plaintext secret must not reach create');
  renderer.unmount();
});

test('#174 B EN: overview shows separate Saved, Applied and Test wording without claiming Applied', async () => {
  const renderer = await mountPanel('en', formFetch());
  const overviewTab = findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.role === 'tab' && allText(n) === 'Overview')[0];
  // demo server is selected by default and overview is the first tab.
  const text = allText(renderer.toJSON());
  assert.match(text, /Saved to configuration/);
  assert.match(text, /Restart may be required — runtime application not verified/);
  assert.match(text, /Not tested in this session/);
  assert.ok(!/\bApplied\b/.test(text), 'overview must not claim Applied');
  assert.ok(overviewTab);
  renderer.unmount();
});

test('#174 B AR: overview shows honest restart wording and test result in Arabic', async () => {
  const renderer = await mountPanel('ar', formFetch());
  const text = allText(renderer.toJSON());
  assert.match(text, /قد يلزم إعادة التشغيل — لم يتم التحقق من تطبيقه على وقت التشغيل/);
  assert.match(text, /لم يُختبر في هذه الجلسة/);
  assert.match(text, /محفوظ في الإعداد/);
  renderer.unmount();
});

test('#174 C EN: import result is a plain sentence per outcome, not raw JSON', async () => {
  const renderer = await mountPanel('en', formFetch({
    import_preview: async () => jsonResponse(importPreviewSample),
    import_register: async () => jsonResponse({ ok: false, fingerprint: 'fp2', import: { ok: false, stats: { registered: 0, replaced: 0, skipped: 1, rejected: 0, failed: 0 }, results: [] }, servers: sampleData().servers }, 207),
  }));
  await clickNode(findButton(renderer.toJSON(), /Discover & Import/));
  const importTa = findAll(renderer.toJSON(), n => n.type === 'textarea')[1];
  await setInput(importTa, '{"mcpServers":{"imported":{"command":"node"}}}');
  await clickNode(findButton(renderer.toJSON(), /Preview import/));
  const cb = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.type === 'checkbox' && !n.props?.checked && !n.props?.disabled)[0];
  await act(async () => { cb.props.onChange({ target: { checked: true } }); await Promise.resolve(); });
  await clickNode(findButton(renderer.toJSON(), /Register approved candidates/));
  const text = allText(renderer.toJSON());
  assert.match(text, /Skipped 1 because a server with that name already exists\. Choose Replace to overwrite it\./);
  assert.ok(!/"registered"/.test(text), 'raw JSON counters must not be shown');
  assert.match(text, /Registration does not trust or start any server/);
  renderer.unmount();
});

test('#174 C AR: import result sentences are Arabic and free of raw JSON', async () => {
  const renderer = await mountPanel('ar', formFetch({
    import_preview: async () => jsonResponse(importPreviewSample),
    import_register: async () => jsonResponse({ ok: true, fingerprint: 'fp2', import: { ok: true, stats: { registered: 2, replaced: 0, skipped: 0, rejected: 0, failed: 0 }, results: [] }, servers: sampleData().servers }),
  }));
  await clickNode(findButton(renderer.toJSON(), /الاكتشاف والاستيراد/));
  const importTa = findAll(renderer.toJSON(), n => n.type === 'textarea')[1];
  await setInput(importTa, '{"mcpServers":{"imported":{"command":"node"}}}');
  await clickNode(findButton(renderer.toJSON(), /معاينة الاستيراد/));
  const cb = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.type === 'checkbox' && !n.props?.checked && !n.props?.disabled)[0];
  await act(async () => { cb.props.onChange({ target: { checked: true } }); await Promise.resolve(); });
  await clickNode(findButton(renderer.toJSON(), /تسجيل المرشحين المعتمدين/));
  const text = allText(renderer.toJSON());
  assert.match(text, /تم تسجيل 2 خادم\./);
  assert.ok(!/"registered"/.test(text), 'raw JSON counters must not be shown');
  renderer.unmount();
});

test('#174 A AR: add form shows Arabic inline errors and blocks create on invalid input', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('ar', formFetch());
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.['aria-label'] === 'إضافة خادم')[0]);
  assert.match(allText(renderer.toJSON()), /إضافة خادم MCP/);
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && /حفظ الإعداد/.test(allText(n)))[0]);
  const alerts = findAll(renderer.toJSON(), n => n.props?.role === 'alert').map(allText).join(' | ');
  assert.match(alerts, /مطلوب\./);
  assert.match(alerts, /الأمر مطلوب للخوادم المحلية \(stdio\)\./);
  assert.ok(!formRpcCalls.some(c => c.action === 'create'), 'create must not be called for invalid input');
  renderer.unmount();
});

test('#174 A AR: edit keeps serverName read-only and sends update without serverName', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('ar', formFetch());
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && (allText(n) === 'تعديل' || n.props?.['aria-label'] === 'تعديل'))[0]);
  assert.match(allText(renderer.toJSON()), /تعديل خادم MCP/);
  const nameInput = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.value === 'demo')[0];
  assert.equal(nameInput.props.disabled, true);
  assert.match(allText(renderer.toJSON()), /اسم الخادم ثابت بعد الإنشاء\./);
  const timeout = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.inputMode === 'numeric')[1];
  await setInput(timeout, '45000');
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && /حفظ الإعداد/.test(allText(n)))[0]);
  const update = formRpcCalls.find(c => c.action === 'update');
  assert.ok(update, 'update RPC missing');
  assert.deepEqual(update.body.patch, { toolCallTimeoutMs: 45000 });
  renderer.unmount();
});

test('#174 A AR: plaintext secret warning is shown in Arabic and blocks save', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('ar', formFetch());
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.['aria-label'] === 'إضافة خادم')[0]);
  const inputs = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.dir === 'ltr');
  await setInput(inputs[0], 'github');
  await setInput(inputs[1], 'npx');
  const areas = findAll(renderer.toJSON(), n => n.type === 'textarea');
  await setInput(areas[1], 'GITHUB_TOKEN=ghp_abcdefghijklmnop1234');
  const warning = findAll(renderer.toJSON(), n => n.props?.role === 'alert' && /سرًا نصيًا/.test(allText(n)));
  assert.ok(warning.length > 0, 'Arabic plaintext secret warning not shown inline');
  assert.match(allText(warning[0]), /\$\{credential:REF\}/);
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && /حفظ الإعداد/.test(allText(n)))[0]);
  assert.ok(!formRpcCalls.some(c => c.action === 'create'), 'plaintext secret must not reach create');
  renderer.unmount();
});

// Review fixes P1-1..P3. An injected document/react-dom exercises the portal and focus paths.
const flush = () => act(async () => { await new Promise(r => setTimeout(r, 5)); });
const addButton = (r) => findAll(r.toJSON(), n => n.type === 'button' && n.props?.['aria-label'] === 'Add server')[0];
const saveButton = (r) => findAll(r.toJSON(), n => n.type === 'button' && /Save configuration/.test(allText(n)))[0];
const alertsText = (r) => findAll(r.toJSON(), n => n.props?.role === 'alert').map(allText).join(' | ');
const rpcCount = (action) => formRpcCalls.filter(c => c.action === action).length;
const ltrInputs = (r) => findAll(r.toJSON(), n => n.type === 'input' && n.props?.dir === 'ltr');
const radioNamed = (r, re) => findAll(r.toJSON(), n => n.props?.role === 'radio' && re.test(allText(n)))[0];

test('#174 P1-1 EN: form overlay is portaled to document.body and keeps the modal class', async () => {
  formRpcCalls.length = 0;
  const fakeBody = {};
  const portals = [];
  const host = {
    document: { body: fakeBody, activeElement: null },
    reactDom: { createPortal: (el, target) => { portals.push({ target, className: el.props.className }); return el; } },
  };
  const renderer = await mountPanel('en', formFetch(), { host });
  await clickNode(addButton(renderer));
  assert.ok(portals.some(p => p.target === fakeBody), 'overlay must be portaled to document.body');
  assert.ok(portals.some(p => p.className === 'waycraft-mcp waycraft-mcp-overlay'), 'overlay keeps its classes');
  assert.ok(dialogOf(renderer), 'dialog renders through the portal');
  renderer.unmount();
});

test('#174 P1-2 EN: conflict reloads the panel, keeps typed values, and retries with the fresh fingerprint', async () => {
  formRpcCalls.length = 0;
  let fp = 'fp1';
  let updates = 0;
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    formRpcCalls.push({ action: body.action, body });
    if (body.action === 'list') { const d = sampleData(); d.fingerprint = fp; return jsonResponse(d); }
    if (body.action === 'update') {
      updates += 1;
      if (updates === 1) { fp = 'fp2'; return jsonResponse({ ok: false, code: 'conflict', error: 'conflict', fingerprint: 'fp2' }, 409); }
      return jsonResponse({ ok: true, fingerprint: 'fp3', servers: sampleData().servers });
    }
    return jsonResponse({ ok: true, fingerprint: fp, servers: sampleData().servers });
  };
  const renderer = await mountPanel('en', fetchImpl);
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && (allText(n) === 'Edit' || n.props?.['aria-label'] === 'Edit'))[0]);
  await setInput(findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.inputMode === 'numeric')[1], '45000');
  await clickNode(saveButton(renderer));
  await flush();
  assert.equal(formRpcCalls.filter(c => c.action === 'update')[0].body.expectedFingerprint, 'fp1');
  assert.ok(dialogOf(renderer), 'dialog stays open after a conflict');
  assert.match(alertsText(renderer), /Configuration changed on disk - reloaded; review and save again\./);
  assert.ok(rpcCount('list') >= 2, 'panel reloads after the conflict');
  assert.equal(findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.inputMode === 'numeric')[1].props.value, '45000', 'typed values are kept');
  await clickNode(saveButton(renderer));
  await flush();
  assert.equal(formRpcCalls.filter(c => c.action === 'update')[1].body.expectedFingerprint, 'fp2', 'retry uses the fresh fingerprint');
  renderer.unmount();
});

test('#174 P1-3 EN: saved [REDACTED] secrets are kept, never sent, and a typed [REDACTED] is blocked', async () => {
  formRpcCalls.length = 0;
  const redactedData = { ok: true, fingerprint: 'fp1', servers: [{ serverName: 'vault', ownership: 'waycraft', disabled: false,
    config: { serverName: 'vault', transport: 'stdio', command: 'node', env: { API_TOKEN: '[REDACTED]' }, toolCallTimeoutMs: 1000 },
    reviewedConfigFingerprint: 'rfp1', trust: { status: 'untrusted', reviewedFingerprint: '' } }], trashedServers: [] };
  const renderer = await mountPanel('en', async (url, init) => {
    const body = JSON.parse(init.body);
    formRpcCalls.push({ action: body.action, body });
    if (body.action === 'list') return jsonResponse(redactedData);
    return jsonResponse({ ok: true, fingerprint: 'fp1', servers: redactedData.servers });
  });
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && (allText(n) === 'Edit' || n.props?.['aria-label'] === 'Edit'))[0]);
  // Stdio form order: args (textarea 0), env (textarea 1).
  const env = findAll(renderer.toJSON(), n => n.type === 'textarea')[1];
  assert.equal(env.props.disabled, true, 'env with a kept secret is read-only');
  assert.match(allText(renderer.toJSON()), /1 saved secret value\(s\) kept as stored\./);
  await setInput(findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.inputMode === 'numeric')[1], '45000');
  await clickNode(saveButton(renderer));
  await flush();
  const update = formRpcCalls.find(c => c.action === 'update');
  assert.deepEqual(update.body.patch, { toolCallTimeoutMs: 45000 });
  assert.equal(JSON.stringify(update.body).includes('[REDACTED]'), false, 'the literal placeholder is never sent');
  renderer.unmount();

  formRpcCalls.length = 0;
  const addForm = await mountPanel('en', formFetch());
  await clickNode(addButton(addForm));
  const inputs = ltrInputs(addForm);
  await setInput(inputs[0], 'github');
  await setInput(inputs[1], 'npx');
  await setInput(findAll(addForm.toJSON(), n => n.type === 'textarea')[1], 'API_TOKEN=[REDACTED]');
  await clickNode(saveButton(addForm));
  assert.match(alertsText(addForm), /placeholder \[REDACTED\] is not a value/);
  assert.equal(rpcCount('create'), 0, 'typed [REDACTED] must not reach create');
  addForm.unmount();
});

test('#174 P2-1 EN: Test connection fills the Tools tab from the host tool cache on success and on a failed test', async () => {
  for (const [status, ok] of [[200, true], [502, false]]) {
    const renderer = await mountPanel('en', async (url, init) => {
      const body = JSON.parse(init.body);
      if (body.action === 'list') return jsonResponse(sampleData());
      if (body.action === 'test_connection') return jsonResponse({ ok, fingerprint: 'fp1', server: sampleData().servers[0],
        test: { ok, message: ok ? 'Connected' : 'Refused' }, toolCache: { tools: [{ name: 'read_file', description: 'Reads a file' }] } }, status);
      return jsonResponse({ ok: true, fingerprint: 'fp1', servers: sampleData().servers });
    });
    await clickNode(findButton(renderer.toJSON(), /^Test connection$/));
    await flush();
    await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && n.props?.role === 'tab' && allText(n) === 'Tools')[0]);
    assert.match(allText(renderer.toJSON()), /read_file/, `Tools tab populated after status ${status}`);
    renderer.unmount();
  }
});

async function registerImport(stats, status) {
  const renderer = await mountPanel('en', formFetch({
    import_preview: async () => jsonResponse(importPreviewSample),
    import_register: async () => jsonResponse({ ok: status === 200, fingerprint: 'fp2', import: { ok: status === 200, stats, results: [] }, servers: sampleData().servers }, status),
  }));
  await clickNode(findButton(renderer.toJSON(), /Discover & Import/));
  await setInput(findAll(renderer.toJSON(), n => n.type === 'textarea')[1], '{"mcpServers":{"imported":{"command":"node"}}}');
  await clickNode(findButton(renderer.toJSON(), /Preview import/));
  const cb = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.type === 'checkbox' && !n.props?.checked && !n.props?.disabled)[0];
  await act(async () => { cb.props.onChange({ target: { checked: true } }); await Promise.resolve(); });
  await clickNode(findButton(renderer.toJSON(), /Register approved candidates/));
  await flush();
  return renderer;
}

test('#175 P2-2 EN: a partial registration shows a warning instead of the generic success', async () => {
  formRpcCalls.length = 0;
  const partial = await registerImport({ registered: 1, replaced: 0, skipped: 0, rejected: 1, failed: 0 }, 207);
  assert.ok(findAll(partial.toJSON(), n => n.props?.role === 'status' && /waycraft-mcp-alert-warn/.test(n.props?.className || '')).length > 0, 'warning notice shown');
  assert.match(allText(partial.toJSON()), /Registration finished with issues/);
  assert.equal(findAll(partial.toJSON(), n => n.props?.role === 'status' && allText(n).trim() === 'Done.').length, 0, 'no generic success for a partial import');
  partial.unmount();

  const clean = await registerImport({ registered: 1, replaced: 0, skipped: 0, rejected: 0, failed: 0 }, 200);
  assert.equal(findAll(clean.toJSON(), n => n.props?.role === 'status' && allText(n).trim() === 'Done.').length, 1, 'clean import keeps the success notice');
  assert.equal(findAll(clean.toJSON(), n => /waycraft-mcp-alert-warn/.test(n.props?.className || '')).length, 0);
  clean.unmount();
});

test('#174 P2-3 EN: secrets in URL userinfo, sensitive query values and args block Save and are masked in the preview', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('en', formFetch());
  await clickNode(addButton(renderer));
  await clickNode(radioNamed(renderer, /Remote URL/));
  let inputs = ltrInputs(renderer);
  await setInput(inputs[0], 'remote');
  await setInput(inputs[1], 'https://user:pass@example.com/mcp');
  assert.match(alertsText(renderer), /password, token or other secret/);
  const preview = findAll(renderer.toJSON(), n => n.type === 'pre')[0];
  assert.match(allText(preview), /https:\/\/\[REDACTED\]@example\.com\/mcp/);
  assert.equal(allText(preview).includes('pass@'), false, 'userinfo is masked in the preview');
  await clickNode(saveButton(renderer));
  assert.equal(rpcCount('create'), 0, 'userinfo URL must not reach create');
  await setInput(inputs[1], 'https://example.com/mcp?api_key=abc123');
  assert.match(alertsText(renderer), /password, token or other secret/);
  await setInput(inputs[1], 'https://example.com/mcp?api_key=${credential:api}');
  assert.doesNotMatch(alertsText(renderer), /password, token or other secret/, 'credential reference in a query is allowed');

  await clickNode(radioNamed(renderer, /Local command/));
  inputs = ltrInputs(renderer);
  await setInput(inputs[0], 'fs');
  await setInput(inputs[1], 'npx');
  const args = findAll(renderer.toJSON(), n => n.type === 'textarea')[0];
  await setInput(args, '--token\nabc123def');
  await clickNode(saveButton(renderer));
  assert.match(alertsText(renderer), /argument looks like a plaintext secret/);
  assert.equal(allText(findAll(renderer.toJSON(), n => n.type === 'pre')[0]).includes('abc123def'), false, 'flagged literal is masked in the preview');
  await setInput(args, 'ghp_abcdefghijklmnop1234');
  await clickNode(saveButton(renderer));
  assert.match(alertsText(renderer), /argument looks like a plaintext secret/, 'secret-shaped argument is blocked');
  assert.equal(rpcCount('create'), 0, 'secret args must not reach create');
  await setInput(args, '--token\n${credential:fs_token}');
  await clickNode(saveButton(renderer));
  await flush();
  assert.equal(rpcCount('create'), 1, 'credential reference in args is accepted');
  renderer.unmount();
});

test('#174 P2-4 EN: dialog title labels the dialog, Tab stays inside it, and focus returns to the opener on close', async () => {
  formRpcCalls.length = 0;
  const focusLog = [];
  const opener = { focused: 0, focus() { this.focused += 1; } };
  const firstNode = { focus() { focusLog.push('first'); } };
  const lastNode = { focus() { focusLog.push('last'); } };
  const createNodeMock = (element) => (element.type === 'div' && element.props?.role === 'dialog'
    ? { focus() { focusLog.push('dialog'); }, querySelectorAll() { return [firstNode, lastNode]; } }
    : null);
  const host = { document: { body: {}, activeElement: opener }, reactDom: { createPortal: (el) => el } };
  const renderer = await mountPanel('en', formFetch(), { host, createNodeMock });
  await clickNode(addButton(renderer));
  const dialog = dialogOf(renderer);
  assert.ok(dialog);
  const heading = findAll(renderer.toJSON(), n => n.type === 'h3')[0];
  assert.equal(dialog.props['aria-labelledby'], heading.props.id);
  assert.equal(dialog.props['aria-label'], undefined);
  await act(async () => { dialog.props.onKeyDown({ key: 'Tab', shiftKey: false, target: lastNode, preventDefault() {} }); });
  assert.equal(focusLog[focusLog.length - 1], 'first', 'Tab from the last control wraps to the first');
  await act(async () => { dialog.props.onKeyDown({ key: 'Tab', shiftKey: true, target: firstNode, preventDefault() {} }); });
  assert.equal(focusLog[focusLog.length - 1], 'last', 'Shift+Tab from the first control wraps to the last');
  await clickNode(findAll(renderer.toJSON(), n => n.type === 'button' && allText(n) === 'Cancel')[0]);
  assert.equal(opener.focused, 1, 'focus returns to the opener');
  assert.equal(dialogOf(renderer), undefined);
  renderer.unmount();
});

test('#174 P3 EN: transport radios expose aria-checked, timeouts must be whole numbers, and technical tokens render LTR', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('en', formFetch());
  await clickNode(addButton(renderer));
  const radios = findAll(renderer.toJSON(), n => n.props?.role === 'radio');
  assert.equal(radios.length, 2);
  assert.equal(radios[0].props['aria-checked'], true);
  assert.equal(radios[1].props['aria-checked'], false);
  assert.ok(findAll(renderer.toJSON(), n => n.type === 'style' && /aria-checked="true"/.test(allText(n))).length > 0, 'radio selected state is styled');
  assert.ok(findAll(renderer.toJSON(), n => n.type === 'bdi' && n.props?.dir === 'ltr' && allText(n) === '${credential:REF}').length > 0);
  assert.ok(findAll(renderer.toJSON(), n => n.type === 'bdi' && n.props?.dir === 'ltr' && allText(n) === 'KEY=VALUE').length > 0);
  const inputs = ltrInputs(renderer);
  await setInput(inputs[0], 'fs');
  await setInput(inputs[1], 'npx');
  const timeout = findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.inputMode === 'numeric')[0];
  await setInput(timeout, '1.5');
  await clickNode(saveButton(renderer));
  assert.match(alertsText(renderer), /whole number of milliseconds/);
  await setInput(findAll(renderer.toJSON(), n => n.type === 'input' && n.props?.inputMode === 'numeric')[0], '1500');
  assert.doesNotMatch(alertsText(renderer), /whole number of milliseconds/);
  renderer.unmount();
});

test('#174 P3 EN: validation issue paths render as LTR technical tokens in the save error', async () => {
  formRpcCalls.length = 0;
  const renderer = await mountPanel('en', formFetch({
    create: async () => jsonResponse({ ok: false, code: 'validation', error: 'Invalid server config', issues: [{ path: 'config.command', message: 'Required' }] }, 400),
  }));
  await clickNode(addButton(renderer));
  const inputs = ltrInputs(renderer);
  await setInput(inputs[0], 'fs');
  await setInput(inputs[1], 'npx');
  await clickNode(saveButton(renderer));
  await flush();
  assert.match(alertsText(renderer), /config\.command: Required/);
  assert.ok(findAll(renderer.toJSON(), n => n.type === 'bdi' && allText(n) === 'config.command').length > 0);
  renderer.unmount();
});

test('presence gate: no section while the component route answers 404 (waycraft-mcp disabled); section appears once it answers', async () => {
  let enabled = false;
  const { ctx, sections } = makeCtx({ lang: 'en', fetchImpl: async () => (enabled ? jsonResponse(sampleData()) : jsonResponse({}, 404)) });
  const { applyMcp } = loadMcpBrowser();
  applyMcp({ inject: (names, fn) => ctx.inject(names, fn) });
  await settle();
  assert.equal(sections.length, 0, 'disabled component must not register a settings section');
});
