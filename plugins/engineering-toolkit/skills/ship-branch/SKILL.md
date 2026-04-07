---
name: ship-branch
description: "Internal stage of the ship-n-check pipeline — creates branch and commits with team conventions. Invoke directly only via /engineering-toolkit:ship-branch when explicitly requested by name. For general requests like 'commit' or 'create a branch', use engineering-toolkit:ship-n-check which routes here automatically."
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

See `rules/git-conventions.md` for branch naming convention and Helm length limit.

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

```bash
git add path/to/file1.ts path/to/file2.ts
```

**NEVER** use `git add -A` or `git add .` — always stage specific files only.

**Include SDLC docs**: Stage design artifacts from `docs/<identifier>/` (state.md, prd-plans/specs.md, prd-plans/flows.md, stage-gate.md, review-feedback.md). **Do NOT stage temp working files** (`commit-msg.txt`, `pr-body.md`) — these are used by the git workflow and should not be committed.

**Include updated docs**: If the doc update step modified any project documentation (README.md, CONTRIBUTING.md, .env.example, etc.), stage those files too. They get committed together with the code changes in a single commit.

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

All git safety rules from `rules/git-conventions.md` apply. Additionally:

- **NEVER** commit without user approval at the checkpoint
