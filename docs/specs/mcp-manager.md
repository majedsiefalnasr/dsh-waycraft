# MCP manager for Waycraft for DSH

**Status:** Specification (Owner-approved design; implementation, tickets, installation, and publication remain future phases requiring separate authorization).

## 1. Title and Status

This document specifies the **MCP manager** Waycraft Component. It is specification-only and does not authorize implementation, ticket publication, installation, or release.

## 2. Problem Statement

The Owner needs MCP server management inside Waycraft rather than relying on a separate MCP Manager plugin or manual editing of DSH configuration. The replacement must preserve reference workflows (add/edit/remove/test, discovery, import, trash), protect existing configuration and state, and remain independently switchable without affecting AI Providers or core preferences.

**V1 — IN SCOPE:** Server configuration management, connection testing, tool enumeration (read-only), JSON import, filesystem discovery, trash/restore, credential references, trust-based activation, and non-destructive adoption of existing entries.

**DEFERRED — FUTURE RELEASE:** Per-tool enable/disable with actual model-visible filtering and execution blocking; strict Global/Project isolation with project inheritance and overrides; persistent runtime availability policy enforcement after Component shutdown. These are deferred, not rejected (see §19).

## 3. Goals

**V1 — IN SCOPE:**
- One Waycraft installation, version, and changelog for MCP management.
- A separate, default-off, independently switchable Component (`waycraft-mcp`).
- Server CRUD, connection testing, tool enumeration (read-only), JSON import, filesystem discovery, trash and restore.
- Credential references via DSH native credentials (no plaintext secrets).
- Trust-based activation with reviewed-configuration identity.
- Transactional configuration persistence with safe recovery.
- Structured server-centric UI in English and Arabic with correct RTL.
- Host-authenticated interfaces and browser integration following existing Waycraft patterns.

**DEFERRED — FUTURE RELEASE:**
- Per-tool availability enforcement (hidden from tool list + blocked at execution).
- Global and project-scoped MCP server management with strict isolation.

## 4. Non-goals

- MCP Resources and Prompts management (V1 scope is Tools only).
- MCP server-side exposure (ACP covers that role).
- Host or DSH Core changes.
- A replacement GUI server.
- A separate Waycraft credential vault.
- A parallel MCP runtime.
- Automatic migration or installed-plugin removal.
- Release, publication, or installed acceptance (separate phases).
- Per-tool enable/disable with actual model-visible filtering and execution blocking (DEFERRED — see §19).
- Strict Global/Project MCP isolation with project inheritance and overrides (DEFERRED — see §19).
- Persistent runtime availability policy enforcement after Component shutdown (DEFERRED — see §19).

## 5. Product Scope and Component Lifecycle

**V1 — IN SCOPE:**
- Component identity: `waycraft-mcp`. Localized title: "MCP manager". Default-off.
- Independent of AI Providers and Skill Manager. Skill Manager spec continues to exclude MCP management.
- Server configuration management, connection testing, tool enumeration (read-only), JSON import, filesystem discovery, trash/restore, credential references, trust-based activation, non-destructive adoption.
- Component-off stops Waycraft management UI interventions. Saved configuration and management metadata are preserved. Re-enabling restores management choices.
- In-progress persistence operations safely complete or abort on shutdown.
- No permanent Waycraft background service or parallel runtime is created automatically.

**NOT SUPPORTED IN V1:**
- Per-tool enable/disable controls requiring actual model-visible filtering and execution blocking.
- Strict Global/Project isolation with project inheritance and overrides.
- Persistent runtime availability policy enforcement after Component shutdown.

**VERIFICATION REQUIRED:** Server-level lifecycle controls (disable/enable/connect/disconnect) are conditioned on verified DSH runtime support. Do not claim a server is disabled unless a supported runtime mechanism actually makes that server unavailable.

## 6. User Stories

