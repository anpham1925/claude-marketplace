---
name: ship-cicd
description: "Internal stage of the ship-n-check pipeline — monitors CI/CD pipelines and fixes failures. Invoke directly only via /engineering-toolkit:ship-cicd when explicitly requested by name. For general requests like 'check CI' or 'fix the pipeline', use engineering-toolkit:ship-n-check which routes here automatically."
argument-hint: '[ticket-number]'
model: sonnet
---

## Purpose

Monitor CI/CD pipelines and fix failures. Two phases: test pipelines first, then build/deploy.

## Steps

### Gate Check

Follow the [stage workflow template](../ship-n-check/reference/shared.md#stage-workflow-template). Verify "Push & PR" is checked.

---

## Phase A: Test Pipelines

### Find the Latest Run

**Run each command separately — never use `$()` command substitution:**

```bash
# Get run info
gh run list --branch "BRANCH_NAME" --limit 1 --json databaseId,headSha,status

# Get pushed commit sha
git rev-parse HEAD
```

Compare `headSha` from the run with the local HEAD. They must match before proceeding.

### Identify Test Jobs

```bash
gh run view "$RUN_ID" --json jobs --jq '.jobs[] | {name: .name, status: .status, conclusion: .conclusion}'
```

A job is a **test job** if its name (case-insensitive) contains: `test`, `lint`, `check`, `spec`, `unit`, `e2e`, `integration`, `ci`.

Everything else (`build`, `docker`, `image`, `deploy`, `release`, `push`, `publish`) is a **build/deploy job** for Phase B.

### Poll Test Jobs

```bash
gh run view "$RUN_ID" --json jobs --jq '.jobs[] | {name: .name, status: .status, conclusion: .conclusion}'
```

Repeat every 30 seconds until all test jobs have `status: completed`. If any fail, enter the Fix-and-Retry Loop immediately (don't wait for build jobs).

### Gate Write

Check off "CI/CD (tests)" in `stage-gate.md`.

---

## Phase B: Build & Deploy Pipelines

### Watch Full Run

After all test jobs pass:

```bash
gh run watch "$RUN_ID" --exit-status
```

This blocks until all remaining jobs complete.

### Gate Write

Check off "CI/CD (build/deploy)" in `stage-gate.md`.

---

## User Communication During CI

CI/CD is a **long-running stage** (typically 10-30 minutes). The agent MUST keep the user informed throughout.

- **Before starting**: Tell the user "CI is running. Typical wait: 10-20 minutes. I'll report as jobs complete."
- **Phase A polling**: Report each job completion as it happens (e.g., "Lint passed, waiting on e2e tests...")
- **Phase B blocking**: Before calling `gh run watch`, tell the user: "All tests passed. Waiting for build/deploy (~5-10 min)."
- **On completion**: Immediately report the full results table.

### Inline vs Background: Choose Based on Context

| Situation | Approach |
|-----------|----------|
| **Nothing else to do** (typical ship-n-check flow) | Run **inline** — poll or `gh run watch`. You keep an active turn and can report immediately on completion. |
| **Parallel work available** (e.g., writing docs, preparing PR body) | Spawn background agent with `run_in_background: true`. **But**: tell the user what you're doing in parallel, and set expectations ("CI is running in background while I prepare X. I'll report when it completes.") |

### Background Agent Pitfalls

Background agents CAN notify the main agent via `<task-notification>`. But:
1. The user sees **silence** during the wait — no spinner, no progress
2. The main agent can't proactively update the user between turns
3. If the main agent has nothing else to do, it goes idle and the user wonders what's happening

**Anti-pattern**: Spawning a background agent then saying "I'll be notified when it's done" with nothing else to do. The user sits in silence until they ask for an update.

**If you choose background**: Always have meaningful parallel work. Never go idle waiting for a notification.

---

## Fix-and-Retry Loop (max 3 attempts)

```
1. Extract logs      -> gh run view "$RUN_ID" --log-failed
2. Check infra error -> if match, gh run rerun "$RUN_ID" --failed (skip 3-5)
3. Analyze & fix     -> fix the code locally
4. Local verify      -> run lint, type-check, tests
5. **GATE: Document fix** -> append to docs/<identifier>/review-feedback.md with `source: ci-fix` entry. **Do NOT proceed to commit until this is written.** This captures CI failure patterns for cross-ticket learning.
6. Commit & push     -> git add <files> && git commit -F ... && git push
7. Find new run      -> gh run list --branch "$BRANCH" --limit 1
8. Watch test jobs   -> Phase A again
```

### Known Infrastructure Errors (rerun, don't fix)

- `Failed to CreateArtifact: (409) Conflict`
- Network timeouts or registry connection errors
- Runner allocation failures
- Docker registry authentication errors
- `ECONNRESET` or `ETIMEDOUT` during install

For these: `gh run rerun "$RUN_ID" --failed` instead of fixing code.

### CI Fix Feedback Format

Append to `docs/<identifier>/review-feedback.md`:

```markdown
---
## [YYYY-MM-DD] TICKET — source: ci-fix

### CI/CD-FIX
- [ ] [file:line] CI job `<job-name>` failed — Description of fix applied (attempt N/3)

### Summary
- **CI fixes**: N issues
```

## Rules

- **ALWAYS** verify `headSha` matches the pushed commit before watching
- **ALWAYS** watch test jobs first (Phase A) — fix test failures before waiting for builds
- **ALWAYS** use job-level polling for Phase A, `gh run watch --exit-status` for Phase B
- **ALWAYS** append CI fixes to `review-feedback.md`
- **ALWAYS** report job completions to the user as they happen
- **ALWAYS** tell the user expected wait time before starting Phase B
- **ALWAYS** prefer inline monitoring when there's no parallel work to do
- **NEVER** wait for build/deploy jobs if test jobs are still failing
- **NEVER** poll with sleep loops — use `gh run watch` for Phase B
- **NEVER** exceed 3 fix-and-retry attempts — stop and inform user
- **NEVER** spawn a background agent then go idle — if background, do parallel work
- **NEVER** commit a CI fix without first documenting it in review-feedback.md — this is a blocking gate, not optional
