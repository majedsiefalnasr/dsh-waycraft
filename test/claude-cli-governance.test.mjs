// #186: a Claude Official CLI run gets exactly what the MCP manager and the Skill manager allow. The real Subscriptions,
// MCP manager and Skill manager components run against a fake CLI, temporary files and fake DSH services only.
import { test } from 'node:test';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assert, startHarness, textOf } from './claude-cli-control-harness.mjs';
import {
  managerRow,
  startMcpManager,
  startSkillManager,
} from './claude-cli-governance-harness.mjs';

// A made-up value that stands in for a real secret in a server's configuration; it must never reach a log.
const SECRET = 'fixture-secret-do-not-log-1234567890';

const stdio = (serverName, extra = {}) => ({
  serverName,
  transport: 'stdio',
  command: 'node',
  args: [`${serverName}.js`],
  ...extra,
});

// The fake CLI also appends evidence-only records; a run's own record is the one that carries its arguments.
const runs = async (harness) =>
  (await harness.records()).filter((entry) => 'args' in entry);
const lastRecord = async (harness) => (await runs(harness)).at(-1);

const configLeftovers = async (harness) =>
  (await readdir(harness.directory)).filter((name) =>
    name.startsWith('.waycraft-mcp-'),
  );

test('a run is started with exactly the servers the MCP manager enabled, plus the DSH tools', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, [
    managerRow(stdio('alpha', { env: { API_MODE: 'strict', TOKEN: SECRET } })),
    managerRow({
      serverName: 'beta',
      transport: 'streamable-http',
      url: 'https://beta.example.test/mcp',
      headers: { Authorization: `Bearer ${SECRET}` },
    }),
    managerRow(stdio('gamma'), { trust: 'untrusted' }),
    managerRow(stdio('delta'), { trust: 'changed' }),
    managerRow(stdio('epsilon'), { disabled: true }),
    managerRow(stdio('zeta', { env: { TOKEN: '${credential:zeta-token}' } })),
    managerRow(stdio('eta', { cwd: '/somewhere' })),
  ]);
  await manager.start();
  assert.equal(textOf(await harness.run('scenario:mcp')), '');
  const { args, mcpServers } = (await runs(harness))[0];
  assert.deepEqual(Object.keys(mcpServers).sort(), [
    'alpha',
    'beta',
    'waycraft-dsh-tools',
  ]);
  assert.deepEqual(mcpServers.alpha, {
    type: 'stdio',
    command: 'node',
    args: ['alpha.js'],
    env: { API_MODE: 'strict', TOKEN: SECRET },
  });
  assert.deepEqual(mcpServers.beta, {
    type: 'http',
    url: 'https://beta.example.test/mcp',
    headers: { Authorization: `Bearer ${SECRET}` },
  });
  assert.ok(
    args.includes('--strict-mcp-config'),
    "the CLI's own servers stay out",
  );
  assert.deepEqual(
    await configLeftovers(harness),
    [],
    'the run configuration is removed after the turn',
  );
});

test('the run configuration is private to the account directory and gone when the turn ends', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, [managerRow(stdio('alpha'))]);
  await manager.start();
  await harness.run('scenario:mcp');
  const { args } = (await runs(harness))[0];
  const path = args[args.indexOf('--mcp-config') + 1];
  assert.ok(path.startsWith(harness.directory), 'inside the account directory');
  await assert.rejects(stat(path), 'the file no longer exists');
});

test('enabling, disabling or trusting a server applies to the next run without editing a CLI file', async (t) => {
  const harness = await startHarness(t);
  const alpha = stdio('alpha');
  const beta = stdio('beta');
  const manager = startMcpManager(t, harness, [
    managerRow(alpha),
    managerRow(beta, { trust: 'untrusted' }),
  ]);
  await manager.start();
  await harness.run('scenario:mcp');
  await manager.write([
    managerRow(alpha, { disabled: true }),
    managerRow(beta),
  ]);
  await harness.run('scenario:mcp');
  const [first, second] = await runs(harness);
  assert.deepEqual(Object.keys(first.mcpServers).sort(), [
    'alpha',
    'waycraft-dsh-tools',
  ]);
  assert.deepEqual(Object.keys(second.mcpServers).sort(), [
    'beta',
    'waycraft-dsh-tools',
  ]);
});

test('a server the manager lists under the DSH tools name cannot replace them', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, [
    managerRow(stdio('waycraft-dsh-tools')),
  ]);
  await manager.start();
  await harness.run('scenario:mcp');
  const { mcpServers, mcpEvidence } = (await runs(harness))[0];
  assert.deepEqual(Object.keys(mcpServers), ['waycraft-dsh-tools']);
  assert.equal(mcpServers['waycraft-dsh-tools'].type, 'http');
  assert.match(mcpEvidence.url, /^http:\/\/127\.0\.0\.1:\d+\/mcp$/);
});