**V1 — IN SCOPE:**
1. As an Owner, I want one Waycraft installation, version and changelog, so that MCP management belongs to the existing product.
2. As an Owner, I want a separate default-off MCP manager Component switch, so that enabling it is intentional and independent of AI Providers.
3. As an Owner, I want saved preferences and MCP configuration retained on Component shutdown, so that re-enabling restores my management choices.
4. As an Owner, I want safe completion or rollback of an already-started config write on shutdown, so that cancellation cannot corrupt `cordis.patch.yml`.
5. As an Owner, I want add, edit, remove, test operations on MCP server entries, so that configuration is manageable without hand-editing YAML.
6. As an Owner, I want import of MCP server configuration from JSON, so that existing server collections can be brought in.
7. As an Owner, I want trash with restore and confirmed permanent removal, so that accidental deletion can be recovered safely.
8. As an Owner, I want discovery of MCP servers under a selected folder, so that existing configurations can be found without silent activation.
9. As an Owner, I want tool enumeration on test and on demand with freshness indicators, so that tool inspection is possible without unnecessary connections.
10. As an Owner, I want credential references via `${credential:REF}` templates, so that secrets are never stored in plaintext config.
11. As an Owner, I want immutable serverName after creation, so that tool identities and session history remain stable.
12. As an Owner, I want English and Arabic RTL across controls, errors and confirmations, so that the full workflow is usable in either language.

**DEFERRED — FUTURE RELEASE:**
13. As an Owner, I want server-level and per-tool disablement with inheritance, so that disabling a server hides all its tools and a single tool can be disabled independently. *(DEFERRED — requires verified per-tool enforcement; see §19.)*
14. As an Owner, I want disabled servers/tools removed from the model tool list and blocked at execution, so that disablement has an operational effect. *(DEFERRED — requires verified per-tool enforcement; see §19.)*
15. As an Owner, I want global and project MCP server entries managed in one place with strict isolation, so that scope is explicit and predictable. *(DEFERRED — requires verified project identity; see §19.)*
16. As an Owner, I want project-scoped MCP entries isolated from global ones. *(DEFERRED — requires verified project identity; see §19.)*
17. As an Owner, I want disabling the Component to stop its UI interventions while previously disabled servers and tools remain unavailable via verified persistent enforcement. *(DEFERRED — requires verified enforcement persistence; see §19.)*

## 7. Architecture and DSH Integration (V1 — Native-first, no per-tool enforcement)

**V1 ARCHITECTURE NOTE:** The original long-term design intent included per-tool enforcement and project isolation. The Owner has approved a narrower V1 delivery scope (Option D — Supported-only V1). V1 uses native DSH integration for supported capabilities only. Deferred capabilities (per-tool enforcement, project isolation, shutdown persistence) are documented in §19 and require separate Owner authorization and specification changes before implementation.

### 7.1 Hybrid Native-first Integration (Decision 1)

Waycraft uses supported public DSH interfaces for operations they actually support (server listing, runtime status, connection testing, tool enumeration, server lifecycle, configuration management, credential references, runtime tool availability). For persistent operations not exposed by supported public APIs, an isolated, version-verified Configuration Adapter may be used. The adapter must follow the real DSH configuration model, respect precedence, preserve unknown fields, detect conflicts, use safe persistence, avoid private API dependencies, and have independently testable boundaries. It is not an alternative MCP runtime.

Separation of concerns:
1. Waycraft MCP Manager UI.
2. Waycraft MCP application/service interfaces.
3. Native DSH integration.
4. Optional persistent configuration adapter.
5. DSH runtime and effective configuration.

### 7.2 Native DSH MCP Layer

DSH MCP is provided by `@deepseek-ai/dsh-mcp-client` (version 0.2.2-rc.1, source available at `/private/tmp/dsh-oss/packages/mcp/mcp-client`).

**Verified fields (from official README and package source):**
`transport`, `serverName`, `command`, `args`, `env`, `cwd`, `url`, `headers`, `toolCallTimeoutMs`, `startupTimeoutMs`, `closeTimeoutMs`, `expandTemplates`, `maxInstructionBytes`, `failOnStartupError`, `reconnect` (enabled/initialDelayMs/maxDelayMs/maxAttempts).

