# Skill manager for Waycraft for DSH

## Problem Statement

The Owner needs complete skill management inside Waycraft rather than a separate Skills Manager plugin. Switching a skill or source off must change actual DSH skill availability, not merely its appearance in a list. The replacement must preserve the reference workflows, protect existing files and state, and remain independently switchable without affecting AI Providers or core preferences.

## Solution

Provide **Skill manager** as a default-off Component of Waycraft for DSH, with its own row and switch in DSH plugin details. Preserve the reference screen structure and workflows in English and Arabic with RTL, remove Chinese product localization, and omit the reference plugin's GitHub/Issues header links and entire plugin self-updater. Repository skill-content updates remain included. Use the reference as prior art, never as a required runtime companion.

This specification records the Owner-approved design and test seams. It does not authorize implementation, installation, source push, release, migration or changes to installed Reference plugins. A proposed ticket graph requires separate approval before publication and execution.

## User Stories

1. As an Owner, I want one Waycraft installation, version and changelog, so that skill management belongs to the existing product.
2. As an Owner, I want a separate default-off Skill manager Component switch, so that enabling it is intentional and independent of AI Providers.
3. As an Owner, I want disabling the Component to stop all its interventions, so that native DSH behavior resumes.
4. As an Owner, I want saved preferences and skill files retained on Component shutdown, so that re-enabling restores my management choices.
5. As an Owner, I want safe completion or rollback of an already-started file replacement on shutdown, so that cancellation cannot corrupt files.
6. As an Owner, I want global skills, project skills, discovery and Trash screens, so that the reference workflows remain recognizable.
7. As an Owner, I want counts, diagnostics, search, source/status filters and collapsible source groups, so that I can locate and understand skills.
8. As an Owner, I want all reference built-in sources discovered, so that adopting Waycraft does not hide supported tools' skills.
9. As an Owner, I want nested read-only discovery with symlink-cycle handling and explicit truncation, so that external collections can be inspected safely.
10. As an Owner, I want custom source registration, labels, grouping, path editing, reset and removal without file deletion, so that I can manage my own collections.
11. As an Owner, I want candidate sources discovered under a selected folder before explicit registration, so that discovery does not silently activate sources.
12. As an Owner, I want registered projects, unavailable-project diagnostics and explicit project selection, so that writes reach the intended project.
13. As an Owner, I want project skill precedence computed independently, so that one project's choices do not alter another project's availability.
14. As an Owner, I want source disablement to prevent its skill copies from being available in DSH, so that the switch has an operational effect.
15. As an Owner, I want individual skill disablement enforced against native and manager-supplied loading, so that disabled copies cannot bypass policy.
16. As an Owner, I want same-name priority, shadowed copies and eligible fallback copies explained, so that source disablement is not mistaken for an all-source name ban.
17. As an Owner, I want valid invocation-channel restrictions preserved, so that enabling a skill does not override its author-declared restrictions.
18. As an Owner, I want invalid invocation-policy values diagnosed and blocked, so that malformed policy does not silently permit invocation.
19. As an Owner, I want logical categories with create, rename, delete, assignment, bulk assignment and drag ordering, so that organization does not move skill files.
20. As an Owner, I want category, uncategorized and source-wide bulk activation, so that large collections remain manageable.
21. As an Owner, I want searchable custom notes separate from original descriptions, so that annotations do not modify source documents.
22. As an Owner, I want read-only details, original text, paths, diagnostics and copy actions, so that I can inspect skills without unintended edits.
23. As an Owner, I want creation with validated name, description, body and destination, so that new skills are stored in an explicitly writable location.
24. As an Owner, I want the reference user-requested create-skill model tool, so that reusable skill creation is available without autonomous unsolicited creation.
25. As an Owner, I want local-path imports and browser upload of ZIP, folders and Markdown, so that existing skill collections can be brought in.
26. As an Owner, I want local import preview, batch results and explicit skip/overwrite behavior, so that conflicts and partial success are visible.
27. As an Owner, I want safe staging, rollback and bounded file processing, so that malformed paths, links or oversized input do not destroy existing skills.
28. As an Owner, I want DSH user, Shared Agent user and registered-project DSH destinations where supported, so that writes remain scoped and predictable.
29. As an Owner, I want external sources protected from write operations, so that another tool's collection is not modified by management actions.
30. As an Owner, I want reversible Trash, exact-origin restore and confirmed permanent deletion, so that accidental deletion can be recovered safely.
31. As an Owner, I want provenance retained through uninstall and restore, so that managed copies remain identifiable.
32. As an Owner, I want Git repository subscriptions with ref and subdirectory, so that I can select a collection snapshot.
33. As an Owner, I want GitHub, supported HTTP(S) Git and local repository sources, so that reference source compatibility is retained.
34. As an Owner, I want individual and bulk repository refresh, progress, errors and filters, so that failed refreshes do not conceal usable previous snapshots.
35. As an Owner, I want unsubscribing to leave installed skills intact, so that subscription management is distinct from uninstalling.
36. As an Owner, I want ClawHub browsing/search and skills.sh search with their reference metadata and controls, so that catalog discovery remains available.
37. As an Owner, I want confirmed catalog installation, destination selection, installed-copy visibility and exact-copy uninstall, so that catalog operations affect the intended location.
38. As an Owner, I want repository installations tracked by source, scope and content baseline, so that updates can distinguish local edits from upstream changes.
39. As an Owner, I want update preview showing added, removed and modified files, so that content replacement is deliberate.
40. As an Owner, I want stale previews rejected and local-change overwrite explicitly confirmed, so that intervening edits are not silently lost.
41. As an Owner, I want staged updates, recovery and previous-version rollback, so that an unsuccessful update does not strand a broken copy.
42. As an Owner, I want Settings/sidebar/both entry placement to persist correctly, so that navigation reflects my chosen location.
43. As an Owner, I want English and Arabic RTL across controls, errors and confirmations, so that the full workflow is usable in either language.
44. As an Owner, I want no Chinese product locale or upstream self-update controls, so that the delivered product matches the agreed scope.
45. As an Owner, I want separate Waycraft manager state with no automatic access to the reference manager's state, so that rollback and coexistence preparation do not mutate its choices.
46. As an Owner, I want reference runtime deactivation and replacement activation coordinated explicitly, so that duplicate policy/tool providers do not compete during acceptance.
47. As an Owner, I want a per-function parity matrix and installed acceptance evidence, so that passing isolated tests is not mistaken for complete delivery.

