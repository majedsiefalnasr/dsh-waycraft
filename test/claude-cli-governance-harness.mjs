// Starts the real MCP manager and Skill manager components next to the Subscriptions harness, against temporary files
// only, so a Claude CLI turn can be driven end to end: manager state in, the CLI's arguments and MCP file out.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { apply as applyMcp } from '../dist/mcp.js';
import { apply as applySkills } from '../dist/skills.js';
import { applyTrustApprovalMeta, emptyTrust } from '../dist/mcp-trust.js';

/** A manager row as the MCP manager persists it; `trust` is 'trusted' (approved now), 'untrusted' or 'changed'. */
export function managerRow(config, { trust = 'trusted', disabled } = {}) {
  const row = {
    id: `mcp-${config.serverName}`,
    name: '@deepseek-ai/dsh-mcp-client',
    config,
    'x-waycraft-mcp': { owner: 'waycraft', version: 1 },
  };
  if (trust === 'trusted' || trust === 'changed') {
    row['x-waycraft-mcp'] = applyTrustApprovalMeta(
      row['x-waycraft-mcp'],
      config,
    );
    // A reviewed configuration that was edited afterwards: the approval no longer matches.
    if (trust === 'changed')
      row.config = { ...config, args: [...(config.args ?? []), '--edited'] };
  } else {
    row['x-waycraft-mcp'].trust = emptyTrust();
  }
  if (disabled !== undefined) row.disabled = disabled;
  return row;
}

/**
 * Start the MCP manager component on a config file inside the harness's private home. Rows are written as JSON, which
 * is valid YAML. Returns helpers to rewrite the file and to switch the component off.
 */
export function startMcpManager(t, harness, rows = []) {
  const configPath = join(harness.root, 'cordis.patch.yml');
  const disposers = [];
  const write = (next) => writeFile(configPath, JSON.stringify(next));
  const ready = (async () => {
    if (rows !== undefined) await write(rows);
  })();
  const target = {
    get: () => ({ fetch: { register: () => () => {} } }),
  };
  const ctx = {
    inject(_names, callback) {
      callback(target);
    },
    on(event, listener) {
      if (event === 'dispose') disposers.push(listener);
      return () => {};
    },
  };
  const stop = async () => {
    for (const dispose of disposers.splice(0)) await dispose();
  };
  t.after(stop);
  return {
    configPath,
    write,
    stop,
    start: async () => {
      await ready;
      applyMcp(ctx, { configPath });
    },
  };
}

/**
 * Start the Skill manager component on fixture sources (`{ sourceId: [skill names] }`) whose switches live in the
 * harness home. `post` drives the manager's own catalog route, so a switch is flipped the way the Owner flips it.
 */
export async function startSkillManager(t, harness, { sources }) {
  const roots = [];
  for (const [id, names] of Object.entries(sources)) {
    const path = join(harness.root, 'skill-sources', id);
    for (const name of names) {
      await mkdir(join(path, name), { recursive: true });
      await writeFile(
        join(path, name, 'SKILL.md'),
        `---\nname: ${name}\ndescription: ${name} fixture\n---\nBody`,
      );
    }
    await mkdir(path, { recursive: true });
    roots.push({ id, path });
  }
  const statePath = join(harness.root, 'skills-state.json');
  const controller = new AbortController();
  const stops = [];
  let route;
  const ctx = {
    skills: {
      registerProvider(create) {
        create({ signal: controller.signal, invalidate() {} });
        return () => controller.abort();
      },
    },
    effect(start) {
      const stop = start();
      if (stop) stops.push(stop);
    },
    inject(_names, callback) {
      callback(ctx);
    },
    get(name) {
      if (name === 'connection')
        return {
          fetch: {
            register(value) {
              route = value;
              return () => {};
            },
          },
        };
    },
  };
  applySkills(ctx, { sources: roots, statePath });
  const post = async (body) => {
    const response = await route.fetch(
      new Request('http://localhost/api/waycraft-skills.catalog', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-waycraft-skills': '1',
        },
        body: JSON.stringify(body),
      }),
    );
    assert.equal(response.status, 200);
    return response.json();
  };
  const stop = async () => {
    for (const fn of stops.splice(0).reverse()) await fn();
  };
  t.after(stop);
  return {
    post,
    stop,
    /** Switch a whole source off or on. */
    source: (id, enabled) =>
      post({ action: 'toggle', kind: 'source', id, enabled }),
    /** Switch one skill's copy off or on, found by name in the catalog. */
    async skill(name, enabled) {
      const { copies } = await post({ action: 'list' });
      const copy = copies.find((entry) => entry.name === name);
      assert.ok(copy, `skill ${name} is in the catalog`);
      return post({ action: 'toggle', kind: 'copy', id: copy.path, enabled });
    },
  };
}