**NOT documented by official package (UNVERIFIED / likely from third-party plugin):**
- `scope` (global/project): **not a field** in the official config schema. The README mentions "unique inside one registration scope" but this refers to serverName uniqueness within a Cordis registration scope, not a config property. Global/project scope is a Waycraft concept requiring verification.
- `disabledTools`: **not a field** in the official config schema. The official package has no per-tool disablement. This field came from the deleted third-party `@wanghailong0419/dsh-mcp-manager` plugin.
- `disabled`: **not a field** in the official config schema.

Tool identity: `mcp__<serverName>__<tool>` (stable, server-qualified) — **VERIFIED** by official README ("After startup, the server's tools appear as `mcp__<serverName>__<tool>`").

The host-level `mcp-manager` package (if installed) exposes `ctx.mcpManager` (status, restart, probe, watch) — integration with it is optional and capability-gated; availability is `UNVERIFIED`.

Credential references: `${credential:REF}` supported with `expandTemplates: true` (verified).

### 7.3 State Dimensions (Improvement 2)

Four distinct states:
- **Desired state**: what the Owner intends (UI controls).
- **Persisted state**: what is written to DSH config / Waycraft state.
- **Applied state**: what DSH runtime has acknowledged applying.
- **Effective runtime state**: what is actually in effect (tool list, execution).

Waycraft reconciles differences by reporting each dimension separately and never claiming successful application until verified.

### 7.4 Sources of Truth (Improvement 3)

Four policy states are distinguished (consistent with §10.1):
1. **Desired Policy** — the Owner's intended restrictions (UI intent).
2. **Persisted Policy** — the durable representation of those restrictions.
3. **Applied Policy** — restrictions acknowledged by DSH runtime.
4. **Effective Enforcement** — actual tool visibility and execution authorization.

Ownership:
- MCP server configuration: DSH config entries are the *candidate* source of truth, subject to verification of config sources and precedence (§8 and §11). Do not assume a single file.
- Connection state: DSH runtime (`ctx.mcpManager` where available, else derived).
- Tool availability: persisted via DSH-native fields **only if verified**; otherwise Waycraft policy state is the persisted source and DSH-native field support is `UNVERIFIED`. Waycraft-only persisted state is never presented as proof of runtime enforcement.
- Effective scope: trusted DSH session/project context (verification required per §9).
- Waycraft-specific metadata (categories, notes, last-tested, trust approvals, trash): Waycraft state store.
- Credential references: DSH credentials provider (Waycraft stores only `${credential:REF}` templates).
- Trash metadata: Waycraft state store.

No competing duplicated configuration ownership. Persisted Policy has a single authoritative store (DSH-native if verified, otherwise Waycraft policy state — never both simultaneously).

## 8. Compatibility Requirements (V1 — Supported capabilities only)

**V1 COMPATIBILITY NOTE:** The compatibility preflight and targeted investigation classified per-tool enforcement (MCP-05/06/07), project isolation (MCP-09/11), and component shutdown persistence (MCP-08) as `UNSUPPORTED` by verified public DSH extension points. The final technical spike was `INCONCLUSIVE` (isolation blocked). These capabilities are deferred to §19. V1 implementation is gated on verified support for: server CRUD, connection testing, tool enumeration, JSON import, filesystem discovery, trash/restore, credential references, and non-destructive adoption.

Before implementation tickets become executable, a compatibility assessment must classify each capability as `SUPPORTED_NATIVE`, `SUPPORTED_ADAPTER`, `UNSUPPORTED`, or `UNVERIFIED`, with evidence (DSH version/commit, verified API/source location, limitations, mandatory/optional, blocking status, next action). Mandatory capabilities requiring scrutiny: persistent server CRUD, server lifecycle, per-tool listing and execution enforcement, global/project isolation, tool identity resolution, credential integration, configuration precedence, runtime config application, component shutdown, server instructions/resource exposure.

Do not fabricate API signatures. If a mandatory capability is unsupported/unverified, the relevant implementation work is blocked pending Owner decision. No private APIs, DSH Core modifications, or alternative runtime architectures without explicit approval.

## 9. Server Identity and Scope Resolution (V1 — Single scope, no project isolation)

