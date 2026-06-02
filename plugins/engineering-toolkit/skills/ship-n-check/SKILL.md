---
name: ship-n-check
description: Primary shipping workflow — use whenever the user is done coding and wants to get code merged. Covers the full git pipeline from branch to merge including committing, quality checks, pushing, PR creation, CI/CD monitoring, staging verification, and PR review feedback. Triggers for "I'm done", "ship it", "commit this", "create a branch", "push", "create PR", "open a draft PR", "check CI", "watch pipeline", "fix CI failures", "fix the pipeline", "check build status", "check staging", "verify deployment", "test on staging", "check PR reviews", "open for review", "address review feedback", "handle PR comments", "run local checks", "check quality", "prepare for PR", "run the done flow". Always prefer this over individual ship-* stage skills unless the user explicitly invokes a stage by name (e.g. /engineering-toolkit:ship-branch). Do NOT use for development work — use ai-dlc instead.
argument-hint: '[ticket-number]'
model: opus
---

## Quick Navigation

| Stage | Skill | What It Does |
|-------|-------|-------------|
| Branch & Commit | `/engineering-toolkit:ship-branch` | Create branch, stage files, commit |
| Requirements Review + Quality | `/engineering-toolkit:ship-quality` | Cross-check requirements (blocking) + lint/type-check/tests |
| Simplify | `/simplify` | Review changed code for reuse, quality, efficiency |
| Push & PR | `/engineering-toolkit:ship-push-pr` | Push branch, create draft PR |
| CI/CD | `/engineering-toolkit:ship-cicd` | Watch test pipelines, then build/deploy |
| Staging | `/engineering-toolkit:ship-staging` | Port-forward, health check, endpoint verification |
| PR Review + Address | `/engineering-toolkit:ship-pr-review` | Open PR, wait for reviews, address feedback |

## Invocation

```
/engineering-toolkit:ship-n-check              # Full pipeline from branch to merge
/engineering-toolkit:ship-n-check PROJ-123      # Full pipeline with ticket number
```

Individual stages can also be invoked directly (e.g., `/engineering-toolkit:ship-cicd`, `/engineering-toolkit:ship-staging`).

## Done Flow (Full Pipeline)

When finished coding and ready to submit, dispatch each stage to a Task subagent sequentially. **DO NOT call Skill(...) for stage execution** — Skill calls run inline in the parent context and accumulate transcript across all stages, blowing past the 200k haiku window. Each stage MUST run in an isolated subagent so only a short summary returns to the orchestrator. (The one exception is the CI/CD and Staging *waits*, which the orchestrator runs as backgrounded commands rather than wrapped subagents — see the carve-out below.)

```
[ship-branch]  -->  [ship-quality]  -->  /simplify  -->  [ship-push-pr]
                                                              |
                                                         [ship-cicd]        ← orchestrator backgrounds `gh run watch`
                                                              |               (re-invoked on exit; no polling, no blocked subagent)
                                                        [ship-staging]
                                                              |
                                                       [ship-pr-review]
                                                              |
                                                     (loop back to ship-cicd if fixes pushed)
```

### Stage Invocation (Task subagents, not Skill calls)

For each stage, spawn a `general-purpose` Task subagent that invokes the stage skill internally and returns ONLY a short structured summary. Wait for each subagent to finish before dispatching the next — stages are sequential.

**Exception — CI/CD and Staging waits run at the orchestrator, not in a blocking subagent** (see the carve-out below). For those stages the orchestrator follows the skill directly so it can background the watch and be re-invoked on exit; it dispatches a subagent only for failure diagnosis (`engineering-toolkit:ci-watcher`). All other stages follow the Task-subagent pattern above.

**Required dispatch pattern:**

```
Task(
  subagent_type="general-purpose",
  description="<stage> stage",
  prompt="""
You are running the <stage> stage of the ship-n-check pipeline for ticket <TICKET>.

1. Invoke the skill /engineering-toolkit:<stage> <TICKET> via the Skill tool.
2. Follow the skill's instructions PRECISELY. Do not skip stage-gate reads/writes.
3. Stop and report back to the parent if the skill blocks or asks for user input — do NOT make user-facing decisions yourself.

Return ONLY this summary (no transcript, no diff, no command output):
- Status: PASS | FAIL | NEEDS_USER_INPUT
- Stage-gate written: yes/no
- Key outputs: <branch name | commit SHA | PR URL | run ID — whichever apply>
- Blockers (if any): <one line>
- Next stage: <name>
"""
)
```

**Per-stage description and skill mapping:**

| Stage | description | Skill invoked inside subagent |
|-------|-------------|------------------------------|
| Branch & Commit | "ship-branch stage" | `/engineering-toolkit:ship-branch [ticket]` |
| Quality | "ship-quality stage" | `/engineering-toolkit:ship-quality [ticket]` |
| Simplify | "simplify stage" | `/simplify` |
| Push & PR | "ship-push-pr stage" | `/engineering-toolkit:ship-push-pr [ticket]` |
| CI/CD | — (runs at orchestrator) | `/engineering-toolkit:ship-cicd` — **exception: not a blocking subagent.** The orchestrator follows it directly and backgrounds the watch; it dispatches a `engineering-toolkit:ci-watcher` subagent only on failure (see the carve-out below) |
| Staging | — (runs at orchestrator) | `/engineering-toolkit:ship-staging` — **exception:** the orchestrator follows it directly; the pod wait is a backgrounded `kubectl wait` |
| PR Review | "ship-pr-review stage" | `/engineering-toolkit:ship-pr-review [ticket]` |

