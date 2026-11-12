# Claude CLI turn protocol evidence (#182)

Read date: 2026-11-12. This is protocol research, not copied SDK implementation.

Primary sources:

- [Official CLI reference](https://code.claude.com/docs/en/cli-reference): noninteractive `-p`, stream-json input/output, verbose output, partial messages, session ID and resume options.
- [Official headless guide](https://code.claude.com/docs/en/headless): programmatic CLI execution and streaming output.
- [Official Agent SDK streaming input](https://platform.claude.com/docs/en/agent-sdk/streaming-vs-single-mode).
- [Official Python SDK client at 3cf3446](https://github.com/anthropics/claude-agent-sdk-python/blob/3cf3446b0fa6c97042e85b245bba07459f22f946/src/claude_agent_sdk/_internal/client.py): constructs the user input envelope with `type: user`, empty `session_id`, null `parent_tool_use_id`, and `message` containing `role: user` and the prompt as `content`.
- [Official Python SDK subprocess transport at 3cf3446](https://github.com/anthropics/claude-agent-sdk-python/blob/3cf3446b0fa6c97042e85b245bba07459f22f946/src/claude_agent_sdk/_internal/transport/subprocess_cli.py): pipe transport and newline-delimited JSON framing with stream-json input/output and verbose output. The SDK also initializes a control channel; Waycraft does not implement SDK tools or copy that control-channel implementation.

Discovery requires Claude Code 2.0.0 or newer, the floor declared by `MINIMUM_CLAUDE_CODE_VERSION` in the linked official SDK subprocess transport. This is a compatibility floor, not a claim every later binary supports all requested flags; unsupported runtime flags fail visibly rather than falling back to a different transport. Help text is not treated as an exhaustive capability list.

Waycraft uses one noninteractive subprocess per turn, explicitly requests partial messages, sends one newline-terminated user envelope, and closes stdin. First turns use `--session-id`; compatible persisted replay uses `--resume`. A new CLI session receives the available DSH text history as contextual text; resumed sessions receive the latest user text. This slice does not implement harness-tool bridging or media input.

Account selection remains in the registered provider adapter and account-preferences/replay layer. CLI metadata contains no API tokens. Process environment overrides remove credential and endpoint selectors; account config directories are Waycraft-owned and reconciled with the provider shared-path allowlist before execution. Authentication remains the separate PTY flow.

Evidence is fake-executable integration, not live CLI/provider verification. No SDK source was copied into the implementation; links above document protocol provenance only.

## Control channel, tool activity and stdin (#184)

- **stdin.** The subprocess service accepts `'ignore'`, `'pipe'` (a writable `stdin` the caller ends) and `{ data }` (written, then ended); it has no `{ text }` form. A turn starts with `stdin: 'pipe'`, writes the one user envelope, keeps stdin open for control replies and ends it when the `result` frame arrives so the CLI exits. This replaces the #182 `{ text }` form, which that service does not read.
- **Control requests.** With `--permission-prompt-tool stdio` the CLI writes a `control_request` line on stdout (`request.subtype` `can_use_tool`, with `tool_name`, `input`, `tool_use_id`) and waits for a `control_response` line on stdin (`response.subtype` `success`, the same `request_id`, and `response` holding `behavior` `allow` with `updatedInput`, or `behavior` `deny` with `message`). `control_cancel_request` withdraws one. `AskUserQuestion` is answered with `allow` and `updatedInput.answers` keyed by question text; `ExitPlanMode` carries `input.plan`. Source: the Agent SDK `query.py` control handling and the Agent SDK user-input documentation (read 2026-11-12).
- **Tool activity** is drawn inline as markdown text blocks. DSH's public stream types cannot express a provider-executed tool call; a `tool-call` block would make DSH run a DSH tool. DSH tool cards through `Session.append` rows are tracked in #210.
- **Permission mode** follows DSH's file policy as declared in `provider-capabilities.ts` (`permissionModes`): read-only `plan`, workspace-write `acceptEdits`, danger-full-access `bypassPermissions`, anything else `default`.
