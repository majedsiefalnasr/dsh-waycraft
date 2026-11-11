# MCP Desktop Gate 3 evidence — 2026-11-11

Candidate: local commit `f486636`, installed into the desktop profile; 16 installed files matched the candidate before full restart.

## Actual installed-host checks

Playwright CLI attached via loopback CDP to the existing authenticated Electron page `dsh-app://app/`. No browser authentication state was copied. This is real Desktop evidence, not the Chromium fixture.

- Opened Settings with the desktop keyboard shortcut and selected MCP servers.
- Opened Add server. Created only `waycraft-gate3-check`, stdio command `waycraft-gate3-nonexistent`; did not approve trust or test/execute it.
- Save succeeded; the new entry appeared Untrusted. Closed and reopened Settings; entry persisted.
- Native More menu exposed Test connection, Edit, Approve reviewed config and Move to Trash.
- Move to Trash required the portal confirmation dialog; entry appeared in Trash and disappeared from active servers.
- Restore required confirmation; restored entry remained Untrusted. The configuration switch was inspected during the next cleanup script, but its value was not returned because a subsequent locator timed out; no switch-state pass is claimed.
- Trashed the disposable entry again; permanently deleted it only after the explicit irreversible confirmation. Final active list contained exactly github, playwright and scenario; Trash had no count. Existing entries were not edited, tested, trusted or deleted.
- Opened Import MCP configuration. Supported formats/24 KiB limit and non-execution warning were displayed; Tab stayed inside the dialog, and Escape closed it. No import was registered.
- Explicit Official Registry search for playwright completed with real catalog rows, including io.github.microsoft/playwright-mcp. No catalog candidate was registered or connected.
- Malformed pasted JSON produced a visible HTTP 400 validation report and kept Register approved candidates disabled. Cleared the disposable draft and closed it; no import registered.
- Desktop General language picker offered Chinese, English, Japanese, Spanish, French, German, Russian and Portuguese, but no Arabic. Therefore an installed-host Arabic check cannot be claimed through the available language UI; the existing Arabic fixture evidence remains separate.

## Automation observations

Two locator corrections were necessary: Add server is the button label (Add MCP server is the dialog title); Trash accessible name includes its count while nonempty. These were automation selector errors, not asserted product defects.

The page continuously reported existing subscriptions-auth.proxyGet 404 errors; account-related errors also appeared. No causal relationship with the MCP operations above is established. Do not claim a clean global console.

- Switched Desktop Appearance to Light and Dark through General, opened MCP in each, and measured the actual 564 px panel: no horizontal overflow in either; computed foreground changed with theme. Restored the original System preference. This is a geometry/theme smoke check, not a complete contrast audit.

## Installed-host blocker: Add dialog focus ownership

At an emulated 390 px viewport, the actual Add dialog measured 342 px with no horizontal overflow. However Tab containment failed. Reproduction with Server name explicitly focused followed by Tab showed focus moving through the underlying Settings navigation (Account, General, Models and onward), while the Add portal remained open. Escape during the earlier run closed both Add and Settings, leaving BODY active. This is an installed-host accessibility blocker, not a fixture pass. The surrounding Settings focus owner and portaled child modal interaction require investigation before acceptance. The disposable form was cancelled without saving, emulation cleared, and the original System appearance restored.

## Focus-fix source candidate

Read-only diagnosis verified that installed Settings registers the public `useModalLayer`, while the MCP body-portaled child had only an independent local trap. The source candidate now registers Add/Edit and shared Import/Confirm dialogs with that same optional public hook, suspends the parent while discard confirmation is active, and retains the local fallback only when the hook is unavailable. The native adapter regression failed before the fix (`Add must register with the shared host modal stack`, `0 !== 1`) and passed afterward; focused component/native checks passed 37/37 and typecheck passed. The canonical build and complete `npm run ci` passed (1425/1425 tests, zero skips, format/lint/typecheck and fresh build). The existing built-bundle Chromium MCP/Registry checks passed 13/13, zero skips; these still exercise the fallback, not the installed shared modal stack. This is not yet installed-host proof.

A proposed Settings/browser fixture could not initialize the published primitive root because the local package's undeclared transitive `clsx` dependency was unavailable (`clsx is not defined`). No passing containment claim is made from that attempt; the temporary fixture and harness changes were removed rather than substituting a fake shared owner. Actual Desktop revalidation remains the decisive next step after approval to install the client-only candidate.

## Installed focus-fix revalidation — 18:22–18:25 Cairo

Owner approved the client-only installation. Backed up the installed client artifacts under `docs/gate3-backups/20261111-modal-client`; copied and byte-compared `dist/client.js`, `dist/mcp-client.js` and `dist/subscriptions-client.js`. No host modules, profile configuration or existing server entries changed. Reattached Playwright CLI to the authenticated Desktop and reloaded the client. The first Settings shortcut was sent before application readiness and timed out; retry after readiness opened Settings normally (automation timing, not an asserted defect).

- Clean Add: explicitly focused Server name, then 20 forward Tabs all stayed in the dialog. Escape left Settings open and returned focus to Add server.
- Dirty Add: entered only an unsaved disposable name; 16 backward Tabs stayed inside. Escape opened discard confirmation; eight forward Tabs stayed in that confirmation. Escape cancelled the confirmation, preserving the draft and Add. Cleared the name and closed the now-clean form without saving.
- Import: 24 alternating forward/backward Tabs stayed inside; Escape left Settings open and returned focus to Import MCP configuration. No import was registered.
- Original narrow reproduction: CDP viewport 390×844, Add measured 342 px with no horizontal overflow; all 20 forward Tabs remained inside. Escape retained Settings and returned focus to Add. Cleared emulation and detached the emulation session in finally.

The reported installed-host focus blocker is resolved for these exercised paths. Independent focused source review found no substantiated blocker, but adapter tests are not represented as DOM proof. Remaining Gate 3 coverage below is not waived. Existing unrelated global console errors continue; no clean-console claim.

## Still unverified

Full EN/AR, light/dark and narrow/wide installed-host geometry, complete keyboard/focus audit, successful and failed connection checks with a safe owned fixture, tools-cache persistence across actual app restart, lifecycle disable/re-enable, recovery/platform checks and final Owner acceptance remain open. Gate 3 is not complete and issues #176/#177 must remain open until their acceptance evidence is sufficient.

Temporary loopback CDP debugging must be removed by a normal Desktop restart after testing. Never close the attached Desktop with Playwright browser close; detach instead.
