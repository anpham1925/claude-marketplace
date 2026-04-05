---
name: ai-dlc-inception
description: "Internal phase of the ai-dlc pipeline — extracts structured requirements, NFRs, risks, measurement criteria, and code elevation for brown-field. Invoke directly only via /basic-engineering:ai-dlc-inception when explicitly requested by name. For general requests like 'analyze this ticket', use basic-engineering:ai-dlc which routes here automatically."
argument-hint: '<TICKET-ID>'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for requirements analysis, NFR extraction, and risk assessment.

## Agent: Inceptor

**Mission**: Understand the intent and produce a comprehensive Inception Artifact covering requirements, NFRs, risks, measurement criteria, and code elevation (for brown-field).

**Inputs**: Jira ticket ID + Level 1 Plan from Plan phase
**Outputs**: Inception Artifact
**Subagent type**: Use `codebase-explorer` if defined in `.claude/agents/`, otherwise `Explore`

## Why This Phase Exists

AI-DLC's Inception goes beyond traditional requirements analysis. It captures the full context needed for AI-driven development: not just what to build, but how to measure success, what could go wrong, and (for brown-field) what exists today. This is the "Mob Elaboration" ritual — AI proposes a comprehensive breakdown, human refines.

## Steps

### Check for Existing State

Read `docs/<identifier>/state.md` if it exists. If Inception is already completed, ask the user if they want to re-run. Verify Plan phase is completed. See [shared reference](../ai-dlc/reference/shared.md) for state.md format.

### Read the Level 1 Plan

Load the Level 1 Plan from state.md. Note:
- Intent type (determines whether to do code elevation)
- Complexity band (determines depth of analysis)
- Whether Inception is marked as "light" or "standard" or "with code elevation"

### Read the Jira Ticket

Use `getJiraIssue` with the ticket ID. Extract: summary, description, acceptance criteria, comments, linked issues, labels, components.

**Never infer from title alone.** Always read the full ticket.

### Route to Relevant Repos

Before exploring, identify which repositories are relevant. Read the [repo registry](../sdlc/reference/repo-registry.md) and apply routing:
- **Prefix match**: ticket's Jira project prefix → default repo set
- **Keyword match**: scan ticket for domain keywords → matching repos
- **Confirm with user**: "Based on the ticket, I'll search these repos: **[list]**. Add or remove any?"

### Research the Codebase

Launch Explore subagents **only for the confirmed repos** to find:
- Affected modules (search for related entities, handlers, controllers)
- Existing similar implementations (patterns to follow)
- Related tests (current test coverage)

For each repo, pass the subagent the absolute repo path. Parallelize across repos.

**Two sources of truth — use both:**
- **The codebase** shows *what* exists today. Code elevation reverse-engineers the current state from live source files. This is always the primary source.
- **Past `docs/*/prd-plans/`** show *why* it exists that way — domain models, ADRs, rejected alternatives, NFR targets from prior features. Scan for these in the affected area and reference them as context.

Do NOT read past `state.md` or `stage-gate.md` — those are ephemeral pipeline plumbing. But `domain-model.md`, `specs.md`, `flows.md`, and `ADR-*.md` are durable design knowledge.

### Extract Requirements (Standard — all intents)

- **Acceptance Criteria**: Make each criterion testable and specific
- **Scope boundaries**: What's in scope vs explicitly out of scope
- **Affected modules**: Specific file paths, not just module names
- **Existing patterns**: Closest implementation to use as a template
- **Open questions**: Ambiguities with proposed answers

### Extract NFRs (Standard — all intents)

Identify non-functional requirements by category:

| Category | Questions to Ask |
|----------|-----------------|
| **Performance** | Response time targets? Throughput? Concurrency? |
| **Security** | Auth requirements? Input validation? Data sensitivity? |
| **Scalability** | Expected load growth? Horizontal scaling needs? |
| **Reliability** | Uptime target? Retry/circuit-breaker needs? |
| **Compliance** | GDPR? PCI? Data residency? Audit requirements? |
| **Observability** | Logging needs? Metrics to expose? Alerting? |

For each identified NFR, assign an ID (NFR-1, NFR-2, ...) and a measurable target.

