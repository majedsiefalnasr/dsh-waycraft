/**
 * Waycraft MCP Manager — browser-side integration (ticket #163).
 * Minimal Owner-facing panel placeholder; full server/tool UI arrives in later tickets.
 */
export function applyMcp(root: any): void {
  const fail = (error: unknown) =>
    console.error('dsh-waycraft: MCP manager setup failed', error);
  try {
    Promise.resolve(
      root.inject(['slots', 'locale', 'connection'], (ctx: any) => {
        try {
          setupMcp(ctx, fail);
        } catch (error) {
          fail(error);
        }
      }),
    ).catch(fail);
  } catch (error) {
    fail(error);
  }
}

function setupMcp(ctx: any, fail: (error: unknown) => void): void {
  const effect = (run: () => any, label: string) => {
    try {
      const result = ctx.effect(run, label);
      Promise.resolve(result).catch(fail);
      return result;
    } catch (error) {
      fail(error);
    }
  };
  const React = require('react');
  const h = React.createElement;
  const NS = 'waycraft.mcp';
  const dictionaries = {
    en: {
      title: 'MCP servers',
      description: 'Manage MCP servers (Owner only). Full controls arrive in later tickets.',
      status: 'Status',
      checking: 'Checking authorization…',
      authorized: 'Authorized (Owner)',
      unauthorized: 'Not authorized',
      error: 'Unable to reach MCP manager.',
    },
    ar: {
      title: 'خوادم MCP',
      description: 'إدارة خوادم MCP (للمالك فقط). ستتوفر عناصر التحكم الكاملة في تذاكر لاحقة.',
      status: 'الحالة',
      checking: 'جارٍ التحقق من التفويض…',
      authorized: 'مصرّح (المالك)',
      unauthorized: 'غير مصرّح',
      error: 'تعذّر الوصول إلى مدير MCP.',
    },
  };

  effect(
    () => ctx.locale.register(NS, dictionaries),
    'dsh-waycraft: mcp dictionaries',
  );
  const t = ctx.locale.bind(NS);
  const connection = ctx.get('connection');

  function McpPanel() {
    const [state, setState] = React.useState({ kind: 'checking' } as any);
    React.useEffect(() => {
      let alive = true;
      (async () => {
        try {
          const response = await fetch('/api/waycraft-mcp.manage', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-waycraft-mcp': '1',
            },
            body: JSON.stringify({ action: 'status' }),
          });
          if (!alive) return;
          if (response.status === 401 || response.status === 403) {
            setState({ kind: 'unauthorized' });
            return;
          }
          const data = await response.json().catch(() => ({}));
          if (data && data.ok && data.authorized) setState({ kind: 'authorized' });
          else setState({ kind: 'error' });
        } catch {
          if (alive) setState({ kind: 'error' });
        }
      })();
      return () => {
        alive = false;
      };
    }, []);
    const statusText =
      state.kind === 'checking'
        ? t('checking')
        : state.kind === 'authorized'
          ? t('authorized')
          : state.kind === 'unauthorized'
            ? t('unauthorized')
            : t('error');
    return h(
      'section',
      { 'data-waycraft-mcp-panel': 'true', style: { display: 'flex', flexDirection: 'column', gap: 8 } },
      h('p', { style: { margin: 0 } }, t('description')),
      h('p', { style: { margin: 0 } }, `${t('status')}: ${statusText}`),
    );
  }

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'waycraft-mcp',
        order: 92,
        label: () => t('title'),
      },
      McpPanel,
    ),
  );
  void connection;
}
