---
name: Technical Discovery
description: Draft ADRs, coordinate spikes, prepare Architect Council pre-reads using the ADR pattern from engineering-toolkit:engineering-foundations applied inline
code: TD
---

# Technical Discovery

## What Success Looks Like

The technical direction is documented and ready for alignment. For new projects: an ADR with options, a decision matrix, and a council pre-read that makes the meeting worthwhile. For initiatives: architectural decisions are captured or confirmed as not needed. The engineer didn't spend hours writing documents — the AI pair-programmed through the unknowns and produced the artifact.

## Your Approach

### When to Invoke

This capability is conditional — only triggered when genuine architectural decisions exist:
- New service or significant new capability → always needed
- Initiative touching multiple services or introducing new patterns → likely needed
- Enhancement within a well-understood system → probably not needed, confirm with engineer

### ADR Authoring

Use the ADR pattern documented in `engineering-toolkit:engineering-foundations` — the source of truth for ADR shape and the 3-test gate (hard-to-reverse ∧ surprising-without-context ∧ real-trade-off). Apply it inline rather than delegating; `engineering-toolkit:ai-dlc-logical-design` is a ticket-scoped phase that expects `state.md` and `inception.md` — Discovery operates at initiative altitude, before either of those exists.

Inject org context before drafting:
- Service topology from your service catalog (if available)
- Team ownership boundaries
- Existing architectural patterns in the affected domain (from MEMORY.md)

For **new project profile**: preserve multiple options rather than converging to a single decision. Pressure-test each option against NFRs, operational cost, team familiarity, and reversibility. The output should be a multi-option ADR.

For **initiative profile**: a single converged architecture doc is fine if there's no real decision to make.

### Architect Council Pre-Read

When the ADR has multiple options and council review is needed, auto-generate:
- **Decision matrix** — options compared across consistent criteria (cost, complexity, risk, team familiarity, operational overhead)
- **Tradeoff summary** — each option's strengths and risks in plain language
- **AI pre-review findings** — issues surfaced during pressure-testing (failure modes, second-consumer probes, hostile-input gaps, scale assumptions)
- **Recommendation** — the AI's suggested direction with rationale (council can override)

Publish the pre-read where the team keeps planning artifacts. Council pre-reads typically go to Confluence (broad access for reviewers). The ADR itself is committed to the appropriate repo.

### Spike Coordination

During discovery, unknowns will surface. Default approach: pair-program with the engineer to resolve them in-session. Only create a Jira spike ticket when the investigation is substantial (requires building something, external research, multi-day effort). Spike tickets are Epic children with a single defined outcome.

### Post-Council

After council alignment, capture the decision in the ADR. If the chosen direction differs from the AI recommendation, note why — this is valuable learning for future recommendations.

## Memory Integration

Check MEMORY.md for past architectural decisions in this domain. Surface them: "The last time this team worked on messaging, you chose Kafka over SQS because of X. Still the right call here?"

## Completion / Next Steps

Discovery is done when the architectural direction is documented (or confirmed as not needed). Next step:

- ADR with options awaiting council → pause, tell the engineer the pre-read is ready and what to bring to council. Resume after alignment.
- ADR aligned (or no ADR needed) → Tech Spec [TS] if implementation detail is needed, or Epic Decomposition [ED] if enough context already exists.

## After the Session

Capture: the architectural direction taken, any domain conventions discovered, whether the council agreed with the AI recommendation (calibration data for future recommendations).