test('with the manager component off, only the DSH tools server is given and the run goes on', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, [managerRow(stdio('alpha'))]);
  // Never started: the component is off.
  assert.equal(textOf(await harness.run('scenario:mcp')), '');
  const { args, mcpServers } = (await runs(harness))[0];
  assert.deepEqual(Object.keys(mcpServers), ['waycraft-dsh-tools']);
  assert.ok(args.includes('--strict-mcp-config'));
  // Started and then stopped again: the same.
  await manager.start();
  await manager.stop();
  await harness.run('scenario:mcp');
  assert.deepEqual(Object.keys((await lastRecord(harness)).mcpServers), [
    'waycraft-dsh-tools',
  ]);
});

test('a missing manager config file means no manager servers and no notice', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, undefined);
  await manager.start();
  await harness.run('scenario:mcp');
  assert.deepEqual(Object.keys((await lastRecord(harness)).mcpServers), [
    'waycraft-dsh-tools',
  ]);
});

test('a manager config that cannot be read lets the run continue without manager servers and says so once per session', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, undefined);
  await manager.start();
  const { writeFile } = await import('node:fs/promises');
  await writeFile(manager.configPath, 'rows: [unclosed\n  - : :');
  assert.equal(textOf(await harness.run('scenario:plain')), 'Hello');
  assert.deepEqual(Object.keys((await lastRecord(harness)).mcpServers), [
    'waycraft-dsh-tools',
  ]);
  const notice = () => harness.notice('fixture-session');
  const first = await notice();
  assert.equal(first.active, true);
  assert.equal(first.kind, 'manager-config-unreadable');
  // The next turn of the same session raises nothing new.
  await harness.run('scenario:plain');
  assert.equal((await notice()).revision, first.revision);
  // Another session is told on its own.
  await harness.run('scenario:plain', { sessionId: 'other-session' });
  assert.equal((await harness.notice('other-session')).active, true);
  // Once the file reads again, a later failure is a new notice.
  await manager.write([]);
  await harness.run('scenario:plain');
  await writeFile(manager.configPath, 'rows: [unclosed\n  - : :');
  await harness.run('scenario:plain');
  assert.ok((await notice()).revision > first.revision);
});

test('no secret from a server configuration reaches a log, a notice or a status answer', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, [
    managerRow(stdio('alpha', { env: { TOKEN: SECRET } })),
    managerRow(stdio('beta', { env: { TOKEN: SECRET } }), {
      trust: 'untrusted',
    }),
    managerRow(stdio('gamma', { env: { TOKEN: '${credential:gamma}' } })),
  ]);
  await manager.start();
  await harness.run('scenario:mcp');
  const { writeFile } = await import('node:fs/promises');
  await writeFile(manager.configPath, `unreadable: [ ${SECRET}`);
  await harness.run('scenario:plain');
  assert.ok(
    harness.warnings.length > 0,
    'the unreadable configuration was logged, without its content',
  );
  const surfaces = JSON.stringify([
    harness.warnings,
    await harness.notice('fixture-session'),
    await harness.status(),
  ]);
  assert.equal(surfaces.includes(SECRET), false);
  assert.equal(surfaces.includes('credential:gamma'), false);
});

test('a title or summary request gets no manager server', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, [managerRow(stdio('alpha'))]);
  await manager.start();
  await harness.run('scenario:plain', { purpose: 'session-title' });
  const [{ args, mcpServers }] = await runs(harness);
  assert.equal(mcpServers, undefined);
  assert.equal(args.includes('--mcp-config'), false);
  assert.ok(args.includes('--strict-mcp-config'));
});

test('a session without DSH tools still gets the manager servers', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, [managerRow(stdio('alpha'))]);
  await manager.start();
  await harness.run('scenario:plain', { sessionId: undefined });
  const { args, mcpServers } = (await runs(harness))[0];
  assert.deepEqual(Object.keys(mcpServers), ['alpha']);
  assert.ok(args.includes('--strict-mcp-config'));
  assert.deepEqual(await configLeftovers(harness), []);
});

test('the manage page data lists excluded servers by name and reason, and never a value', async (t) => {
  const harness = await startHarness(t);
  const manager = startMcpManager(t, harness, [
    managerRow(stdio('alpha', { env: { TOKEN: SECRET } })),
    managerRow(stdio('gamma'), { trust: 'untrusted' }),
    managerRow(stdio('delta'), { trust: 'changed' }),
    managerRow(stdio('epsilon'), { disabled: true }),
    managerRow(stdio('zeta', { env: { TOKEN: '${credential:zeta}' } })),
    managerRow(stdio('eta', { cwd: '/somewhere' })),
  ]);
  await manager.start();
  const { cliGovernance } = (await harness.status()).claude;
  assert.equal(cliGovernance.mcp.state, 'ok');
  assert.deepEqual(cliGovernance.mcp.included, ['alpha']);
  assert.deepEqual(
    cliGovernance.mcp.excluded.sort((a, b) =>
      a.serverName.localeCompare(b.serverName),
    ),
    [
      { serverName: 'delta', reason: 'changed' },
      { serverName: 'epsilon', reason: 'disabled' },
      { serverName: 'eta', reason: 'unsupported' },
      { serverName: 'gamma', reason: 'untrusted' },
      { serverName: 'zeta', reason: 'needs-credential' },
    ],
  );
  await manager.stop();
  assert.equal(
    (await harness.status()).claude.cliGovernance.mcp.state,
    'component-off',
  );
});

