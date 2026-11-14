/**
 * What an Official CLI session may use is decided by the MCP manager and the Skill manager (ADR-0006). Both are
 * components of this one plugin, loaded into one process, so each registers a read-only source here while it is on and
 * removes it when it goes off; the Subscriptions component reads the sources at the start of every turn. A component
 * that is off has no source, which means "not governing": the CLI session gets none of that manager's items.
 *
 * Nothing here writes to either manager. A source answers with names and configuration the manager already holds.
 */

/** Where the MCP manager's saved configuration is, as the manager itself reads it. */
export interface McpManagerSource {
  configPath: string;
}

/** The names of the skills the Skill manager keeps from a session (every copy of the name is switched off). */
export type SkillVisibilitySource = () => Promise<ReadonlySet<string>>;

const mcpManagers: McpManagerSource[] = [];
const skillManagers: SkillVisibilitySource[] = [];

function register<T>(list: T[], source: T): () => void {
  list.push(source);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const at = list.indexOf(source);
    if (at >= 0) list.splice(at, 1);
  };
}

/** Called by the MCP manager while it is on; the returned function removes the registration. */
export const registerMcpManager = (source: McpManagerSource): (() => void) =>
  register(mcpManagers, source);

/** Called by the Skill manager while it is on; the returned function removes the registration. */
export const registerSkillVisibility = (
  source: SkillVisibilitySource,
): (() => void) => register(skillManagers, source);

/** The MCP manager that is on now, or `undefined` when the component is off. */
export const activeMcpManager = (): McpManagerSource | undefined =>
  mcpManagers.at(-1);

/** The Skill manager's visibility source, or `undefined` when the component is off. */
export const activeSkillVisibility = (): SkillVisibilitySource | undefined =>
  skillManagers.at(-1);
