# Waycraft managers own skills and MCP servers in Official CLI sessions

A provider's CLI loads its own skills, MCP servers and hooks from its config directory, so an Official CLI session would otherwise ignore what the Owner enabled in the Skill manager and MCP manager and run things they never see. By default Waycraft is the only source: each run is handed exactly the enabled MCP servers and skill visibility, and the CLI's own configuration is shut out (for Claude: `--mcp-config` with `--strict-mcp-config`, and `skillOverrides` through `--settings`). A per-provider switch, off by default, brings in the CLI's native configuration as a reviewed import into the Provider settings (ADR-0008) and lists what came from it read-only on the provider's manage page.

## Considered Options
- CLI configuration as the source: zero work and matches the terminal, but the two managers would stop meaning anything for these sessions.
- Always merge both: nothing is lost, but the Owner could no longer tell why a tool or skill is present.

## Consequences
- The CLI, not DSH, connects to MCP servers in these sessions, so the MCP manager's trust gate and connection test describe the configuration, not the live connection.
- Skills that ship inside a CLI plugin cannot be switched off one by one (Claude's `skillOverrides` does not reach them); they follow the plugin.
- A future Hook manager follows the same rule: hooks are defined once in Waycraft and compiled to each CLI's native format per run. Until it exists, native hooks are only shown, never edited.

## Decisions for the first provider (#186, Owner, 2026-11-14)
- **Enabled** means: the server is not in trash, is not `disabled: true`, and its trust is approved for exactly the configuration now saved. Untrusted, invalidated and disabled servers are not given to the CLI.
- **Manager state.** Each turn reads the manager's saved configuration (read-only, through the same store and path function the manager uses). The manager component off, or no configuration file, means no manager servers and the run continues with DSH's tools only. A file that exists but cannot be read also lets the run continue without manager servers and raises one notice per session. The CLI's own configuration is never read in any of these cases.
- **Credentials.** A server whose configuration contains `${credential:REF}` is left out and shown as "needs a credential". No secret is read or written for it. Resolving credentials through the CLI child's environment is a separate follow-up (#211) and starts by verifying that the plugin can reach DSH's credential store.
- **Plugin skills.** Skills inside a CLI plugin are only marked as following the plugin, in English and Arabic; there is no whole-plugin switch.
- Every server left out is listed on the provider's manage page with its name and a reason (names and reasons only, never a value).
