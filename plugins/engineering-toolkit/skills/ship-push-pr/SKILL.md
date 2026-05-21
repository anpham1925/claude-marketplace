---
name: ship-push-pr
description: "Internal stage of the ship-n-check pipeline — pushes branch and creates a draft PR. Invoke directly only via /engineering-toolkit:ship-push-pr when explicitly requested by name. For general requests like 'push' or 'create PR', use engineering-toolkit:ship-n-check which routes here automatically."
argument-hint: '[ticket-number]'
model: haiku
---

## Purpose

Push the branch to remote and create a draft PR with proper conventions.

## Steps

### Gate Check

Follow the [stage workflow template](../ship-n-check/reference/shared.md#stage-workflow-template). Verify "Simplify" is checked. See [PR rules](../ship-n-check/reference/shared.md#pr-rules).

### Present for Approval

**Write the durable PR-body file BEFORE pausing.** Use the Write tool to create `docs/<identifier>/pr-body.md` with the proposed PR body. This must happen before the checkpoint so that if the Release-orchestrator subagent terminates here (harness has no `SendMessage` — see [ai-dlc-release §Checkpoint Propagation](../ai-dlc-release/SKILL.md)), the continuation can run `gh pr create --body-file docs/<identifier>/pr-body.md` without re-deriving the body.

Show the user:
- Final diff summary
- PR title (under 70 chars, matches commit convention)
- PR body (the file is already on disk — show its contents)

**WAIT for user approval before pushing.** If invoked from inside a Release-orchestrator subagent that has no human in the loop, return immediately with `Status: NEEDS_USER_INPUT` per the [Subagent Return Contract](../ai-dlc/reference/shared.md#subagent-return-contract). Do NOT wait silently.

### Push

```bash
git push -u origin <branch-name>
```

### Create Draft PR

```bash
gh pr create --draft --title "<action>: <short title>" --body-file docs/<identifier>/pr-body.md
```

The `pr-body.md` file already exists from the pre-checkpoint write. Return the PR URL.

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

- **NEVER** push without user approval
- All other rules (draft PRs, PR format, force push safety) are in [ship-n-check shared reference](../ship-n-check/reference/shared.md#pr-rules) and [git-conventions rule](../../rules/git-conventions.md)
