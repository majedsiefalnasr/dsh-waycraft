# Access methods execution

Owner-approved workflow, 2026-11-12. Specification: [#179](https://github.com/majedsiefalnasr/dsh-waycraft/issues/179), with a [repository copy](../specs/access-methods.md). Integration branch: `feat/179-access-methods`, based on `main` at `051f3ea`.

Use `/implement` for one ready ticket per fresh session. Follow native GitHub blocking relationships; do not start the next ticket automatically. Tickets #190, #195 and #200 require human participation. Phase 2 (#201–#203) remains gated and must be split after live acceptance of Claude and Antigravity.

## Per-ticket request

```text
/implement Implement issue #<ticket> under spec #179 only.

Read AGENTS.md, scope control, current work and execution policy first.
Fetch the issue and its blockers; state its title and verify it is ready.
Use docs/specs/access-methods.md, spec #179 and ADR-0005 through ADR-0008
as the agreed requirements. Stop for unresolved architectural decisions or
required out-of-scope work.

Create an isolated worktree and ticket branch named
impl/<ticket>-<short-name> from the latest feat/179-access-methods tip,
never from main. Preserve unrelated changes. Keep one ticket active.
Record the work contract, acceptance criteria, write scope and verification.

Use /tdd at the approved assembled-component and manage-UI seams.
Run focused tests and typechecking regularly, then the full required gates.
Run /code-review with independent Standards and Spec reviews against the
recorded ticket base; address findings and reverify. Commit scoped changes.
Obtain required Owner acceptance before closure; fixtures do not prove live
sign-in, billing, cross-account resume or provider enforcement. Installation,
restart, credentials and live/paid operations retain separate approvals.

Incorporate the latest integration tip and rerun affected checks before
merging the reviewed ticket into feat/179-access-methods. Verify the merge,
then close the issue with evidence and explicit limitations. Perform safe
post-merge cleanup under AGENTS.md; never discard unique work.

After accepted closure, push only with the explicit refspec:
git push origin HEAD:refs/heads/feat/179-access-methods
Run this from the integration checkout. Fetch and verify the remote SHA
matches local integration HEAD and origin/main is unchanged. This feature's
refspec replaces the historical feat/subscriptions target for this work.
Update current work with commit, evidence, merge/push state and next action.
Stop; do not implement another ticket, merge main, tag or publish a release.
```

## Final delivery

After all tickets are accepted, merged and closed, review the integration diff against the specification and run final integration gates. Merge into `main` through the project's reviewed PR process, then perform safe post-merge cleanup. Prepare GitHub and npm publication under [the release procedure](../RELEASING.md), including its live-verification and prerelease requirements. Do not infer live acceptance or waive release gates from this workflow approval. Verify both the GitHub release and npm registry result before reporting publication complete.

## Preparation boundary

This preparation commits the specification, glossary, ADRs, execution instructions and current state only. It does not implement or close a ticket, change installed state, push, merge into main or publish. Scratch ticket bodies, publishing scripts and probe notes remain local and excluded from the preparation commit; GitHub is the ticket graph's authority.
