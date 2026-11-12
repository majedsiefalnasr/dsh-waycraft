# Waycraft managers own skills and MCP servers in Official CLI sessions

A provider's CLI loads its own skills, MCP servers and hooks from its config directory, so an Official CLI session would otherwise ignore what the Owner enabled in the Skill manager and MCP manager and run things they never see. By default Waycraft is the only source: each run is handed exactly the enabled MCP servers and skill visibility, and the CLI's own configuration is shut out (for Claude: `--mcp-config` with `--strict-mcp-config`, and `skillOverrides` through `--settings`). A per-provider switch, off by default, brings in the CLI's native configuration as a reviewed import into the Provider settings (ADR-0008) and lists what came from it read-only on the provider's manage page.

## Considered Options
- CLI configuration as the source: zero work and matches the terminal, but the two managers would stop meaning anything for these sessions.
- Always merge both: nothing is lost, but the Owner could no longer tell why a tool or skill is present.

## Consequences
- The CLI, not DSH, connects to MCP servers in these sessions, so the MCP manager's trust gate and connection test describe the configuration, not the live connection.
- Skills that ship inside a CLI plugin cannot be switched off one by one (Claude's `skillOverrides` does not reach them); they follow the plugin.
- A future Hook manager follows the same rule: hooks are defined once in Waycraft and compiled to each CLI's native format per run. Until it exists, native hooks are only shown, never edited.
