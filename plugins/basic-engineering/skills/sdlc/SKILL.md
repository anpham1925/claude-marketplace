---
name: sdlc
description: "TRIGGER when: user says 'start ticket', 'pick up TICKET-123', 'analyze this ticket', 'design a solution', 'implement', 'ship this', 'plan', 'analyze', or references a Jira ticket ID or GitHub issue (e.g. #123, org/repo#456). Also trigger for 'run the full pipeline', 'what stage am I on', or resuming a partially-completed ticket. DO NOT trigger for: one-off code changes without a ticket, quick fixes, or questions about code."
argument-hint: '[stage] [TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — This skill involves deep reasoning, architecture decisions, or code review.

## Invocation

```
/basic-engineering:sdlc PRT-123              # Full pipeline from analyze to release
/basic-engineering:sdlc analyze PRT-123      # Analyze only
/basic-engineering:sdlc design               # Design only
/basic-engineering:sdlc breakdown            # Breakdown only (optional)
/basic-engineering:sdlc implement            # Implement only
/basic-engineering:sdlc test                 # Test only
/basic-engineering:sdlc verify               # Verify only
/basic-engineering:sdlc review               # Review only
/basic-engineering:sdlc release              # Release only
```

Stages are composable. Run individually or let the full pipeline run with checkpoints.

## Stage Overview

```
[Analyze] --> checkpoint --> [Design + Plan Creation] --> checkpoint --> [Breakdown?] --+--> [Implement]
                                                                                       |        |
                                                                             (optional,    [Test] (parallel)
                                                                           if large plan)      |
                                                                                          [Verify] --> [Review] --> checkpoint --> [Release]
```

Plan creation happens inside the Design stage. After the Design checkpoint, the orchestrator evaluates whether the plan is large enough to warrant breakdown into sub-tasks. If breakdown is triggered and approved, the pipeline stops — each sub-task gets its own SDLC cycle.

## Stage Skills

Each stage is a standalone skill that can be invoked independently:

| Stage | Skill | Model | Input | Output |
|-------|-------|-------|-------|--------|
| Analyze | `/basic-engineering:sdlc-analyze` | haiku | Jira ticket ID | Structured requirements |
| Design | `/basic-engineering:sdlc-design` | opus / sonnet | Requirements | Solution design + ADR + execution plan (`specs.md`) |
| Breakdown | `/basic-engineering:sdlc-breakdown` | sonnet | Plan (specs.md + flows.md) | Breakdown plan + Jira sub-tasks (optional) |
| Implement | `/basic-engineering:sdlc-implement` | sonnet | Execution plan (`specs.md`) | Code + unit tests (TDD) |
| Test | `/basic-engineering:sdlc-test` | sonnet | Execution plan (`specs.md`) + code | E2e tests |
| Verify | `/basic-engineering:sdlc-verify` | sonnet | Goal + must-haves + code | Verification report |
| Review | `/basic-engineering:sdlc-review` | opus | Code changes + verification report | Review feedback |
| Release | `/basic-engineering:sdlc-release` | sonnet | Approved code | Merged PR |

## Parsing Arguments

- If `$ARGUMENTS` contains a stage name (`analyze`, `design`, `breakdown`, `implement`, `test`, `verify`, `review`, `release`), invoke that stage skill only
- If `$ARGUMENTS` contains a ticket ID (matches pattern like `PRT-123`, `PSR-456`, `MOX-789`), pass it to the stage skill
- If no stage specified, run the **Full Pipeline**
- If no ticket ID and stage requires one, **ask the user**

## State Tracking

The orchestrator maintains a lightweight state file at `docs/<identifier>/STATE.md` (same `<identifier>` as the plan folder — ticket number or branch name). This file is the pipeline's "living memory" — read it at the start of every stage, update it at the end.

**STATE.md must stay under 100 lines.** It is a digest, not an archive.

