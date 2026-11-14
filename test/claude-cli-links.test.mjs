import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readlink,
  readdir,
  open,
  rm,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareClaudeCliAccountDirectory } from '../dist/auth/claude-cli.js';

test('Claude shared links repair removals, migrate private paths and preserve conflicts', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'waycraft-cli-links-'));
  const before = process.env.DSH_HOME;
  process.env.DSH_HOME = root;
  t.after(async () => {
    if (before === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = before;
    await rm(root, { recursive: true, force: true });
  });
  const base = join(root, 'plugins/waycraft/subscriptions/claude');
  const account = await prepareClaudeCliAccountDirectory('fixture');
  const shared = join(base, 'settings');
  assert.equal(await readlink(join(account, 'skills')), join(shared, 'skills'));
  await rm(join(account, 'skills'));
  await mkdir(join(account, 'skills'));
  await writeFile(join(account, 'skills', 'owned.md'), 'new');
  await writeFile(join(account, '.claude.json'), 'private');
  await prepareClaudeCliAccountDirectory('fixture');
  assert.equal(await readFile(join(shared, 'skills/owned.md'), 'utf8'), 'new');
  assert.equal(
    await readFile(join(account, '.claude.json'), 'utf8'),
    'private',
  );
  await writeFile(join(account, 'settings.json'), '{"throughLink":true}');
  await prepareClaudeCliAccountDirectory('fixture');
  await rm(join(account, 'settings.json'));
  await writeFile(join(account, 'settings.json'), '{"updated":true}');
  const writer = await open(join(account, 'settings.json'), 'a');
  await Promise.all([
    prepareClaudeCliAccountDirectory('fixture'),
    prepareClaudeCliAccountDirectory('fixture'),
  ]);
  await writer.write('late write');
  await writer.close();
  const snapshots = (await readdir(account)).filter((name) =>
    name.startsWith('.waycraft-reconciled-settings.json-'),
  );
  assert.ok(
    (
      await Promise.all(
        snapshots.map((name) => readFile(join(account, name), 'utf8')),
      )
    ).includes('{"updated":true}late write'),
  );
  assert.equal(
    await readFile(join(shared, 'settings.json'), 'utf8'),
    '{"updated":true}',
  );
  assert.equal(
    await readlink(join(account, 'settings.json')),
    join(shared, 'settings.json'),
  );
  await rm(join(account, 'skills'));
  await mkdir(join(account, 'skills'));
  await writeFile(join(account, 'skills/owned.md'), 'legitimate-change');
  await prepareClaudeCliAccountDirectory('fixture');
  assert.equal(
    await readFile(join(shared, 'skills/owned.md'), 'utf8'),
    'legitimate-change',
  );
  await rm(join(account, 'skills'));
  await mkdir(join(account, 'skills'));
  await writeFile(join(account, 'skills/owned.md'), 'conflict');
  await writeFile(join(shared, 'skills/owned.md'), 'provider-divergence');
  await assert.rejects(
    prepareClaudeCliAccountDirectory('fixture'),
    /Conflicting/,
  );
  assert.equal(
    await readFile(join(account, 'skills/owned.md'), 'utf8'),
    'conflict',
  );
  assert.equal(
    await readFile(join(shared, 'skills/owned.md'), 'utf8'),
    'provider-divergence',
  );
  await rm(join(account, 'skills'), { recursive: true });
  await symlink(join(root, 'outside'), join(account, 'skills'));
  await assert.rejects(
    prepareClaudeCliAccountDirectory('fixture'),
    /unexpected.*symlink/,
  );
});