**V1 SCOPE NOTE:** V1 does not offer strict Global/Project isolation. Do not present Agent-scope as equivalent to Project-scope. Do not expose project overrides, project-specific disablement, or misleading scope selectors. The future Global/Project model is retained in §19 (Deferred Requirements).

- Logical server identity: `serverName` (immutable after creation).
- Configuration scope: single supported profile/global scope in V1. Project-scoped entries are DEFERRED (see §19).
- Effective runtime registration: one authoritative server definition per logical name.
- Tool identity within effective execution context: `mcp__<serverName>__<tool>`.
- Trusted project/session identity, project overrides, and project-specific authorization are DEFERRED (see §19).

## 10. Runtime Availability and Policy Enforcement (Decision 2) — V1 DEFERRED

**V1 NOTE:** Per-tool enable/disable with actual model-visible filtering and execution blocking is DEFERRED (see §19). V1 provides read-only tool enumeration only. Server-level lifecycle controls are conditioned on verified DSH runtime support.

**DEFERRED — FUTURE RELEASE:** All per-tool enforcement, project isolation, and shutdown persistence requirements below are deferred. They represent the original long-term design intent, not V1 scope.

- Disabled tool: (1) not in effective tool list exposed to model; (2) direct execution rejected before reaching MCP server.
- Disabled server: all its tools unavailable.
- Enforcement across: new tool listings, direct tool calls, reconnects, runtime restarts, dynamic tool-list changes, session/project boundaries, relevant subagent paths.
- Server-level disablement takes precedence over individual tool states.
- Re-enabling server restores previously disabled individual tools to their disabled state.
- Fail-closed when enforcement cannot be confirmed.
- Tool disablement prevents new invocations once enforcement effective; no promise of cancellation/rollback of already-running calls.
- If public DSH mechanisms cannot support effective tool-level filtering and execution blocking, classify as blocking compatibility gap.

### 10.1 State Ownership and Synchronization

| State | Owner | Storage | Notes |
|-------|-------|---------|-------|
| Desired availability policy | Owner intent | Waycraft UI state + `waycraft_mcp_policy_v1` | What the Owner intends. |
| Persisted availability policy | Waycraft (DSH-native only if verified) | Waycraft state store; DSH config only if `disabled`/`disabledTools` verified native | Waycraft writes; never assumes DSH-native field exists. |
| Runtime-applied policy | DSH runtime | DSH runtime memory/config | Acknowledged by runtime; `UNVERIFIED` until compatibility preflight. |
| Effective tool visibility | DSH runtime (if verified) else Waycraft enforcement adapter (candidate only, requires verified public extension points) | DSH tool list / Waycraft filter | Fail-closed if unverified. Waycraft-mediated enforcement is a candidate integration approach, not an established capability. |
| Effective execution authorization | DSH runtime (if verified) else Waycraft enforcement adapter (candidate only, requires verified public extension points) | DSH execution path / Waycraft gate | Fail-closed if unverified. No private API interception, monkey-patching, or parallel MCP runtime is authorized. |

Synchronization rules:
- Waycraft never claims success before runtime enforcement is verified (no misleading status).
- Component-lifetime registrations are not assumed to survive disposal.
- If DSH public mechanisms cannot guarantee survival across reconnects/restarts/shutdown, classify as blocking compatibility gap.

### 10.2 Policy Persistence Across Component Shutdown (Gap 1)

Previously enforced restrictions must remain effective after the management UI Component is disabled. Management UI lifecycle and persistent runtime availability are separated. Prefer DSH-native persistent configuration/policy enforcement. Do not assume Waycraft Component-lifetime registrations survive disposal. Do not create permanent background service automatically. If enforcement cannot survive shutdown via supported integration, classify as blocking compatibility gap.

## 11. Configuration Persistence and Recovery (Decision 4) — V1 IN SCOPE

**V1 NOTE:** Configuration persistence, safe recovery, conflict detection, and non-destructive adoption are core V1 capabilities. Server-level lifecycle controls are conditioned on verified DSH runtime support.

Separate Save / Apply / Test with independent outcomes. Saving does not mean connected. Test failure does not auto-delete/revert valid saved config. Applied config not claimed until DSH runtime confirms effective state.

