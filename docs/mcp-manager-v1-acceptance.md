# MCP Manager V1 — Integration and Acceptance Verification (#176)

Status: Gate 2 verified again on 2026-11-11; Gate 3 remains open. Owner separately authorized sequential completion, PR/merge/push and npm/GitHub release. That authorization does not substitute for missing human acceptance, authentication or publication evidence.

## Latest release-gate evidence — 2026-11-11

Final tab-accessibility repair verification: `npm run ci` passed **1429/1429 tests, zero skips**, formatting/lint/all TypeScript projects and fresh-build byte comparison. Built Chromium MCP/Registry passed **14/14, zero skips**. The new DOM regression failed before the fix, then passed for area/detail Arrow/Home/End selection and actual focus in English/Arabic; tabs and panels now have unique linked IDs. Package dry-run remains 128 files without forbidden material. Assembled client SHA-256: `d634ab3eb85e669aea42e21df9de1f9235e1bd2c2a77c4c7b1299db10e5f7df5`. This new tab repair is not yet installed; the earlier Desktop modal-focus proof applies to the preceding installed candidate only. Independent human reviews, screen-reader/contrast audit and consolidated Owner acceptance remain outstanding. No criteria are silently waived.

- Clean locked dependencies installed; canonical `npm run build` now regenerates both Subscriptions and MCP browser factories plus host modules.
- `npm run ci` passed: formatting, lint, all TypeScript projects, **1424/1424 tests with zero skips**, and a fresh-build byte comparison with no orphan artifacts.
- Built-artifact Chromium fixtures passed **13/13 with zero skips**, covering MCP UI and Official Registry flows, English/Arabic, narrow/wide layouts and component absence. These fixtures are not authenticated installed-host proof.
- MCP test setup no longer compiles into shared `dist` or imports ignored private worktrees. Two independent overlapping processes passed 75/75 each without changing nine MCP host artifact hashes or mtimes; focused portability/isolation verification passed 83/83.
- `npm pack --dry-run --json` listed 128 files, including all MCP host/browser modules and both locales. No scratch, tests, private worktrees, rollback backups, node_modules or Finder metadata were included. This is an allowlist check, not an npm publication.
- Final Standards review found no new blocking violation. Spec review found one remaining stale-cache race when an explicit connection test completed before an older automatic read; the fix now invalidates that read for both success/failure, with two regressions observed failing before the fix and passing afterward. Full CI and all 13 Chromium fixtures passed again. A targeted recheck caught a retained loading indicator after superseding the old read; probe start now also settles that read's loading/error state, with both outcome regressions asserting no stuck status. Final independent targeted recheck closed the race/settlement finding: all three late-hydration cases passed (refresh, successful test, failed test), with no new blocker. Gate 3, full manual accessibility and actual release remain unverified. Earlier dated counts below are historical.

## Scope

Waycraft MCP Manager V1 supported capabilities only (Option D). **Excluded from V1 acceptance:** per-tool model-visible filtering/execution blocking, per-tool policy persistence across reconnects/restarts, strict Global/Project isolation/inheritance, project/session/subagent policy enforcement, runtime policy persistence after Component shutdown (spec §17 deferred, §19).

## Gate 1 — Compatibility (evidence)

- MCP Manager shipped as independent default-off `waycraft-mcp` component row (`cordis.patch.yml`), plugin exports/manifest wiring present (`package.json`, `src/mcp.ts` `dsh-waycraft/mcp`).
- Uses supported DSH/Cordis patterns available in repo context (Owner-authorized host RPC `/api/waycraft-mcp.manage`, cordis patch config persistence adapter, MCP client probe/capability usage). No private DSH runtime APIs introduced in changed MCP modules.
- Unsupported/deferred capabilities explicitly excluded from UI claims and acceptance tests.
- Blocking compatibility gaps: **none observed in automated MCP suite**; runtime behavior on installed DSH requires Owner Gate 3 installed acceptance where applicable.

## Gate 2 — Automated Verification (macOS evidence, 2026-11-09 Africa/Cairo)

Environment: macOS (darwin), Node v24.22.2, repo worktree `imp/ticket-16` with MCP dist/deps prepared.

