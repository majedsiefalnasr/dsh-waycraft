## Problem Statement

The Owner pays for subscriptions and reaches them through Subscriptions with Direct sign-in: Waycraft signs in and sends model requests to the provider itself. That route is closing.

- **Claude is already broken.** A turn on a Claude Subscription account fails with HTTP 400 `invalid_request_error`: "Third-party apps now draw from your extra usage, not your plan limits." This is Anthropic's billing policy (enforced from April 2026), not an outage: requests that do not come from Anthropic's own client are billed to extra usage. Anthropic's terms also say developers may not offer Claude.ai login in their own applications or handle its session tokens.
- **Antigravity is at risk.** Its terms forbid third-party software reaching the service with Antigravity OAuth, and Google suspends accounts for it.
- **The other providers use the same pattern** (borrowed client ids, private endpoints), so the same thing can happen to them.

What both Anthropic and Google still count as ordinary subscription use is the provider's own unmodified command-line agent, signed in by the user. Anthropic's help centre states that `claude -p` signed in with a plan "still draw[s] from your subscription limits" (update of 7 October 2026).

The Owner wants to keep using several providers through their subscriptions, add providers later, benefit from each provider's own features and tools, and not lose control of the skills and MCP servers Waycraft already manages, with a clear path to managing hooks too.

## Solution

Every Subscription account carries an **Access method**, chosen when the account is added:

- **Direct sign-in**: what exists today. It stays, behind a warning.
- **Official CLI**: Waycraft runs the provider's own unmodified CLI, which holds the login and sends the requests.

Where a provider offers more than one method, the Owner picks one in a selector and sees that method's warning before confirming and on the account card afterwards.

Official CLI accounts of one provider behave as one installation that differs only in who is signed in: they share one set of **Provider settings** and one session history. The Skill manager and MCP manager stay the source of what a CLI session can use. Each provider declares its **Provider capabilities**, and its manage page is drawn from them, so a new provider needs no new screen.

When an account reaches a limit, the provider's **Switch policy** decides what happens (Manual, Ask, Automatic), and the session keeps its context across the switch. A **Context nudge** offers to compact a nearly full session on any provider.

The work lands in two phases: the framework with Claude and Antigravity first; Codex, GitHub Copilot and Grok once the Owner has accepted the first two in live use.

## User Stories

### Choosing an Access method

1. As the Owner, I want to choose an Access method when I add a Subscription account, so that I decide how each account reaches its provider.
2. As the Owner, I want a provider with one Access method to skip the selector, so that I am not asked a question with one answer.
3. As the Owner, I want to see a method's warning before I confirm it, so that I know the risk I am taking.
4. As the Owner, I want the warning to stay visible on the account card, so that I remember which accounts carry a risk.
5. As the Owner, I want each warning to show its level, its source link and when it was last reviewed, so that I can judge how current it is.
6. As the Owner, I want new Claude and Antigravity accounts to default to Official CLI, so that the safe route is the easy one.
7. As the Owner, I want to keep accounts of both methods under one provider, so that I can move over gradually.
8. As the Owner, I want my existing Direct sign-in accounts left as they are, so that an update never changes how I am billed without my choosing it.
9. As the Owner, I want Antigravity's Direct sign-in marked as a danger and its Official CLI marked with a note that the risk is lower, not zero, so that I am not given false comfort.
10. As the Owner, I want the model picker to list each model once per provider whatever methods its accounts use, so that my saved model choices keep working.

### Official CLI accounts

