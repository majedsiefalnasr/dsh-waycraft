import { ProviderAccountManager } from './settings/ProviderAccountManager.js';
import {
  controlCss,
  providerDisclosure,
  providerIdentity,
  providerStatus,
  styles,
} from './codex-card.js';
/** Locale keys for a warning level, kept outside `t(...)` so the level names are not read as keys. */
const WARNING_LEVEL_KEYS: Record<string, string> = {
  info: 'warningInfo',
  danger: 'warningDanger',
};
/**
 * Claude Settings card. Scoped presentation port of the Claude part of V1ki v0.9.12 b802311
 * SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
 * labels, plan and expiry, never a token or credential-store path.
 */
export function createClaudeCard(
  React: any,
  primitives: any,
  rpc: any,
  t: (key: string) => string,
) {
  const h = React.createElement;
  const Button = primitives.Button ?? 'button';
  const Input = primitives.Input ?? 'input';
  const DEFAULT_NAME = 'Claude (Subscription)';
  return function ClaudeCard({
    presentation,
    onComplete,
    onFlowState,
    onAccountsChange,
    revision,
    initialExpanded = false,
  }: any = {}) {
    const [expanded, setExpanded] = React.useState(initialExpanded);
    const initialAuthRevision = React.useRef(null as number | null);
    const [manager, setManager] = React.useState(false);
    const [status, setStatus] = React.useState(null);
    const [error, setError] = React.useState('');
    const [pending, setPending] = React.useState(false);
    const [login, setLogin] = React.useState(null);
    const [input, setInput] = React.useState('');
    const [accessMethod, setAccessMethod] = React.useState(null);
    const [cliInstallation, setCliInstallation] = React.useState(null);
    const [terminalInput, setTerminalInput] = React.useState('');
    React.useEffect(() => {
      const loginId = login?.loginId;
      if (!loginId) return;
      let cancelled = false;
      let reading = false;
      let timer: any;
      const read = async () => {
        if (reading) return;
        reading = true;
        try {
          const value = await call('cliRead', { loginId });
          if (cancelled || !alive.current) return;
          setLogin((previous: any) =>
            previous?.loginId === loginId
              ? { ...previous, ...value }
              : previous,
          );
          // A failed sign-in keeps its output on screen until the Owner cancels it; nothing more changes.
          if (value.state === 'failed') clearInterval(timer);
          if (value.state === 'authenticated') {
            clearInterval(timer);
            await call('cliCancel', { loginId });
            if (cancelled || !alive.current) return;
            setLogin(null);
            await refreshStatus();
          }
        } catch (failure) {
          // The host no longer has this attempt (cancelled elsewhere or the component was disabled).
          clearInterval(timer);
          if (!cancelled && alive.current) {
            setLogin(null);
            setError(
              failure instanceof Error ? failure.message : String(failure),
            );
          }
        } finally {
          reading = false;
        }
      };
      void read();
      timer = setInterval(() => {
        void read();
      }, 500);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }, [login?.loginId]);
    const [usage, setUsage] = React.useState({});
    const [confirmation, setConfirmation] = React.useState(null);
    const alive = React.useRef(true);
    const usageRequests = React.useRef(new Map());
    const accountKeys = React.useRef(new Set());
    const call = async (endpoint: string, payload: object = {}) => {
      const response = await rpc.call(
        '/api',
        `waycraft-subscriptions.${endpoint}`,
        { provider: 'claude', ...payload },
      );
      if (!response?.ok)
        throw new Error(response?.error?.message ?? t('unreachable'));
      return response.value;
    };
    const refreshStatus = async () => {
      const value = await call('status');
      // `status` is the one endpoint that always answers for Codex; Claude details ride along under providers.claude.
      if (alive.current)
        setStatus({
          ...(value.providers.claude ?? { accounts: [] }),
          registrationError: value.claudeRegistrationError,
        });
    };
    const action = async (run: () => Promise<void>) => {
      setPending(true);
      setError('');
      try {
        await run();
      } catch (failure) {
        if (alive.current)
          setError(
            failure instanceof Error ? failure.message : String(failure),
          );
      } finally {
        if (alive.current) setPending(false);
      }
    };
    React.useEffect(() => {
      alive.current = true;
      void refreshStatus().catch((failure: Error) => {
        if (alive.current) setError(failure.message);
      });
      return () => {
        alive.current = false;
      };
    }, []);
    React.useEffect(() => {
      // A failed re-read after an external change would leave stale data; show it like the first load does.
      if (revision !== undefined)
        void refreshStatus().catch((failure: unknown) => {
          if (alive.current)
            setError(
              failure instanceof Error ? failure.message : String(failure),
            );
        });
    }, [revision]);
    React.useEffect(() => {
      if (!status?.busy) return;
      const timer = setInterval(() => {
        void refreshStatus().catch((failure: Error) => {
          if (alive.current) setError(failure.message);
        });
      }, 2000);
      return () => clearInterval(timer);
    }, [status?.busy]);
    const refreshUsage = (account: string, force = false) => {
      if (usageRequests.current.has(account))
        return usageRequests.current.get(account);
      let request!: Promise<void>;
      request = (async () => {
        try {
          const snapshot = await call('usage', { account, force });
          if (
            alive.current &&
            accountKeys.current.has(account) &&
            usageRequests.current.get(account) === request
          )
            setUsage((previous: object) => ({
              ...previous,
              [account]: snapshot,
            }));
        } catch (failure) {
          if (
            alive.current &&
            accountKeys.current.has(account) &&
            usageRequests.current.get(account) === request
          )
            setUsage((previous: object) => ({
              ...previous,
              [account]: {
                error:
                  failure instanceof Error ? failure.message : String(failure),
              },
            }));
        } finally {
          if (usageRequests.current.get(account) === request)
            usageRequests.current.delete(account);
        }
      })();
      usageRequests.current.set(account, request);
      return request;
    };
    const reportedAccounts = React.useRef(null as string | null);
    const accountsSignature = JSON.stringify(
      (status?.accounts ?? []).map((account: any) => account.key),
    );
    React.useEffect(() => {
      if (presentation === 'group' && status) {
        if (
          reportedAccounts.current !== null &&
          reportedAccounts.current !== accountsSignature
        )
          onAccountsChange?.();
        reportedAccounts.current = accountsSignature;
      }
      const keys = new Set<string>(
        (status?.accounts ?? []).map((account: any) => account.key),
      );
      const added = [...keys].filter((key) => !accountKeys.current.has(key));
      accountKeys.current = keys;
      for (const key of usageRequests.current.keys())
        if (!keys.has(key)) usageRequests.current.delete(key);
      setUsage((previous: object) =>
        Object.fromEntries(
          Object.entries(previous).filter(([key]) => keys.has(key)),
        ),
      );
      if (presentation !== 'auth')
        for (const key of added)
          if (
            status.accounts.find((account: any) => account.key === key)
              ?.accessMethod !== 'official-cli'
          )
            void refreshUsage(key);
    }, [accountsSignature]);
    const button = (
      label: string,
      onClick: () => void,
      disabled = false,
      props: any = {},
    ) =>
      h(
        Button,
        { type: 'button', disabled: pending || disabled, onClick, ...props },
        label,
      );
    const date = (time: number) => new Date(time).toLocaleString();
    // One access-method warning: level, text, source link and last-reviewed date.
    const warning = (method: any, tag: string, dataAttribute: string) =>
      h(
        tag,
        {
          key: method.id,
          role: 'note',
          style: styles.statusLine,
          [dataAttribute]: method.warning.level,
        },
        h('strong', null, t(WARNING_LEVEL_KEYS[method.warning.level])),
        ': ',
        t(method.warning.text),
        ' ',
        h(
          'a',
          {
            href: method.warning.source,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          t('warningSource'),
        ),
        ' ',
        t('warningReviewed'),
        ' ',
        method.warning.lastReviewed,
      );
    const part = (name: string, style: any, ...children: any[]) =>
      h('div', { style, 'data-waycraft-claude-part': name }, ...children);
    // `method` is 'oauth' (browser authorization) or 'keychain' (import Claude Code); omitted tries the import first.
    // An empty authorizeUrl means the import finished instantly: there is no page to open.
    // Where the provider declares access methods, the selector (or its default) decides the add-account flow;
    // Direct sign-in keeps the existing OAuth and import actions unchanged.
    const selectedMethod = status?.capabilities
      ? (accessMethod ?? status.capabilities.defaultAccessMethod)
      : undefined;
    const officialCli = selectedMethod === 'official-cli';
    const startLogin = (method?: 'oauth' | 'keychain') => {
      void action(async () => {
        const selected = officialCli ? 'official-cli' : method;
        const result = await call(
          'login',
          selected === undefined ? {} : { method: selected },
        );
        if (!alive.current) return;
        setCliInstallation(result.available === false ? result : null);
        if (result.authorizeUrl)
          window.open(result.authorizeUrl, '_blank', 'noopener');
        setLogin(result.authorizeUrl || result.loginId ? result : null);
        await refreshStatus();
      });
    };
    React.useEffect(() => {
      if (!status) return;
      const current = status.authRevision ?? 0;
      if (initialAuthRevision.current === null)
        initialAuthRevision.current = current;
      else if (
        presentation === 'auth' &&
        current > initialAuthRevision.current
      ) {
        initialAuthRevision.current = current;
        onComplete?.();
      }
    }, [status]);
    const busy = status?.busy;
    React.useEffect(() => {
      if (presentation !== 'auth') return;
      onFlowState?.({
        busy: pending || !!busy,
        cancel: async () => {
          if (pending) return false;
          if (busy) {
            await call('cancel');
            setLogin(null);
            await refreshStatus();
          }
          return true;
        },
      });
    }, [pending, busy]);
    const name = status?.displayName || DEFAULT_NAME;
    const hasAccounts = !!status?.accounts?.length;
    return h(
      'div',
      {
        style: {
          ...styles.section,
          ...(presentation
            ? { maxWidth: 'none', maxInlineSize: 'none', width: '100%' }
            : {}),
          textAlign: 'start',
        },
        className: 'waycraft-subscriptions-settings',
        'data-waycraft-claude-card': true,
      },
      h('style', null, controlCss),
      manager
        ? h(ProviderAccountManager, {
            provider: 'claude',
            name,
            rpc,
            t,
            onClose: () => {
              setManager(false);
              void refreshStatus();
            },
          })
        : null,
      part(
        'card',
        styles.card,
        presentation !== 'auth' &&
          part(
            'header',
            styles.cardHeader,
            providerStatus(
              h,
              t,
              error || status?.registrationError
                ? 'error'
                : busy
                  ? 'warning'
                  : !status
                    ? 'checking'
                    : status?.accounts?.length
                      ? 'ready'
                      : 'warning',
              error || status?.registrationError
                ? 'providerAttention'
                : busy
                  ? 'loginProgress'
                  : !status
                    ? 'checking'
                    : status?.accounts?.length
                      ? 'providerConfigured'
                      : 'notLoggedIn',
            ),
            presentation === 'group'
              ? providerIdentity(
                  h,
                  t,
                  name,
                  status?.accounts ?? [],
                  usage,
                  status?.clientVersion,
                )
              : h('span', { style: styles.name }, name),
            presentation === 'auth'
              ? null
              : button(t('accountsManage'), () => setManager(true), false, {
                  style: { marginInlineStart: 'auto' },
                }),
            presentation === 'group'
              ? providerDisclosure(h, t, name, expanded, () =>
                  setExpanded(!expanded),
                )
              : status?.clientVersion
                ? h(
                    'span',
                    {
                      style: styles.clientVersion,
                      title: t('clientVersionHint'),
                    },
                    'CLI ',
                    h('bdi', { dir: 'ltr' }, status.clientVersion.version),
                    ' · ',
                    t(`source_${status.clientVersion.source}`),
                  )
                : null,
          ),
        (presentation === 'auth' ||
          (presentation === 'group' && status?.accounts?.length)) &&
          !busy &&
          !status?.registrationError
          ? null
          : h(
              'p',
              { style: styles.statusLine, role: 'status' },
              status?.registrationError
                ? t('claudeProviderUnavailable')
                : busy
                  ? t('loginProgress')
                  : hasAccounts
                    ? `${status.accounts.length} ${t('connected')}`
                    : status
                      ? t('notLoggedIn')
                      : t('checking'),
            ),
        status?.detail
          ? h('p', { style: styles.statusLine }, status.detail)
          : null,
        error
          ? h('p', { style: styles.errorLine, role: 'alert' }, error)
          : null,
        ...(presentation === 'auth' || (presentation === 'group' && !expanded)
          ? []
          : (status?.accounts ?? [])
        ).map((account: any) => {
          const snapshot = usage[account.key];
          return h(
            'div',
            {
              key: account.key,
              style: styles.accountRow,
              'data-waycraft-claude-part': 'account',
            },
            part(
              'account-header',
              styles.accountHeader,
              button(
                account.isDefault ? '★' : '☆',
                () => {
                  if (!account.isDefault)
                    void action(async () => {
                      await call('setDefault', { account: account.key });
                      await refreshStatus();
                    });
                },
                account.accessMethod === 'official-cli',
                {
                  style: styles.starButton,
                  title: t(
                    account.isDefault ? 'defaultAccount' : 'makeDefault',
                  ),
                  'aria-label': t(
                    account.isDefault ? 'defaultAccount' : 'makeDefault',
                  ),
                },
              ),
              h(
                'bdi',
                { dir: 'ltr', style: styles.accountName },
                account.alias || account.account || account.key,
              ),
              h(
                'span',
                {
                  style: styles.statusLine,
                  'data-waycraft-account-access-method':
                    account.accessMethod ?? 'direct',
                },
                t(
                  account.accessMethod === 'official-cli'
                    ? 'officialCli'
                    : 'directSignIn',
                ),
              ),
              account.accessMethod === 'official-cli'
                ? h(
                    'p',
                    {
                      style: { ...styles.statusLine, overflowWrap: 'anywhere' },
                    },
                    h('bdi', null, account.cliPath),
                    ' ',
                    h('bdi', null, account.cliVersion),
                  )
                : null,
              ...(status?.capabilities?.accessMethods ?? [])
                .filter(
                  (method: any) =>
                    method.id === (account.accessMethod ?? 'direct'),
                )
                .map((method: any) =>
                  warning(method, 'span', 'data-waycraft-account-warning'),
                ),
              account.plan
                ? h('bdi', { style: styles.usagePlan }, account.plan)
                : null,
              account.expiresAt
                ? h(
                    'span',
                    { style: styles.statusLine },
                    t('expires'),
                    ' ',
                    h('bdi', null, date(account.expiresAt)),
                  )
                : null,
              button(
                t('logout'),
                () =>
                  setConfirmation({
                    account: account.key,
                    label: account.account,
                  }),
                account.accessMethod === 'official-cli',
                {
                  style: { marginInlineStart: 'auto' },
                  title:
                    account.accessMethod === 'official-cli'
                      ? t('cliAccountControlsPending')
                      : undefined,
                },
              ),
            ),
            account.accessMethod === 'official-cli' ||
              snapshot?.supported === false
              ? h('p', { style: styles.statusLine }, t('usageUnavailable'))
              : part(
                  'usage',
                  styles.usage,
                  part(
                    'usage-header',
                    styles.usageHeader,
                    h('span', { style: styles.usageTitle }, t('usageTitle')),
                    button(
                      t('refreshUsage'),
                      () => {
                        void action(() => refreshUsage(account.key, true));
                      },
                      false,
                      { style: styles.usageRefresh },
                    ),
                  ),
                  !snapshot
                    ? h('p', { style: styles.statusLine }, t('usageNotLoaded'))
                    : snapshot.error
                      ? h(
                          'p',
                          { style: styles.errorLine, role: 'alert' },
                          snapshot.error,
                        )
                      : !snapshot.windows?.length
                        ? h(
                            'p',
                            { style: styles.statusLine },
                            t('usageUnavailable'),
                          )
                        : null,
                  ...(snapshot?.windows ?? []).map(
                    (window: any, index: number) => {
                      const percent = Math.max(
                        0,
                        Math.min(100, window.usedPercent),
                      );
                      const color =
                        percent >= 95
                          ? 'var(--dsw-alias-state-error-primary)'
                          : percent >= 80
                            ? 'var(--dsw-alias-state-warn-label)'
                            : 'var(--dsw-alias-state-success-primary)';
                      return h(
                        'div',
                        { key: index, style: styles.usageRow },
                        part(
                          'usage-meta',
                          styles.usageMeta,
                          h(
                            'span',
                            null,
                            t(`window_${window.kind}`),
                            window.scope ? ` · ${window.scope}` : '',
                          ),
                          h(
                            'span',
                            null,
                            h('bdi', null, `${Math.round(percent)}%`),
                            window.resetsAt
                              ? h(
                                  'span',
                                  null,
                                  ' · ',
                                  t('resets'),
                                  ' ',
                                  h('bdi', null, date(window.resetsAt)),
                                )
                              : null,
                          ),
                        ),
                        h(
                          'div',
                          {
                            role: 'progressbar',
                            'aria-label': t(`window_${window.kind}`),
                            'aria-valuenow': percent,
                            'aria-valuemin': 0,
                            'aria-valuemax': 100,
                            style: styles.usageTrack,
                          },
                          h('div', {
                            style: {
                              ...styles.usageFill,
                              background: color,
                              inlineSize: `${percent}%`,
                            },
                          }),
                        ),
                      );
                    },
                  ),
                ),
          );
        }),
        presentation !== 'group' &&
          part(
            'actions',
            styles.actions,
            busy
              ? button(t('cancelLogin'), () => {
                  void action(async () => {
                    await call('cancel');
                    setLogin(null);
                    await refreshStatus();
                  });
                })
              : officialCli
                ? button(
                    t('login'),
                    () => startLogin(),
                    !!status.registrationError || !!login?.loginId,
                  )
                : hasAccounts
                  ? [
                      button(
                        t('addAccountOAuth'),
                        () => startLogin('oauth'),
                        !!status?.registrationError,
                        { key: 'oauth' },
                      ),
                      button(
                        t('addAccountKeychain'),
                        () => startLogin('keychain'),
                        !!status?.registrationError,
                        { key: 'keychain' },
                      ),
                    ]
                  : button(
                      t('login'),
                      () => startLogin(),
                      !!status?.registrationError,
                    ),
          ),
        !busy && status?.capabilities?.accessMethods.length > 1
          ? h(
              'select',
              {
                'data-waycraft-access-method': true,
                'aria-label': t('accessMethod'),
                value: accessMethod ?? status.capabilities.defaultAccessMethod,
                onChange: (event: any) => setAccessMethod(event.target.value),
              },
              ...status.capabilities.accessMethods.map((method: any) =>
                h(
                  'option',
                  { key: method.id, value: method.id },
                  t(
                    method.id === 'official-cli'
                      ? 'officialCli'
                      : 'directSignIn',
                  ),
                ),
              ),
            )
          : null,
        login?.loginId
          ? h(
              'section',
              {
                'data-waycraft-cli-terminal': true,
                'aria-label': t('officialCli'),
                dir: 'ltr',
              },
              h(
                'p',
                { style: styles.statusLine },
                h('bdi', null, login.path),
                ' ',
                h('bdi', null, login.version),
              ),
              login.state === 'failed'
                ? h(
                    'p',
                    { role: 'alert', style: styles.errorLine },
                    t('cliLoginFailed'),
                  )
                : null,
              h(
                'pre',
                {
                  role: 'log',
                  style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
                },
                login.output ?? '',
              ),
              h('input', {
                'data-waycraft-cli-input': true,
                'aria-label': t('cliTerminalInput'),
                value: terminalInput,
                maxLength: 4095,
                autoComplete: 'off',
                onChange: (event: any) => setTerminalInput(event.target.value),
                onKeyDown: (event: any) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  void action(async () => {
                    await call('cliInput', {
                      loginId: login.loginId,
                      data: terminalInput + '\r',
                    });
                    setTerminalInput('');
                  });
                },
              }),
              button(t('cancelLogin'), () => {
                void action(async () => {
                  await call('cliCancel', { loginId: login.loginId });
                  setLogin(null);
                  setTerminalInput('');
                });
              }),
            )
          : null,
        cliInstallation
          ? h(
              'div',
              { role: 'status', style: styles.statusLine },
              t('claudeCliMissing'),
              h(
                'pre',
                {
                  dir: 'ltr',
                  style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
                },
                cliInstallation.installCommand,
              ),
              h(
                'a',
                {
                  href: cliInstallation.source,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                },
                t('warningSource'),
              ),
            )
          : null,
        !busy && status?.capabilities
          ? status.capabilities.accessMethods
              .filter(
                (method: any) =>
                  method.id ===
                  (accessMethod ?? status.capabilities.defaultAccessMethod),
              )
              .map((method: any) =>
                warning(method, 'div', 'data-waycraft-access-warning'),
              )
          : null,
        presentation !== 'group' && !busy && hasAccounts && !officialCli
          ? h('p', { style: styles.statusLine }, t('claudeAddAccountHint'))
          : null,
        busy
          ? h(
              'div',
              null,
              (status.pendingAuth ?? login)?.authorizeUrl
                ? h(
                    'a',
                    {
                      href: (status.pendingAuth ?? login).authorizeUrl,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      style: styles.manual,
                    },
                    t('openAuthorization'),
                  )
                : null,
              h(
                'details',
                { style: styles.manual },
                h('summary', null, t('manualSummary')),
                part(
                  'manual-row',
                  styles.manualRow,
                  h(Input, {
                    style: styles.manualInput,
                    value: input,
                    placeholder: t('pasteCallback'),
                    'aria-label': t('pasteCallback'),
                    dir: 'ltr',
                    onChange: (event: any) => setInput(event.target.value),
                  }),
                  button(
                    t('submitCallback'),
                    () => {
                      void action(async () => {
                        await call('manual', { input });
                        setInput('');
                        await refreshStatus();
                      });
                    },
                    !input.trim(),
                  ),
                ),
              ),
            )
          : null,
      ),
      confirmation
        ? h(
            'dialog',
            {
              ref: (node: HTMLDialogElement | null) => {
                if (node && !node.open) node.showModal();
              },
              className: 'waycraft-reset-dialog',
              role: 'dialog',
              'aria-modal': true,
              'aria-label': t('confirmLogout'),
              onCancel: () => setConfirmation(null),
              onClose: () => setConfirmation(null),
              style: {
                ...styles.modal,
                margin: 'auto',
                color: 'var(--dsw-alias-label-primary)',
              },
            },
            h(
              'h3',
              { style: { ...styles.modalTitle, margin: 0 } },
              t('confirmLogout'),
            ),
            h(
              'p',
              { style: { ...styles.statusLine, overflowWrap: 'anywhere' } },
              h(
                'bdi',
                { dir: 'ltr' },
                confirmation.label ?? confirmation.account,
              ),
            ),
            h(
              'div',
              {
                className: 'waycraft-subscription-dialog-actions',
                style: {
                  ...styles.actions,
                  justifyContent: 'flex-end',
                  marginBlockStart: 8,
                },
              },
              button(t('cancel'), () => setConfirmation(null), false, {
                autoFocus: true,
              }),
              button(t('logout'), () => {
                void action(async () => {
                  await call('logout', { account: confirmation.account });
                  setConfirmation(null);
                  await refreshStatus();
                });
              }),
            ),
          )
        : null,
    );
  };
}
