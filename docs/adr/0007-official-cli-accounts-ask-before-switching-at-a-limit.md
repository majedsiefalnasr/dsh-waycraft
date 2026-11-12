# Official CLI accounts ask before switching at a limit

The Account pool moves Direct sign-in requests to another account unprompted. Anthropic's consumer terms forbid using several accounts to get around usage limits, and the more automatic the switching, the plainer that pattern is. A setting cannot make it permitted; it only moves the decision to the Owner. So each provider has a Switch policy of Manual, Ask or Automatic. Official CLI accounts default to Ask: at a limit the session offers the next account in one step. Automatic stays off until the Owner turns it on and accepts a warning that it may breach the provider's terms and risk the accounts.

Whatever the policy, the session keeps its context by replaying DSH's own copy of the conversation into the new account's session, which works between any two accounts, methods or providers. Because a provider's accounts share their session history (ADR-0008), the CLI's own session may be resumable under another account; a prototype decides. If it works it becomes the main path for a switch inside one provider, with replay as the fallback and the only path across providers or methods. The allowlisted shared `projects/` directory in ADR-0008 is what the #190 prototype relies on when testing whether Claude sessions resume across accounts; this does not change ADR-0007's switch policy or fallback.

## Considered Options
- Manual only: the lowest risk, but the Owner asked for a faster path and already accepted comparable risk for Direct sign-in.
- Automatic by default: matches today's pool, but turns a terms risk on without the Owner choosing it.
