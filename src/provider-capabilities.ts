export interface AccessMethodWarning {
  level: 'info' | 'danger';
  text: string;
  source: string;
  lastReviewed: string;
}

/** What an Official CLI must satisfy, and the official way to bring an older one up to date. */
export interface ProviderCliRequirements {
  minimumVersion: string;
  updateCommand: string;
  source: string;
}

/** The CLI modes DSH's file policy can select (the Claude CLI's `--permission-mode` values). */
export type ProviderPermissionMode =
  | 'default'
  | 'plan'
  | 'acceptEdits'
  | 'bypassPermissions';

/**
 * How DSH's permission settings become the CLI's permission mode for a turn. The file policy reaches an adapter only as
 * the line `Current DSH file policy: <policy>` in DSH's runtime-context message (a text convention, not an API), so a
 * missing or unrecognised line selects `fallback`: the CLI's own asking mode, never a more permissive one.
 * `bypassPermissions` for `danger-full-access` mirrors a mode the Owner chose in DSH.
 */
export interface ProviderPermissionModes {
  source: string;
  byFilePolicy: Readonly<Record<string, ProviderPermissionMode>>;
  fallback: ProviderPermissionMode;
}

export interface ProviderCapabilities {
  cli: ProviderCliRequirements;
  /** Permission mode mapping, and the fact that prompts, questions and plan reviews become DSH dialogs. */
  permissionModes: ProviderPermissionModes;
  defaultAccessMethod: 'official-cli' | 'direct';
  accessMethods: ReadonlyArray<{
    id: 'official-cli' | 'direct';
    warning: AccessMethodWarning;
  }>;
  /** DSH MCP tools made available to the Claude CLI and provider-specific limitations. */
  cliTools: {
    allowlist: readonly string[];
    limitations: readonly string[];
  };
}

export const CLAUDE_CAPABILITIES: ProviderCapabilities = {
  // 2.0.0 is the floor the official Agent SDK declares for its subprocess transport.
  cli: {
    minimumVersion: '2.0.0',
    updateCommand: 'claude update',
    source: 'https://code.claude.com/docs/en/setup',
  },
  permissionModes: {
    source: 'https://code.claude.com/docs/en/permission-modes',
    byFilePolicy: {
      'read-only': 'plan',
      'workspace-write': 'acceptEdits',
      'danger-full-access': 'bypassPermissions',
    },
    fallback: 'default',
  },
  defaultAccessMethod: 'official-cli',
  cliTools: {
    allowlist: ['get_goal', 'create_goal', 'update_goal', 'web_search'],
    limitations: [
      'DSH subagents are unavailable in Claude CLI sessions; use Claude CLI native subagents.',
      'MCP manager servers that use a ${credential:REF} are not available in Claude CLI sessions: the CLI cannot read DSH credentials and no secret is written to disk.',
    ],
  },
  accessMethods: [
    {
      id: 'official-cli',
      warning: {
        level: 'info',
        text: 'claudeOfficialCliWarning',
        source: 'https://code.claude.com/docs/en/legal-and-compliance',
        lastReviewed: '2026-11-11',
      },
    },
    {
      id: 'direct',
      warning: {
        level: 'danger',
        text: 'claudeDirectWarning',
        source: 'https://code.claude.com/docs/en/legal-and-compliance',
        lastReviewed: '2026-11-11',
      },
    },
  ],
};
