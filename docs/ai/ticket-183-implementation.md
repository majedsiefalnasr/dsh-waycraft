# Ticket 183 implementation

## Work contract

- Outcome: issue #183, Handle CLI versions and missing flags, under spec #179 only. Base: `feat/179-access-methods` at `8761dca`. Branch: `feat/183-cli-version-flags`.
- Allowed writes: Claude CLI driver and discovery, provider capabilities, status, Claude card and locales, tests, regenerated build output, changelog and state documents. No DSH changes, installed state, real credentials, main merge or release.

## Behaviour

- `CLAUDE_CAPABILITIES.cli` declares `minimumVersion` (2.0.0, the Agent SDK floor), `updateCommand` (`claude update`) and a source link.
- `discoverClaudeCli` returns `available: false, updateRequired: true` with version, minimum and command for an older CLI. A run throws the update message before any process for the turn starts; sign-in returns the same answer and starts no terminal.
- Flag probe: `claude --help` in the probe directory, once per `path@version` (shared by concurrent turns; an aborted probe is retried). Optional flag: `--include-partial-messages`. Required: `--print`, `--input-format`, `--output-format`, `--verbose`, `--model`, `--session-id` or `--resume`, and `--system-prompt` when a system prompt is sent. An unreadable help page judges nothing in advance.
- Run-time refusal: the CLI's stderr "unknown option '--x'", before any output, for a flag this run passed. Optional: remembered, dropped and retried once; the same flag cannot be refused twice. Required: reported by name, one attempt.
- Status carries `cli { version, minimumVersion, updateRequired, updateCommand, source }` (30 s cache, only when CLI accounts exist); the card shows the notice per Official CLI account and instead of "not found" when sign-in is refused.

## Evidence

- `test/claude-cli-compat.test.mjs` (10), `test/claude-owned.test.mjs` (login on an old CLI, status), `test/claude-card.test.mjs` (en/ar notice, sign-in refusal); `claude-cli-turn.test.mjs` fake now answers `--help`.
- Final gates: `npm run typecheck`, `npm run build`, `npm test`, `npm run check:build`, `git diff --check` (see the closing message of the ticket for counts).
- Independent review (medium): 7 findings. Fixed: concurrent duplicate probes, retry after output was streamed, refusal read from model output, duplicated source URL. Accepted: required flags are judged from the help page (a CLI that hides one would be blocked; live acceptance #195 checks real help output); 30 s status cache after `claude update`; cache keyed by path and version; refusal wording recall limited to commander/argparse phrasing.

## Limits

- No real CLI, sign-in, billing or installed app was exercised.