11. As the Owner, I want Waycraft to detect the provider's CLI and show its path, version and who is signed in, so that I know which program and account will run.
12. As the Owner, I want the official install command shown when the CLI is missing, so that I can install it myself.
13. As the Owner, I want to sign in through the CLI's own login command in a terminal, so that Waycraft never sees or stores my login.
14. As the Owner, I want every Official CLI account, the first included, to live in Waycraft's storage with its own sign-in, so that all my accounts are the same kind of thing.
15. As the Owner, I want the CLI's own default directory never read into, linked or written, so that my terminal and Waycraft cannot change each other.
16. As the Owner, I want all of a provider's Official CLI accounts to share one set of Provider settings, so that a setting I change applies to every account.
17. As the Owner, I want a provider's accounts to share their session history, so that a session started on one account is visible to the others.
18. As the Owner, I want Provider settings to start empty, so that only what I enabled in Waycraft reaches a session.
19. As the Owner, I want a broken link between an account and the Provider settings repaired before a run, so that accounts never silently drift apart.
20. As the Owner, I want removing an account to sign it out and delete only directories Waycraft created, after I confirm, so that nothing of mine outside Waycraft is lost.
21. As the Owner, I want to be told to update the CLI when it is older than the provider's minimum version, with the official command, so that I am not left with an unexplained failure.
22. As the Owner, I want a run to carry on when the CLI lacks an optional flag, so that a small version difference does not stop my work.
23. As the Owner, I want provider API-key variables removed from the CLI's environment, so that my subscription is what gets used and not a key I forgot was set.
24. As the Owner, I want the account card to say that those variables are removed, so that I am not surprised by it.

### Working in an Official CLI session

25. As the Owner, I want a new session to use the Default account and its Access method, so that I do not pick an account every time.
26. As the Owner, I want a session to stay on the account it started with until a switch happens, so that its behaviour is predictable.
27. As the Owner, I want the CLI's text, reasoning and tool activity shown as ordinary DSH output, so that a CLI session reads like any other.
28. As the Owner, I want the CLI's own tools used for files and shell, so that I get the provider's agent as it was built.
29. As the Owner, I want DSH's tools (subagents, jobs, goals, web search) available to the CLI, so that I do not lose DSH features.
30. As the Owner, I want the CLI's permission prompts, questions and plan reviews shown as DSH dialogs, so that I approve things in one place.
31. As the Owner, I want DSH's permission mode applied as the CLI's matching mode, so that one setting governs the session.
32. As the Owner, I want images and files I attach sent to the CLI, so that attachments work as before.
33. As the Owner, I want a session resumed with its history when I come back to it, so that I continue where I stopped.
34. As the Owner, I want session titles and summaries produced through the same account, so that side requests need no other provider.
35. As the Owner, I want each subagent and task card on a CLI account to run its own CLI process, so that parallel work does not collide.
36. As the Owner, I want an idle CLI process stopped after a while and brought back on my next message, so that idle sessions do not hold resources.
37. As the Owner, I want a cap on simultaneous CLI processes per account, so that one account is not flooded.
38. As the Owner, I want to change the idle time and the cap, so that I can fit them to my machine.

### Skills, MCP servers and hooks

39. As the Owner, I want a CLI session to get exactly the MCP servers enabled in the MCP manager, so that the manager still decides.
40. As the Owner, I want MCP servers configured only in the CLI ignored by default, so that nothing runs that I cannot see in Waycraft.
41. As the Owner, I want skills I switched off in the Skill manager hidden from the CLI, so that the manager still decides.
42. As the Owner, I want to be told when a skill cannot be switched off individually because it ships inside a CLI plugin, so that I know why it is still there.
43. As the Owner, I want a per-provider switch that imports the CLI's native configuration after I review what will be copied, so that I can bring my existing setup in deliberately.
44. As the Owner, I want imported native items listed read-only on the manage page with their origin, so that I can tell why a tool or skill is present.
45. As the Owner, I want to see whether a provider supports hooks, so that I know what a future Hook manager can drive.
46. As the Owner, I want hook failures reported in the session, so that a broken hook does not fail silently.
47. As the Owner, I want native hooks shown read-only when native configuration is imported, so that I can see what will run.

### Usage and limits

