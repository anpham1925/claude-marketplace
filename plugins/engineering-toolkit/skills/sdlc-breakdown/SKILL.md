---
name: sdlc-breakdown
description: "Split a large plan into independent deployable sub-tasks with Jira tickets. Use when a ticket is too large for a single PR — triggers on 'break this down', 'split this ticket', 'decompose', 'too big for one PR'. Also invoked by AI-DLC when the Plan phase detects high complexity (3+ modules, 5+ files, 4+ independent ACs)."
argument-hint: '[TICKET-ID]'
model: haiku
---

## Dispatcher: Decomposer

This skill is a thin dispatcher. The actual decomposition work runs inside a `general-purpose` Task subagent so the breakdown transcript (file reads, Jira API calls, plan analysis) does not accumulate in the parent context.

**DO NOT execute the steps below inline.** Spawn a Task subagent with the prompt template in [Subagent Dispatch](#subagent-dispatch). The subagent returns ONLY the structured summary; the parent surfaces the user-approval checkpoint and Jira-creation step.

**Inputs**: Plan Summary (specs.md + flows.md) from Design — paths passed to subagent
**Outputs returned to parent**: Breakdown Plan markdown + proposed sub-task list (no Jira side effects yet)

## When to Trigger

This stage is optional. After Plan Summary is complete, evaluate the plan:

| Signal | Threshold | Reasoning |
|--------|-----------|-----------|
| Modules touched | 3+ | Cross-module changes are risky to deploy together |
| File changes | 5+ new/modified | Large diffs are hard to review |
| Acceptance criteria | 4+ independent ACs | Independent ACs can ship independently |
| Estimated diff size | >400 lines | PRs above this are tedious to review |

If any threshold is met, **offer the breakdown to the user** before dispatching the subagent. If none are met, skip to Implement.

## Subagent Dispatch

Spawn a single `general-purpose` Task subagent. The subagent does the file reads, plan analysis, and breakdown drafting; it must NOT create Jira tickets — that step happens in the parent after user approval.

```
Task(
  subagent_type="general-purpose",
  description="sdlc-breakdown analysis",
  prompt="""
You are the Decomposer subagent for ticket <TICKET-ID>.

Mission: produce a Breakdown Plan that splits a large plan into independent, deployable sub-tasks. Do NOT create Jira tickets — the parent handles that after user approval.

### Steps

1. **Check State** — Read `docs/<identifier>/state.md` if it exists. Identify whether design has completed and Plan Summary exists. Otherwise analyze the current diff and ticket to determine scope.

2. **Analyze the Plan Summary** — Read `docs/<identifier>/prd-plans/specs.md` and `flows.md`:
   - Identify natural seams — modules, features, layers
   - Check which acceptance criteria are independent (can be deployed without others)
   - Check which file changes are self-contained

3. **Design the Split** — Each sub-task must be:
   - Independently deployable — deploying sub-task 1 without sub-task 2 must not break the system
   - Self-contained for review — a reviewer can understand the PR without context from other sub-tasks
   - Testable alone — has its own acceptance criteria and tests
   Prefer splitting by feature/AC rather than by layer.

4. **Produce Breakdown Plan** in this exact markdown shape:

   ## Breakdown Plan

   **Parent ticket**: {TICKET-ID}
   **Reason for breakdown**: {why}

   | # | Sub-task title | ACs covered | Files | Depends on | Est. PR size | Parallel? |
   |---|----------------|-------------|-------|------------|--------------|-----------|
   | 1 | {title}        | AC 1, 2     | 3     | —          | ~150 lines   | Yes       |

   ### Sub-task Details

   #### Sub-task 1: {title}
   - **Acceptance criteria**: {subset from parent}
   - **Files**: {list of files}
   - **Dependencies**: None
   - **Notes**: {implementation hints}

5. **Verify coverage** — every parent AC appears in exactly one sub-task. No circular dependencies. Aim for 2-4 sub-tasks.

### Quality Bar

- Each sub-task has a clear, standalone purpose (not "part 1 of 3")
- No sub-task is so small it's trivial (avoid single-file PRs unless justified)
- Dependencies between sub-tasks are minimized (ideally zero)
- Implementation order is clear — parallelizable sub-tasks are marked

### Anti-patterns to reject

- Splitting by layer ("all models", "all services") — unreviewable in isolation
- 6+ sub-tasks — not worth the overhead
- Circular dependencies — collapse into one sub-task
- Losing ACs — every parent AC must appear in exactly one sub-task

### Hard rules

- DO NOT call createJiraIssue, createIssueLink, or post comments
- DO NOT write `docs/<identifier>/prd-plans/breakdown.md` — return the markdown to parent
- DO NOT update `docs/<identifier>/state.md`

### Return ONLY this structured summary (no transcript, no file dumps)

- Status: READY | NEEDS_USER_INPUT | INSUFFICIENT_INPUT
- Identifier: <docs/ subdirectory used>
- Sub-task count: <N>
- Parallel sub-tasks: <#s>
- AC coverage verified: yes/no
- Breakdown Plan markdown: <full markdown block from step 4>
- Open questions (if any): <one line each>
"""
)
```

## After Subagent Returns

1. **Present the Breakdown Plan markdown** to the user verbatim. Do not summarize or rephrase — the user approves the exact text.
2. **CHECKPOINT** — wait for explicit user approval before any Jira side effects.
3. **Create Jira Sub-tasks** (parent does this directly, after approval):
   - For each sub-task, call `createJiraIssue` with:
     - Summary: `[Sub-task N] {title}`
     - Description: AC subset + files affected + dependencies
     - Parent or link to main ticket
   - Call `createIssueLink` to link each sub-task to the parent
   - Post a summary comment on the parent ticket listing all sub-tasks with links
4. **Save Artifact** — write the approved Breakdown Plan to `docs/<identifier>/prd-plans/breakdown.md`.
5. **Update State** — update `docs/<identifier>/state.md` with breakdown decision and sub-task ticket IDs.

### Pipeline Stops Here

Each sub-task gets its own AI-DLC cycle (`/engineering-toolkit:ai-dlc <sub-task-ticket>`).

## Rules

- **ALWAYS** dispatch the breakdown analysis to a Task subagent — never run the file reads and plan analysis inline (loads the entire Plan Summary into the parent context)
- **NEVER** let the subagent create Jira tickets, write breakdown.md, or update state.md — those are parent responsibilities gated on user approval
- **NEVER** create sub-tasks without user approval at the checkpoint
- **ALWAYS** verify all parent ACs are covered across sub-tasks
- **ALWAYS** post a summary comment on the parent Jira ticket
- **ALWAYS** update `docs/<identifier>/state.md` after Jira creation
- If the user declines breakdown, skip to Implement — don't push back
