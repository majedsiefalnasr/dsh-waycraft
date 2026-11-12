# Official CLI accounts share one provider settings directory

A CLI keeps its login, settings, skills, hooks and session history in one config directory, so one directory per account would give every account its own diverging configuration. The Owner treats a provider's accounts as one installation that differs only in who is signed in. So Waycraft owns one Provider settings directory per provider and one small directory per account that holds only that account's login; everything else in an account directory is a link to the Provider settings. Every Official CLI account, the first included, lives in Waycraft's storage and is signed in there afresh. The CLI's own default directory (for Claude, `~/.claude`) is never adopted, linked or written: the Owner's terminal and Waycraft's sessions cannot change each other.

Provider settings start empty, because Waycraft's managers are the source (ADR-0006). Bringing in the CLI's native configuration is an import the Owner reviews, a copy rather than a link.

## Considered Options
- Adopt the CLI's existing login as the first account: no second sign-in, but Waycraft would write into a directory the terminal also uses, and the first account would differ in kind from the rest.
- Independent directory per account: simplest, but settings drift apart and a session started on one account is invisible to the others.

## Consequences
- Session history is shared across a provider's accounts, which is what could let a session resume under another account (ADR-0007); a prototype decides whether that works.
- A CLI that replaces a linked file with a real one forks that file; the links must be checked and repaired before each run.
- The Owner signs in once more per account even where the terminal is already signed in.
