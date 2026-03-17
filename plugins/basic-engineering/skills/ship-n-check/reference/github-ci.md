# CI/CD Monitoring

## Purpose

Monitor CI/CD pipelines and fix failures — independently of local checks or staging.

This stage has **two phases** executed sequentially:

| Phase | What to watch | Goal |
|-------|--------------|------|
| **5a: Test pipelines** | Jobs with names containing `test`, `lint`, `check`, `spec`, `unit`, `e2e`, `integration`, `ci` | Catch code issues early — fix before waiting for builds |
| **5b: Build & deploy pipelines** | All remaining jobs (build, image, deploy, release, etc.) | Only run after tests pass |

## Phase 5a: Test Pipelines

1. Find the latest workflow run for the branch (see Run Discovery below)
2. Verify the run's `headSha` matches the commit you pushed
3. List all jobs in the run and identify test-related jobs
4. Poll test jobs until they all complete (see Watching Individual Jobs below)
5. If any test job fails — enter the Fix-and-Retry Loop immediately (don't wait for build jobs)
6. Once all test jobs pass — proceed to Phase 5b

### Identifying Test Jobs

```bash
gh run view "$RUN_ID" --json jobs --jq '.jobs[] | {name: .name, status: .status, conclusion: .conclusion}'
```

Classify a job as a **test job** if its name (case-insensitive) contains any of: `test`, `lint`, `check`, `spec`, `unit`, `e2e`, `integration`, `ci`.

Everything else (e.g., `build`, `docker`, `image`, `deploy`, `release`, `push`, `publish`) is a **build/deploy job** for Phase 5b.

If you're unsure about a job's classification, treat it as a build/deploy job (Phase 5b).

## Phase 5b: Build & Deploy Pipelines

7. After all test jobs pass, watch the full run to completion
8. If any build/deploy job fails — enter the Fix-and-Retry Loop
9. Once all jobs pass — CI/CD stage is complete

### Watching the Full Run

```bash
gh run watch "$RUN_ID" --exit-status
```

This blocks until all remaining jobs complete. Since test jobs already passed in Phase 5a, any failure here is a build/deploy issue.

## Commands

### Run Discovery

**Avoid `$()` command substitution** — it triggers Claude Code permission prompts. Run commands separately instead:

```bash
# Step 1: Get the run info (run as separate command, read the output)
gh run list --branch "BRANCH_NAME" --limit 1 --json databaseId,headSha,status

# Step 2: Get pushed commit sha (run as separate command)
git rev-parse HEAD

# Step 3: Compare headSha from step 1 with sha from step 2
# Then use the databaseId from step 1 to watch
```

Verify `headSha` matches the commit you just pushed before proceeding.

### Watching Individual Jobs

To watch specific jobs without blocking on the entire run, poll job statuses:

```bash
gh run view "$RUN_ID" --json jobs --jq '.jobs[] | {name: .name, status: .status, conclusion: .conclusion}'
```

A job is complete when `status` is `completed`. Check `conclusion` for `success` or `failure`.

Repeat every 30 seconds until all target jobs (test jobs for 5a) have `status: completed`. Use `gh run watch` with `--exit-status` only for Phase 5b when waiting for the full run.

### Check Which Jobs Failed

```bash
gh run view "$RUN_ID" --json jobs --jq '.jobs[] | select(.conclusion == "failure") | .name'
```

### Extract Failed Logs

```bash
gh run view "$RUN_ID" --log-failed
```

### Rerun Known Infrastructure Errors

If the failure matches a known infra error, rerun the failed jobs instead of fixing code:

```bash
gh run rerun "$RUN_ID" --failed
```

### View PR Checks

```bash
gh pr checks
```

## Known Infrastructure Errors (rerun, don't fix)

These are CI infra issues — not code problems. Rerun with `gh run rerun "$RUN_ID" --failed` instead of fixing code:

- `Failed to CreateArtifact: (409) Conflict: an artifact with this name already exists on the workflow run`
- Network timeouts or registry connection errors
- Runner allocation failures
- Docker registry authentication errors
- `ECONNRESET` or `ETIMEDOUT` during `yarn install` / `npm install`

Check your project's `CLAUDE.md` or `AGENTS.md` for additional project-specific known errors.

## Fix-and-Retry Loop (max 3 attempts)

```
1. Extract logs      -> gh run view "$RUN_ID" --log-failed
2. Check for known infra errors -> if match, gh run rerun "$RUN_ID" --failed (skip steps 3-5)
3. Analyze & fix     -> fix the code locally
4. Local verify      -> run lint, type-check, tests
5. Document fix      -> append to docs/<identifier>/review-feedback.md under CI/CD-FIX section
6. Commit & push     -> git add <files> && git commit && git push (skip if rerun)
7. Find new run      -> gh run list --branch "$BRANCH" --limit 1 --json databaseId,headSha
8. Watch test jobs   -> Phase 5a again (poll test jobs first, then 5b)
```

If still failing after 3 attempts, STOP and inform the user.

### CI/CD-FIX Feedback Format

Append a new dated section to `docs/<identifier>/review-feedback.md`:

```markdown
---

## [YYYY-MM-DD] TICKET — source: ci-fix

### CI/CD-FIX

- [ ] [file:line] CI job `<job-name>` failed — Description of fix applied (attempt N/3)

### Summary

- **CI fixes**: N issues
```

## Rules

- **ALWAYS** verify the run's `headSha` matches the pushed commit before watching
- **ALWAYS** watch test jobs first (Phase 5a) — fix test failures before waiting for builds
- **ALWAYS** use job-level polling for Phase 5a, `gh run watch --exit-status` for Phase 5b
- **ALWAYS** append CI/CD fixes to `docs/<identifier>/review-feedback.md` under the `CI/CD-FIX` section
- **NEVER** wait for build/deploy jobs if test jobs are still failing
- **NEVER** exceed 3 fix-and-retry attempts — stop and inform user
