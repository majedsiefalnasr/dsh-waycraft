# A subscription account carries its access method

Anthropic began billing Direct sign-in requests to extra usage instead of plan limits (HTTP 400 "Third-party apps now draw from your extra usage", enforced from April 2026), and Google suspends accounts that reach Antigravity through third-party software. Running the provider's own unmodified CLI is the route both still count as ordinary subscription use. So each Subscription account now carries an Access method, Direct sign-in or Official CLI, chosen when the account is added, and a provider can hold accounts of both kinds. Direct sign-in stays available with a warning (the Owner accepted its terms-of-service risk in ADR-0003); new Claude and Antigravity accounts default to Official CLI. Waycraft drives the CLI through its own driver with one small translator per provider, never modifies the binary, never installs it, and never reads or stores its login: the Owner signs in through the CLI's own command.

## Considered Options
- Method per provider: one switch is simpler, but an Official CLI account (a config directory the CLI owns) and a Direct sign-in account (a token Waycraft stores) are different things, and the Owner may keep both.
- Depend on dsh-oh-my-claude for Claude: it already works, but reference plugins are never required runtime companions, and it covers one provider while the goal is every provider and future ones.
- Remove Direct sign-in: safest, but it is the only method that keeps full request control and the Account pool, and the Owner chose to keep it behind a warning.

## Consequences
- An Official CLI session runs the CLI's own agent loop, tools and context; Waycraft controls it through flags and per-run settings rather than the request.
- A provider with no CLI offering a non-interactive mode can only have Direct sign-in.
