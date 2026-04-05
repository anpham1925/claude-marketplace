---
name: ship-branch
description: "Internal stage of the ship-n-check pipeline — creates branch and commits with team conventions. Invoke directly only via /basic-engineering:ship-branch when explicitly requested by name. For general requests like 'commit' or 'create a branch', use basic-engineering:ship-n-check which routes here automatically."
argument-hint: '[ticket-number]'
model: sonnet
---

## Purpose

Create a branch and commit changes following git conventions. This is the first stage of the ship-n-check pipeline.

## Steps

### Gate Check

Read `docs/<identifier>/stage-gate.md`. If this is the first stage, create the file. See [shared reference](../ship-n-check/reference/shared.md) for stage-gate protocol.

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

See [SDLC shared reference](../sdlc/reference/shared.md#git-branch-naming) for branch naming convention and Helm length limit.

```bash
git checkout -b <branch-name>
```

### Stage Specific Files

```bash
git add path/to/file1.ts path/to/file2.ts
```

**NEVER** use `git add -A` or `git add .` — always stage specific files only.

**Include SDLC docs**: Stage design artifacts from `docs/<identifier>/` (state.md, prd-plans/specs.md, prd-plans/flows.md, stage-gate.md, review-feedback.md). **Do NOT stage temp working files** (`commit-msg.txt`, `pr-body.md`) — these are used by the git workflow and should not be committed.

### CHECKPOINT

Present to user and **WAIT for approval before committing**:
- Branch name
- Staged files list
- Draft commit message

### Commit

Use the Write tool to create `docs/<identifier>/commit-msg.txt` with the message, then:

```bash
git commit -F docs/<identifier>/commit-msg.txt
```

See [shared reference](../ship-n-check/reference/shared.md) for commit convention. Always include `Co-Authored-By` tag.

### Gate Write

Check off "Branch & Commit" in `docs/<identifier>/stage-gate.md`.

## Git Commands Reference

### Create branch
```bash
git checkout -b <branch-name>
```

### Stage specific files
```bash
git add path/to/file1.ts path/to/file2.ts
```

### Commit with file
```bash
# First: use Write tool to create docs/<identifier>/commit-msg.txt
git commit -F docs/<identifier>/commit-msg.txt
```

### Push with upstream tracking
```bash
git push -u origin <branch-name>
```

### Create PR (always as draft)
```bash
# First: use Write tool to create docs/<identifier>/pr-body.md
gh pr create --draft --title "<action>: <short title>" --body-file docs/<identifier>/pr-body.md
```

## Rules

- **NEVER** use `git add -A` or `git add .` — stage specific files only
- **NEVER** commit without user approval at the checkpoint
- **NEVER** use `$()` or `<()` in commit commands — use Write tool + `git commit -F`
- **NEVER** amend commits unless user explicitly asks
- **ALWAYS** include `Co-Authored-By` tag in commit messages
- **ALWAYS** create a new branch — never commit directly to master/main
