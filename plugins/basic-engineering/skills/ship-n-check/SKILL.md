---
name: ship-n-check
description: Git workflow with 8 composable stages — branch, commit, self-review, lint, type-check, tests, simplify, push, create draft PR, watch CI/CD, fix pipeline failures, verify staging, open PR for code review, and address review feedback. Use when creating branches, committing changes, pushing code, creating PRs, reviewing your own code, running quality checks, simplifying code, checking PR review feedback, monitoring CI/CD pipelines, fixing build failures, connecting to staging, or running the full done flow.
argument-hint: '[ticket-number]'
model: sonnet
---

## Quick Navigation

| If you need to...                          | Read                                                              |
| ------------------------------------------ | ----------------------------------------------------------------- |
| Branch, commit, push, or create a PR       | Conventions below + [reference/examples.md](reference/examples.md) |
| Requirements review + local quality checks | [reference/local-quality.md](reference/local-quality.md)           |
| Check PR reviews and address feedback      | [reference/review-pr.md](reference/review-pr.md)                   |
| Watch CI/CD and fix pipeline failures      | [reference/github-ci.md](reference/github-ci.md)                   |
| Connect to staging and run sanity checks   | [reference/staging-check.md](reference/staging-check.md)           |
| Open PR and wait for code review           | [reference/review-pr.md](reference/review-pr.md)                   |
| Simplify code for reuse, quality, efficiency | `/simplify` skill                                                |
| Run the full 8-stage pipeline              | Done Flow below                                                    |

## Working Directory

All temporary and generated files for this workflow are stored under `docs/<identifier>/` in the repo root:
- Use the ticket number if available (e.g., `docs/PRT-123/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/`)

Create the directory if it doesn't exist. Files stored here:
- `commit-msg.txt` — temp commit message file
- `pr-body.md` — temp PR body file
- `review-feedback.md` — cumulative review feedback log

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

## PR Rules

- **Always** create PRs as draft (`--draft` flag)
- **Always** use `gh pr create` (not GitHub web UI)
- PR body must have Summary and Test plan sections
- PR title under 70 chars, matches commit convention

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

## Pre-Stage Checklist (MANDATORY)

**Before executing ANY stage, you MUST read the reference file(s) listed for that stage:**

| Stage | Reference to read BEFORE executing |
|-------|------------------------------------|
| Branch & Commit | `reference/examples.md` |
| Requirements Review + Local Quality | `reference/local-quality.md` |
| Simplify | Invoke `/simplify` via the Skill tool |
| Push & PR | `reference/examples.md` |
| CI/CD | `reference/github-ci.md` |
| Staging | `reference/staging-check.md` |
| Open PR for Review | `reference/review-pr.md` |
| Address Reviews | `reference/review-pr.md` |

Skipping this checklist is a rule violation. The stage summaries below are navigation aids, not the full instructions — always read the reference first.

---

## Done Flow (Full Pipeline)

When finished coding and ready to submit:

```
Branch & Commit              -> conventions above + reference/examples.md
Requirements Review          -> reference/local-quality.md (requirements cross-check, BLOCKING)
  + Local Quality            -> reference/local-quality.md (self-review, lint, type-check, tests)
Simplify                     -> /simplify skill
Push & PR (draft)            -> conventions above + reference/examples.md
CI/CD (tests first)          -> reference/github-ci.md
CI/CD (build/deploy)         -> reference/github-ci.md
Staging                      -> reference/staging-check.md
Open PR for Review           -> reference/review-pr.md
Address Reviews              -> reference/review-pr.md
```

### Resume Flow (no changes to commit)

If on a non-master/main branch with nothing to commit or push:

1. **Skip to CI/CD** — watch pipelines, fix failures, then Staging+

### Branch & Commit

**Pre-read: `reference/examples.md` for git commands and conventions.**

1. `git status` and `git diff` — if nothing changed, stop
2. Ask for ticket number if not provided
3. Create branch, stage only relevant files
4. **CHECKPOINT — present to user and WAIT for approval before committing:**
   - Branch name
   - Staged files list
   - Draft commit message
5. After user approves, write message to `docs/<identifier>/commit-msg.txt` using the Write tool, then `git commit -F docs/<identifier>/commit-msg.txt`

### Requirements Review + Local Quality

**Pre-read: `reference/local-quality.md` — read it NOW before executing this stage.**

**Requirements Review** (blocking — stops pipeline if mismatches found)

6. Get requirements source:
   - If ticket ID available — read from Jira via MCP (`getJiraIssue`), extract acceptance criteria, scope, and description
   - If no ticket ID — ask user: provide a PRD file path, or paste the requirements directly into the prompt
