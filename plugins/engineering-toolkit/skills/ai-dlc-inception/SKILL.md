---
name: ai-dlc-inception
description: "Internal phase of the ai-dlc pipeline — extracts structured requirements, NFRs, risks, measurement criteria, and code elevation for brown-field. Invoke directly only via /engineering-toolkit:ai-dlc-inception when explicitly requested by name. For general requests like 'analyze this ticket', use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '<TICKET-ID>'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for requirements analysis, NFR extraction, and risk assessment.

## Agent: Inceptor

**Mission**: Understand the intent and produce a comprehensive Inception Artifact covering requirements, NFRs, risks, measurement criteria, and code elevation (for brown-field).

**Inputs**: Jira ticket ID + Level 1 Plan from Plan phase (`state.md`), `investigation.md` (if bug-fix flow)
**Outputs**: `docs/<identifier>/prd-plans/inception.md` (Inception Artifact) + updated `state.md`
**Subagent type**: `general-purpose`

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

Before exploring, identify which repositories are relevant. Read the [repo registry](../ai-dlc/reference/repo-registry.md) and apply routing:
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
| **Observability** | Logging needs? Metrics to expose? Alerting? SLOs? |

For each identified NFR, assign an ID (NFR-1, NFR-2, ...) and a measurable target.

If the ticket doesn't mention NFRs explicitly, **infer from context** and present to user:
> "I noticed this touches payment data. I recommend adding NFR-1: PCI compliance for card handling. Agree?"

### Produce Observability Plan (Standard — all intents)

Every feature ships with a plan for how it will be tracked and observed in production. This is **mandatory**, not optional — even if the ticket doesn't mention observability.

**Step 1 — Identify Service Archetype**

Classify the affected service using the [harness templates](../ai-dlc/reference/harness-templates.md). Load the archetype-specific SLO/NFR/Sensor defaults. If the repo spans multiple archetypes (e.g., API + event consumer), plan each separately.

**Step 2 — Define SLIs and SLOs**

For each affected archetype, define:

| SLI (what we measure) | SLO (target) | Source |
|------------------------|--------------|--------|
| HTTP non-5xx rate | 99.9% over 30d | Archetype default / ticket |
| API latency P95 | < 500ms | NFR-{N} / archetype default |

- Start with archetype defaults from harness-templates
- Override with ticket-specific NFRs where they exist
- If the feature introduces a **new endpoint, event handler, or job**, it MUST have at least one SLI/SLO

**Step 3 — Plan Instrumentation**

Identify what needs to be instrumented in the code being changed:

| What | Where | Instrumentation |
|------|-------|----------------|
| API endpoint latency | `Controller.method()` | Existing OTel auto-instrumentation (verify) |
| Business operation outcome | `Service.method()` | Custom span with result attribute |
| External call latency | `Client.call()` | Span attribute for downstream service |

Categories to consider:
- **Structured logging**: Key decision points, error paths, business events (with correlation IDs)
- **Custom spans**: Business operations not covered by auto-instrumentation
- **Span attributes**: Contextual data that enables filtering (tenant ID, user type, feature flag, etc.)
- **Metrics**: Counters/gauges for business KPIs if applicable

**Step 4 — Define Alerts**

For each SLO, define what alert should fire when the budget burns:

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| Error rate spike | >1% 5xx in 5min window | P2 | PagerDuty / Slack |
| Latency degradation | P95 > 2x target for 10min | P3 | Slack |

If the feature doesn't warrant new alerts, state explicitly: "Covered by existing service-level alerts" — but verify those exist.

**Step 5 — Present to User**

> "Here's the Observability Plan based on the **{archetype}** archetype:
> - **{N} SLIs/SLOs** defined (including {list})
> - **{N} instrumentation points** identified
> - **Alerting**: {new alerts needed / covered by existing}
>
> Does this coverage look right, or should we add/remove anything?"

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

Write to `docs/<identifier>/prd-plans/inception.md`. See [artifacts reference](../ai-dlc/reference/artifacts.md) for the full Inception Artifact format. Key sections:
- Goal, Acceptance Criteria, Scope, Affected Modules, Existing Patterns
- NFRs table
- **Observability Plan** (SLIs/SLOs, instrumentation, alerts)
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

### CHECKPOINT — Approve Requirements

Present the Inception Artifact and proactively recommend the next phase (see [AI-initiated recommendation protocol](../ai-dlc/reference/shared.md#ai-initiated-recommendation-protocol)):

> **Inception complete.**
>
> - **{N} acceptance criteria** defined
> - **{N} NFRs** identified: {brief list}
> - **{N} risks** assessed: {highest risk}
> - **Observability**: {N} SLIs/SLOs, {N} instrumentation points, {new alerts / existing coverage}
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
- Observability plan has concrete SLIs/SLOs (not just "add monitoring"), instrumentation points tied to specific code locations, and explicit alert decisions
- Code elevation accurately reflects the existing codebase

## Rules

See [common phase rules](../ai-dlc/reference/shared.md#common-phase-rules) for state updates, Jira comments, and checkpoint protocol.

Phase-specific:
- **NEVER** skip reading the Jira ticket — always call `getJiraIssue`
- **ALWAYS** route via the repo registry before exploring
- **ALWAYS** extract NFRs — even if the ticket doesn't mention them, infer from context
- **ALWAYS** produce the Observability Plan — every feature needs SLIs/SLOs, even if it inherits archetype defaults
- **ALWAYS** assess risks — every change has at least one risk
- **ALWAYS** define measurement criteria — "how do we know this worked?"
- **ALWAYS** do code elevation for brown-field intents
- If ACs are vague, list open questions — don't fill in assumptions silently