Statuses: Unsaved changes, Saved, Pending application, Applying, Applied, Restart required, Apply failed, Conflict detected, Recovery required.

Native DSH config APIs first. Configuration Adapter (if needed): schema validation, precedence awareness, ownership-aware updates, atomic replacement where supported, platform-appropriate file locking, optimistic concurrency, preserve unknown fields, protect against lost updates, verify after persistence, safe rollback/recovery, crash consistency, explicit handling of external edits. Do not overwrite newer external modifications during rollback. Failed write must not leave partial config. Component shutdown safely completes or aborts in-progress persistence. Abrupt termination covered by recovery. No automatic alteration of unrelated DSH settings during recovery.

### 11.1 Non-destructive Adoption of Existing Entries (Gap 3)

On first enable: read existing entries; preserve enablement states, credentials/references, unknown fields, ownership, runtime behavior. Do not auto-test or restart servers. Do not auto-import into competing store. Do not auto-enable disabled entries. Do not auto-disable previously running entries. Distinguish pre-existing DSH entries, Waycraft-created entries, and entries owned by other components. Pre-existing configs are not auto trust-approved, but introducing trust management must not silently interrupt existing servers. Require review for new activation or material security-sensitive changes. `mcp-github` and `mcp-playwright` are examples of existing entries, not exhaustive inventory.

## 12. Credentials, Security, and Trust (Decision 5) — V1 IN SCOPE

Use DSH supported credential management. No separate Waycraft credential vault. Support `${credential:REF}` templates. Never persist plaintext secrets. Secrets must not appear in UI responses, logs, error messages, config previews, exported configs, test diagnostics, or browser-accessible state after submission. Credential resolution within trusted host-side boundaries. Managing MCP servers requires authenticated Owner authorization enforced by host. Paired clients do not receive Owner-level management privileges merely by being connected.

Import and discovery never automatically execute an MCP server. Separate: (1) Discover/Import, (2) Review and Save, (3) Trust Approval, (4) Enable/Connect. Saving does not imply trust. Trust approval associated with reviewed configuration identity/fingerprint. Material changes requiring renewed review: executable command, arguments/executable package, server endpoint, connection/auth config, effective execution privileges, other security-significant config. Define handling for dynamic tool definitions and security-significant schema changes. Approval authorizes reviewed configuration, not a guarantee of harmlessness. No new sandbox platform in V1; do not misrepresent project scope as OS/filesystem isolation.

### 12.1 Trust-based Activation

Trust approval identity binding: reviewed configuration fingerprint. Material changes invalidate trust and require re-approval.

## 13. Server Management Workflows (V1 — Server CRUD read-only tools)

### 13.1 Server CRUD
Add, edit, remove, test, toggle. Guided creation form with advanced settings on demand. Support stdio and streamable HTTP per verified capabilities. Immutable serverName after creation. Clear handling for required fields, credential references, validation errors, config previews, trust approval, Save/Apply/Test outcomes, unsaved changes, external conflicts.

### 13.2 Tool Management (V1 — Read-only)
Tool enumeration (on test and on demand, cached with freshness). Search, descriptions, input-schema inspection where available. **V1 is read-only**: users may list, search, view descriptions, inspect schemas, refresh listings, and inspect availability/connection info. Users may NOT disable individual tools, create per-tool enforcement policies, or configure project-specific tool access. Do not display disabled-tool controls or imply that read-only tool management enforces restrictions. Do not eagerly connect to every server to populate UI. Distinguish desired enabled state, runtime connection state, configuration application state, trust state.

**DEFERRED — FUTURE RELEASE:** Per-tool disablement, inherited/global/project policy visibility, actual enforcement status display.

### 13.3 Tool Cache Invalidation (Improvement 4)
Refresh on: explicit test, on-demand refresh, reconnect, tool-list changes, server config changes, scope changes, policy changes. Cached info must not bypass newer restrictions.

## 14. Discovery, Import, and Trash (V1 — In scope, server-level only)

