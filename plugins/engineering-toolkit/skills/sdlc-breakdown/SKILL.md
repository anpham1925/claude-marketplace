---
name: sdlc-breakdown
description: "Split a large plan into independent deployable sub-tasks with Jira tickets. Use when a ticket is too large for a single PR — triggers on 'break this down', 'split this ticket', 'decompose', 'too big for one PR'. Also invoked by AI-DLC when the Plan phase detects high complexity (3+ modules, 5+ files, 4+ independent ACs)."
argument-hint: '[TICKET-ID]'
model: sonnet
---

## Agent: Decomposer

**Mission**: Split a large plan into independent, deployable sub-tasks and create them in Jira.

**Inputs**: Plan Summary (specs.md + flows.md) from Design
**Outputs**: Breakdown Plan artifact + Jira sub-tasks linked to parent
**Subagent type**: `general-purpose`

## When to Trigger

This stage is optional. After Plan Summary is complete, evaluate the plan:

| Signal | Threshold | Reasoning |
|--------|-----------|-----------|
| Modules touched | 3+ | Cross-module changes are risky to deploy together |
| File changes | 5+ new/modified | Large diffs are hard to review |
| Acceptance criteria | 4+ independent ACs | Independent ACs can ship independently |
| Estimated diff size | >400 lines | PRs above this are tedious to review |

If any threshold is met, **offer the breakdown to the user**. If none are met, skip to Implement.

## Steps

### Check State

Read `docs/<identifier>/state.md` if it exists. If a design phase has completed and Plan Summary exists, use those as input. Otherwise, analyze the current diff and ticket to determine the scope.

### Analyze the Plan Summary

Read `docs/<identifier>/prd-plans/specs.md` and `flows.md`:
- Identify natural seams — modules, features, layers
- Check which acceptance criteria are independent (can be deployed without others)
- Check which file changes are self-contained

### Design the Split

Each sub-task must be:
- **Independently deployable** — deploying sub-task 1 without sub-task 2 must not break the system
- **Self-contained for review** — a reviewer can understand the PR without context from other sub-tasks
- **Testable alone** — has its own acceptance criteria and tests

Prefer splitting by feature/AC rather than by layer (avoid "all models in one PR, all controllers in another").

### Produce Breakdown Plan

```markdown
## Breakdown Plan

**Parent ticket**: {TICKET-ID}
**Reason for breakdown**: {why — e.g., "4 modules, 12 files, 6 independent ACs"}

| # | Sub-task title | ACs covered | Files | Depends on | Est. PR size | Parallel? |
|---|----------------|-------------|-------|------------|--------------|-----------|
| 1 | {title}        | AC 1, 2     | 3     | —          | ~150 lines   | Yes       |
| 2 | {title}        | AC 3        | 2     | —          | ~100 lines   | Yes       |
| 3 | {title}        | AC 4, 5     | 4     | #1         | ~200 lines   | After #1  |

### Sub-task Details

#### Sub-task 1: {title}
- **Acceptance criteria**: {subset from parent}
- **Files**: {list of files}
- **Dependencies**: None
- **Notes**: {implementation hints}

(repeat for each sub-task)
```

### CHECKPOINT

Present breakdown plan to user for approval.

### Create Jira Sub-tasks (after approval)

For each sub-task:
- `createJiraIssue` with:
  - Summary: `[Sub-task N] {title}`
  - Description: acceptance criteria subset + files affected + dependencies
  - Parent or link to main ticket
- `createIssueLink` to link sub-tasks to the parent ticket

Post a summary comment on the parent ticket listing all sub-tasks with links.

### Save Artifact

Write to `docs/<identifier>/prd-plans/breakdown.md`.

### Update State

Update `docs/<identifier>/state.md` with breakdown decision and sub-task ticket IDs.

### Pipeline Stops Here

Each sub-task gets its own AI-DLC cycle (`/engineering-toolkit:ai-dlc <sub-task-ticket>`).

## What Good Breakdown Looks Like

- Each sub-task has a clear, standalone purpose (not "part 1 of 3")
- No sub-task is so small it's trivial (avoid single-file PRs unless justified)
- Dependencies between sub-tasks are minimized (ideally zero)
- Implementation order is clear — parallelizable sub-tasks are marked
- The parent ticket's ACs are fully covered across all sub-tasks (nothing lost)

## Anti-patterns

- **Splitting by layer** — "all models", "all services", "all controllers" as separate PRs. Each PR is unreviewable in isolation.
- **Too many sub-tasks** — 6+ sub-tasks isn't worth the overhead. Aim for 2-4.
- **Circular dependencies** — if A needs B and B needs A, they should be one sub-task.
- **Losing acceptance criteria** — every AC from the parent must appear in exactly one sub-task.

## Rules

- **NEVER** create sub-tasks without user approval at the checkpoint
- **ALWAYS** verify all parent ACs are covered across sub-tasks
- **ALWAYS** post a summary comment on the parent Jira ticket
- **ALWAYS** update `docs/<identifier>/state.md`
- If the user declines breakdown, skip to Implement — don't push back
