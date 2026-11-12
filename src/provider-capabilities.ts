export interface AccessMethodWarning {
  level: 'info' | 'danger';
  text: string;
  source: string;
  lastReviewed: string;
}

export interface ProviderCapabilities {
  defaultAccessMethod: 'official-cli' | 'direct';
  accessMethods: ReadonlyArray<{
    id: 'official-cli' | 'direct';
    warning: AccessMethodWarning;
  }>;
}

export const CLAUDE_CAPABILITIES: ProviderCapabilities = {
  defaultAccessMethod: 'official-cli',
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