48. As the Owner, I want an Official CLI account's limit state and reset time shown from what the CLI reports, so that I see my Usage windows without Waycraft touching my login.
49. As the Owner, I want to opt in to Account insights after accepting a warning, so that I can have exact percentages and the exact model list if I choose.
50. As the Owner, I want Account insights off by default, so that the CLI's login is never read without my saying so.
51. As the Owner, I want a notice the moment a request is billed to extra usage, so that I do not pay without knowing.
52. As the Owner, I want the extra-usage 400 on a Direct sign-in Claude account shown as a plain explanation with a button to add an Official CLI account, so that I know what happened and what to do.
53. As the Owner, I want to set a provider's Switch policy to Manual, Ask or Automatic, so that I decide what happens at a limit.
54. As the Owner, I want Official CLI accounts to default to Ask, so that I am offered the next account in one step and nothing switches behind my back.
55. As the Owner, I want Automatic to stay off until I accept a warning that it may breach the provider's terms and risk my accounts, so that the risk is my explicit choice.
56. As the Owner, I want Manual to tell me the account reached its limit and when it resets, so that I can act myself.
57. As the Owner, I want the session to keep its context when it moves to another account, so that I do not start over.
58. As the Owner, I want the session to keep its context when I move it to another provider or method, so that switching models mid-work is safe.
59. As the Owner, I want the Account pool to keep working for Direct sign-in accounts as it does now, so that nothing I rely on regresses.

### Provider manage page and Context nudge

60. As the Owner, I want each provider's manage page to show its Access methods, native features and settings, so that I can see and use what the provider offers.
61. As the Owner, I want a newly added provider to get a manage page without new screens being built, so that adding providers stays cheap.
62. As the Owner, I want a card above the composer when a session's context is nearly full, so that I can compact before it overflows.
63. As the Owner, I want to set the threshold of that card (75% by default) or switch it off, so that it suits how I work.
64. As the Owner, I want Compact in an Official CLI session to run the CLI's own compaction, so that the CLI's context is what actually shrinks.
65. As the Owner, I want Compact on any other provider to run DSH's compaction, so that the card works everywhere.
66. As the Owner, I want every new text in English and Arabic, so that the interface stays complete in both.

### Phases and later providers

67. As the Owner, I want Claude delivered first, so that the provider that is broken today works again.
68. As the Owner, I want Antigravity delivered second through the same framework, so that the framework is proven general and my account is safer.
69. As the Owner, I want Codex, GitHub Copilot and Grok held until I have accepted Claude and Antigravity in live use, so that we do not build three more on an unproven base.
70. As the Owner, I want each later provider's terms re-read from the provider's own pages before it is built, so that its warnings are accurate.
71. As the Owner, I want OpenAI's "Sign in with ChatGPT" programme evaluated for Codex, so that a sanctioned direct route is used if it keeps more control than the CLI.
72. As the Owner, I want image and video generation moved to a provider's CLI where that CLI supports it, and otherwise told that the tool needs a Direct sign-in account, so that media tools keep working either way.
73. As a future contributor, I want a provider added by declaring its capabilities and supplying one translator, so that the driver, accounts, switching and manage page are reused.

## Implementation Decisions

Recorded decisions: ADR-0005 (a subscription account carries its access method), ADR-0006 (Waycraft managers own skills and MCP servers in Official CLI sessions), ADR-0007 (Official CLI accounts ask before switching at a limit), ADR-0008 (Official CLI accounts share one provider settings directory). Earlier ADRs still hold: one plugin with components (0001), reused provider ids (0002), the owned fork and the Owner's acceptance of Direct sign-in's terms risk (0003).

### Model

- A Subscription account gains an Access method. Existing accounts are Direct sign-in; no automatic migration.
- Provider ids are unchanged and each model appears once. The Default account selects the account, and so the method, for a new session. A session is bound to its account until a switch.
- A provider gains a Switch policy (Manual, Ask, Automatic) and, for Official CLI, Provider settings.

### Provider capabilities

- Each Subscription provider declares: its Access methods; a warning per method (level info or danger, text, source link, last-reviewed date); the native features it supports (hooks, skills, MCP, plan review, compaction, session resume, permission modes); its settings; the minimum CLI version; a static model list.
- Warnings and the model list ship with the plugin and change with a release. Nothing is fetched remotely to produce them.
- The manage page is rendered from this declaration.

### CLI driver

