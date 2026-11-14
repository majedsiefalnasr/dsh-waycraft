// Independently implemented presence lifecycle; reference recipe and slot conventions only.
import { legacyToolviewKey } from './legacy-names.js';
import { applySkills } from './skills-browser.js';
import { applyMcp } from './mcp-browser.js';

export { applySkills, applyMcp };

import {
  ImageGenerateToolview,
  createImageLoader,
} from './ImageGenerateToolview.js';
import {
  VideoGenerateToolview,
  createVideoLoader,
} from './VideoGenerateToolview.js';
import en from '../locale/en.json';
import ar from '../locale/ar.json';
import { createCodexCard, controlCss } from './codex-card.js';
import { ProxySettings } from './settings/ProxySettings.js';
import { createApiProviders } from './api-providers.js';
import { createCopilotCard } from './copilot-card.js';
import { createClaudeCard } from './claude-card.js';
import { createExtraUsageNotice } from './extra-usage-notice.js';
import { createCliGovernanceNotice } from './cli-governance-notice.js';
import { createAntigravityCard } from './antigravity-card.js';
import { createZenCard } from './zen-card.js';
import { createGrokCard } from './grok-card.js';
import {
  SpeedSelect,
  createSpeedLoader,
  createSpeedSetter,
} from './speed/SpeedSelect.js';
import { fastCommandDescription } from './speed/fast-command.js';
import {
  SubscriptionUsageBadge,
  createCurrentModelReader,
} from './usage-badge/SubscriptionUsageBadge.js';
import { UsageBadgeDisplaySetting } from './usage-badge/UsageBadgeDisplaySetting.js';
import { guarded } from './usage-badge/error-boundary.js';
import type { ModelDirectoriesLike } from './usage-badge/usage-types.js';

