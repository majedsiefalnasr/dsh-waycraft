import { registerSkillVisibility } from './cli-governance.js';
import type {
  PreToolDecision,
  ToolExecution,
  ToolDefinition,
} from '@deepseek-ai/dsh-tools';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { parseDocument } from 'yaml';
import { discoverReadonlyEntries } from './skills-discovery.js';
import { LEGACY_SKILLS_HEADER, LEGACY_SKILLS_ROUTE } from './legacy-names.js';
import { legacySkillsRoot, migrateTree } from './storage-migration.js';
import {
  checkedTrashPath,
  listTrash,
  scanTrash,
  trashEntry,
  restoreEntry,
  deleteEntry,
} from './skills-trash.js';
import {
  localItems,
  uploadedItems,
  zipItems,
  uploadBatch,
  publishImports,
} from './skills-import.js';
import {
  createRepositories,
  PROJECT_ID,
  RepoError,
  type Destination,
  type RepositoryConfig,
} from './skills-repos.js';
import { type CatalogConfig, createCatalogs } from './skills-catalogs.js';
import {
  CUSTOM_ID,
  CUSTOM_RANK_BASE,
  CUSTOM_RANK_STEP,
  comparisonPath,
  customSlug,
  isSameOrDescendant,
  MAX_CUSTOM_SOURCES,
  MAX_LABEL,
  MAX_PATH,
  overlapsResolved,
  pathIdentity,
  PROJECT_SOURCES,
  type Project,
  prepareRoots,
  resolveProject,
  scanCandidates,
  validateRootPath,
} from './skills-sources.js';

/** Built-in provider roots a user may redirect; bounded so state stays small. */
const MAX_ROOT_OVERRIDES = 32;
/** Suffix of the protected-root entry that keeps an overridden provider's default folder reserved. */
const DEFAULT_SUFFIX = '#default';

export const name = 'dsh-waycraft/skills';
export const inject = ['skills'];

type Policy = { modelInvocable: boolean; userInvocable: boolean };
export interface Diagnostic {
  code: string;
  params: Record<string, string>;
  message: string;
}
interface Candidate {
  name: string;
  description: string;
  path: string;
  source: string;
  provider: string;
  rank: number;
  locator: string;
  invocation: Policy;
  content: string;
  eligible: boolean;
  policyValid: boolean;
  metadataValid?: boolean;
  /** Raw author policy, kept so source/copy state can be applied without rescanning. */
  author?: Policy;
  original?: string;
  diagnostics?: Diagnostic[];
}
interface Control {
  signal: AbortSignal;
  invalidate(): void;
}
interface Provider {
  name: string;
  list(options?: { cwd?: string; signal?: AbortSignal }): Promise<Candidate[]>;
  get(candidate: Candidate): Promise<Candidate | undefined>;
}
interface Agent {
  id: string;
  ctx: HostContext;
}
interface HostContext {
  logger?: { warn(message: string): void };
  skills: {
    registerProvider(create: (control: Control) => Provider): () => void;
  };
  effect(start: () => () => void, label: string): unknown;
  on?(
    event: 'tools/pre-execute',
    listener: (
      exec: ToolExecution,
      next: () => Promise<PreToolDecision>,
    ) => Promise<PreToolDecision>,
  ): () => void;
  on?(event: string, listener: (event: { agent: Agent }) => void): () => void;
  get?(name: 'tools'):
    | {
        get(name: string): ToolDefinition | undefined;
        register(definition: ToolDefinition): () => void;
      }
    | undefined;
  get?(name: 'agents'): { list(): Agent[] } | undefined;
  get?(name: 'skills'): HostContext['skills'] | undefined;
  get?(
    name: 'connection',
  ): { fetch: { register(route: object): () => void } } | undefined;
  get?(
    name: 'workspaceRegistry',
  ): { list(): Array<{ path?: string; cwd?: string }> } | undefined;
  inject?(names: string[], callback: (ctx: HostContext) => void): void;
}
interface Source {
  id: string;
  path: string;
  label?: string;
  enabled?: boolean;
  rank?: number;
  group?: string;
  custom?: boolean;
  /** Listed writable destination that does not exist yet; never scan it. */
  absent?: boolean;
  /** Built-in root redirected by the user: the original default folder. */
  defaultPath?: string;
  overridden?: boolean;
  /** Built-in provider root the user may redirect with root-set. */
  overridable?: boolean;
  /** Project id for project-scoped sources. */
  project?: string;
  /** Project source kind (dsh, agents, ...). */
  kind?: string;
}
interface Config {
  sources?: Source[];
  statePath?: string;
  /** Host-code seams for repository subscriptions (tests, packaging); never request-controlled. */
  repositories?: RepositoryConfig;
  /** Host-only catalog endpoint/limit seams (tests, packaging); never reachable from a request. */
  catalogs?: CatalogConfig;
}

const dominantReason = (details: { reason: string }[]): string => {
  const counts = new Map<string, number>();
  for (const x of details)
    counts.set(x.reason, (counts.get(x.reason) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
};
const diag = (
  code: string,
  params: Record<string, string>,
  message: string,
): Diagnostic => ({ code, params, message });

function policyValue(value: unknown, fallback: boolean): boolean | undefined {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && (value === 0 || value === 1))
    return value === 1;
  if (typeof value !== 'string') return undefined;
  if (/^(true|yes|on|1)$/i.test(value)) return true;
  if (/^(false|no|off|0)$/i.test(value)) return false;
  return undefined;
}

const READ_LIMIT = 1024 * 1024;
const MAX_REQUEST = 16384;
const CREATE_REQUEST = 2 * 1024 * 1024;

/** Reads at most `limit` bytes; `oversized` reports a longer file (text is then the prefix). */
async function readBounded(
  path: string,
  limit: number,
): Promise<{ text: string; oversized: boolean }> {
  const handle = await open(path, 'r');
  try {
    if (!(await handle.stat()).isFile()) throw new Error('Not a file');
    const buffer = Buffer.alloc(limit + 1);
    let total = 0;
    while (total < buffer.length) {
      const next = await handle.read(
        buffer,
        total,
        buffer.length - total,
        total,
      );
      if (!next.bytesRead) break;
      total += next.bytesRead;
    }
    return {
      text: buffer.subarray(0, Math.min(total, limit)).toString('utf8'),
      oversized: total > limit,
    };
  } finally {
    await handle.close();
  }
}

async function scan(
  source: Source,
  order: number,
  signal: AbortSignal | undefined,
  diagnostics: Diagnostic[],
): Promise<Candidate[]> {
  const sourceId = source.id;
  const root = await realpath(resolve(source.path)).catch(() =>
    resolve(source.path),
  );
  const discovered = await discoverReadonlyEntries(root, signal);
  if (discovered.truncated)
    diagnostics.push(
      diag(
        'discovery-truncated',
        { source: sourceId },
        `${sourceId}: discovery truncated`,
      ),
    );
  if (!discovered.exists)
    diagnostics.push(
      diag(
        'source-unavailable',
        { source: sourceId },
        `${sourceId}: source unavailable`,
      ),
    );
  if (discovered.errors.length)
    diagnostics.push(
      diag(
        'unreadable-entries',
        {
          source: sourceId,
          count: String(discovered.errors.length),
          // Up to five affected paths (newline separated) and the most common reason class.
          paths: discovered.errorDetails
            .slice(0, 5)
            .map((x) => x.path)
            .join('\n'),
          reason: dominantReason(discovered.errorDetails),
        },
        `${sourceId}: ${discovered.errors.length} entries could not be read`,
      ),
    );
  const rank =
    source.rank ??
    (sourceId === 'user-dsh'
      ? 400
      : sourceId === 'user-agents'
        ? 500
        : 300 + order);
  const result: Candidate[] = [];
  const base = {
    provider: 'waycraft-skills',
    source: sourceId,
    rank,
    eligible: true,
  };
  const invalid = (path: string, text: string, own: Diagnostic[]) =>
    result.push({
      ...base,
      name: path.split(/[\\/]/).slice(-2).join('/'),
      description: '',
      path,
      locator: path,
      eligible: false,
      policyValid: false,
      metadataValid: false,
      invocation: { modelInvocable: false, userInvocable: false },
      content: text,
      original: text,
      diagnostics: own,
    });
  const note = (own: Diagnostic) => diagnostics.push(own);
  for (const entry of discovered.entries) {
    if (signal?.aborted) return [];
    const path = entry.docPath;
    const actual = await realpath(path).catch(() => undefined);
    if (!actual) {
      note(
        diag(
          'unreadable-skill',
          { source: sourceId, path },
          `${sourceId}: unreadable skill ${path}`,
        ),
      );
      continue;
    }
    const own: Diagnostic[] = [];
    // Linked bundles are allowed (read-only) but a document resolving outside the root is reported.
    if (actual !== root && !actual.startsWith(root + sep))
      own.push(
        diag(
          'linked-outside-root',
          { source: sourceId, path },
          `${sourceId}: skill document resolves outside the source ${path}`,
        ),
      );
    let text: string;
    let oversized: boolean;
    try {
      ({ text, oversized } = await readBounded(actual, READ_LIMIT));
    } catch {
      note(
        diag(
          'unreadable-skill',
          { source: sourceId, path },
          `${sourceId}: unreadable skill ${path}`,
        ),
      );
      continue;
    }
    if (oversized)
      own.push(
        diag(
          'oversized-skill',
          { source: sourceId, path },
          `${sourceId}: oversized skill ${path}`,
        ),
      );
    if (!text) {
      note(
        diag(
          'empty-skill',
          { source: sourceId, path },
          `${sourceId}: empty skill ${path}`,
        ),
      );
      continue;
    }
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    const fail = (code: string, what: string) => {
      const d = diag(
        code,
        { source: sourceId, path },
        `${sourceId}: ${what} ${path}`,
      );
      for (const item of own) note(item);
      note(d);
      invalid(path, text, [...own, d]);
    };
    if (!match) {
      fail('invalid-frontmatter', 'invalid frontmatter');
      continue;
    }
    const doc = parseDocument(match[1], { uniqueKeys: true });
    if (doc.errors.length) {
      fail('invalid-yaml', 'invalid YAML');
      continue;
    }
    let data: Record<string, unknown>;
    try {
      data = doc.toJS({ maxAliasCount: 50 }) as Record<string, unknown>;
    } catch {
      fail('invalid-yaml', 'invalid YAML');
      continue;
    }
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      typeof data.name !== 'string' ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name) ||
      typeof data.description !== 'string'
    ) {
      fail('invalid-metadata', 'invalid metadata');
      continue;
    }
    const modelDisabled = policyValue(data['disable-model-invocation'], false);
    const user = policyValue(data['user-invocable'], true);
    const valid = modelDisabled !== undefined && user !== undefined;
    if (!valid)
      own.push(
        diag(
          'invalid-policy',
          { source: sourceId, path },
          `${sourceId}: invalid invocation policy ${path}`,
        ),
      );
    for (const item of own) if (!diagnostics.includes(item)) note(item);
    result.push({
      ...base,
      name: data.name,
      description: data.description,
      path,
      locator: path,
      // An oversized document is loadable by the native provider, so it is kept as a denied candidate.
      eligible: !oversized,
      policyValid: valid && !oversized,
      author: {
        modelInvocable: valid && !modelDisabled,
        userInvocable: valid && user === true,
      },
      invocation: { modelInvocable: false, userInvocable: false },
      content: oversized ? '' : text.slice(match[0].length),
      original: text,
      diagnostics: own,
    });
  }
  return result;
}

