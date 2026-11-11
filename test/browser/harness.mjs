// Opt-in real-browser harness: serves the built Skill manager (dist/client.js) with a real
// skills route from dist/skills.js, and drives it in Chromium through Playwright.
// Playwright is NOT a dependency: it is resolved dynamically and the suite skips when absent.
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { mkdir, mkdtemp, realpath, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Resolve Playwright: WAYCRAFT_PLAYWRIGHT (module path) first, then a normal import. */
export async function loadPlaywright() {
  const candidates = [
    process.env.WAYCRAFT_PLAYWRIGHT,
    'playwright',
    'playwright-core',
  ].filter(Boolean);
  for (const name of candidates) {
    try {
      const target = name.startsWith('/')
        ? pathToFileURL(createRequire(name + '/').resolve(name)).href
        : name;
      const mod = await import(target);
      return mod.chromium ?? mod.default?.chromium;
    } catch {
      // try the next candidate
    }
  }
  return undefined;
}

/** Launch Chromium (WAYCRAFT_CHROMIUM overrides the executable); undefined when unavailable. */
export async function launch() {
  const chromium = await loadPlaywright();
  if (!chromium)
    return {
      skip: 'Playwright is not resolvable (set WAYCRAFT_PLAYWRIGHT to its module path)',
    };
  const executablePath = process.env.WAYCRAFT_CHROMIUM;
  if (executablePath && !existsSync(executablePath))
    return { skip: `WAYCRAFT_CHROMIUM does not exist: ${executablePath}` };
  try {
    return {
      browser: await chromium.launch(executablePath ? { executablePath } : {}),
    };
  } catch (error) {
    return {
      skip: `Chromium cannot be launched: ${String(error.message).split('\n')[0]}`,
    };
  }
}

export function bundleReact() {
  const work = mkdtempSync(join(tmpdir(), 'waycraft-browser-react-'));
  const entry = join(work, 'entry.js');
  const out = join(work, 'bundle.js');
  // Verify the exact private cleanup target before acquiring any child files.
  if (dirname(entry) !== work || dirname(out) !== work)
    throw new Error('Invalid browser bundle fixture paths');
  try {
    const require = createRequire(join(ROOT, 'package.json'));
    writeFileSync(
      entry,
      `import * as React from ${JSON.stringify(require.resolve('react'))};import * as ReactDOM from ${JSON.stringify(require.resolve('react-dom'))};import * as Client from ${JSON.stringify(require.resolve('react-dom/client'))};window.__R={React,ReactDOM,Client};`,
    );
    execFileSync(
      join(ROOT, 'node_modules/.bin/rolldown'),
      [entry, '--format', 'iife', '--file', out],
      { cwd: ROOT, stdio: 'ignore' },
    );
    return readFileSync(out, 'utf8');
  } finally {
    // The allocator returned this verified private directory, never a shared entry.
    rmSync(work, { recursive: true, force: true });
  }
}

export const THEME = `:root{--dsw-alias-label-primary:#111;--dsw-alias-label-secondary:#555;--dsw-alias-border-l2:#ddd;--dsw-alias-border-l3:#ccc;--dsw-alias-bg-layer-1:#fff;--dsw-alias-bg-layer-2:#f6f6f6;--dsw-alias-brand-primary:#6b26d9;--dsw-alias-switch-thumb:#fff;--dsw-alias-label-primary-foreground:#fff}body{font:14px system-ui;color:#111}`;

/** Start the harness server; returns `{ url(lang), close() }`. */
export async function startServer() {
  const { apply } = await import(
    pathToFileURL(join(ROOT, 'dist/skills.js')).href
  );
  const root = await realpath(
    await mkdtemp(join(tmpdir(), 'waycraft-browser-')),
  );
  const doc = (n) => `---\nname: ${n}\ndescription: About ${n}.\n---\nBody`;
  const base = join(root, 'base');
  for (const n of ['alpha', 'beta', 'gamma', 'delta']) {
    await mkdir(join(base, n), { recursive: true });
    await writeFile(join(base, n, 'SKILL.md'), doc(n));
  }
  await mkdir(join(base, 'broken'), { recursive: true });
  await writeFile(join(base, 'broken', 'SKILL.md'), 'no front matter');
  const home = join(root, 'home');
  await mkdir(join(home, '.agents', 'skills'), { recursive: true });
  process.env.HOME = home;
  process.env.DSH_HOME = join(home, '.dsh');
  let route;
  const abort = new AbortController();
  const registry = { list: () => [] };
  apply(
    {
      skills: {
        registerProvider(c) {
          c({ signal: abort.signal, invalidate() {} });
          return () => abort.abort();
        },
      },
      effect(s) {
        s();
      },
      inject(_n, cb) {
        cb({
          effect(s) {
            s();
          },
          get(n) {
            return n === 'workspaceRegistry'
              ? registry
              : {
                  fetch: {
                    register(r) {
                      route = r;
                      return () => {};
                    },
                  },
                };
          },
        });
      },
      get(n) {
        if (n === 'workspaceRegistry') return registry;
      },
    },
    {
      sources: [{ id: 'base', path: base }],
      statePath: join(root, 'state', 'state.json'),
    },
  );
  const bundle = bundleReact();
  const client = readFileSync(join(ROOT, 'dist/client.js'), 'utf8');
  let port;
  const page = (
    lang,
  ) => `<!doctype html><html dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset=utf8><base href="http://127.0.0.1:${port}/"><style>${THEME}</style></head><body><main style="max-inline-size:760px;padding:16px"><div id="root"></div></main><script src="/bundle.js"></script><script>
const {React,ReactDOM,Client}=window.__R;const dict={};let Section;const lang=${JSON.stringify(lang)};
const ctx={locale:{register(_n,v){Object.assign(dict,v);return()=>{}},bind:()=>k=>dict[lang][k],language:{getSnapshot:()=>lang}},slots:{inject:(_n,s)=>s(),register(e,c){if(e.name==='settings.section')Section=c;return()=>{}}},effect(s){return s()},inject(names,cb){if(names.includes('uiWorkspace'))return;cb(ctx)}};
window.__ModuleLoader__={load({factory}){const api=factory(id=>id==='react'?React:id==='react-dom'?ReactDOM:{});api.apply({...ctx,effect(st,l){if(l&&l.startsWith('waycraft-skills'))st()},inject(names,cb){if(names.length===2&&names.includes('locale'))return cb(ctx)},slots:{inject:(_n,st)=>st(),register:()=>()=>{}}});const go=()=>{if(!Section)return setTimeout(go,50);Client.createRoot(document.getElementById('root')).render(React.createElement(Section));window.__ready=true};go()}};
</script><script>${client.replace(/<\/script>/g, '<\\/script>')}</script></body></html>`;
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/bundle.js') {
      res.setHeader('content-type', 'text/javascript');
      return res.end(bundle);
    }
    if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const r = await route.fetch(
        new Request(`http://${req.headers.host}${u.pathname}${u.search}`, {
          method: 'POST',
          headers: req.headers,
          body: Buffer.concat(chunks),
        }),
      );
      res.statusCode = r.status;
      r.headers.forEach((v, k) => res.setHeader(k, v));
      return res.end(Buffer.from(await r.arrayBuffer()));
    }
    res.setHeader('content-type', 'text/html');
    res.end(page(u.searchParams.get('lang') || 'en'));
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  port = server.address().port;
  return {
    url: (lang = 'en') => `http://127.0.0.1:${port}/?lang=${lang}`,
    post: (body) =>
      route.fetch(
        new Request('http://127.0.0.1/api/waycraft-skills.catalog', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-waycraft-skills': '1',
          },
          body: JSON.stringify(body),
        }),
      ),
    close: () => new Promise((ok) => server.close(ok)),
  };
}
