---
name: ship-push-pr
description: "Internal stage of the ship-n-check pipeline — pushes branch and creates a draft PR. Invoke directly only via /engineering-toolkit:ship-push-pr when explicitly requested by name. For general requests like 'push' or 'create PR', use engineering-toolkit:ship-n-check which routes here automatically."
argument-hint: '[ticket-number]'
model: sonnet
---

## Purpose

Push the branch to remote and create a draft PR with proper conventions.

## Steps

### Gate Check

Read `docs/<identifier>/stage-gate.md`. Verify "Simplify" is checked. See [shared reference](../ship-n-check/reference/shared.md) for stage-gate protocol and PR rules.

### Present for Approval

Show the user:
- Final diff summary
- PR title (under 70 chars, matches commit convention)
- PR body (Summary + Test plan sections)

**WAIT for user approval before pushing.**

### Push

```bash
git push -u origin <branch-name>
```

### Create Draft PR

Use the Write tool to create `docs/<identifier>/pr-body.md`, then:

```bash
gh pr create --draft --title "<action>: <short title>" --body-file docs/<identifier>/pr-body.md
```

Return the PR URL.

### Gate Write

Check off "Push & PR" with PR number in `stage-gate.md`.

## PR Body Template

```markdown
## Summary
- {What this PR does — 1-3 bullets}

## Test Plan
- [ ] Unit tests pass (`yarn test`)
- [ ] E2e tests pass (`yarn test:e2e`)
- [ ] Lint clean (`yarn lint`)
- [ ] Type-check clean (`yarn type-check`)
- [ ] {Additional project-specific checks}

## Ticket
{TICKET-ID or N/A}
```

## Rules

- **ALWAYS** create PRs as draft (`--draft` flag)
- **ALWAYS** use `gh pr create` (not GitHub web UI)
- **NEVER** push without user approval
- **NEVER** force push to any branch unless user explicitly asks
- PR title under 70 chars, matches commit convention
- PR body must have Summary and Test plan sections
