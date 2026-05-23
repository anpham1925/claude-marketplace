---
name: ai-dlc-release
description: "Internal phase of the ai-dlc pipeline — gets code from branch to merged PR by delegating to the existing ship-n-check pipeline. Invoke directly only via /engineering-toolkit:ai-dlc-release when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Sonnet** — Execution-focused, delegates to ship-* stages.

## Agent: Releaser

**Mission**: Get verified, reviewed code merged by invoking the existing ship-n-check pipeline stages.

**Inputs**: `state.md`, verified code from Verify phase
**Outputs**: Merged PR + updated `state.md` (Release status, PR URL), Jira updated
**Return Contract**: see [Subagent Return Contract](../ai-dlc/reference/shared.md#subagent-return-contract) — final return MUST be the 7-line structured shape, not free-form prose
**Delegation**: Invokes existing ship-* stage skills via the Skill tool

**Definition of Done**:
- PR merged to the default branch via `ship-n-check` (no manual git/gh commands)
- CI pipeline finished green on the merge commit
- Staging verification (health + smoke endpoints) has run and passed
- Jira ticket transitioned to the right post-merge state with a release comment
- Pipeline artifacts archived under `docs/<identifier>/`
- `state.md` marks Release complete

## Why This Phase Exists

AI-DLC's Release phase reuses the battle-tested ship-n-check pipeline. There's no need to reinvent branch creation, quality gates, CI/CD monitoring, staging verification, or PR review — those skills already handle it well. This phase is a thin orchestrator that delegates.

## Steps

### Spawn Release Subagent (when invoked from a long-running ai-dlc session)

By the time Release runs, the parent conversation has typically accumulated Plan + Inception + Domain Design + Logical Design + (optionally Red Team) + Construct + Verify — easily 100k+ tokens. Running ship-n-check inline against that parent context blows the budget on every model tier (Haiku-200k overflows; Sonnet-1M needs paid tier).

**If the parent context is large** (rule of thumb: this is being invoked from the AI-DLC orchestrator after Verify), spawn a fresh `general-purpose` subagent via the Agent tool to run the full release flow. Pass it ONLY:

- This file's path as methodology
- The identifier (e.g. `market-ta-phase-9-signal-quality`)
- The ticket number if any

The subagent reads `docs/<identifier>/state.md` for pipeline context, then executes "Check State", "Determine Ticket", "Delegate to Ship Pipeline", "Post-Release Jira", "Archive Pipeline Artifacts", and "Update State" itself. It writes a final consolidated report (PR URL, merge SHA, archived artifacts list) back to `state.md` and returns a short summary to the orchestrator.

The orchestrator (this agent) then reads `state.md`, presents the result at the AI-Initiated Recommendation checkpoint, and asks about Observe.

**If invoked from a fresh terminal** (no large parent context): run inline without spawning a subagent — the spawn cost outweighs the isolation benefit.

### Checkpoint Propagation (CRITICAL — harness limitation)

The Claude Code harness has no `SendMessage` primitive that resumes a terminated subagent. The subagent's `result` is its final turn. This breaks ship-* skills that pause at internal approval checkpoints (`ship-branch` commit-approval, `ship-push-pr` push-approval, `ship-pr-review` reviewer-comment-triage) when run *inside* the Release-orchestrator subagent.

Without explicit handling, every checkpoint forces a fresh Release-subagent re-spawn — Phase 15f hit this 3 times across one release, each round re-burning subagent onboarding cost and risking stage-list drift.

**The protocol — every Release subagent MUST follow this**:

When a ship-* skill reaches an internal checkpoint, the Release subagent returns immediately (do NOT wait silently) with the [Subagent Return Contract](../ai-dlc/reference/shared.md#subagent-return-contract) shape:

- **Status**: `NEEDS_USER_INPUT`
- **Open questions**: one entry per checkpoint, phrased so the parent orchestrator can render it directly via `AskUserQuestion` — include the exact options (e.g. "Approve commit / Tweak first / Abort")
- **Artifacts written**: every durable hand-off file the continuation subagent will need to resume without re-deriving (commit message, PR body, staged-file list)
- **State snapshot**: which ship-* stages have completed (with commit SHAs / PR numbers / CI run IDs), which is currently waiting on approval

The parent orchestrator reads the contract, calls `AskUserQuestion`, persists the answer into `state.md`, then spawns the **next** Release subagent with the answer pre-baked.

#### Durable hand-off files (write BEFORE pausing, read AFTER resuming)

The Release subagent and any continuation MUST treat these files as the source of truth — never re-derive:

| File | Written by | Read by |
|---|---|---|
| `docs/<identifier>/commit-msg.txt` | `ship-branch` BEFORE the commit-approval checkpoint | Continuation that runs `git commit -F` |
| `docs/<identifier>/staged-files.txt` | `ship-branch` BEFORE the commit-approval checkpoint (`git diff --cached --name-only > docs/<id>/staged-files.txt`) | Continuation, to verify git's index hasn't drifted |
| `docs/<identifier>/pr-body.md` | `ship-push-pr` BEFORE the push-approval checkpoint | Continuation that runs `gh pr create --body-file` |
| `docs/<identifier>/state.md` § Release stage table | every stage on completion (SHA / PR# / CI run-id) | continuation, to find the next unchecked stage |
| `docs/<identifier>/stage-gate.md` | every stage on completion | continuation, to verify gate ordering |

A continuation subagent **does NOT**:
- Re-stage files IF the current index matches `staged-files.txt` (run `git diff --cached --name-only` and `diff` against the recorded list). If it drifts (e.g., a human edit or parallel agent activity touched the working tree between subagent spawns), STOP and surface to the orchestrator — do not silently re-derive.
- Re-write the commit message (it's in `commit-msg.txt`)
- Re-derive the PR body (it's in `pr-body.md`)
- Re-run completed stages (the stage table in state.md tells it which to skip)

The continuation reads `state.md` § Release stage table, finds the first unchecked stage, picks up from there.

**Scope note**: Patch 2 (this protocol) covers `ship-branch` and `ship-push-pr` checkpoints. `ship-pr-review` has its own pause-and-resume around reviewer feedback triage — that's out of scope for v6.21.0 and remains a follow-on. Until then, `ship-pr-review` pauses inside a Release subagent should be surfaced via the same `NEEDS_USER_INPUT` contract but the continuation reads the reviewer-comment thread fresh from `gh pr view` rather than from a durable file.

#### Continuation spawn prompt (canonical shape)

When the parent orchestrator re-spawns the Release subagent after answering a checkpoint, the spawn prompt is:

```
You are the Release agent (CONTINUATION) for AI-DLC, scoped to identifier <id>.
A prior Release subagent paused at the <ship-stage> checkpoint and surfaced
its question via the return contract. The user has answered: <answer>.

Read the methodology FIRST, in full:
- /path/to/skills/ai-dlc-release/SKILL.md

SKIP the `## Invocation Mode` block (orchestrator subagent — no nested dispatch).

The durable hand-off state lives in:
- docs/<id>/state.md (Release stage table — find the first unchecked stage)
- docs/<id>/commit-msg.txt (if present, the commit message — do NOT re-derive)
- docs/<id>/pr-body.md (if present, the PR body — do NOT re-derive)

Resume from the first unchecked stage. If you hit another internal checkpoint,
return NEEDS_USER_INPUT immediately — do not wait silently.
```

### Check State

Read `docs/<identifier>/state.md`. Verify that Verify is completed. See [shared reference](../ai-dlc/reference/shared.md) for format.

### Determine Ticket Number

Extract the ticket number from:
1. `state.md` ticket field
2. `$ARGUMENTS` if provided
3. Ask the user if not available

### Delegate to Ship Pipeline

Invoke each ship stage skill sequentially via the Skill tool. **All seven stages are mandatory. None may be skipped, none may be reordered.**

1. **Branch & Commit**: invoke `/engineering-toolkit:ship-branch {ticket}`
2. **Quality Checks**: invoke `/engineering-toolkit:ship-quality {ticket}`
3. **Simplify**: invoke `/simplify` ← historically the silent-skip footgun; see Return Contract below
4. **Push & PR**: invoke `/engineering-toolkit:ship-push-pr {ticket}`
5. **CI/CD**: invoke `/engineering-toolkit:ship-cicd {ticket}`
6. **Staging**: invoke `/engineering-toolkit:ship-staging {ticket}`
7. **PR Review**: invoke `/engineering-toolkit:ship-pr-review {ticket}`

Each ship stage has its own checkpoints and gates. Follow them as defined in the ship-n-check pipeline.

#### Return Contract (mandatory)

Your final return summary to the orchestrator MUST include a section:

```
### Executed Stages
- [x] ship-branch
- [x] ship-quality
- [x] /simplify
- [x] ship-push-pr
- [x] ship-cicd
- [x] ship-staging
- [x] ship-pr-review
```

If any stage was skipped (e.g., no staging environment exists), mark it `[skipped: <reason>]` instead of removing it. **Removing a stage line is forbidden.** The orchestrator parses this checklist and rejects the Release return if any stage is absent.

### Post-Release Jira Updates

After the PR is merged:
- Transition ticket to "Done" (use `getTransitionsForJiraIssue` + `transitionJiraIssue`)
- Post final comment with PR link and summary

### Close Deferral Payments

If Plan's `## Deferral Payments In Scope` section listed deferrals being paid down by this phase, close the loop now. Skip if the section says `none` or doesn't exist.

For each closed deferral ID:

1. **Update the originating per-phase improvements file**. The path was recorded in `docs/IMPROVEMENTS.md` as the entry's `**Source**:` line (typically `docs/_archive/<phase>/improvements.md` post-archive-migration; older repos may have it at `docs/<phase>/improvements.md`). Append to that entry's body:

   ```markdown
   **Status: Closed YYYY-MM-DD** — paid down in phase <this-phase-id> (PR #<n>).
   ```

   Use today's date and the merge PR number from the previous step.

2. **Remove the entry from `docs/IMPROVEMENTS.md`** (the rolled-up living list). The rollup tracks *open* items only — closed ones live in their archived per-phase file. If the closed entry was the only one under a phase header, remove the phase header too.

3. **Update the Status index** at the top of `docs/IMPROVEMENTS.md` (if it has one) to drop the row for the closed ID.

4. **Verify no orphan references** — search `docs/IMPROVEMENTS.md` for the closed ID using **exact-token / word-boundary matching** so `S-1` doesn't false-match `S-10`, `S-11`, etc. Examples: `grep -w 'S-1' docs/IMPROVEMENTS.md` or `grep -E '\bS-1\b' docs/IMPROVEMENTS.md`. If any survive, that's a bug in this step. Fix or report.

Commit: `chore: [TICKET] close deferral <ID-list> in IMPROVEMENTS.md (post-merge)`

**Why this is here, not in Construct/Verify**: Plan put the deferral into scope as ACs; Construct + Verify confirmed the work shipped. The IMPROVEMENTS.md rollup is downstream-of-merge bookkeeping, not part of the feature itself. Doing it post-merge means the closure entry can cite the actual merge PR number.

**Why this is automatic, not user-prompted**: a deferral that's been paid down is no longer open. Asking the user "should I close S-1?" after they explicitly chose to pay it down at Plan step-0 is friction tax, not a real decision.

### Archive Pipeline Artifacts

After merge, separate durable knowledge from ephemeral plumbing:

**Keep** (valuable for future features touching the same area):
- `prd-plans/domain-model.md` — domain concepts, aggregates, business rules
- `prd-plans/specs.md` — design rationale, NFR targets, alternatives rejected
- `prd-plans/flows.md` — architecture flow diagrams
- `prd-plans/fix-report.md` — root cause, fix, regression prevention (bug-fix intents)
- `prd-plans/ADR-*.md` — architectural decision records
- `review-feedback.md` — review findings for cross-ticket pattern detection via `/engineering-toolkit:review-learning`

**Delete** (only useful during the active pipeline):
- `state.md` — pipeline position tracking
- `commit-msg.txt`, `pr-body.md`, `staged-files.txt` — served as durable hand-off state during ship-* checkpoint propagation (see §Checkpoint Propagation above). Now that the PR is merged, they are no longer needed.

```bash
git rm -f docs/<identifier>/state.md
git rm -f docs/<identifier>/commit-msg.txt docs/<identifier>/pr-body.md docs/<identifier>/staged-files.txt
# Keep: docs/<identifier>/prd-plans/
```

"Durable" here means *durable within the pipeline* — they outlive a single subagent turn so checkpoint propagation works, but they are *not durable across pipelines* (each new feature creates new ones, the old ones are deleted at archive). This is why the table at §Checkpoint Propagation calls them "durable hand-off files" while this section calls them "no longer needed" — both framings are accurate at different scopes.

Commit: `chore: [TICKET] archive pipeline artifacts, keep design docs`

**Why**: The `prd-plans/` folder preserves *why* decisions were made — ADRs, rejected alternatives, NFR targets, domain model rationale. The code shows *what* exists; these docs show *why* it exists that way. Future features benefit from this context during Inception's code elevation.

### Auto-Trigger Review Learning

After archiving, scan `docs/**/review-feedback.md` (glob across all ticket docs in the repo) to check for accumulated feedback across tickets.

Count the total number of feedback entries across all `review-feedback.md` files. If there are entries from 3+ different tickets, suggest running review learning:

- **If 3+ tickets have feedback**: Ask the user before proceeding:
  > **{N} review feedback entries** found across {M} tickets. There may be recurring patterns worth turning into rules.
  >
  > Would you like me to run review learning now? (`/engineering-toolkit:review-learning`)

  Only invoke `/engineering-toolkit:review-learning` if the user confirms. If declined, move on.
- **If < 3 tickets**: Skip silently — not enough data to detect meaningful cross-ticket patterns.

### Update State

Update `docs/<identifier>/state.md`:
- Mark Release as completed
- Record PR number and merge status

### AI-Initiated Recommendation

After release completes:

> **Release complete.** PR #{number} has been merged.
>
> {If Observe is in the Level 1 Plan:}
> I recommend proceeding to **Observe** to verify the deployment is healthy. I'll check error rates and latency in Honeycomb against the NFR targets from Inception.
>
> {If Observe is NOT in the Level 1 Plan:}
> The AI-DLC pipeline is complete. All {N} acceptance criteria are verified, {N} NFRs addressed, and code is merged.
>
> Shall I {proceed to Observe | wrap up}?

## Rules

See [common phase rules](../ai-dlc/reference/shared.md#common-phase-rules) for state updates, Jira comments, and checkpoint protocol.

Phase-specific:
- **ALWAYS** delegate to ship-* stage skills — never reimplement shipping logic
- **ALWAYS** follow ship-n-check checkpoints and gates
- **ALWAYS** transition Jira ticket to "Done" after merge
- If any ship stage fails, follow its error handling (e.g., CI fix-and-retry loop)