- One provider-neutral driver inside the Subscriptions component, with one translator per provider that maps the CLI's stream to DSH stream chunks and DSH's request to the CLI's arguments. No new Loader row.
- The driver runs the CLI as published. It never modifies or installs the binary, and never reads, stores or forwards its login, except under Account insights.
- Before a run the driver checks the CLI version against the provider's minimum and learns which optional flags the installed CLI accepts; an unsupported optional flag is dropped, an unsupported required one is reported.
- Provider API-key variables are removed from the child environment.
- One process per session, stopped after an idle period (default 10 minutes) and restored by resuming the session. A per-account cap on concurrent processes (default 4). Both are settings.
- Side requests (titles, summaries) run as tool-less single-turn runs. Each subagent or task card gets its own process.
- A turn does not survive a DSH restart; the session resumes afterwards.
- dsh-oh-my-claude (MIT) is a reference for approach only, never a runtime companion. Anything adapted from it gets a provenance record and a third-party notice entry.

### Accounts and Provider settings

- Waycraft owns one Provider settings directory per provider and one directory per Official CLI account that holds only that account's login; every other entry in an account directory links to the Provider settings. Session history is part of what is shared.
- Links are verified and repaired before each run; a linked entry the CLI replaced with a real one is reconciled back into the Provider settings.
- The CLI's own default directory is never adopted, linked or written.
- Sign-in runs the CLI's own login command in a terminal against the account's directory. Removal runs the CLI's logout and deletes only Waycraft-owned directories after confirmation.

### Skills, MCP servers, hooks

- Each run is given exactly the MCP servers enabled in the MCP manager and the skill visibility set in the Skill manager, and the CLI's other configuration is excluded. For Claude this uses the CLI's strict MCP configuration and per-run skill overrides; both were confirmed against CLI 2.1.322 and the skills documentation.
- The CLI, not DSH, connects to MCP servers in these sessions. The MCP manager's trust gate and connection test describe the configuration.
- Skills inside a CLI plugin follow the plugin; the manage page says so.
- A per-provider switch, off by default, imports the CLI's native configuration into the Provider settings as a reviewed copy and lists the imported items read-only with their origin.
- Hooks: the capability declaration says whether a provider supports them; hook failures are surfaced in the session; native hooks are listed read-only when imported. Defining hooks is left to a later Hook manager, which will follow ADR-0006.

### Tools and approvals

- CLI sessions use the CLI's own tools. DSH's tools reach the CLI through an MCP server Waycraft provides for the run.
- The CLI's permission prompts, questions and plan reviews become DSH dialogs. DSH's permission mode maps to the CLI's corresponding mode.

### Usage, limits and switching

- Limit state, window kind and reset time come from the events the CLI emits.
- Account insights is one opt-in switch per provider, off by default, behind a warning. It enables exact usage percentages and exact model discovery, which require reading the CLI's login.
- A request the CLI reports as billed to extra usage raises a notice in the session.
- The extra-usage HTTP 400 on a Direct sign-in Claude account is recognised and replaced with an explanation and an action to add an Official CLI account.
- Switch policy: Manual reports the limit and reset; Ask offers the next eligible account in one step; Automatic moves unprompted and can be enabled only after the Owner accepts its warning. Official CLI accounts default to Ask. Direct sign-in accounts keep today's Account pool behaviour.
- Context across a switch: DSH's own copy of the conversation is replayed into the new account's session. This is the contract between any two accounts, methods or providers. A prototype decides whether the CLI's own session can be resumed under another account of the same provider through the shared session history; if it can, that becomes the main path inside one provider and replay remains the fallback.

### Context nudge

- A card above the composer when a session's context passes a threshold (default 75%, adjustable, can be switched off), for every provider. Compact runs the CLI's own compaction in an Official CLI session and DSH's compaction elsewhere.

### Phases

- **Phase 1**: the framework, then Claude, then Antigravity.
- **Gate**: the Owner accepts Claude and Antigravity live: a turn with tools and an approval, an account switch that keeps context, and usage display.
- **Phase 2**: Codex, GitHub Copilot, Grok. Each starts by re-reading the provider's terms from its own pages. Codex also evaluates the "Sign in with ChatGPT" programme as an alternative to its CLI. Media tools (today backed only by Codex and Grok) move to a CLI where it supports generation; otherwise they stay on Direct sign-in and say so.