```markdown
# STATE — <identifier>

## Position
- **Current stage**: <stage name>
- **Status**: <in-progress | blocked | checkpoint>
- **Last completed**: <stage name> at <timestamp>

## Artifacts
- Requirements: <approved | pending | N/A>
- Design: <approved | pending | N/A>
- Plan: <path to specs.md>
- Verification: <passed | gaps_found | pending>

## Decisions
- <Key decision 1 made during checkpoint>
- <Key decision 2>

## Blockers
- <Active blocker, if any>

## Notes
<Anything the next stage needs to know — deviations, user feedback, etc.>
```

**Rules:**
- Create STATE.md at the start of Analyze (or the first stage run)
- Update after every stage completion and every checkpoint
- If resuming a pipeline, read STATE.md first to understand where things left off
- Keep it under 100 lines — move historical info to Jira comments

## Full Pipeline

Run all stages with human checkpoints between major phases. Each stage is invoked via the Skill tool.

### 1. Analyze

Invoke `/basic-engineering:sdlc-analyze` with the ticket ID.

**CHECKPOINT**: Requirements must be approved before proceeding.

### 2. Design (with Revision Loop + Plan Creation)

Invoke `/basic-engineering:sdlc-design` with the ticket ID. This handles the Architect, Plan-Checker revision loop, and plan creation (specs.md, flows.md, flows.png).

**CHECKPOINT**: Design must be approved before proceeding.

### 3. Breakdown (Optional)

Invoke `/basic-engineering:sdlc-breakdown` with the ticket ID. Evaluates plan complexity against thresholds (3+ modules, 5+ files, 4+ independent ACs, >400 lines). If any threshold is met, offers breakdown to the user.

- If user **approves breakdown** → sub-tasks are created in Jira, pipeline **stops here**. Each sub-task gets its own SDLC cycle.
- If user **declines breakdown** or no thresholds met → proceed to Implement.

### 4. Implement

Invoke `/basic-engineering:sdlc-implement` with the ticket ID. Reads `specs.md` and follows TDD.

### 5. Test

Invoke `/basic-engineering:sdlc-test` with the ticket ID. Can start in parallel with Implement once contracts are defined.

### 6. Verify

Invoke `/basic-engineering:sdlc-verify` with the ticket ID. Goal-backward verification with gap closure loop.

If GAPS_FOUND → loops back to Implement for fixes → re-verifies (max 2 iterations).

### 7. Review

Invoke `/basic-engineering:sdlc-review` with the ticket ID.

**CHECKPOINT**: Review summary presented to user.

### 8. Release

Invoke `/basic-engineering:sdlc-release` with the ticket ID. Delegates to ship-n-check for the full release pipeline.

## Handoff Contracts

```
Analyst --[Structured Requirements]--> Architect
Architect <--[Revision Loop]--> Plan-Checker (max 3 iterations)
Architect --[Solution Design]--> Orchestrator creates Plan (specs.md)
                                        |
                                        +--> Decomposer (optional — if plan is large)
                                        |       +--> [STOP: sub-tasks get own SDLC cycles]
                                        |       +--> [SKIP: user declines or thresholds not met]
                                        |
                                        +--> Implementer (execution plan)
                                        +--> Tester (execution plan, parallel)
Implementer --[Code + Tests]--> Verifier
Tester --[E2e Tests]--> Verifier
Verifier --[Gaps]--> Implementer (gap closure, max 2 iterations)
Verifier --[Verification Report]--> Reviewer
Reviewer --[Approved Code]--> Release
```

### Handoff Rules

- **Never skip a handoff** — each agent needs the previous artifact
- **Artifacts are append-only** — later agents can add to them but not remove
- **Checkpoint artifacts** — Analyst and Architect outputs must be user-approved before handoff
- **Parallel handoff** — Implementer and Tester both receive the execution plan simultaneously
- **Revision loops are bounded** — Design: max 3 iterations, Verify gap closure: max 2 iterations
- **Pass file paths, not content** — agents read artifacts from disk, keeping the orchestrator thin

