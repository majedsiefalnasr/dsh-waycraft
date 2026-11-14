/**
 * Session card for an Official CLI turn that ran without the MCP manager's servers because its saved configuration
 * could not be read (#186). The host records the condition once per session and answers `cliGovernanceNotice`; this
 * card shows it until the Owner dismisses it, and shows it again only for a new revision (a later failure after the
 * configuration was readable again). It carries no server name and no configuration value.
 */

/** How often the card asks the host whether its session has the notice (a cheap in-memory lookup). */
const POLL_MS = 3_000;

export function createCliGovernanceNotice(React: any, primitives: any) {
  const h = React.createElement;
  const Button = primitives.Button ?? 'button';
  const styles = {
    card: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 8,
      padding: '12px 16px',
      border: '0.5px solid var(--dsw-alias-border-l2)',
      borderRadius: 'var(--dsw-radius-xl,20px)',
      background: 'var(--dsw-alias-bg-layer-2)',
      textAlign: 'start' as const,
      minInlineSize: 0,
    },
    title: { margin: 0, fontSize: 14, lineHeight: '20px', fontWeight: 500 },
    body: {
      margin: 0,
      fontSize: 13,
      lineHeight: '20px',
      color: 'var(--dsw-alias-label-secondary)',
      overflowWrap: 'anywhere' as const,
    },
  };
  return function CliGovernanceNotice({
    rpc,
    sessionId,
    t,
  }: {
    rpc: any;
    sessionId: string;
    t: (key: string) => string;
  }) {
    const [notice, setNotice] = React.useState(
      null as null | { sessionId: string; revision: number },
    );
    const [dismissed, setDismissed] = React.useState(null as number | null);
    React.useEffect(() => {
      let alive = true;
      let timer: any;
      setNotice(null);
      setDismissed(null);
      const read = async () => {
        try {
          const answer = await rpc.call(
            '/api',
            'waycraft-subscriptions.cliGovernanceNotice',
            { provider: 'claude', sessionId },
          );
          if (!alive) return;
          setNotice(
            answer?.ok === true && answer.value?.active === true
              ? { sessionId, revision: answer.value.revision }
              : null,
          );
        } catch {
          // Advisory lookup failures keep the last known state.
        } finally {
          if (alive) timer = setTimeout(() => void read(), POLL_MS);
        }
      };
      void read();
      return () => {
        alive = false;
        clearTimeout(timer);
      };
    }, [sessionId, rpc]);
    if (
      !notice ||
      notice.sessionId !== sessionId ||
      notice.revision === dismissed
    )
      return null;
    return h(
      'section',
      {
        role: 'status',
        style: styles.card,
        'data-waycraft-cli-governance-notice': true,
      },
      h('h4', { style: styles.title }, t('cliGovernanceNoticeTitle')),
      h('p', { style: styles.body }, t('cliGovernanceNoticeBody')),
      h(
        Button,
        {
          type: 'button',
          'data-waycraft-cli-governance-dismiss': true,
          onClick: () => setDismissed(notice.revision),
        },
        t('cliGovernanceNoticeDismiss'),
      ),
    );
  };
}
