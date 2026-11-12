# Official CLI accounts share one provider settings directory

A CLI keeps its login, settings, skills, hooks and session history in one config directory, so one directory per account would give every account its own diverging configuration. The Owner treats a provider's accounts as one installation that differs only in who is signed in. So Waycraft owns one Provider settings directory per provider and one small directory per account that scopes only that account's login; everything else in an account directory is a link to the Provider settings. Every Official CLI account, the first included, lives in Waycraft's storage and is signed in there afresh. The CLI itself stores the login scoped to the account's Waycraft-owned directory. On macOS, Claude may store it in a Keychain entry keyed to that directory rather than in a file inside it. Waycraft never reads or writes the login, except under a later explicit Account insights opt-in. The CLI's own default directory (for Claude, `~/.claude`) and its Keychain entry are never read, linked or written by the Official CLI flow: the Owner's terminal and Waycraft's sessions cannot change each other. This follows [Claude's credential management documentation](https://code.claude.com/docs/en/authentication), reviewed on 2026-11-12.

Provider settings start empty, because Waycraft's managers are the source (ADR-0006). Bringing in the CLI's native configuration is an import the Owner reviews, a copy rather than a link.

## Initial linkage policy

Ticket #180 creates the account directory and empty Provider settings directory. Before the first CLI run, Waycraft creates and links only this explicit shared-name allowlist from the provider settings directory into each account directory:

- `settings.json`
- `CLAUDE.md`
- `skills/`
- `commands/`
- `agents/`
- `rules/`
- `hooks/`
- `plugins/`
- `projects/`

Every other name created by the CLI remains account-private by default, without a warning and without automatic linking. In particular, `.claude.json` and login files remain account-private because they are not on the allowlist. Provider settings start empty; Waycraft creates the allowlisted entries there before linking them. No real account inventory is needed to implement this policy. At live acceptance (#195), the Owner reviews what the CLI actually created; any additional name approved for sharing is added to the allowlist in a later ticket.

Before every run, verify each allowlisted account entry is still the expected link. If the CLI replaced a shared link with a real file or directory, copy/reconcile its contents into Provider settings, then restore the link. Tests use fixtures and never inspect the default Claude directory (`~/.claude`) or its Keychain entry.

The initial names are based on Claude Code's documented settings, instructions, skills, commands, agents, rules, hooks, plugins and session transcript storage locations: [settings reference](https://code.claude.com/docs/en/settings-reference), [memory](https://code.claude.com/docs/en/memory), [plugins](https://code.claude.com/docs/en/plugins/manifest-reference), and [SDK features](https://code.claude.com/docs/en/agent-sdk/claude-code-features).

## Considered Options
- Adopt the CLI's existing login as the first account: no second sign-in, but Waycraft would write into a directory the terminal also uses, and the first account would differ in kind from the rest.
- Independent directory per account: simplest, but settings drift apart and a session started on one account is invisible to the others.

## Consequences
- Session history is shared across a provider's accounts, which is what could let a session resume under another account (ADR-0007); a prototype decides whether that works.
- A CLI that replaces a linked file with a real one forks that file; the links must be checked and repaired before each run.
- The Owner signs in once more per account even where the terminal is already signed in.
