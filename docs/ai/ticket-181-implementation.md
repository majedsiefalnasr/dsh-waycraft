# Ticket 181 implementation

## Work contract

- Outcome: issue #181, Explain the extra-usage error on Direct sign-in Claude accounts, under spec #179 only (user story 52).
- Base: integration tip `feat/179-access-methods` at `df784ed`. Candidate: `impl/181-extra-usage-explanation`, worktree `waycraft-181`.
- Seams (pre-agreed in the spec): the assembled Subscriptions component with a fake network (host), and the real renderer with a fake RPC in English and Arabic (client).
- Allowed writes: Claude adapter, pool classification, one RPC endpoint, one session card with its locale text, tests, regenerated build output, changelog and state documents.
- Owner decision (2026-11-12): the action surface is a card in the `conversation.composer.dock` slot, because DSH exposes no public way to open Settings from a session. The action opens a modal dialog containing the existing add-account card (presentation `auth`, Official CLI preselected). The initial inline implementation was flagged by Spec review and corrected.
- Verification: Owner confirmed final gates, review corrections, commit, integration merge and closure. Independent Standards and Spec reviews ran against `df784ed`; final corrected verification remains in progress.

## Behaviour

- The host recognises the 400 by status and Anthropic's sentence, throws `EXTRA_USAGE_REQUIRED` with an English explanation, and records the session. The pool classifier rethrows that code, so no other account is tried and nothing retries it. Any other 400 keeps `HTTP_400` and its raw text.
- `waycraft-subscriptions.extraUsageNotice` (Claude, `sessionId`) answers `{ active: true, revision }` or `{ active: false }`; each refusal gets a new revision so dismissal cannot conceal a later refusal. The record clears when a later turn of the session is accepted.
- The card polls that endpoint every 3 seconds, shows the localised explanation, and can be dismissed until the next refusal.

## Evidence

- `test/claude-extra-usage-181.test.mjs` (3 cases): explanation, single request and no second account in a two-account pool, per-session notice, other 400 unchanged, notice cleared by a later accepted turn.
- `test/extra-usage-notice-181.test.mjs` (10 cases): English and Arabic render, public Modal opens Official CLI, inactive/failing lookup, revision-scoped dismissal, serialized polling and stale-session replies, pending-close/cancellation with the real ClaudeCard and fake RPC, locale keys.
- Final cumulative gates passed again after the follow-up CLI-cancellation correction: `npm run build`, `npm run quality` (format, lint, typecheck), `npm test` (1486 passed, zero failed/skipped), `npm run check:build` (fresh output matches, no orphans), and `git diff --check`.
- Independent Standards and Spec review identified missing dialog, abandoned login, and dismissal/poll races; corrections retain pending login until cancellation, use the public Modal and per-refusal revisions, and serialize advisory polling. Initial route-count and unstaged-source packaging failures were corrected before the successful full run. Follow-up Spec review caught generic OAuth cancellation masking CLI cancellation; the card now awaits `cliCancel({ loginId })` even when OAuth `busy` is false. The realistic renderer regression rejects generic cancellation and asserts the exact CLI identity before unmount. Reviewer follow-up found that blocker resolved.

## Limits

- Real Anthropic enforcement and the card in the installed app are not verified. The public Modal is contract-doubled in renderer tests; native portal focus, Escape and backdrop rendering were not browser-verified. Existing React renderer deprecation/act warnings remain.
- The card polls; a refusal appears within about 3 seconds.
- Sessions are remembered in memory (capped at 256) and are lost on a host restart.
