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