test('skills that ship inside a CLI plugin are listed for the manage page by plugin and name', async (t) => {
  const harness = await startHarness(t);
  const settings = join(harness.directory, 'settings');
  const skillDirectory = (...parts) =>
    join(settings, 'plugins', 'cache', ...parts, 'skills');
  for (const [plugin, skill] of [
    ['tools', 'review'],
    ['tools', 'deploy'],
    ['notes', 'journal'],
  ]) {
    const directory = join(skillDirectory('market', plugin, '1.0.0'), skill);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'SKILL.md'), `---\nname: ${skill}\n---\n`);
  }
  // A plugin directory without a skills folder, and a folder without a SKILL.md, are not skills.
  await mkdir(join(settings, 'plugins', 'cache', 'market', 'bare', '1.0.0'), {
    recursive: true,
  });
  await mkdir(join(skillDirectory('market', 'tools', '1.0.0'), 'empty'), {
    recursive: true,
  });
  const { cliGovernance } = (await harness.status()).claude;
  assert.deepEqual(
    cliGovernance.pluginSkills.sort((a, b) => a.skill.localeCompare(b.skill)),
    [
      { plugin: 'tools', skill: 'deploy' },
      { plugin: 'notes', skill: 'journal' },
      { plugin: 'tools', skill: 'review' },
    ],
  );
});

test('Provider capabilities declare that credential servers are not supported in CLI sessions', async () => {
  const { CLAUDE_CAPABILITIES } = await import(
    '../dist/provider-capabilities.js'
  );
  assert.ok(
    CLAUDE_CAPABILITIES.cliTools.limitations.some((text) =>
      /credential/i.test(text),
    ),
  );
});

// The Skill manager side.

const skillSettings = (args) => {
  const at = args.indexOf('--settings');
  return at < 0 ? undefined : JSON.parse(args[at + 1]);
};

test('a skill switched off in the Skill manager is hidden from the CLI in that run', async (t) => {
  const harness = await startHarness(t);
  const skills = await startSkillManager(t, harness, {
    sources: { main: ['keep-me', 'hide-me'], extra: ['source-hidden'] },
  });
  await harness.run('scenario:plain');
  assert.equal(
    skillSettings((await lastRecord(harness)).args),
    undefined,
    'nothing is switched off yet',
  );
  await skills.skill('hide-me', false);
  await skills.source('extra', false);
  await harness.run('scenario:plain');
  assert.deepEqual(skillSettings((await lastRecord(harness)).args), {
    skillOverrides: { 'hide-me': 'off', 'source-hidden': 'off' },
  });
});

test('switching a skill back on, or the Skill manager off, applies to the next run', async (t) => {
  const harness = await startHarness(t);
  const skills = await startSkillManager(t, harness, {
    sources: { main: ['one', 'two'] },
  });
  await skills.skill('one', false);
  await harness.run('scenario:plain');
  assert.deepEqual(skillSettings((await lastRecord(harness)).args), {
    skillOverrides: { one: 'off' },
  });
  await skills.skill('one', true);
  await harness.run('scenario:plain');
  assert.equal(skillSettings((await lastRecord(harness)).args), undefined);
  await skills.skill('two', false);
  await skills.stop();
  await harness.run('scenario:plain');
  assert.equal(
    skillSettings((await lastRecord(harness)).args),
    undefined,
    'with the manager off the CLI follows its own skills',
  );
});

test('a name that another enabled copy still provides stays visible', async (t) => {
  const harness = await startHarness(t);
  const skills = await startSkillManager(t, harness, {
    sources: { first: ['shared', 'solo'], second: ['shared'] },
  });
  await skills.source('first', false);
  await harness.run('scenario:plain');
  assert.deepEqual(skillSettings((await lastRecord(harness)).args), {
    skillOverrides: { solo: 'off' },
  });
});

test('a title or summary request carries no skill settings', async (t) => {
  const harness = await startHarness(t);
  const skills = await startSkillManager(t, harness, {
    sources: { main: ['one'] },
  });
  await skills.skill('one', false);
  await harness.run('scenario:plain', { purpose: 'session-title' });
  assert.equal(skillSettings((await lastRecord(harness)).args), undefined);
});
