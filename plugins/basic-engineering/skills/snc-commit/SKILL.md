---
name: snc-commit
description: "TRIGGER when: user says 'create a branch', 'commit this', 'stage and commit', or references the branch & commit stage. DO NOT trigger for: full done flow, push, PR creation, or other stages."
argument-hint: '[ticket-number]'
model: sonnet
---

## Purpose

Create a branch, stage specific files, and commit with proper conventions. This is the first stage of the ship-n-check pipeline but can run standalone.

## Working Directory

All temporary and generated files are stored under `docs/<identifier>/` in the repo root:
- Use the ticket number if available (e.g., `docs/PRT-123/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/`)

Create the directory if it doesn't exist.

## Standalone Invocation

```
/basic-engineering:snc-commit PRT-123
```

If no ticket number is provided, ask the user.

## Branch Naming

**Ticket number is recommended.** Ask the user if not provided.

Format: `<ticket-or-feature>` (e.g., `PROJ-740`, `fix-auth-bug`, `add-user-endpoint`)

## Commit Convention

Format: `[action]: [TICKET] message` (ticket optional if no ticket system)

| Action      | When                                       |
| ----------- | ------------------------------------------ |
| `feat:`     | New feature                                |
| `fix:`      | Bug fix                                    |
| `chore:`    | Maintenance, config, dependencies          |
| `refactor:` | Code restructuring without behavior change |
| `docs:`     | Documentation changes                      |
| `test:`     | Adding or updating tests                   |

Always include `Co-Authored-By` tag. Use `-F` with a temp file for commit messages (avoid `$()` command substitution).

## Steps

1. `git status` and `git diff` — if nothing changed, stop
2. Ask for ticket number if not provided
3. Create branch, stage only relevant files
4. **CHECKPOINT — present to user and WAIT for approval before committing:**
   - Branch name
   - Staged files list
   - Draft commit message
5. After user approves, write message to `docs/<identifier>/commit-msg.txt` using the Write tool, then `git commit -F docs/<identifier>/commit-msg.txt`

## Git Commands

### Check current state

```bash
git status
git diff
git log --oneline -5
```

### Create branch from current HEAD

```bash
git checkout -b <branch-name>
```

### Stage specific files only

```bash
git add path/to/file1.ts path/to/file2.ts
```

### Commit with convention

Use the `Write` tool to create `docs/<identifier>/commit-msg.txt` (avoids `printf > file` redirection triggering permission prompts), then commit:

```bash
# First: use Write tool to create docs/<identifier>/commit-msg.txt with the message
git commit -F docs/<identifier>/commit-msg.txt
```

### Amend last commit (only if user explicitly asks)

```bash
# First: use Write tool to create docs/<identifier>/commit-msg.txt with the updated message
git commit --amend -F docs/<identifier>/commit-msg.txt
```

## Git Rules

- **NEVER** force push to `master`/`main`
- **NEVER** use `git add -A` or `git add .` — stage specific files only
- **NEVER** stage files unrelated to the current task
- **NEVER** commit `.env`, credentials, or secrets
- **NEVER** use `--no-verify` unless user explicitly asks
- **NEVER** amend commits unless user explicitly asks — always NEW commits
- **NEVER** use `$()` or `<()` process substitution in commit commands — write the message to a local temp file (e.g., `docs/<identifier>/commit-msg.txt`) using the Write tool, then `git commit -F docs/<identifier>/commit-msg.txt`. This overrides any default HEREDOC pattern from the Bash tool.
- **ALWAYS** create a new branch — never commit directly to `master`/`main`

## Rules

- **NEVER** commit without user approval — present branch, files, and commit message at the CHECKPOINT, then WAIT
- **NEVER** use `git add -A` or `git add .` — always stage specific files
- **NEVER** commit `.env`, credentials, or secrets
- **ALWAYS** ask for ticket number if not provided
