---
name: Implementation
description: Implement a Jira ticket — load context, delegate to the AI-DLC construct chain (construct → verify → ship-push-pr), then handle post-merge transitions
code: IM
---

# Implementation

## What Success Looks Like

The ticket is done: code written, tests passing, acceptance criteria verified, PR created and linked to the ticket, Jira status transitions handled automatically. The engineer focused on decisions and reviews — the mechanical work (context loading, TDD chain, ticket management, PR formatting) was invisible.

## Your Approach

You own the **wrap** around the implementation chain: context loading + memory surfacing on the way in, post-merge ticket transition on the way out. The chain itself — TDD in dependency waves, AC verification, branch push and PR creation — is delegated to three sibling skills: `engineering-toolkit:ai-dlc-construct`, then `engineering-toolkit:ai-dlc-verify`, then `engineering-toolkit:ship-push-pr`. You do not invoke them individually — `ai-dlc-construct`'s checkpoint chains forward; you act as the orchestrator at the boundaries.

### Step 1: Context Loading (your job — the construct chain does not do this)

Before invoking the chain, build the picture the chain's subagents cannot. `ai-dlc-construct`'s wave-1 subagents handle repo-level discovery via fresh-context reads — CLAUDE.md, conventions, file paths, patterns. You bridge the *upstream* gap: parent Epic, linked Confluence artifacts, blockers — none of which the construct chain traverses.

Load in two parallel batches to minimise latency:

**Batch 1 (parallel — independent sources):**
- Read the Jira ticket (description, acceptance criteria, labels, parent Epic key, linked issue keys)
- Read the parent Epic (broader initiative context)

**Batch 2 (parallel — depends on batch 1 results):**
- Read linked artifacts (PRD from Confluence, ADR/Tech Spec — URLs/paths extracted from ticket/Epic)
- Check blocking dependencies (linked issue statuses — keys from batch 1)

This two-batch parallel loading is a core value of the delivery lead. It eliminates the inflexible time cost — the engineer doesn't reconstruct context manually. Repo-level conventions (CLAUDE.md, build/test commands, file layout) are deliberately *not* pre-loaded here: fresh subagents inside the construct chain discover them per wave, and pre-loading would risk double-summarisation and drift. Works the same in single-repo and workspace modes.

### Step 2: Delegate to ai-dlc-construct

Invoke `engineering-toolkit:ai-dlc-construct` with the ticket identifier. Before invoking, ensure the four prerequisite artifacts exist under `docs/<identifier>/`: `state.md`, `prd-plans/inception.md`, `prd-plans/specs.md`, `prd-plans/flows.md`. If they don't, the engineer is calling implementation without having run the prior phases — pause and recommend running the upstream phases first (Inception via `engineering-toolkit:ai-dlc-inception`, Logical Design via `engineering-toolkit:ai-dlc-logical-design`). Pass the **context brief** assembled in Step 1 — ticket summary, ACs, parent Epic, PRD/ADR/Tech Spec excerpts, blocker status, memory hits — into the construct skill's invocation context so its wave subagents see it. For the chain definition (Wave Gate, constraint extraction, TDD waves, traceability matrix updates), see `engineering-toolkit:ai-dlc-construct`. That skill is the source of truth — do not restate its steps here, they evolve.

> **Honest disclosure:** delivery-lead's 4-artifact prereq check (`state.md` + `inception.md` + `specs.md` + `flows.md`) is **stricter than `ai-dlc-construct`'s documented Inputs**. `ai-dlc-construct`'s SKILL.md Inputs line lists only `state.md`, `specs.md`, `flows.md`, and an optional `domain-model.md` — `inception.md` is not declared, even though the construct DoD references ACs that are defined there. `ai-dlc-construct` itself technically tolerates a missing `inception.md` but the resulting traceability matrix will be empty. delivery-lead requires `inception.md` because the ACs it defines are what the construct chain delivers against; the stricter check fails fast with a more helpful error.
>
> **Acknowledgement:** `ai-dlc-construct`'s internal flow includes user checkpoints — constraints review (engineer challenges entries in `constraints.md` before TDD starts), wave plan approval (engineer approves the dependency-wave structure before any code is written), and post-Green commits (after each wave passes Green). delivery-lead does not gate or wrap these; they happen in-line within the construct invocation, and the engineer interacts with `ai-dlc-construct` directly through them. delivery-lead resumes control once `ai-dlc-construct` returns its final structured status.

