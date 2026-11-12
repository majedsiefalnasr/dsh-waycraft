# Official CLI accounts share one provider settings directory

A CLI keeps its login, settings, skills, hooks and session history in one config directory, so one directory per account would give every account its own diverging configuration. The Owner treats a provider's accounts as one installation that differs only in who is signed in. So Waycraft owns one Provider settings directory per provider and one small directory per account that scopes only that account's login; everything else in an account directory is a link to the Provider settings. Every Official CLI account, the first included, lives in Waycraft's storage and is signed in there afresh. The CLI itself stores the login scoped to the account's Waycraft-owned directory. On macOS, Claude may store it in a Keychain entry keyed to that directory rather than in a file inside it. Waycraft never reads or writes the login, except under a later explicit Account insights opt-in. The CLI's own default directory (for Claude, `~/.claude`) and its Keychain entry are never read, linked or written by the Official CLI flow: the Owner's terminal and Waycraft's sessions cannot change each other. This follows [Claude's credential management documentation](https://code.claude.com/docs/en/authentication), reviewed on 2026-11-12.

Provider settings start empty, because Waycraft's managers are the source (ADR-0006). Bringing in the CLI's native configuration is an import the Owner reviews, a copy rather than a link.

## Initial linkage gate

Ticket #180 creates the account directory and empty Provider settings directory only, without links. Before the first CLI session, #182 must establish and implement the initial linkage policy; #187 covers the second account, repair and deletion.

At the start of #182, after separately authorized real sign-in, present names only of the entries created in the Waycraft-owned account directory and a proposed account-private/shared classification. The Owner approves that inventory before linkage code. Examine `.claude.json` first: if it mixes account identity with general settings, keep it account-private and obtain a decision on the shared portion. No approved inventory exists yet; add it here only after observation and approval.

The policy direction is an explicit account-private allowlist, with the remaining approved inventory shared. Unknown new names stay in the account directory and produce a warning, never an automatic link. The default Claude directory remains excluded from observation, copying and linking.

## Considered Options
- Adopt the CLI's existing login as the first account: no second sign-in, but Waycraft would write into a directory the terminal also uses, and the first account would differ in kind from the rest.
- Independent directory per account: simplest, but settings drift apart and a session started on one account is invisible to the others.

## Consequences
- Session history is shared across a provider's accounts, which is what could let a session resume under another account (ADR-0007); a prototype decides whether that works.
- A CLI that replaces a linked file with a real one forks that file; the links must be checked and repaired before each run.
- The Owner signs in once more per account even where the terminal is already signed in.
