---
name: Kickoff
description: Assess flow profile and create a Jira Epic for a new initiative
code: KO
---

# Kickoff

## What Success Looks Like

A Jira Epic exists with the right metadata, the correct flow profile is determined, and the engineer knows exactly what comes next. Quick fixes get a single ticket, not an Epic. Large initiatives have a clear plan for which artifacts are needed and where they'll live. The ceremony matches the work.

## Your Approach

### Assess Flow Profile

Determine what level of ceremony this work needs through conversation. Don't ask "is this a new project or a bug?" — ask about the work and infer:

- **New project / greenfield** signals: new service, new architectural patterns, cross-team impact, no existing codebase to work in
- **Initiative** signals: enhancement to existing system, multiple tickets, PRD exists, clear scope within a known domain
- **Small change / bug** signals: single fix, narrow scope, source might be a Slack thread or quick conversation, no Epic needed

Confirm your assessment: "This sounds like [profile] — I'd suggest [ceremony level]. Does that match your read?"

The engineer can override. The profile determines which subsequent capabilities are relevant.

### Create the Epic (or ticket)

- **Quick fix / bug**: Create a single Jira ticket (Story or Bug type). No Epic. Include a clear description and acceptance criteria. Done — skip to implementation.
- **Small initiative**: Create an Epic with a structured description. Link to PRD if one exists.
- **Medium / large initiative**: Create an Epic. Note which artifacts will be needed (ADR, Tech Spec) in the Epic description. ADRs and Tech Specs will be committed to the appropriate repo during Discovery/Tech Spec phases — don't create Confluence placeholders for them. If the team uses Confluence for PRDs, create or link the PRD page.

Before creating, search Jira for existing Epics with similar titles to avoid duplicates.

Epic description should follow this skeleton — these sections are the minimum required, seeded at Kickoff so later phases have stable anchors to read from and write into. Additional sections may be added during Decomposition as needed.

```
## Summary
Initiative summary, team, target date, PRD link (if available), complexity assessment rationale.

## Release Approach
(Rollout shape is appended here in the next step.)

## Dependencies
Other teams, services, decisions, or upstream work this Epic depends on. Empty if none known yet.

## Out of Scope
Explicitly excluded from this initiative. Empty if nothing to call out yet.

## Related
Links to related Epics, tickets, PRDs, ADRs, or docs. Empty if none.
```

All five headings must be seeded even when empty — downstream phases (Decomposition, Tech Spec) write into them and shouldn't have to create the structure.

### Capture Rollout Shape

For Epic-scoped work, ask: "How is this likely to ship?"

- **Phased release** — gradual ramp with parity gates and soak (e.g. forward-only dual-write migrations)
- **Experiment** — hypothesis-driven test with cohort, MDE, decision criteria
- **Straight launch** — flip on for everyone, no ramp
- **Unknown** — depends on Tech Discovery / Tech Spec

Record the answer in the Epic's `## Release Approach` section as a single line: `Planned rollout shape: {shape}`. This carries the kickoff driver's (typically the EM's) intent into Decomposition.

**Do not create the Release or Experiment ticket here.** Timing, parity gates, dashboards, and dependency chains come from Tech Spec / Discovery; a premature stub will need rewriting. If the answer is "unknown", note in the Epic: `Rollout shape to be determined post-discovery.`

Skip this step entirely for the quick-fix / bug branch — no Epic, no rollout question.

### Set the Path Forward

After creation, tell the engineer what comes next based on the profile:
- Quick fix → "Ready to implement. Give me the ticket key when you're ready."
- Initiative → "Next step is [Tech Spec / decomposition / discovery] depending on what context we have."
- New project → "We'll need an ADR before detailed planning. Want to start technical discovery?"

## Memory Integration

Check BOND.md for the engineer's default Jira project key and Confluence space. Check MEMORY.md for past initiatives in this domain — similar work that's been done before, patterns that recur. Reference them when relevant.

## Completion / Next Steps

Kickoff is done when the Epic (or single ticket) exists in Jira with confirmed profile. What comes next depends on the profile and information sufficiency:

- **Quick fix / bug** → Implementation [IM]. Ticket is ready.
- **Initiative** → if enough context exists, Epic Decomposition [ED]. If architectural decisions needed, Technical Discovery [TD]. If implementation detail needed, Tech Spec [TS].
- **New project** → Technical Discovery [TD] to draft the ADR.

Tell the engineer the recommended next step and why.

## After the Session

Capture: the Epic key created, the flow profile chosen and why, any domain context about the initiative that's worth remembering for future sessions.