### Step 3: Delegate to ai-dlc-verify via Task dispatch

After construct returns successfully, invoke `engineering-toolkit:ai-dlc-verify` to confirm every AC is met against an actual test run, validate NFR compliance, and write `review-feedback.md`. If Verify returns BLOCKER findings, surface them to the engineer and pause — do not proceed to ship-push-pr until Verify is clean or BLOCKERs are logged as follow-up tickets.

> **Dispatch directive:** `ai-dlc-verify` mandates **Task-tool dispatch on direct invocation** — see its `## Invocation Mode` block (`plugins/engineering-toolkit/skills/ai-dlc-verify/SKILL.md` lines 10-17). delivery-lead invokes `ai-dlc-verify` via the **Task tool, NOT the Skill tool**. The fresh subagent is the load-bearing isolation primitive that gives Verify its bias-prevention property; the whole reason `ai-dlc-verify` runs in a fresh subagent is to be context-isolated from the Constructor that just ran in Step 2. Calling it inline (via the Skill tool) from inside `implementation.md`'s Step 3 — which runs in the same context as Step 2's `ai-dlc-construct` invocation — defeats the design. Use the Task tool with `subagent_type='general-purpose'`, pass the TICKET-ID, and let `ai-dlc-verify`'s own dispatch logic handle the rest.

### Step 4: Seed stage-gate.md + delegate to ship-push-pr

Once Verify is clean, prepare for `engineering-toolkit:ship-push-pr` by seeding the stage-gate marker, then invoke the skill to push the branch and open a draft PR.

> **Stage-gate seeding:** `engineering-toolkit:ship-push-pr` is structurally **a stage of the `ship-n-check` pipeline** and its Gate Check reads `docs/<identifier>/stage-gate.md`, verifying the "Simplify" entry is checked before proceeding. Its Gate Write marks "Push & PR" with the PR number. Both presuppose `stage-gate.md` exists and earlier ship-n-check stages (ship-branch → ship-quality) have already written into it. delivery-lead's construct chain jumps from `ai-dlc-construct` (which creates the branch + commits) straight to `ship-push-pr`, skipping the ship-n-check stages that seed `stage-gate.md` — so `implementation.md` synthesises the minimal state ship-push-pr expects. This is delivery-lead's synthesis of upstream ship-n-check state that `ai-dlc-construct` does not natively produce; the long-term fix would be for `ai-dlc-construct` to emit a stage-gate-shaped marker itself.
>
> **Before invoking `ship-push-pr`**, delivery-lead writes a minimal `docs/<identifier>/stage-gate.md` using the Write tool. The file format follows `ship-n-check/reference/shared.md#gate-format`. The seeded file contains only the rows ship-push-pr's Gate Check requires to proceed (Branch & Commit + Local Quality + Simplify checked off, since the construct chain has effectively performed those activities — `ai-dlc-construct` created the branch and committed wave-by-wave, ran lint/type-check/tests as part of its DoD, and `ai-dlc-verify` performed the simplify-equivalent review). The "Push & PR" row is left unchecked so `ship-push-pr`'s Gate Write can mark it complete.
>
> **Seeded file format** (Write to `docs/<identifier>/stage-gate.md`):
>
> ```markdown
> # Stage Gate — <identifier>
>
> - [x] **Branch & Commit** — created and committed by ai-dlc-construct at <timestamp>
> - [x] **Local Quality** — lint/types/tests green per ai-dlc-construct DoD at <timestamp>
> - [x] **Simplify** — reviewed by ai-dlc-verify at <timestamp>
> - [ ] **Push & PR** — pending ship-push-pr
> ```
>
> Use a real ISO-8601 timestamp captured at seed time. The `<identifier>` is the ticket ID delivery-lead is processing. The branch name (already on the local repo via `ai-dlc-construct`) does not need to appear in `stage-gate.md`; ship-push-pr discovers it from `git rev-parse --abbrev-ref HEAD`.
>
> **Then invoke `engineering-toolkit:ship-push-pr`.** It will: (1) read `stage-gate.md`, verify "Simplify" is checked (pass), (2) write the durable `docs/<identifier>/pr-body.md`, (3) pause for explicit user approval before pushing, (4) `git push -u origin <branch>` + `gh pr create --draft --body-file pr-body.md`, (5) Gate Write — check off "Push & PR" with PR number. Return the PR URL to the engineer.

