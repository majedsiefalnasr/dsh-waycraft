/**
 * What the MCP manager and the Skill manager hand to a Claude Official CLI run (ADR-0006, #186). Read-only, and read
 * again at the start of every turn, so a change in either manager applies to the next run without touching a CLI file.
 *
 * Nothing in this module logs or returns a server's environment, headers, arguments or any other configuration value
 * except in the run's private configuration file, which only the CLI reads. Everything the Owner sees (the manage page,
 * a session notice) carries server names and reasons, never values.
 */
import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { activeMcpManager, activeSkillVisibility } from '../cli-governance.js';
import { McpCordisConfigStore } from '../mcp-config-store.js';
import { DSH_TOOLS_SERVER, type ClaudeCliMcpServer } from './claude-cli-mcp.js';

/** Why a server of the MCP manager is not given to a CLI run. */
export type McpExclusionReason =
  | 'disabled'
  | 'untrusted'
  | 'changed'
  | 'needs-credential'
  | 'unsupported';

/**
 * `ok`: the manager is on and its saved configuration was read (a missing file reads as no servers).
 * `component-off`: the manager is off, so it governs nothing and no server of it is given.
 * `unreadable`: the manager is on but its saved configuration cannot be read, so no server of it is given.
 */
export type McpManagerState = 'ok' | 'component-off' | 'unreadable';

export interface ClaudeCliMcpGovernance {
  state: McpManagerState;
  /** The servers for `--mcp-config`, by name. Absent when nothing is given. */
  servers: Record<string, ClaudeCliMcpServer>;
  included: string[];
  excluded: Array<{ serverName: string; reason: McpExclusionReason }>;
}

const CREDENTIAL_REFERENCE = /\$\{credential:/;

const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/**
 * A manager server in the CLI's configuration shape, or `unsupported` when the CLI has no equivalent: a working
 * directory (the CLI's stdio entries have none), a missing command or address, or an unknown transport.
 */
function toClaudeServer(
  config: Record<string, unknown>,
): ClaudeCliMcpServer | 'unsupported' {
  if (config.transport === 'stdio') {
    if (!isText(config.command) || config.cwd !== undefined)
      return 'unsupported';
    return {
      type: 'stdio',
      command: config.command,
      ...(Array.isArray(config.args) ? { args: config.args } : {}),
      ...(config.env && typeof config.env === 'object'
        ? { env: config.env }
        : {}),
    };
  }
  if (config.transport === 'streamable-http') {
    if (!isText(config.url)) return 'unsupported';
    return {
      type: 'http',
      url: config.url,
      ...(config.headers && typeof config.headers === 'object'
        ? { headers: config.headers }
        : {}),
    };
  }
  return 'unsupported';
}

/**
 * The servers the MCP manager enabled: not in trash, not switched off, and trusted for exactly the configuration now
 * saved. A server that needs a DSH credential is left out (its value would have to be written to disk or handed over
 * by a path that is not verified yet); a server the CLI cannot express is left out. Each leftover gets one reason.
 */
export async function readManagerMcp(): Promise<ClaudeCliMcpGovernance> {
  const source = activeMcpManager();
  if (!source)
    return { state: 'component-off', servers: {}, included: [], excluded: [] };
  let snapshot: Awaited<ReturnType<McpCordisConfigStore['snapshot']>>;
  try {
    snapshot = await new McpCordisConfigStore({
      configPath: source.configPath,
    }).snapshot();
  } catch {
    // Not even the error text is kept: a parser message can quote the file.
    return { state: 'unreadable', servers: {}, included: [], excluded: [] };
  }
  const servers: Record<string, ClaudeCliMcpServer> = {};
  const included: string[] = [];
  const excluded: ClaudeCliMcpGovernance['excluded'] = [];
  for (const entry of snapshot.servers) {
    const leave = (reason: McpExclusionReason) =>
      excluded.push({ serverName: entry.serverName, reason });
    if (entry.disabled === true) leave('disabled');
    else if (entry.trust.state === 'invalidated') leave('changed');
    else if (entry.trust.state !== 'trusted') leave('untrusted');
    else if (CREDENTIAL_REFERENCE.test(JSON.stringify(entry.config)))
      leave('needs-credential');
    else if (entry.serverName === DSH_TOOLS_SERVER) leave('unsupported');
    else {
      const server = toClaudeServer(entry.config);
      if (server === 'unsupported') leave('unsupported');
      else {
        servers[entry.serverName] = server;
        included.push(entry.serverName);
      }
    }
  }
  return { state: 'ok', servers, included, excluded };
}

/** The skill names the Skill manager keeps from a session, sorted; none when the manager is off. */
export async function readHiddenSkills(): Promise<string[]> {
  const source = activeSkillVisibility();
  return source ? [...(await source())].sort() : [];
}

/** The `--settings` JSON that hides those skills for one run, or `undefined` when none is hidden. */
export function skillSettingsArgument(
  hidden: readonly string[],
): string | undefined {
  return hidden.length
    ? JSON.stringify({
        skillOverrides: Object.fromEntries(hidden.map((name) => [name, 'off'])),
      })
    : undefined;
}

/** A skill shipped inside a CLI plugin: the CLI's per-skill switch does not reach it, so it follows the plugin. */
export interface CliPluginSkill {
  plugin: string;
  skill: string;
}

/**
 * Skills that ship inside plugins installed in the Provider settings (`plugins/cache/<marketplace>/<plugin>/<version>/
 * skills/<skill>/SKILL.md`). Names only, bounded, and an unreadable level is skipped.
 */
export async function readPluginSkills(
  providerSettings: string,
): Promise<CliPluginSkill[]> {
  const names = async (directory: string) => {
    try {
      return (await readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .slice(0, 256);
    } catch {
      return [];
    }
  };
  const found: CliPluginSkill[] = [];
  const cache = join(providerSettings, 'plugins', 'cache');
  for (const marketplace of await names(cache))
    for (const plugin of await names(join(cache, marketplace)))
      for (const version of await names(join(cache, marketplace, plugin)))
        for (const skill of await names(
          join(cache, marketplace, plugin, version, 'skills'),
        )) {
          const document = join(
            cache,
            marketplace,
            plugin,
            version,
            'skills',
            skill,
            'SKILL.md',
          );
          if (
            await access(document).then(
              () => true,
              () => false,
            )
          )
            found.push({ plugin, skill });
          if (found.length >= 512) return found;
        }
  return found;
}
