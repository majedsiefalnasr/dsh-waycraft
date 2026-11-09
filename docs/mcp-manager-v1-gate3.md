# MCP Manager V1 — Gate 3 Owner Acceptance Package (#176)

**Purpose:** consolidated Owner acceptance session after Gate 2 automated verification (spec §17, Gate 3).  
**Status:** pending Owner execution. **This document does not authorize installation, source push, release, npm/GitHub publication, or live DSH configuration changes.**

## Evidence already available

- Automated MCP suite (macOS, Node v24.22.2, 2026-11-09 Africa/Cairo): `node --test test/mcp-*.mjs` — **82 passed, 0 failed**.
- Focused evidence: security 18 passed (`mcp-credentials`, `mcp-host-auth`, `mcp-trust`); browser EN/AR/RTL/unauthorized 5 passed (`mcp-browser-ui`); persistence/adoption/schema 20 passed.
- Critical review fixes merged to `feat/mcp-manager`: `remove`/`delete` RPC aliases require explicit confirmation for permanent delete; host-side Owner auth defense-in-depth fails closed for explicit non-Owner/unknown peer metadata; MCP SDK fallback uses package imports; CHANGELOG entry added.
- Detailed report: [docs/mcp-manager-v1-acceptance.md](mcp-manager-v1-acceptance.md).

## V1 scope guard (must hold during acceptance)

Accept only **supported V1 capabilities**. Do **not** treat these as V1 failures or V1 requirements:
- Per-tool model-visible filtering / per-tool execution blocking / per-tool policy persistence across reconnects/restarts.
- Strict Global/Project MCP isolation, project inheritance/overrides, project/session/subagent MCP policy enforcement.
- Persistent runtime policy enforcement after the MCP Manager Component is shut down.

UI/API must not imply those deferred guarantees.

## Preconditions (Owner-controlled)

1. Use an environment/build where `feat/mcp-manager` (or the candidate commit/release artifact) is available through the normal, authorized DSH/Waycraft workflow. **Do not** treat this checklist as authorization to install.
2. Confirm you are acting as **Owner** in the host UI/session being tested.
3. Have a safe test MCP config source (local fixture files/approved folders and/or non-sensitive test entries). **Do not use real production secrets** for manual tests.
4. Record: environment (OS, DSH build/profile), commit/tag/artifact, tester, date/time (Africa/Cairo or local), and result for each step.

## Focused manual acceptance steps

Mark each: **Pass / Fail / N/A** with notes and evidence (screenshot/log reference if useful).

### A. Component lifecycle and safe default
| # | Check | Expected |
|---|---|---|
| A1 | MCP Manager component is present but **default off** in a fresh/expected profile state. | `waycraft-mcp` is not active until explicitly enabled by Owner. |
| A2 | Enable component, reload/reopen as required by DSH. | Waycraft MCP Manager settings area appears; no crash; saved state preserved if previously configured. |
| A3 | Disable component. | Management UI interventions stop; saved config/policy data remains preserved; no claim that shutdown gives persistent runtime enforcement. |

### B. Authorization boundaries (manual sanity)
| # | Check | Expected |
|---|---|---|
| B1 | As Owner, management actions work (list/status). | Authorized responses; no unauthorized error. |
| B2 | If a paired/non-Owner client path is available in your environment, attempt MCP management. | Access denied / not authorized. Do not bypass host authorization. |

### C. Server CRUD, persistence, conflict safety
| # | Check | Expected |
|---|---|---|
| C1 | Add a safe test server config (supported transport). Save. | Entry appears in server-centric list; no plaintext secret shown in UI/log surfaces. |
| C2 | Edit the entry, save again. | Changes persist after reload/reopen. |
| C3 | Simulate stale/conflicting edit if UI exposes fingerprint/concurrency feedback (or repeat from two views if applicable). | Conflict is reported clearly; no silent overwrite of newer data. |
| C4 | Invalid config/save failure path. | Actionable error; previously valid saved config is not corrupted/deleted by a failed test/apply attempt. |

### D. Trust and explicit operations (no auto-execution)
| # | Check | Expected |
|---|---|---|
| D1 | Before trust approval, attempt an operation that requires trust (explicit connection test / explicit tool enumeration as exposed). | Blocked with clear trust-required state; **no silent execution bypass**. |
| D2 | Approve trust only after reviewing the intended config/fingerprint context. | Trust applies to the reviewed configuration context; UI labels are clear. |
| D3 | Change material config (command/args/endpoint/auth/privileged field as applicable). | Trust is invalidated/requires revalidation; no stale approval implied. |
| D4 | Saving/importing/discovering config. | **No automatic command execution, no auto-activation, no auto-trust approval.** |

