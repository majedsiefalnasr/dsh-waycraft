import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AccountPreferencesAdapter } from '../dist/providers/account-preferences.js';

test('prepared and direct streams retain CLI conversation affinity after Default changes', async () => {
  const calls = [];
  let accounts = [{ key: 'official-cli:fixture', label: 'CLI', accessMethod: 'official-cli' }, { key: 'direct:fixture', label: 'Direct', accessMethod: 'direct' }];
  const adapter = new AccountPreferencesAdapter({ provider: 'claude', accounts: async () => accounts,
    settings: { get: () => ({}), visible: () => true, modelName: (_p, _m, name) => name }, pool: () => ({ owns: async () => true, prepareCall: async () => ({ model: { id: 'model', name: 'Pool' }, async *stream() { calls.push('wrong-pool'); } }) }),
    adapter: { listOwnModels: async () => [{ id: 'model', name: 'Model' }], resolveOwnModel: async () => ({ id: 'model', name: 'Model' }), async *streamAccount(_options, account) { calls.push(account); } },
  });
  const prepared = await adapter.prepareCall('claude', 'model');
  accounts = [...accounts].reverse();
  const preparedAfterChange = await adapter.prepareCall('claude', 'model');
  const options = { provider: 'claude', model: 'model', messages: [{ role: 'assistant', content: 'prior', source: { provider: 'claude', replayState: { response: { kind: 'subscriptions-account-replay', account: 'official-cli:fixture' }, blocks: [] } } }, { role: 'user', content: 'next' }] };
  for await (const _ of prepared.stream(options)) {}
  for await (const _ of adapter.stream(options)) {}
  for await (const _ of preparedAfterChange.stream(options)) {}
  assert.deepEqual(calls, ['official-cli:fixture', 'official-cli:fixture', 'official-cli:fixture']);
});
