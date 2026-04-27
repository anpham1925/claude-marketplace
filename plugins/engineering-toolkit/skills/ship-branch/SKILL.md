---
name: ship-branch
description: "Internal stage of the ship-n-check pipeline — creates branch and commits with team conventions. Invoke directly only via /engineering-toolkit:ship-branch when explicitly requested by name. For general requests like 'commit' or 'create a branch', use engineering-toolkit:ship-n-check which routes here automatically."
argument-hint: '[ticket-number]'
model: haiku
---

## Purpose

Create a branch and commit changes following git conventions. This is the first stage of the ship-n-check pipeline.

## Steps

### Gate Check

Follow the [stage workflow template](../ship-n-check/reference/shared.md#stage-workflow-template). This is the first stage — create `stage-gate.md` if it doesn't exist.

### Check Current State

```bash
git status
git diff
git log --oneline -5
```

If nothing changed, stop — nothing to commit.

### Ask for Ticket Number

If not provided, ask the user. This is recommended for branch naming and commit messages.

### Create Branch

See [ship-n-check shared reference](../ship-n-check/reference/shared.md#branch-naming) for branch naming convention and Helm length limit.

```bash
git checkout -b <branch-name>
```

### Update Docs (before staging)

Before staging files, check if project documentation has drifted due to the code changes.

**Spawn a `general-purpose` subagent** with:
- Prompt: "Read the `/engineering-toolkit:update-docs` skill at `{path to update-docs/SKILL.md}` and follow its methodology. The code diff is on branch `{branch}` against `main`/`master`. Scan existing docs, cross-reference against the diff, and make minimal targeted updates to any stale docs. Report what you updated."
- The subagent edits docs in place — any updated files will show up in `git status`

**Skip this step if:**
- The commit is docs-only (no code changes to cross-reference)
- The user explicitly says to skip doc updates

### Stage Specific Files

Stage code files and design artifacts from `docs/<identifier>/`. Do NOT stage temp working files (`commit-msg.txt`, `pr-body.md`).

If the doc update step modified project documentation, stage those too.

See [git rules](../ship-n-check/reference/shared.md#git-rules) for staging conventions.

### CHECKPOINT — Approve Commit

Present to user and **WAIT for approval before committing**:
- Branch name
- Staged files list
- Draft commit message

### Commit

Use the Write tool to create `docs/<identifier>/commit-msg.txt` with the message, then `git commit -F docs/<identifier>/commit-msg.txt`.

See [commit convention](../ship-n-check/reference/shared.md#commit-convention) for format and `Co-Authored-By` requirement.

### Gate Write

Check off "Branch & Commit" in `docs/<identifier>/stage-gate.md`.

## Rules

- **NEVER** commit without user approval at the checkpoint
- All other git rules (staging, commit format, branch safety) are in [ship-n-check shared reference](../ship-n-check/reference/shared.md#git-rules) and [git-conventions rule](../../rules/git-conventions.md) — follow those, don't duplicate here