## Thin Orchestrator Principle

The main conversation is the orchestrator. It should stay thin — route work to stage skills, don't do it inline. Each stage skill gets a **fresh context window**, which prevents quality degradation from accumulated context.

- **Orchestrator budget**: ~15% of context for routing, state tracking, and checkpoints
- **Agent budget**: each stage skill gets a clean, full context window for its task
- **Never paste large artifacts inline** — write them to files and pass file paths

## Checkpoint Rules

- **ALWAYS** pause after Analyze — requirements must be approved
- **ALWAYS** pause after Design — solution must be approved
- **ALWAYS** pause after Review — for NEEDS-INPUT items
- Implement + Test + Verify flow without human checkpoints (Verify has automated gap-closure loops)
- Release has its own checkpoints via the ship-n-check skill

## Jira Integration

Use the Atlassian MCP tools throughout:

| Action | Tool | When |
|--------|------|------|
| Read ticket | `getJiraIssue` | Analyze: read full ticket details |
| Get transitions | `getTransitionsForJiraIssue` | Before transitioning status |
| Transition status | `transitionJiraIssue` | Analyze: -> In Progress, Release: -> Done |
| Post comment | `addCommentToJiraIssue` | After each stage with artifact summary |
| Read linked issues | `getJiraIssue` | Analyze: understand dependencies |

## Rules

- **NEVER** skip the Analyze stage — always understand before building
- **NEVER** skip checkpoints — always get user approval at defined points
- **NEVER** implement without a design — even for "simple" changes, at minimum document the approach
- **NEVER** skip TDD in the Implement stage — write tests first
- **NEVER** skip Verify — task completion != goal achievement
- **ALWAYS** post Jira comments after each stage
- **ALWAYS** follow existing codebase patterns found during Analyze/Design
- **ALWAYS** update STATE.md after each stage completion
- If a stage fails or gets stuck, **STOP** and inform the user — don't retry endlessly
- Implementer can auto-fix bugs and blocking issues (deviation rules 1-3) but must STOP for architectural changes (rule 4)

## Gotchas

Common failure points — if Claude keeps hitting these, the skill needs updating:

- **Pasting large artifacts inline** — Design output dumped into the conversation instead of written to a file. This bloats the orchestrator context. Write to disk, pass file paths.
- **Shallow plans** — `specs.md` tasks with vague actions like "implement the handler" instead of concrete "add `CreatePayoutHandler` in `modules/payout/application/commands/` implementing `ICommandHandler<CreatePayoutCommand>`". If `acceptance_criteria` can't be grep-verified, the plan is not ready.
- **Skipping Verify** — Going straight from Test to Review. Verify catches wiring gaps that tests miss (e.g., handler exists but isn't registered in the module).
- **Forgetting STATE.md** — Resuming a pipeline without reading STATE.md, leading to repeated work or skipped stages.
- **Revision loop runs forever** — Plan-Checker and Architect going back and forth. Enforce the max 3 iteration limit — surface unresolved issues at the checkpoint instead.
- **Jira MCP not available** — If Jira MCP tools aren't connected, don't fail silently. Ask the user whether to proceed without Jira or set it up first.
- **Analysis paralysis in Implement** — Implementer reads 10+ files without writing anything. The 5-read guard exists for a reason — surface the blocker early.

## Persistent Data

This skill stores execution data in `${CLAUDE_PLUGIN_DATA}/sdlc/` for cross-session learning:

- `execution-log.jsonl` — append-only log of each stage execution (stage, timestamp, outcome, duration)
- `velocity.json` — rolling metrics: avg time per stage, common blockers, gap-closure frequency
- `gotchas-learned.md` — gotchas discovered during execution that aren't in this file yet (user can PR them back)

**How to use:**
- At pipeline start, read `velocity.json` to estimate complexity and flag if this ticket type historically has issues
- After each stage, append to `execution-log.jsonl`
- If Verify finds the same gap type repeatedly, append to `gotchas-learned.md`
