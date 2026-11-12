# Ticket 180 implementation

## Work contract

- Outcome: issue #180, Add a Claude account through Official CLI, under spec #179 only. No CLI session execution or other ticket.
- Route: bounded `/implement`; existing approved assembled Subscriptions RPC/fake executable and manage renderer seams.
- Base: latest fetched integration tip `feat/179-access-methods` at `ab74e6d`; origin has no integration branch yet. Candidate: `impl/180-claude-cli`, isolated worktree `waycraft-180`.
- Host owns capability declarations, CLI discovery, isolated account directories and CLI login/status processes. Client owns method selection, warning presentation and account metadata. English/Arabic text and changelog accompany behavior.
- Allowed writes: Subscriptions account/auth/capability implementation, its client presentation/locales, relevant tests, regenerated build artifacts and task/current-state documentation. No DSH changes, installed state, real credentials, main merge or release.
- Acceptance: all criteria of GitHub #180; legacy accounts remain Direct sign-in without migration; models remain unique; no default CLI store access or credential reads for Official CLI.
- Verification: focused TDD allowed by Owner on 2026-11-12. Final verification, typecheck, independent Standards/Spec review, commit, merge and closure await explicit confirmation after implementation. Live sign-in and installed verification remain separate approvals.
- Investigation cap: two failed diagnostic attempts or 20 minutes per blocker. Stop on unresolved architectural decisions or required out-of-scope work.

## Progress

Read authoritative issue/spec, project gates, glossary and ADR-0008. GitHub reports no blocking issues. Candidate worktree created; unrelated untracked scratch in the original checkout preserved. Implementation started with focused assembled-RPC TDD. Capability metadata/default-method test observed red then green. Missing-CLI discovery observed red (unregistered endpoint) then green; it returns the official installation command, creates no account and performs no credential reads. Focused combined run: 2/2 passed. Host files were transpiled without typechecking for these cycles; generated artifacts are provisional until the approved final canonical build. Locked dependencies installed with scripts disabled; npm reported 16 dependency vulnerabilities (1 moderate, 15 high), not remediated outside scope. CLI version probing now also observed red then green through assembled RPC: resolves the executable, runs bounded `--version` in an owned probe directory with isolated `CLAUDE_CONFIG_DIR`, rejects invalid/failed output, and awaits managed-process cleanup. Focused combined run: 3/3 passed. Further focused TDD now covers owned per-attempt PTY allocation, current-login-only input/output, bounded output, cancellation, concurrent-start exclusion, failed exit handling, provider boundaries, scoped `auth status --json` identity allowlisting, and identity reset between attempts. Current focused run: 12/12 passed. No real executable has been used; fixtures currently supply the public process interface, with the required fake-executable coverage still pending. Account identity metadata is now persisted atomically in owned storage and listed alongside explicitly Direct legacy accounts; shared provider settings starts empty. Additional focused red-green slices cover awaited verification teardown and the public subprocess dependency declaration. UI now has a capability-driven default selector, selected-method login routing, and warning text/source/date with English/Arabic strings. UI regression observed red then green for selector, warning metadata and login routing. Remaining: embedded terminal presentation, missing-CLI installation UI, per-account warning/method display, single-method behavior coverage, actual fake-executable coverage, shared non-login settings links, and any necessary selection/token-path safeguards. No final gate, real CLI, installed check, commit or merge.

## Latest implementation evidence

- Fake executable coverage is now implemented: assembled RPC discovers the generated Node executable, starts its login process, verifies scoped JSON identity and persists the allowlisted account. Injected token fields do not escape. This adapter uses pipes, not a real PTY, so PTY behavior remains unverified.
- Real React renderer coverage now checks the default method, policy warning, chosen RPC method and missing-CLI installation presentation in both English and Arabic (2 focused cases passed).
- Login responses and terminal presentation include detected executable path/version. Capability-based setup uses one selected-method login action, not legacy Keychain-import actions. CLI cards do not request Direct usage or allow deferred switching/removal controls.
- Focused red-green cases cover releasing a successful terminal before clearing its presentation and a failed-login notice that retains output. Final canonical build, typecheck, full verification, independent review and live host checks have not run.
- Owner clarified the linkage boundary on 2026-11-12: #180 creates only the isolated account directory and empty provider-settings directory, with no links. Before the first CLI session, #182 must obtain Owner approval for an observed file-name inventory and written account-private/shared policy, then implement initial links. #187 covers the second account, repair and deletion, not initial linkage. No real login or inventory is authorized in #180. Implementation handoff is ready for the Owner's final-gate decision. Additional focused red-green evidence covers cancellation waiting for in-flight identity cleanup, invalidating the login before terminal termination (preventing a successful termination from starting identity verification), explicit localized warning levels, and suppressing legacy default-store import guidance in the capability-driven flow. No final gate is authorized yet. This is implementation-ready, not an accepted or completed ticket; canonical build, typecheck, full tests and independent review may identify required corrections.

