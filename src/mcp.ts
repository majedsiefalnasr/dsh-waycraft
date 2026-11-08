/**
 * Waycraft MCP Manager — host-side component entry point.
 *
 * V1 (Option D — Supported-only V1) scope: this component is a default-disabled
 * Loader row that does not connect to or execute MCP servers, does not modify
 * live MCP configuration, and exposes no management surface yet. Later tickets
 * add host authorization, config schema, and the browser UI on top of this
 * scaffold.
 */
export const name = 'dsh-waycraft/mcp';
export const inject: string[] = [];

export interface Config {}

export function apply(ctx: any, config: Config = {}): void {
  // Scaffold: no services, no routes, no state. Future tickets populate this.
  void ctx;
  void config;
}
