---
name: Course Correction
description: Ingest new context mid-cycle, diff against plan, update Jira tickets with traceability
code: CC
---

# Course Correction

## What Success Looks Like

New information has arrived — a meeting transcript, design review feedback, a spike outcome, a stakeholder pivot — and the Jira tickets now reflect reality. Every change has a traceability comment explaining what changed, why, and where the trigger came from. Engineers picking up tickets in new sessions see the current plan without needing tribal knowledge. The Tech Spec is updated if the architecture shifted.

## Your Approach

### Accept Input

The engineer provides the change trigger in whatever form they have:
- Meeting transcript (pasted or file path)
- Verbal description of what changed
- Confluence link (design review, spike outcome, decision record)
- Jira ticket (spike with findings, bug that changes scope)
- File from the repo (updated spec, new constraints)

Don't force a format. Extract what you need from what you're given.

### Distill Change Trigger

Before touching anything, extract and confirm:

1. **What changed** — the specific new information, decision, or constraint
2. **Source** — where this came from (meeting, person, document) and when
3. **Confidence** — is this a confirmed decision or a signal that needs validation?

Present this summary to the engineer: "Here's what I'm reading from this — [summary]. Is that right, and should I proceed to evaluate impact?"

Wait for confirmation before proceeding. If the trigger is ambiguous, ask clarifying questions.

### Load Current Plan

Fetch the current state in two parallel batches:

**Batch 1 (parallel — independent sources):**
- All Epic children via JQL: `parent = {EPIC_KEY} ORDER BY rank ASC`
- The Epic itself (description, status, labels)
- The Tech Spec from the repo (path from Epic description or MEMORY.md)

**Batch 2 (parallel — depends on batch 1 for links):**
- PRD from Confluence (if linked from Epic)
- Any linked issues outside the Epic (cross-team dependencies)
- Current sprint board state (which tickets are in progress or in review)

### Produce Change Report

Create a table of proposed Jira operations:

```
| # | Ticket       | Status     | Operation   | What Changes              | Rationale                    | Flag |
|---|-------------|------------|-------------|---------------------------|------------------------------|------|
| 1 | TUP-42      | To Do      | Modify      | Update AC to reflect X    | Spike found Y doesn't work   |      |
| 2 | TUP-45      | In Progress| Re-scope    | Remove Z, add W           | Design review dropped Z      | ⚠️   |
| 3 | —           | —          | Create      | New ticket for migration  | New dependency discovered     |      |
| 4 | TUP-48      | To Do      | Close       | No longer needed          | Approach changed per meeting  |      |
```

**Flags:**
- ⚠️ **In Progress** — ticket has active work. Engineer must individually confirm changes.
- ⚠️ **In Review** — PR exists. Changes may require rework. Engineer must individually confirm.
- 🔗 **Cross-Epic** — affects tickets outside this Epic. Highlight the blast radius.

For each operation, state the rationale clearly — connect it back to the change trigger.

### Engineer Approval

Present the Change Report. Wait for approval before executing.

- The engineer can approve all, reject all, or approve selectively.
- Flagged tickets (in-progress, in-review) require individual confirmation: "TUP-45 is in progress — the proposed change is [X]. Approve this specific change?"
- If the engineer modifies any proposed operation, update the report before executing.

### Execute Changes

Execute Jira operations sequentially (Atlassian MCP doesn't handle parallel writes well):

**For each modified ticket:**
1. Edit the ticket (description, acceptance criteria, labels, etc.)
2. Add a traceability comment:
   ```
   📋 Course Correction — {DATE}

   **What changed:** {specific change to this ticket}
   **Why:** {rationale connecting to the trigger}
   **Source:** {where the new information came from}
   **Change Report:** {link to Epic or reference to the full correction}
   ```

**For new tickets:**
1. Create the ticket as an Epic child with full description and acceptance criteria
2. Add dependency links to other tickets
3. Add traceability comment noting it was created as part of course correction

**For closed tickets:**
1. Add traceability comment explaining why it's being closed
2. Transition to Done (or Cancelled if the workflow supports it)
3. If the ticket has a PR in progress, flag this explicitly — don't close silently

**For re-ordered/re-prioritised tickets:**
1. Update the rank or sprint assignment
2. Add traceability comment noting the priority change and why

### Tech Spec Update

If the course correction involves an architectural change (new component, changed data flow, dropped feature, new integration):

1. Draft the Tech Spec update — show the diff to the engineer
2. Wait for approval before committing
3. Update any ticket descriptions that reference the changed Tech Spec sections

If the change is purely scope/priority (not architectural), skip this step.

### Tool Resilience

- **Atlassian MCP unavailable**: produce the Change Report as a document the engineer can execute manually. List exact field changes per ticket.
- **Tech Spec not in repo**: note which sections would need updating and where. The engineer handles the edit.
- **Partial failure during execution**: report which operations succeeded and which failed. Don't roll back successful operations — they're individually correct.

Never block on a tool. Adapt and inform.

## Memory Integration

Check BOND.md for the engineer's team context and repos. Check MEMORY.md for past course corrections in this Epic — patterns of change, recurring sources of scope shift. If this is the second or third correction for the same Epic, note the pattern to the engineer.

## Completion / Next Steps

Course correction is done when all approved Jira operations are executed and traceability comments are in place. Next step depends on what changed:

- **Scope added** → new tickets may need Implementation [IM]
- **Scope removed** → fewer tickets, possibly ready for Readiness Check [RC] if near completion
- **Architecture changed** → Tech Spec updated, possibly re-decompose affected tickets via Epic Decomposition [ED]
- **Priority shifted** → tickets re-ordered, engineer picks up the new top-priority ticket

Tell the engineer what the correction means for their immediate next action.

## After the Session

Capture in the session log:
- What triggered the correction and the source
- Which tickets were affected and how
- Whether the Tech Spec was updated
- Any patterns worth noting (e.g., "this Epic has had 3 corrections — scope may not be well understood")
