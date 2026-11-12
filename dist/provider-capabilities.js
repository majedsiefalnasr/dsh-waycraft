export const CLAUDE_CAPABILITIES = {
    // 2.0.0 is the floor the official Agent SDK declares for its subprocess transport.
    cli: {
        minimumVersion: '2.0.0',
        updateCommand: 'claude update',
        source: 'https://code.claude.com/docs/en/setup',
    },
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
