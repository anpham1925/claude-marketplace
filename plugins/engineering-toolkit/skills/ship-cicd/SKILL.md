---
name: ship-cicd
description: "Internal stage of the ship-n-check pipeline — monitors CI/CD pipelines and fixes failures. Invoke directly only via /engineering-toolkit:ship-cicd when explicitly requested by name. For general requests like 'check CI' or 'fix the pipeline', use engineering-toolkit:ship-n-check which routes here automatically."
argument-hint: '[ticket-number]'
model: opus
---

## Purpose

Monitor a CI/CD run and fix failures. The wait is a single backgrounded watch (re-invoked on exit, never polled); diagnosis happens in the `ci-watcher` agent only when the run fails.

## Steps

This skill has two distinct jobs — **waiting** for the run, and **diagnosing** it if it fails. Keep them separate; conflating them is what leaves subagents blocked for 30 minutes.

### Wait — at the orchestrator level, in the background

The agent driving the pipeline waits on the run *itself* — it does **not** wrap a passing run in a subagent. Find the run, confirm its `headSha` matches local HEAD (re-run `gh run list` if the push isn't registered yet), then watch the whole run with a single backgrounded command:

```bash
gh run watch "$RUN_ID" --exit-status
```

Run it with `Bash` `run_in_background: true` — the harness re-invokes you when the run exits. No polling; no subagent sitting on a green run. See [Long-Running Operations](../ship-n-check/reference/shared.md#long-running-operations).

When it exits, read the jobs once to report and gate:

```bash
gh run view "$RUN_ID" --json jobs --jq '.jobs[] | {name: .name, status: .status, conclusion: .conclusion}'
```

All jobs green → check off both "CI/CD (tests)" and "CI/CD (build/deploy)" in `stage-gate.md` and proceed to staging. Any job failed → diagnose (next section).

### Diagnose + fix — only when the run fails — in a fresh `engineering-toolkit:ci-watcher` subagent

Reading CI logs and proposing fixes is the "isolated investigation" workload that benefits from a fresh subagent — the agent that wrote the code shouldn't be the one reading its CI failure (author bias kicks in immediately). **Only when the run fails**, spawn a fresh `engineering-toolkit:ci-watcher` via the Agent tool with:

- The `<id>` (ticket → branch → session slug)
- The PR number / branch name
- The latest commit SHA

It runs the fix-and-retry loop (max 3 attempts), writes results to `.claude/artifacts/<id>/ci-watcher-results.md`, appends a `source: ci-fix` entry to `docs/<identifier>/review-feedback.md`, and updates `stage-gate.md`. It **returns only a pointer** (status + artifact path + ≤5-line summary). Read the artifact for detail (handoffs are file paths, not pasted text — see `rules/agent-artifacts.md`), present the summary at the next checkpoint, and decide whether to proceed.

**Do NOT spawn a subagent just to wait on a passing run** — that nesting (orchestrator → stage subagent → ci-watcher) is what blocks the orchestrator and produces hung subagents.

### Gate Check

Follow the [stage workflow template](../ship-n-check/reference/shared.md#stage-workflow-template). Verify "Push & PR" is checked. Confirm both "CI/CD (tests)" and "CI/CD (build/deploy)" are checked in `stage-gate.md` before staging.

---

## User Communication During CI

CI/CD is a **long-running stage** (typically 10-30 minutes). Keep the user informed without polling — see [Long-Running Operations](../ship-n-check/reference/shared.md#long-running-operations) for the canonical pattern.

- **Before starting**: tell the user "CI is running, ~10-20 min — I'll report the moment it finishes." Don't promise per-job updates you'd need a sleep loop to deliver.
- **On the re-invoke / when the ci-watcher returns**: immediately report the full results table.

The wait is a backgrounded `gh run watch` that re-invokes you on exit, so there's no idle-in-silence gap and no reason to sleep-poll for "progress". The waiting and the diagnosis are separate jobs: background the watch for the run; spawn the `ci-watcher` subagent only to diagnose a **failure**, never to sit on a green run (that nesting — orchestrator → stage subagent → ci-watcher — is what leaves subagents blocked for 30 minutes).

---

> **Where the procedure lives.** The *wait* (backgrounded watch + gate) is owned by this skill, above. The *failure-diagnosis* procedure — job-log analysis, fix-and-retry loop (max 3), known-infra-error rerun list, and CI-fix feedback format — lives canonically in `agents/ci-watcher.md`; this skill dispatches that agent on failure rather than restating it.

## Rules (orchestration)

- **ALWAYS** wait with a single backgrounded `gh run watch "$RUN_ID" --exit-status` (`Bash` `run_in_background: true`) — the harness re-invokes you on exit. Never sleep-poll or re-query jobs "every N seconds".
- **ALWAYS** dispatch a fresh `engineering-toolkit:ci-watcher` to diagnose/fix a **failed** run — author bias makes the implementing agent a poor CI-log reader. Don't spawn it to wait on a green run.
- **ALWAYS** read the ci-watcher's results from `.claude/artifacts/<id>/ci-watcher-results.md` rather than expecting them pasted into the return.
- **ALWAYS** tell the user the expected wait time before backgrounding the watch.
- **NEVER** proceed to staging until the run is green and `stage-gate.md` shows both CI gates checked — or, if it failed, until the ci-watcher reports PASS after its fixes.
- **NEVER** wait indefinitely for the ci-watcher's pointer — if it returns no `status`, or its artifact/gate entry is missing (e.g. it hit its turn limit), treat the stage as FAIL and re-dispatch once or surface to the user.
