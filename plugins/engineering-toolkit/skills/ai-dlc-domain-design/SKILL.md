---
name: ai-dlc-domain-design
description: "Internal phase of the ai-dlc pipeline — models pure business logic using DDD principles, independent of infrastructure. Invoke directly only via /engineering-toolkit:ai-dlc-domain-design when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for domain modeling.

## Agent: Domain Designer

**Mission**: Model the core business logic independently of infrastructure using Domain-Driven Design principles.

**Inputs**: `state.md`, `prd-plans/inception.md` (requirements, NFRs, code elevation if brown-field)
**Outputs**: `docs/<identifier>/prd-plans/domain-model.md` + updated `state.md` (Domain Model column of traceability)
**Subagent type**: `Explore` for codebase research

**Definition of Done**:
- Aggregates, entities, and value objects are named with ubiquitous-language terms (no tech nouns like "Record" or "Item")
- Domain events defined in past tense (`OrderCancelled`, not `CancelOrder`)
- Business rules (invariants) listed — each one testable without infrastructure
- Repository interfaces described (shape only, no ORM leakage)
- Validated against existing models — no duplicate aggregates or naming collisions
- User has approved at the checkpoint

## Why This Phase Exists

AI-DLC separates domain modeling from architectural design. This ensures business logic is modeled purely — without being influenced by infrastructure choices. The domain model becomes the foundation that Logical Design builds upon. This is the DDD flavor of AI-DLC.

## When This Phase Runs

- **Included**: green-field, brown-field, full features, new domain concepts
- **Skipped**: bug fixes, small features with no new domain concepts, refactors (no new behavior)

If skipped in the Level 1 Plan, this phase is not invoked.

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify Inception is completed. Load the Inception Artifact. See [shared reference](../ai-dlc/reference/shared.md) for state.md format.

### Extract Ubiquitous Language (optional but recommended)

Before identifying aggregates, invoke the `engineering-toolkit:ubiquitous-language` skill to produce `docs/<identifier>/UBIQUITOUS_LANGUAGE.md`. Aggregates named with unresolved vocabulary tend to acquire drift later — this step catches "account = Customer AND User" before it becomes an entity.

Skip only when:
- The source material has no terminology ambiguity (rare — confirm with user)
- An existing `UBIQUITOUS_LANGUAGE.md` for this identifier is already current

All subsequent phase steps (aggregates, events, repository interfaces) must use the canonical terms from the glossary.

### Research Existing Domain Models

Use Explore subagents to find existing domain models in the codebase:
- Existing aggregates, entities, value objects in affected modules
- Existing domain events and their handlers
- Existing repository interfaces
- Naming conventions and patterns used

**For brown-field**: Start from the code elevation models produced during Inception. These are your baseline.

### Identify Aggregates

For each bounded context affected:
- **Aggregate Root**: The entity that owns the consistency boundary
- **Entities**: Objects with identity within the aggregate
- **Value Objects**: Immutable objects without identity
- **Invariants**: Business rules that must always hold

Present 2-3 options for aggregate boundaries if the choice isn't obvious:
> "Option A: `Refund` as its own aggregate (loose coupling, independent lifecycle).
> Option B: `Refund` as an entity within `Payout` aggregate (stronger consistency, simpler queries).
> I recommend Option A because refunds have independent state transitions."

### Define Domain Events

For each significant state change:
- Event name (past tense: `RefundCreated`, `RefundApproved`)
- Payload (what data the event carries)
- Trigger condition (when this event fires)
- Consumers (who listens — even if not yet implemented)

### Map Business Rules

For each acceptance criterion, identify:
- **State transitions**: What states can the entity be in? What transitions are valid?
- **Invariants**: What must always be true? (e.g., "Refund amount cannot exceed original payment")
- **Policies**: What happens when an event occurs? (e.g., "When RefundApproved, credit the customer's balance")

Create a Mermaid state diagram for complex state machines:
```mermaid
stateDiagram-v2
    [*] --> Pending: create
    Pending --> Approved: approve
    Pending --> Rejected: reject
    Approved --> Processed: process
```

### Define Repository Interfaces

For each aggregate:
- Interface name and methods (save, findById, findBy...)
- **No implementation details** — just the contract
- Follow existing repository patterns in the codebase

### Create Component Interactions

Mermaid sequence diagram showing how components interact for key use cases:
```mermaid
sequenceDiagram
    Controller->>CommandHandler: CreateRefundCommand
    CommandHandler->>RefundAggregate: create()
    RefundAggregate->>EventBus: RefundCreatedEvent
    EventBus->>NotificationHandler: handle()
```

### Validate Against Existing Models

Cross-check the new domain model with:
- Existing aggregates — does this conflict or overlap?
- Existing events — can we reuse any?
- Existing naming — are we consistent?

### Produce Domain Model Artifact

Write to `docs/<identifier>/prd-plans/domain-model.md`:

See [artifacts reference](../ai-dlc/reference/artifacts.md) for the Domain Model Artifact format.

### Update Jira

Post domain model summary as a comment.

### Update State

Update `docs/<identifier>/state.md`:
- Mark Domain Design as completed
- Update Traceability Matrix (add Domain Model column mapping ACs to domain concepts)

### CHECKPOINT — Approve Domain Model

Present the domain model and recommend next phase (see [AI-initiated recommendation protocol](../ai-dlc/reference/shared.md#ai-initiated-recommendation-protocol)):

> **Domain Design complete.**
>
> Modeled {N} aggregates: {list}
> Defined {N} domain events: {list}
> Identified {N} business rules and {N} state transitions
>
> I recommend proceeding to **Logical Design** to apply architectural patterns. Specifically:
> - {NFR-1} suggests we need {pattern} for {reason}
> - The {aggregate} will need a {repository type} implementation
> - I'll generate ADRs for {key decisions}
>
> Shall I proceed?

## What Good Domain Design Looks Like

- Aggregates have clear boundaries (not too large, not too small)
- Every AC maps to at least one domain concept
- Business rules are explicit (not hidden in service logic)
- Domain events capture all significant state changes
- Repository interfaces are minimal (only needed operations)
- Naming follows existing codebase conventions
- Component interactions are traceable to acceptance criteria

## Rules

See [common phase rules](../ai-dlc/reference/shared.md#common-phase-rules) for state updates, Jira comments, and checkpoint protocol.

Phase-specific:
- **NEVER** include infrastructure concerns — no databases, no HTTP, no message brokers
- **NEVER** design in a vacuum — always check existing domain models first
- **ALWAYS** present options for non-obvious aggregate boundaries
- **ALWAYS** map every AC to domain concepts (traceability)
- **ALWAYS** use Mermaid diagrams for state transitions and interactions
- **ALWAYS** validate against existing codebase patterns
