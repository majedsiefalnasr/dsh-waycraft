import { readFile, writeFile } from 'node:fs/promises';

const base = await readFile(new URL('../client.js', import.meta.url), 'utf8');
const subscriptions = await readFile(
  new URL('../dist/subscriptions-client.js', import.meta.url),
  'utf8',
);
const mcp = await readFile(
  new URL('../dist/mcp-client.js', import.meta.url),
  'utf8',
);

// First inject subscriptions
let result = base.replace(
  "    const React = require('react');",
  subscriptions +
    "\n    const subscriptions = waycraftSubscriptionsFactory(require);\n    const React = require('react');",
);

// Then inject mcp after subscriptions
result = result.replace(
  '    const subscriptions = waycraftSubscriptionsFactory(require);',
  '    const subscriptions = waycraftSubscriptionsFactory(require);\n    ' +
    mcp +
    '\n    const mcp = waycraftMcpFactory(require);',
);

await writeFile(new URL('../dist/client.js', import.meta.url), result);
console.log('Built dist/client.js');
