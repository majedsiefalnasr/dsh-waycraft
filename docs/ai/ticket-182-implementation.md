# Ticket 182 implementation

## Work contract

- Outcome: issue #182, Answer a text turn through the Claude CLI, under spec #179 only. Base: `feat/179-access-methods` at `09b08af`. Branch: `impl/182-claude-cli-turn`.
- Owner decisions (2026-11-12): the live-inventory linkage gate is replaced by an explicit shared-name allowlist (ADR-0008); each turn runs a fresh `claude -p` process with stream-JSON and `--session-id` first, `--resume` afterwards; turns enter only through the registered Claude adapter; no idle timer or between-turn state (spec, ADR-0005); an in-memory discriminated Direct/Official CLI account view with namespaced keys, token-free CLI variant and unchanged storage (ADR-0005); the cross-method Default lives in Provider settings with the legacy OAuth default as fallback; CLI accounts are excluded from automatic pools (#189).
- Allowed writes: Subscriptions CLI driver, translator, adapter routing, account view, Provider settings, Claude card and locales, tests, regenerated build output, specification, ADRs and state documents. No DSH changes, installed state, real credentials, main merge or release.

## Behaviour

- `ClaudeAdapter.streamAccount` routes `official-cli:` keys to a per-turn child: `claude [--system-prompt] -p --input-format stream-json --output-format stream-json --verbose --include-partial-messages --model <m> (--session-id <new> | --resume <id>)`, run in the account's own `CLAUDE_CONFIG_DIR` with the credential and endpoint variables scrubbed, one user message on stdin.
- The CLI session id travels in the message replay state, wrapped by the existing account replay so it is bound to its account. Resume is used on every later turn; DSH text history is sent only for a first turn, when the CLI reports a missing session (error result or stderr only; assistant text never counts), or when the account differs.
- Translator: documented partial stream events become text and reasoning chunks; completed assistant messages do not duplicate streamed text; unknown event types are ignored with one warning. Frames over 1 MiB are rejected.
- Admission: per-account cap (default 4, `cliMaxConcurrent`), abortable queue. Abort, caller cancellation (including during the version probe) and component disposal stop and drain every child.
- Links: before every run the allowlist is created in the Provider settings directory and linked into the account directory. A replaced link is reconciled with hash baselines under a provider-wide lock; conflicting bytes are preserved and the run fails closed.
- Default: `setDefault` stores a method-prefixed key in Provider settings; status marks it; the card enables the star for CLI accounts. The card states that provider API-key variables are removed from the CLI's environment.
- Provenance: [protocol evidence](../specs/claude-cli-turn-protocol.md) (official Python SDK revision `3cf3446b0fa6c97042e85b245bba07459f22f946`, read 2026-11-12, reference-only, nothing copied).

## Evidence

- `test/claude-cli-turn.test.mjs`: registered adapter with a fake executable that records arguments, environment and input: streamed text and reasoning once, `--session-id` then `--resume`, API-key variables absent, account directory, stdin envelope, missing-session fallback (stdout error result and stderr-only; unrelated failure with matching assistant text does not retry), account switch starts a fresh session with full history, abort, oversize frame, cap of four with abortable queue, disposal; no child remains.
- `test/claude-account-binding.test.mjs`, `test/claude-cli-lifecycle.test.mjs` (probe disposal and caller abort), `test/claude-cli-links.test.mjs`, `test/claude-cli-stream.test.mjs`, `test/account-kind.test.mjs`, plus updated card, owned-host and unified-flow tests.
- Final gates: `npm run typecheck`, `npm run build`, `npm test` (1494 passed, zero failed or skipped), `npm run check:build` (fresh output matches, no orphans), `git diff --check`.
- Independent Standards and Spec reviews found prepared-call account binding, missing per-account cap, inert idle state, discovery cancellation, link reconciliation races and baselines, and retry classification; all were corrected and re-reviewed with no open finding.

## Limits

- No real CLI, sign-in, Keychain, billing or installed app was exercised. The stdin envelope comes from the official SDK source, not a CLI reference page. The minimum CLI version (2.0.0) is the SDK's floor and there is no `--help` capability probe.
- No two-account concurrent reconciliation test; the provider-wide lock is verified by source review only.
- Media and harness-tool bridging, approvals and usage insights remain in their own tickets. Live acceptance is #195.
