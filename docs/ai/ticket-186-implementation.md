# Ticket 186 implementation

Status: complete. Implementation `1b2fe35` merged into `feat/179-access-methods` as `83a46a3`; GitHub #186 is CLOSED with all six acceptance checkboxes checked and evidence linked. Independent review found one cancellation cleanup race, now fixed and regression-tested. No push, main merge or release.

## Work contract

- Outcome: issue #186, Let the Skill manager and MCP manager govern CLI sessions, under spec #179 only. Base: `feat/179-access-methods` at `8b57465`. Branch: `feat/186-cli-skill-mcp-governance`.
- Owner decisions (2026-11-14), recorded on #186 (comment 6875435170), in ADR-0006 and in `docs/specs/access-methods.md`:
  1. Enabled MCP servers are the ones not in trash, not `disabled: true`, and trusted for exactly the saved configuration. Servers left out are listed with a reason on the provider manage page.
  2. Manager component off or no configuration file: no manager servers, run continues. Configuration present but unreadable: run continues without manager servers and one notice per session. The CLI's own configuration is never read.
  3. A server that references `${credential:REF}` is left out as "needs a credential"; the limit is declared in Provider capabilities. Passing credentials through the child environment is #211 (under #179) and is not implemented.
  4. Skills inside a CLI plugin are only marked as following the plugin, in English and Arabic.
- Constraints: read-only access to the manager's store through one shared path function; configuration read at the start of each turn; temporary file rules of #185 (mode 0600, inside the account directory, removed at the end); no configuration value in any log, notice, status answer or test output; no write to the MCP manager from Subscriptions.
- Allowed writes: Claude CLI driver and governance module, a small shared registry, the MCP and Skill manager components (registration only), the Claude card, one session notice card, locales, tests and fixtures, regenerated build output, ADR-0006, spec copy, changelog and state documents. No DSH changes, installed state, real credentials, push, main merge or release.

## Behaviour

- **Registry.** `src/cli-governance.ts` holds a read-only source per manager while that component is on: the MCP manager registers its saved-configuration path (the same `resolveCordisPatchPath` the manager uses, now exported from `mcp-config-store.ts`); the Skill manager registers a function answering the skill names it keeps from DSH. A component that is off has no source and governs nothing.
- **MCP servers.** `src/auth/claude-cli-governance.ts` reads the manager's snapshot each turn and returns the servers in the CLI's `--mcp-config` shape (stdio `command/args/env`, http `url/headers`) with one exclusion reason per leftover server: `disabled`, `untrusted`, `changed`, `needs-credential`, `unsupported` (a working directory, which the CLI's stdio entries lack, a missing command or address, or the reserved name of the DSH tools server). A read failure drops the error text, because a parser message can quote the file.
- **Run configuration.** `createClaudeCliMcpRun` writes the manager servers and, when the session has an agent and tool service, the run's own DSH tools endpoint (unchanged from #185, and it always wins the name `waycraft-dsh-tools`). A session without DSH tools but with manager servers gets the private file only. Mode 0600, account directory, removed on end, abort or failure. `--strict-mcp-config` stays on every run.
- **Skills.** Names with no eligible, policy-valid copy in the Skill manager's global catalog are passed as `--settings '{"skillOverrides":{name:"off"}}'`, a required flag when any name is hidden. A name another enabled copy still provides stays visible. Manager off: nothing is hidden. Project-scope state is not applied, since the CLI runs in the account directory.
- **Side requests** (title, summary, compaction) get no manager server and no skill settings.
- **Notice.** `onManagerMcp` tells the host each turn whether the manager configuration was readable. The host keeps one revision per session while it is unreadable and clears it after a good read; RPC `cliGovernanceNotice` answers it and the card `src/cli-governance-notice.ts` (composer dock, order 6) shows it until dismissed.
- **Manage page.** The status answer carries `cliGovernance` (`mcp.state`, `mcp.included`, `mcp.excluded[{serverName, reason}]`, `pluginSkills[{plugin, skill}]`); the Claude card renders them in English and Arabic. Plugin skills are read from `<Provider settings>/plugins/cache/<marketplace>/<plugin>/<version>/skills/<skill>/SKILL.md`, names only.
- **Provider capabilities.** `cliTools.limitations` now also declares the credential limit.

## Final verification and review

- `npm run quality`: formatting, lint and all three typecheck projects pass. The Owner explicitly authorized formatting existing files without behavioral changes.
- `npm run build`, `npm test` (1574/1574), and `npm run check:build` pass after the final cleanup fix. Lifecycle mount/remount assertions now include the notice route and alias (57 routes).
- Independent read-only review task `2407ba90-051e-4501-a74f-d0b17a8258c9` inspected Standards and Spec. Standards: no concrete finding. Spec/security: one P1 race if abort completed cleanup during asynchronous configuration creation. Fixed by removing the newly created directory on the post-write abort path, even if cleanup already completed. `test/cli-mcp-abort-186.test.mjs` aborts during file creation and verifies no directory survives. Final full gates include this regression.

## Focused coverage

- `test/claude-cli-governance.test.mjs` (17): exact servers in the CLI's configuration (enabled and trusted in; untrusted, changed, disabled, credential and unsupported out), file mode and cleanup, changes applied on the next run, reserved name, component off or stopped, missing file, unreadable file with one notice per session and re-arming, no secret in warnings/notice/status, side requests, manager servers without DSH tools, manage-page data, plugin skills, capability text, skill switches by source and by copy, switching back and manager off, a name still provided by another copy, side requests carry no skill settings.
- `test/cli-governance-card-186.test.mjs` (7) and `test/cli-governance-notice-186.test.mjs` (5): English and Arabic rendering with a fake RPC.
- Existing suites touched only for the new surface: `subscriptions-browser` (new composer surface), `subscriptions-host` (route count 55 to 57, one endpoint plus its alias), `locale-completeness` (new source file listed), the control harness (routes, warnings capture) and fake CLI (`--settings` in its help, MCP servers recorded).
- `npm run typecheck` passes; the related suites (claude-*, mcp-*, skill-manager-policy and lifecycle, subscriptions-*, new files) pass.

## Limits

- No real CLI, sign-in, installed DSH or live MCP server was exercised. For #195: that a real `claude -p` accepts `--settings` JSON with `skillOverrides` and `--mcp-config` entries of these shapes, that `${VAR}` text in a manager server's arguments is expanded by the CLI where DSH would not expand it (a `${credential:...}` is excluded, other templates are not), and that the plugin-skill folder layout above matches a real CLI installation.
- A server's `env` and `headers` are written as saved to the 0600 file; a plaintext secret there reaches the CLI by design (the manager already warns about plaintext secrets and prefers credential references).
- Per-tool enforcement, project isolation and the CLI importing its native configuration stay out of scope (other tickets).
