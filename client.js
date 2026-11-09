/*
 * dsh-waycraft — Waycraft's DeepSeek Harness toolkit (client half).
 *
 * Nothing in DSH itself is modified: every feature below is added by this plugin
 * through public client extension points (slots + injected <style>/observers)
 * and is fully removed again when the plugin is disabled.
 *
 * Features
 *  1. Settings > General > "Bidirectional text"  (toggle)
 *       - per-paragraph direction for Arabic / Persian / Hebrew in chat,
 *         reasoning, tool cells, question boxes, user bubbles
 *         (replaces dsh-persian-rtl; CSS/logic adapted from it, MIT)
 *       - mirroring of @changfenhuang/dsh-genui components
 *  2. Settings > General > "App UI font size"   (px stepper, right after the chat font size)
 *  3. Settings > General > "App font"           (dropdown: DSH default / System font)
 *  4. Settings > General > "System notifications" (+ on completion / when action needed)
 *     Native desktop notifications driven by DSH's session status; click opens the session.
 *  7. Composer bar > "Approvals" dropdown: Ask me / Auto (safe) / Auto (aggressive), per session.
 *  6. Settings > General > "Copy on select" (toggle, off by default)
 *  5. Account menu grouping: sidebar footer buttons (Remote access, ...) move into the account menu.
 */