### 14.1 Discovery (Improvement 6)
Filesystem scan for MCP config files (`.mcp.json`, `mcp-servers.json`, `.dsh/dshmm/mcp.json`, etc.) under user-selected or project folder. Stay within approved search roots, explicit boundaries, safe symlink handling, no unexpected traversal, handle malformed/oversized files, no secret leakage, no execution of discovered commands, present candidates for explicit registration. Registry search (npm mcp-*) if included is separate explicit action; results not auto-trusted.

### 14.2 Import (Improvement 5)
Parse, validate, normalize, preview, duplicate detection, credential reference validation, conflict handling, explicit registration approval. Support explicitly defined verified JSON formats. Do not silently accept unsupported structures. Do not run imported servers automatically. V1 does not expose Project Scope Selection; import candidates must be reviewed before registration. Use only the verified V1 configuration scope.

### 14.3 Trash (Gap 4)
Three distinct operations:
- **Disable**: keep in active list, operationally unavailable, preserve config and per-tool policies.
- **Move to Trash**: operationally unavailable, removed from active list, preserve info for restoration, retain provenance/scope, prevent auto-reactivation while trashed.
- **Permanent Delete**: remove config via supported persistence mechanism, explicit confirmation, respect ownership, avoid auto-deleting shared credentials.

Restore: return to management, default to non-running/disabled unless approved policy says otherwise, revalidate identity conflicts, scope, credential references, trust requirements. Trash state must not lose operational effect when Component turned off. If safe Trash semantics cannot be implemented for externally owned entries, document ownership limitation and define supported behavior rather than destructive mutation.

## 15. UX/UI and Localization (Decision 6) — V1 (No per-tool controls, no project selectors)

Use existing Waycraft design system, theme, tokens, components, browser integration. No new application shell. Three primary areas: Servers, Discover & Import, Trash.

Servers area: search, status filters, server listing, add, connection state, trust state, effective config state, relevant actions. Server-level Enable/Disable controls shown only when effective runtime behavior has been verified. No Global/Project scope selectors or per-tool enable/disable controls in V1.

Server details: structured sections/tabs — Overview, Tools, Configuration, Security & Activity.

Accessible loading, empty, error, retry, confirmation, conflict states. English and Arabic; Arabic correct RTL. Commands, URLs, JSON, tool identifiers, technical strings remain LTR-readable inside Arabic interfaces (bidirectional text handling). Test keyboard accessibility, focus behavior, responsive layouts, component disposal.

## 16. State Ownership and Reconciliation (V1 — No per-tool enforcement persistence)

See §10.1 for the authoritative ownership model (Desired / Persisted / Applied / Effective).

Four policy states (see §7.4):
1. **Desired Policy** — Owner intent, managed by Waycraft.
2. **Persisted Policy** — single authoritative durable representation, determined by verified DSH capabilities (DSH-native if verified, otherwise Waycraft policy state — never both simultaneously).
3. **Applied Policy** — what DSH runtime has confirmed applying.
4. **Effective Enforcement** — what is actually enforced in tool visibility and direct execution.

Waycraft may persist intended restrictions in its policy store when native support is unavailable, but this store alone does not constitute runtime enforcement. Previously enforced restrictions must survive Component shutdown; if no supported mechanism guarantees this, classify as a blocking compatibility gap.

Reconciliation: Waycraft reads DSH config as candidate source of truth for server list (subject to verified config sources and precedence per §8 and §11). Waycraft state holds metadata (categories, notes, last-tested, trust approvals, trash). No dual-write conflicts. On component enable, adopt existing entries non-destructively (Gap 3). On component disable: management UI interventions stop; configuration and policy data remain preserved; previously enforced restrictions must not silently disappear; runtime availability follows verified persistent enforcement mechanisms; no new permanent Waycraft background service or parallel MCP runtime is introduced automatically.

## 17. Testing and Acceptance Criteria (Decision 8) — V1 (No per-tool enforcement tests)

Risk-based testing + acceptance gates. Prove runtime behavior, not just persistence/UI.

### V1 Acceptance Tests

Testing areas:
1. Integration and lifecycle.
2. Server CRUD and connection testing.
3. Read-only tool enumeration.
4. Configuration persistence and recovery.
5. Credentials, authorization, and trust.
6. UI/UX, accessibility, localization, regression.
7. Trash/Restore/Permanent Delete.
8. Non-destructive adoption.
9. Component lifecycle and saved-state preservation.

