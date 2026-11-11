// Opt-in real-browser harness for the MCP manager: serves dist/mcp-client.js with the real host
// route from dist/mcp.js over a seeded temp config. Same Playwright resolution as harness.mjs.
import http from 'node:http';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundleReact, THEME } from './harness.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const SEED = `
- id: mcp-github
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: github
    transport: stdio
    command: sh
    args: ["-c", "exec npx -y @modelcontextprotocol/server-github"]
    env:
      GITHUB_TOKEN: \${credential:github-token}
- id: mcp-playwright
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: playwright
    transport: stdio
    command: npx
    args: ["@playwright/mcp@latest"]
- id: mcp-scenario
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: scenario
    transport: stdio
    command: npx
    args: ["-y", "mcp-remote", "https://mcp.scenario.com/mcp"]
- id: waycraft-mcp
  name: dsh-waycraft/mcp
`;

/** Dark theme close to the host so contrast problems show up. */
export const DARK = `:root{--dsw-alias-label-primary:#f2f2f2;--dsw-alias-label-secondary:#b4b4b4;--dsw-alias-label-tertiary:#8a8a8a;--dsw-alias-border-l2:#3a3a3a;--dsw-alias-border-l3:#4a4a4a;--dsw-alias-border-l4:#5a5a5a;--dsw-alias-bg-base:#1f1f1f;--dsw-alias-bg-layer-1:#262626;--dsw-alias-bg-layer-2:#2d2d2d;--dsw-alias-bg-layer-3:#353535;--dsw-alias-brand-primary:#e07a5f;--dsw-alias-button-primary-fill:#e07a5f;--dsw-alias-button-primary-hover:#e98b72;--dsw-alias-button-primary-dimmed:#5a3a30;--dsw-alias-switch-thumb:#1a1a1a;--dsw-alias-label-primary-foreground:#111;--dsw-alias-interactive-bg-hover:#333;--dsw-alias-interactive-bg-active:#3c3c3c;--dsw-alias-interactive-bg-hover-danger:#4a2a2a;--dsw-alias-state-error-primary:#ff6b6b;--dsw-alias-state-error-bg:#3a2222;--dsw-alias-state-warning-primary:#e6a23c;--dsw-alias-state-warning-bg:#3a3020;--dsw-alias-state-warning-border:#6b5320;--dsw-alias-state-warn-label:#e6a23c;--dsw-alias-state-business-primary:#6aa9ff;--dsw-alias-settings-card-fill:#2a2a2a;--dsw-alias-settings-card-stroke:#3d3d3d}body{margin:0;font:14px system-ui;background:#1f1f1f;color:#f2f2f2}`;

export async function startMcpServer({
  dark = true,
  seed = SEED,
  noRoute = false,
} = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'waycraft-mcp-browser-'));
  const configPath = join(dir, 'cordis.patch.yml');
  writeFileSync(configPath, seed, 'utf8');
  let route;
  if (!noRoute) {
    const { apply } = await import(
      pathToFileURL(join(ROOT, 'dist/mcp.js')).href
    );
    apply(
      {
        inject: (_d, cb) =>
          cb({
            get: (k) =>
              k === 'connection'
                ? {
                    fetch: {
                      register(r) {
                        route = r;
                        return () => {};
                      },
                    },
                  }
                : undefined,
          }),
        on: () => {},
      },
      { configPath },
    );
  }
  const bundle = bundleReact();
  const client = readFileSync(join(ROOT, 'dist/mcp-client.js'), 'utf8');
  let port;
  const page = (
    lang,
  ) => `<!doctype html><html dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset=utf8><style>${dark ? DARK : THEME}</style></head><body><main style="max-inline-size:760px;padding:16px"><div id="root"></div></main><script src="/bundle.js"></script><script>${client.replace(/<\/script>/g, '<\\/script>')}</script><script>
const {React,ReactDOM,Client}=window.__R;const dict={};let Section;const lang=${JSON.stringify(lang)};
const ctx={locale:{register(_n,v){Object.assign(dict,v);return()=>{}},bind:()=>k=>(dict[lang]||dict.en)[k]??k,language:{getSnapshot:()=>lang}},slots:{inject:(_n,s)=>s(),register(e,c){if(e.name==='settings.section')Section=c;return()=>{}}},effect(s){return s()}};
const f=waycraftMcpFactory(id=>id==='react'?React:id==='react-dom'?ReactDOM:{});
f.applyMcp({inject(names,cb){return cb(ctx)}});
const go=()=>{if(!Section)return setTimeout(go,50);Client.createRoot(document.getElementById('root')).render(React.createElement(Section));window.__ready=true};go();
</script></body></html>`;
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/bundle.js') {
      res.setHeader('content-type', 'text/javascript');
      return res.end(bundle);
    }
    if (req.method === 'POST') {
      if (!route) {
        res.statusCode = 404;
        return res.end('{}');
      }
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
    close: () => new Promise((ok) => server.close(ok)),
  };
}