export function apply(ctx: HostContext, config: Config = {}) {
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh');
  const builtins: Array<[string, string, string?]> = [
    ['ccswitch', '.cc-switch'],
    ['codex', '.codex', 'DSH_CODEX_HOME'],
    ['claude', '.claude', 'DSH_CLAUDE_HOME'],
    ['gemini', '.gemini', 'DSH_GEMINI_HOME'],
    ['opencode', '.config/opencode', 'DSH_OPENCODE_HOME'],
    ['cursor', '.cursor', 'DSH_CURSOR_HOME'],
    ['copilot', '.copilot', 'DSH_COPILOT_HOME'],
    ['windsurf', '.codeium/windsurf', 'DSH_WINDSURF_HOME'],
    ['windsurf-user', '.windsurf', 'DSH_WINDSURF_USER_HOME'],
    ['trae', '.trae', 'DSH_TRAE_HOME'],
    ['trae-cn', '.trae-cn', 'DSH_TRAE_CN_HOME'],
    ['openclaw', '.openclaw', 'DSH_OPENCLAW_HOME'],
    ['clawdbot', '.clawdbot', 'DSH_CLAWDBOT_HOME'],
    ['roo', '.roo', 'DSH_ROO_HOME'],
    ['codebuddy', '.codebuddy', 'DSH_CODEBUDDY_HOME'],
    ['workbuddy', '.workbuddy', 'DSH_WORKBUDDY_HOME'],
    ['qoder', '.qoder', 'DSH_QODER_HOME'],
    ['qoder-cn', '.qoder-cn', 'DSH_QODER_CN_HOME'],
    ['lingma', '.lingma', 'DSH_LINGMA_HOME'],
    ['antigravity', '.gemini/config', 'DSH_ANTIGRAVITY_HOME'],
  ];
  const labels: Record<string, string> = {
    ccswitch: 'CC Switch',
    codex: 'Codex',
    claude: 'Claude',
    gemini: 'Gemini',
    opencode: 'OpenCode',
    cursor: 'Cursor',
    copilot: 'Copilot',
    windsurf: 'Windsurf',
    'windsurf-user': 'Windsurf (user)',
    trae: 'Trae',
    'trae-cn': 'Trae CN',
    openclaw: 'OpenClaw',
    clawdbot: 'Clawdbot',
    roo: 'Roo',
    codebuddy: 'CodeBuddy',
    workbuddy: 'WorkBuddy',
    qoder: 'Qoder',
    'qoder-cn': 'Qoder CN',
    lingma: 'Lingma',
    antigravity: 'Antigravity',
  };
  const baseSources: Source[] = config.sources ?? [
    { id: 'user-dsh', label: 'DSH', path: join(dshHome, 'skills'), rank: 400 },
    {
      id: 'user-agents',
      label: 'Agents',
      path: join(
        process.env.AGENTS_HOME || join(homedir(), '.agents'),
        'skills',
      ),
      rank: 500,
    },
    ...builtins.map(([id, path, env], i) => ({
      id,
      label: labels[id],
      path: join((env && process.env[env]) || join(homedir(), path), 'skills'),
      rank: 510 + i,
    })),
  ];
  const newStatePath =
    config.statePath ?? join(dshHome, 'waycraft-skills', 'state.json');
  // One-release migration: copy the retired state root once; a successful copy never modifies the legacy tree.
  let skillsMigration =
    config.statePath === undefined
      ? migrateTree(dirname(newStatePath), legacySkillsRoot(dshHome))
      : undefined;
  if (skillsMigration?.status === 'failed')
    skillsMigration = migrateTree(
      dirname(newStatePath),
      legacySkillsRoot(dshHome),
    ); // one retry before degrading
  // Degraded mode (migration failed twice, diagnosed by migrateTree): keep reading AND writing the legacy root as one
  // consistent store so state, trash, repositories and catalogs never fork between two roots. A later start that
  // migrates successfully copies the whole legacy tree, including those writes.
  const statePath =
    skillsMigration?.status === 'failed'
      ? join(legacySkillsRoot(dshHome), 'state.json')
      : newStatePath;
  interface CustomRecord {
    id: string;
    label: string;
    path: string;
    group?: string;
  }
  interface ProjectState {
    sources: Record<string, boolean>;
    copies: Record<string, boolean>;
  }
  /** Metadata for one source inside one scope ('global' or a project id); never moves or edits skill files. */
  interface Organization {
    categories: Array<{ id: string; name: string }>;
    /** Skill name -> category id; absent means uncategorized. */
    members: Record<string, string>;
    notes: Record<string, string>;
  }
  const PLACEMENTS = ['settings', 'sidebar', 'both'];
  const CATEGORY_NAME_MAX = 24;
  const CATEGORY_LIMIT = 64;
  const NOTE_MAX = 500;
  const NAME_MAX = 128;
  const BULK_MAX = 100;
  const MEMBER_MAX = 4096;
  const NOTE_COUNT_MAX = 1024;
  const SOURCES_PER_SCOPE_MAX = 256;
  /** Serialized state must stay readable: the loader refuses files over READ_LIMIT. */
  const STATE_WRITE_MAX = Math.floor(READ_LIMIT * 0.9);
  const emptyOrg = (): Organization => ({
    categories: [],
    members: Object.create(null),
    notes: Object.create(null),
  });
  const cloneOrg = (org: Organization): Organization => {
    const copy = emptyOrg();
    copy.categories = org.categories.map((item) => ({ ...item }));
    Object.assign(copy.members, org.members);
    Object.assign(copy.notes, org.notes);
    return copy;
  };
  type State = {
    sources: Record<string, boolean>;
    copies: Record<string, boolean>;
    customSources: CustomRecord[];
    /** Canonical folder overrides for built-in (non-DSH) provider roots, keyed by source id. */
    rootOverrides: Record<string, string>;
    /** Per-project policy keyed by project id; never consulted for global copies. */
    projects: Record<string, ProjectState>;
    /** Categories and notes per scope key, then per source id: same-named skills stay independent. */
    organization: Record<string, Record<string, Organization>>;
    /** Where the manager is reachable: Settings, sidebar or both. */
    placement: string;
  };
  const emptyState = (): State => ({
    sources: Object.create(null),
    copies: Object.create(null),
    customSources: [],
    rootOverrides: Object.create(null),
    projects: Object.create(null),
    organization: Object.create(null),
    placement: 'settings',
  });
  let state: State = emptyState();
  let corrupt = false;
  const isFlags = (value: unknown): value is Record<string, boolean> =>
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every((x) => typeof x === 'boolean');
  const parseState = (parsed: unknown): State => {
    const invalid = () => new Error('Invalid skill state');
    if (!parsed || typeof parsed !== 'object') throw invalid();
    const value = parsed as Partial<State>;
    if (!isFlags(value.sources) || !isFlags(value.copies)) throw invalid();
    const custom = value.customSources ?? [];
    if (!Array.isArray(custom) || custom.length > MAX_CUSTOM_SOURCES)
      throw invalid();
    const seen = new Set<string>();
    for (const item of custom as CustomRecord[]) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof item.id !== 'string' ||
        !CUSTOM_ID.test(item.id) ||
        seen.has(item.id) ||
        typeof item.label !== 'string' ||
        !item.label ||
        item.label.length > MAX_LABEL ||
        typeof item.path !== 'string' ||
        !isAbsolute(item.path) ||
        (item.group !== undefined &&
          (typeof item.group !== 'string' || item.group.length > MAX_LABEL))
      )
        throw invalid();
      seen.add(item.id);
    }
    const rawOverrides = value.rootOverrides ?? {};
    if (
      !rawOverrides ||
      typeof rawOverrides !== 'object' ||
      Array.isArray(rawOverrides) ||
      Object.keys(rawOverrides).length > MAX_ROOT_OVERRIDES
    )
      throw invalid();
    const rootOverrides: Record<string, string> = Object.create(null);
    for (const [id, path] of Object.entries(rawOverrides)) {
      if (
        !/^[a-z0-9-]{1,32}$/.test(id) ||
        typeof path !== 'string' ||
        !isAbsolute(path) ||
        path.length > MAX_PATH ||
        path.includes('\0')
      )
        throw invalid();
      rootOverrides[id] = path;
    }
    const projects = value.projects ?? {};
    if (!projects || typeof projects !== 'object' || Array.isArray(projects))
      throw invalid();
    const nextProjects: Record<string, ProjectState> = Object.create(null);
    for (const [id, entry] of Object.entries(projects)) {
      const item = entry as Partial<ProjectState> | undefined;
      if (
        !/^[0-9a-f]{16}$/.test(id) ||
        !item ||
        !isFlags(item.sources) ||
        !isFlags(item.copies)
      )
        throw invalid();
      nextProjects[id] = {
        sources: Object.assign(Object.create(null), item.sources),
        copies: Object.assign(Object.create(null), item.copies),
      };
    }
    const organization: Record<
      string,
      Record<string, Organization>
    > = Object.create(null);
    const rawOrg = value.organization ?? {};
    if (!rawOrg || typeof rawOrg !== 'object' || Array.isArray(rawOrg))
      throw invalid();
    const isMap = (x: unknown): x is Record<string, unknown> =>
      !!x && typeof x === 'object' && !Array.isArray(x);
    const parseOrg = (entry: Record<string, unknown>): Organization => {
      const org = emptyOrg();
      if (!Array.isArray(entry.categories)) throw invalid();
      if (entry.categories.length > CATEGORY_LIMIT) throw invalid();
      const ids = new Set<string>();
      const names = new Set<string>();
      for (const item of entry.categories as unknown[]) {
        if (
          !isMap(item) ||
          typeof item.id !== 'string' ||
          !/^[0-9a-f]{16}$/.test(item.id) ||
          typeof item.name !== 'string' ||
          !item.name ||
          item.name !== item.name.trim() ||
          item.name.length > CATEGORY_NAME_MAX ||
          ids.has(item.id) ||
          names.has(item.name)
        )
          throw invalid();
        ids.add(item.id);
        names.add(item.name);
        org.categories.push({ id: item.id, name: item.name });
      }
      if (!isMap(entry.members) || !isMap(entry.notes)) throw invalid();
      if (
        Object.keys(entry.members).length > MEMBER_MAX ||
        Object.keys(entry.notes).length > NOTE_COUNT_MAX
      )
        throw invalid();
      for (const [skill, id] of Object.entries(entry.members)) {
        if (
          skill === '__proto__' ||
          skill.length > NAME_MAX ||
          typeof id !== 'string' ||
          !ids.has(id)
        )
          throw invalid();
        org.members[skill] = id;
      }
      // `entry.order` (saved before reordering was removed) is accepted and discarded.
      for (const [skill, note] of Object.entries(entry.notes)) {
        if (
          skill === '__proto__' ||
          skill.length > NAME_MAX ||
          typeof note !== 'string' ||
          !note ||
          note.length > NOTE_MAX
        )
          throw invalid();
        org.notes[skill] = note;
      }
      return org;
    };
    for (const [scope, sources] of Object.entries(rawOrg)) {
      if (
        !(scope === 'global' || /^[0-9a-f]{16}$/.test(scope)) ||
        !isMap(sources) ||
        Object.keys(sources).length > SOURCES_PER_SCOPE_MAX
      )
        throw invalid();
      const bySource: Record<string, Organization> = Object.create(null);
      for (const [sourceId, entry] of Object.entries(sources)) {
        if (!sourceId || sourceId.length > NAME_MAX || !isMap(entry))
          throw invalid();
        bySource[sourceId] = parseOrg(entry);
      }
      organization[scope] = bySource;
    }
    const placement = value.placement ?? 'settings';
    if (typeof placement !== 'string' || !PLACEMENTS.includes(placement))
      throw invalid();
    return {
      organization,
      placement,
      sources: Object.assign(Object.create(null), value.sources),
      copies: Object.assign(Object.create(null), value.copies),
      rootOverrides,
      customSources: (custom as CustomRecord[]).map((item) => ({
        id: item.id,
        label: item.label,
        path: item.path,
        ...(item.group ? { group: item.group } : {}),
      })),
      projects: nextProjects,
    };
  };
  const loadState = () =>
    readBounded(statePath, READ_LIMIT)
      .then(({ text, oversized }) => {
        if (oversized) throw new Error('Invalid skill state');
        state = parseState(JSON.parse(text));
        corrupt = false;
        return revalidateOverrides();
      })
      .catch((error: NodeJS.ErrnoException) => {
        corrupt = error.code !== 'ENOENT';
        // Degraded legacy root that is a file, not a directory: fail closed with a clear, content-free diagnostic.
        if (error.code === 'ENOTDIR')
          console.warn(
            `dsh-waycraft: skills state root ${basename(dirname(statePath))} is not a directory; skills state stays unavailable`,
          );
      });
  /** Override ids ignored on load (overlap or reserved folder): reported, never scanned. */
  let droppedOverrides: string[] = [];
  const revalidateOverrides = async () => {
    droppedOverrides = [];
    const entries = Object.entries(state.rootOverrides);
    if (!entries.length) return;
    const reserved = await Promise.all(
      [
        dirname(statePath),
        dshHome,
        ...['.ssh', '.gnupg', '.aws', '.kube'].map((x) => join(homedir(), x)),
      ].map((path) => comparisonPath(path)),
    );
    const home = await comparisonPath(homedir());
    const fixed = await Promise.all(
      [
        ...baseSources.filter((x) => !overridableIds.has(x.id)),
        ...baseSources.filter(
          (x) => overridableIds.has(x.id) && state.rootOverrides[x.id],
        ),
        ...state.customSources,
      ].map(async ({ id, path }) => ({ id, path: await comparisonPath(path) })),
    );
    const kept: Array<{ id: string; path: string }> = [];
    for (const [id, path] of entries) {
      const real = await comparisonPath(path);
      const bad =
        !overridableIds.has(id) ||
        isSameOrDescendant(real, home) ||
        reserved.some((x) => overlapsResolved(real, x)) ||
        fixed.some((x) => x.id !== id && overlapsResolved(real, x.path)) ||
        kept.some((x) => overlapsResolved(real, x.path));
      if (bad) {
        droppedOverrides.push(id);
        delete state.rootOverrides[id];
      } else kept.push({ id, path: real });
    }
  };
  let ready = loadState();
  const controls = new Set<Control>();
  let revision = 0;
  /**
   * Custom sources rank after every built-in (see CUSTOM_RANK_BASE), by registration order. They
   * therefore never share a rank, or an overlay rank, with a native root such as custom-300.
   */
  const customSource = (item: CustomRecord, index: number): Source => ({
    id: item.id,
    path: item.path,
    label: item.label,
    ...(item.group ? { group: item.group } : {}),
    custom: true,
    rank: CUSTOM_RANK_BASE + index * CUSTOM_RANK_STEP,
  });
  /** Built-in provider roots whose folder the user may redirect; DSH and shared Agents roots never are. */
  const overridableIds = new Set(
    builtins
      .map(([id]) => id)
      .filter((id) => baseSources.some((x) => x.id === id)),
  );
  const effectiveBase = (): Source[] =>
    baseSources.map((source) => {
      if (!overridableIds.has(source.id)) return source;
      const override = corrupt ? undefined : state.rootOverrides[source.id];
      return override
        ? {
            ...source,
            path: override,
            defaultPath: source.path,
            overridden: true,
            overridable: true,
          }
        : { ...source, overridable: true };
    });
  const globalSources = (): Source[] => [
    ...effectiveBase(),
    ...(corrupt ? [] : state.customSources).map(customSource),
  ];
  const reservedFolders = () => [dirname(statePath)];
  // ---- registered projects: always re-resolved from the host registry, never from the client ----
  /** Last workspace list the host reported successfully; reused when the registry later fails. */
  let knownWorkspaces: string[] = [];
  let registryUnavailable = false;
  const registeredProjects = async (): Promise<Project[]> => {
    let paths = knownWorkspaces;
    try {
      const registry = ctx.get?.('workspaceRegistry');
      if (typeof registry?.list !== 'function')
        throw new Error('Workspace registry unavailable');
      paths = registry
        .list()
        .map((item) => item.path ?? item.cwd)
        .filter((value): value is string => typeof value === 'string');
      knownWorkspaces = paths;
      registryUnavailable = false;
    } catch {
      // Fail closed: keep the last known-good project set so disabled project skills stay denied.
      registryUnavailable = true;
    }
    const resolved = await Promise.all(
      [...new Set(paths)].map((path) => resolveProject(path)),
    );
    const seen = new Set<string>();
    return resolved.filter((item) => !seen.has(item.id) && seen.add(item.id));
  };
  /** Persistent while the registry cannot be read and there is project state to protect. */
  const registryDiagnostics = (): Diagnostic[] =>
    registryUnavailable &&
    (knownWorkspaces.length || Object.keys(state.projects).length)
      ? [
          diag(
            'registry-unavailable',
            {},
            'Workspace registry unavailable; project policy may not apply',
          ),
        ]
      : [];
  /** Project skill roots: agent-specific hidden folders that stay inside the project root. */
  const globalResolved = () =>
    Promise.all(globalSources().map((item) => comparisonPath(item.path)));
  const projectSources = async (
    project: Project,
    protectedResolved?: string[],
  ): Promise<{ sources: Source[]; diagnostics: Diagnostic[] }> => {
    const found: Source[] = [];
    const diagnostics: Diagnostic[] = [];
    if (!project.available || !project.root)
      return { sources: found, diagnostics };
    const protectedPaths = protectedResolved ?? (await globalResolved());
    for (const entry of PROJECT_SOURCES) {
      const id = `project-${entry.kind}:${project.id}`;
      const path = join(project.root, entry.dir, 'skills');
      const info = await lstat(path).catch(() => undefined);
      if (!info) {
        const destination = await comparisonPath(path);
        if (
          entry.kind === 'dsh' &&
          isSameOrDescendant(project.root, destination) &&
          ![...protectedPaths, ...found.map((x) => x.path)].some((other) =>
            overlapsResolved(destination, other),
          )
        )
          found.push({
            id,
            path,
            label: entry.label,
            rank: entry.rank,
            kind: entry.kind,
            project: project.id,
            absent: true,
          });
        continue;
      }
      const real = await realpath(path).catch(() => undefined);
      if (!real || !(await lstat(real).catch(() => undefined))?.isDirectory())
        continue;
      if (!isSameOrDescendant(project.root, real)) {
        diagnostics.push(
          diag(
            'project-source-outside',
            { source: id, project: project.id },
            `${entry.label}: project skill folder resolves outside the project`,
          ),
        );
        continue;
      }
      // `real` is a realpath and every comparison path is already resolved.
      const clash = [...protectedPaths, ...found.map((x) => x.path)].some(
        (other) => overlapsResolved(real, other),
      );
      if (clash) {
        diagnostics.push(
          diag(
            'project-source-overlap',
            { source: id, project: project.id },
            `${entry.label}: project skill folder overlaps another source`,
          ),
        );
        continue;
      }
      found.push({
        id,
        path: real,
        label: entry.label,
        rank: entry.rank,
        kind: entry.kind,
        project: project.id,
      });
    }
    return { sources: found, diagnostics };
  };
  type Finalized = Candidate & { shadowedBy?: string };
  /** Scans the sources; state is applied synchronously afterwards so the result is never stale. */
  const scanSources = async (
    list: Source[],
    signal?: AbortSignal,
    extra: Diagnostic[] = [],
  ) => {
    const scanDiagnostics: Diagnostic[] = [...extra];
    const raw = (
      await Promise.all(
        list.map((source, i) =>
          (source.absent
            ? Promise.resolve([] as Candidate[])
            : scan(source, i, signal, scanDiagnostics)
          ).catch(() => {
            scanDiagnostics.push(
              diag(
                'source-unavailable',
                { source: source.id },
                `${source.id}: source unavailable`,
              ),
            );
            return [] as Candidate[];
          }),
        ),
      )
    ).flat();
    return { raw, scanDiagnostics };
  };
  const scanAll = async (signal?: AbortSignal) => {
    await ready;
    return scanSources(globalSources(), signal);
  };
  const scanProject = async (project: Project, signal?: AbortSignal) => {
    await ready;
    const { sources: list, diagnostics } = await projectSources(project);
    return { list, ...(await scanSources(list, signal, diagnostics)) };
  };
  /** Same-rank copies are ordered by source identity then path, never by registration order. */
  const precedence = (a: Candidate, b: Candidate) =>
    a.rank - b.rank ||
    (a.source < b.source ? -1 : a.source > b.source ? 1 : 0) ||
    (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const settle = (
    raw: Candidate[],
    sourceOn: (copy: Candidate) => boolean,
    copyOn: (copy: Candidate) => boolean,
  ) => {
    const copies: Finalized[] = raw.map((copy) => {
      const eligible =
        copy.eligible && !corrupt && sourceOn(copy) && copyOn(copy);
      return {
        ...copy,
        eligible,
        invocation:
          eligible && copy.policyValid && copy.author
            ? copy.author
            : { modelInvocable: false, userInvocable: false },
      };
    });
    const byName = new Map<string, Finalized[]>();
    for (const copy of copies)
      if (copy.metadataValid !== false)
        byName.set(copy.name, [...(byName.get(copy.name) ?? []), copy]);
    for (const group of byName.values()) {
      group.sort(precedence);
      const winner = group.find((copy) => copy.eligible);
      for (const copy of group)
        if (winner && copy !== winner && copy.eligible)
          copy.shadowedBy = winner.path;
    }
    return { copies, groups: byName };
  };
  const stateDiagnostics = (scanDiagnostics: Diagnostic[]) =>
    corrupt
      ? [
          diag(
            'state-invalid',
            {},
            'Invalid skill state; managed skills are disabled',
          ),
          ...scanDiagnostics,
        ]
      : scanDiagnostics;
  const finalize = (raw: Candidate[], scanDiagnostics: Diagnostic[]) => {
    const list = globalSources();
    const { copies, groups } = settle(
      raw,
      (copy) =>
        state.sources[copy.source] ??
        list.find((x) => x.id === copy.source)?.enabled ??
        true,
      (copy) => state.copies[copy.path] !== false,
    );
    return { copies, groups, diagnostics: stateDiagnostics(scanDiagnostics) };
  };
  const projectState = (id: string): ProjectState =>
    state.projects[id] ?? { sources: {}, copies: {} };
  const finalizeProject = (
    project: Project,
    list: Source[],
    raw: Candidate[],
    scanDiagnostics: Diagnostic[],
  ) => {
    const own = projectState(project.id);
    const kinds = new Map(list.map((item) => [item.id, item.kind ?? '']));
    const { copies, groups } = settle(
      raw,
      (copy) => own.sources[kinds.get(copy.source) ?? ''] ?? true,
      (copy) => own.copies[copy.path] !== false,
    );
    return { copies, groups, diagnostics: stateDiagnostics(scanDiagnostics) };
  };
  // Provider listings share one scan per revision; state is applied after it, so deny state is never stale.
  let scanCache:
    | { revision: number; scan: ReturnType<typeof scanAll> }
    | undefined;
  const sharedScan = () => {
    if (scanCache?.revision !== revision)
      scanCache = { revision, scan: scanAll() };
    return scanCache.scan;
  };
  let projectScans = {
    revision: -1,
    scans: new Map<string, ReturnType<typeof scanProject>>(),
  };
  const sharedProjectScan = (project: Project) => {
    if (projectScans.revision !== revision)
      projectScans = { revision, scans: new Map() };
    let scanned = projectScans.scans.get(project.id);
    if (!scanned) {
      scanned = scanProject(project);
      projectScans.scans.set(project.id, scanned);
    }
    return scanned;
  };
  const catalog = async () => {
    // The manager UI always rescans, which also refreshes the shared cache.
    const scan = scanAll();
    scanCache = { revision, scan };
    const { raw, scanDiagnostics } = await scan;
    return finalize(raw, scanDiagnostics);
  };
  const projectCatalog = async (project: Project) => {
    const { list, raw, scanDiagnostics } = await scanProject(project);
    return { list, ...finalizeProject(project, list, raw, scanDiagnostics) };
  };
  /** The registered, available project whose root contains `cwd`, if any. */
  const projectForCwd = async (cwd: string | undefined) => {
    if (typeof cwd !== 'string' || !isAbsolute(cwd)) return undefined;
    // A cwd that no longer exists still resolves through its nearest existing ancestor, so a
    // vanished subdirectory of a project keeps that project's deny policy.
    const real = await comparisonPath(cwd);
    let best: Project | undefined;
    for (const project of await registeredProjects())
      if (
        project.available &&
        project.root &&
        isSameOrDescendant(project.root, real) &&
        (!best?.root || project.root.length > best.root.length)
      )
        best = project;
    return best;
  };
  const native = ({
    author: _author,
    original: _original,
    diagnostics: _diagnostics,
    shadowedBy: _shadowedBy,
    ...candidate
  }: Finalized): Candidate => candidate;
  const registrations = new Map<string, () => void>();
  const install = (target: HostContext) =>
    (target.get?.('skills') ?? target.skills).registerProvider((control) => {
      controls.add(control);
      control.signal.addEventListener('abort', () => controls.delete(control), {
        once: true,
      });
      let snapshot = new Map<string, Candidate>();
      let snapshotRevision = -1;
      /** One overlay candidate per same-name group, ranked just ahead of the group's best copy. */
      const overlay = (group: Finalized[]) => {
        const winner = group.find((copy) => copy.eligible) ?? group[0];
        // Source-relative policy overlay preserves unrelated runtime/project precedence.
        return {
          ...native(winner),
          rank: Math.min(...group.map((copy) => copy.rank)) - 1,
        };
      };
      return {
        name: 'waycraft-skills',
        async list(options?: { cwd?: string; signal?: AbortSignal }) {
          if (control.signal.aborted) return [];
          const { raw, scanDiagnostics } = await sharedScan();
          if (control.signal.aborted) return [];
          // State is read after the scan completes, so a toggle that landed meanwhile is
          // already reflected and the deny overlay never disappears.
          const { copies, groups } = finalize(raw, scanDiagnostics);
          if (snapshotRevision !== revision) snapshot = new Map();
          snapshotRevision = revision;
          for (const copy of copies) snapshot.set(copy.path, native(copy));
          const result = [...groups.values()]
            .filter((group) => {
              const only = group[0];
              return (
                group.length > 1 ||
                !['user-dsh', 'user-agents'].includes(only.source) ||
                !only.eligible ||
                !only.policyValid ||
                state.copies[only.path] !== undefined
              );
            })
            .map(overlay);
          // Project overlays only for the registered project that contains the caller's cwd.
          const project = await projectForCwd(options?.cwd);
          if (project && !control.signal.aborted) {
            const scanned = await sharedProjectScan(project);
            if (control.signal.aborted) return [];
            const own = finalizeProject(
              project,
              scanned.list,
              scanned.raw,
              scanned.scanDiagnostics,
            );
            if (snapshotRevision !== revision) return result;
            for (const copy of own.copies)
              snapshot.set(copy.path, native(copy));
            // Only the .dsh and .agents project roots are discovered natively; the other project roots
            // exist only here, so they too surface only as overlays where policy deviates.
            for (const group of own.groups.values())
              if (group.some((copy) => !copy.eligible || !copy.policyValid))
                result.push(overlay(group));
          }
          return result;
        },
        async get(candidate) {
          if (control.signal.aborted || snapshotRevision !== revision)
            return undefined;
          return snapshot.get(candidate.path);
        },
      };
    });
  let operations: Promise<unknown> = Promise.resolve();
  let closing = false;
  ctx.effect(
    () => () => {
      closing = true;
      return operations;
    },
    'waycraft-skills pending state writes',
  );
  // Official CLI sessions hide the skills this manager keeps from DSH (ADR-0006). A name stays visible while any copy
  // of it is still provided, so switching off one source is not a ban on a name another source supplies. Read-only.
  ctx.effect(
    () =>
      registerSkillVisibility(async () => {
        const { raw, scanDiagnostics } = await sharedScan();
        const { groups } = finalize(raw, scanDiagnostics);
        const hidden = new Set<string>();
        for (const [skill, group] of groups)
          if (!group.some((copy) => copy.eligible && copy.policyValid))
            hidden.add(skill);
        return hidden;
      }),
    'waycraft-skills CLI visibility',
  );
  /** Atomic, owner-only state replacement; callers hold the serialized `operations` slot. */
  const writeState = async (next: State) => {
    await mkdir(dirname(statePath), { recursive: true });
    const temporary = `${statePath}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(next), { mode: 0o600 });
      await rename(temporary, statePath);
    } finally {
      await rm(temporary, { force: true });
    }
    state = next;
    revision++;
    for (const control of controls) control.invalidate();
  };
  const flags = (value: Record<string, boolean>): Record<string, boolean> =>
    Object.assign(Object.create(null), value);
  const cloneState = (): State => {
    const projects: Record<string, ProjectState> = Object.create(null);
    for (const [id, item] of Object.entries(state.projects))
      projects[id] = {
        sources: flags(item.sources),
        copies: flags(item.copies),
      };
    const organization: Record<
      string,
      Record<string, Organization>
    > = Object.create(null);
    for (const [scope, sources] of Object.entries(state.organization)) {
      organization[scope] = Object.create(null);
      for (const [sourceId, org] of Object.entries(sources))
        organization[scope][sourceId] = cloneOrg(org);
    }
    return {
      sources: flags(state.sources),
      copies: flags(state.copies),
      customSources: state.customSources.map((item) => ({ ...item })),
      rootOverrides: Object.assign(Object.create(null), state.rootOverrides),
      projects,
      organization,
      placement: state.placement,
    };
  };
  const fail = (
    status: number,
    code: string,
    params: Record<string, string> = {},
  ) => Response.json({ code, params }, { status });
  const strip = ({
    content: _content,
    original: _original,
    ...summary
  }: Finalized) => summary;
  const summarize = (project: Project) => ({
    id: project.id,
    name: project.name,
    path: project.path,
    ...(project.root ? { root: project.root } : {}),
    available: project.available,
    code: project.code,
  });
  /** Organization of one scope keyed by source id. */
  const orgView = (scope: string): Record<string, Organization> => {
    const view: Record<string, Organization> = {};
    for (const [sourceId, org] of Object.entries(
      state.organization[scope] ?? {},
    ))
      view[sourceId] = cloneOrg(org);
    return view;
  };
  const trashRoot = join(dirname(statePath), 'trash');
  const exclusive = <T>(fn: () => Promise<T>): Promise<T> => {
    const mutation = operations.then(fn);
    operations = mutation.catch(() => undefined);
    return mutation;
  };
  /**
   * Writable install destination: a user source, or one registered project's DSH skills folder.
   * The project id is only a selector; the registry, the project root and the skills folder are
   * re-resolved here on every call, so nothing a client or a stale record says is trusted.
   */
  const installDestination = async (
    id: unknown,
    project?: unknown,
  ): Promise<Destination | undefined> => {
    if (project === undefined) {
      const found = baseSources.find(
        (item) =>
          item.id === id && ['user-dsh', 'user-agents'].includes(item.id),
      );
      return found ? { id: found.id, root: found.path } : undefined;
    }
    if (
      typeof project !== 'string' ||
      !PROJECT_ID.test(project) ||
      id !== `project-dsh:${project}`
    )
      return undefined;
    const current = (await registeredProjects()).find(
      (item) => item.id === project,
    );
    if (registryUnavailable || !current?.available || !current.root)
      return undefined;
    // The same containment/overlap rules as the project source scan: a folder that escapes is not offered.
    const found = (await projectSources(current)).sources.find(
      (item) => item.id === id,
    );
    return found ? { id: found.id, root: found.path, project } : undefined;
  };
  /**
   * A freshly installed or created skill starts enabled. Policy is keyed by document path, so a
   * leftover `false` flag from an earlier copy at the same path (disabled, then trashed) must not
   * silently disable the new one. Only that stale per-copy flag is cleared; source policy is unchanged.
   */
  const clearStaleDisabled = async (
    root: string,
    names: string[],
    project?: string,
  ) => {
    const flags = project ? state.projects[project]?.copies : state.copies;
    const stale = names.flatMap((name) =>
      [join(root, name, 'SKILL.md'), join(root, name)].filter(
        (path) => flags?.[path] === false,
      ),
    );
    if (!stale.length) return;
    const next = cloneState();
    const target = project ? next.projects[project]?.copies : next.copies;
    for (const path of stale) if (target) delete target[path];
    await writeState(next);
  };
  /** Same, for installs that finished outside the serialized mutation chain (repository and catalog installs). */
  const enableInstalled = (result: unknown) => {
    const done = (
      result as { installed?: { name: string; root: string; project?: string } }
    )?.installed;
    return done
      ? exclusive(() =>
          clearStaleDisabled(done.root, [done.name], done.project),
        )
      : undefined;
  };
  const repos = createRepositories({
    config: config.repositories,
    stateDir: dirname(statePath),
    trashRoot,
    destination: installDestination,
    exclusive,
    changed: () => {
      revision++;
      for (const control of controls) control.invalidate();
    },
  });
  ctx.effect(
    () => () => repos.close(),
    'waycraft-skills repository operations',
  );
  const catalogs = createCatalogs({
    config: config.catalogs,
    stateDir: dirname(statePath),
    trashRoot,
    destination: installDestination,
    exclusive,
    changed: () => {
      revision++;
      for (const control of controls) control.invalidate();
    },
  });
  ctx.effect(
    () => () => catalogs.close(),
    'waycraft-skills catalog operations',
  );
  const projectView = async (project: Project) => {
    if (!project.available)
      return {
        ...summarize(project),
        sources: [],
        copies: [],
        diagnostics: [
          diag(
            project.code ?? 'project-unavailable',
            { project: project.id },
            `${project.name}: project unavailable`,
          ),
        ],
      };
    const { list, copies, diagnostics } = await projectCatalog(project);
    const own = projectState(project.id);
    return {
      ...summarize(project),
      sources: list.map((item) => ({
        ...item,
        // Project DSH keeps the reference restriction: no source-level switch.
        readonly: item.kind === 'dsh',
        enabled: !corrupt && (own.sources[item.kind ?? ''] ?? true),
      })),
      copies: copies.map(strip),
      diagnostics,
      organization: orgView(project.id),
    };
  };
  const payload = async (
    project: Project | undefined,
    projects: Project[],
    expose = true,
  ) => {
    const { copies, diagnostics } = await catalog();
    // Trash safety/read failures must not take the ordinary catalog offline.
    // Mutations still use strict listTrash/preflight and never trust this fallback.
    let trash: Awaited<ReturnType<typeof listTrash>> = [];
    let trashError: string | undefined;
    if (expose) {
      try {
        const scan = await scanTrash(trashRoot);
        trash = scan.items;
        if (scan.overLimit) trashError = 'trash-overflow';
        else if (scan.skipped) trashError = 'trash-skipped';
      } catch (error) {
        trashError =
          error instanceof Error && error.message === 'trash-linked'
            ? 'trash-linked'
            : 'trash-unavailable';
      }
    }
    const repoView = await repos.view(
      expose,
      trashError ? undefined : new Set(trash.map((item) => item.id)),
    );
    const catalogView = await catalogs.view(
      expose,
      trashError ? undefined : new Set(trash.map((item) => item.id)),
    );
    return {
      ...repoView,
      ...catalogView,
      sources: globalSources().map((source) => ({
        ...source,
        enabled:
          !corrupt && (state.sources[source.id] ?? source.enabled ?? true),
      })),
      copies: copies.map(strip),
      trash,
      ...(trashError ? { trashError } : {}),
      corrupt,
      placement: state.placement,
      organization: orgView('global'),
      diagnostics: [
        ...diagnostics,
        ...registryDiagnostics(),
        ...droppedOverrides.map((source) =>
          diag('root-override-ignored', { source }, 'Folder override ignored'),
        ),
      ],
      projects: expose ? projects.map(summarize) : [],
      ...(project ? { project: await projectView(project) } : {}),
    };
  };
  /** Every folder a new custom source must not overlap: global roots and available project roots. */
  const protectedRoots = async (projects: Project[]) => {
    const others = globalSources().map(({ id, path }) => ({ id, path }));
    // An overridden provider keeps its default folder protected, so no other source can claim it.
    for (const source of globalSources())
      if (source.defaultPath)
        others.push({
          id: `${source.id}${DEFAULT_SUFFIX}`,
          path: source.defaultPath,
        });
    const resolved = await globalResolved();
    for (const project of projects)
      for (const item of (await projectSources(project, resolved)).sources)
        others.push({ id: item.id, path: item.path });
    return others;
  };
  const text = (value: unknown, limit = MAX_LABEL) =>
    typeof value === 'string' && value.trim().length <= limit
      ? value.trim()
      : undefined;
  const customAdd = async (
    items: Array<Record<string, unknown>>,
    projects: Project[],
  ) => {
    const next = cloneState();
    const results: Array<Record<string, unknown>> = [];
    // Protected roots are resolved once; each added source joins the prepared set.
    const prepared = await prepareRoots(
      [
        ...(await protectedRoots(projects)),
        ...next.customSources.map(({ id, path }) => ({ id, path })),
      ].filter(
        (value, index, all) =>
          all.findIndex((other) => other.id === value.id) === index,
      ),
      reservedFolders(),
    );
    for (const item of items) {
      const requested = typeof item.path === 'string' ? item.path : '';
      const label =
        item.label === undefined
          ? undefined
          : text(item.label) || (item.label === '' ? undefined : null);
      const group = item.group === undefined ? undefined : text(item.group);
      if (label === null || (item.group !== undefined && group === undefined)) {
        results.push({ status: 'rejected', code: 'custom-label' });
        continue;
      }
      const checked = await validateRootPath(requested, prepared);
      if (!checked.ok) {
        // The same folder (even through a link) is already registered: idempotent success.
        const other = checked.params.other
          ? next.customSources.find((x) => x.id === checked.params.other)
          : undefined;
        if (
          checked.code === 'root-overlap' &&
          other &&
          (await comparisonPath(other.path)) ===
            (await comparisonPath(requested))
        )
          results.push({ status: 'registered', id: other.id });
        else
          results.push({
            status: 'rejected',
            code: checked.code,
            params: { path: requested },
          });
        continue;
      }
      if (next.customSources.length >= MAX_CUSTOM_SOURCES) {
        results.push({
          status: 'rejected',
          code: 'custom-limit',
          params: { limit: String(MAX_CUSTOM_SOURCES) },
        });
        continue;
      }
      const name = label || basename(checked.path) || 'source';
      const id = customSlug(name, new Set(next.customSources.map((x) => x.id)));
      if (!id) {
        results.push({
          status: 'rejected',
          code: 'custom-limit',
          params: { limit: String(MAX_CUSTOM_SOURCES) },
        });
        continue;
      }
      next.customSources.push({
        id,
        label: name.slice(0, MAX_LABEL),
        path: checked.path,
        ...(group ? { group } : {}),
      });
      prepared.others.push({ id, path: checked.path });
      results.push({ status: 'added', id });
    }
    if (results.some((x) => x.status === 'added')) await writeState(next);
    return results;
  };
  const customUpdate = async (
    body: Record<string, unknown>,
    projects: Project[],
  ) => {
    const next = cloneState();
    const record = next.customSources.find((x) => x.id === body.id);
    if (!record) return fail(404, 'custom-unknown');
    if (typeof body.label !== 'string' || !body.label.trim())
      return fail(400, 'custom-label');
    if (body.label.trim().length > MAX_LABEL) return fail(409, 'custom-label');
    if (body.group !== undefined && typeof body.group !== 'string')
      return fail(400, 'custom-label');
    if (typeof body.group === 'string' && body.group.trim().length > MAX_LABEL)
      return fail(409, 'custom-label');
    if (body.path !== undefined) {
      const checked = await validateRootPath(
        body.path,
        await prepareRoots(
          [
            ...(await protectedRoots(projects)),
            ...next.customSources.map(({ id, path }) => ({ id, path })),
          ],
          reservedFolders(),
        ),
        record.id,
      );
      if (!checked.ok) return fail(409, checked.code, checked.params);
      if (checked.path !== record.path) {
        // Policy keyed by the old location must not silently apply to the new folder.
        delete next.sources[record.id];
        delete next.organization.global?.[record.id];
        for (const path of Object.keys(next.copies))
          if (isSameOrDescendant(record.path, path)) delete next.copies[path];
      }
      record.path = checked.path;
    }
    record.label = body.label.trim();
    if (typeof body.group === 'string') {
      if (body.group.trim()) record.group = body.group.trim();
      else delete record.group;
    }
    await writeState(next);
    return undefined;
  };
  /** Sensitive folders a provider root may not be, contain or lie inside. */
  const sensitiveFolders = () => [
    dshHome,
    ...['.ssh', '.gnupg', '.aws', '.kube'].map((x) => join(homedir(), x)),
  ];
  /**
   * Redirects (or resets, with an empty path) a built-in provider root. Only the read location
   * changes: no folder is created, moved or deleted. Policy keyed by the old location is purged.
   */
  const rootSet = async (
    body: Record<string, unknown>,
    projects: Project[],
  ) => {
    const id = typeof body.id === 'string' ? body.id : '';
    const base = baseSources.find((x) => x.id === id);
    if (!base || !overridableIds.has(id)) return fail(404, 'root-unsupported');
    const next = cloneState();
    const previous = next.rootOverrides[id] ?? base.path;
    const reset =
      body.path === null ||
      body.path === undefined ||
      (typeof body.path === 'string' && !body.path.trim());
    if (!reset && typeof body.path !== 'string')
      return fail(409, 'root-not-absolute');
    const requested = reset ? '' : (body.path as string).trim();
    const toDefault =
      reset || pathIdentity(requested) === pathIdentity(base.path);
    // Every other source, the other overridden providers' defaults, custom sources and projects.
    const prepared = await prepareRoots(
      [
        ...(await protectedRoots(projects)).filter(
          (x) => x.id !== id && x.id !== `${id}${DEFAULT_SUFFIX}`,
        ),
        ...next.customSources.map(({ id: other, path }) => ({
          id: other,
          path,
        })),
      ],
      [...reservedFolders(), ...sensitiveFolders()],
    );
    let target = base.path;
    if (toDefault) {
      // Reset is validated too: another source may have claimed the default folder meanwhile.
      const canonical = await comparisonPath(base.path);
      const clash = prepared.others.find((x) =>
        overlapsResolved(canonical, x.path),
      );
      if (clash)
        return fail(409, 'root-overlap', {
          path: base.path,
          other: clash.id.replace(DEFAULT_SUFFIX, ''),
        });
    } else {
      const checked = await validateRootPath(requested, prepared, id);
      if (!checked.ok) return fail(409, checked.code, checked.params);
      // Home itself and its ancestors (including `/`) can never be a skills root.
      if (isSameOrDescendant(checked.path, await comparisonPath(homedir())))
        return fail(409, 'root-reserved', { path: requested });
      target = checked.path;
    }
    if (pathIdentity(target) === pathIdentity(base.path))
      delete next.rootOverrides[id];
    else next.rootOverrides[id] = target;
    if (pathIdentity(previous) !== pathIdentity(target)) {
      delete next.sources[id];
      delete next.organization.global?.[id];
      for (const path of Object.keys(next.copies))
        if (isSameOrDescendant(previous, path)) delete next.copies[path];
    }
    await writeState(next);
    return undefined;
  };
  const customRemove = async (id: string) => {
    const next = cloneState();
    const index = next.customSources.findIndex((x) => x.id === id);
    if (index < 0) return fail(404, 'custom-unknown');
    const [removed] = next.customSources.splice(index, 1);
    // Only Waycraft state is edited: the folder and its skills are never touched.
    delete next.sources[id];
    delete next.organization.global?.[id];
    if (!Object.keys(next.organization.global ?? {}).length)
      delete next.organization.global;
    for (const path of Object.keys(next.copies))
      if (isSameOrDescendant(removed.path, path)) delete next.copies[path];
    await writeState(next);
    return undefined;
  };
  /** One serialized write path shared by the browser and the optional creation tool. */
  const createSkill = async (
    body: Record<string, unknown>,
    project?: Project,
  ) => {
    await ready;
    if (closing) return fail(503, 'stopping');
    if (corrupt) return fail(409, 'state-invalid');
    const source = project
      ? project.available &&
        project.root &&
        body.source === `project-dsh:${project.id}`
        ? { path: join(project.root, '.dsh', 'skills') }
        : undefined
      : baseSources.find(
          (item) =>
            item.id === body.source &&
            ['user-dsh', 'user-agents'].includes(item.id),
        );
    if (!source) return fail(403, 'create-readonly');
    if (
      typeof body.name !== 'string' ||
      typeof body.description !== 'string' ||
      typeof body.body !== 'string'
    )
      return fail(400, 'create-invalid');
    const requested = body.name.trim();
    // Never turn path syntax into a different, apparently safe skill name.
    const name = requested
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const description = body.description.trim();
    const content = body.body.trim();
    if (
      !name ||
      name.length > 128 ||
      /[\\/\\\\.\u0000]/.test(requested) ||
      !description ||
      !content
    )
      return fail(400, 'create-invalid');
    if (description.length > 500 || content.length > 262144)
      return fail(413, 'create-too-large');
    const root = resolve(source.path);
    // Inspect every component, including existing ancestors of an absent writable root.
    const checkedRoot = async () => {
      for (let current = root; ; current = dirname(current)) {
        const info = await lstat(current).catch(
          (error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return undefined;
            throw error;
          },
        );
        if (info && (!info.isDirectory() || info.isSymbolicLink()))
          return false;
        if (dirname(current) === current) return true;
      }
    };
    if (!(await checkedRoot())) return fail(409, 'create-linked-root');
    await mkdir(root, { recursive: true });
    if (!(await checkedRoot())) return fail(409, 'create-linked-root');
    const target = join(root, name);
    const stage = join(root, `.create-${randomUUID()}`);
    let stageCreated = false;
    try {
      if (
        (await lstat(target).catch(() => undefined)) ||
        (await lstat(join(root, `${name}.md`)).catch(() => undefined))
      )
        return fail(409, 'create-conflict');
      await mkdir(stage);
      stageCreated = true;
      const document = join(stage, 'SKILL.md');
      await writeFile(
        document,
        `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n\n${content}\n`,
        { flag: 'wx' },
      );
      if (!(await checkedRoot())) return fail(409, 'create-linked-root');
      // Publish the complete folder. Manager writes are serialized; this is not
      // an atomic no-replace guarantee against external filesystem writers.
      if (await lstat(target).catch(() => undefined))
        return fail(409, 'create-conflict');
      await rename(stage, target);
      stageCreated = false;
      await clearStaleDisabled(root, [name], project?.id);
      revision++;
      for (const control of controls) control.invalidate();
      return { name, path: join(target, 'SKILL.md'), source: body.source };
    } catch (error) {
      return fail(
        (error as NodeJS.ErrnoException).code === 'EEXIST' ? 409 : 400,
        (error as NodeJS.ErrnoException).code === 'EEXIST'
          ? 'create-conflict'
          : 'create-failed',
      );
    } finally {
      if (stageCreated) await rm(stage, { recursive: true, force: true });
    }
  };
  /** Model-facing create tool name (plugin-scoped; `create_skill` was never released under a retired namespace). */
  const CREATE_TOOL = 'dsh_waycraft_create_skill';
  ctx.effect(() => {
    const tools = ctx.get?.('tools');
    if (!tools || tools.get(CREATE_TOOL)) return () => {};
    const stopGate = ctx.on?.('tools/pre-execute', async (exec, next) =>
      exec.name === CREATE_TOOL
        ? {
            kind: 'ask',
            reason: 'Create a reusable skill only with explicit user approval.',
            displayReason: {
              en: 'Create this reusable DSH skill?',
              ar: 'هل تريد إنشاء مهارة DSH القابلة لإعادة الاستخدام؟',
            },
          }
        : next(),
    );
    // Without the approval hook the model-facing mutation is not exposed.
    if (!stopGate) return () => {};
    const stopTool = tools.register(
      defineTool({
        name: CREATE_TOOL,
        description:
          'Create one reusable DSH skill (a SKILL.md folder) in the user DSH skills directory. Use only when the user explicitly asks to create or save a skill; the user is asked to approve every call. Do not use it to edit, rename or delete an existing skill, to install from a repository, or to write project skills. Returns {name, path, source} with the normalized kebab-case name and the SKILL.md path. Fails with an error naming a code: create-invalid (empty or unsafe name, empty description or body), create-too-large (description over 500 characters or body over 262144), create-conflict (a skill with that name already exists), create-failed (the folder could not be written).',
        parameters: {
          name: {
            type: 'string',
            required: true,
            description: 'Skill name, normalized to kebab-case.',
          },
          description: {
            type: 'string',
            required: true,
            description: 'Routing description (up to 500 characters).',
          },
          body: {
            type: 'string',
            required: true,
            description: 'Markdown instructions (up to 262144 characters).',
          },
        },
        output: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', required: true },
              path: { type: 'string', required: true },
              source: { type: 'string', required: true },
            },
            additionalProperties: false,
          },
          render: (_args, value) => [
            { type: 'text', text: JSON.stringify(value) },
          ],
        },
        async execute(args, exec) {
          const operation = operations.then(async () => {
            exec?.signal?.throwIfAborted();
            const result = await createSkill({
              ...(args as Record<string, unknown>),
              source: 'user-dsh',
            });
            if (!(result instanceof Response))
              return result as { name: string; path: string; source: string };
            const payload = (await result.json()) as { code?: string };
            // A failed creation must reach the model as a tool error, not as a successful result.
            throw new Error(
              `${CREATE_TOOL}: ${payload.code ?? 'create-failed'}`,
            );
          });
          operations = operation.catch(() => undefined);
          return operation;
        },
        presentCall: () => ({
          card: 'generic',
          title: 'Create DSH skill',
          kind: 'edit',
        }),
      }),
    );
    return () => {
      stopTool();
      stopGate();
    };
  }, 'waycraft-skills create tool');
  const ORG_ACTIONS = [
    'category-create',
    'category-rename',
    'category-delete',
    'category-assign',
    'category-toggle',
    'note',
    'placement',
  ];
  /** Category, note and placement mutations. Metadata only: skill files are never touched. */
  const organize = async (
    body: Record<string, unknown>,
    project: Project | undefined,
    projects: Project[],
  ): Promise<Response | undefined> => {
    if (closing)
      return new Response('Skill manager is stopping', { status: 503 });
    if (corrupt) return new Response('Skill state is invalid', { status: 409 });
    const next = cloneState();
    if (body.action === 'placement') {
      if (
        typeof body.location !== 'string' ||
        !PLACEMENTS.includes(body.location)
      )
        return fail(400, 'placement-invalid');
      next.placement = body.location;
      await writeState(next);
      return undefined;
    }
    if (project && !project.available)
      return fail(409, project.code ?? 'project-unavailable');
    const scope = project ? project.id : 'global';
    const projectView2 = project ? await projectCatalog(project) : undefined;
    const view = projectView2 ?? (await catalog());
    // Every organization action targets one validated source: same-named skills elsewhere are separate.
    const sourceId = body.source;
    const sourceIds = projectView2
      ? projectView2.list.map((item) => item.id)
      : globalSources().map((item) => item.id);
    if (typeof sourceId !== 'string' || !sourceId)
      return fail(400, 'invalid-request');
    if (!sourceIds.includes(sourceId)) return fail(404, 'source-unknown');
    // Only a successful, authoritative registry read may drop organization of unregistered projects.
    if (!registryUnavailable) {
      const registered = new Set(projects.map((item) => item.id));
      for (const key of Object.keys(next.organization))
        if (key !== 'global' && !registered.has(key))
          delete next.organization[key];
    }
    next.organization[scope] ??= Object.create(null);
    const org = (next.organization[scope][sourceId] ??= emptyOrg());
    const copies = view.copies.filter(
      (x) =>
        x.source === sourceId &&
        x.metadataValid !== false &&
        x.name !== '__proto__',
    );
    const known = new Set(copies.map((x) => x.name));
    // Trash retains annotations until restore or confirmed permanent deletion.
    // An unavailable, over-limit or partly unreadable Trash may hide recoverable skills: never prune then.
    let trashUnreliable = false;
    try {
      const scan = await scanTrash(trashRoot);
      trashUnreliable = scan.overLimit || scan.skipped > 0;
      for (const item of scan.items)
        if (item.scope === scope && item.source === sourceId)
          known.add(item.name);
    } catch {
      trashUnreliable = true;
    }
    // A source that could not be read cleanly may only look empty: never prune its metadata then.
    const unreliable =
      trashUnreliable ||
      view.diagnostics.some((item) => item.params.source === sourceId);
    // Reconcile: forget members, notes and order entries of skills that vanished from this source.
    if (!unreliable) {
      for (const skill of Object.keys(org.members))
        if (!known.has(skill)) delete org.members[skill];
      for (const skill of Object.keys(org.notes))
        if (!known.has(skill)) delete org.notes[skill];
    }
    const label = (value: unknown) => {
      const label = typeof value === 'string' ? value.trim() : '';
      return label && label.length <= CATEGORY_NAME_MAX ? label : undefined;
    };
    const categoryId = (value: unknown) =>
      typeof value === 'string' && org.categories.some((x) => x.id === value)
        ? value
        : undefined;
    const place = (skill: string, id: string) => {
      if (id) org.members[skill] = id;
      else delete org.members[skill];
    };
    const action = body.action;
    if (action === 'category-create' || action === 'category-rename') {
      if (typeof body.name !== 'string') return fail(400, 'invalid-request');
      const name = label(body.name);
      if (!name) return fail(400, 'category-name');
      const target =
        action === 'category-rename' ? categoryId(body.category) : undefined;
      if (action === 'category-rename' && !target)
        return fail(404, 'category-unknown');
      if (org.categories.some((x) => x.name === name && x.id !== target))
        return fail(409, 'category-duplicate');
      if (action === 'category-create') {
        if (org.categories.length >= CATEGORY_LIMIT)
          return fail(409, 'category-limit', { limit: String(CATEGORY_LIMIT) });
        const id = randomBytes(8).toString('hex');
        org.categories.push({ id, name });
      } else
        (org.categories.find((x) => x.id === target) as { name: string }).name =
          name;
    } else if (action === 'category-delete') {
      if (typeof body.category !== 'string')
        return fail(400, 'invalid-request');
      const id = categoryId(body.category);
      if (!id) return fail(404, 'category-unknown');
      // Members fall back to uncategorized; no skill file is involved.
      org.categories = org.categories.filter((x) => x.id !== id);
      for (const [skill, member] of Object.entries(org.members))
        if (member === id) delete org.members[skill];
    } else if (action === 'category-assign') {
      const names = body.names;
      if (
        !Array.isArray(names) ||
        !names.length ||
        names.length > BULK_MAX ||
        names.some((x) => typeof x !== 'string' || x.length > NAME_MAX) ||
        (body.category !== '' && typeof body.category !== 'string')
      )
        return fail(400, 'invalid-request');
      const id = body.category === '' ? '' : categoryId(body.category);
      if (id === undefined) return fail(404, 'category-unknown');
      if (names.some((x) => !known.has(x))) return fail(404, 'skill-unknown');
      for (const skill of new Set(names as string[])) place(skill, id);
    } else if (action === 'category-toggle') {
      const group = body.category;
      if (typeof body.enabled !== 'boolean' || typeof group !== 'string')
        return fail(400, 'invalid-request');
      if (group !== '*' && group !== '' && !categoryId(group))
        return fail(404, 'category-unknown');
      // Same persisted per-copy policy as a single toggle; it overrides earlier per-copy choices.
      const flagsFor = project
        ? (next.projects[project.id] ??= {
            sources: Object.create(null),
            copies: Object.create(null),
          }).copies
        : next.copies;
      for (const copy of copies)
        if (group === '*' || (org.members[copy.name] ?? '') === group)
          flagsFor[copy.path] = body.enabled;
    } else if (action === 'note') {
      const skill = body.name;
      if (typeof skill !== 'string' || typeof body.note !== 'string')
        return fail(400, 'invalid-request');
      if (!known.has(skill)) return fail(404, 'skill-unknown');
      const note = body.note.trim();
      if (note.length > NOTE_MAX)
        return fail(409, 'note-too-long', { limit: String(NOTE_MAX) });
      if (note) org.notes[skill] = note;
      else delete org.notes[skill];
    }
    if (
      Object.keys(org.members).length > MEMBER_MAX ||
      Object.keys(org.notes).length > NOTE_COUNT_MAX
    )
      return fail(409, 'organization-limit');
    // Drop empty entries so untouched sources never accumulate state.
    for (const [scopeKey, sources] of Object.entries(next.organization)) {
      for (const [key, value] of Object.entries(sources))
        if (
          !value.categories.length &&
          !Object.keys(value.members).length &&
          !Object.keys(value.notes).length
        )
          delete sources[key];
      if (!Object.keys(sources).length) delete next.organization[scopeKey];
    }
    // The loader refuses oversized files: never write something that could not be read back.
    if (Buffer.byteLength(JSON.stringify(next)) > STATE_WRITE_MAX)
      return fail(413, 'state-too-large');
    await writeState(next);
    return undefined;
  };
  ctx.inject?.(['connection'], (target) => {
    const connection = target.get?.('connection');
    if (!connection) return;
    const registerRoute = (path: string) =>
      connection.fetch.register({
        path,
        methods: ['POST'],
        requestBody: 'buffered',
        async fetch(request: Request) {
          if (closing)
            return new Response('Skill manager is stopping', { status: 503 });
          if (
            request.headers.get('content-type')?.split(';')[0] !==
            'application/json'
          )
            return new Response('JSON required', { status: 415 });
          const origin = request.headers.get('origin');
          if (origin && origin !== new URL(request.url).origin)
            return new Response('Origin rejected', { status: 403 });
          if (request.headers.get('sec-fetch-site') === 'cross-site')
            return new Response('Origin rejected', { status: 403 });
          const declared = Number(request.headers.get('content-length'));
          if (Number.isFinite(declared) && declared > CREATE_REQUEST)
            return new Response('Request too large', { status: 413 });
          try {
            const reader = request.body?.getReader();
            let requestText = '';
            let length = 0;
            if (reader) {
              try {
                const decoder = new TextDecoder();
                while (true) {
                  const part = await reader.read();
                  if (part.done) break;
                  length += part.value.byteLength;
                  if (length > CREATE_REQUEST) {
                    await reader.cancel();
                    return new Response('Request too large', { status: 413 });
                  }
                  requestText += decoder.decode(part.value, { stream: true });
                }
                requestText += decoder.decode();
              } finally {
                reader.releaseLock();
              }
            }
            const body = JSON.parse(requestText) as {
              action?: string;
              kind?: string;
              id?: string;
              enabled?: boolean;
              project?: string;
              path?: unknown;
              label?: unknown;
              group?: unknown;
              items?: unknown;
              include?: unknown;
            } & Record<string, unknown>;
            if (
              body.action !== 'create' &&
              body.action !== 'upload' &&
              (length > MAX_REQUEST || declared > MAX_REQUEST)
            )
              return new Response('Request too large', { status: 413 });
            const marked =
              request.headers.get('x-waycraft-skills') === '1' ||
              request.headers.get(LEGACY_SKILLS_HEADER) === '1';
            const actions = [
              'list',
              'detail',
              'toggle',
              'ping',
              'reload',
              'create',
              'import',
              'upload',
              'trash',
              'trash-restore',
              'trash-delete',
              'repo-add',
              'repo-refresh',
              'repo-refresh-all',
              'repo-remove',
              'repo-install',
              'repo-uninstall',
              'repo-forget',
              'repo-update-preview',
              'repo-update',
              'repo-rollback-preview',
              'repo-rollback',
              'catalog-clawhub-list',
              'catalog-clawhub-search',
              'catalog-skillsh-search',
              'catalog-detail',
              'catalog-install',
              'catalog-uninstall',
              'catalog-forget',
              'custom-scan',
              'custom-add',
              'custom-update',
              'custom-remove',
              'root-set',
              ...ORG_ACTIONS,
            ];
            if (
              !body ||
              typeof body !== 'object' ||
              Array.isArray(body) ||
              !actions.includes(body.action ?? 'list') ||
              (body.project !== undefined && typeof body.project !== 'string')
            )
              return new Response('Invalid skill action', { status: 400 });
            // Presence probe: proves the route exists without scanning any source.
            if (body.action === 'ping') {
              if (body.include !== 'placement')
                return Response.json({ ok: true });
              await ready;
              return Response.json({ ok: true, placement: state.placement });
            }
            // A project selector (and the project list itself) exposes workspace paths: marker only.
            if (body.action === 'list' && body.project !== undefined && !marked)
              return new Response('Mutation marker required', {
                status: 403,
              });
            if (body.action === 'reload') {
              // Retry path for a corrupt state file: re-read it once the user fixed it.
              if (!marked)
                return new Response('Mutation marker required', {
                  status: 403,
                });
              // Chained on the serialized operations so a toggle can never interleave with it.
              const reloaded = operations.then(loadState);
              operations = reloaded.catch(() => undefined);
              ready = reloaded;
              await reloaded;
              // Native consumers must see the re-read state, not the old deny snapshot.
              revision++;
              for (const control of controls) control.invalidate();
            }
            await ready;
            // The project is always re-resolved from the host registry; the id is only a selector.
            let projectsOnce: Promise<Project[]> | undefined;
            // Resolved at most once per request and shared by every step below.
            const projects = () => (projectsOnce ??= registeredProjects());
            let project: Project | undefined;
            if (body.project !== undefined) {
              project = (await projects()).find(
                (item) => item.id === body.project,
              );
              // Record-only forget must work after the project left the registry; it re-validates the scope itself.
              if (
                !project &&
                !['repo-forget', 'catalog-forget'].includes(body.action ?? '')
              )
                return fail(404, 'project-unregistered');
            }
            if (
              ['trash', 'trash-restore', 'trash-delete'].includes(
                body.action ?? '',
              )
            ) {
              if (!marked) return fail(403, 'forbidden');
              const mutation = operations.then(async () => {
                if (closing || request.signal.aborted)
                  return fail(409, 'trash-cancelled');
                if (corrupt) return fail(409, 'state-invalid');
                try {
                  const items = await listTrash(trashRoot);
                  const item = items.find((entry) => entry.id === body.id);
                  const scope =
                    body.action === 'trash'
                      ? (body.project ?? 'global')
                      : item?.scope;
                  // An explicit project must be the Trash item's own scope: never act on another scope.
                  if (
                    body.action !== 'trash' &&
                    body.project !== undefined &&
                    item &&
                    body.project !== item.scope
                  )
                    return fail(409, 'project-mismatch');
                  const current =
                    scope === 'global'
                      ? undefined
                      : (await registeredProjects()).find(
                          (entry) => entry.id === scope,
                        );
                  if (
                    scope !== 'global' &&
                    (!current?.available || registryUnavailable)
                  )
                    return fail(404, 'project-unregistered');
                  const sourceId =
                    body.action === 'trash' ? body.source : item?.source;
                  const sourceRoot =
                    current?.root && sourceId === `project-dsh:${current.id}`
                      ? join(current.root, '.dsh', 'skills')
                      : scope === 'global'
                        ? baseSources.find(
                            (entry) =>
                              entry.id === sourceId &&
                              ['user-dsh', 'user-agents'].includes(entry.id),
                          )?.path
                        : undefined;
                  if (!sourceRoot) return fail(403, 'trash-readonly');
                  await checkedTrashPath(sourceRoot, true);
                  const cancelled = () => closing || request.signal.aborted;
                  let result;
                  if (body.action === 'trash') {
                    const view = current
                      ? await projectCatalog(current)
                      : await catalog();
                    const copy = view.copies.find(
                      (entry) =>
                        entry.path === body.id && entry.source === sourceId,
                    );
                    if (!copy) return fail(404, 'trash-missing');
                    // Resolve the discovered document, never a caller-supplied write path.
                    const origin =
                      basename(copy.path).toLowerCase() === 'skill.md'
                        ? dirname(copy.path)
                        : copy.path;
                    if (
                      (await comparisonPath(origin)) ===
                        (await comparisonPath(sourceRoot)) ||
                      !isSameOrDescendant(resolve(sourceRoot), origin)
                    )
                      return fail(403, 'trash-readonly');
                    result = await trashEntry(
                      trashRoot,
                      {
                        name: copy.name,
                        source: String(sourceId),
                        scope: String(scope),
                        root: resolve(sourceRoot),
                        origin,
                      },
                      cancelled,
                    );
                    await repos.noteTrashed(
                      resolve(sourceRoot),
                      origin,
                      result.id,
                    );
                    await catalogs.noteTrashed(
                      resolve(sourceRoot),
                      origin,
                      result.id,
                    );
                  } else {
                    if (!item) return fail(404, 'trash-missing');
                    if (
                      (await comparisonPath(item.root)) !==
                        (await comparisonPath(resolve(sourceRoot))) ||
                      !isSameOrDescendant(item.root, item.origin) ||
                      (await comparisonPath(item.root)) ===
                        (await comparisonPath(item.origin))
                    )
                      return fail(409, 'trash-invalid');
                    if (body.action === 'trash-restore') {
                      result = await restoreEntry(trashRoot, item, cancelled);
                      await repos.noteRestored(item.id);
                      await catalogs.noteRestored(item.id);
                    } else {
                      if (body.confirm !== true)
                        return fail(400, 'trash-confirm');
                      await deleteEntry(trashRoot, item);
                      await repos.noteDeleted(item.id);
                      await catalogs.noteDeleted(item.id);
                      // Do not erase a newer active copy's annotations or policy.
                      const view = current
                        ? await projectCatalog(current)
                        : await catalog();
                      if (
                        !view.copies.some(
                          (entry) =>
                            entry.source === item.source &&
                            entry.name === item.name,
                        ) &&
                        !items.some(
                          (entry) =>
                            entry.id !== item.id &&
                            entry.scope === item.scope &&
                            entry.source === item.source &&
                            entry.name === item.name,
                        )
                      ) {
                        const next = cloneState();
                        const org =
                          next.organization[item.scope]?.[item.source];
                        if (org) {
                          delete org.members[item.name];
                          delete org.notes[item.name];
                        }
                        const copies = current
                          ? next.projects[current.id]?.copies
                          : next.copies;
                        if (copies) {
                          delete copies[join(item.origin, 'SKILL.md')];
                          delete copies[item.origin];
                        }
                        try {
                          await writeState(next);
                        } catch {
                          result = { warning: 'trash-state' };
                        }
                      }
                    }
                  }
                  revision++;
                  for (const control of controls) control.invalidate();
                  return result ?? {};
                } catch (error) {
                  return fail(
                    409,
                    error instanceof Error && error.message.startsWith('trash-')
                      ? error.message
                      : 'trash-failed',
                  );
                }
              });
              operations = mutation.catch(() => undefined);
              const result = await mutation;
              if (result instanceof Response) return result;
              return Response.json({
                ...(await payload(project, await registeredProjects(), marked)),
                result,
              });
            }
            if (String(body.action).startsWith('catalog-')) {
              if (!marked) return fail(403, 'forbidden');
              const cancelled = () => closing || request.signal.aborted;
              if (closing) return fail(503, 'stopping');
              try {
                if (corrupt) return fail(409, 'state-invalid');
                const signal = request.signal;
                // Browse/search/detail are read-only answers; mutations also return the refreshed list.
                if (body.action === 'catalog-clawhub-list')
                  return Response.json(
                    await catalogs.clawhubList(
                      {
                        limit: body.limit,
                        cursor: body.cursor,
                        sort: body.sort,
                      },
                      signal,
                    ),
                  );
                if (body.action === 'catalog-clawhub-search')
                  return Response.json(
                    await catalogs.clawhubSearch(
                      { q: body.q, limit: body.limit },
                      signal,
                    ),
                  );
                if (body.action === 'catalog-skillsh-search')
                  return Response.json(
                    await catalogs.skillsShSearch({ q: body.q }, signal),
                  );
                if (body.action === 'catalog-detail')
                  return Response.json(
                    await catalogs.detail(body.skill, signal),
                  );
                let result: unknown;
                if (body.action === 'catalog-install') {
                  result = await catalogs.install(
                    {
                      skill: body.skill,
                      destination:
                        body.destination ??
                        (body.project === undefined ? 'user-dsh' : undefined),
                      project: body.project,
                      confirm: body.confirm,
                      reassociate: body.reassociate,
                    },
                    cancelled,
                    signal,
                  );
                  await enableInstalled(result);
                } else if (body.action === 'catalog-uninstall')
                  result = await catalogs.uninstall(
                    body.installId,
                    body.project,
                    cancelled,
                  );
                else if (body.action === 'catalog-forget') {
                  // A record whose Trash entry vanished outside the app may be forgotten; only a clean Trash scan proves that.
                  let trashIds: Set<string> | undefined;
                  try {
                    const scan = await scanTrash(trashRoot);
                    if (!scan.overLimit && !scan.skipped)
                      trashIds = new Set(scan.items.map((item) => item.id));
                  } catch {
                    trashIds = undefined;
                  }
                  result = await catalogs.forget(
                    body.installId,
                    body.project,
                    trashIds,
                  );
                } else return fail(400, 'catalog-action');
                return Response.json({
                  ...(await payload(
                    project,
                    await registeredProjects(),
                    marked,
                  )),
                  result,
                });
              } catch (error) {
                if (error instanceof RepoError)
                  return fail(error.status, error.code);
                return fail(400, 'catalog-failed');
              }
            }
            if (String(body.action).startsWith('repo-')) {
              if (!marked) return fail(403, 'forbidden');
              const cancelled = () => closing || request.signal.aborted;
              if (closing) return fail(503, 'stopping');
              try {
                let result: unknown;
                if (corrupt) return fail(409, 'state-invalid');
                if (body.action === 'repo-add')
                  result = await repos.add(body.repository, request.signal);
                else if (body.action === 'repo-refresh')
                  result = await repos.refresh(body.id, request.signal);
                else if (body.action === 'repo-refresh-all')
                  result = await repos.refreshAll(request.signal);
                else if (body.action === 'repo-remove')
                  result = await repos.remove(body.id);
                else if (body.action === 'repo-install') {
                  result = await repos.install(
                    {
                      id: body.id,
                      path: body.path,
                      snapshot: body.snapshot,
                      source:
                        body.source ??
                        (body.project === undefined ? 'user-dsh' : undefined),
                      project: body.project,
                    },
                    cancelled,
                  );
                  await enableInstalled(result);
                } else if (body.action === 'repo-forget')
                  result = await repos.forget(body.installId, body.project);
                else if (
                  body.action === 'repo-update-preview' ||
                  body.action === 'repo-rollback-preview'
                )
                  result = await repos.preview(
                    body.action === 'repo-update-preview'
                      ? 'update'
                      : 'rollback',
                    body.installId,
                    body.project,
                  );
                else if (
                  body.action === 'repo-update' ||
                  body.action === 'repo-rollback'
                )
                  result = await repos.replace(
                    body.action === 'repo-update' ? 'update' : 'rollback',
                    {
                      id: body.installId,
                      current: body.current,
                      target: body.target,
                      snapshot: body.snapshot,
                      overwrite: body.overwrite,
                      project: body.project,
                    },
                    cancelled,
                  );
                else
                  result = await repos.uninstall(
                    body.installId,
                    body.project,
                    cancelled,
                  );
                return Response.json({
                  ...(await payload(
                    project,
                    await registeredProjects(),
                    marked,
                  )),
                  result,
                });
              } catch (error) {
                if (error instanceof RepoError)
                  return fail(
                    error.status,
                    error.code,
                    error.recovery.length
                      ? { recovery: error.recovery.join(' ') }
                      : {},
                  );
                return fail(400, 'repo-failed');
              }
            }
            if (body.action === 'import' || body.action === 'upload') {
              if (!marked) return fail(403, 'forbidden');
              const mutation = operations.then(async () => {
                if (closing || request.signal.aborted)
                  return fail(409, 'import-cancelled');
                if (corrupt) return fail(409, 'state-invalid');
                const current =
                  body.project === undefined
                    ? undefined
                    : (await registeredProjects()).find(
                        (item) => item.id === body.project,
                      );
                if (
                  body.project !== undefined &&
                  (registryUnavailable || !current)
                )
                  return fail(404, 'project-unregistered');
                const destination = current
                  ? current.available &&
                    current.root &&
                    body.source === `project-dsh:${current.id}`
                    ? join(current.root, '.dsh', 'skills')
                    : undefined
                  : baseSources.find(
                      (item) =>
                        item.id === body.source &&
                        ['user-dsh', 'user-agents'].includes(item.id),
                    )?.path;
                if (!destination) return fail(403, 'create-readonly');
                const cancelled = () => closing || request.signal.aborted;
                try {
                  const found =
                    body.action === 'import'
                      ? await localItems(
                          body.path,
                          resolve(destination),
                          cancelled,
                        )
                      : body.archives !== undefined
                        ? await uploadBatch(
                            body.entries,
                            body.archives,
                            cancelled,
                          )
                        : body.zip === undefined
                          ? uploadedItems(body.entries)
                          : await zipItems(body.zip, cancelled);
                  const result = await publishImports(
                    found.items,
                    resolve(destination),
                    body.conflict,
                    body.dryRun === true,
                    cancelled,
                  );
                  result.failed.unshift(...found.failed);
                  const response = {
                    ...result,
                    inputs: 'inputs' in found ? found.inputs : [],
                  };
                  if (result.imported.length) {
                    await clearStaleDisabled(
                      resolve(destination),
                      result.imported.map((item) => item.name),
                      project?.id,
                    );
                    revision++;
                    for (const control of controls) control.invalidate();
                  }
                  return response;
                } catch (error) {
                  return fail(
                    400,
                    error instanceof Error &&
                      error.message.startsWith('import-')
                      ? error.message
                      : 'import-failed',
                  );
                }
              });
              operations = mutation.catch(() => undefined);
              const result = await mutation;
              if (result instanceof Response) return result;
              return Response.json({
                ...(await payload(project, await registeredProjects(), marked)),
                result,
              });
            }
            if (body.action === 'create') {
              if (!marked) return fail(403, 'forbidden');
              const mutation = operations.then(async () => {
                // Re-read the registry inside the write queue, not from an earlier selector snapshot.
                const current =
                  body.project === undefined
                    ? undefined
                    : (await registeredProjects()).find(
                        (item) => item.id === body.project,
                      );
                if (
                  body.project !== undefined &&
                  (registryUnavailable || !current)
                )
                  return fail(404, 'project-unregistered');
                return createSkill(body, current);
              });
              operations = mutation.catch(() => undefined);
              const created = await mutation;
              if (created instanceof Response) return created;
              return Response.json({
                ...(await payload(project, await registeredProjects(), marked)),
                created,
              });
            }
            if (body.action === 'detail') {
              if (!marked)
                return new Response('Mutation marker required', {
                  status: 403,
                });
              const { copies } = project
                ? await projectCatalog(project)
                : await catalog();
              const copy = copies.find((copy) => copy.path === body.id);
              if (!copy) return new Response('Unknown skill', { status: 404 });
              const { content: _content, original, ...rest } = copy;
              return Response.json({ ...rest, content: original ?? '' });
            }
            if (body.action === 'custom-scan') {
              if (!marked)
                return new Response('Mutation marker required', {
                  status: 403,
                });
              const found = await scanCandidates(
                body.path,
                await prepareRoots(
                  await protectedRoots(await projects()),
                  reservedFolders(),
                ),
                state.customSources.map((x) => x.path),
                request.signal,
              );
              if (!found.ok) return fail(409, found.code, found.params);
              return Response.json(found);
            }
            if (body.action === 'root-set') {
              if (!marked)
                return new Response('Mutation marker required', {
                  status: 403,
                });
              if (typeof body.id !== 'string')
                return new Response('Invalid root request', { status: 400 });
              // Provider roots are global; a project scope never redirects them.
              if (body.project !== undefined)
                return fail(409, 'project-scope-unsupported');
              const mutation = operations.then(async () => {
                if (closing)
                  return new Response('Skill manager is stopping', {
                    status: 503,
                  });
                if (corrupt)
                  return new Response('Skill state is invalid', {
                    status: 409,
                  });
                return rootSet(
                  body as Record<string, unknown>,
                  await projects(),
                );
              });
              operations = mutation.catch(() => undefined);
              const error = await mutation;
              if (error) return error;
              return Response.json(await payload(project, await projects()));
            }
            if (body.action?.startsWith('custom-')) {
              if (!marked)
                return new Response('Mutation marker required', {
                  status: 403,
                });
              const items = body.items;
              if (
                (body.action === 'custom-add' &&
                  (!Array.isArray(items) ||
                    !items.length ||
                    items.length > 64 ||
                    items.some(
                      (x) => !x || typeof x !== 'object' || Array.isArray(x),
                    ))) ||
                (body.action === 'custom-update' &&
                  (typeof body.id !== 'string' ||
                    typeof body.label !== 'string' ||
                    !body.label.trim())) ||
                (body.action === 'custom-remove' && typeof body.id !== 'string')
              )
                return new Response('Invalid custom source request', {
                  status: 400,
                });
              let results: Array<Record<string, unknown>> | undefined;
              const mutation = operations.then(async () => {
                if (closing)
                  return new Response('Skill manager is stopping', {
                    status: 503,
                  });
                if (corrupt)
                  return new Response('Skill state is invalid', {
                    status: 409,
                  });
                if (body.action === 'custom-add') {
                  results = await customAdd(
                    items as Array<Record<string, unknown>>,
                    await projects(),
                  );
                  return undefined;
                }
                return body.action === 'custom-update'
                  ? customUpdate(
                      body as Record<string, unknown>,
                      await projects(),
                    )
                  : customRemove(body.id as string);
              });
              operations = mutation.catch(() => undefined);
              const error = await mutation;
              if (error) return error;
              return Response.json({
                ...(await payload(project, await projects())),
                results,
              });
            }
            if (ORG_ACTIONS.includes(body.action ?? '')) {
              if (!marked)
                return new Response('Mutation marker required', {
                  status: 403,
                });
              const mutation = operations.then(async () =>
                organize(body, project, await projects()),
              );
              operations = mutation.catch(() => undefined);
              const error = await mutation;
              if (error) return error;
              return Response.json(
                await payload(project, await projects(), marked),
              );
            }
            if (body.action === 'toggle') {
              if (!marked)
                return new Response('Mutation marker required', {
                  status: 403,
                });
              const mutation = operations.then(async () => {
                if (closing)
                  return new Response('Skill manager is stopping', {
                    status: 503,
                  });
                if (corrupt)
                  return new Response('Skill state is invalid', {
                    status: 409,
                  });
                if (
                  typeof body.enabled !== 'boolean' ||
                  typeof body.id !== 'string'
                )
                  return new Response('Invalid toggle', { status: 400 });
                const next = cloneState();
                if (project) {
                  const view = project.available
                    ? await projectCatalog(project)
                    : undefined;
                  const own = (next.projects[project.id] ??= {
                    sources: Object.create(null),
                    copies: Object.create(null),
                  });
                  if (body.kind === 'source') {
                    const source = view?.list.find((x) => x.id === body.id);
                    if (!source)
                      return new Response('Unknown skill target', {
                        status: 400,
                      });
                    // Reference restriction: the project DSH source has no switch.
                    if (source.kind === 'dsh')
                      return fail(409, 'project-dsh-source');
                    own.sources[source.kind ?? ''] = body.enabled;
                  } else if (
                    body.kind === 'copy' &&
                    view?.copies.some((x) => x.path === body.id)
                  )
                    own.copies[body.id] = body.enabled;
                  else
                    return new Response('Unknown skill target', {
                      status: 400,
                    });
                } else {
                  const { copies } = await catalog();
                  const valid =
                    body.kind === 'source'
                      ? globalSources().some((x) => x.id === body.id)
                      : body.kind === 'copy' &&
                        copies.some((x) => x.path === body.id);
                  if (!valid)
                    return new Response('Unknown skill target', {
                      status: 400,
                    });
                  (body.kind === 'source' ? next.sources : next.copies)[
                    body.id
                  ] = body.enabled;
                }
                await writeState(next);
                return undefined;
              });
              operations = mutation.catch(() => undefined);
              const error = await mutation;
              if (error) return error;
            }
            return Response.json(
              await payload(project, await projects(), marked),
            );
          } catch (error) {
            // Name and code only: messages can carry file paths.
            ctx.logger?.warn?.(
              `dsh-waycraft: skill operation failed (${(error as { code?: string }).code ?? (error as Error)?.name ?? 'unknown'})`,
            );
            return new Response('Skill operation failed', { status: 400 });
          }
        },
      });
    // New route plus the deprecated legacy route for one release (stale browser clients).
    target.effect(() => {
      const offs = ['/api/waycraft-skills.catalog', LEGACY_SKILLS_ROUTE].map(
        registerRoute,
      );
      return () => {
        for (const off of offs) off();
      };
    }, 'waycraft-skills catalog');
  });
  ctx.effect(() => {
    const stop = install(ctx);
    const add = ({ agent }: { agent: Agent }) => {
      if (!registrations.has(agent.id))
        registrations.set(agent.id, install(agent.ctx));
    };
    const remove = ({ agent }: { agent: Agent }) => {
      registrations.get(agent.id)?.();
      registrations.delete(agent.id);
    };
    const offCreated = ctx.on?.('agent/created', add);
    const offDisposed = ctx.on?.('agent/disposed', remove);
    for (const agent of ctx.get?.('agents')?.list() ?? []) add({ agent });
    return () => {
      offCreated?.();
      offDisposed?.();
      for (const dispose of registrations.values()) dispose();
      registrations.clear();
      stop();
    };
  }, 'waycraft-skills availability overlay');
}
