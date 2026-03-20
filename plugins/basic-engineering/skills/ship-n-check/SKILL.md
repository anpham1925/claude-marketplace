---
name: ship-n-check
description: "TRIGGER when: user says 'ship it', 'create a PR', 'push this', 'commit and push', 'run CI', 'check the pipeline', 'fix CI failures', 'open PR', 'address review feedback', 'simplify', or 'done flow'. Also trigger for 'check staging', 'watch CI', 'babysit PR'. DO NOT trigger for: simple git commands like 'git status' or 'git log', or when user just wants to commit without the full pipeline."
argument-hint: '[ticket-number]'
model: sonnet
---

## Working Directory

All temporary and generated files for this workflow are stored under `docs/<identifier>/` in the repo root:
- Use the ticket number if available (e.g., `docs/PRT-123/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/`)

Create the directory if it doesn't exist. Files stored here:
- `commit-msg.txt` — temp commit message file
- `pr-body.md` — temp PR body file
- `review-feedback.md` — cumulative review feedback log

## Stage Skills

Each stage is a standalone skill that can be invoked independently:

| Stage | Skill |
|-------|-------|
| Branch & Commit | `/basic-engineering:snc-commit` |
| Requirements Review + Local Quality | `/basic-engineering:snc-quality` |
| Simplify | `/simplify` |
| Push & PR | `/basic-engineering:snc-push` |
| CI/CD | `/basic-engineering:snc-ci` |
| Staging | `/basic-engineering:snc-staging` |
| Open PR + Address Reviews | `/basic-engineering:snc-review` |

## Done Flow (Full Pipeline)

When finished coding and ready to submit:

```
Branch & Commit              -> /basic-engineering:snc-commit
Requirements Review          -> /basic-engineering:snc-quality (requirements cross-check, BLOCKING)
  + Local Quality            -> /basic-engineering:snc-quality (self-review, lint, type-check, tests)
Simplify                     -> /simplify skill
Push & PR (draft)            -> /basic-engineering:snc-push
CI/CD (tests first)          -> /basic-engineering:snc-ci
CI/CD (build/deploy)         -> /basic-engineering:snc-ci (continues from Phase 2)
Staging                      -> /basic-engineering:snc-staging
Open PR for Review           -> /basic-engineering:snc-review
Address Reviews              -> /basic-engineering:snc-review (continues to address feedback)
```

Execute each stage sequentially via the Skill tool. Each stage must complete before the next begins.

### Resume Flow (no changes to commit)

If on a non-master/main branch with nothing to commit or push:

1. **Skip to CI/CD** — invoke `/basic-engineering:snc-ci`, then continue with Staging+

### Branch & Commit

Invoke `/basic-engineering:snc-commit` with the ticket number.

### Requirements Review + Local Quality

Invoke `/basic-engineering:snc-quality` with the ticket number.

### Simplify

Invoke `/simplify` via the Skill tool — do NOT freestyle.

If `/simplify` finds issues, fix them, then re-run `/basic-engineering:snc-quality` checks (lint, type-check, tests).

### Push & PR

Invoke `/basic-engineering:snc-push` with the ticket number.

### CI/CD

Invoke `/basic-engineering:snc-ci` with the ticket number.

### Staging

Invoke `/basic-engineering:snc-staging` with the ticket number.

### Open PR for Review + Address Reviews

Invoke `/basic-engineering:snc-review` with the ticket number.

If actionable comments were fixed → loop back: CI/CD -> Staging -> Open PR -> Address Reviews (max 3 iterations).

## Rules

- **NEVER** skip stages — execute every stage in order. If a stage doesn't apply (e.g., docs-only changes skip tests), explicitly state why before moving on
- **NEVER** batch multiple stages into one action — each stage must complete before the next begins
- **NEVER** commit without user approval — Branch & Commit has a CHECKPOINT
- **NEVER** skip requirements review — if no ticket ID, ask for requirements. This is a blocking gate.
- **NEVER** proceed past Requirements Review if the requirements reviewer finds mismatches — wait for user resolution
- **NEVER** skip self-review — always review before creating a PR
- **NEVER** skip `/simplify` — always simplify after local quality checks pass
- **NEVER** create the PR without user approval at Push & PR
- **NEVER** auto-fix debatable items — always ask the user
- **NEVER** exceed 3 fix-and-retry attempts in CI/CD or Address Reviews
- **ALWAYS** run lint, type-check, and tests before submitting
- **NEVER** delete `docs/<identifier>/review-feedback.md` — always append new entries with a dated section header
- **ALWAYS** check for repeated patterns in the feedback log before starting a new review — if the same issue appears across multiple entries, flag it to the user and suggest a rule improvement
- If any quality check fails and can't be fixed, **STOP** and inform the user

## Gotchas

Common failure points — if Claude keeps hitting these, the skill needs updating:

- **`git add .` or `git add -A`** — Stages everything including `.env`, `node_modules`, or large binaries. Always stage specific files by name.
- **`$()` in commit messages** — Process substitution in commit messages can execute arbitrary commands. Use a temp file or heredoc instead.
- **Force push to main** — Never. Not even "just this once." If the history is wrong, create a revert commit.
- **Skipping requirements review** — "It's a small change" is not an excuse. The requirements reviewer catches scope creep that the author is blind to.
- **Auto-fixing debatable items** — Reviewer finds a naming issue but there are valid arguments both ways. Don't auto-fix — ask the user.
- **CI retry loop** — Test fails, auto-fix, test fails again with a different error, auto-fix again. After 3 attempts, STOP. The issue is likely architectural, not a quick fix.
- **Creating PR without running tests locally** — CI will catch it, but it wastes time and clutters the pipeline. Always run lint + type-check + test locally first.
- **Forgetting to read review-feedback.md** — Previous review feedback contains patterns. Reading it before self-review catches repeat issues.

## Persistent Data

This skill stores data in `${CLAUDE_PLUGIN_DATA}/ship-n-check/` for cross-session learning:

- `review-patterns.jsonl` — append-only log of review findings (type, file, auto-fixed or user-decided)
- `ci-failures.jsonl` — CI failure history (error type, root cause, fix applied, retry count)
- `pr-log.jsonl` — PR creation history (branch, PR URL, time-to-merge, review rounds)

**How to use:**
- Before self-review, read `review-patterns.jsonl` to check for recurring issues in this codebase
- Before CI retry, check `ci-failures.jsonl` for known flaky tests or infra issues
- After PR merge, append to `pr-log.jsonl` for velocity tracking
