---
name: sdlc-release
description: "Internal stage of the sdlc pipeline — delegates to ship-n-check for the full git workflow. Invoke directly only via /basic-engineering:sdlc-release when explicitly requested by name. For general requests like 'release' or 'ship it', use prt:ship-n-check instead."
argument-hint: '[TICKET-ID]'
model: sonnet
---

## Agent: Release

**Mission**: Get the code merged and deployed by delegating to the ship-n-check pipeline.

**Inputs**: Approved, reviewed code from Review stage
**Outputs**: Merged PR, deployed to staging/production

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify Review is completed. See [shared reference](../sdlc/reference/shared.md) for state.md format.

### Delegate to Ship & Check

Invoke `/basic-engineering:ship-n-check` via the Skill tool (or project-local `/ship-n-check` if installed standalone).

This handles the full release pipeline:
- Branch & Commit
- Requirements Review (blocking) — spawns a fresh subagent to cross-check diff against requirements
- Code Quality Review — self-review, lint, type-check, tests
- Simplify — `/simplify` skill
- Push & Draft PR
- CI/CD — watch pipeline, fix failures
- Staging — verify deployment
- Open PR for Review
- Address Reviews — handle feedback

### Update Jira

After PR is created:
- Post PR link as comment on the Jira ticket

After PR is merged:
- Transition ticket to "Done" (use `getTransitionsForJiraIssue` first to find the right transition ID)

### Update State

Update `docs/<identifier>/state.md` — mark Release as completed.

## Rules

- **ALWAYS** delegate to ship-n-check — don't freestyle the release process
- **ALWAYS** post PR link to Jira
- **ALWAYS** transition Jira to "Done" when merged
- **ALWAYS** update `docs/<identifier>/state.md`