type Dispose = () => void;
interface Context {
  inject(names: string[], callback: (ctx: any) => void): void;
  effect(callback: () => Dispose, label: string): unknown;
}
export function applySubscriptions(root: Context): void {
  const report = (error: unknown) =>
    console.error('dsh-waycraft: Subscriptions setup failed', error);
  function isolate<T>(callback: () => T): T | undefined {
    try {
      const result = callback();
      if (result && typeof (result as any).then === 'function')
        return Promise.resolve(result).catch(report) as T;
      return result;
    } catch (error) {
      report(error);
    }
  }
  isolate(() =>
    root.inject(['connection', 'slots', 'locale'], (ctx) =>
      isolate(() => {
        const connection = ctx.get('connection');
        const React = require('react');
        const h = React.createElement;
        const primitives = require('@deepseek-ai/dsh-client-ui-primitives');
        const NS = 'waycraft.subscriptions';
        isolate(() =>
          ctx.effect(
            () =>
              isolate(() =>
                ctx.locale.register(NS, {
                  en: en.subscriptions,
                  ar: ar.subscriptions,
                }),
              ),
            'dsh-waycraft: subscriptions dictionaries',
          ),
        );
        const t = ctx.locale.bind(NS);
        const CodexCard = createCodexCard(React, primitives, connection.rpc, t);
        // A Claude card failure must not remove the Codex card or the rest of the section.
        const CopilotCard = guarded(
          React,
          createCopilotCard(React, primitives, connection.rpc, t),
          'Copilot card',
        );
        const ClaudeCard = guarded(
          React,
          createClaudeCard(React, primitives, connection.rpc, t),
          'Claude card',
        );
        const AntigravityCard = guarded(
          React,
          createAntigravityCard(React, primitives, connection.rpc, t),
          'Antigravity card',
        );
        const ZenCard = guarded(
          React,
          createZenCard(React, primitives, connection.rpc, t),
          'Zen card',
        );
        const GrokCard = guarded(
          React,
          createGrokCard(React, primitives, connection.rpc, t),
          'Grok card',
        );
        const GuardedSetting = guarded(
          React,
          UsageBadgeDisplaySetting as any,
          'usage display setting',
        );
        const GuardedProxy = guarded(
          React,
          ProxySettings as any,
          'proxy setting',
        );
        const GuardedSpeed = guarded(
          React,
          SpeedSelect as any,
          'Speed control',
        );
        const GuardedBadge = guarded(
          React,
          SubscriptionUsageBadge as any,
          'usage badge',
        );
        const ExtraUsageNotice = guarded(
          React,
          createExtraUsageNotice(React, primitives, ClaudeCard),
          'extra-usage notice',
        );
        const CliGovernanceNotice = guarded(
          React,
          createCliGovernanceNotice(React, primitives),
          'CLI governance notice',
        );
        const listeners = new Set<() => void>();
        let ApiProviders: any;
        const SubscriptionProviders = createApiProviders(
          React,
          null,
          t,
          primitives,
        );
        isolate(() =>
          ctx.inject(
            ['remote', 'remote.settings', 'remote.credentials', 'remote.llm'],
            (scope: any) => {
              ApiProviders = guarded(
                React,
                createApiProviders(React, scope.remote, t, primitives),
                'API providers',
              );
              listeners.forEach((listener) => listener());
              return () => {
                ApiProviders = undefined;
                listeners.forEach((listener) => listener());
              };
            },
          ),
        );
        const providerCards: Record<string, any> = {
          codex: CodexCard,
          claude: ClaudeCard,
          grok: GrokCard,
          antigravity: AntigravityCard,
          copilot: CopilotCard,
        };
        function UnifiedProviders() {
          const [status, setStatus] = React.useState(null as any);
          const [revision, setRevision] = React.useState(0);
          const [error, setError] = React.useState(false);
          const alive = React.useRef(true);
          const refresh = async () => {
            try {
              const answer = await connection.rpc.call(
                '/api',
                'waycraft-subscriptions.status',
                {},
              );
              if (!answer?.ok) throw new Error();
              if (alive.current) {
                setStatus(answer.value);
                setRevision((value: number) => value + 1);
                setError(false);
              }
            } catch {
              if (alive.current) setError(true);
            }
          };
          React.useEffect(() => {
            alive.current = true;
            void refresh();
            return () => {
              alive.current = false;
            };
          }, []);
          const providers = Object.keys(providerCards).map((id) => ({
            id,
            name: (
              {
                codex: 'Codex (ChatGPT)',
                claude: 'Claude',
                grok: 'Grok',
                antigravity: 'Antigravity',
                copilot: 'GitHub Copilot',
              } as any
            )[id],
          }));
          const rows = providers
            .filter(({ id }) => status?.providers?.[id]?.accounts?.length)
            .map(({ id }, index) =>
              h(
                'li',
                { key: id, 'data-waycraft-subscription-row': id },
                h(providerCards[id], {
                  presentation: 'group',
                  initialExpanded: index === 0,
                  revision,
                  onAccountsChange: refresh,
                }),
              ),
            );
          return h(
            React.Fragment,
            null,
            error ? h('p', { role: 'alert' }, t('unreachable')) : null,
            h(SubscriptionProviders, {
              showAPI: false,
              showSubscriptionAdd: true,
              subscriptions: {
                rows,
                providers,
                renderAuth: (id: string, done: () => void, onFlowState: any) =>
                  id
                    ? h(providerCards[id], {
                        key: id,
                        presentation: 'auth',
                        onFlowState,
                        onComplete: () => {
                          done();
                          void refresh();
                        },
                      })
                    : null,
              },
            }),
            h(
              'section',
              {
                'data-waycraft-provider-group': 'free',
                className: 'waycraft-provider-group',
                style: { marginBlockStart: 24 },
                'aria-label': t('freeProviders'),
              },
              h(
                'h3',
                { className: 'waycraft-provider-title' },
                t('freeProviders'),
              ),
              h(
                'ul',
                { className: 'waycraft-api-rows' },
                h('li', null, h(ZenCard)),
              ),
            ),
          );
        }
        /**
         * The 3 s heartbeat is the only timer. A probe that last got "not there" (or an unusable answer) sits out
         * heartbeats instead of owning a timer, so nothing extra needs clearing on dispose and a browser that prints
         * every 404 stops printing one every 3 s: the first re-check comes after 30 s, then once a minute.
         */
        const HEARTBEATS_PER_MINUTE = 20;
        const FIRST_RECHECK_HEARTBEATS = 10;
        const pacer = () => {
          let skip = 0;
          let misses = 0;
          return {
            /** Whether this heartbeat should run the probe. */
            due: () => {
              if (skip === 0) return true;
              skip--;
              return false;
            },
            /** The probe got "not there" or an answer it cannot use. */
            missed: () => {
              const wait =
                misses === 0 ? FIRST_RECHECK_HEARTBEATS : HEARTBEATS_PER_MINUTE;
              skip = wait - 1;
              misses++;
            },
            /** The probe got a running answer; ask again in a minute. */
            settled: () => {
              misses = 0;
              skip = HEARTBEATS_PER_MINUTE - 1;
            },
            /** Ask on the very next heartbeat and start the back-off over (a reconnect does this). */
            reset: () => {
              misses = 0;
              skip = 0;
            },
          };
        };
        /** The public RPC transport exposes the HTTP status in this exact error string. */
        const isHttp404 = (error: unknown, route: string) =>
          error instanceof Error &&
          error.message === `transport failure for /api/${route}: HTTP 404`;
        const statusPace = pacer();
        const referencePace = pacer();
        let present = false;
        let failing = false;
        let referenceEnabled = false;
        let disposed = false;
        let sequence = 0;
        let referenceSequence = 0;
        let withdraw: Dispose | undefined;
        function Section() {
          React.useSyncExternalStore(
            (fn: () => void) => {
              listeners.add(fn);
              return () => listeners.delete(fn);
            },
            () => `${failing}:${referenceEnabled}:${!!ApiProviders}`,
          );
          return h(
            'div',
            {
              className: 'waycraft-subscriptions-page',
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                maxInlineSize: 720,
                minInlineSize: 0,
                textAlign: 'start',
                color: 'var(--dsw-alias-label-primary)',
                fontSize: 14,
                lineHeight: '22px',
              },
            },
            h(
              'style',
              null,
              controlCss +
                `
          .waycraft-subscriptions-page .waycraft-page-settings>h3{margin:0;font-size:16px;line-height:24px;font-weight:500}
          .waycraft-subscriptions-page .waycraft-page-settings-content{display:flex;flex-direction:column;gap:12px;padding-block-start:12px}
          .waycraft-subscriptions-page .waycraft-proxy-settings{padding:14px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
          .waycraft-subscriptions-page .waycraft-proxy-settings header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
          .waycraft-subscriptions-page .waycraft-proxy-settings p{margin:8px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
        `,
            ),
            h(
              'header',
              {
                className: 'waycraft-providers-identity',
                style: { display: 'flex', alignItems: 'center', gap: 8 },
              },
              h(
                'svg',
                {
                  width: 20,
                  height: 20,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 1.5,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                  'aria-hidden': true,
                  style: { flexShrink: 0 },
                },
                h('rect', { x: 8, y: 8, width: 8, height: 8, rx: 2 }),
                h('path', {
                  d: 'M12 3v5m0 8v5M3 12h5m8 0h5M5 5l3 3m8 8 3 3M19 5l-3 3M8 16l-3 3',
                }),
              ),
              h(
                'h2',
                {
                  style: {
                    margin: 0,
                    fontSize: 18,
                    lineHeight: '26px',
                    fontWeight: 500,
                    overflowWrap: 'anywhere',
                  },
                },
                t('title'),
              ),
            ),
            referenceEnabled
              ? h('p', { role: 'status' }, t('coexistence'))
              : null,
            failing ? h('p', { role: 'alert' }, t('unreachable')) : null,
            h(
              'section',
              {
                'data-waycraft-settings': true,
                className: 'waycraft-page-settings',
              },
              h('h3', null, t('pageSettings')),
              h(
                'div',
                { className: 'waycraft-page-settings-content' },
                h(GuardedProxy, { rpc: connection.rpc, t }),
                h(GuardedSetting, { t }),
              ),
            ),
            h(
              'section',
              {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  minInlineSize: 0,
                },
              },
              h(
                'p',
                {
                  style: {
                    margin: 0,
                    color: 'var(--dsw-alias-label-secondary)',
                    fontSize: 13,
                    lineHeight: '20px',
                  },
                },
                t('providersHint'),
              ),
              h(UnifiedProviders),
            ),
          );
        }
        // Composer surfaces: the usage badge, the Speed control and /fast exist only while the component
        // answers and the reference plugin is not serving the same provider ids. Each registration is isolated so a
        // failure in one surface cannot affect core dsh-waycraft, the Settings section or the other surfaces.
        const models = (): ModelDirectoriesLike | undefined =>
          ctx.get('modelDirectories') as ModelDirectoriesLike | undefined;
        const surfaceWanted = () => !disposed && present && !referenceEnabled;
        const surfaces: Dispose[] = [];
        let surfacesActive = false;
        function syncSurfaces() {
          if (surfaceWanted() && !surfacesActive) {
            surfacesActive = true;
            const add = (register: () => unknown) =>
              isolate(() => {
                const off = register();
                if (typeof off === 'function') surfaces.push(off as Dispose);
              });
            for (const [name, view, inject] of [
              [
                'image_generate',
                ImageGenerateToolview,
                () => ({ load: createImageLoader(connection.rpc) }),
              ],
              [
                'video_generate',
                VideoGenerateToolview,
                () => ({ loadVideo: createVideoLoader(connection.rpc) }),
              ],
            ] as const)
              for (const key of [
                name,
                `dsh_waycraft_${name}`,
                legacyToolviewKey(name),
              ]) {
                add(() =>
                  ctx.slots.inject('tool.call.toolview', () =>
                    ctx.slots.register(
                      {
                        name: 'tool.call.toolview',
                        id: `waycraft-toolview-${key}`,
                        key,
                        locale: NS,
                        inject,
                      },
                      guarded(React, view as any, name),
                    ),
                  ),
                );
              }
            add(() =>
              ctx.slots.inject('conversation.input.right', () =>
                ctx.slots.register(
                  {
                    name: 'conversation.input.right',
                    id: 'waycraft-subscription-speed',
                    order: 0,
                    locale: NS,
                    inject: (sessionId: string) => ({
                      loadSpeed: createSpeedLoader(
                        connection,
                        models,
                        sessionId,
                      ),
                      setSpeed: createSpeedSetter(connection, sessionId),
                    }),
                  },
                  GuardedSpeed,
                ),
              ),
            );
            add(() =>
              ctx.slots.inject('conversation.composer.dock', () =>
                ctx.slots.register(
                  {
                    name: 'conversation.composer.dock',
                    id: 'waycraft-subscription-usage',
                    order: 10,
                    locale: NS,
                    inject: (sessionId: string) => ({
                      rpc: connection.rpc,
                      currentModel: createCurrentModelReader(models, sessionId),
                    }),
                  },
                  GuardedBadge,
                ),
              ),
            );
            add(() =>
              ctx.slots.inject('conversation.composer.dock', () =>
                ctx.slots.register(
                  {
                    name: 'conversation.composer.dock',
                    id: 'waycraft-extra-usage-notice',
                    order: 5,
                    locale: NS,
                    inject: (sessionId: string) => ({
                      rpc: connection.rpc,
                      sessionId,
                    }),
                  },
                  ExtraUsageNotice,
                ),
              ),
            );
            add(() =>
              ctx.slots.inject('conversation.composer.dock', () =>
                ctx.slots.register(
                  {
                    name: 'conversation.composer.dock',
                    id: 'waycraft-cli-governance-notice',
                    order: 6,
                    locale: NS,
                    inject: (sessionId: string) => ({
                      rpc: connection.rpc,
                      sessionId,
                    }),
                  },
                  CliGovernanceNotice,
                ),
              ),
            );
          } else if (!surfaceWanted() && surfacesActive) {
            surfacesActive = false;
            for (const off of surfaces.splice(0)) isolate(off);
          }
        }
        // /fast: registered once per command service. `available` and `options` re-check presence on every use, so
        // the command disappears from the list and cannot act while the component is off or the reference serves.
        isolate(() =>
          ctx.inject(['commandUi'], (scope: any) =>
            isolate(() => {
              const command = scope.get('commandUi');
              scope.effect(
                () =>
                  command.register({
                    name: 'fast',
                    description: fastCommandDescription(() => t('commandFast')),
                    available: () => surfaceWanted(),
                    ui: {
                      kind: 'popupSelect',
                      options: async (session: { sessionId: string }) => {
                        if (!surfaceWanted())
                          throw new Error(t('commandFastUnavailable'));
                        const state = await createSpeedLoader(
                          connection,
                          models,
                          session.sessionId,
                        )();
                        if (!state.visible)
                          throw new Error(t('commandFastUnavailable'));
                        return (
                          [
                            {
                              id: 'standard',
                              label: t('speedStandard'),
                              detail: t('speedStandardDescription'),
                            },
                            {
                              id: 'fast',
                              label: t('speedFast'),
                              detail: t('speedFastDescription'),
                            },
                          ] as const
                        ).map((option) => ({
                          ...option,
                          active: option.id === state.tier,
                        }));
                      },
                      onSelect: async (
                        option: { id: string },
                        session: { sessionId: string },
                      ) => {
                        if (!surfaceWanted()) return;
                        await createSpeedSetter(
                          connection,
                          session.sessionId,
                        )(option.id as 'standard' | 'fast');
                      },
                    },
                  }),
                'dsh-waycraft: /fast contribution',
              );
            }),
          ),
        );
        function update() {
          isolate(syncSurfaces);
          if (present && !withdraw) {
            withdraw = ctx.slots.inject('settings.section', () =>
              ctx.slots.register(
                {
                  name: 'settings.section',
                  id: 'waycraft-subscriptions',
                  order: 90,
                  label: () => t('title'),
                },
                Section,
              ),
            );
          } else if (!present && withdraw) {
            withdraw();
            withdraw = undefined;
          }
          listeners.forEach((listener) => listener());
        }
        async function probe() {
          const current = ++sequence;
          try {
            const result = await connection.rpc.call(
              '/api',
              'waycraft-subscriptions.status',
              {},
            );
            if (disposed || current !== sequence) return;
            present = true;
            failing = !(
              result?.ok && result.value?.component === 'subscriptions'
            );
            statusPace.reset();
          } catch (error) {
            if (disposed || current !== sequence) return;
            if (isHttp404(error, 'waycraft-subscriptions.status')) {
              present = false;
              failing = false;
              statusPace.missed();
            } else {
              present = true;
              failing = true;
              statusPace.reset();
            }
          }
          isolate(update);
        }
        // Whether the reference plugin serves the same provider ids. Only a clear answer changes what is known: a
        // running reference answers ok, a missing route is a 404, and anything else (network, 5xx, timeout, an
        // unusable body) leaves the last known value alone, so a failed probe cannot flip the section on and off.
        async function probeReference() {
          const current = ++referenceSequence;
          let answer: boolean | undefined;
          try {
            // Read-only sanitized local configuration; never retain or render its value.
            const result = await connection.rpc.call(
              '/api',
              'subscriptions-auth.proxyGet',
              {},
            );
            if (result?.ok === true) answer = true;
          } catch (error) {
            if (isHttp404(error, 'subscriptions-auth.proxyGet')) answer = false;
          }
          if (disposed || current !== referenceSequence) return;
          if (answer === true) referencePace.settled();
          else referencePace.missed();
          if (answer === undefined || answer === referenceEnabled) return;
          referenceEnabled = answer;
          isolate(update);
        }
        isolate(() =>
          ctx.effect(
            () =>
              isolate(() => {
                void probe();
                void probeReference();
                const unsubscribe = connection.state.subscribe(() => {
                  if (connection.state.getSnapshot() === 'connected') {
                    statusPace.reset();
                    referencePace.reset();
                    void probe();
                    void probeReference();
                  }
                });
                // Row switches do not reconnect the shared connection; periodically reconcile presence. Each probe
                // paces itself on this one heartbeat (see `pacer`).
                const timer = setInterval(() => {
                  if (statusPace.due()) void probe();
                  if (referencePace.due()) void probeReference();
                }, 3000);
                return () => {
                  disposed = true;
                  sequence++;
                  referenceSequence++;
                  clearInterval(timer);
                  unsubscribe();
                  isolate(syncSurfaces);
                  withdraw?.();
                  listeners.clear();
                };
              }),
            'dsh-waycraft: subscriptions presence',
          ),
        );
      }),
    ),
  );
}
