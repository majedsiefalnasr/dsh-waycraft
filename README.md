# Waycraft for DSH

**Waycraft** (`dsh-waycraft`) is an interface, workflow and provider toolkit for **DeepSeek Harness (DSH)**. It never patches DSH itself — everything is added through public client extension points when the plugin is enabled, and removed again when it is disabled.

## Features

| Where | Feature |
|---|---|
| Settings ▸ General ▸ **Bidirectional text** (toggle) | Per-paragraph RTL/LTR for Arabic, Persian and Hebrew in chat answers, reasoning, tool cells, question boxes and user bubbles; mirrors [`@changfenhuang/dsh-genui`](https://www.npmjs.com/package/@changfenhuang/dsh-genui) components (lists, steps, tables, timelines, switches, chevrons, progress markers…). Replaces `dsh-persian-rtl`. |
| Settings ▸ General ▸ **App UI font size** (px stepper, 11–20, default 14) | Font size of the app interface (sidebar, headers, composer, side panels, settings, other plugins' panels). Additive like the chat setting (`size + (N − 14)px`), so the UI's 14px body text becomes exactly N. Covers every stylesheet (plugin `<style>`, app `<link>` bundles, `font: var(--dsw-font-*)` design tokens) but not the *chat* text, which keeps following the built-in chat font size. |
| Settings ▸ General ▸ **App font** (dropdown) | `DSH default`, `System font` (the OS UI stack), or one of five bundled fonts: **Inter**, **Roboto**, **Open Sans**, **Noto Sans**, **IBM Plex Sans**. Applies to the whole app interface and chat text. Fonts load only when selected. |
| Settings ▸ General ▸ **System notifications** (dropdown: Off / Only when app is in background / Always, + *Send test*) | Native desktop notification when a session **finishes** or **needs you** (tool approval, question, plan review). Two toggles choose which events notify. Clicking a notification focuses the app and opens that session. While the app is focused a notification (only possible in *Always* mode) is shown **silently**; in the background it is audible. |
| Settings ▸ General ▸ **Group sidebar actions in account menu** (toggle, on by default) | Sidebar footer buttons added by plugins (e.g. *Remote access*, Cordis) move **into the account menu** (Settings / Feedback / Sign out) instead of sitting beside it. |
| Settings ▸ General ▸ **Copy on select** (toggle, off by default) | Text you select in the app is copied to the clipboard automatically when you release the mouse or finish a keyboard selection. A "Copied to clipboard" toast confirms each copy. Selections inside input fields, the composer and the terminal are ignored. |
| Composer bar ▸ **Approvals** dropdown (next to the permission control) | Per-session auto-approval: **Ask me** (default), **Auto (safe)**, **Auto (aggressive)**. Decisions come from a deterministic, offline command classifier (see below). A toast shows each auto-approval; after 3 requests in a row that were handed back to you, auto-approval pauses for the session. |

### Skill repositories

The skill manager's **Discover Skills → Git Repos** tab subscribes to GitHub (`owner/name` or URL), HTTP(S) Git and local folders, and installs tracked copies into the DSH or Shared Agents folder or into a registered project's DSH folder. Requirements: the system `git` executable is needed for Git and local-Git sources (GitHub archives and plain folders do not need it); cleartext `http://` Git hosts are allowed (credentials in URLs are refused, loopback/private hosts are blocked); the `repositories` option (git binary, archive base URL, limits, `allowPrivateHosts`) is trusted host configuration, not user input. Known limitation: a hostname is checked once before Git resolves it again, so DNS rebinding in between is not prevented.

The skill manager's Global and Project views show a count strip (skills / enabled / disabled / diagnostics) and a **Refresh** button that re-reads the skill folders from disk.

### Skill catalogs

The skill manager's **Discover Skills** scope (sub-tabs **Git Repos**, **ClawHub**, **skills.sh**) browses ClawHub's download ranking (up to 100 items; sorting and the status filter only reorder what is shown), searches ClawHub and skills.sh, shows details with a copyable SKILL.md, and installs a confirmed copy into the DSH or Shared Agents folder or a registered project's DSH folder. Catalog installs can be uninstalled (after a confirmation) to Trash and restored; Forget removes only the record; catalog version updates are not offered. Network access goes only to the fixed ClawHub and skills.sh endpoints; the feature was verified against local stubs, not the live services. Known limitation: a catalog hostname is checked once before the request resolves it again, so DNS rebinding in between is not prevented.

### Notifications on phones (remote web access)
Mobile browsers are stricter than desktop:
- **HTTPS is required.** Plain `http://192.168.x.x` links are not a secure context, so browsers expose no notification API at all. Use the tunnel (`https://…trycloudflare.com`) link from the Remote access panel.
- **Allow once, from a tap.** Open *Settings ▸ General ▸ System notifications* and tap **Send test**; browsers only show the permission prompt from a user gesture. The row shows the current state (allowed / blocked / unsupported).
- **Android Chrome** only accepts notifications through a service worker; the plugin uses the one Remote access registers and falls back to the classic API on desktop.
- **iPhone/iPad** needs the web app added to the Home Screen first (iOS 16.4+).
- If a system notification isn't possible, you still get an **in-app banner** (and a vibration when the page is in the background).
- Limits: a page that is closed or frozen in the background cannot be woken without a push server, so notifications are delivered while the page is open or recently backgrounded.

### How auto-approval decides
Modelled on Claude Code's auto mode, Codex's `is_known_safe_command` and anumati, but **deterministic** (no model call, no network, no cost on your subscription). The model's own justification text is *not* trusted — only the sandbox level it asks for and the command itself.

| Verdict | Meaning | Examples |
|---|---|---|
| **allow** | every part of the command is provably read-only or contained in the project | `ls`, `cat`, `rg`, `git status/log/diff/show/blame/fetch`, `gh run view … \| grep`, `git add/commit/switch`, `echo > file` (inside project), `npm test`, `npx tsc`, `cargo test`, `pytest`, public `curl https://… ` GET |
| **ask** | not recognised / has an effect we can't prove harmless — you decide | `git push`, `git pull`, `npm install`, `./script.sh`, `node x.js`, `$(…)`, here-docs, background jobs |
| **deny** | irreversible, shared-state, secret or system-level — always asks you, **even in Aggressive** | `rm -r/-f`, `git push --force` / to main, `git reset --hard`, `git clean`, `sudo`, `chmod -R`, anything touching `.env`/`.ssh`/keys, `curl -d`, `ssh`/`scp`, `eval`, `… \| sh`, `npm publish`, `terraform apply`, `kubectl delete`, `docker run`, cloud CLIs, `DROP TABLE` |

Rules: a chain (`&&`, `;`, `\|`) is judged by its **worst** part; command substitution/here-docs/process substitution can't be checked, so they ask; redirects may only write inside the project; asking the sandbox for *more* access (full access / network) is only accepted for pure reads (e.g. reading a CI log through the GitHub API).
- **Auto (safe)** approves `allow` only. **Auto (aggressive)** approves `allow` and `ask`, never `deny`. Aggressive is never persisted (resets on restart).
- Source: `lib/classify.cjs` (also inlined into `client.js`); tests: `node test/classify.test.cjs` (166 cases).

### Bundled fonts
The five fonts ship inside this package (`fonts/*.woff2`, ~1.1 MB, from [Fontsource](https://fontsource.org)) and are served by the plugin's host half at `/plugins/dsh-waycraft/fonts/`, so they work offline and on paired phones. Subsets: Latin + Latin-Ext for all, **Arabic** for Noto Sans and IBM Plex Sans, Hebrew for Open Sans. Inter, Roboto and Open Sans have no Arabic glyphs, so Arabic text falls back to the system font — pick **Noto Sans** or **IBM Plex Sans** for Arabic/Persian. All licensed under the SIL Open Font License 1.1 (licenses in `fonts/LICENSE-*.txt`). Needs an app restart after install (the plugin now has a host half).

### Styling note
All text in this plugin's own UI (settings rows, dropdowns, toast, Approvals control) uses DSH's design tokens (`font: var(--dsw-font-s-14)` etc.), never hard-coded px, so it follows the **App UI font size** exactly like built-in rows.

### For plugin authors
`window.__dshWaycraft.accountMenu.register({ id, label, icon /* svg markup */, order, onSelect })` adds an item to the account menu and returns an unregister function.

Settings are stored per-browser/desktop profile in `localStorage` (`dsh-waycraft:settings:v1`).

## Components

Waycraft is one plugin made of separate Loader rows; each can be switched off without disabling the plugin. The Subscriptions, Skill manager and MCP manager rows are disabled by default.

- **Subscriptions** (Loader row `waycraft-subscriptions`): Codex, Claude, Grok, Copilot, Antigravity and OpenCode Zen account sign-in, model routing, usage badge and speed control, plus the Codex image, video and X search tools.
- **Skill manager** (Loader row `waycraft-skills`): one place to see, enable and organise the skills DSH can read.
  - Sources and categories: every skill folder is a source you can switch on or off; skills can be grouped into categories (stored by Waycraft, files are never moved), reordered by drag and drop or Move up/down, and given display notes.
  - Create and import: create a skill in your DSH folder, Shared Agents or a registered project, or import a folder or archive.
  - Trash: removed skills go to a Trash you can restore from.
  - Repositories: subscribe to Git repositories and install tracked copies, with update and rollback.
  - Catalogs: browse ClawHub and skills.sh and install into a chosen destination.
  - Model tool: `dsh_waycraft_create_skill` (asks for approval before it creates a skill).
- **MCP manager** (Loader row `waycraft-mcp`): manage the MCP servers in DSH's configuration from Settings.
  - Servers: add, edit, trash, restore and permanently delete stdio and streamable HTTP servers. Secrets are entered as `${credential:REF}` references, never as plaintext.
  - Trust and testing: a server is trusted for the configuration you reviewed; connection tests run only when you ask and only for trusted servers. The tool list is read-only and cached.
  - Discover and import: import JSON with a preview, find configurations in a folder, or search the Official MCP Registry. Nothing is connected, installed or trusted automatically.
  - Not included yet: enabling or disabling individual tools, project-scoped servers. The "Configured off" switch records the configuration; DSH's runtime enforcement of it is not verified.

## Identity and upgrade compatibility

The product is **Waycraft for DSH**, with package name `dsh-waycraft`. The source repository remains `majedsiefalnasr/dsh-waycraft`; a repository rename is a separate operation. All owned identifiers use the `waycraft` prefix. For one release the plugin still answers the earlier RPC routes, header, font route and browser global, reads the earlier browser settings keys, and copies (never moves) earlier account/credential/media/skills storage to the new location on first start. The earlier files are never deleted or modified, so rolling back is a reinstall of the earlier archive. See `docs/ai/rename-waycraft.md` for the full table, migration behavior, removal plan and open items (Loader row ids).

Do not install Waycraft alongside the package it replaces: both declare the same component ids and capabilities. An installed upgrade requires a separately approved replacement with backup/rollback, followed by a full DSH restart. This source rename does not change an already installed package or imply an npm release exists. Historical release notes, source attributions and evidence retain their original names.

## Install

Via the Plugins page, or:

```sh
dsh plugin install github:majedsiefalnasr/dsh-waycraft
```

Then remove `dsh-persian-rtl` (this plugin supersedes it). After installing or updating, fully restart DSH: newly added component rows do not appear through in-place discovery without a restart (Owner-verified).

## Roadmap
Waycraft's scope includes interface and workflow improvements, provider integrations and future routing enhancements. Automatic model/provider selection is a roadmap direction, not a feature promised by this rename.

## Credits
Chat direction CSS/logic adapted from [dsh-persian-rtl](https://github.com/ireza7/dsh-persian-rtl) (MIT).

## License
MIT. The Skill manager parts are adapted from dsh-skills-manager (Apache-2.0); see `THIRD_PARTY_NOTICES.md`.
