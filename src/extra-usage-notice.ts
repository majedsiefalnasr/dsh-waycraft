/**
 * Session card for Anthropic's extra-usage HTTP 400 on a Direct sign-in Claude account (#181). The host records the
 * refusal per session and answers `extraUsageNotice`; this card turns it into a localised explanation with an action
 * that opens the add-account flow on Official CLI. Independently implemented; no reference source.
 */

/** How often the card asks the host whether its session was refused (a cheap in-memory lookup). */
const POLL_MS = 3_000;

export function createExtraUsageNotice(
  React: any,
  primitives: any,
  AddAccount: any,
) {
  const h = React.createElement;
  const Button = primitives.Button ?? 'button';
  const Modal = primitives.Modal;
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
    actions: { display: 'flex', flexWrap: 'wrap' as const, gap: 8 },
  };
  return function ExtraUsageNotice({
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
    const [adding, setAdding] = React.useState(false);
    const flow = React.useRef(null as any);
    const closing = React.useRef(false);
    const openedSession = React.useRef(sessionId);
    const [closeError, setCloseError] = React.useState('');
    const close = async () => {
      if (closing.current) return;
      closing.current = true;
      try {
        if (flow.current && !(await flow.current.cancel())) return;
        setAdding(false);
        flow.current = null;
        setCloseError('');
      } catch (failure) {
        setCloseError(
          failure instanceof Error ? failure.message : String(failure),
        );
      } finally {
        closing.current = false;
      }
    };
    React.useEffect(() => {
      let alive = true;
      let timer: any;
      setNotice(null);
      setDismissed(null);
      const read = async () => {
        try {
          const answer = await rpc.call(
            '/api',
            'waycraft-subscriptions.extraUsageNotice',
            { provider: 'claude', sessionId },
          );
          if (!alive) return;
          setNotice(
            answer?.ok === true && answer.value?.active === true
              ? { sessionId, revision: answer.value.revision }
              : null,
          );
        } catch {
          // Advisory lookup failures preserve the last known refusal.
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
    // A session switch must not silently unmount an owned CLI attempt. Close it
    // through the same cancellation contract as Escape and the dialog close button.
    React.useEffect(() => {
      if (adding) void close();
    }, [sessionId]);
    const visible =
      notice?.sessionId === sessionId && notice.revision !== dismissed;
    if (!visible && !adding) return null;
    return h(
      'section',
      {
        role: 'alert',
        style: styles.card,
        'data-waycraft-extra-usage': true,
      },
      visible ? h('h4', { style: styles.title }, t('extraUsageTitle')) : null,
      visible
        ? h('p', { style: styles.body }, t('extraUsageExplanation'))
        : null,
      h(
        'div',
        { style: { ...styles.actions, display: visible ? 'flex' : 'none' } },
        h(
          Button,
          {
            type: 'button',
            'data-waycraft-extra-usage-action': true,
            disabled: adding || !Modal,
            onClick: () => {
              openedSession.current = sessionId;
              setAdding(true);
            },
          },
          t('extraUsageAction'),
        ),
        h(
          Button,
          {
            type: 'button',
            'data-waycraft-extra-usage-dismiss': true,
            disabled: adding,
            onClick: () => setDismissed(notice?.revision ?? null),
          },
          t('extraUsageDismiss'),
        ),
      ),
      adding
        ? h(
            Modal,
            {
              open: true,
              title: t('extraUsageAction'),
              closeLabel: t('cancel'),
              onClose: () => void close(),
            },
            closeError ? h('p', { role: 'alert' }, closeError) : null,
            h(AddAccount, {
              presentation: 'auth',
              initialAccessMethod: 'official-cli',
              onFlowState: (state: any) => {
                flow.current = state;
                if (openedSession.current !== sessionId) void close();
              },
              onComplete: () => {
                void close();
              },
            }),
          )
        : null,
    );
  };
}
