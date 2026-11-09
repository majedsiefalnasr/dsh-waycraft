# Waycraft for DSH

A single plugin for DeepSeek Harness (DSH) that adds app-wide preferences and, one component at a time, larger features such as Subscriptions.

## Plugin structure

**Owner**:
The authenticated person who administers the DSH instance, locally or through the remote GUI.
_Avoid_: Admin, user

**Component**:
One feature of Waycraft for DSH declared as its own DSH Loader row, listed on the Plugins page under "Components" with its own switch.
_Avoid_: Module, sub-plugin, manager

**Core component**:
The Loader row (id `waycraft`; renamed from its retired id in #159, see `docs/ai/rename-waycraft.md` for the one-time manual step on an existing install) that carries the 0.2.0 preferences and the plugin's only browser half; it stays on while any other component is used.
_Avoid_: Main plugin, base module

**Reference plugin**:
A third-party plugin used as the source of behavior and code for a Waycraft for DSH component. An installed reference stays as the Owner's fallback until the Owner accepts the replacement and removes it.
_Avoid_: Dependency, companion

**Provenance record**:
The note kept beside ported reference code naming its source, version, commit, license and every local change.
_Avoid_: Credits, attribution file

## Subscriptions

**Subscriptions**:
The component through which the Owner connects model access: Subscription accounts and API providers, with their usage, models and the tools they enable.
_Avoid_: Auth plugin, Accounts page

**Subscription provider**:
A service the Owner reaches with a personal subscription login rather than an API key: Codex (ChatGPT), Claude, Grok, GitHub Copilot, Google Antigravity, plus OpenCode Zen.
_Avoid_: API provider, vendor

**Subscription account**:
One login of the Owner with a Subscription provider; a provider can hold several.
_Avoid_: API key, connection

**Default account**:
The Subscription account (marked ★) a provider uses when no other rule picks one.
_Avoid_: Primary account, active account

**Account pool**:
The set of a provider's Subscription accounts that requests may be spread across by priority or remaining quota.
_Avoid_: Load balancer, rotation

**Usage window**:
One quota period a provider reports for an account (for example weekly), shown as a bar with its percentage and reset time.
_Avoid_: Limit, credits

**Reset credit**:
A Codex allowance that clears an exhausted usage window early when the Owner consumes it.
_Avoid_: Refill, top-up

**API provider**:
A model service reached with an API key and base URL, stored in DSH's own model settings and shared with Settings > Models.
_Avoid_: Subscription account, API connection

**OpenCode Zen**:
The OpenCode gateway's free, login-less model lane, offered as a Subscription provider without accounts.
_Avoid_: OpenCode account, opencode2dsh

## MCP

**MCP manager**:
The Waycraft component through which the Owner manages MCP servers, their availability in DSH, their sources, and installed copies. (V1: server CRUD, connection testing, read-only tool enumeration, import, discovery, trash/restore; per-tool enforcement and project isolation deferred.)
_Avoid_: MCP plugin, standalone MCP manager

