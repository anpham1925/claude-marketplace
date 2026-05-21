---
name: Epic Decomposition
description: Break an initiative Epic into scoped Jira tickets referencing Tech Spec sections
code: ED
---

# Epic Decomposition

## What Success Looks Like

The Epic has child tickets, each scoped to a single repo, with acceptance criteria and links to the relevant Tech Spec sections. No per-ticket spec files committed to repos — the Jira ticket IS the spec. Dependencies between tickets are mapped as Jira issue links. An engineer picking up any ticket has everything they need to start implementing.

## Your Approach

### Gather Context

Load the Epic, its PRD (Confluence or wherever the team keeps it), ADR and Tech Spec (from repo if they exist). Understand the full scope before decomposing.

### Decompose

`engineering-toolkit:sdlc-breakdown` is a dispatcher skill that reads a Plan Summary (`specs.md` + `flows.md`) and returns a Breakdown Plan with sub-task scoping. Its input shape is a phase artifact, not a Tech Spec committed in a repo — so before delegating, stage a minimal Plan Summary the dispatcher can consume:

1. Create `docs/initiative-{EPIC-KEY}/prd-plans/specs.md` containing: the Tech Spec link/path, AC list extracted from the Epic, file plan (which repos/modules each ticket will touch), and any constraints worth flagging.
2. Create `docs/initiative-{EPIC-KEY}/prd-plans/flows.md` with a one-paragraph description of the dataflow / sequence (or a Mermaid diagram if it materially helps).
3. Invoke `engineering-toolkit:sdlc-breakdown` with the initiative identifier. The dispatcher will spawn its subagent to produce the Breakdown Plan markdown — it returns the structured sub-task table to you; it does NOT create Jira tickets.
4. **After approval and Jira ticket creation**, write `docs/initiative-{EPIC-KEY}/prd-plans/breakdown.md` with the approved Breakdown Plan (matches `sdlc-breakdown`'s "After Subagent Returns" step 4 — the dispatcher hard-rules its subagent against writing this file, so delivery-lead writes it post-approval).
5. **Update `docs/initiative-{EPIC-KEY}/state.md`** to record the sub-task ticket IDs and breakdown decision (matches `sdlc-breakdown`'s "After Subagent Returns" step 5).

Inject context the dispatcher cannot infer:
- The committed Tech Spec (link, not inlined content)
- Repo inventory (which repos exist, what each contains)
- Team context from BOND.md (what repos this team owns)

**Trigger thresholds**: Epic-altitude work almost always clears `sdlc-breakdown`'s built-in trigger thresholds (3+ modules, 5+ files, 4+ independent ACs, >400 lines of diff — see `sdlc-breakdown` SKILL.md "When to Trigger"). For an ambiguous case — a small Epic with a single-PR story — let `sdlc-breakdown`'s threshold gate decide whether to run; delivery-lead does not add an additional pre-gate at this altitude.

The "Create Tickets in Jira" subsection below is delivery-lead's responsibility — sdlc-breakdown explicitly does NOT create Jira tickets.

### Create Tickets in Jira

#### Release/Experiment Ticket First

Read the Epic's `## Release Approach` section for the rollout shape captured at Kickoff. Create the rollout-tracking ticket as the **first** decomposition artifact, before any implementation tickets:

- **Phased release** → `Release` issue type. Include pre-conditions, ramp schedule with hold windows, hard-block parity conditions, rollback procedure, soak window, monitoring dashboards.
- **Experiment** → `Experiment` issue type. Include hypothesis, cohort definition, MDE, success/failure criteria, decision date.
- **Straight launch** → `Release` issue type, minimal — flip date, smoke-test conditions, rollback step.
- **None** → skip.
- **Unknown** → halt decomposition. Take the rollout-shape question back to the kickoff driver before continuing.

Wire every implementation ticket created below this with a `blocks` link to the rollout ticket so the dependency graph reads correctly.

#### Implementation Tickets

For each decomposed ticket:
- **Type**: Story or Task (not Sub-task — keep them as Epic children)
- **Description**: acceptance criteria (Given/When/Then), links to Tech Spec sections, affected files/modules, test approach
- **Labels**: `repo:{repo-name}` to indicate target repo
- **Epic Link**: parent Epic
- **Dependencies**: add Jira issue links (blocks/is-blocked-by) between tickets that have ordering requirements

Present the full ticket list to the engineer for review BEFORE creating in Jira. The engineer must confirm the decomposition — no auto-creation without approval.

Create tickets sequentially (not parallel — the Atlassian MCP has known issues with parallel creates).

### No Spec Files in Repos

Ticket descriptions contain everything. They LINK to source artifacts (PRD in Confluence, ADR/Tech Spec in repo) — never duplicate content into per-ticket markdown files. This was an explicit design decision: a single source of truth in Jira prevents drift.

## Memory Integration

Check MEMORY.md for past decomposition patterns — how this team typically scopes tickets, what granularity works, patterns that recur.

## Completion / Next Steps

Decomposition is done when all tickets are created in Jira with dependencies mapped. Next step:

- For medium/large initiatives → Readiness Check [RC] before implementation.
- For small initiatives with few tickets → Implementation [IM] directly if the engineer is confident.

## After the Session

Capture: how many tickets were created, any decomposition patterns worth remembering, whether the engineer adjusted the AI's decomposition significantly (calibration data).