### E. Connection testing and read-only tool enumeration
| # | Check | Expected |
|---|---|---|
| E1 | Run explicit connection test on a safe trusted config (success case, if fixture available). | Success/failure reported clearly; valid saved config remains intact on failure. |
| E2 | Run explicit connection test on a failing/misconfigured case. | Actionable, redacted error; no secret leakage. |
| E3 | Tool list/enumeration (where supported). | **Read-only** display; freshness/cache state visible or understandable; **no per-tool enable/disable controls**; no claim of runtime enforcement. |
| E4 | Disconnected/untested server. | Not implied as permanently disabled. |

### F. Import and discovery (candidates only)
| # | Check | Expected |
|---|---|---|
| F1 | Discovery scan with Owner-approved root(s). | Candidates/files presented for explicit review; malformed/oversized entries handled gracefully; no secret leakage in results. |
| F2 | Import JSON preview. | Supported structures parsed/validated; duplicates/conflicts/credential refs shown; unsupported structures rejected clearly. |
| F3 | Register imported/discovered candidates. | Requires explicit approval/confirmation path; only approved candidates registered; conflict handling explicit. |
| F4 | Discovery/import of project folders (if used). | Treated as filesystem locations; **no claim of project runtime isolation**. |

### G. Trash / Restore / Permanent Delete (operational)
| # | Check | Expected |
|---|---|---|
| G1 | Move a server to Trash. | Labeled **Move to Trash** (or equivalent accurate label); removed from active operational list; not merely hidden cosmetically. |
| G2 | Attempt operations on trashed server. | Operationally inactive/blocked as designed; no silent reactivation. |
| G3 | Restore from Trash. | Restore revalidates relevant constraints; restored state defaults safely (non-running/disabled unless explicitly approved policy says otherwise); trust/credential issues surfaced. |
| G4 | Permanent Delete. | Explicit confirmation required; clear label **Permanently delete** (or equivalent). Credential references are not auto-deleted globally; ownership/unsafe cases blocked or clearly explained. |

### H. Non-destructive adoption and credential safety
| # | Check | Expected |
|---|---|---|
| H1 | With pre-existing MCP-related config present (if applicable/safe), enable/view manager. | Existing entries preserved; no silent mutation, no auto-test, no auto-enable/disable beyond supported behavior. |
| H2 | Use `${credential:REF}` references (or observe existing refs). | References preserved; plaintext secrets never entered/persisted as plain sensitive values where rejected; observable UI/logs redact secrets. |

### I. UI/UX, English/Arabic RTL, accessibility (manual)
| # | Check | Expected |
|---|---|---|
| I1 | English UI pass: server-centric layout, states (loading/empty/error/retry/confirmation/conflict where encountered), accurate labels. | No Global/Project scope selectors; no per-tool controls; no false enforcement claims. |
| I2 | Arabic UI pass. | RTL layout correct; commands/URLs/JSON/tool IDs/technical strings remain **LTR-readable**. |
| I3 | Keyboard/focus sanity. | Can reach primary controls, dialogs/confirmations trap/focus reasonably, focus not lost unexpectedly after key actions. |
| I4 | Responsive sanity (narrow width / settings panel constraints). | No critical control becomes inaccessible; layout remains usable. |
| I5 | **Manual accessibility audit** (required for #176). | Screen reader labels/roles/live regions/contrast/focus indicators reviewed by Owner or designated reviewer; record findings. Automated tests are partial only. |

### J. Cross-platform / environment limits
| # | Check | Expected |
|---|---|---|
| J1 | macOS evidence reviewed. | Automated persistence smoke passed on macOS. |
| J2 | Windows/Linux acceptance (if in scope for your rollout). | Run equivalent manual persistence/lifecycle checks; **do not claim support** for behaviors not verified. |

## Required follow-ups outside this manual session

These remain open for #176 unless separately completed and evidenced:
- Independent **human** Standards and Spec reviews.
- **Fresh-build byte comparison**.
- **Packaging allowlist** verification.
- **Build provenance** verification.
- Full **manual accessibility audit** evidence (section I5).
- Windows/Linux cross-platform persistence evidence (if required).

## Acceptance decision template

```text
Gate 3 — MCP Manager V1 (#176)
Candidate: <commit/tag/artifact>
Environment: <OS, DSH build/profile, locale>
Tester (Owner): <name>
Date/time: <YYYY-MM-DD HH:MM TZ>

Automated Gate 2 evidence reviewed: yes/no (link/report)
Manual steps: Pass <n> / Fail <n> / N/A <n>
Blocking issues: <none or list with issue refs>
Deferred-scope violations observed: <none or list>

Decision:
[ ] ACCEPTED for V1 supported scope (no install/push/release implied)
[ ] NOT ACCEPTED — blocking issues: ...
[ ] ACCEPTED WITH FOLLOW-UPS (Owner-authorized): ...

Owner signature/confirmation: <...>
```

## After acceptance (still requires separate authorization)

Passing Gate 3 does **not** authorize install, push, tag, release, or publication. Any such action requires explicit Owner authorization and completion of the remaining release/process checks (packaging allowlist, build provenance, fresh-build comparison as applicable).
