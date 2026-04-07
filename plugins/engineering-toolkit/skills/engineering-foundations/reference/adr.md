# Architecture Decision Records

## When to Create an ADR

- Choosing between significant technical alternatives
- Decisions that affect multiple teams or systems
- Establishing standards or conventions
- Any decision you'll need to justify 6 months from now

## ADR Structure (5 Sections)

- **Context and Problem Statement** — What problem? What constraints? Why now?
- **Decision** — What we chose + justification (3+ reasons)
- **Options Considered** — Comparison table with pros/cons
- **Consequences** — Positive, negative, risks
- **Compliance & Security** — Security and compliance impacts

## Rules

| Rule | Guidance |
|---|---|
| **Title** | Active voice: "Use PostgreSQL for User Data" |
| **Context** | Project-specific context, NOT generic features |
| **Comparison** | Always 2-3 alternatives with pros/cons table |
| **Cons** | MUST list at least one negative consequence |
| **Recommend** | Be decisive: "I recommend X because..." |

## ADR Template

```markdown
# ADR-XXX: [Active Voice Title]

## Status
Proposed | Accepted | Deprecated | Superseded

## Context and Problem Statement
[Specific problem in this project. Constraints. Why now.]

## Decision
We will use [chosen option] because:
1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

## Options Considered

| Option | Pros | Cons |
|---|---|---|
| Option A | Pro 1, Pro 2 | Con 1, Con 2 |
| Option B | Pro 1, Pro 2 | Con 1, Con 2 |

## Consequences

### Positive
- [Positive outcome]

### Negative
- [Negative outcome — REQUIRED]

### Risks
- [Risk and mitigation]

## Compliance & Security
[Any security or compliance considerations]
```

## Good vs Bad ADR Titles

| Bad | Good |
|---|---|
| "Database Selection" | "Use PostgreSQL for User Data" |
| "Authentication Approach" | "Implement JWT with Redis Session Store" |
| "API Design" | "Use REST over GraphQL for Partner API" |
