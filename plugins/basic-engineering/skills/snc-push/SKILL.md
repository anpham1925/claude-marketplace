---
name: snc-push
description: "TRIGGER when: user says 'push this', 'create a PR', 'open a draft PR', or references pushing code and creating a pull request. DO NOT trigger for: full done flow, commit, CI/CD, or other stages."
argument-hint: '[ticket-number]'
model: sonnet
---

## Purpose

Push code to remote and create a draft PR. This is the third stage of the ship-n-check pipeline (after commit and quality) but can run standalone.

## Working Directory

All temporary and generated files are stored under `docs/<identifier>/` in the repo root:
- Use the ticket number if available (e.g., `docs/PRT-123/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/`)

## Standalone Invocation

```
/basic-engineering:snc-push PRT-123
```

If no ticket number is provided, derive from the current branch name.

## PR Rules

- **Always** create PRs as draft (`--draft` flag)
- **Always** use `gh pr create` (not GitHub web UI)
- PR body must have Summary and Test plan sections
- PR title under 70 chars, matches commit convention

## Steps

1. Present final diff, PR title, PR body — ask for approval
2. Push and create draft PR — return the PR URL

### Push with upstream tracking

```bash
git push -u origin <branch-name>
```

### Create PR using `gh` (always as draft)

Use the `Write` tool to create `docs/<identifier>/pr-body.md` (avoids `#`-prefixed lines and redirection triggering permission prompts), then create PR:

```bash
# First: use Write tool to create docs/<identifier>/pr-body.md with the PR body
gh pr create --draft --title "<action>: <short title>" --body-file docs/<identifier>/pr-body.md
```

### View PR checks

```bash
gh pr checks
```

### View PR comments

```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments
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
- **ALWAYS** use `gh pr create` for PRs, not the GitHub web UI

## Rules

- **NEVER** create the PR without user approval
- **NEVER** push to `master`/`main` directly
- **ALWAYS** create PRs as draft
- **ALWAYS** include Summary and Test plan sections in PR body