window.__ModuleLoader__.load({
  id: 'dsh-waycraft',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    let primitives = {};
    try {
      primitives = require('@deepseek-ai/dsh-client-ui-primitives') || {};
    } catch (_) {}

    // ───────────────────────── own settings store (localStorage) ─────────────
    const STORE_KEY = 'dsh-waycraft:settings:v1';
    // Deprecated (one release): read when the new key is absent; never written, never deleted.
    const LEGACY_STORE_KEY = 'dsh-majed:settings:v1';
    const LEGACY_GLOBAL = '__dshMajed';
    // App UI font size is a px number like the chat font size (DSH chrome is designed at 14px).
    const UI_BASE_PX = 14,
      UI_MIN_PX = 11,
      UI_MAX_PX = 20;
    const DEFAULTS = {
      bidi: true,
      uiFontSize: UI_BASE_PX,
      fontSource: 'dsh',
      notifyMode: 'background',
      notifyDone: true,
      notifyAction: true,
      accountMenu: true,
      autoCopy: false,
      autoApprove: {},
    };
    const NOTIFY_MODES = ['off', 'background', 'always'];
    // Bundled UI fonts (OFL-1.1, served by this plugin's host half from fonts/*.woff2).
    const FONT_ROUTE = '/plugins/dsh-waycraft/fonts/';
    const BUNDLED_FONTS = {
      inter: { label: 'Inter', family: 'Inter Waycraft' },
      roboto: { label: 'Roboto', family: 'Roboto Waycraft' },
      'open-sans': { label: 'Open Sans', family: 'Open Sans Waycraft' },
      'noto-sans': { label: 'Noto Sans', family: 'Noto Sans Waycraft' },
      'ibm-plex-sans': {
        label: 'IBM Plex Sans',
        family: 'IBM Plex Sans Waycraft',
      },
    };
    const FONT_FACES = [
      {
        f: 'Inter Waycraft',
        u: 'inter-latin-wght-normal.woff2',
        w: '100 900',
        r: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
        k: 'inter',
      },
      {
        f: 'Inter Waycraft',
        u: 'inter-latin-ext-wght-normal.woff2',
        w: '100 900',
        r: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
        k: 'inter',
      },
      {
        f: 'Roboto Waycraft',
        u: 'roboto-latin-wght-normal.woff2',
        w: '100 900',
        r: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
        k: 'roboto',
      },
      {
        f: 'Roboto Waycraft',
        u: 'roboto-latin-ext-wght-normal.woff2',
        w: '100 900',
        r: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
        k: 'roboto',
      },
      {
        f: 'Open Sans Waycraft',
        u: 'open-sans-latin-wght-normal.woff2',
        w: '100 900',
        r: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
        k: 'open-sans',
      },
      {
        f: 'Open Sans Waycraft',
        u: 'open-sans-latin-ext-wght-normal.woff2',
        w: '100 900',
        r: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
        k: 'open-sans',
      },
      {
        f: 'Open Sans Waycraft',
        u: 'open-sans-hebrew-wght-normal.woff2',
        w: '100 900',
        r: 'U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F',
        k: 'open-sans',
      },
      {
        f: 'Noto Sans Waycraft',
        u: 'noto-sans-latin-wght-normal.woff2',
        w: '100 900',
        r: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
        k: 'noto-sans',
      },
      {
        f: 'Noto Sans Waycraft',
        u: 'noto-sans-latin-ext-wght-normal.woff2',
        w: '100 900',
        r: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
        k: 'noto-sans',
      },
      {
        f: 'Noto Sans Waycraft',
        u: 'noto-sans-arabic-arabic-wght-normal.woff2',
        w: '100 900',
        r: 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1',
        k: 'noto-sans-arabic',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-latin-400-normal.woff2',
        w: '400',
        r: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
        k: 'ibm-plex-sans',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-latin-ext-400-normal.woff2',
        w: '400',
        r: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
        k: 'ibm-plex-sans',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-latin-500-normal.woff2',
        w: '500',
        r: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
        k: 'ibm-plex-sans',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-latin-ext-500-normal.woff2',
        w: '500',
        r: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
        k: 'ibm-plex-sans',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-latin-600-normal.woff2',
        w: '600',
        r: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
        k: 'ibm-plex-sans',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-latin-ext-600-normal.woff2',
        w: '600',
        r: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
        k: 'ibm-plex-sans',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-latin-700-normal.woff2',
        w: '700',
        r: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
        k: 'ibm-plex-sans',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-latin-ext-700-normal.woff2',
        w: '700',
        r: 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
        k: 'ibm-plex-sans',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-arabic-arabic-400-normal.woff2',
        w: '400',
        r: 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1',
        k: 'ibm-plex-sans-arabic',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-arabic-arabic-500-normal.woff2',
        w: '500',
        r: 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1',
        k: 'ibm-plex-sans-arabic',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-arabic-arabic-600-normal.woff2',
        w: '600',
        r: 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1',
        k: 'ibm-plex-sans-arabic',
      },
      {
        f: 'IBM Plex Sans Waycraft',
        u: 'ibm-plex-sans-arabic-arabic-700-normal.woff2',
        w: '700',
        r: 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1',
        k: 'ibm-plex-sans-arabic',
      },
    ];
    const FONT_SOURCES = ['dsh', 'system', ...Object.keys(BUNDLED_FONTS)];
    const listeners = new Set();
    let state = (() => {
      try {
        return {
          ...DEFAULTS,
          ...JSON.parse(
            localStorage.getItem(STORE_KEY) ||
              localStorage.getItem(LEGACY_STORE_KEY) ||
              '{}',
          ),
        };
      } catch (_) {
        return { ...DEFAULTS };
      }
    })();
    const clampPx = (v) =>
      Math.min(
        UI_MAX_PX,
        Math.max(UI_MIN_PX, Math.round(Number(v)) || UI_BASE_PX),
      );
    state.uiFontSize = clampPx(state.uiFontSize);
    if (!FONT_SOURCES.includes(state.fontSource)) state.fontSource = 'dsh';
    if (!NOTIFY_MODES.includes(state.notifyMode))
      state.notifyMode = 'background';
    // Per-session auto-approve modes. 'aggressive' lives in memory only: it resets to 'ask' on restart.
    const AP_MODES = ['ask', 'safe', 'aggressive'];
    state.autoApprove = Object.fromEntries(
      Object.entries(
        state.autoApprove && typeof state.autoApprove === 'object'
          ? state.autoApprove
          : {},
      ).filter(([, v]) => v === 'safe'),
    );
    const store = {
      get: () => state,
      subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      set(patch) {
        state = { ...state, ...patch };
        try {
          localStorage.setItem(
            STORE_KEY,
            JSON.stringify({
              ...state,
              autoApprove: Object.fromEntries(
                Object.entries(state.autoApprove || {}).filter(
                  ([, v]) => v === 'safe',
                ),
              ),
            }),
          );
        } catch (_) {}
        listeners.forEach((fn) => fn(state));
      },
    };
    const useSetting = (key) =>
      React.useSyncExternalStore(store.subscribe, () => store.get()[key]);

    // ───────────────────────── dictionaries ─────────────────────────
    const NS = 'waycraft';
    const en = {
      'bidi.title': 'Bidirectional text',
      'bidi.description':
        'Detects Arabic, Persian and Hebrew per paragraph and lays it out right-to-left (chat, reasoning, tools, GenUI components).',
      'size.title': 'App UI font size',
      'size.description':
        'Font size of the app interface (sidebar, headers, composer, panels). The chat font size above is unchanged.',
      'size.increase': 'Increase app UI font size',
      'size.decrease': 'Decrease app UI font size',
      'size.unit': 'px',
      'font.title': 'App font',
      'font.description':
        'Choose the typeface used by the app interface and chat text.',
      'font.dsh': 'DSH default',
      'font.system': 'System font',
      'font.inter': 'Inter',
      'font.roboto': 'Roboto',
      'font.open-sans': 'Open Sans',
      'font.noto-sans': 'Noto Sans',
      'font.ibm-plex-sans': 'IBM Plex Sans',
      'notify.title': 'System notifications',
      'notify.description':
        'Send a desktop notification when a session finishes or needs your attention.',
      'notify.off': 'Off',
      'notify.background': 'Only when app is in background',
      'notify.always': 'Always (silent while app is focused)',
      'notify.test': 'Send test',
      'notify.testBody': 'Notifications are working.',
      'notify.status.granted': 'Allowed on this device.',
      'notify.status.default':
        'Not allowed yet — tap “Send test” to allow notifications.',
      'notify.status.denied':
        'Blocked — allow notifications for this site in the browser settings.',
      'notify.status.insecure':
        'Unavailable: this page is not served over HTTPS. Use the tunnel (https) link. In-app alerts still appear.',
      'notify.status.unsupported':
        'Unsupported here. On iPhone, add the app to the Home Screen first. In-app alerts still appear.',
      'notify.done.title': 'Notify on completion',
      'notify.done.description': 'When a session finishes its work.',
      'notify.action.title': 'Notify when action is needed',
      'notify.action.description':
        'When a session waits for an approval, a question, or a plan review.',
      'notify.msg.done': 'Finished — ready for review',
      'notify.msg.approval': 'Approval needed: {tool}',
      'notify.msg.approvalPlain': 'Approval needed',
      'notify.msg.question': 'Waiting for your answer',
      'notify.msg.plan': 'Plan ready for your review',
      'notify.session': 'Session',
      'account.title': 'Group sidebar actions in account menu',
      'account.description':
        'Moves extra sidebar buttons (such as Remote access) into the account menu instead of showing them beside it.',
      'copy.title': 'Copy on select',
      'copy.description':
        'Automatically copy any text you select in the app to the clipboard. Text inside input fields is not copied.',
      'copy.toast': 'Copied to clipboard',
      'ap.label': 'Approvals',
      'ap.ask': 'Ask me',
      'ap.safe': 'Auto (safe)',
      'ap.aggressive': 'Auto (aggressive)',
      'ap.aria': 'Automatic approval for this session',
      'ap.confirm':
        'Aggressive mode approves almost every request automatically in this session — including full-access escalations, network access and unknown tools. Destructive commands (rm -rf, sudo, force-push, secrets…) still ask you. It resets when the app restarts. Enable it?',
      'ap.toast': 'Auto-approved: {tool}',
      'ap.paused':
        'Auto-approval paused after repeated requests that need your decision.',
    };
    const zh = {
      'bidi.title': '双向文本（RTL）',
      'bidi.description':
        '按段落识别阿拉伯语、波斯语、希伯来语并从右到左排版（对话、思考、工具、GenUI 组件）。',
      'size.title': '应用界面字号',
      'size.description':
        '应用界面（侧边栏、标题栏、输入框、面板）的字号，不影响上方的对话字号。',
      'size.increase': '增大应用界面字号',
      'size.decrease': '减小应用界面字号',
      'size.unit': 'px',
      'font.title': '应用字体',
      'font.description': '选择应用界面与对话文字使用的字体。',
      'font.dsh': 'DSH 默认',
      'font.system': '系统字体',
      'font.inter': 'Inter',
      'font.roboto': 'Roboto',
      'font.open-sans': 'Open Sans',
      'font.noto-sans': 'Noto Sans',
      'font.ibm-plex-sans': 'IBM Plex Sans',
      'notify.title': '系统通知',
      'notify.description': '会话完成或需要你处理时发送桌面通知。',
      'notify.off': '关闭',
      'notify.background': '仅应用在后台时',
      'notify.always': '始终（应用在前台时静音）',
      'notify.test': '发送测试',
      'notify.testBody': '通知正常工作。',
      'notify.status.granted': '已在此设备上允许。',
      'notify.status.default': '尚未允许：点击“发送测试”以允许通知。',
      'notify.status.denied': '已被阻止：请在浏览器设置中允许此网站发送通知。',
      'notify.status.insecure':
        '不可用：当前页面不是 HTTPS。请使用隧道（https）链接；应用内提醒仍会显示。',
      'notify.status.unsupported':
        '此处不支持。iPhone 请先将应用添加到主屏幕；应用内提醒仍会显示。',
      'notify.done.title': '完成时通知',
      'notify.done.description': '会话完成工作时。',
      'notify.action.title': '需要操作时通知',
      'notify.action.description': '会话等待审批、提问或计划审阅时。',
      'notify.msg.done': '已完成，等待查看',
      'notify.msg.approval': '需要审批：{tool}',
      'notify.msg.approvalPlain': '需要审批',
      'notify.msg.question': '等待你的回答',
      'notify.msg.plan': '计划待审阅',
      'notify.session': '会话',
      'account.title': '将侧边栏操作收进账户菜单',
      'account.description':
        '把额外的侧边栏按钮（如远程访问）移入账户菜单，而不是显示在旁边。',
      'copy.title': '选中即复制',
      'copy.description':
        '在应用中选中的文字会自动复制到剪贴板。输入框内的文字不会被复制。',
      'copy.toast': '已复制到剪贴板',
      'ap.label': '审批',
      'ap.ask': '手动确认',
      'ap.safe': '自动（安全）',
      'ap.aggressive': '自动（激进）',
      'ap.aria': '本会话的自动审批',
      'ap.confirm':
        '激进模式会在本会话中自动批准所有请求，包括完全访问提权、网络访问和未知工具；应用重启后会重置。确定开启吗？',
      'ap.toast': '已自动批准：{tool}',
      'ap.paused': '多次出现需要你决定的请求，已暂停自动审批。',
    };

    // ───────────────────────── settings rows ─────────────────────────
    const ROW_CSS = `
.waycraft-row{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.waycraft-text{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.waycraft-title{color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14)}
.waycraft-desc{color:var(--dsw-alias-label-tertiary);font:var(--dsw-font-xxs-12)}
.waycraft-control{display:inline-flex;align-items:center;gap:8px}
.waycraft-stepper{display:inline-flex;align-items:center;justify-content:center;min-width:72px;height:36px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);position:relative}
.waycraft-value{min-width:30px;text-align:center;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14)}
.waycraft-arrows{position:absolute;right:6px;display:flex;flex-direction:column;gap:2px;opacity:0}
.waycraft-stepper:hover .waycraft-arrows,.waycraft-stepper:focus-within .waycraft-arrows{opacity:1}
.waycraft-arrow{width:17px;height:12px;display:inline-flex;align-items:center;justify-content:center;border:none;padding:0;border-radius:var(--dsw-radius-xs);background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 75%,transparent);color:var(--dsw-alias-label-primary);cursor:pointer;font-size:calc(8px + var(--waycraft-ui-d,0px));line-height:1}
.waycraft-arrow:hover:not(:disabled){background:var(--dsw-alias-bg-layer-1)}
.waycraft-arrow:disabled{color:var(--dsw-alias-label-caption);cursor:default}
.waycraft-unit{color:var(--dsw-alias-label-secondary);font:var(--dsw-font-s-14)}
.waycraft-selector{display:inline-flex;align-items:center;gap:12px;height:36px;padding:0 14px;border:none;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:var(--dsw-font-s-14);cursor:pointer}
.waycraft-selector:hover{background:var(--dsw-alias-interactive-bg-hover)}
.waycraft-chevron{flex:none}
.waycraft-test{height:36px;padding:0 12px;border:none;border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);cursor:pointer}
.waycraft-test:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.waycraft-test:disabled{opacity:.4;cursor:default}
.waycraft-status{display:inline-block;margin-top:2px}
.waycraft-status[data-state=granted]{color:var(--dsw-alias-state-success-primary,#3ecf8e)}
.waycraft-status[data-state=denied],.waycraft-status[data-state=unsupported]{color:var(--dsw-alias-state-error-primary,#ff6b6b)}
.waycraft-ap-trigger{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:200px;height:28px;padding:0 6px 0 8px;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-strong-13);cursor:pointer}
.waycraft-ap-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.waycraft-ap-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.waycraft-ap-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.waycraft-ap-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-label-caption)}
.waycraft-ap-trigger[data-mode=safe] .waycraft-ap-dot{background:var(--dsw-alias-state-success-primary,#3ecf8e)}
.waycraft-ap-trigger[data-mode=aggressive] .waycraft-ap-dot{background:var(--dsw-alias-state-error-primary,#ff6b6b)}
.waycraft-ap-trigger[data-mode=aggressive]{color:var(--dsw-alias-state-error-primary,#ff6b6b)}
[data-waycraft-menu-trigger]{width:0!important;height:0!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;flex:none!important}
`;

    function BidiRow({ t }) {
      const on = useSetting('bidi');
      const Switch = primitives.Switch;
      return h(
        'div',
        { className: 'waycraft-row' },
        h(
          'div',
          { className: 'waycraft-text' },
          h('div', { className: 'waycraft-title' }, t('bidi.title')),
          h('div', { className: 'waycraft-desc' }, t('bidi.description')),
        ),
        Switch
          ? h(Switch, {
              checked: on,
              label: t('bidi.title'),
              onChange: (next) => store.set({ bidi: !!next }),
            })
          : h('input', {
              type: 'checkbox',
              checked: on,
              'aria-label': t('bidi.title'),
              onChange: (e) => store.set({ bidi: e.target.checked }),
            }),
      );
    }

    function UiFontSizeRow({ t }) {
      const size = useSetting('uiFontSize');
      const Up = primitives.IconChevronUpOutlineRegular,
        Down = primitives.IconChevronDownOutlineRegular;
      const set = (v) => store.set({ uiFontSize: clampPx(v) });
      return h(
        'div',
        { className: 'waycraft-row' },
        h(
          'div',
          { className: 'waycraft-text' },
          h('div', { className: 'waycraft-title' }, t('size.title')),
          h('div', { className: 'waycraft-desc' }, t('size.description')),
        ),
        h(
          'div',
          { className: 'waycraft-control' },
          h(
            'div',
            { className: 'waycraft-stepper' },
            h('span', { className: 'waycraft-value' }, size),
            h(
              'span',
              { className: 'waycraft-arrows' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'waycraft-arrow',
                  'aria-label': t('size.increase'),
                  disabled: size >= UI_MAX_PX,
                  onClick: () => set(size + 1),
                },
                Up ? h(Up, { size: 9 }) : '▲',
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'waycraft-arrow',
                  'aria-label': t('size.decrease'),
                  disabled: size <= UI_MIN_PX,
                  onClick: () => set(size - 1),
                },
                Down ? h(Down, { size: 9 }) : '▼',
              ),
            ),
          ),
          h('span', { className: 'waycraft-unit' }, t('size.unit')),
        ),
      );
    }

    /** Same look as the built-in "Open chat links in" row: title/description + dropdown button. */
    function FontSourceRow({ t }) {
      const value = useSetting('fontSource');
      const [open, setOpen] = React.useState(false);
      const ref = React.useRef(null);
      const Menu = primitives.Menu,
        Chevron = primitives.IconChevronDownOutlineRegular;
      const close = () => setOpen(false);
      const selector = h(
        'button',
        {
          ref,
          type: 'button',
          className: 'waycraft-selector',
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          onClick: () => setOpen((v) => !v),
        },
        t('font.' + value),
        Chevron ? h(Chevron, { className: 'waycraft-chevron' }) : '▾',
      );
      return h(
        'div',
        { className: 'waycraft-row' },
        h(
          'div',
          { className: 'waycraft-text' },
          h('div', { className: 'waycraft-title' }, t('font.title')),
          h('div', { className: 'waycraft-desc' }, t('font.description')),
        ),
        Menu
          ? h(Menu, {
              open,
              onClose: close,
              selectedId: value,
              align: 'end',
              portal: true,
              anchor: selector,
              items: FONT_SOURCES.map((id) => ({ id, label: t('font.' + id) })),
              onSelect: (id) => {
                ref.current && ref.current.focus({ preventScroll: true });
                close();
                store.set({ fontSource: id });
              },
            })
          : h(
              'select',
              {
                value,
                onChange: (e) => store.set({ fontSource: e.target.value }),
              },
              FONT_SOURCES.map((id) =>
                h('option', { key: id, value: id }, t('font.' + id)),
              ),
            ),
      );
    }

    // ───────────────────────── generic rows (same look as built-in ones) ─────────────────────────
    function SelectRow({
      title,
      description,
      value,
      options,
      onSelect,
      extra,
    }) {
      const [open, setOpen] = React.useState(false);
      const ref = React.useRef(null);
      const Menu = primitives.Menu,
        Chevron = primitives.IconChevronDownOutlineRegular;
      const close = () => setOpen(false);
      const current = options.find((o) => o.id === value);
      const selector = h(
        'button',
        {
          ref,
          type: 'button',
          className: 'waycraft-selector',
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          onClick: () => setOpen((v) => !v),
        },
        current ? current.label : value,
        Chevron ? h(Chevron, { className: 'waycraft-chevron' }) : '▾',
      );
      return h(
        'div',
        { className: 'waycraft-row' },
        h(
          'div',
          { className: 'waycraft-text' },
          h('div', { className: 'waycraft-title' }, title),
          h('div', { className: 'waycraft-desc' }, description),
        ),
        h(
          'div',
          { className: 'waycraft-control' },
          extra || null,
          Menu
            ? h(Menu, {
                open,
                onClose: close,
                selectedId: value,
                align: 'end',
                portal: true,
                anchor: selector,
                items: options,
                onSelect: (id) => {
                  ref.current && ref.current.focus({ preventScroll: true });
                  close();
                  onSelect(id);
                },
              })
            : h(
                'select',
                { value, onChange: (e) => onSelect(e.target.value) },
                options.map((o) =>
                  h('option', { key: o.id, value: o.id }, o.label),
                ),
              ),
        ),
      );
    }
    function ToggleRow({ title, description, checked, onChange }) {
      const Switch = primitives.Switch;
      return h(
        'div',
        { className: 'waycraft-row' },
        h(
          'div',
          { className: 'waycraft-text' },
          h('div', { className: 'waycraft-title' }, title),
          h('div', { className: 'waycraft-desc' }, description),
        ),
        Switch
          ? h(Switch, { checked, label: title, onChange: (n) => onChange(!!n) })
          : h('input', {
              type: 'checkbox',
              checked,
              'aria-label': title,
              onChange: (e) => onChange(e.target.checked),
            }),
      );
    }

    // ───────────────────────── system notifications ─────────────────────────
    let appCtx = null;
    const fmt = (str, vars) =>
      String(str).replace(/\{(\w+)\}/g, (_, k) =>
        vars && vars[k] != null ? vars[k] : '',
      );

    /** Capabilities of THIS browser/webview, used both to pick a delivery path and to explain failures. */
    function notifyCaps() {
      const hasApi = typeof Notification !== 'undefined';
      return {
        api: hasApi,
        secure: window.isSecureContext !== false,
        sw: 'serviceWorker' in navigator,
        permission: hasApi ? Notification.permission : 'unsupported',
      };
    }
    // requestPermission() must run inside a user gesture on mobile browsers; callers pass `fromGesture`
    // only from click handlers. Without a gesture we never prompt (it would be silently ignored).
    async function ensurePermission(fromGesture) {
      const caps = notifyCaps();
      if (!caps.api) return false;
      if (caps.permission === 'granted') return true;
      if (caps.permission === 'denied' || !fromGesture) return false;
      try {
        return (await Notification.requestPermission()) === 'granted';
      } catch (_) {
        return false;
      }
    }
    async function swRegistration() {
      try {
        if (!('serviceWorker' in navigator)) return null;
        const reg = await navigator.serviceWorker.getRegistration();
        return reg && typeof reg.showNotification === 'function' ? reg : null;
      } catch (_) {
        return null;
      }
    }
    const appFocused = () => !document.hidden && document.hasFocus();
    function shouldNotify() {
      const mode = store.get().notifyMode;
      if (mode === 'off') return false;
      if (mode === 'always') return true;
      return !appFocused();
    }
    const live = new Set();
    async function notify({ title, body, sessionId, tag, fromGesture }) {
      const options = {
        body,
        tag,
        renotify: true,
        silent: appFocused(),
        data: { sessionId },
      };
      if (await ensurePermission(!!fromGesture)) {
        // 1) Service-worker registration: the only API Chrome on Android allows, and it also works on
        //    desktop and in installed iOS web apps. The remote-access plugin already registers one.
        const reg = await swRegistration();
        if (reg) {
          try {
            await reg.showNotification(title, options);
            return;
          } catch (_) {
            /* fall through */
          }
        }
        // 2) Classic constructor (desktop browsers, Electron). Mute the sound while the app is focused.
        try {
          const n = new Notification(title, options);
          live.add(n);
          n.onclose = () => live.delete(n);
          n.onclick = () => {
            try {
              window.focus();
            } catch (_) {}
            try {
              if (sessionId && appCtx && appCtx.uiWorkspace)
                appCtx.uiWorkspace.openSession(sessionId);
            } catch (_) {}
            n.close();
          };
          return;
        } catch (_) {
          /* e.g. "Illegal constructor" on Android: fall through */
        }
      }
      // 3) Last resort so the event is never lost: in-app banner + haptic buzz.
      try {
        showToast(title + ' — ' + body);
      } catch (_) {}
      try {
        if (!appFocused() && navigator.vibrate)
          navigator.vibrate([120, 60, 120]);
      } catch (_) {}
    }

    function describePending(p, t) {
      if (!p) return null;
      if (p.kind === 'plan-review')
        return { key: p.key, text: t('notify.msg.plan'), type: 'action' };
      if (p.questions)
        return { key: p.key, text: t('notify.msg.question'), type: 'action' };
      return {
        key: p.key || p.callId,
        type: 'action',
        text: p.toolName
          ? fmt(t('notify.msg.approval'), { tool: p.toolName })
          : t('notify.msg.approvalPlain'),
      };
    }

    /** Invisible root component: watches session status through the standard `useSessionStatus` hook. */
    function NotificationWatcher({ useSessionStatus, useSessions, t }) {
      const status = useSessionStatus((m) => m);
      const list = useSessions((l) => l);
      const prev = React.useRef(null); // Map(sessionId -> { running, pendingKey })
      const t0 = React.useRef(new Map()); // sessionId -> run start
      React.useEffect(() => {
        const next = new Map();
        const titleOf = (id) => {
          const row = list && list.byId && list.byId[id];
          return (row && (row.title || row.name)) || t('notify.session');
        };
        for (const [id, st] of status) {
          const pending = describePending(st.pendingInteraction, t);
          next.set(id, {
            running: st.running === true,
            pendingKey: pending ? String(pending.key) : null,
          });
          const before = prev.current && prev.current.get(id);
          if (!prev.current) continue; // first snapshot = baseline
          const cfg = store.get();
          if (st.running === true && !(before && before.running))
            t0.current.set(id, Date.now());
          if (
            pending &&
            cfg.notifyAction &&
            (!before || before.pendingKey !== String(pending.key)) &&
            shouldNotify()
          ) {
            notify({
              title: titleOf(id),
              body: pending.text,
              sessionId: id,
              tag: `${id}:action`,
            });
          } else if (
            before &&
            before.running &&
            st.running === false &&
            !pending &&
            cfg.notifyDone &&
            shouldNotify()
          ) {
            notify({
              title: titleOf(id),
              body: t('notify.msg.done'),
              sessionId: id,
              tag: `${id}:done`,
            });
          }
        }
        prev.current = next;
      }, [status, list, t]);
      return null;
    }

    function NotifyModeRow({ t }) {
      const mode = useSetting('notifyMode');
      const [, setTick] = React.useState(0);
      const caps = notifyCaps();
      const statusKey = !caps.api
        ? caps.secure
          ? 'notify.status.unsupported'
          : 'notify.status.insecure'
        : caps.permission === 'granted'
          ? 'notify.status.granted'
          : caps.permission === 'denied'
            ? 'notify.status.denied'
            : 'notify.status.default';
      const options = NOTIFY_MODES.map((id) => ({
        id,
        label: t('notify.' + id),
      }));
      const test = h(
        'button',
        {
          type: 'button',
          className: 'waycraft-test',
          disabled: mode === 'off',
          onClick: async () => {
            await notify({
              title: 'DeepSeek Harness',
              body: t('notify.testBody'),
              tag: 'waycraft:test',
              fromGesture: true,
            });
            setTick((n) => n + 1);
          },
        },
        t('notify.test'),
      );
      return h(SelectRow, {
        title: t('notify.title'),
        description: h(
          'span',
          null,
          t('notify.description'),
          h('br'),
          h(
            'span',
            { className: 'waycraft-status', 'data-state': caps.permission },
            t(statusKey),
          ),
        ),
        value: mode,
        options,
        extra: test,
        onSelect: (id) => {
          store.set({ notifyMode: id });
          if (id !== 'off')
            ensurePermission(true).then(() => setTick((n) => n + 1));
        },
      });
    }
    function NotifyDoneRow({ t }) {
      const on = useSetting('notifyDone');
      return h(ToggleRow, {
        title: t('notify.done.title'),
        description: t('notify.done.description'),
        checked: on,
        onChange: (v) => store.set({ notifyDone: v }),
      });
    }
    function NotifyActionRow({ t }) {
      const on = useSetting('notifyAction');
      return h(ToggleRow, {
        title: t('notify.action.title'),
        description: t('notify.action.description'),
        checked: on,
        onChange: (v) => store.set({ notifyAction: v }),
      });
    }

    // ───────────────────────── account menu: extra actions live inside it ─────────────────────────
    // DSH builds the account menu (Settings / Feedback / Sign out) from fixed props, and plugins such as
    // Remote access add their button to the `sidebar.footer.action` slot instead. We (1) hide those footer
    // triggers (zero-size, still mounted, so their panels and state keep working) and (2) add an equivalent
    // item to the account menu whenever it opens; selecting it clicks the hidden trigger.
    const ACCOUNT_TRIGGER = 'button[data-signed-out]';
    const FOOTER_SLOT = '[data-slot="sidebar.footer.action"]';
    const accountItems = new Map(); // id -> { id, label, icon?: svg markup, order?, onSelect }

    function footerTriggers() {
      const out = [];
      document.querySelectorAll(FOOTER_SLOT).forEach((slot) => {
        Array.from(slot.children).forEach((child) => {
          const trigger = child.matches('button')
            ? child
            : child.querySelector('button');
          if (trigger) out.push(trigger);
        });
      });
      return out;
    }
    function markFooterTriggers(on) {
      for (const t of footerTriggers()) {
        if (on) t.setAttribute('data-waycraft-menu-trigger', '');
        else t.removeAttribute('data-waycraft-menu-trigger');
      }
    }
    function footerMenuItems() {
      const out = [];
      for (const trigger of footerTriggers()) {
        const label = (
          trigger.getAttribute('aria-label') ||
          trigger.getAttribute('title') ||
          trigger.textContent ||
          ''
        ).trim();
        if (!label) continue;
        out.push({
          id: 'footer:' + label,
          label,
          order: 1000 + out.length,
          svg: trigger.querySelector('svg'),
          onSelect: () => trigger.click(),
        });
      }
      return out;
    }
    function removeInjectedItems() {
      document.querySelectorAll('[data-waycraft-item]').forEach((b) => {
        const w = b.parentElement;
        if (w) w.remove();
      });
    }
    function injectAccountItems(menu, trigger) {
      const buttons = Array.from(
        menu.querySelectorAll('[role="menuitem"]'),
      ).filter((b) => !b.hasAttribute('data-waycraft-item'));
      if (!buttons.length) return;
      const template =
        buttons.find((b) => !b.querySelector('[aria-hidden="true"]')) ||
        buttons[0];
      const anchorWrap = buttons[buttons.length - 1].parentElement; // before Sign out / Sign in
      const have = new Set(
        Array.from(menu.querySelectorAll('[data-waycraft-item]')).map((n) =>
          n.getAttribute('data-waycraft-item'),
        ),
      );
      const items = [...footerMenuItems(), ...accountItems.values()].sort(
        (a, b) => (a.order || 0) - (b.order || 0),
      );
      for (const item of items) {
        if (have.has(item.id)) continue;
        const wrap = template.parentElement.cloneNode(true);
        wrap.querySelectorAll('[role="separator"]').forEach((n) => n.remove());
        const btn = wrap.querySelector('[role="menuitem"]');
        btn.setAttribute('data-waycraft-item', item.id);
        btn.removeAttribute('disabled');
        btn.removeAttribute('aria-keyshortcuts');
        const spans = Array.from(btn.children).filter(
          (n) => n.tagName === 'SPAN',
        );
        const iconSpan = spans.length >= 2 ? spans[0] : null;
        const labelSpan = spans.length >= 2 ? spans[1] : spans[0];
        spans.slice(2).forEach((n) => n.remove());
        if (labelSpan) labelSpan.textContent = item.label;
        if (iconSpan) {
          iconSpan.textContent = '';
          if (item.svg) {
            const c = item.svg.cloneNode(true);
            c.setAttribute('width', '16');
            c.setAttribute('height', '16');
            iconSpan.appendChild(c);
          } else if (item.icon) iconSpan.innerHTML = item.icon;
        }
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          try {
            item.onSelect();
          } finally {
            if (trigger.getAttribute('aria-expanded') === 'true')
              trigger.click(); // close the account menu
          }
        });
        anchorWrap.parentElement.insertBefore(wrap, anchorWrap);
      }
    }
    function syncAccountMenu() {
      const on = store.get().accountMenu;
      markFooterTriggers(on);
      if (!on) {
        removeInjectedItems();
        return;
      }
      const trigger = document.querySelector(ACCOUNT_TRIGGER);
      if (!trigger || trigger.getAttribute('aria-expanded') !== 'true') return;
      const menus = document.querySelectorAll('[role="menu"]');
      const menu = menus[menus.length - 1];
      if (menu) injectAccountItems(menu, trigger);
    }
    function startAccountMenu() {
      let raf = null;
      const schedule = () => {
        if (raf === null)
          raf = requestAnimationFrame(() => {
            raf = null;
            syncAccountMenu();
          });
      };
      const observer = new MutationObserver(schedule);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-expanded'],
      });
      const unsub = store.subscribe(schedule);
      // Public hook so later features of this plugin (or others) can add items to the same menu.
      const api = {
        register(item) {
          accountItems.set(item.id, item);
          schedule();
          return () => {
            accountItems.delete(item.id);
            removeInjectedItems();
            schedule();
          };
        },
      };
      window.__dshWaycraft = Object.assign(window.__dshWaycraft || {}, {
        accountMenu: api,
      });
      // Deprecated alias (one release): the old hook points at the same object.
      window[LEGACY_GLOBAL] = window.__dshWaycraft;
      schedule();
      return () => {
        observer.disconnect();
        unsub();
        if (raf !== null) cancelAnimationFrame(raf);
        markFooterTriggers(false);
        removeInjectedItems();
        accountItems.clear();
        if (window.__dshWaycraft) delete window.__dshWaycraft.accountMenu;
        if (window[LEGACY_GLOBAL] === window.__dshWaycraft)
          delete window[LEGACY_GLOBAL];
      };
    }
    function AccountMenuRow({ t }) {
      const on = useSetting('accountMenu');
      return h(ToggleRow, {
        title: t('account.title'),
        description: t('account.description'),
        checked: on,
        onChange: (v) => store.set({ accountMenu: v }),
      });
    }

    // ───────────────────────── copy on select ─────────────────────────
    // Copies the current text selection when the user finishes selecting (mouse up / keyboard selection
    // keys), never mid-drag. Selections inside editable fields are ignored so typing is never disturbed.
    function isEditable(el) {
      if (!el) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    }
    // Lightweight toast that matches DSH's own (same tokens, top-centre, ~2s). It lives in <body>, outside
    // React, so it works from plain DOM listeners; one element is reused so rapid copies don't stack.
    const TOAST_CSS = `
.waycraft-toast{position:fixed;top:40px;left:50%;z-index:2147483000;transform:translate(-50%,-6px);display:flex;align-items:center;gap:10px;width:max-content;max-width:min(640px,calc(100vw - 48px));padding:12px 16px;border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-toast-bg,#2b2b2e);color:var(--dsw-alias-toast-label,#fff);font:var(--dsw-font-s-14);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.28));pointer-events:none;opacity:0;transition:opacity .16s ease,transform .16s ease}
.waycraft-toast[data-show]{opacity:1;transform:translate(-50%,0)}
.waycraft-toast svg{flex:none;width:16px;height:16px;color:var(--dsw-alias-state-success-primary,#3ecf8e)}
`;
    let toastEl = null,
      toastTimer = null,
      toastStyle = null;
    function showToast(text) {
      if (!document.body) return;
      if (!toastStyle) {
        toastStyle = document.createElement('style');
        toastStyle.setAttribute('data-waycraft-toast-style', '');
        toastStyle.textContent = TOAST_CSS;
        document.head.appendChild(toastStyle);
      }
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'waycraft-toast';
        toastEl.setAttribute('role', 'status');
        toastEl.setAttribute('aria-live', 'polite');
        toastEl.innerHTML =
          '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>';
        document.body.appendChild(toastEl);
      }
      toastEl.lastElementChild.textContent = text;
      // restart the transition when a toast is already visible
      toastEl.removeAttribute('data-show');
      void toastEl.offsetWidth;
      toastEl.setAttribute('data-show', '');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        if (toastEl) toastEl.removeAttribute('data-show');
      }, 2000);
    }
    function disposeToast() {
      clearTimeout(toastTimer);
      if (toastEl) {
        toastEl.remove();
        toastEl = null;
      }
      if (toastStyle) {
        toastStyle.remove();
        toastStyle = null;
      }
    }

    function startAutoCopy(onCopied) {
      let last = '';
      const done = () => {
        if (onCopied) onCopied();
      };
      const copy = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, () => {
            try {
              if (document.execCommand('copy')) done();
            } catch (_) {}
          });
        } else {
          try {
            if (document.execCommand('copy')) done();
          } catch (_) {}
        }
      };
      const run = () => {
        const sel = window.getSelection && window.getSelection();
        if (!sel || sel.isCollapsed) {
          last = '';
          return;
        }
        const text = sel.toString();
        if (!text || !text.trim() || text === last) return;
        const anchor =
          sel.anchorNode &&
          (sel.anchorNode.nodeType === 1
            ? sel.anchorNode
            : sel.anchorNode.parentElement);
        if (
          isEditable(document.activeElement) ||
          isEditable(anchor) ||
          (anchor &&
            anchor.closest &&
            anchor.closest('[contenteditable="true"], .xterm'))
        )
          return;
        last = text;
        copy(text);
      };
      let timer = null;
      const later = () => {
        clearTimeout(timer);
        timer = setTimeout(run, 30);
      };
      const onKey = (e) => {
        if (e.shiftKey || e.key === 'a' || e.key === 'A') later();
      };
      document.addEventListener('mouseup', later, true);
      document.addEventListener('dblclick', later, true);
      document.addEventListener('keyup', onKey, true);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mouseup', later, true);
        document.removeEventListener('dblclick', later, true);
        document.removeEventListener('keyup', onKey, true);
      };
    }
    function AutoCopyRow({ t }) {
      const on = useSetting('autoCopy');
      return h(ToggleRow, {
        title: t('copy.title'),
        description: t('copy.description'),
        checked: on,
        onChange: (v) => store.set({ autoCopy: v }),
      });
    }

    // ───────────────────────── command classifier (inlined from lib/classify.cjs; tested in test/) ─────────────────────────
    const CLASSIFY = (function () {
      /**
       * Deterministic approval classifier for shell commands (no LLM, no network).
       *
       * Verdicts:
       *   'allow' — every part is positively recognised as non-destructive and contained
       *   'ask'   — unknown / ambiguous: a human decides (the default for anything not recognised)
       *   'deny'  — matches a hard rule (destroys data, rewrites shared history, leaks secrets, escalates the
       *             machine); never auto-approved, even in "aggressive" mode's sibling "safe" mode.
       *
       * Principles (from Claude Code auto mode, Codex `is_safe_command`, anumati, Qwen auto-mode docs):
       *  - judge real effect, not surface text: a chain is safe only if EVERY segment is safe;
       *  - allow-list by shape (program + sub-command + flags), never "anything except X";
       *  - command substitution, eval, process substitution, here-docs and unknown redirects => not provable => ask;
       *  - hard-deny the irreversible / shared-state / secret / persistence classes regardless of intent.
       *
       * The module is plain ES5-ish JS so it can be inlined into the browser client and unit-tested in Node.
       */

      /* ─────────────────────────── tokenizer ─────────────────────────── */

      /** Split a command line into top-level segments + words. Returns null when the line is not statically analysable. */
      function parse(line) {
        const segments = []; // { words: string[], op: string|null (operator that FOLLOWS), redirects: string[] }
        let words = [],
          cur = '',
          has = false,
          quote = null,
          i = 0;
        let redirects = [];
        const pushWord = () => {
          if (has) {
            words.push(cur);
            cur = '';
            has = false;
          }
        };
        const pushSeg = (op) => {
          pushWord();
          if (words.length || redirects.length || op)
            segments.push({ words, op, redirects });
          words = [];
          redirects = [];
        };
        const n = line.length;
        while (i < n) {
          const c = line[i];
          if (quote === "'") {
            if (c === "'") quote = null;
            else {
              cur += c;
              has = true;
            }
            i++;
            continue;
          }
          if (quote === '"') {
            if (c === '"') {
              quote = null;
              i++;
              continue;
            }
            if (c === '\\' && i + 1 < n) {
              cur += line[i + 1];
              has = true;
              i += 2;
              continue;
            }
            if (c === '$' && (line[i + 1] === '(' || line[i + 1] === '{'))
              return null; // substitution / expansion with code
            if (c === '`') return null;
            cur += c;
            has = true;
            i++;
            continue;
          }
          if (c === "'" || c === '"') {
            quote = c;
            has = true;
            i++;
            continue;
          }
          if (c === '\\') {
            if (i + 1 < n) {
              cur += line[i + 1];
              has = true;
              i += 2;
              continue;
            }
            return null;
          }
          if (c === '`') return null;
          if (c === '$' && (line[i + 1] === '(' || line[i + 1] === '{'))
            return null;
          if ((c === '<' || c === '>') && line[i + 1] === '(') return null; // process substitution
          if (c === '<' && line[i + 1] === '<') return null; // here-doc / here-string
          if (c === '\n' || c === ';') {
            pushSeg(c === ';' ? ';' : '\n');
            i++;
            continue;
          }
          if (c === '&') {
            if (line[i + 1] === '&') {
              pushSeg('&&');
              i += 2;
              continue;
            }
            if (line[i - 1] === '>' || line[i + 1] === '>') {
              cur += c;
              has = true;
              i++;
              continue;
            } // 2>&1, &>
            pushSeg('&');
            i++;
            continue;
          }
          if (c === '|') {
            if (line[i + 1] === '|') {
              pushSeg('||');
              i += 2;
              continue;
            }
            pushSeg('|');
            i++;
            continue;
          }
          if (c === ' ' || c === '\t') {
            pushWord();
            i++;
            continue;
          }
          if (c === '>' || c === '<') {
            // redirection: capture target word
            pushWord();
            let op = c;
            i++;
            if (line[i] === '>') {
              op += '>';
              i++;
            }
            if (line[i] === '&') {
              op += '&';
              i++;
            }
            while (line[i] === ' ') i++;
            let target = '';
            while (i < n && !/[\s;&|<>]/.test(line[i])) {
              target += line[i];
              i++;
            }
            redirects.push(op + target);
            continue;
          }
          cur += c;
          has = true;
          i++;
        }
        if (quote) return null;
        pushSeg(null);
        return segments.filter((s) => s.words.length || s.redirects.length);
      }

      /* ─────────────────────────── helpers ─────────────────────────── */

      const SECRET_PATH =
        /(^|\/)(\.ssh|\.aws|\.gnupg|\.kube|\.docker\/config\.json|\.netrc|\.npmrc|\.pypirc|id_(rsa|ed25519|ecdsa|dsa)|\.env(\.[\w.-]+)?|credentials(\.json)?|secrets?(\.[\w]+)?|[\w.-]*\.(pem|key|p12|pfx|keystore))$/i;
      const SECRET_CONTAINS =
        /(\.ssh\/|\.aws\/|\.gnupg\/|Library\/Keychains|\/etc\/(shadow|sudoers)|keychain)/i;
      function touchesSecret(w) {
        return SECRET_PATH.test(w) || SECRET_CONTAINS.test(w);
      }

      function basename(p) {
        const m = /([^/]+)$/.exec(p);
        return m ? m[1] : p;
      }

      /** Strip leading env assignments (FOO=bar cmd) and harmless wrappers. Returns { env, words } or null if env sets code-affecting vars. */
      const DANGEROUS_ENV =
        /^(LD_PRELOAD|LD_LIBRARY_PATH|DYLD_[A-Z_]+|PATH|NODE_OPTIONS|PYTHONPATH|PYTHONSTARTUP|BASH_ENV|ENV|PROMPT_COMMAND|GIT_SSH_COMMAND|GIT_EXTERNAL_DIFF|GIT_PAGER|GIT_ASKPASS|SSH_ASKPASS|EDITOR|VISUAL|PAGER|SHELL|HOME)$/;
      function stripPrefix(words) {
        let i = 0;
        while (i < words.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i])) {
          if (DANGEROUS_ENV.test(words[i].split('=')[0])) return null;
          i++;
        }
        let w = words.slice(i);
        for (;;) {
          if (
            w[0] === 'time' ||
            w[0] === 'command' ||
            w[0] === 'builtin' ||
            w[0] === 'nohup'
          ) {
            w = w.slice(1);
            continue;
          }
          if (w[0] === 'env') {
            // env with no assignments/options only
            if (w.length > 1 && !/^-/.test(w[1]) && !/=/.test(w[1])) {
              w = w.slice(1);
              continue;
            }
            return null;
          }
          if (
            w[0] === 'timeout' &&
            w.length > 2 &&
            /^[\d.]+[smhd]?$/.test(w[1])
          ) {
            w = w.slice(2);
            continue;
          }
          break;
        }
        return w;
      }

      function hasAny(words, set) {
        return words.some((x) => set.has(x));
      }
      const setOf = (...a) => new Set(a);

      /* ─────────────────────────── hard-deny rules ─────────────────────────── */

      /** @returns reason string when the SEGMENT (already prefix-stripped) is a hard-deny, else null */
      function hardDenySegment(w, ctx) {
        const cmd = basename(w[0]);
        const args = w.slice(1);
        const joined = w.join(' ');

        // privilege / system
        if (
          [
            'sudo',
            'su',
            'doas',
            'pkexec',
            'launchctl',
            'systemctl',
            'service',
            'crontab',
            'at',
            'passwd',
            'chown',
            'chgrp',
            'mount',
            'umount',
            'diskutil',
            'fdisk',
            'mkfs',
            'dd',
            'shutdown',
            'reboot',
            'halt',
            'killall',
            'pkill',
            'kill',
            'csrutil',
            'spctl',
            'defaults',
            'scutil',
            'networksetup',
            'pmset',
            'sysctl',
            'visudo',
            'useradd',
            'userdel',
            'dscl',
            'security',
            'osascript',
          ].includes(cmd)
        )
          return `system/privilege command: ${cmd}`;
        if (
          cmd === 'chmod' &&
          (args.includes('-R') ||
            args.some(
              (a) =>
                /^[0-7]*7[0-7]*7$/.test(a) ||
                a === 'u+s' ||
                a === 'g+s' ||
                a === '+s' ||
                a === 'a+rwx' ||
                a === '777',
            ))
        )
          return 'dangerous chmod';
        // destructive filesystem
        if (
          cmd === 'rm' ||
          cmd === 'rmdir' ||
          cmd === 'unlink' ||
          cmd === 'shred' ||
          cmd === 'srm' ||
          cmd === 'trash'
        ) {
          // recursive or force deletes, or anything pointing outside the project / at home, root, or wildcards at top level
          const rec = args.some(
            (a) =>
              /^-[a-zA-Z]*[rRf][a-zA-Z]*$/.test(a) ||
              a === '--recursive' ||
              a === '--force',
          );
          const targets = args.filter((a) => !a.startsWith('-'));
          const outside = targets.some(
            (t) =>
              t === '/' ||
              t === '~' ||
              t.startsWith('~/') ||
              t.startsWith('/') ||
              t === '.' ||
              t === '..' ||
              t.startsWith('../') ||
              /^\*+$/.test(t) ||
              t === './*' ||
              /\$/.test(t),
          );
          if (rec || outside || cmd !== 'rm')
            return `destructive delete (${cmd})`;
        }
        if (
          cmd === 'find' &&
          args.some((a) =>
            [
              '-delete',
              '-exec',
              '-execdir',
              '-ok',
              '-okdir',
              '-fprint',
              '-fprint0',
              '-fprintf',
              '-fls',
            ].includes(a),
          )
        )
          return 'find with delete/exec';
        if (cmd === 'truncate' || (cmd === 'mv' && targetsOutside(args)))
          return `${cmd} touching paths outside the project`;
        // git: history rewrite, shared state, secrets
        if (cmd === 'git') {
          const sub = gitSub(args);
          if (sub) {
            const rest = sub.rest;
            if (sub.name === 'push') {
              const force = rest.some(
                (a) =>
                  a === '-f' ||
                  a === '--force' ||
                  a.startsWith('--force-with-lease') ||
                  a === '--mirror' ||
                  a === '--delete' ||
                  a === '-d' ||
                  /^\+/.test(a) ||
                  /^:/.test(a),
              );
              const toProtected = rest.some((a) =>
                /(^|[:/ ])(main|master|develop|trunk|release[\w/.-]*|production|prod)$/i.test(
                  a,
                ),
              );
              if (force) return 'git push with force/delete';
              if (toProtected) return 'git push to a protected branch';
              return null; // plain push is "ask", not hard-deny
            }
            if (sub.name === 'reset' && rest.includes('--hard'))
              return 'git reset --hard (discards work)';
            if (
              sub.name === 'clean' &&
              rest.some((a) => /^-[a-z]*[fdx][a-z]*$/i.test(a))
            )
              return 'git clean (deletes untracked files)';
            if (
              sub.name === 'checkout' &&
              ((rest.includes('--') && rest.includes('.')) ||
                rest.includes('-f') ||
                rest.includes('--force'))
            )
              return 'git checkout discarding changes';
            if (sub.name === 'restore' && !rest.includes('--staged'))
              return 'git restore discarding changes';
            if (sub.name === 'stash' && ['drop', 'clear'].includes(rest[0]))
              return 'git stash drop/clear';
            if (
              sub.name === 'branch' &&
              rest.some(
                (a) =>
                  a === '-D' || (a === '--delete' && rest.includes('--force')),
              )
            )
              return 'git branch -D';
            if (
              ['filter-branch', 'filter-repo', 'update-ref', 'reflog'].includes(
                sub.name,
              ) &&
              (sub.name !== 'reflog' || ['expire', 'delete'].includes(rest[0]))
            )
              return `git ${sub.name} (history rewrite)`;
            if (sub.name === 'gc' && rest.some((a) => a.startsWith('--prune')))
              return 'git gc --prune';
            if (
              sub.name === 'config' &&
              rest.some((a) => /^(--global|--system)$/.test(a))
            )
              return 'git config global/system';
            if (
              rest.some(
                (a) =>
                  a === '--no-verify' ||
                  a === '--no-gpg-sign' ||
                  (a === '-n' && sub.name === 'commit'),
              )
            )
              return 'bypasses git hooks/signing';
          }
        }
        // GitHub CLI: shared-state & destructive
        if (cmd === 'gh') {
          const a = args.filter((x) => !x.startsWith('-'));
          if (
            a[0] === 'repo' &&
            ['delete', 'archive', 'rename', 'edit', 'transfer'].includes(a[1])
          )
            return `gh repo ${a[1]}`;
          if (
            a[0] === 'secret' ||
            (a[0] === 'auth' &&
              ['logout', 'token', 'refresh', 'login'].includes(a[1])) ||
            a[0] === 'ssh-key' ||
            a[0] === 'gpg-key' ||
            (a[0] === 'codespace' && a[1] === 'delete')
          )
            return `gh ${a[0]} ${a[1] || ''}`.trim();
          if (
            (a[0] === 'pr' && ['merge', 'close'].includes(a[1])) ||
            (a[0] === 'release' && ['create', 'delete'].includes(a[1])) ||
            (a[0] === 'workflow' &&
              ['run', 'enable', 'disable'].includes(a[1])) ||
            (a[0] === 'run' && ['cancel', 'delete', 'rerun'].includes(a[1]))
          )
            return `gh ${a[0]} ${a[1]} (affects shared state)`;
          if (a[0] === 'api') {
            const m = /(?:^|\s)(-X|--method)[ =]?(\w+)/i.exec(joined);
            if (m && m[2].toUpperCase() !== 'GET') return 'gh api non-GET';
            if (
              args.some(
                (x) =>
                  x === '-f' ||
                  x === '-F' ||
                  x === '--field' ||
                  x === '--raw-field' ||
                  x === '--input',
              )
            )
              return 'gh api with request body (implies POST)';
          }
        }
        // package publication / registry
        if (
          ['npm', 'pnpm', 'yarn', 'bun'].includes(cmd) &&
          args.some((a) =>
            [
              'publish',
              'unpublish',
              'deprecate',
              'login',
              'adduser',
              'token',
              'owner',
              'access',
              'dist-tag',
            ].includes(a),
          )
        )
          return `${cmd} registry action`;
        if (
          cmd === 'twine' ||
          (cmd === 'cargo' && args[0] === 'publish') ||
          (cmd === 'gem' && args[0] === 'push')
        )
          return 'package publish';
        // infra & containers & cloud
        if (
          ['terraform', 'tofu', 'pulumi'].includes(cmd) &&
          args.some((a) =>
            [
              'apply',
              'destroy',
              'import',
              'state',
              'taint',
              'untaint',
              'up',
              'refresh',
            ].includes(a),
          )
        )
          return `${cmd} mutating`;
        if (
          cmd === 'kubectl' &&
          args.some((a) =>
            [
              'delete',
              'apply',
              'replace',
              'patch',
              'drain',
              'cordon',
              'scale',
              'rollout',
              'exec',
              'cp',
              'edit',
              'create',
              'run',
              'annotate',
              'label',
              'set',
            ].includes(a),
          )
        )
          return 'kubectl mutating';
        if (
          cmd === 'helm' &&
          args.some((a) =>
            ['install', 'upgrade', 'uninstall', 'rollback', 'delete'].includes(
              a,
            ),
          )
        )
          return 'helm mutating';
        if (
          [
            'aws',
            'gcloud',
            'az',
            'doctl',
            'heroku',
            'vercel',
            'netlify',
            'flyctl',
            'fly',
            'wrangler',
            'firebase',
            'supabase',
            'railway',
            'stripe',
          ].includes(cmd) &&
          !args.some((a) =>
            ['--version', '--help', 'help', 'version'].includes(a),
          )
        )
          return `cloud CLI (${cmd})`;
        if (cmd === 'docker' || cmd === 'podman') {
          const a = args.filter((x) => !x.startsWith('-'));
          if (
            [
              'rm',
              'rmi',
              'system',
              'volume',
              'network',
              'prune',
              'kill',
              'push',
              'login',
              'logout',
              'exec',
              'cp',
              'commit',
              'run',
              'compose',
              'stop',
              'restart',
            ].includes(a[0]) ||
            args.includes('--privileged') ||
            args.some(
              (x) => x.startsWith('-v') || x === '--volume' || x === '--mount',
            )
          )
            return `${cmd} mutating`;
        }
        // databases
        if (
          [
            'psql',
            'mysql',
            'mysqldump',
            'mongosh',
            'mongo',
            'redis-cli',
            'sqlite3',
            'mariadb',
            'pg_dump',
            'pg_restore',
            'dropdb',
            'createdb',
          ].includes(cmd) &&
          /DROP|DELETE|TRUNCATE|UPDATE|INSERT|ALTER|GRANT|FLUSH|--eval|-c\s/i.test(
            joined,
          )
        )
          return 'database write';
        // exfiltration / downloads executed / raw network
        if (
          [
            'nc',
            'ncat',
            'netcat',
            'socat',
            'telnet',
            'ssh',
            'scp',
            'sftp',
            'rsync',
            'ftp',
            'tftp',
            'sshpass',
            'ngrok',
            'cloudflared',
            'tailscale',
            'wg',
            'openssl',
            'nmap',
            'masscan',
            'tcpdump',
            'dig',
            'nslookup',
            'whois',
            'ping',
            'traceroute',
            'mitmproxy',
          ].includes(cmd) &&
          !['ping'].includes(cmd)
        )
          return `network/remote tool: ${cmd}`;
        if (
          ['curl', 'wget', 'http', 'https', 'httpie', 'aria2c', 'xh'].includes(
            cmd,
          ) &&
          !(
            cmd === 'wget' &&
            !args.some(
              (a) =>
                /^(--post|--body|--header|--user|--password|--load-cookies|--certificate|--private-key)/.test(
                  a,
                ) ||
                (a === '-U' && false),
            )
          )
        ) {
          const upload = args.some(
            (a) =>
              [
                '-d',
                '--data',
                '--data-binary',
                '--data-raw',
                '--data-urlencode',
                '-F',
                '--form',
                '-T',
                '--upload-file',
                '-X',
                '--request',
                '--post-data',
                '--post-file',
                '--method',
                '-u',
                '--user',
                '-H',
                '--header',
                '--cookie',
                '-b',
                '--output',
                '-o',
                '-O',
                '--remote-name',
              ].includes(a) ||
              /^-(?:[a-zA-Z]*[dFTXuHbo])$/.test(a) ||
              a.startsWith('--data') ||
              a.startsWith('--form') ||
              a.startsWith('--post'),
          );
          if (upload)
            return `${cmd} with body/auth/output (possible exfiltration or download)`;
          // plain GET without options is classed in `allow` rules (read-only fetch of a URL), not here
        }
        // secrets read or modified
        if (
          w.some((x) => touchesSecret(x)) &&
          !['ls', 'stat', 'file', 'test', '[', 'git'].includes(cmd)
        )
          return 'touches secrets or credentials';
        if (
          [
            'security',
            'op',
            'gpg',
            'pass',
            'vault',
            'doppler',
            'sops',
            'age',
            'keychain',
            'ssh-add',
            'ssh-keygen',
            'ssh-agent',
          ].includes(cmd)
        )
          return `credential tool: ${cmd}`;
        // shell indirection that hides what runs
        if (
          [
            'eval',
            'exec',
            'source',
            '.',
            'xargs',
            'parallel',
            'watch',
            'script',
            'expect',
            'screen',
            'tmux',
            'disown',
            'setsid',
            'trap',
            'alias',
            'unalias',
            'export',
            'unset',
            'umask',
            'ulimit',
            'complete',
            'hash',
          ].includes(cmd) &&
          !(cmd === 'export' && false)
        )
          return `shell indirection/state change: ${cmd}`;
        const SHELLS = [
          'sh',
          'bash',
          'zsh',
          'fish',
          'dash',
          'ksh',
          'csh',
          'tcsh',
        ];
        if (
          SHELLS.includes(cmd) &&
          args.some(
            (a) => /^-[a-zA-Z]*c$/.test(a) || a === '--command' || a === '-',
          )
        )
          return 'nested shell -c';
        // `... | sh` / `... | python`: code arriving on stdin is executed without being inspected
        if (
          (SHELLS.includes(cmd) ||
            [
              'python',
              'python3',
              'node',
              'ruby',
              'perl',
              'php',
              'deno',
              'bun',
            ].includes(cmd)) &&
          args.every((a) => a.startsWith('-')) &&
          ctx &&
          ctx.piped
        )
          return `pipes data into ${cmd} (executes it)`;
        if (
          [
            'python',
            'python3',
            'python2',
            'node',
            'nodejs',
            'deno',
            'bun',
            'ruby',
            'perl',
            'php',
            'lua',
            'osascript',
            'pwsh',
            'powershell',
            'Rscript',
            'julia',
            'swift',
            'go',
          ].includes(cmd) &&
          args.some(
            (a) =>
              /^(-c|-e|-E|-r|--eval|-p|--print|-x)$/.test(a) ||
              (a === 'run' && cmd === 'go') ||
              a === '-',
          )
        )
          return `inline code via ${cmd}`;
        // launching / mac side effects
        if (
          [
            'open',
            'xdg-open',
            'pbcopy',
            'pbpaste',
            'say',
            'afplay',
            'screencapture',
            'caffeinate',
            'ditto',
            'hdiutil',
            'installer',
            'pkgutil',
            'brew',
            'port',
            'apt',
            'apt-get',
            'yum',
            'dnf',
            'pacman',
            'snap',
            'pip',
            'pip3',
            'pipx',
            'conda',
            'gem',
            'cpan',
            'cargo',
          ].includes(cmd) &&
          !(
            cmd === 'cargo' &&
            [
              'build',
              'check',
              'test',
              'fmt',
              'clippy',
              'doc',
              'tree',
              'metadata',
              'bench',
            ].includes(args[0])
          ) &&
          !(
            cmd === 'brew' &&
            [
              'list',
              'info',
              'search',
              'outdated',
              'deps',
              'config',
              '--version',
            ].includes(args[0])
          ) &&
          !(
            ['pip', 'pip3'].includes(cmd) &&
            ['list', 'show', 'freeze', 'check', '--version', 'index'].includes(
              args[0],
            )
          )
        )
          return `system/package manager: ${cmd}`;
        // writing outside project via tee / sed -i / dd of=
        if (
          cmd === 'tee' &&
          args.some(
            (a) =>
              !a.startsWith('-') &&
              (a.startsWith('/') || a.startsWith('~') || a.startsWith('..')),
          )
        )
          return 'tee outside project';
        return null;
      }

      function targetsOutside(args) {
        return args
          .filter((a) => !a.startsWith('-'))
          .some(
            (t) =>
              t.startsWith('/') ||
              t.startsWith('~') ||
              t.startsWith('..') ||
              /\$/.test(t),
          );
      }

      /** Locate the git sub-command skipping global options (-C <dir>, -c k=v, --git-dir=…, --no-pager …). */
      function gitSub(args) {
        let i = 0;
        while (i < args.length) {
          const a = args[i];
          if (
            a === '-C' ||
            a === '-c' ||
            a === '--git-dir' ||
            a === '--work-tree' ||
            a === '--namespace' ||
            a === '--exec-path'
          ) {
            i += 2;
            continue;
          }
          if (
            a.startsWith('--git-dir=') ||
            a.startsWith('--work-tree=') ||
            a.startsWith('--exec-path=') ||
            a.startsWith('--namespace=')
          ) {
            i++;
            continue;
          }
          if (a.startsWith('-')) {
            i++;
            continue;
          }
          return {
            name: a,
            rest: args.slice(i + 1),
            globals: args.slice(0, i),
          };
        }
        return null;
      }
      function gitHasUnsafeGlobals(globals) {
        for (let i = 0; i < globals.length; i++) {
          const a = globals[i];
          if (a === '-c') {
            const v = globals[i + 1] || '';
            if (
              /^(core\.(pager|editor|sshcommand|fsmonitor|hookspath|askpass)|alias\.|credential\.|protocol\.|http\.|url\.|diff\.external|filter\.|include|receive\.|uploadpack\.)/i.test(
                v,
              )
            )
              return true;
            i++;
            continue;
          }
          if (
            a === '--exec-path' ||
            a.startsWith('--exec-path') ||
            a === '--git-dir' ||
            a.startsWith('--git-dir=') ||
            a === '--work-tree' ||
            a.startsWith('--work-tree=')
          )
            return true;
        }
        return false;
      }

      /* ─────────────────────────── allow rules ─────────────────────────── */

      const READ_ONLY = setOf(
        'ls',
        'll',
        'la',
        'dir',
        'pwd',
        'cat',
        'bat',
        'head',
        'tail',
        'less',
        'more',
        'wc',
        'nl',
        'tac',
        'rev',
        'cut',
        'sort',
        'uniq',
        'tr',
        'fold',
        'fmt',
        'column',
        'paste',
        'comm',
        'join',
        'diff',
        'cmp',
        'basename',
        'dirname',
        'realpath',
        'readlink',
        'stat',
        'file',
        'du',
        'df',
        'tree',
        'which',
        'whereis',
        'type',
        'whoami',
        'id',
        'hostname',
        'uname',
        'date',
        'uptime',
        'arch',
        'nproc',
        'echo',
        'printf',
        'true',
        'false',
        'test',
        '[',
        'sleep',
        'seq',
        'expr',
        'md5',
        'md5sum',
        'shasum',
        'sha1sum',
        'sha256sum',
        'cksum',
        'b2sum',
        'strings',
        'hexdump',
        'od',
        'xxd',
        'jq',
        'yq',
        'rg',
        'ag',
        'fd',
        'fdfind',
        'locate',
        'grep',
        'egrep',
        'fgrep',
        'zgrep',
        'wc',
        'env',
        'printenv',
        'ps',
        'lsof',
        'top',
        'cd',
        'pushd',
        'popd',
        'dirs',
        'man',
        'help',
        'info',
        'tldr',
        'cal',
        'bc',
        'dc',
        'tput',
        'clear',
        'lscpu',
        'free',
        'vm_stat',
        'sw_vers',
        'ioreg',
        'system_profiler',
      );
      // printenv/env/ps/lsof may print secrets in env; keep but they are read-only to the machine. Output is local only.

      /** programs whose output could be redirected harmfully are handled by redirect rules below. */
      function safeFind(args) {
        return !args.some((a) =>
          [
            '-delete',
            '-exec',
            '-execdir',
            '-ok',
            '-okdir',
            '-fprint',
            '-fprint0',
            '-fprintf',
            '-fls',
          ].includes(a),
        );
      }
      function safeSed(args) {
        return !args.some(
          (a) =>
            a === '-i' ||
            a.startsWith('-i') ||
            a === '--in-place' ||
            a === '-f' ||
            a === '--file' ||
            a === 'w' ||
            /(^|;|\s)[wWeE]\s/.test(a) ||
            (/\/[gI]*[we]\b/.test(a) && /s\//.test(a)),
        );
      }
      function safeAwk(args) {
        return (
          !args.some((a) =>
            /system\s*\(|getline\s*<|>\s*"|print\s*>|\|\s*"|-f\b/.test(a),
          ) && !args.includes('-f')
        );
      }
      function safeSort(args) {
        return !args.some(
          (a) => a === '-o' || a.startsWith('--output') || a.startsWith('-o'),
        );
      }
      function safeTree(args) {
        return !args.some((a) => a === '-o');
      }

      const GIT_READ = setOf(
        'status',
        'log',
        'diff',
        'show',
        'blame',
        'shortlog',
        'describe',
        'rev-parse',
        'rev-list',
        'ls-files',
        'ls-tree',
        'ls-remote',
        'cat-file',
        'grep',
        'remote',
        'config',
        'branch',
        'tag',
        'stash',
        'reflog',
        'for-each-ref',
        'show-ref',
        'name-rev',
        'merge-base',
        'whatchanged',
        'count-objects',
        'fsck',
        'check-ignore',
        'check-attr',
        'var',
        'version',
        'help',
        'diff-tree',
        'diff-index',
        'diff-files',
        'ls-remote',
        'show-branch',
        'verify-commit',
        'verify-tag',
        'worktree',
        'submodule',
        'fetch',
        'add',
        'restore',
        'commit',
        'switch',
        'checkout',
        'pull',
        'merge',
        'rebase',
        'cherry-pick',
        'mv',
        'apply',
        'format-patch',
        'archive',
        'bisect',
        'revert',
        'notes',
        'sparse-checkout',
        'maintenance',
        'gc',
        'prune',
        'rm',
        'init',
        'clone',
        'push',
      );
      // Which git sub-commands are acceptable without a human, and under which flags:
      function gitAllowed(sub) {
        const s = sub.name,
          r = sub.rest;
        const noFlags = (allowed) =>
          r.every((a) => !a.startsWith('-') || allowed.test(a));
        switch (s) {
          case 'status':
          case 'log':
          case 'diff':
          case 'show':
          case 'blame':
          case 'shortlog':
          case 'describe':
          case 'rev-parse':
          case 'rev-list':
          case 'ls-files':
          case 'ls-tree':
          case 'cat-file':
          case 'grep':
          case 'for-each-ref':
          case 'show-ref':
          case 'name-rev':
          case 'merge-base':
          case 'whatchanged':
          case 'count-objects':
          case 'check-ignore':
          case 'check-attr':
          case 'var':
          case 'version':
          case 'help':
          case 'diff-tree':
          case 'diff-index':
          case 'diff-files':
          case 'show-branch':
          case 'verify-commit':
          case 'verify-tag':
            return !r.some(
              (a) =>
                a === '--output' ||
                a.startsWith('--output=') ||
                a === '--ext-diff' ||
                (a === '--textconv' && false) ||
                a === '--open-files-in-pager' ||
                a.startsWith('--open-files-in-pager'),
            );
          case 'ls-remote':
            return r.every(
              (a) =>
                !a.startsWith('-') ||
                /^(--heads|--tags|--refs|-h|-t|--symref|--get-url)$/.test(a),
            );
          case 'fsck':
            return (
              r.every(
                (a) =>
                  !a.startsWith('-') ||
                  /^(--no-progress|--connectivity-only|--full|--strict|--unreachable|--lost-found)$/.test(
                    a,
                  ),
              ) && !r.includes('--lost-found')
            );
          case 'remote':
            return (
              r.length === 0 ||
              r[0] === '-v' ||
              r[0] === 'show' ||
              r[0] === 'get-url'
            );
          case 'config':
            return (
              r.some(
                (a) =>
                  a === '--get' ||
                  a === '--get-all' ||
                  a === '--list' ||
                  a === '-l' ||
                  a === '--get-regexp',
              ) &&
              !r.some((a) =>
                [
                  '--global',
                  '--system',
                  '--unset',
                  '--add',
                  '--replace-all',
                  '--edit',
                  '-e',
                  '--file',
                  '-f',
                ].includes(a),
              )
            );
          case 'branch':
            return (
              r.length === 0 ||
              r.every(
                (a) =>
                  [
                    '--list',
                    '-l',
                    '--show-current',
                    '-a',
                    '--all',
                    '-r',
                    '--remotes',
                    '-v',
                    '-vv',
                    '--verbose',
                    '--contains',
                    '--merged',
                    '--no-merged',
                  ].includes(a) ||
                  a.startsWith('--format=') ||
                  a.startsWith('--sort='),
              )
            );
          case 'tag':
            return (
              r.length === 0 ||
              r.every(
                (a) =>
                  ['-l', '--list', '-n'].includes(a) ||
                  a.startsWith('--sort=') ||
                  a.startsWith('--format=') ||
                  a === '--contains' ||
                  a === '--merged',
              ) ||
              r[0] === '-l' ||
              r[0] === '--list'
            );
          case 'stash':
            return r[0] === 'list' || r[0] === 'show';
          case 'reflog':
            return (
              r.length === 0 ||
              r[0] === 'show' ||
              r[0] === 'list' ||
              (r[0].startsWith('-') && !['expire', 'delete'].includes(r[0]))
            );
          case 'worktree':
            return r[0] === 'list';
          case 'submodule':
            return (
              r[0] === 'status' ||
              r[0] === 'summary' ||
              (r[0] === 'foreach' && false)
            );
          case 'notes':
            return r[0] === 'list' || r[0] === 'show';
          case 'bisect':
            return r[0] === 'log' || (r[0] === 'visualize' && false);
          // local, reversible, contained repo mutations (no remote effect, nothing is destroyed; git keeps the objects)
          case 'add':
            return (
              !r.some(
                (a) => a === '-f' || a === '--force' || a === '--ignore-errors',
              ) && !r.some((a) => touchesSecret(a))
            );
          case 'commit':
            return (
              !r.some(
                (a) =>
                  a === '--no-verify' ||
                  a === '-n' ||
                  a === '--no-gpg-sign' ||
                  a === '--amend' ||
                  a === '--allow-empty-message' ||
                  (a === '-C' && false),
              ) && !r.some((a) => touchesSecret(a))
            );
          case 'fetch':
            return !r.some(
              (a) =>
                a === '--prune' ||
                a === '-p' ||
                a === '--force' ||
                a === '-f' ||
                a === '--update-head-ok' ||
                a === '--upload-pack' ||
                a.startsWith('--upload-pack='),
            );
          case 'switch':
          case 'checkout':
            return (
              !r.some(
                (a) =>
                  a === '-f' ||
                  a === '--force' ||
                  a === '--discard-changes' ||
                  a === '--' ||
                  a === '--orphan' ||
                  (a === '-B' && false),
              ) && !r.includes('.')
            );
          case 'restore':
            return (
              r.includes('--staged') &&
              !r.includes('--worktree') &&
              !r.includes('-W')
            );
          case 'merge':
            return (
              r.includes('--no-commit') ||
              r.includes('--ff-only') ||
              r.includes('--abort') ||
              (r.includes('--no-ff') && false)
            );
          case 'cherry-pick':
          case 'revert':
            return (
              r.includes('--no-commit') ||
              r.includes('-n') ||
              r.includes('--abort') ||
              r.includes('--quit')
            );
          case 'rebase':
            return (
              r.includes('--abort') ||
              (r.includes('--continue') && false) ||
              r.includes('--quit')
            );
          case 'format-patch':
            return (
              !r.some(
                (a) =>
                  a === '-o' ||
                  a.startsWith('--output-directory') ||
                  (a === '--stdout' && false),
              ) || true
            );
          case 'archive':
            return !r.some(
              (a) =>
                a === '-o' ||
                a.startsWith('--output') ||
                a.startsWith('--remote'),
            );
          case 'mv':
            return !targetsOutside(r);
          case 'rm':
            return (
              r.includes('--cached') &&
              !r.some(
                (a) =>
                  a === '-f' ||
                  a === '--force' ||
                  a === '-r' ||
                  a === '-R' ||
                  a === '--',
              )
            );
          case 'init':
            return (
              !r.some(
                (a) =>
                  a.startsWith('--template') ||
                  a.startsWith('--separate-git-dir'),
              ) && !targetsOutside(r)
            );
          case 'clone':
            return false; // network + arbitrary hooks/code from elsewhere => ask
          case 'pull':
            return false; // merges remote code into the working tree => ask
          case 'push':
            return false; // shared state => ask (force/protected are hard-denied earlier)
          case 'apply':
            return (
              r.includes('--check') ||
              r.includes('--stat') ||
              r.includes('--numstat') ||
              r.includes('--summary')
            );
          case 'gc':
          case 'prune':
          case 'maintenance':
          case 'sparse-checkout':
            return false;
          default:
            return false;
        }
      }

      /** Package scripts and toolchains: contained to the project; run project code but that is what the user asked to do. */
      const SAFE_NPM_SCRIPTS = setOf(
        'test',
        'lint',
        'typecheck',
        'type-check',
        'build',
        'check',
        'format',
        'fmt',
        'format:check',
        'lint:fix',
        'coverage',
        'test:unit',
        'test:coverage',
        'test:e2e',
        'tsc',
        'compile',
        'validate',
        'verify',
        'docs',
        'dev:check',
      );
      function nodeAllowed(cmd, args) {
        const a = args.filter((x) => !x.startsWith('-'));
        if (['npm', 'pnpm', 'yarn', 'bun'].includes(cmd)) {
          const sub = a[0];
          if (
            [
              'ls',
              'list',
              'll',
              'why',
              'outdated',
              'view',
              'info',
              'show',
              'explain',
              'audit',
              'root',
              'bin',
              'prefix',
              'config',
              'pack',
            ].includes(sub)
          )
            return (
              sub !== 'config' || args.includes('get') || args.includes('list')
            );
          if (['test', 't', 'tst'].includes(sub)) return true;
          if (sub === 'run' || sub === 'run-script')
            return (
              SAFE_NPM_SCRIPTS.has(a[1]) ||
              /^(test|lint|build|typecheck|check|format)(:|$)/.test(a[1] || '')
            );
          if (cmd !== 'npm' && SAFE_NPM_SCRIPTS.has(sub)) return true; // pnpm test, yarn build, bun test …
          if (sub === 'install' || sub === 'i' || sub === 'ci') return false; // downloads + runs install scripts => ask
          return false;
        }
        if (cmd === 'npx' || cmd === 'pnpx')
          return (
            [
              'tsc',
              'eslint',
              'prettier',
              'vitest',
              'jest',
              'biome',
              'tsx' && false,
              'markdownlint',
              'stylelint',
              'knip',
              'depcheck',
            ].includes(a[0]) &&
            !args.some((x) => ['--fix', '-w', '--write'].includes(x) && false)
          );
        if (
          [
            'tsc',
            'eslint',
            'prettier',
            'vitest',
            'jest',
            'biome',
            'playwright',
            'cypress',
            'mocha',
            'ava',
            'tap',
            'stylelint',
            'markdownlint',
            'knip',
          ].includes(cmd)
        )
          return !args.some((x) =>
            ['--init', 'install', '--install'].includes(x),
          );
        if (['node', 'deno', 'bun'].includes(cmd))
          return ['--version', '-v', '--help', '-h'].includes(args[0]);
        if (['python', 'python3'].includes(cmd))
          return (
            ['--version', '-V', '--help', '-h'].includes(args[0]) ||
            (args[0] === '-m' &&
              [
                'pytest',
                'unittest',
                'mypy',
                'ruff',
                'black',
                'flake8',
                'pylint',
                'pyright',
                'compileall',
                'json.tool',
              ].includes(args[1]))
          );
        if (
          [
            'pytest',
            'mypy',
            'ruff',
            'black',
            'flake8',
            'pylint',
            'pyright',
            'isort',
            'tox',
            'nox',
            'coverage',
          ].includes(cmd)
        )
          return true;
        if (cmd === 'cargo')
          return [
            'build',
            'check',
            'test',
            'fmt',
            'clippy',
            'doc',
            'tree',
            'metadata',
            'bench',
            'version',
            '--version',
          ].includes(args[0]);
        if (cmd === 'go')
          return (
            [
              'build',
              'test',
              'vet',
              'fmt',
              'list',
              'version',
              'env',
              'mod',
            ].includes(args[0]) &&
            !(
              args[0] === 'mod' &&
              !['tidy', 'verify', 'graph', 'why'].includes(args[1])
            )
          );
        if (
          [
            'make',
            'just',
            'task',
            'gradle',
            'gradlew',
            'mvn',
            'mvnw',
            'ant',
          ].includes(cmd)
        )
          return (
            args.some((x) =>
              [
                'test',
                'check',
                'lint',
                'build',
                'compile',
                'verify',
                'typecheck',
                'fmt',
                'format',
              ].includes(x),
            ) &&
            !args.some((x) =>
              [
                'install',
                'deploy',
                'publish',
                'release',
                'clean',
                'upload',
                'push',
              ].includes(x),
            )
          );
        if (cmd === 'composer')
          return [
            'validate',
            'show',
            'outdated',
            'test',
            'lint',
            'check-platform-reqs',
          ].includes(args[0]);
        if (cmd === 'php' && args[0] === 'artisan')
          return [
            'test',
            'about',
            'route:list',
            'config:show',
            'list',
            '--version',
            'env',
            'model:show',
            'migrate:status',
            'schedule:list',
          ].includes(args[1]);
        if (cmd === 'php' || cmd === 'ruby' || cmd === 'perl')
          return ['--version', '-v'].includes(args[0]);
        if (cmd === 'artisan' || basename(cmd) === 'artisan')
          return [
            'test',
            'about',
            'route:list',
            'config:show',
            'list',
            '--version',
          ].includes(args[0]);
        return false;
      }

      /** HTTP reads: GET with no body/auth/cookies/output to a file, to a public https URL (never localhost/metadata/private). */
      function safeFetch(cmd, args) {
        if (!['curl', 'wget'].includes(cmd)) return false;
        const urls = args.filter((a) => /^https?:\/\//i.test(a));
        if (urls.length !== 1) return false;
        const flags = args.filter((a) => a.startsWith('-'));
        const allowed =
          cmd === 'curl'
            ? /^(-s|-S|-L|-I|--head|-f|--fail|--silent|--show-error|--location|--compressed|--max-time|-m|--connect-timeout|--retry|-sS|-sSL|-fsSL|-sL|-fsS|-4|-6|--no-progress-meter)$/
            : /^(-q|--quiet|-O-|-qO-|--spider|--no-verbose|-nv|--timeout|-T|--tries|-t)$/;
        if (
          !flags.every(
            (f) =>
              allowed.test(f) ||
              /^--(max-time|connect-timeout|retry|timeout|tries)=\d+$/.test(f),
          )
        )
          return false;
        if (
          cmd === 'wget' &&
          !args.some((a) => a === '-O-' || a === '-qO-' || a === '--spider')
        )
          return false; // wget writes files by default
        const host = (/^https?:\/\/([^/:?#]+)/i.exec(urls[0]) || [])[1] || '';
        if (
          /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[?::1|.*\.local$|.*\.internal$|metadata\.google\.internal)/i.test(
            host,
          )
        )
          return false;
        if (!/^https:/i.test(urls[0])) return false;
        return true;
      }

      /** sed/awk/etc. need arguments checked; other read-only commands need output-redirect control (handled by caller). */
      function segmentAllowed(w) {
        const cmd = basename(w[0]);
        const args = w.slice(1);
        if (cmd === 'git') {
          const sub = gitSub(args);
          if (!sub || gitHasUnsafeGlobals(sub.globals)) return false;
          return gitAllowed(sub);
        }
        if (cmd === 'find') return safeFind(args);
        if (cmd === 'sed') return safeSed(args);
        if (cmd === 'awk' || cmd === 'gawk' || cmd === 'mawk')
          return safeAwk(args);
        if (cmd === 'sort') return safeSort(args);
        if (cmd === 'tree') return safeTree(args);
        if (cmd === 'xargs') return false;
        if (cmd === 'gh') {
          const a = args.filter((x) => !x.startsWith('-'));
          const verb = a[1];
          if (a[0] === 'api') {
            return (
              !args.some((x) =>
                [
                  '-X',
                  '--method',
                  '-f',
                  '-F',
                  '--field',
                  '--raw-field',
                  '--input',
                ].includes(x),
              ) && !/(-X|--method)[ =]?(?!GET)/i.test(args.join(' '))
            );
          }
          if (
            [
              'pr',
              'issue',
              'run',
              'repo',
              'release',
              'workflow',
              'gist',
              'label',
              'cache',
              'project',
              'ruleset',
              'variable',
              'search',
              'status',
              'browse',
            ].includes(a[0])
          )
            return (
              ([
                'view',
                'list',
                'status',
                'diff',
                'checks',
                'download',
                'watch',
                'search',
              ].includes(verb) &&
                !(a[0] === 'run' && verb === 'download' && false)) ||
              a[0] === 'search' ||
              a[0] === 'status'
            );
          if (a[0] === 'auth' && a[1] === 'status') return true;
          return ['--version', 'version'].includes(a[0]);
        }
        if (READ_ONLY.has(cmd)) {
          if ((cmd === 'env' || cmd === 'printenv') && args.length === 0)
            return false; // dumps every secret in env into the transcript
          if (cmd === 'cd' || cmd === 'pushd')
            return !targetsOutside(args.slice(0, 1)) || true;
          if (
            cmd === 'cat' ||
            cmd === 'head' ||
            cmd === 'tail' ||
            cmd === 'less' ||
            cmd === 'more' ||
            cmd === 'bat' ||
            cmd === 'strings' ||
            cmd === 'xxd' ||
            cmd === 'hexdump' ||
            cmd === 'od'
          )
            return !args.some(touchesSecret);
          if (
            cmd === 'grep' ||
            cmd === 'rg' ||
            cmd === 'ag' ||
            cmd === 'egrep' ||
            cmd === 'fgrep'
          )
            return (
              !args.some(touchesSecret) &&
              !args.some(
                (a) =>
                  a === '--pre' || a.startsWith('--pre=') || a === '--exec',
              )
            );
          if (cmd === 'ps' || cmd === 'lsof' || cmd === 'top')
            return !args.some(
              (a) =>
                a === 'e' ||
                a === 'eww' ||
                (/e/.test(a) && /^-?[a-z]*ww/.test(a)),
            );
          return true;
        }
        if (nodeAllowed(cmd, args)) return true;
        if (safeFetch(cmd, args)) return true;
        if (cmd === 'mkdir' || cmd === 'touch')
          return !targetsOutside(args) && !args.some(touchesSecret); // contained, reversible
        if (cmd === 'cp')
          return (
            !targetsOutside(args) &&
            !args.some(touchesSecret) &&
            !args.some((a) => a === '-f' && false)
          );
        if (cmd === 'mv')
          return !targetsOutside(args) && !args.some(touchesSecret);
        if (cmd === 'ln') return false;
        if (cmd === 'tee')
          return args.every(
            (a) =>
              a.startsWith('-') || (!targetsOutside([a]) && !touchesSecret(a)),
          );
        if (cmd === 'jq' || cmd === 'yq')
          return !args.some((a) => a === '-i' || a === '--in-place');
        return false;
      }

      /** Where may a redirect write? Only inside the project (relative path, no ..), never a secret path, never a device. */
      function redirectAllowed(r) {
        const m =
          /^(\d?)(>>?|<|>&|<&)(.*)$/.exec(r) || /^(>>?|<|>&|<&)(.*)$/.exec(r);
        if (!m) return false;
        const op = m.length === 4 ? m[2] : m[1];
        const target = (m.length === 4 ? m[3] : m[2]) || '';
        if (op === '<' || op === '<&') return !touchesSecret(target);
        if (op === '>&') return /^\d$/.test(target) || target === '-'; // 2>&1
        if (target === '/dev/null') return true;
        if (
          !target ||
          target.startsWith('/') ||
          target.startsWith('~') ||
          target.includes('..') ||
          target.startsWith('/dev/') ||
          /\$/.test(target)
        )
          return false;
        return !touchesSecret(target);
      }

      /* ─────────────────────────── public API ─────────────────────────── */

      /**
       * Classify one shell command line.
       * @param {string} line
       * @returns {{ verdict: 'allow'|'ask'|'deny', reason: string }}
       */
      function classifyCommand(line) {
        if (typeof line !== 'string' || !line.trim())
          return { verdict: 'ask', reason: 'empty or unreadable command' };
        if (line.length > 4000)
          return { verdict: 'ask', reason: 'command too long to analyse' };
        const segs = parse(line);
        if (!segs)
          return {
            verdict: 'ask',
            reason:
              'uses substitution, here-doc or escaping that cannot be statically checked',
          };
        if (!segs.length) return { verdict: 'ask', reason: 'no command' };
        let askReason = null;
        for (let si = 0; si < segs.length; si++) {
          const seg = segs[si];
          const piped = si > 0 && segs[si - 1].op === '|';
          if (seg.op === '&') {
            askReason = askReason || 'background job';
          }
          const stripped = stripPrefix(seg.words);
          if (stripped === null)
            return {
              verdict: 'ask',
              reason:
                'sets an environment variable that changes how programs load/run',
            };
          if (!stripped.length) {
            // pure variable assignment e.g. FOO=bar
            continue;
          }
          const deny = hardDenySegment(stripped, { piped });
          if (deny) return { verdict: 'deny', reason: deny };
          for (const r of seg.redirects) {
            if (/^[\d]*>/.test(r) && !redirectAllowed(r)) {
              const target = r.replace(/^\d?>>?&?/, '');
              if (
                touchesSecret(target) ||
                target.startsWith('/') ||
                target.startsWith('~') ||
                target.includes('..')
              )
                return {
                  verdict: 'deny',
                  reason: `writes outside the project or to a protected path (${target})`,
                };
              askReason = askReason || `unusual redirect (${r})`;
            } else if (r.startsWith('<') && !redirectAllowed(r))
              return {
                verdict: 'deny',
                reason: 'reads a secret/credential file',
              };
          }
          if (!segmentAllowed(stripped))
            askReason =
              askReason || `not a known-safe command: ${basename(stripped[0])}`;
        }
        if (askReason) return { verdict: 'ask', reason: askReason };
        return {
          verdict: 'allow',
          reason: 'all parts are read-only or contained in the project',
        };
      }

      /** Escalation reason handling: what the model asks for in `sandbox_permissions`. */
      function classifyEscalation(reason, command) {
        const esc = /escalate sandbox to ([\w-]+)/i.exec(String(reason || ''));
        const requested = esc ? esc[1] : null;
        const net = /network|approval required|\[network:/i.test(
          String(reason || ''),
        );
        return { requested, network: net };
      }

      return { classifyCommand, classifyEscalation, parse };
    })();

    // ───────────────────────── auto-approve (composer dropdown) ─────────────────────────
    // Approval requests reach the client as `PendingApproval` objects ({ kind:'approval', toolName, callId,
    // reason, answerable, answer(outcome) }) via useSessionStatus().pendingInteraction.
    //
    // Tiers (modelled on Claude Code auto mode, but deterministic — no model call):
    //   1. read-only / inspection tools                       -> allow
    //   2. shell commands: CLASSIFY.classifyCommand(command)   -> allow | ask | deny
    //   3. sandbox escalations: read-only -> workspace-write only; full access / network -> ask
    // 'safe'       approves tier results of 'allow'; everything else waits for the human.
    // 'aggressive' approves everything EXCEPT hard 'deny' results, which still ask the human.
    // After 3 consecutive auto-decisions that had to be handed back to the human, auto-approval pauses for the
    // session (the agent is probably pushing against a boundary) until the user answers one request.
    const SAFE_TOOLS = new Set([
      'read',
      'read_image',
      'glob',
      'grep',
      'lsp',
      'todo_write',
      'skill',
      'web_search',
      'session_search',
      'session_trace',
      'session_event_read',
      'session_event_search',
      'session_event_trace',
      'list_agents',
      'list_subagent_models',
      'job_list',
      'job_output',
      'schedule_list',
      'terminal_list',
      'terminal_read',
      'get_goal',
      'cordis_inspect_list',
      'cordis_inspect_query',
      'cordis_inspect_self',
      'team_task_list',
      'team_task_get',
      'wait_agent',
      'ask_user_question',
    ]);
    const SECRET_ARG =
      /(^|[\/"' =])(\.ssh|\.aws|\.gnupg|\.env(\.[\w.-]+)?|id_(rsa|ed25519)|credentials|\.netrc|[\w.-]+\.(pem|key|p12))(["' \/]|$)/i;

    /** Command text of the tool call an approval belongs to (from the chat projection). */
    function commandFromChat(snapshot, callId) {
      if (!snapshot || !snapshot.nodes || callId == null) return undefined;
      for (const node of snapshot.nodes.values()) {
        const root =
          node.kind === 'tool-call' && node.data ? node.data.root : undefined;
        if (
          root &&
          String(root.callId) === String(callId) &&
          !('kind' in root) &&
          root.phase === 'start'
        ) {
          try {
            const a = JSON.parse(root.argsRaw);
            return typeof a.command === 'string' ? a.command : undefined;
          } catch (_) {
            return undefined;
          }
        }
      }
      return undefined;
    }

    /**
     * Decide one approval. `args` is the parsed tool arguments when known.
     * @returns {{verdict:'allow'|'ask'|'deny', reason:string}}
     */
    function decideApproval(p, command) {
      const tool = String(p.toolName || '');
      const reason = String(p.reason || '');
      const esc = CLASSIFY.classifyEscalation(reason);
      // The model's own justification text is NOT trusted as evidence ("reasoning-blind", like Claude Code's
      // classifier): only the sandbox level it asks for and the command itself decide.
      const askedFull = esc.requested === 'danger-full-access';
      const askedNet = esc.network; // set by the sandbox/permission layer for blocked network targets
      if (SAFE_TOOLS.has(tool))
        return { verdict: 'allow', reason: 'read-only tool' };
      if (
        tool === 'bash' ||
        tool === 'terminal_send' ||
        tool === 'terminal_open'
      ) {
        if (!command) return { verdict: 'ask', reason: 'command not visible' };
        const c = CLASSIFY.classifyCommand(command);
        if (c.verdict !== 'allow') return c; // deny / ask propagate unchanged
        // The command itself is read-only or project-contained. Asking for MORE sandbox than the command needs is
        // fine for reads (e.g. reading a CI log over the GitHub API), but a command that is only "allowed" because
        // it stays inside the project must not be granted network or full access it did not prove it needs.
        if ((askedFull || askedNet) && !isPureRead(command))
          return {
            verdict: 'ask',
            reason: 'asks for more access than a project-local command needs',
          };
        return c;
      }
      if (askedNet) return { verdict: 'ask', reason: 'network access' };
      if (askedFull)
        return {
          verdict: 'ask',
          reason: 'requests full filesystem/network access',
        };
      if (tool === 'write' || tool === 'edit') {
        const path = String(p.reason || '');
        if (SECRET_ARG.test(path))
          return { verdict: 'deny', reason: 'writes a secret/credential path' };
        return esc.requested === 'workspace-write'
          ? { verdict: 'allow', reason: 'edit inside the workspace' }
          : { verdict: 'ask', reason: 'file write' };
      }
      if (esc.requested === 'workspace-write')
        return { verdict: 'allow', reason: 'workspace-write escalation' };
      return { verdict: 'ask', reason: 'unknown tool' };
    }
    /** True when every segment is a pure read (no file writes, no installs): safe to run with wider sandbox access. */
    function isPureRead(command) {
      const segs = CLASSIFY.parse(command);
      if (!segs) return false;
      const MUTATING = new Set([
        'git',
        'npm',
        'pnpm',
        'yarn',
        'bun',
        'mkdir',
        'touch',
        'cp',
        'mv',
        'tee',
        'sed',
        'npx',
        'cargo',
        'go',
        'make',
        'pytest',
      ]);
      for (const seg of segs) {
        if (
          seg.redirects.some(
            (r) => /^\d?>>?[^&]/.test(r) && !/\/dev\/null$/.test(r),
          )
        )
          return false;
        const w = seg.words.filter((x) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(x));
        if (!w.length) continue;
        const cmd = w[0].split('/').pop();
        if (cmd === 'git') {
          const sub = w.slice(1).find((x) => !x.startsWith('-'));
          if (
            ![
              'status',
              'log',
              'diff',
              'show',
              'blame',
              'rev-parse',
              'rev-list',
              'merge-base',
              'ls-files',
              'ls-tree',
              'cat-file',
              'branch',
              'tag',
              'remote',
              'config',
              'fetch',
              'grep',
              'describe',
              'shortlog',
            ].includes(sub)
          )
            return false;
          continue;
        }
        if (cmd === 'gh') {
          if (
            !/^gh\s+(api\b(?!.*(-X|--method|-f|-F|--field|--input))|(pr|issue|run|repo|release|workflow|search|status)\s+(view|list|status|diff|checks|download|watch)|auth\s+status)/.test(
              w.join(' '),
            )
          )
            return false;
          continue;
        }
        if (cmd === 'curl') {
          if (
            w.some(
              (x) =>
                /^-(d|F|X|T|o|O|u|H)$/.test(x) ||
                x.startsWith('--data') ||
                x === '--output',
            )
          )
            return false;
          continue;
        }
        if (MUTATING.has(cmd)) return false;
      }
      return true;
    }
    const RISKY_TEXT =
      /danger-full-access|sudo|rm\s+-[a-z]*r|force[- ]push|--force|mkfs|dd\s+if=|DROP\s+TABLE|\.ssh/i;

    function modeFor(sessionId) {
      return (store.get().autoApprove || {})[sessionId] || 'ask';
    }
    function setModeFor(sessionId, mode) {
      const next = { ...(store.get().autoApprove || {}) };
      if (mode === 'ask') delete next[sessionId];
      else next[sessionId] = mode;
      store.set({ autoApprove: next });
    }

    /**
     * Invisible per-session component (rendered in a session-scoped slot, so it has `sessionId` and `useChat`):
     * answers THIS session's pending approvals according to the session's mode.
     */
    function AutoApprover({ sessionId, useSessionStatus, useChat, t }) {
      const pending = useSessionStatus((m) => {
        const st = m.get(sessionId);
        return st ? st.pendingInteraction : undefined;
      });
      const chat = useChat((snap) => snap);
      const modes = useSetting('autoApprove');
      const handled = React.useRef(new Set());
      const handedBack = React.useRef(0);
      const [tick, setTick] = React.useState(0);
      React.useEffect(() => {
        const p = pending;
        if (
          !p ||
          p.kind !== 'approval' ||
          !p.answerable ||
          typeof p.answer !== 'function'
        )
          return;
        if (handled.current.has(p.key)) return;
        const mode = modes[sessionId] || 'ask';
        if (mode === 'ask') return;
        const command = commandFromChat(chat, p.callId);
        // the tool-call row may land a moment after the approval: give it one short retry before deciding
        if (p.toolName === 'bash' && command === undefined && tick < 3) {
          const h2 = setTimeout(() => setTick((x) => x + 1), 120);
          return () => clearTimeout(h2);
        }
        const d = decideApproval(p, command);
        const approve =
          mode === 'aggressive' ? d.verdict !== 'deny' : d.verdict === 'allow';
        handled.current.add(p.key);
        setTick(0);
        if (!approve) {
          handedBack.current += 1;
          if (handedBack.current >= 3) {
            setModeFor(sessionId, 'ask');
            handedBack.current = 0;
            showToast(t('ap.paused'));
          }
          return;
        }
        handedBack.current = 0;
        Promise.resolve(p.answer('allowed-once')).then(
          () =>
            showToast(
              fmt(t('ap.toast'), {
                tool: command ? command.split(/\s+/)[0] : p.toolName || '',
              }),
            ),
          () => handled.current.delete(p.key),
        );
        if (handled.current.size > 200) handled.current.clear();
      }, [pending, chat, modes, tick, sessionId, t]);
      return null;
    }

    /** Composer-bar dropdown (same look as the permission control next to it). */
    function AutoApproveSelect({ sessionId, locked, t }) {
      const modes = useSetting('autoApprove');
      const mode = modes[sessionId] || 'ask';
      const [open, setOpen] = React.useState(false);
      const ref = React.useRef(null);
      const Menu = primitives.Menu,
        Chevron = primitives.IconChevronDownOutlineRegular;
      if (!sessionId) return null;
      const items = AP_MODES.map((id) => ({ id, label: t('ap.' + id) }));
      const choose = (id) => {
        setOpen(false);
        if (id === mode) return;
        if (id === 'aggressive' && !window.confirm(t('ap.confirm'))) return;
        setModeFor(sessionId, id);
      };
      const trigger = h(
        'button',
        {
          ref,
          type: 'button',
          disabled: !!locked,
          className: 'waycraft-ap-trigger',
          'data-mode': mode,
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-label': t('ap.aria'),
          title: t('ap.aria'),
          onClick: () => setOpen((v) => !v),
        },
        h('span', { className: 'waycraft-ap-dot', 'aria-hidden': 'true' }),
        h('span', { className: 'waycraft-ap-label' }, t('ap.' + mode)),
        Chevron ? h(Chevron, { size: 12 }) : '▾',
      );
      if (!Menu) return trigger;
      return h(Menu, {
        open,
        onClose: () => setOpen(false),
        items,
        selectedId: mode,
        onSelect: choose,
        side: 'top',
        align: 'start',
        portal: true,
        anchor: trigger,
      });
    }

    // ───────────────────────── app-UI font size + font source ─────────────────────────
    // Only TEXT grows: we read DSH's own stylesheets (<style data-plugin-css>) and, for every
    // rule that sets a px font-size / line-height, emit an override
    //   calc(<original px> + var(--waycraft-ui-d))      (d = chosen size - 14, in px)
    // so spacing, icons and borders are untouched. Chat transcript sheets are skipped because
    // the built-in "chat font size" already drives them.
    const SKIP_SHEETS =
      /(AssistantMarkdown|MessageItem|ChatView|ToolDetails|ToolRow|bash-sample|FileDiff|TextPreview|TrajectoryTable|stat-dialog)\.module\.css$/;
    const PX = /^(-?\d*\.?\d+)px$/;
    // Additive, like DSH's own chat font size: size' = size + (chosen - 14)px, so the chrome's 14px body text
    // becomes exactly the chosen number. `--waycraft-ui-d` carries that difference.
    // Sizes bound to DSH's chat-size variables follow the CHAT font size; they are only re-based onto the
    // UI size in shell sheets (<link> bundles), where they style app chrome such as menus.
    const CONTENT_VAR = /^(?:var|calc|min|max)\(.*--dsh-content-font-size.*\)$/;
    const scaled = (v, shell) => {
      const t = String(v)
        .trim()
        .replace(/\s*!important$/, '');
      const m = PX.exec(t);
      if (m) return `calc(${m[1]}px + var(--waycraft-ui-d))`;
      if (shell && CONTENT_VAR.test(t)) {
        // evaluate the chat variables at their 14px defaults, then add the UI delta
        const base = t
          .replace(
            /var\(--dsh-content-font-size-secondary\s*,\s*([\d.]+px)\)/g,
            '$1',
          )
          .replace(/var\(--dsh-content-font-size\s*,\s*([\d.]+px)\)/g, '$1');
        return `calc((${base}) + var(--waycraft-ui-d))`;
      }
      return null;
    };
    // `font: [style] [weight] <size>[/<line-height>] <family>` — pull out a px size / px line-height.
    const FONT_SHORTHAND =
      /^(.*?)(?:^|\s)(-?\d*\.?\d+px)(?:\s*\/\s*(-?\d*\.?\d+px|[\d.]+|normal))?\s+(\S.*)$/;

    function declFor(style, shell) {
      let fs = scaled(style.getPropertyValue('font-size'), shell);
      let lh = scaled(style.getPropertyValue('line-height'));
      const sh = style.getPropertyValue('font');
      if (sh && !fs) {
        // shorthand carries size (+ optional line-height)
        const m = FONT_SHORTHAND.exec(sh.trim());
        if (m) {
          fs = scaled(m[2]);
          if (m[3] && PX.test(m[3])) lh = lh || scaled(m[3]);
        }
      }
      return (
        (fs ? `font-size:${fs}!important;` : '') +
        (lh ? `line-height:${lh}!important;` : '')
      );
    }
    function overridesFromRules(rules, wrap, out, shell) {
      for (const rule of rules) {
        if (rule.type === 1 /* STYLE */) {
          const decl = declFor(rule.style, shell);
          if (decl) out.push(wrap(`${rule.selectorText}{${decl}}`));
        } else if (rule.type === 4 /* MEDIA */) {
          const cond = rule.conditionText || rule.media.mediaText;
          overridesFromRules(
            rule.cssRules,
            (t) => wrap(`@media ${cond}{${t}}`),
            out,
            shell,
          );
        } else if (rule.type === 12 /* SUPPORTS */) {
          overridesFromRules(
            rule.cssRules,
            (t) => wrap(`@supports ${rule.conditionText}{${t}}`),
            out,
            shell,
          );
        }
      }
    }
    // Chat-transcript sheets are skipped (the built-in chat font size drives them).
    // Plugin sheets are <style data-plugin-css>; the app shell and shared primitives (Menu, popovers,
    // account menu...) live in <link rel=stylesheet> bundles, so those are scanned too.
    // Generated sheets of ours must never be re-scanned (it would compound the scale).
    const OWN_GENERATED = [
      'data-waycraft-appearance',
      'data-waycraft-ui-font',
      'data-waycraft-bidi',
      'data-waycraft-settings',
      'data-waycraft-toast-style',
    ];
    function isOwnGenerated(el) {
      return OWN_GENERATED.some((a) => el.hasAttribute(a));
    }
    // Skin/theme/chat-reading sheets that should keep their own sizes.
    const SKIP_TAGS = /\[data-genui|genui-dom-fence/;
    function sheetEligible(el) {
      if (!el.sheet || isOwnGenerated(el)) return false;
      if (el.tagName === 'STYLE' && el.hasAttribute('data-plugin-css'))
        return !SKIP_SHEETS.test(el.dataset.pluginCss || '');
      // Everything else: plugin-authored <style> blocks (skills-manager, vision toolkit, better-sidebar,
      // permission-rules...), our own settings rows, and <link> bundles. GenUI's block sheet is skipped:
      // generated UI inside answers is chat content and follows the chat font size.
      if (
        el.tagName === 'STYLE' &&
        /V1MMBW|_block\{|data-genui/.test((el.textContent || '').slice(0, 4000))
      )
        return false;
      return el.tagName === 'STYLE' || el.tagName === 'LINK';
    }
    // `font: var(--dsw-font-xs-13)` shorthands carry their size inside DSH's design tokens, which a
    // per-rule override can't see. Re-declare the non-markdown tokens on <body> with the factor applied;
    // every rule that references them (57 in DSH itself) then scales with no per-rule override.
    const TOKEN_RE = /(--dsw-font-(?!markdown|family)[\w-]+)\s*:\s*([^;}]+)/g;
    function collectFontTokens() {
      const found = new Map();
      for (const el of document.querySelectorAll(
        'style, link[rel~="stylesheet"]',
      )) {
        if (!el.sheet || isOwnGenerated(el)) continue;
        let text = '';
        try {
          for (const r of el.sheet.cssRules)
            if (
              r.type === 1 &&
              /(^|,)\s*(:root|body|html)\b/.test(r.selectorText || '')
            )
              text += r.cssText + '\n';
        } catch (_) {
          continue;
        }
        for (const m of text.matchAll(TOKEN_RE)) found.set(m[1], m[2].trim());
      }
      return found;
    }
    function buildTokenOverrides() {
      const lines = [];
      for (const [name, value] of collectFontTokens()) {
        const sized =
          name.endsWith('-font-size') || name.endsWith('-line-height');
        if (sized) {
          const v = scaled(value);
          if (v) lines.push(`${name}:${v};`);
          continue;
        }
        // composite token `weight size/line family` -> rebuild with scaled size (and line-height when px)
        const m =
          /^(.*?)(?:^|\s)(-?\d*\.?\d+px)(?:\s*\/\s*(-?\d*\.?\d+px))?\s+(\S.*)$/.exec(
            value,
          );
        if (m)
          lines.push(
            `${name}:${m[1] ? m[1] + ' ' : ''}${scaled(m[2])}${m[3] ? '/' + scaled(m[3]) : ''} ${m[4]};`,
          );
      }
      return lines.length ? `body{${lines.join('')}}` : '';
    }
    function buildFontSizeOverrides() {
      const out = [];
      document
        .querySelectorAll('style, link[rel~="stylesheet"]')
        .forEach((el) => {
          if (!sheetEligible(el)) return;
          try {
            overridesFromRules(
              el.sheet.cssRules,
              (t) => t,
              out,
              el.tagName === 'LINK',
            );
          } catch (_) {
            /* cross-origin sheet */
          }
        });
      const tok = buildTokenOverrides();
      return out.join('\n') + (tok ? '\n' + tok : '');
    }

    // The OS UI font, with emoji/symbol fonts so emoji render natively (same stack as the system font in browsers).
    const SYSTEM_FONT_STACK =
      '-apple-system-body, ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';
    const NATIVE_FALLBACK = SYSTEM_FONT_STACK;
    let fontFaceStyle = null,
      loadedFont = null;
    /** Inject @font-face rules for one bundled font (all its subsets; the browser downloads only what is used). */
    function ensureFontFaces(key) {
      if (loadedFont === key) return;
      removeFontFaces();
      const family = BUNDLED_FONTS[key] && BUNDLED_FONTS[key].family;
      if (!family) return;
      const rules = FONT_FACES.filter((f) => f.f === family).map(
        (f) =>
          `@font-face{font-family:"${f.f}";font-style:normal;font-display:swap;font-weight:${f.w};` +
          `src:url("${FONT_ROUTE}${f.u}") format("woff2");unicode-range:${f.r}}`,
      );
      fontFaceStyle = document.createElement('style');
      fontFaceStyle.setAttribute('data-waycraft-fontfaces', '');
      fontFaceStyle.textContent = rules.join('\n');
      document.head.appendChild(fontFaceStyle);
      loadedFont = key;
    }
    function removeFontFaces() {
      if (fontFaceStyle) {
        fontFaceStyle.remove();
        fontFaceStyle = null;
      }
      loadedFont = null;
    }
    /** Font-family value for the current setting, or null for "DSH default" (leave DSH untouched). */
    function fontStackFor(source) {
      if (source === 'system') return SYSTEM_FONT_STACK;
      if (BUNDLED_FONTS[source])
        return `"${BUNDLED_FONTS[source].family}", ${NATIVE_FALLBACK}`;
      return null;
    }
    // Variables that carry the UI typeface. DSH defines --dsw-font-family on <body> itself, and skins
    // such as dsh-claude-style redefine it (and their own --dsh-claude-font-*) with higher specificity,
    // so a stylesheet rule can lose. Inline `!important` on <body> beats every stylesheet rule, and
    // because the markdown/typography tokens are also defined on <body>, they pick the value up too.
    const FONT_VARS = [
      '--dsw-font-family',
      '--dsw-font-family-brand',
      '--dsh-font-family-text-default',
      '--dsh-claude-font-serif',
      '--dsh-claude-font-prose',
      '--dsh-claude-font-brand',
    ];
    function applyFontFamily(s) {
      const style = document.body && document.body.style;
      if (!style) return;
      const stack = fontStackFor(s.fontSource);
      if (BUNDLED_FONTS[s.fontSource]) ensureFontFaces(s.fontSource);
      else removeFontFaces();
      for (const name of FONT_VARS) {
        if (stack !== null) {
          if (
            style.getPropertyValue(name) !== stack ||
            style.getPropertyPriority(name) !== 'important'
          ) {
            style.setProperty(name, stack, 'important');
          }
        } else if (
          style.getPropertyPriority(name) === 'important' &&
          ownedValues().has(style.getPropertyValue(name))
        ) {
          style.removeProperty(name);
        }
      }
    }
    /** Every value this plugin may have written, so "DSH default" removes only our own overrides. */
    function ownedValues() {
      const set = new Set([SYSTEM_FONT_STACK]);
      for (const k of Object.keys(BUNDLED_FONTS)) set.add(fontStackFor(k));
      return set;
    }

    // ───────────────────────── RTL: persian-rtl chat CSS + genui mirroring ───
    const CHAT_CSS = `
/* dsh-persian-rtl: automatic per-paragraph direction for Persian text.
   unicode-bidi: plaintext makes EACH paragraph follow its own first strong
   character: Persian paragraphs go RTL, English ones stay LTR.
   Covered surfaces:
   - assistant answers, incl. while streaming (assistant-step)
   - thinking/reasoning cells (turn-process members + inline reasoning)
   - tool-call / tool-result cells (any data-tool row incl. ask_user_question)
   - question boxes + plan-review cards (composer takeover cards)
   - user + steering message bubbles (incl. submit echoes)
   Plus logical-geometry fixes (lists, blockquotes, task checkboxes) so RTL
   paragraphs also get correctly-sided bullets, quote bars and gaps. */
/* A. Prose blocks: per-paragraph direction, logical alignment. */
[data-chat-flow-kind="assistant-step"] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-chat-flow-kind="tool-call"] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-chat-flow-kind="tool-result"] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-chat-flow-kind="reasoning"] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-turn-process-member] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-turn-process-inline] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-tool] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary),
[data-question-key] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, span),
[data-plan-review-key] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, span),
[data-question-key],
[data-plan-review-key] {
  unicode-bidi: plaintext;
  text-align: start;
}
/* Option buttons ship text-align:left (physical): Persian labels would stick
   to the left. Scoped to the radiogroup/group options so footer/action
   buttons keep their own alignment. */
[data-question-key] :is([role="radiogroup"], [role="group"]) button {
  text-align: start;
}
/* B. User + steering bubbles: plain-text content lives directly in nested
   divs (no <p>), so the direction must be set on the divs themselves.
   Includes composer submit echoes, which reuse the same bubble outside
   the chat flow. Flex layout is untouched (text-align only aligns inline
   content; row/stack alignment stays with align-items). */
[data-chat-flow-kind="user"] :is(div),
[data-chat-flow-kind="steering"] :is(div),
[data-submission-echo],
[data-submission-echo] :is(div),
[data-pending-steering],
[data-pending-steering] :is(div) {
  unicode-bidi: plaintext;
  text-align: start;
}
/* C. Latin runs (code, keys) keep LTR order inside Persian text; links are
   isolated so surrounding punctuation does not jump, while Persian link
   text still follows its paragraph. */
[data-chat-flow-kind="assistant-step"] :is(pre, code, kbd, samp),
[data-chat-flow-kind="tool-call"] :is(pre, code, kbd, samp),
[data-chat-flow-kind="tool-result"] :is(pre, code, kbd, samp),
[data-chat-flow-kind="reasoning"] :is(pre, code, kbd, samp),
[data-turn-process-member] :is(pre, code, kbd, samp),
[data-turn-process-inline] :is(pre, code, kbd, samp),
[data-tool] :is(pre, code, kbd, samp),
[data-question-key] :is(pre, code, kbd, samp),
[data-plan-review-key] :is(pre, code, kbd, samp) {
  direction: ltr;
  unicode-bidi: isolate;
}
[data-chat-flow-kind="assistant-step"] :is(a),
[data-chat-flow-kind="tool-call"] :is(a),
[data-chat-flow-kind="tool-result"] :is(a),
[data-chat-flow-kind="reasoning"] :is(a),
[data-turn-process-member] :is(a),
[data-turn-process-inline] :is(a),
[data-tool] :is(a),
[data-question-key] :is(a),
[data-plan-review-key] :is(a) {
  unicode-bidi: isolate;
}
[data-chat-flow-kind="assistant-step"] :is(pre),
[data-chat-flow-kind="tool-call"] :is(pre),
[data-chat-flow-kind="tool-result"] :is(pre),
[data-turn-process-member] :is(pre),
[data-turn-process-inline] :is(pre),
[data-tool] :is(pre),
[data-question-key] :is(pre),
[data-plan-review-key] :is(pre) {
  text-align: left;
}
/* D. Logical geometry: shipped sheets use physical left padding/border for
   lists, blockquotes and task checkboxes, which puts RTL bullets, quote
   bars and gaps on the wrong side. Swap to inline-start equivalents. */
[data-chat-flow-kind="assistant-step"] :is(ul, ol),
[data-chat-flow-kind="tool-call"] :is(ul, ol),
[data-chat-flow-kind="tool-result"] :is(ul, ol),
[data-turn-process-member] :is(ul, ol),
[data-turn-process-inline] :is(ul, ol),
[data-tool] :is(ul, ol),
[data-question-key] :is(ul, ol),
[data-plan-review-key] :is(ul, ol) {
  padding-left: 0;
  padding-inline-start: 18px;
}
[data-chat-flow-kind="assistant-step"] :is(ul, ol) :is(ol),
[data-chat-flow-kind="tool-call"] :is(ul, ol) :is(ol),
[data-chat-flow-kind="tool-result"] :is(ul, ol) :is(ol),
[data-turn-process-member] :is(ul, ol) :is(ol),
[data-turn-process-inline] :is(ul, ol) :is(ol),
[data-tool] :is(ul, ol) :is(ol),
[data-question-key] :is(ul, ol) :is(ol),
[data-plan-review-key] :is(ul, ol) :is(ol) {
  padding-inline-start: 0;
}
[data-chat-flow-kind="assistant-step"] :is(blockquote),
[data-chat-flow-kind="tool-call"] :is(blockquote),
[data-chat-flow-kind="tool-result"] :is(blockquote),
[data-turn-process-member] :is(blockquote),
[data-turn-process-inline] :is(blockquote),
[data-tool] :is(blockquote),
[data-question-key] :is(blockquote),
[data-plan-review-key] :is(blockquote) {
  border-left: 0 !important;
  padding-left: 0 !important;
  border-inline-start: 2px solid var(--dsw-alias-label-caption);
  padding-inline-start: 14px;
}
[data-chat-flow-kind="assistant-step"] :is(input[type="checkbox"]),
[data-tool] :is(input[type="checkbox"]),
[data-question-key] :is(input[type="checkbox"]),
[data-plan-review-key] :is(input[type="checkbox"]) {
  margin: 0 !important;
  margin-inline-end: 8px !important;
}
/* E. Detected RTL: elements marked with data-dsh-rtl / dir="rtl".
   Overrides unicode-bidi: plaintext so that paragraphs starting with Latin
   words (e.g. "React یک کتابخانه است") are strictly resolved as RTL base
   direction instead of being treated as LTR by first-strong-character rules. */
[data-dsh-rtl],
:is(p, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, div)[data-dsh-rtl],
:is(p, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, div)[dir="rtl"] {
  direction: rtl !important;
  unicode-bidi: isolate !important;
  text-align: start !important;
}
`;

    // GenUI ships CSS-module classes (hash_name). We match by the stable name part.
    const c = (...names) =>
      ':is(' +
      names.map((n) => `[class$="_${n}"],[class*="_${n} "]`).join(',') +
      ')';
    const R = '[data-genui-rtl]';

    const GENUI_CSS = `
/* dsh-genui-rtl: mirrors @changfenhuang/dsh-genui components when a block is RTL.
   A block gets [data-genui-rtl] + dir="rtl" from the client script when its text is mostly RTL. */

/* 1. Physical text-align -> logical */
${R} :is(${[
      'thNum',
      'tdNum',
      'hbarLabel',
      'hbarValue',
      'cellBarText',
      'sliderValue',
    ]
      .map((n) => c(n))
      .join(',')}) { text-align: end; }
${R} :is(${[
      'thSort',
      'detailToggle',
      'accHead',
      'quizOpt',
      'quizOptCorrect',
      'quizOptWrong',
      'quizOptReveal',
      'ftNameBtn',
    ]
      .map((n) => c(n))
      .join(',')}) { text-align: start; }
${R} ${c('thNum')} ${c('thSort')} { text-align: end; }
${R} table th, ${R} table td { text-align: start; }
${R} table th${c('thNum')}, ${R} table td${c('tdNum')} { text-align: end; }

/* 2. Lists: dot + padding */
${R} ${c('li')} { padding: 9px 16px 9px var(--dsl-g-gap-xs); }
${R} ${c('li')}::before { left: auto; right: 2px; }

/* 3. Steps connector */
${R} ${c('step')}:not(:last-child)::before { left: auto; right: 11px; }

/* 4. Stat cards: divider border */
${R} ${c('grid')} > ${c('stat')}, ${R} ${c('row')} > ${c('stat')} {
  border-left-color: var(--dsl-g-border-surface);
  border-right-color: var(--dsl-g-border);
}

/* 5. margin-left:auto -> push to the end side */
${R} :is(${['heroSpark', 'tlTime', 'panelChevron'].map((n) => c(n)).join(',')}) {
  margin-left: 0; margin-right: auto;
}
${R} :is(${['btnSent'].map((n) => c(n)).join(',')}) { margin-left: 0; margin-right: var(--dsl-g-gap-sm); }
${R} ${c('detailToggle')} { margin-right: 0; margin-left: 4px; }
${R} ${c('groupToggle')} { margin-right: 0; margin-left: 7px; }
${R} ${c('panelClose')} { margin-right: 0; margin-left: 8px; }
${R} ${c('panelTpl')} { margin-right: 0; margin-left: 4px; }
${R} ${c('detailCell')} { padding-left: 0; padding-right: var(--dsl-g-gap-sm); }
${R} ${c('detailBody')} { box-shadow: inset -2px 0 0 color-mix(in srgb, var(--dsl-g-accent) 45%, transparent); }

/* 6. Grouped table children guide rail */
${R} tbody tr${c('groupChild')} td:first-child { padding-left: var(--dsl-g-gap-md); padding-right: calc(var(--dsl-g-gap-md) + 22px); }
${R} tbody tr${c('groupChild')} td:first-child::before { left: auto; right: calc(var(--dsl-g-gap-md) + 8px); }

/* 7. Switch knob */
${R} ${c('switchKnob')} { left: auto; right: 3px; transition: right var(--dsl-g-dur-fast); }
${R} ${c('switchOn')} ${c('switchKnob')} { left: auto; right: 19px; }

/* 8. Chevrons point toward the reading direction */
${R} :is(${['accChevron', 'detailChevron', 'groupChevron', 'ftChevron'].map((n) => c(n)).join(',')}):not([data-open="true"]) {
  transform: scaleX(-1);
}

/* 9. Progress target marker + file tree (inline left -> mirrored via vars set by script) */
${R} ${c('targetMark')} { left: auto !important; right: var(--dsh-rtl-start, 0); margin-left: 0; margin-right: -1px; }
${R} ${c('ftRow')} { padding-left: 4px !important; padding-right: var(--dsh-rtl-start, 4px) !important; }
${R} ${c('ftGuide')} { left: auto !important; right: var(--dsh-rtl-start, 0); }

/* 10. Panel + fixed toasts */
[data-genui-achievement-toasts] { right: auto; left: 16px; }

/* 11. Content that must stay geometrically LTR: charts, diagrams, 3D, math, code. */
${R} :is([data-genui-chart], [data-genui-line], [data-genui-donut], [data-genui-echart],
  [data-genui-mermaid], [data-genui-scene3d], [data-genui-scene], [data-genui-plot],
  [data-genui-svg], [data-genui-svg-fence], [data-genui-diagram], svg, canvas) {
  direction: ltr;
}
${R} :is([data-genui-chart], [data-genui-line], [data-genui-donut], [data-genui-echart],
  [data-genui-plot], [data-genui-diagram]) :is(span, div, text, p) { unicode-bidi: plaintext; }
${R} :is(pre, code, kbd, samp, ${c('copyChip')}) { direction: ltr; unicode-bidi: isolate; text-align: left; }
${R} :is(input[type="text"], input[type="number"], input[type="email"], input[type="url"], textarea) {
  unicode-bidi: plaintext; text-align: start;
}
`;

    const PROSE_SELECTOR =
      'p, li, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption, label, summary, [data-question-key] span, [data-plan-review-key] span';
    const USER_BUBBLE_CONTAINERS =
      '[data-chat-flow-kind="user"], [data-chat-flow-kind="steering"], [data-submission-echo], [data-pending-steering]';

    function updateElementDirection(el) {
      if (!el || el.nodeType !== 1) return;
      if (
        el.tagName === 'PRE' ||
        el.tagName === 'CODE' ||
        el.tagName === 'KBD' ||
        el.tagName === 'SAMP'
      )
        return;
      if (el.closest('pre, code, kbd, samp')) return;

      const isRtl = checkRtl(el.textContent);
      const hadRtl = el.hasAttribute('data-dsh-rtl');

      if (isRtl && !hadRtl) {
        el.setAttribute('data-dsh-rtl', '');
        el.setAttribute('dir', 'rtl');
      } else if (!isRtl && hadRtl) {
        el.removeAttribute('data-dsh-rtl');
        el.removeAttribute('dir');
      }
    }

    function findTargets(node, set) {
      if (!node || node.nodeType !== 1) return;
      if (
        node.tagName === 'PRE' ||
        node.tagName === 'CODE' ||
        node.tagName === 'KBD' ||
        node.tagName === 'SAMP'
      )
        return;
      if (node.closest('pre, code, kbd, samp')) return;

      if (node.matches(PROSE_SELECTOR)) {
        set.add(node);
      } else {
        const ancestor = node.closest(PROSE_SELECTOR);
        if (ancestor && !ancestor.closest('pre, code, kbd, samp')) {
          set.add(ancestor);
        }
      }

      const children = node.querySelectorAll(PROSE_SELECTOR);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child.closest('pre, code, kbd, samp')) {
          set.add(child);
        }
      }

      const bubble = node.closest(USER_BUBBLE_CONTAINERS);
      if (bubble) {
        const divs = bubble.querySelectorAll('div');
        for (let i = 0; i < divs.length; i++) {
          const d = divs[i];
          if (!d.querySelector('div, p, ul, ol') && d.textContent.trim()) {
            set.add(d);
          }
        }
      } else {
        const nestedBubbles = node.querySelectorAll(USER_BUBBLE_CONTAINERS);
        for (let i = 0; i < nestedBubbles.length; i++) {
          const divs = nestedBubbles[i].querySelectorAll('div');
          for (let j = 0; j < divs.length; j++) {
            const d = divs[j];
            if (!d.querySelector('div, p, ul, ol') && d.textContent.trim()) {
              set.add(d);
            }
          }
        }
      }
    }

    // genui detector
    const ROOT_SEL =
      '[data-genui], [data-genui-plot], [data-genui-panel], [data-genui-tool]';

    function genuiTextOf(root) {
      // Ignore code blocks so a Persian answer with long code is still RTL.
      let t = '';
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          const p = n.parentElement;
          return p && p.closest('pre, code, script, style')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        },
      });
      while (w.nextNode()) t += w.currentNode.nodeValue + ' ';
      return t;
    }

    function parseStart(el) {
      // Original inline physical offset (left / padding-left / left %) that we mirror to the end side.
      const s = el.style;
      const v = s.left || s.paddingLeft;
      return v || '';
    }

    function genuiSyncVars(root, on) {
      const sel = `${c('targetMark')}, ${c('ftRow')}, ${c('ftGuide')}`;
      root.querySelectorAll(sel).forEach((el) => {
        if (!on) {
          el.style.removeProperty('--dsh-rtl-start');
          return;
        }
        // Cache the original value: after our CSS runs, React still keeps the inline original.
        const v = parseStart(el);
        if (v) el.style.setProperty('--dsh-rtl-start', v);
      });
    }

    function updateGenui(root) {
      if (!root.isConnected) return;
      const on = isRtlText(genuiTextOf(root));
      const has = root.hasAttribute('data-genui-rtl');
      if (on && !has) {
        root.setAttribute('data-genui-rtl', '');
        root.setAttribute('dir', 'rtl');
        root.setAttribute('data-genui-rtl-dir', '1');
      } else if (!on && has) {
        root.removeAttribute('data-genui-rtl');
        if (root.hasAttribute('data-genui-rtl-dir')) {
          root.removeAttribute('dir');
          root.removeAttribute('data-genui-rtl-dir');
        }
      }
      genuiSyncVars(root, on);
    }

    const RTL_RE =
      /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    const LTR_RE = /[a-zA-Z\u00C0-\u024F]/g;
    function isRtlText(text) {
      if (!text) return false;
      const rtl = text.match(RTL_RE);
      if (!rtl) return false;
      const ltr = text.match(LTR_RE);
      return rtl.length / (rtl.length + (ltr ? ltr.length : 0)) >= 0.2;
    }

    const checkRtl = isRtlText;

    /** Start the bidi engine; returns a stop() that removes every trace. */
    function startBidi() {
      const style = document.createElement('style');
      style.setAttribute('data-waycraft-bidi', '');
      style.textContent = CHAT_CSS + GENUI_CSS;
      document.head.appendChild(style);

      const chatQueue = new Set();
      const genuiQueue = new Set();
      let raf = null;
      const flush = () => {
        raf = null;
        for (const el of chatQueue)
          if (el.isConnected) updateElementDirection(el);
        chatQueue.clear();
        for (const el of genuiQueue) updateGenui(el);
        genuiQueue.clear();
      };
      const schedule = () => {
        if (raf === null) raf = requestAnimationFrame(flush);
      };
      const GENUI_ROOTS =
        '[data-genui], [data-genui-plot], [data-genui-panel], [data-genui-tool]';
      const collectGenui = (node) => {
        const el = node.nodeType === 1 ? node : node.parentElement;
        if (!el) return;
        const up = el.closest(GENUI_ROOTS);
        if (up) genuiQueue.add(up);
        if (node.nodeType === 1)
          node.querySelectorAll(GENUI_ROOTS).forEach((r) => genuiQueue.add(r));
      };
      const observer = new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === 'characterData') {
            const parent = r.target.parentElement;
            if (parent) {
              findTargets(parent, chatQueue);
              collectGenui(parent);
            }
          } else if (r.type === 'childList') {
            r.addedNodes.forEach((n) => {
              if (n.nodeType === 1) {
                findTargets(n, chatQueue);
                collectGenui(n);
              } else if (n.nodeType === 3 && n.parentElement) {
                findTargets(n.parentElement, chatQueue);
                collectGenui(n.parentElement);
              }
            });
            if (r.target.nodeType === 1) collectGenui(r.target);
          }
        }
        if (chatQueue.size || genuiQueue.size) schedule();
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      findTargets(document.body, chatQueue);
      document.querySelectorAll(GENUI_ROOTS).forEach((r) => genuiQueue.add(r));
      flush();

      return () => {
        observer.disconnect();
        if (raf !== null) cancelAnimationFrame(raf);
        chatQueue.clear();
        genuiQueue.clear();
        document.querySelectorAll('[data-dsh-rtl]').forEach((el) => {
          el.removeAttribute('data-dsh-rtl');
          el.removeAttribute('dir');
        });
        document.querySelectorAll('[data-genui-rtl]').forEach((el) => {
          el.removeAttribute('data-genui-rtl');
          if (el.hasAttribute('data-genui-rtl-dir')) {
            el.removeAttribute('dir');
            el.removeAttribute('data-genui-rtl-dir');
          }
        });
        document
          .querySelectorAll('[style*="--dsh-rtl-start"]')
          .forEach((el) => el.style.removeProperty('--dsh-rtl-start'));
        style.remove();
      };
    }

    // ───────────────────────── plugin entry ─────────────────────────
    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        appCtx = ctx;
        ctx.effect(
          () => () => {
            appCtx = null;
            live.forEach((n) => {
              try {
                n.close();
              } catch (_) {}
            });
            live.clear();
          },
          'dsh-waycraft: notification cleanup',
        );
        ctx.effect(
          () => ctx.locale.register(NS, { zh, en }),
          'dsh-waycraft: dictionaries',
        );

        ctx.effect(() => {
          const style = document.createElement('style');
          style.setAttribute('data-waycraft-settings', '');
          style.textContent = ROW_CSS;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'dsh-waycraft: settings row styles');

        // Settings > General rows (same slot the built-in rows use).
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'waycraft-ui-font-size',
              order: 11.5,
              locale: NS,
            },
            UiFontSizeRow,
          ),
        );
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'waycraft-font-source',
              order: 11.6,
              locale: NS,
            },
            FontSourceRow,
          ),
        );
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'waycraft-bidi',
              order: 13,
              locale: NS,
            },
            BidiRow,
          ),
        );

        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'waycraft-notify-mode',
              order: 13.1,
              locale: NS,
            },
            NotifyModeRow,
          ),
        );
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'waycraft-notify-done',
              order: 13.2,
              locale: NS,
            },
            NotifyDoneRow,
          ),
        );
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'waycraft-notify-action',
              order: 13.3,
              locale: NS,
            },
            NotifyActionRow,
          ),
        );
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'waycraft-account-menu',
              order: 13.4,
              locale: NS,
            },
            AccountMenuRow,
          ),
        );
        ctx.slots.inject('conversation.input.left', () =>
          ctx.slots.register(
            {
              name: 'conversation.input.left',
              id: 'waycraft-auto-approve',
              order: 50,
              locale: NS,
            },
            AutoApproveSelect,
          ),
        );
        ctx.slots.inject('conversation.session.header.utilities', () =>
          ctx.slots.register(
            {
              name: 'conversation.session.header.utilities',
              id: 'waycraft-auto-approver',
              order: 9999,
              locale: NS,
            },
            AutoApprover,
          ),
        );
        ctx.slots.inject('settings.general.item', () =>
          ctx.slots.register(
            {
              name: 'settings.general.item',
              id: 'waycraft-auto-copy',
              order: 13.5,
              locale: NS,
            },
            AutoCopyRow,
          ),
        );
        ctx.effect(
          () => startAccountMenu(),
          'dsh-waycraft: account menu grouping',
        );
        ctx.effect(() => {
          let stop = null;
          const t = ctx.locale.bind(NS);
          const sync = (st) => {
            if (st.autoCopy && !stop)
              stop = startAutoCopy(() => showToast(t('copy.toast')));
            else if (!st.autoCopy && stop) {
              stop();
              stop = null;
            }
          };
          sync(store.get());
          const unsub = store.subscribe(sync);
          return () => {
            unsub();
            if (stop) stop();
            disposeToast();
          };
        }, 'dsh-waycraft: copy on select');
        // Invisible watcher on the frame-wide overlay layer: reads session status via the standard hook.
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            { name: 'shell.overlay', id: 'waycraft-notifications', locale: NS },
            NotificationWatcher,
          ),
        );

        // Apply settings live.
        ctx.effect(() => {
          let stopBidi = null;
          const varStyle = document.createElement('style'); // k + font family
          varStyle.setAttribute('data-waycraft-appearance', '');
          const sizeStyle = document.createElement('style'); // generated overrides
          sizeStyle.setAttribute('data-waycraft-ui-font', '');
          document.head.append(varStyle, sizeStyle);

          let lastOverrides = null;
          const regenerate = () => {
            const s = store.get();
            const css =
              s.uiFontSize === UI_BASE_PX ? '' : buildFontSizeOverrides();
            if (css !== lastOverrides) {
              sizeStyle.textContent = css;
              lastOverrides = css;
            }
          };
          const apply = (s) => {
            if (s.bidi && !stopBidi) stopBidi = startBidi();
            else if (!s.bidi && stopBidi) {
              stopBidi();
              stopBidi = null;
            }
            varStyle.textContent = `:root{--waycraft-ui-d:${s.uiFontSize - UI_BASE_PX}px;}\n`;
            applyFontFamily(s);
            regenerate();
          };

          // DSH loads component stylesheets lazily: re-scan whenever a new one appears.
          let timer = null;
          const rescan = () => {
            clearTimeout(timer);
            timer = setTimeout(regenerate, 120);
          };
          const isSheet = (n) =>
            n.nodeType === 1 &&
            (n.tagName === 'STYLE' ||
              (n.tagName === 'LINK' && /stylesheet/.test(n.rel)));
          const headObserver = new MutationObserver((records) => {
            for (const r of records)
              for (const n of r.addedNodes) {
                if (!isSheet(n) || isOwnGenerated(n)) continue;
                rescan();
                if (n.tagName === 'LINK')
                  n.addEventListener('load', rescan, { once: true });
                return;
              }
          });
          headObserver.observe(document.head, { childList: true });
          headObserver.observe(document.body, { childList: true });
          const bodyObserver = new MutationObserver(() =>
            applyFontFamily(store.get()),
          );
          bodyObserver.observe(document.body, {
            attributes: true,
            attributeFilter: [
              'style',
              'data-dsh-claude-typeface',
              'data-dsh-skin',
            ],
          });

          apply(store.get());
          const unsub = store.subscribe(apply);
          return () => {
            unsub();
            headObserver.disconnect();
            bodyObserver.disconnect();
            clearTimeout(timer);
            applyFontFamily({ ...store.get(), fontSource: 'dsh' });
            if (stopBidi) stopBidi();
            varStyle.remove();
            sizeStyle.remove();
          };
        }, 'dsh-waycraft: apply settings');

        try {
          subscriptions.applySkills(ctx);
        } catch (error) {
          console.error('dsh-waycraft: Skill manager setup failed', error);
        }
        try {
          subscriptions.applyMcp(ctx);
        } catch (error) {
          console.error('dsh-waycraft: MCP manager setup failed', error);
        }
        // Optional component setup must never interrupt the core registrations above.
        try {
          Promise.resolve(subscriptions.applySubscriptions(ctx)).catch(
            (error) =>
              console.error('dsh-waycraft: Subscriptions setup failed', error),
          );
        } catch (error) {
          console.error('dsh-waycraft: Subscriptions setup failed', error);
        }
      },
    };
  },
});
