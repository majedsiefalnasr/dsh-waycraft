# MCP discovery source assessment

Research date: 2026-11-10. Scope: select external discovery sources for Owner review; no catalog adapter or package execution is implemented by this assessment.

## Recommendation

Start with Official MCP Registry. Offer Glama as an optional second catalog only after accepting its attribution terms and configuring a credential reference. A GitHub repository view is a useful third discovery surface, but should offer documentation and manual configuration unless a supported, validated manifest exists. Do not implement Smithery's former API.

## Official MCP Registry — primary

Primary references:
- https://modelcontextprotocol.io/registry/about
- https://raw.githubusercontent.com/modelcontextprotocol/registry/main/docs/reference/api/openapi.yaml
- Live read-only sample (HTTP 200): https://registry.modelcontextprotocol.io/v0.1/servers?limit=2&version=latest&search=playwright

API: GET `/v0.1/servers` with `search`, `limit`, `version=latest`, and opaque `cursor`; preserve filters when following `metadata.nextCursor`. Search matches server names, not a guaranteed full-text description index. GET `/v0.1/servers/{encodedName}/versions/{version}` retrieves details. Use explicit latest filtering and deduplicate by canonical identity: default lists contain multiple versions, and lexical order is not version recency. Metadata has active/deprecated/deleted lifecycle status.

The sample required no authentication and returned server metadata, remote streamable-HTTP URLs, required headers and unresolved endpoint variables. A returned URL template is not ready-to-register configuration. The registry is metadata, not a package installer or security endorsement; its documentation still labels it preview. No code from this source is copied.

## Glama — optional curated catalog

Primary reference: https://glama.ai/mcp/reference (read through page extraction after direct fetch failed).

Directory reads require a Bearer API key. `/api/mcp/v1/connectors?first=10&sort=recommended%3Adesc` lists remote connectors; follow `endCursor` as `after` while `hasNextPage` is true. The documented maximum page size is 100. The server/source directory is distinct from remote connectors. Approved connector listings use streamable HTTP, but listing approval is not Waycraft trust approval.

The API data license requires visible credit on every data-bearing view and a direct record-specific Glama listing link on every result/detail surface, not hidden in a menu. Credential values must never enter browser settings, logs or catalog responses; consume an existing credential reference on the host if integration is approved. No authenticated endpoint was called and no account or credential was accessed. Attribution/commercial terms need Owner approval before integration.

## GitHub — repository discovery, not automatic installation

Primary reference: https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-repositories

Use the published repository-search API and explicit repository links as a supplementary source. Search results and README shell commands are not verified installation manifests. Repository stars are popularity, not trust. Do not auto-clone, run README commands or infer executable configuration. Expose View repository and Configure manually; only offer Add after parsing a supported manifest through the existing preview/approval flow. Pagination/rate-limit/authentication details must be verified before implementing this adapter; no GitHub API integration is claimed complete here.

## Smithery — exclude former API

Primary reference: https://www.smithery.ai/docs/api-reference/servers/list (HTTP 404 with official shutdown notice).

The official notice says Smithery API, Connect, Toolbox, accounts/API keys, CLI and SDKs shut down on 2026-10-31. The public directory remains, with direct publisher URLs. Previous API documentation and proxy URLs must not be used as integration contracts. Do not suggest a working API adapter on the basis of stale search results.

## Proposed Skills-style presentation

Use source tabs and a shared search/filter toolbar, flat divided rows, a clamped description, source/version/transport metadata, Details and one appropriate action. Existing state is keyed by canonical catalog identity plus version, not display name. Show Already added, Needs configuration, Unsupported transport or Available instead of implying every listing can be installed.

Details precedes registration: publisher/repository/source URL, selected version, exact command or URL, runtime prerequisites, required inputs and credential references, and conflict handling. Then preview and explicit Add server approval. Registration does not download packages, start a server or approve trust. A separate explicit action performs connection testing. Glama source credit and record links remain visible.

Local filesystem discovery remains a separate Scan local configurations action with explicitly approved roots; it must not be conflated with online catalog search or project runtime isolation.