If the ticket doesn't mention NFRs explicitly, **infer from context** and present to user:
> "I noticed this touches payment data. I recommend adding NFR-1: PCI compliance for card handling. Agree?"

### Assess Risks

Identify risks by category:

| Category | What to Check |
|----------|--------------|
| **Breaking changes** | API contracts, event schemas, database schema |
| **Data migration** | Schema changes, backfill needed, rollback plan |
| **Integration** | External service dependencies, version compatibility |
| **Performance** | N+1 queries, missing indexes, unbounded queries |
| **Compliance** | Regulatory requirements, data handling rules |
| **Rollback** | Can this be reverted safely? Feature flag needed? |

For each risk, assign an ID (R-1, R-2, ...), impact, likelihood, and mitigation strategy.

### Define Measurement Criteria

How will we know this succeeded? Define:
- **Functional**: All ACs pass verification
- **Performance**: Meets NFR targets (measurable via Honeycomb)
- **Business**: KPIs or metrics that should improve
- **Operational**: No increase in error rates post-deploy

### Code Elevation (Brown-field only)

If the Level 1 Plan indicates brown-field or code elevation:

**Static Model** — Use Explore subagents to map:
- Components in the affected area (classes, modules, services)
- Their responsibilities (what each component does)
- Their relationships (dependencies, inheritance, composition)

**Dynamic Model** — Trace key flows:
- For the most significant use cases in the affected area
- Map how components interact (method calls, events, queries)
- Identify entry points and exit points

Present as:
```markdown
### Static Model
| Component | Responsibility | Dependencies |
|-----------|---------------|-------------|
| RefundService | Orchestrates refund creation | PayoutRepo, EventBus |

### Dynamic Model
#### Flow: Create Refund
Controller → Service → Repository → EventBus → Handler
```

This gives the Domain Design phase accurate context about what exists.

### Epic Decomposition (Large intents only)

If the ticket is an epic or the intent spans multiple bounded contexts:
- Decompose into independent Units (cohesive groups of user stories)
- Each Unit should be independently deployable
- Suggest Jira sub-tasks for each Unit
- Each Unit gets its own AI-DLC cycle

### Produce Inception Artifact

See [shared reference](../ai-dlc/reference/shared.md) for the full Inception Artifact format. Key sections:
- Goal, Acceptance Criteria, Scope, Affected Modules, Existing Patterns
- NFRs table
- Risk Assessment table
- Measurement Criteria
- Code Elevation (if brown-field)
- Open Questions

### Update Jira

Post inception summary as a comment (see [shared reference](../ai-dlc/reference/shared.md) for comment format).

### Update State

Update `docs/<identifier>/state.md`:
- Mark Inception as completed
- Populate NFRs table
- Populate Risk Register
- Populate Measurement Criteria
- Start Traceability Matrix (AC column)

### CHECKPOINT — AI-Initiated Recommendation

Present the Inception Artifact and proactively recommend the next phase:

> **Inception complete.**
>
> - **{N} acceptance criteria** defined
> - **{N} NFRs** identified: {brief list}
> - **{N} risks** assessed: {highest risk}
> - **Measurement**: {primary success metric}
>
> Based on the Level 1 Plan ({intent type}), I recommend proceeding to **{next phase}** to {what it will focus on, referencing specific findings}.
>
> Shall I proceed?

## What Good Inception Looks Like

- Every AC is testable (can write a verification for it)
- Affected files are specific (not just "the payout module")
- NFRs have measurable targets (not just "should be fast")
- Risks have concrete mitigations (not just "be careful")
- Measurement criteria are observable (can check via Honeycomb or tests)
- Code elevation accurately reflects the existing codebase

## Rules

- **NEVER** skip reading the Jira ticket — always call `getJiraIssue`
- **ALWAYS** route via the repo registry before exploring
- **ALWAYS** extract NFRs — even if the ticket doesn't mention them, infer from context
- **ALWAYS** assess risks — every change has at least one risk
- **ALWAYS** define measurement criteria — "how do we know this worked?"
- **ALWAYS** do code elevation for brown-field intents
- **ALWAYS** post a Jira comment after completing inception
- **ALWAYS** update `docs/<identifier>/state.md`
- **ALWAYS** use AI-initiated recommendation at the checkpoint
- If ACs are vague, list open questions — don't fill in assumptions silently
