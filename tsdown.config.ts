// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12; see src/PROVENANCE.md.
import { defineConfig } from 'tsdown';
const external = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
];
export default defineConfig([
  {
    entry: { subscriptions: 'src/browser.ts' },
    outDir: 'dist',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    clean: false,
    external,
    noExternal: (id) => (external.includes(id) ? undefined : true),
    outputOptions: {
      entryFileNames: 'subscriptions-client.js',
      banner: 'const waycraftSubscriptionsFactory = (require) => {',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      footer: 'return module.exports; };',
    },
  },
  {
    entry: { mcp: 'src/mcp-browser.ts' },
    outDir: 'dist',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    clean: false,
    external,
    noExternal: (id) => (external.includes(id) ? undefined : true),
    outputOptions: {
      entryFileNames: 'mcp-client.js',
      banner: 'const waycraftMcpFactory = (require) => {',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      footer: 'return module.exports; };',
    },
  },
]);
