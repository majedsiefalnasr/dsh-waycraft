// Every translated key the owned UI can request must exist with real copy in both shipped locales.
// Regression: English held eight values equal to their key name and the tool checkboxes asked for missing keys.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (name) =>
  JSON.parse(
    readFileSync(new URL(`../locale/${name}.json`, import.meta.url), 'utf8'),
  ).subscriptions;
// adds the composer usage badge (`translate(...)`) and Speed control (`t(...)`) sources.
const sources = [
  ...['settings', 'usage-badge', 'speed'].flatMap((dir) =>
    readdirSync(new URL(`../src/${dir}/`, import.meta.url)).map(
      (file) => `src/${dir}/${file}`,
    ),
  ),
  'src/browser.ts',
  'src/codex-card.ts',
  'src/claude-card.ts',
  'src/cli-governance-notice.ts',
].filter((file) => /\.tsx?$/.test(file));
const used = new Map();
for (const file of sources) {
  const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  // t('key'), t(cond ? 'a' : 'b'), NOTICE_KEYS-style tables, and keys passed through props named *Key.
  for (const call of text.matchAll(
    /\b(?:t|translate)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g,
  ))
    for (const key of call[1].matchAll(/'([A-Za-z][A-Za-z0-9]+)'/g))
      used.set(key[1], file);
  for (const key of text.matchAll(
    /:\s*'((?:modelDefaults|accounts|models|proxy)[A-Za-z0-9]*)'/g,
  ))
    used.set(key[1], file);
}
const en = read('en'),
  ar = read('ar');
// State strings from ternaries (not translation keys) and English words whose natural copy equals the key.
const notKeys = new Set(['test', 'save', 'reset', 'fast', 'standard']);
const naturalWords = new Set(['resets', 'available']);
for (const key of notKeys) used.delete(key);

test('the scan finds the keys the UI requests', () => {
  assert.ok(used.size > 40, `scanned ${used.size} keys`);
  for (const key of [
    'modelsImage',
    'modelsWebSearch',
    'modelDefaultsNoAccount',
    'resets',
  ])
    assert.ok(used.has(key), key);
  // surfaces: badge panel, display setting, Speed menu and /fast copy must be scanned too.
  for (const key of [
    'usageBadgeTitle',
    'usageBadgeDisplay',
    'speed',
    'speedFast',
    'commandFast',
    'commandFastUnavailable',
    'usageBadgeMoreWindows',
  ])
    assert.ok(used.has(key), key);
  // Claude card and cache lifetime copy.
  for (const key of [
    'claudeProviderUnavailable',
    'addAccountOAuth',
    'addAccountKeychain',
    'claudeAddAccountHint',
  ])
    assert.ok(used.has(key), key);
});

test('every requested key has copy in both locales and no value is a bare key name', () => {
  const missing = [];
  for (const [key, file] of used)
    for (const [locale, table] of [
      ['en', en],
      ['ar', ar],
    ])
      if (!table[key]) missing.push(`${locale}:${key} (${file})`);
  assert.deepEqual(missing, []);
  for (const [locale, table] of [
    ['en', en],
    ['ar', ar],
  ]) {
    assert.deepEqual(
      Object.entries(table)
        .filter(([key, value]) => value === key && !naturalWords.has(key))
        .map(([key]) => key),
      [],
      `${locale} placeholder values`,
    );
  }
});

test('both locales define the same keys and Arabic is Arabic where English is prose', () => {
  assert.deepEqual(
    Object.keys(en).filter((key) => !(key in ar)),
    [],
    'keys missing from ar',
  );
  assert.deepEqual(
    Object.keys(ar).filter((key) => !(key in en)),
    [],
    'keys missing from en',
  );
  for (const key of [
    'modelsImage',
    'modelsWebSearch',
    'modelDefaultsNoModels',
    'modelDefaultsNoAccount',
    'modelDefaultsDiscoveryFailed',
    'modelDefaultsLoadFailed',
    'modelDefaultsRefresh',
  ]) {
    assert.match(ar[key], /[\u0600-\u06ff]/, key);
    assert.match(en[key], /[A-Za-z]{3}/, key);
  }
  assert.match(en.modelDefaultsNoAccount, /account/i);
  assert.match(en.modelDefaultsDiscoveryFailed, /refresh/i);
});