Controlled MCP server fixtures (stdio + streamable HTTP), connection failure, timeout, crash, credential reference failures, simulated concurrent edits, process termination at persistence boundaries.

V1 acceptance scenarios:
- Server listing and CRUD operations succeed.
- Connection test reports success/failure without deleting valid saved config.
- Read-only tool enumeration displays tools without implying enforcement.
- Import/discovery do not execute unapproved commands.
- Trust approval/rejection paths work correctly.
- Credential references are handled securely (no plaintext leakage).
- Non-destructive adoption preserves existing entries.
- Configuration persistence and recovery work correctly.
- Trash/Restore/Permanent Delete behave operationally.
- Component lifecycle preserves saved state.
- Authorization and paired-client restrictions enforced.
- English/Arabic RTL, accessibility, and regression tests pass.

### Deferred Acceptance Tests (NOT in V1 release gate)

- Per-tool model-visible filtering.
- Per-tool execution blocking.
- Per-tool policy persistence across reconnects/restarts.
- Global/Project isolation.
- Project inheritance.
- Project/session/subagent policy enforcement.
- Runtime policy persistence after Component shutdown.

These deferred scenarios are preserved in §19 (Deferred Requirements) and require separate Owner authorization before inclusion in any release gate.

Retain applicable: formatting, linting, type checking, full automated suite, regression checks, fresh-build byte comparisons, packaging allowlist, build provenance, independent Standards and Spec reviews.

Acceptance standard: 100% critical acceptance-scenario coverage (not arbitrary 100% code coverage).

Three gates:
- Gate 1 — Compatibility: mandatory capabilities and blocking gaps identified and resolved or explicitly approved.
- Gate 2 — Automated Verification: applicable integration, runtime, security, lifecycle, browser, regression tests pass.
- Gate 3 — Owner Acceptance: consolidated Owner acceptance session after automated verification.

No installation, source push, or release implicitly authorized by passing gates.

Cross-platform persistence tests (Improvement 7): filesystem, command, path, atomic persistence tests for Windows, macOS, Linux where applicable. Do not promise unsupported OS behavior.

## 18. Delivery Phases and Approval Gates (Decision 9) — V1 (Supported capabilities only)

Phases:
1. Specification revision (this document).
2. Compatibility preflight.
3. Implementation plan and proposed ticket graph.
4. Implementation.
5. Installed acceptance and release.

Each phase requires separate Owner authorization. Approving spec does not authorize creating GitHub Issues, publishing tickets, modifying implementation code, installing plugins, running migrations, releasing or publishing.

Suggested workstream categories (planning only, not authorized tickets): Compatibility and architecture; Native integration and Component lifecycle; Persistent configuration and safe recovery; Runtime policy enforcement; Global/project isolation; Credentials and trust; Server-centric UI; Integration and acceptance verification.

Once explicitly published, approved GitHub specification issue becomes execution reference per project governance. Conflicts between local spec and published issue reconciled explicitly.

## 19. Deferred Requirements / Future Roadmap (Option D — Owner-approved)

**V1 DEFERRED CAPABILITIES (not rejected, deferred for future release):**

1. **Per-tool enable/disable controls** requiring actual model-visible filtering and execution blocking (MCP-05/06/07).
2. **Per-tool policy enforcement** across reconnects, restarts, and dynamic tool registration (MCP-07).
3. **Strict Global/Project MCP isolation**, including project inheritance and overrides (MCP-09).
4. **Project/session-specific MCP execution authorization** (MCP-09/11).
5. **Project-specific subagent policy enforcement** (MCP-11).
6. **Persistent runtime availability policy enforcement** after the MCP Manager Component is disabled (MCP-08).

These requirements are deferred, not rejected or removed. The technical spike ended `INCONCLUSIVE` because isolated runtime tests could not execute. Do not claim that future implementation is technically impossible.

