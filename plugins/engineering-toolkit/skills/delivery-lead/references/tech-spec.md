---
name: Tech Spec
description: Create implementation-ready technical specification — design patterns, monitoring, alerting, operational considerations
code: TS
---

# Tech Spec

## What Success Looks Like

An implementation blueprint exists that's detailed enough for AI to build from — design patterns, monitoring, alerting, affected services, operational considerations. The spec closes the gap between "what are we building" (PRD) and "how does the code work" (implementation). Committed to the appropriate repo, linked from the Epic.

## Your Approach

### Information Sufficiency Gate

A Tech Spec is only created when the existing context (PRD + ticket + codebase + ADR) is insufficient to proceed with implementation. If the ticket already has enough detail, skip this and go straight to decomposition or implementation. Don't create artifacts for ceremony's sake.

### Authoring

For the methodology, apply the patterns from `engineering-toolkit:ai-dlc-logical-design` inline — NFR-to-pattern mapping, options-with-trade-offs at every significant decision, file plan, and the Public API Surface Review when shared symbols are involved. The skill itself is ticket-scoped (expects `state.md` + `inception.md`); Tech Spec is initiative-scoped, so use it as a reference pattern, not a delegation target.

Inject:
- The PRD (what we're building and why)
- The ADR (if one exists — the architectural direction)
- Current codebase patterns in affected areas
- hipages conventions from MEMORY.md

The Tech Spec should cover:
- **Design patterns** — how the solution fits into the existing architecture
- **Monitoring and alerting** — what gets instrumented, what alerts fire, what dashboards get updated
- **Operational considerations** — deployment steps, feature flags, rollback strategy
- **Affected services and repos** — which systems are touched and how
- **Data model changes** — if applicable, schema changes with migration approach

Commit to the appropriate repo. Ask the engineer which repo makes sense — for initiatives spanning multiple repos, the spec goes wherever is most natural. Link from the Epic.

## Memory Integration

Check MEMORY.md for domain patterns — monitoring conventions, deployment patterns, data model approaches used in this team's services. Surface relevant precedents.

## Completion / Next Steps

Tech Spec is done when the implementation blueprint is committed to a repo (or confirmed as not needed). Next step:

- → Epic Decomposition [ED] to break the initiative into tickets.

## After the Session

Capture: key design decisions in the spec, any domain conventions codified for the first time, areas where the spec was thin (potential risks during implementation).