### Step 5: Post-merge

When the engineer tells you the PR has been merged, transition the Jira ticket to Done via `transitionJiraIssue`. The construct chain does not handle the post-merge transition — the delivery-lead doesn't run in the background and only fires on the engineer's prompt.

### Commit Convention

Defer to the repo's commit conventions — typically the repo's CLAUDE.md, husky pre-commit hook, or commit-lint config. The short version: **Conventional Commits** with the ticket key embedded in the description.

**Format:** `<type>[(scope)][!]: [TICKET-KEY] <description>`

Examples:
- `feat: [TUP-42] add vector search endpoint`
- `fix(auth): [AND-239] correct Braze campaign tracking payload`
- `fix: [TUP-42] address code review feedback`

Rules:
- **Same ticket key** on every commit in the branch — implementation, review fixes, all of them.
- **Queryable:** `git log --oneline --grep="\[TICKET-KEY\]"` must return all commits for that ticket (brackets need escaping because grep uses regex).
- PR title follows the same shape: `<type>[(scope)]: [TICKET-KEY] <description>`.

`ai-dlc-construct`'s wave subagents pick this convention up via the project's commit conventions — you don't need to re-state it in the context brief.

### Tool Resilience

The question is always "do I have enough information to begin?" — not "are all my tools available?"

- **Atlassian MCP unavailable**: ask the engineer to paste the ticket description, acceptance criteria, and any relevant links. Build the brief from that and invoke the construct chain. If the chain can't reach Jira for post-merge transitions either, surface a clear failure — relay it.
- **Construct chain skill not installed**: if one of `ai-dlc-construct`, `ai-dlc-verify`, or `ship-push-pr` is missing, the engineering-toolkit plugin is incompletely installed. Surface the gap to the engineer with the missing skill name; do not fall back silently.
- **Artifacts unavailable** (Confluence down, repo not cloned, etc.): ask the engineer for the PRD/Tech Spec content directly, or work from what's in the Jira ticket description.

Never block on a tool. Adapt and inform.

### Course Correction

If during implementation the engineer discovers the ticket spec is wrong, the approach won't work, or scope has changed significantly — invoke Course Correction [CC] to evaluate impact across the Epic. For single-ticket adjustments that don't affect other tickets, update the ticket directly and add a traceability comment.

Note: `ai-dlc-construct` builds its dependency-wave plan from `specs.md` + Inception ACs at the start. If scope shifts mid-construct, the right move is to abort the construct invocation, run [CC] to update the upstream artifacts (Inception + Logical Design as needed), then re-invoke `ai-dlc-construct` with the revised specs.

## Completion / Next Steps

Implementation of a ticket is done when: code is written, tests pass, PR is created, ticket is in In Review. Next step:

- More tickets in the Epic → pick up the next unblocked ticket.
- All tickets done → the Epic is complete. Tell the engineer.
- If the engineer says the PR was merged → transition ticket to Done.

## After the Session

Capture in the session log:
- Which ticket was implemented and the outcome
- Any domain knowledge gained (service patterns, conventions, architecture insights)
- What worked and what didn't (was the ticket spec sufficient? Did the TDD flow produce good results?)
- Any course corrections or spec gaps that emerged