## Approved credential-storage interpretation

Owner approved CLI-managed login storage scoped to each account's Waycraft-owned directory, including a macOS Keychain entry keyed to that directory. Waycraft must never read or write credentials except under later Account insights opt-in; the default CLI directory and its Keychain entry must never be read, linked or written by the Official CLI flow. Updated #180's acceptance wording verbatim and ADR-0008 before code changes.

Recorded the Owner's #187 follow-up in https://github.com/majedsiefalnasr/dsh-waycraft/issues/187#issuecomment-6818888363: run account-scoped CLI logout before deleting the directory to avoid orphaned Keychain entries; tests use a fake CLI only. No #187 implementation is authorized or started. The storage clarification is resolved; continue #180 implementation with focused TDD.

Owner also approved an interactive login terminal embedded in Subscriptions, using the public PTY API with Waycraft-owned presentation and lifecycle. The settings flow must not fabricate a conversation Session or use private host APIs. This approval does not authorize real CLI login, installed-state changes, or final verification.

Sources: https://code.claude.com/docs/en/authentication and https://code.claude.com/docs/en/troubleshoot-install . No real CLI, Keychain or account store was accessed.

Documentation lookup initially failed because the default npm cache is not writable; retry uses a workspace-local cache without altering the user's npm state.

## Final verification and review (2026-11-12)

The Owner confirmed the final gate. The canonical build, `npm run quality` (format, lint, typecheck) and the full `npm test` pass, and `npm run check:build` confirms the committed output matches a fresh build. The first full run exposed expectations the change legitimately altered (route counts 45 to 53, the login `method` enum message, Claude add-flow fixtures that must now select Direct sign-in because Official CLI is preselected) and one real regression: `subprocess` had been declared as a hard dependency, which stopped the whole component mounting without it. It is now resolved lazily, so only Official CLI operations report its absence.

Independent Standards and Spec reviews ran against the recorded base `ab74e6d` (read-only subagents, default model route). Applied after review, each observed red before green where testable:

- The signed-in identity now reaches the account card (`account`, `plan`); the Spec review found it was not rendered.
- A corrupt or partly invalid `accounts.json` skips entries instead of breaking Claude `status` for Direct accounts.
- A cancel that arrives while the metadata file is staged no longer publishes the account.
- One scrubbed-environment constant and one storage helper replace repeated literals.
- The card stops polling after a failed or finished attempt, drops the terminal and reports the error when the host lost the attempt, and no longer spreads a stale closure.
- The duplicated warning markup is one helper; legacy accounts without a stored method are covered by a test showing Direct sign-in and its warning.

Known residuals, deliberately not fixed here:

- A failed or cancelled attempt leaves `accounts/<id>/` (and possibly a directory-keyed Keychain entry) with no record. Deleting the directory without the CLI's own logout would orphan the Keychain entry, so cleanup belongs with #187's logout-then-delete.
- `accounts.json` is read-modify-written without a lock; fine for one login at a time, to revisit when #187 deletes concurrently.
- The stored `cliPath` is display metadata only; session tickets must resolve the executable again and never run it from metadata.
- The login terminal's environment sets only `CLAUDE_CONFIG_DIR`. The subprocess provider scrubs ambient credentials for children, but no test proves it for the PTY; #182 owns the API-key-variable guarantee and its test.
- The warning appears beside the login action before it is used; there is no separate confirm dialog.
- Host tests drive a fake executable over pipes, not a PTY. Live sign-in, real PTY rendering, Keychain behaviour and the installed app are not verified.
