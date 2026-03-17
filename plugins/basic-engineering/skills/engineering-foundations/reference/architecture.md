# Architecture Planning

## 5-Step Planning Process

### Step 1: Understand Context

- What is the business requirement?
- What existing modules/services are involved?
- What external services need integration?
- Are there existing patterns for similar features?
- What are the constraints?

### Step 2: Analyze Architecture

- Which layers are affected? (Presentation, Application, Domain, Infrastructure)
- Does this cross module boundaries?
- What are the commands (writes) and queries (reads)?

### Step 3: Design Solution

| Aspect | Details |
|---|---|
| **Approach** | Brief description |
| **Modules Affected** | Which modules need changes |
| **Domain Model** | New entities, value objects, events |
| **Infrastructure** | New API clients, database tables |
| **Database** | Migrations needed |
| **Testing** | Unit and e2e test strategy |
| **Rollout** | Feature flags, backward compatibility |

### Step 4: Consider Trade-offs

Present 2-3 options:

| Criteria | Option A | Option B | Option C |
|---|---|---|---|
| Complexity | | | |
| Backward Compatibility | | | |
| Testability | | | |
| Performance | | | |
| Recommendation | | | |

### Step 5: Identify Risks

- Breaking changes to existing APIs?
- Data migration required?
- External service dependencies?
- Feature flag needed?
- Monitoring requirements?

## Plan Document Template

Save to `docs/plans/PLAN-<feature>-<date>.md`:

```markdown
# Plan: [Feature Name]

## Context
[Business requirement and background]

## Decision
[Chosen approach and rationale]

## Solution Design
[Table from Step 3]

## Implementation Steps
1. [Step with file paths]

## Testing Strategy
- Unit tests: [what to test]
- E2e tests: [what to test]

## Risks & Mitigations
- [Risk]: [Mitigation]
```

## Decision Pointers

- **Rich domain model vs simple CRUD?** Complex state transitions -> rich model. Simple data access -> CRUD.
- **New external integration?** Dedicated library, wrap the API client, add to mock list.
- **New API endpoint?** Controller in presentation, handler in application, DTOs for validation.
- **Event-driven consumer?** Entry point in presentation, handler in application, decide retry vs skip.
