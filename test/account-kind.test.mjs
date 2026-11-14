import assert from 'node:assert/strict';
import { test } from 'node:test';
import { subscriptionAccountKey } from '../dist/providers/account-kind.js';

test('subscription account keys are namespaced by access method', () => {
  assert.equal(
    subscriptionAccountKey('direct', 'account-1'),
    'direct:account-1',
  );
  assert.equal(
    subscriptionAccountKey('official-cli', 'account-1'),
    'official-cli:account-1',
  );
  assert.notEqual(
    subscriptionAccountKey('direct', 'account-1'),
    subscriptionAccountKey('official-cli', 'account-1'),
  );
});

test('subscription account keys encode the storage key', () => {
  assert.equal(
    subscriptionAccountKey('official-cli', 'account:one/二'),
    'official-cli:account%3Aone%2F%E4%BA%8C',
  );
});
