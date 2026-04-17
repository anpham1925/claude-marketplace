---
name: ai-dlc-logical-design
description: "Internal phase of the ai-dlc pipeline — applies architectural patterns, maps NFRs to design decisions, generates ADRs, and produces plan summary (specs.md + flows.md). Invoke directly only via /engineering-toolkit:ai-dlc-logical-design when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for architecture decisions.

## Agent: Logical Designer

**Mission**: Translate the Domain Model into an implementable solution by applying architectural patterns, NFR-driven design decisions, and technology choices.

**Inputs**: `state.md`, `prd-plans/inception.md` (NFRs, risks), `prd-plans/domain-model.md` (if exists)
**Outputs**: `prd-plans/specs.md` (Solution Design + Plan Summary), `prd-plans/flows.md`, `prd-plans/ADR-*.md`, updated `state.md` (Design Decision column of traceability)
**Subagent type**: `Explore` for codebase research

## Why This Phase Exists

Domain Design models pure business logic. Logical Design bridges the gap to implementation by applying architectural patterns that satisfy NFRs, making technology choices, and producing an actionable file plan. This separation ensures infrastructure doesn't contaminate domain logic.

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify the prerequisite phase is completed:
- If Domain Design was in the pipeline: verify it's done, load Domain Model
- If Domain Design was skipped: verify Inception is done, load Inception Artifact

Load NFRs from state.md. See [shared reference](../ai-dlc/reference/shared.md) for format.

### Deep-dive the Codebase

- Use the repos identified during Inception
- Read the files identified in affected modules
- Find the closest existing implementation to use as a pattern
- Understand current architecture of affected areas

### NFR-to-Pattern Mapping

For each NFR identified during Inception, map it to a specific architectural decision:

| NFR | Pattern | Rationale |
|-----|---------|-----------|
| NFR-1: API <200ms P95 | CQRS read model | Separate read path avoids join queries |
| NFR-2: PCI compliance | Encrypted at rest + field-level masking | Required by PCI-DSS |
| NFR-3: 99.9% uptime | Circuit breaker on external calls | Prevent cascade failures |

**Every NFR must have a corresponding pattern.** If an NFR can't be addressed architecturally, flag it.

### Design the Approach — Options at Every Decision

For EACH significant architectural decision, present 2-3 options:

```markdown
### Decision: {what needs to be decided}

| Option | Pros | Cons |
|--------|------|------|
| A: {name} | ... | ... |
| B: {name} | ... | ... |
| **C: {recommended}** | ... | ... |

**Recommendation**: Option C because {reasoning tied to NFRs and constraints}.
```

Decisions that warrant options analysis:
- Data storage pattern (CQRS, event sourcing, simple CRUD)
- Communication pattern (sync REST, async events, saga)
- Error handling strategy (retry, circuit breaker, dead letter)
- Caching strategy (no cache, in-memory, distributed)
- Authentication/authorization approach

### Define Contracts

- **Interfaces** that new code must implement (TypeScript)
- **DTOs** for new endpoints
- **Event schemas** for new domain events on the bus
- **Database schema changes** (if any)

### Map File Changes

List every file that needs to be created or modified:
```markdown
### New Files
- `path/to/new-file.ts` — {purpose}

### Modified Files
- `path/to/existing.ts` — {what changes and why}
```

Follow the project's architecture rules (controllers in apps/, business logic in modules/, etc.).

### Generate ADRs

For each significant decision, write an ADR:

```markdown
# ADR-{N}: {Decision Title}

## Status
Accepted

## Context
{Why this decision is needed — link to NFR or risk}

## Decision
{What was decided}

## Alternatives Considered
- {Option A — why rejected}
- {Option B — why rejected}

## Consequences
- {Positive consequence}
- {Negative consequence / trade-off}
```

Store ADRs in `docs/<identifier>/prd-plans/`.

### Assess Risks (Design-level)

- Breaking changes to existing contracts?
- Migration path needed?
- Performance implications of chosen patterns?
- Feature flag needed for safe rollout?

### Produce Solution Design

```markdown
## Approach
{High-level description of chosen approach}

## NFR Mapping
| NFR | Pattern | Implementation |
|-----|---------|---------------|

## Architecture Decisions
{Options tables for each decision}

## File Changes
{New and modified files}

## Interfaces / Contracts
{TypeScript interfaces}

## Data Flow
{Mermaid diagram}

## Dependencies
{External services, libraries}

## Risks
{Risk — mitigation}

## ADRs
{Links to ADR files}
```

### Write Plan Summary

After design approval, write to `docs/<identifier>/prd-plans/`:

**specs.md** — Consolidated specifications:
- Requirements from Inception
- NFRs with targets
- Design decisions and rationale
- File plan
- ADR references

**flows.md** — Flow diagrams (Mermaid):
- Request flow, data flow, state transitions
- Include domain event flows
- Include error/retry flows if applicable

### Update Jira

Post design summary as a comment.

### Update State

Update `docs/<identifier>/state.md`:
- Mark Logical Design as completed
- Update Traceability Matrix (add Design Decision column)
- Record key decisions

### CHECKPOINT — Approve Solution Design

Present the solution design and recommend next phase (see [AI-initiated recommendation protocol](../ai-dlc/reference/shared.md#ai-initiated-recommendation-protocol)):

> **Logical Design complete.**
>
> - Chose {pattern} for {NFR}
> - {N} ADRs generated for significant decisions
> - File plan: {N} new files, {N} modified files
>
> I recommend proceeding to **Construct** using {N} dependency waves:
> - Wave 1: {foundational components}
> - Wave 2: {dependent components}
> - Wave 3: {integration wiring}
>
> Shall I proceed?

## What Good Logical Design Looks Like

- An Implementer can start coding without asking questions
- Every NFR maps to a concrete architectural decision
- File changes are specific and follow project structure rules
- Contracts are defined in TypeScript (not just prose)
- Trade-offs are honest (every option has cons)
- ADRs document the "why" behind significant choices
- Patterns are consistent with existing codebase

## Rules

See [common phase rules](../ai-dlc/reference/shared.md#common-phase-rules) for state updates, Jira comments, and checkpoint protocol.

Phase-specific:
- **NEVER** design in a vacuum — always read existing code first
- **ALWAYS** present 2-3 options with trade-offs for significant decisions
- **ALWAYS** map every NFR to an architectural pattern
- **ALWAYS** generate ADRs for significant decisions
- **ALWAYS** write Plan Summary (specs.md + flows.md) after design approval