| Area | Command | Result |
|---|---:|---:|
| MCP automated suite (all `test/mcp-*.mjs`) | `node --test test/mcp-*.mjs` | **82 pass, 0 fail** |
| Security (credentials, host auth, trust) | `node --test test/mcp-credentials.test.mjs test/mcp-host-auth.test.mjs test/mcp-trust.test.mjs` | **18 pass, 0 fail** |
| Browser EN/AR/unauthorized/RTL integration | `node --test test/mcp-browser-ui.test.mjs` | **5 pass, 0 fail** |
| Persistence/lifecycle/config recovery | `node --test test/mcp-persistence.test.mjs test/mcp-schema.test.mjs test/mcp-adoption.test.mjs` | **20 pass, 0 fail** |

### V1 critical scenario mapping (spec §17)

- Server listing and CRUD operations succeed — `mcp-persistence`, `mcp-schema`, host/RPC paths in MCP tests.
- Connection test reports success/failure without deleting valid saved config — `mcp-connection-test`.
- Read-only tool enumeration displays tools without implying enforcement — `mcp-tool-enumeration`, `mcp-browser-ui`.
- Import/discovery do not execute unapproved commands — `mcp-import`, `mcp-discovery`, trust tests.
- Trust approval/rejection paths work correctly — `mcp-trust`, connection/enumeration trust gates.
- Credential references handled securely (no plaintext leakage) — `mcp-credentials`.
- Non-destructive adoption preserves existing entries — `mcp-adoption`.
- Configuration persistence and recovery work correctly — `mcp-persistence`.
- Trash/Restore/Permanent Delete behave operationally — `mcp-trash`.
- Component lifecycle preserves saved state — scaffold/toggle/adoption/persistence coverage.
- Authorization and paired-client restrictions enforced — `mcp-host-auth`.
- English/Arabic RTL, accessibility, regression tests pass — `mcp-browser-ui`.

## Security

- Credential leakage: plaintext secret rejection/redaction assertions (`mcp-credentials`).
- Authorization boundaries: Owner-only management RPC, paired/non-owner rejection, missing marker rejection (`mcp-host-auth`).

## Accessibility / RTL

- Browser integration tests assert RTL container direction (`dir="rtl"`), Arabic labels, LTR-readable technical strings (`bdi`/technical isolation), tab/search/aria roles and responsive container query style presence (`mcp-browser-ui`). Full manual accessibility audit not automated; automated evidence is **partial** and requires Owner/Gate 3 review.

## Cross-platform persistence

- macOS persistence/crash-boundary/temp-file/path smoke covered by `mcp-persistence`. **Windows/Linux behavioral verification not executed in this environment** (spec allows “where applicable”; do not claim unsupported OS behavior).

## Reviews / build / packaging / provenance

- Standards + Spec reviews: run as subagent reports for `fb02062..feat/mcp-manager` (attach findings to issue/PR review). Independent human review still required for Gate 2/3 completion claims.
- Typecheck/lint and fresh-build byte comparison: passed in the canonical `npm run ci` run after the shared-modal fix (1425 tests, zero skips). The 1424 count above predates that fix; subsequent accessibility fixes require their own final gate run.
- Packaging allowlist rechecked on 2026-11-11 at `cbd4879`: `npm pack --dry-run --json` reported 128 files, all eleven MCP artifacts and both locales, with no scratch, test, node_modules, rollback backups or Finder metadata. No package was published.
- Source/build traceability: canonical locked-dependency build and fresh comparison link the candidate source to committed artifacts. This is not registry publication provenance; npm OIDC provenance can only be verified after the separately authorized release pipeline executes.
- A bounded independent accessibility review at `cbd4879` found missing keyboard navigation and tab-panel naming associations in both tab widgets. This is a blocking finding under repair, not a passing audit. Independent agent reviews do not satisfy the required human reviews or manual screen-reader/contrast audit.

## Gate 3 — Owner Acceptance

**Pending.** Requires consolidated Owner acceptance session after automated verification. Passing automated tests does not authorize install, push, or release.