**User-approval checkpoints stay in the parent.** When a stage's summary returns `NEEDS_USER_INPUT` (e.g. commit approval, PR creation approval, debatable auto-fix), the orchestrator surfaces the question to the user and only dispatches the next subagent after explicit approval. Subagents never decide on the user's behalf.

**Loop-back on CI fixes.** If `ship-pr-review` pushes fixes, dispatch a fresh `ship-cicd` subagent — do not reuse the prior one.

**CI/CD and staging waits run at the orchestrator — not inside a blocked subagent.** The *waiting* parts of `ship-cicd` (waiting on the run) and `ship-staging` (waiting on the pod) are backgrounded `gh run watch` / `kubectl wait` calls the orchestrator issues itself; the harness re-invokes the orchestrator when they exit. Dispatch a subagent for these stages only for *work* that needs bias isolation — a fresh `engineering-toolkit:ci-watcher` to diagnose a **failed** run. Never wrap a passing run or a readiness wait in a subagent the orchestrator then blocks on for 30 minutes — that is exactly what leaves subagents stuck without closing. See [Long-Running Operations](reference/shared.md#long-running-operations).

**Subagent liveness.** A dispatched stage subagent must return a structured summary *and* write its stage-gate entry. If a subagent returns nothing, returns no `Status:` line, or its stage-gate entry is missing (e.g. it hit its turn limit and died mid-stage), treat the stage as FAIL — re-dispatch once, or surface to the user. Do NOT wait indefinitely for a summary or artifact pointer that never arrives.

### Resume Flow (no changes to commit)

If on a non-master/main branch with nothing to commit or push:
- **Skip to CI/CD** — dispatch the `ship-cicd` subagent, then continue with staging+

## Pre-Stage Protocol

Before each stage, the stage skill will:
1. **Read** `docs/<identifier>/stage-gate.md` — verify previous stage is done
2. **Execute** the stage
3. **Write** completion entry to `stage-gate.md`

See [reference/shared.md](reference/shared.md) for full stage-gate protocol, git rules, commit conventions, and PR rules.

## Setup

This skill reads config from `${CLAUDE_PLUGIN_DATA}/config.json` if it exists (shared with ai-dlc skill). See [reference/shared.md](reference/shared.md) for config fields.

If config is missing, fall back to auto-detecting from `package.json` scripts.

## Gotchas

Common failure modes — if you catch yourself doing any of these, stop and correct:

- **Skipping the stage gate** — Every stage must read the gate file before starting and write after completing.
- **Pushing before replying to PR comments** — Address Reviews has sub-gates. "Replied to ALL comments" MUST be checked before pushing.
- **Using `git add .` or `git add -A`** — Always stage specific files.
- **Forgetting `Co-Authored-By`** — Every commit must include it.
- **Using `$()` in commit commands** — Write message to file first, then `git commit -F`.
- **Skipping requirements review** — It's a blocking gate regardless of confidence.
- **Polling CI with sleep loops** — Background `gh run watch --exit-status` (`run_in_background: true`); the harness re-invokes you on exit. Never sleep-poll or re-query "every N seconds".
- **Calling stages via `Skill(...)` from the orchestrator** — Skill calls run inline and bloat the parent context. Always dispatch via Task subagents.
- **Going silent during CI** — tell the user the expected wait before backgrounding the watch, then report the full result on the re-invoke. The backgrounded watch wakes you on completion, so there's no fire-and-forget gap.
- **Creating PR as non-draft** — Always `--draft`.
- **Amending commits** — Default is always a NEW commit.
- **Force-pushing** — Never, unless user explicitly asks. Never to master/main.

## Rules

- **NEVER** skip the stage gate — read before, write after. No exceptions.
- **NEVER** push code until "Replied to ALL comments" sub-gate is checked
- **NEVER** skip stages — execute every stage in order
- **NEVER** batch multiple stages into one action
- **NEVER** commit without user approval at Branch & Commit checkpoint
- **NEVER** skip requirements review — blocking gate
- **NEVER** proceed past Requirements Review if it returns FAIL
- **NEVER** skip `/simplify` — always run after quality checks pass
- **NEVER** create the PR without user approval at Push & PR
- **NEVER** auto-fix debatable items — always ask the user
- **NEVER** exceed 3 fix-and-retry attempts in CI/CD or Address Reviews
- **ALWAYS** dispatch stages as Task subagents — never call `Skill(/engineering-toolkit:ship-*)` from the orchestrator (Skill calls run inline and accumulate context across stages). **Exception:** the CI/CD and Staging *waits* are run by the orchestrator as backgrounded commands (`gh run watch` / `kubectl wait`) — neither a Skill call nor a wrapped subagent — and a `engineering-toolkit:ci-watcher` subagent is dispatched only to diagnose a failed run (see the carve-out above)
- **ALWAYS** wait for each subagent to finish and surface its summary before dispatching the next
- **ALWAYS** run the CI/CD and staging *waits* at the orchestrator level via backgrounded `gh run watch` / `kubectl wait` — never inside a subagent the orchestrator blocks on
- **NEVER** wait indefinitely for a subagent — if it returns no `Status:` summary or leaves its stage-gate entry unwritten, treat the stage as FAIL and re-dispatch once or surface to the user
- **ALWAYS** run lint, type-check, and tests before submitting
- **NEVER** delete `docs/<identifier>/review-feedback.md` — always append
- If any quality check fails and can't be fixed, **STOP** and inform the user