**V1 OUT OF SCOPE (unchanged):**
- MCP Resources and Prompts management (V1 scope is Tools only).
- MCP server-side exposure (ACP covers that role).
- Host or DSH Core changes.
- Replacement GUI server.
- Separate Waycraft credential vault.
- Parallel MCP runtime.
- Automatic migration or installed-plugin removal.
- Concurrent old/new activation during acceptance, automatic restart, source push, release, npm/GitHub publication.
- Filesystem access denial to general tools or retroactive removal of instructions already loaded into a conversation.

## 20. Risks, Constraints, and Compatibility Blockers (V1 — Supported capabilities only)

**V1 RISK NOTE:** The compatibility preflight classified per-tool enforcement, project isolation, and component shutdown persistence as `UNSUPPORTED`. The final technical spike was `INCONCLUSIVE` (isolation blocked). V1 implementation proceeds with supported capabilities only. Deferred capabilities require separate Owner authorization and specification changes.

### V1 — Verification Required

Supported V1 capabilities still requiring behavioral verification during implementation:
- Persistent server CRUD and configuration application (may require Configuration Adapter).
- Configuration precedence and patch semantics.
- Server lifecycle controls, if offered (disable/enable/connect/disconnect).
- Tool enumeration and status reporting.
- Trash operational safety (not cosmetic).
- Credential references and host authorization.
- Non-destructive existing-entry adoption.
- Component lifecycle and persistence recovery.
- Server instructions/resource exposure safety where relevant.
- `ctx.mcpManager` availability in installed DSH version.
- DSH credentials provider integration specifics.
- Runtime configuration application (hot reload vs restart required).
- Component shutdown behavior for in-progress persistence.

### Deferred — Future Compatibility Blockers

Keep (not V1 blockers):
- Per-tool runtime enforcement (MCP-05/06/07).
- Project/session isolation (MCP-09/11).
- Shutdown-policy enforcement persistence (MCP-08).

If a mandatory capability is unsupported or unverified, relevant implementation work is blocked pending separate Owner decision. No private APIs or alternative runtime without approval.

## 21. References and Further Notes (V1 — Supported capabilities)

- DSH MCP client: `@deepseek-ai/dsh-mcp-client` (one entry per server in `cordis.patch.yml`). README: https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/mcp/mcp-client/README.md
- DSH MCP group: https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/mcp
- Prior art reference: `yangfch3/dsh-mcp-mgr` (workspace mcp.json discovery, hot sync, settings UI) — reference only, not runtime dependency.
- Skill Manager spec: `docs/specs/skill-manager.md` (excludes MCP management; this MCP manager is separate independent component).
- ADR-0001: features are components of one plugin.
- Waycraft Component architecture: `src/legacy-names.ts`, `cordis.patch.yml` rows `waycraft`, `waycraft-subscriptions`, `waycraft-skills`.
- Prior research: subagent findings on installed `@wanghailong0419/dsh-mcp-manager` v0.1.3 (deleted by Owner; retained as behavioral reference notes only).

## 22. Execution and Authorization Boundaries (V1 — Supported capabilities only)

- Specification approval authorizes specification work only.
- DSH Compatibility Preflight requires separate Owner authorization.
- Implementation planning and GitHub ticket publication require separate explicit approval.
- Implementation requires separate Owner approval.
- Changes to installed plugins, credentials, or live DSH configuration require explicit authorization.
- Commits, pushes, tags, releases, deployments, and publication are not implicitly authorized.
- Completion of automated verification or acceptance gates does not grant release authorization.
- Existing Waycraft Engineering Workflow and repository governance must be respected.

## 23. Final Instruction

The nine architectural/product decisions, five gap resolutions, and eight improvements are Owner-approved as long-term design intent. The Owner has additionally approved **Option D — Supported-only V1**, which narrows V1 delivery scope to supported capabilities only. Deferred capabilities (per-tool enforcement, project isolation, shutdown persistence) are documented in §19 and require separate Owner authorization and specification changes before implementation. When an approved requirement conflicts with an actual DSH limitation, preserve the requirement and document the limitation as a compatibility gap requiring a separate Owner decision. Do not proceed to implementation planning, ticket publication, coding, installation, or release.