7. `git diff master...HEAD` — generate full diff
8. **Spawn a NEW subagent** with: requirements + diff + changed file list. Use the `requirements-reviewer` agent if defined in `.claude/agents/`, otherwise use `subagent_type=general-purpose` with the prompt from local-quality.md. **This MUST be a subagent, not inline review** — the main agent has implementation context and implicit bias about what it built. A fresh subagent with only requirements + diff gives an unbiased, adversarial review.
9. The subagent cross-checks:
   - **Under-delivery**: acceptance criteria not covered by the changes
   - **Over-scope**: changes that go beyond what the requirements ask for
   - **Gaps**: edge cases, error paths, or integration points implied by requirements but not addressed
10. If mismatches found — **BLOCK the pipeline**. Present the findings to the user and WAIT for resolution. Do NOT proceed to Code Quality Review until the user confirms all issues are addressed or deliberately accepted.
11. If clean — proceed to Code Quality Review

**Code Quality Review**

12. `git diff master...HEAD` — review the diff
13. Self-review against architecture, quality, naming, tests, security. Use the `code-reviewer` subagent if defined in `.claude/agents/`, otherwise review inline.
14. Append feedback to `docs/<identifier>/review-feedback.md` with dated section header (AUTO-FIX / NEEDS-INPUT / INFO)
15. Auto-fix AUTO-FIX items, ask user about NEEDS-INPUT items
16. Run lint, type-check, tests — fix and repeat until clean. Use the `test-runner` subagent if defined in `.claude/agents/`, otherwise run commands directly.

### Simplify

**Pre-read: Invoke `/simplify` via the Skill tool — do NOT freestyle.**

17. Run `/simplify` — review changed code for reuse, quality, and efficiency
18. If `/simplify` finds issues, fix them, then re-run Code Quality Review checks (lint, type-check, tests)

### Push & PR

**Pre-read: `reference/examples.md` for PR creation commands and conventions.**

19. Present final diff, PR title, PR body — ask for approval
20. Push and create draft PR — return the PR URL

### CI/CD

**Pre-read: `reference/github-ci.md` — read it NOW before executing this stage.**

This stage has two phases — test pipelines first, then build/deploy.

**Test Pipelines** (fix failures before waiting for builds)

21. Find latest run, verify `headSha` matches. Use the `ci-watcher` subagent if defined in `.claude/agents/`, otherwise run `gh` commands directly.
22. List all jobs, identify test-related jobs (names containing: `test`, `lint`, `check`, `spec`, `unit`, `e2e`, `integration`, `ci`)
23. Poll test jobs until all complete — if any fail, enter fix-and-retry loop immediately (don't wait for build jobs)
24. Fix failures — analyze logs, fix code, run local checks, commit, push, re-poll test jobs

**Build & Deploy Pipelines** (only after all test jobs pass)

25. `gh run watch "$RUN_ID" --exit-status` — watch remaining build/deploy jobs to completion
26. Fix failures — analyze, fix, local checks, commit, push, re-watch
27. Max 3 retry attempts total across Test and Build & Deploy — stop and inform user after 3 failures

### Staging

**Pre-read: `reference/staging-check.md` — read it NOW before executing this stage.**

25. Find the pod, wait for Running state
26. Port-forward in background
27. Sanity check — curl health and API endpoints
28. PR-affected endpoints — identify from diff and curl
29. Stop port-forward, inform user

### Open PR for Review

**Pre-read: `reference/review-pr.md` — read it NOW before executing this stage.**

30. Mark PR as ready for review: `gh pr ready`
31. Discover review workflow from `gh pr checks` (don't hardcode workflow names)
32. Watch it: `gh run watch "$REVIEW_RUN_ID" --exit-status` — **NEVER poll with sleep loops**
33. If no review workflow triggered (e.g., markdown-only), skip to reading comments
34. Read all review comments (inline + top-level) from review bots and humans

### Address Reviews

**Pre-read: `reference/review-pr.md` — read it NOW before executing this stage.**

35. Categorize feedback — actionable / debatable / informational
36. If actionable comments:
    a. Convert PR back to draft: `gh pr ready --undo`
    b. Fix issues locally, ask user about debatable items
    c. Run local checks (lint, type-check, tests)
37. **Reply to EVERY comment on the PR** — addressed (explain what was fixed), ignored (explain why), or debatable (explain trade-off). Do this AFTER local fixes but BEFORE pushing. Check both inline review comments AND issue comments (review bots often post both).
38. If actionable comments were fixed:
    a. Commit and push fixes
    b. **Loop back to CI/CD** (CI/CD -> Staging -> Open PR -> Address Reviews)
39. If no actionable comments — **DONE** (replies already posted in step 37)
40. Max 3 review-fix iterations — stop and inform user after 3 rounds

## Rules

- **NEVER** skip stages — execute every stage in order. If a stage doesn't apply (e.g., docs-only changes skip tests), explicitly state why before moving on
- **NEVER** batch multiple stages into one action — each stage must complete before the next begins
- **NEVER** commit without user approval — Branch & Commit has a CHECKPOINT: present branch, files, and commit message, then WAIT
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
