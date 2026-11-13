# Ticket 185 implementation

## Work contract

- Outcome: issue #185, Give the CLI DSH's tools and serve side requests, under spec #179 only. Base: `feat/179-access-methods` at `ec453e9`. Branch: `feat/185-cli-dsh-tools`.
- Owner decisions (2026-11-13), all recorded on #185 (comments 6851266572 and 6851691054) and in `docs/specs/access-methods.md` ("Tools and approvals"):
  - Transport: a short-lived HTTP MCP server per CLI turn, not a spawned stdio helper, because tool calls must reach the in-process `ToolRuntime` and its approvals; a helper would need a new cross-process protocol.
  - Allowlist: exactly `get_goal`, `create_goal`, `update_goal`, `web_search`. DSH's `subagent`, `wait_agent` and the job tools are not offered: `subagent` returns a name at once and reports completion later, `wait_agent` has no agent-id argument and no public contract for same-session scoping or turn cancellation, and the job tools only observe jobs that no allowed tool starts. The CLI uses its own native subagents. No DSH change and no DSH `bash`.
  - Scope: the temporary config holds only Waycraft's server and is used with `--strict-mcp-config`. Reading the MCP manager is #186 (open questions recorded on #186, comment 6862440823).
- Allowed writes: Claude CLI driver, a new bridge module, provider capabilities, tests and fixtures, regenerated build output, spec, changelog and state documents. No DSH changes, installed state, real credentials, push, main merge or release.

## Behaviour

- **Endpoint.** `src/auth/claude-cli-mcp.ts` starts, for one turn, an HTTP server on `127.0.0.1` with a port the system picks, using the MCP SDK's Streamable HTTP transport. It offers only the allowlisted tools that `ToolRuntime.schemas(agent)` shows for the session.
- **Credential.** A random 32-byte token is written only to a private per-run directory under the account directory (`.waycraft-mcp-*`, file `mcp.json` created exclusively with mode `0600`). The CLI receives the file path through `--mcp-config`. The token is never in argv or in the environment.
- **Request checks** (before any MCP handling): path `/mcp`, `Host` exactly `127.0.0.1:<port>`, no `Origin` header, and a constant-time bearer-token comparison. Anything else gets 401 with no body.
- **Execution.** A call runs `ToolRuntime.execute` with the session's agent and the turn's abort signal, so DSH's normal policy, guard and approval pipeline applies. A name outside the offered list is refused.
- **Lifecycle.** The listener closes and the config directory is removed when the turn ends, is aborted, fails to start the process, or the adapter is disposed (the abort signal, the `finally` of the turn and `disposeCliTurns` all reach one idempotent close). Abort before, during or after start is handled.
- **Side requests.** A request DSH tags with a purpose (`session-title`, `compaction`) runs with `--tools ''` (required, so an unsupported flag fails instead of leaving tools on), `--max-turns 1` (optional; with no tools a turn is single anyway), `--strict-mcp-config` and no `--mcp-config`.
- **Ordinary turns** use `--strict-mcp-config` and `--mcp-config`, both required: a CLI that lacks them fails with the missing flag named (dropping `--strict-mcp-config` would load the CLI's own servers, against ADR-0006). A session with no agent or no tool service still runs, without DSH tools, and a warning is logged.
- **Cap and processes.** Unchanged and already in place from #182: one process per turn, a per-account admission count (default 4, a setting), waiters woken when a slot frees. New tests now cover it (see below).
- **Provider capabilities.** `cliTools` declares the allowlist and the limitation that DSH subagents are unavailable in CLI sessions.

## Evidence

New tests in `test/claude-cli-control.test.mjs` (35 in the file; the full suite is 1544, all passing):

- allowlist and strict config: only the four tools are listed (a fifth, `read_page`, is offered by the stub and absent), the config holds one server, mode `0600`, no token in the environment, a real MCP client in the fake CLI lists and calls `web_search`, `ToolRuntime.execute` receives that name and arguments, the session's agent and an abort signal; wrong Host, missing token, wrong token and an `Origin` header each get 401; the config directory is gone after the turn;
- cancellation: the endpoint refuses connections and the config directory is gone;
- side requests: `--tools ''`, `--max-turns 1`, `--strict-mcp-config`, no `--mcp-config`, no tool service call, no MCP evidence;
- a session without an agent runs, with no `--mcp-config` and still `--strict-mcp-config`;
- four sessions on one account run in four distinct processes, a fifth waits (no new process) and starts when one ends.

Existing suites updated only for the new required flags and services: `claude-cli-turn` and `claude-cli-compat`. Gates: `npm test` 1544/1544, `npm run typecheck`, `npm run lint`, `npm run check:build`, `git diff --check`, all passing.

## Review

Independent Standards and Spec review (two sub-agents) against `ec453e9`.

- Fixed: side requests still passed `--tools default`, no turn limit and no strict MCP flag, so criterion 2 was not met; failing every turn when the tool service or agent is missing (now it degrades, as turns did before this ticket); a placeholder substitution with a redundant second rewrite and an unreachable empty path; a duplicated missing-flag check; a redundant allowlist test in the call handler; the missing changelog entry; criteria 3 and 4 had no new tests (added); the cancellation test did not prove the listener closed and the allowlist test did not prove exclusion (both now do).
- Accepted as judgement calls: the same small tool and agent stubs declared in three test files; the fixture's four similar `fetch` probes; a `content as never` cast for the SDK result type; the port read from the listener on each request; `cliTools` and `cliServices` as sibling callbacks; `cliTools.limitations` is declared (Owner-requested) but nothing renders it yet.
- Not changed: the formatter already failed on `claude.ts` and other baseline files; only the new file is formatted.

## Limits

- No real CLI, sign-in, installed DSH or live approval was exercised; the fake CLI uses the MCP SDK client. Live acceptance (#195) must confirm: that a real `claude -p` connects to an `http` MCP server with a bearer header from `--mcp-config` and lists the tools; that `ToolRuntime.execute` raises DSH's real approval dialog; and whether the CLI also asks its own `can_use_tool` for `mcp__waycraft-dsh-tools__*` tools, which would give two prompts for one call (not addressed here).
- The transport is stateful and serves one MCP session per turn; a CLI that reconnects with a new `initialize` mid-turn would lose the tools for that turn. Not observed, not tested.
- "Two subagents run in separate processes" is shown for two DSH sessions on one account (each turn is its own process). A subagent the CLI starts itself runs inside that CLI process and is the CLI's own.
- Tool results returned to the CLI are the ones DSH produced; no extra masking is added.
