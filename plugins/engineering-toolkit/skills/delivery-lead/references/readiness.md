---
name: Readiness Check
description: Go/no-go gate before implementation — validate artifacts are aligned, tickets scoped, dependencies mapped
code: RC
---

# Readiness Check

## What Success Looks Like

A clear Go or No-Go recommendation backed by evidence. If Go: the team proceeds with confidence. If No-Go: the specific gaps are identified with clear actions to resolve them. The report is shareable — an HTML document the tech lead can send to the team or paste into a Slack thread.

## Your Approach

### What to Check

Walk these dimensions one-by-one against Jira/Confluence artifacts — this is the gate; there is no skill to delegate to:

- **PRD ↔ Tickets alignment** — do the tickets collectively cover what the PRD requires?
- **Tech Spec ↔ Tickets alignment** — does every Tech Spec section have at least one ticket? Are acceptance criteria traceable?
- **Dependencies mapped** — are Jira issue links in place? Are there circular dependencies?
- **Repos identified** — does every ticket have a `repo:` label?
- **No orphaned tickets** — every ticket links back to the Epic and references relevant artifacts

### Produce HTML Report

Generate a structured HTML report with:
- Initiative summary (Epic key, title, team, artifact links)
- Dimension-by-dimension pass/fail with evidence
- Gap list (if any) with suggested remediation
- Overall recommendation: **Go** / **Go with caveats** / **No-Go**

Write the report to both locations:
- `~/.claude/output/delivery-lead/readiness-{EPIC-KEY}-{date}.html` (persistent copy)
- `{project-root}/_delivery-lead-output/readiness-{EPIC-KEY}-{date}.html` (project-local for sharing)

Ensure `_delivery-lead-output/` is in the repo's `.gitignore` to avoid accidental commits.

### Recommendation Criteria

- **Go**: all dimensions pass, no gaps
- **Go with caveats**: all tickets present but minor alignment issues (e.g., one ticket has vague ACs, non-blocking dependency question)
- **No-Go**: missing tickets, unlinked artifacts, unmapped dependencies, or fundamental spec gaps

## Memory Integration

Check MEMORY.md for past readiness check results — recurring gap types, common issues for this team. Surface patterns: "Last three readiness checks in this domain had missing monitoring requirements — let me check that first."

## Completion / Next Steps

Readiness Check is done when the report is generated. Next step:

- **Go** → Implementation [IM]. Pick up the first ticket.
- **Go with caveats** → Implementation [IM], but flag the caveats at the start of each affected ticket.
- **No-Go** → route back to the source of the gap. Missing spec detail → Tech Spec [TS]. Missing tickets → Decomposition [ED]. Fundamental misalignment → Discovery [TD] or Kickoff [KO].

## After the Session

Capture: the recommendation, any recurring gap patterns, whether the check surfaced something that should have been caught earlier in the flow.