## Implementation Decisions

- Follow the existing one-package Component architecture, public DSH extension points and core-owned browser integration. Use a unique Component identity and product-owned interfaces/state without mechanically renaming existing durable Waycraft identifiers. Never patch DSH.
- Pin behavioral/code prior art to `https://github.com/MichengAI/dsh-skills-manager`, version1.2.29, commit `49037a919b87b000de9003a49930425ae9742632`. The dormant1.2.6 copy is not an accepted implementation or delivery. Reconcile provenance before reuse; preserve historical source until its disposition is approved.
- Preserve all inventoried intended behavior and reference limitations unless an explicit decision here changes them. Produce a detailed parity matrix with reference evidence, implementation slice, test evidence and unresolved gaps. Do not silently claim literal parity where a public host seam is unavailable: stop for an approved disposition.
- Built-in user sources cover DSH, Shared Agent, CC Switch, Codex, Claude Code, Gemini, OpenCode, Cursor, Copilot, Windsurf variants, Trae variants, OpenClaw, Clawdbot, Roo, CodeBuddy, WorkBuddy, Qoder variants, Lingma and Antigravity. Preserve reference project-source coverage and registered-project restrictions; project writes target DSH only.
- Policy is an availability overlay, not a filesystem access-control boundary. While the Component is active, disabled copies are unavailable through the DSH skill system, including native-provider paths and cached skill/command discovery. Valid channel restrictions are retained. Invalid invocation fields block both channels with visible diagnostics. Already-loaded conversation instructions are not retracted and general file tools are not sandboxed by this feature.
- Disablement of one source/copy permits an eligible same-name copy from another enabled source according to precedence. Source disablement is not a global canonical-name blacklist. Preserve the reference project-DSH source-switch restriction rather than silently adding a new source-level control; individual skills remain governed by policy.
- Component-off stops new operations immediately, cancels cancellable work and safely commits or rolls back an in-progress atomic file replacement before disposal completes. After completed shutdown, no manager UI, routes, tools, providers, timers or policy interventions remain. Native DSH may expose its own sources again. Saved state and skill files remain unchanged by shutdown itself.
- Use separate Waycraft state for source choices, policy, categories, notes, subscriptions and provenance. Do not automatically read, import or mutate the reference manager's state. Any migration needs a separately approved backup/preview/rollback scope.
- External source documents remain read-only. Creation, supported import and deletion operate only in reference-authorized writable scopes; canonical scope resolution and project registration are server-enforced, not trusted from client paths.
- Preserve metadata-only categories, custom notes, conflict reporting, partial-result reporting and safe staged filesystem transactions. Preserve import paths and browser upload forms, including reference dry-run availability distinctions. Bound request/file/archive processing and reject unsafe paths and existing filesystem links. ZIP link metadata is neutralized: write entry payload bytes as regular files, never create or follow archive links; bundles depending on link semantics lose those semantics (Owner-approved reference-style disposition, 2026-11-05). Do not treat a header marker as authentication.
- Use host-authenticated public interfaces for local and paired-client access, preserving project/session scope. Do not introduce an unauthenticated parallel server or claim remote installed acceptance without evidence.
- Preserve manual repository refresh, per-copy provenance, hash-based conflict detection, snapshot-bound previews, explicit overwrite consent and previous-version rollback. Catalogs retain reference browsing/search limitations and do not acquire an unapproved version-update lifecycle.
- Correct sidebar-only persistence rather than copying its normalization defect. Implement agreed defensive validation/resource bounds without speculative features; validate behavior and avoid unsupported performance claims. Distinguish a GitHub archive content fingerprint from a Git commit identifier.
- Preserve screen organization and action flows, adapting to Waycraft integration and existing theme/typography conventions. English/Arabic only in the delivered Component, with RTL. Chinese user skill content and mandatory legal/historical evidence are not deleted or translated by locale removal.
- Remove upstream plugin self-update backend/UI/settings entirely from the delivered Component, together with GitHub/Issues header links. Keep repository skill-content updates and rollback.
- Retain Apache-2.0 license obligations, pertinent attribution and modified-source notices; maintain adjacent provenance and product third-party notices. Review actual redistributed dependencies/assets separately; downloaded skill licenses are not automatically covered by the manager's license.