## Testing Decisions

A good test here drives the feature from outside and asserts what the Owner or DSH would observe: the RPC answer, the stream chunks, the arguments and environment the CLI was started with, the files on disk, the rendered text. It does not assert private functions, internal state or call order.

Two existing seams, no new code seam:

1. **The assembled Subscriptions component (host).** Tests start the whole component with a fake host context and drive it through its RPC routes and its registered adapters' stream, as the existing per-provider component tests do. Where those tests replace the network with a fake, these replace the provider's CLI with a **fake executable** that reads its arguments, environment and input, replays a recorded stream and records what it received. Covered here: adding an account by each method and its warnings; the arguments of a run (only enabled MCP servers, skill visibility, stripped key variables); stream translation and approvals; the three Switch policies and context across a switch; usage events and the extra-usage notice; account and Provider settings directories, links and their repair; version and flag checks; idle stop and resume; the concurrency cap; the recognised 400 on Direct sign-in.
2. **The manage UI (client).** Tests render the real components with a fake RPC in English and Arabic, as the existing manage tests and UI matrix do. Covered here: the selector and warnings; the capability-driven manage page; the Switch policy setting and the Automatic confirmation; the Account insights switch; the Context nudge card; the offer to continue on another account.

Everything runs in temporary directories. No test touches the real CLI directories, the Keychain, a real CLI or a provider. Locale completeness stays enforced by the existing guard.

Not covered by automated tests, and never to be claimed from them: real sign-in, billing against the plan, resuming a real session under another account, and a provider's enforcement behaviour. These are verified by the Owner in live use; the prototype and the phase gate exist for that.

## Out of Scope

- A Hook manager that defines hooks in Waycraft and compiles them for each CLI (its own spec).
- Other dsh-oh-my-claude features: cost pill, session notices, composer history and shortcuts, asides, usage forecast, suggested next prompt. Each is kept on a deferred list to be judged separately.
- Keeping a running turn alive across a DSH restart.
- Running a CLI on another machine over SSH.
- Editing the CLI's own files (instructions, settings) from Waycraft.
- Removing Direct sign-in, or migrating existing accounts automatically.
- Any way to make Direct sign-in look like the provider's own client.
- A provider-neutral agent protocol (ACP) driver; it may be reconsidered in phase 2.
- Per-tool enforcement and project isolation in the MCP manager, which remain deferred as before.

## Further Notes

- **Sources read on 2026-11-10 and 2026-11-11.** Anthropic help centre, "Use the Claude Agent SDK with your Claude plan" (updates of 15 June and 7 October 2026); Claude Code documentation, "Legal and compliance" and "Extend Claude with skills"; `claude --help` of CLI 2.1.322; OpenAI help centre, "Using your ChatGPT plan in other apps and sites"; xAI, "Introducing Grok Build"; GitHub documentation on Copilot CLI and the Copilot SDK repository.
- **Not verified from a primary source.** Antigravity's terms were read as quoted in Google's developer forum and a third-party issue, not from the terms page. GitHub's and xAI's terms on third-party use were not read. Multi-account behaviour of the Antigravity, Copilot and Grok CLIs was not checked. Each is a first step of the ticket that depends on it.
- **Known risk.** Anthropic paused, rather than cancelled, moving `claude -p` usage off plan limits and promised notice before any change. If that changes, the Claude Official CLI warning must be updated in a release.
- **Known risk.** One forum report describes an Antigravity suspension by a user who says they used only the official CLI. The Official CLI note for Antigravity reflects this.
- **Terms on several accounts.** Anthropic's consumer terms forbid using several accounts to get around usage limits. Separate personal and work accounts are ordinary use; rotating accounts at a limit is the pattern the terms name. This is why Automatic is opt-in behind a warning.
- **Sequencing.** No implementation starts before the MCP manager release in progress is finished.
