# AI-DLC Artifact Formats

Handoff contracts and artifact templates shared across AI-DLC phases. Extracted from shared.md to allow phases to load only what they need.

---

## Handoff Contracts

Each phase produces a structured artifact **file** that feeds into the next. The orchestrator passes **file paths** between phases — never raw content. If the session dies, artifact files contain everything needed to resume.

```
Planner --[state.md: Level 1 Plan]--> Inceptor
Inceptor --[specs.md: Inception Artifact]--> Domain Designer
Domain Designer --[prd-plans/domain-model.md]--> Logical Designer
Logical Designer --[prd-plans/specs.md + prd-plans/flows.md]--> Constructor
Constructor --[Code + Tests + state.md: Traceability]--> Verifier
Verifier --[review-feedback.md + state.md]--> Releaser
Releaser --[Merged PR]--> Observer
Observer --[state.md: Observation Report]--> DONE
```

### Inception Artifact Format

```markdown
## Goal
{One sentence}

## Acceptance Criteria
- [ ] AC-1: {criterion}

## Scope
**In scope**: ...
**Out of scope**: ...

## Affected Modules
- `modules/{name}` — {what changes}

## Existing Patterns
- {Similar implementation at path:line}

## NFRs
| ID | Category | Requirement | Target |
|----|----------|-------------|--------|

## Observability Plan

### Service Archetype
{archetype from harness-templates — e.g., HTTP API, Event Consumer, Worker}

### SLIs / SLOs
| SLI (what we measure) | SLO (target) | Source |
|------------------------|--------------|--------|
| {e.g., HTTP non-5xx rate} | {e.g., 99.9% over 30d} | {archetype default / NFR-N / ticket} |

### Instrumentation
| What | Where | Type |
|------|-------|------|
| {e.g., API latency} | {Controller.method()} | {auto-instrumentation / custom span / span attribute / structured log} |

### Alerts
| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| {e.g., Error rate spike} | {>1% 5xx in 5min} | {P2} | {PagerDuty / Slack / existing} |

*If no new alerts needed, state: "Covered by existing service-level alerts at {link/name}"*

## Risk Assessment
| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|

## Measurement Criteria
- {How we know this succeeded}

## Code Elevation (brown-field only)
### Static Model
- {Components, responsibilities, relationships}
### Dynamic Model
- {Interaction flows for key use cases}

## Open Questions
- {Question — who can answer}
```

### Domain Model Artifact Format

```markdown
## Aggregates
### {AggregateName}
- **Root Entity**: {name}
- **Entities**: {list}
- **Value Objects**: {list}
- **Invariants**: {business rules that must hold}

## Domain Events
- `{EventName}` — triggered when {condition}

## Repository Interfaces
- `{RepoName}` — {operations}

## State Transitions
{Mermaid state diagram}

## Component Interactions
{Mermaid sequence diagram}
```

### Rules

- **Never skip a handoff** — each phase needs the previous artifact file
- **Artifacts are append-only** — later phases can add but not remove
- **Handoffs are file paths, not content** — the orchestrator tells the next subagent which files to read, never pastes content into the prompt
- **Checkpoint artifacts** — Plan, Inception, Domain Design, and Logical Design outputs must be user-approved before handoff
- **Traceability is cumulative** — each phase adds its column to the traceability matrix
- **AI recommends after every checkpoint** — never just stop silently
- **Session-death safe** — all completed work lives in artifact files. New session reads state.md and resumes

---

## Traceability Matrix Protocol

The traceability matrix links every acceptance criterion through the full pipeline:

| Column | Populated By | Content |
|--------|-------------|---------|
| **AC** | Inception | Acceptance criterion text |
| **Domain Model** | Domain Design | Entity/aggregate/event that implements it |
| **Design Decision** | Logical Design | Chosen pattern/option |
| **Code Files** | Construct | File paths of implementation |
| **Test Files** | Construct | File paths of tests |

**Rules**:
- Every AC MUST have entries in all columns by the end of Verify
- Verify phase validates completeness — gaps are flagged as FAIL
- Matrix is stored in `state.md` and updated after each phase