## Testing Decisions

The Owner approved the following seams after inspection of existing host-route and assembled registered-client tests. Test external behavior rather than helper layout.

- Primary behavioral seam: load the real built Component and invoke its registered host interfaces against isolated temporary user/project directories. Extend existing Component harness patterns to the actual skill-provider/command lifecycle. Prove effective discovery and invocation denial, not merely persisted disabled flags. Cover precedence, fallback, native-overlay enforcement, project isolation, invalid fields, state errors, re-enable and disposal.
- Exercise filesystem workflows through those same interfaces: create, local preview/import, browser upload, conflict handling, readonly/linked source protection, categories/notes, Trash restore/permanent deletion, repository/catalog exact-copy installs, refresh/update/stale-preview/conflict/rollback and fault recovery. Verify resulting bytes/state and preserved originals, not internal implementation choices.
- Lifecycle cases include shutdown during cancellable work and during staged replacement; re-entry must show no partial install, no leaked manager registrations and retained state. Retain reference edge cases such as removed upstream content and unavailable projects as explicit matrix entries, not silent omissions.
- Registered-client seam: load the actual assembled browser integration and registered UI in English and Arabic. Exercise observable tabs, actions, confirmation, loading/error/retry, source/destination selection, RTL and Component visibility/disposal. Connect to a real controlled backend where practical rather than returning universal success fixtures.
- External network responses are controlled fixtures for download, timeout, malformed data, cancellation and upstream errors. No real accounts or paid providers are needed. Focused lower-level tests supplement, rather than substitute for, the behavioral seam when useful for archive/parser/transaction boundaries.
- Preserve core/AI Providers regression behavior. Require applicable formatting, lint, host/browser typechecks, full suite, fresh-build byte comparison and packaging allowlist/provenance checks. No tests have been run as part of this design/specification preparation.
- Independent Standards and Spec reviews precede delivery. Prepare one consolidated Owner acceptance session after automated checks and fixes: installed Component row, switch behavior, actual skill availability, principal file workflows, navigation and English/Arabic presentation. Coordinate installed changes, full restart and any live external-network use separately; offline fixtures are not proof of installed or paired-remote operation.

## Out of Scope

- MCP or Hooks managers and historical multi-manager work, AI Providers redesign, host changes or a replacement GUI server.
- Plugin self-updater, GitHub/Issues header buttons and Chinese product locale support.
- New skill editor/rename workflow, rendered Markdown preview, textual diff/merge, selective per-file update, arbitrary version history, catalog version-pinning/update lifecycle and other post-parity enhancements.
- Arbitrary write destinations, new SSH/credential UI, or changing reference catalog sorting/pagination limits into an expanded discovery product.
- Automatic reference-state migration, automatic installed-plugin disable/removal, concurrent old/new activation during acceptance, automatic restart, source push, release or npm/GitHub publication.
- Filesystem access denial to general tools or retroactive removal of instructions already loaded into a conversation.

## Further Notes

The closed historical multi-manager specification excluded repositories/catalogs/uploads and used older prior art; this new Skill manager-only specification deliberately includes those workflows under the current Owner agreement. It neither reopens that historical issue nor authorizes MCP/Hooks work. The GitHub specification issue is the execution source after publication; approved implementation tickets must reference it. Implementation and installed acceptance remain future phases, not claims made by this document.
