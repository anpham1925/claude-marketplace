# Agent Role Definitions

Each agent has a bounded responsibility, clear inputs/outputs, and specific skills it leverages.

## 1. Analyst Agent

**Mission**: Understand the ticket and produce structured requirements.

**Inputs**: Jira ticket ID
**Outputs**: Structured Requirements artifact

**Responsibilities**:
- Read and parse Jira ticket (summary, description, acceptance criteria, comments, linked issues)
- Research codebase to identify affected modules and existing patterns
- Identify scope boundaries — what's in, what's out
- Surface open questions and ambiguities
- Produce a clear, actionable requirements document

**Skills**: `/requirements` (or project-specific equivalent)

**Subagent type**: Use `codebase-explorer` if defined in `.claude/agents/`, otherwise `Explore`

**Structured Requirements Template**:
```
## Goal
{One sentence describing what this ticket achieves}

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}

## Scope
**In scope**: {What we're building}
**Out of scope**: {What we're NOT building}

## Affected Modules
- `modules/{name}` — {what changes}
- `apps/{name}` — {what changes}

## Existing Patterns
- {Similar implementation found at path:line}

## Open Questions
- {Question 1} — {who can answer}
```

---

## 2. Architect Agent

**Mission**: Design a solution that fits the codebase and is implementable.

**Inputs**: Structured Requirements from Analyst
**Outputs**: Solution Design artifact (+ ADR if significant decision)

**Responsibilities**:
- Analyze codebase architecture and find similar implementations
- Design file structure (new files + modifications)
- Define interfaces and contracts between components
- Present 2-3 approach options with trade-offs, recommend one
- Create ADR for significant architectural decisions
- Ensure design follows existing patterns and conventions

**Skills**: `/architecture-planning`, `/code-structure`, `/adr` (or project-specific equivalents)

**Subagent type**: `Explore` for research, then synthesize

**Solution Design Template**:
```
## Approach
{High-level description of the chosen approach}

### Options Considered
| Option | Pros | Cons |
|--------|------|------|
| A: {name} | ... | ... |
| B: {name} | ... | ... |
| **C: {recommended}** | ... | ... |

## File Changes

### New Files
- `path/to/new-file.ts` — {purpose}

### Modified Files
- `path/to/existing.ts` — {what changes and why}

## Interfaces / Contracts
```typescript
// Key interfaces the implementation must satisfy
```

## Data Flow
{Text description or ASCII diagram of how data flows}

## Dependencies
- {External service or module dependency}

## Risks
- {Risk 1} — {mitigation}
```

---

## 3. Implementer Agent

**Mission**: Build the solution using TDD, following the Architect's design.

**Inputs**: Solution Design from Architect
**Outputs**: Code changes with passing unit tests

**Responsibilities**:
- Follow TDD: Red -> Green -> Refactor for each behavior
- Implement according to the Solution Design's file structure and interfaces
- Write unit tests covering all acceptance criteria
- Commit after each Green phase
- Follow codebase conventions (naming, imports, error handling, logging)

**Skills**: `/testing-unit`, `/domain-model`, `/error-handling`, `/logging` (or project-specific equivalents)

**Subagent type**: `general-purpose` (multi-step implementation)

**TDD Rhythm**:
1. Pick the simplest behavior from acceptance criteria
2. Write a failing test (Red)
3. Write minimum code to pass (Green)
4. Refactor if needed
5. Commit
6. Pick next behavior, repeat

---

## 4. Tester Agent

**Mission**: Validate the implementation through e2e and integration tests.

**Inputs**: Solution Design (contracts) + Implementation (code)
**Outputs**: E2e tests, edge case tests

**Responsibilities**:
- Write e2e tests covering acceptance criteria
- Write edge case and error path tests
- Only mock external services (never internal)
- Generate real JWT tokens for auth
- Use dynamic dates (never hardcode)
- Verify results from database, not just API responses

**Skills**: `/testing-e2e`, `/testing-unit` (or project-specific equivalents)

**Subagent type**: Use `test-runner` if defined in `.claude/agents/`, otherwise `general-purpose`

**Can run in parallel with Implementer** once the Architect's contracts are defined.

---

## 5. Reviewer Agent

**Mission**: Ensure code quality, architecture compliance, and security.

**Inputs**: Full diff of all changes
**Outputs**: Review feedback (categorized)

**Responsibilities**:
- Review architecture: correct layers, proper module boundaries
- Review naming: conventions, domain-specific terms
- Review imports: no circular deps, correct alias usage
- Review error handling: proper error types, retry logic
- Review testing: coverage, no hardcoded dates, proper mocking
- Review security: no injection, no exposed secrets, input validation
- Categorize findings: AUTO-FIX / NEEDS-INPUT / INFO

**Skills**: `/code-review` (or project-specific equivalent)

**Subagent type**: Use `code-reviewer` if defined in `.claude/agents/`, otherwise `general-purpose`

**Review Checklist**:
- [ ] Architecture: code in correct layer, proper boundaries
- [ ] Naming: follows conventions, domain terms correct
- [ ] Imports: no circular deps, correct aliases
- [ ] Error handling: correct error types, retry logic
- [ ] Tests: adequate coverage, no hardcoded dates, correct mocking
- [ ] Security: input validation, no injection vectors
- [ ] Logging: correct format (context first, message second)
- [ ] No unnecessary changes beyond scope

---

## 6. Release Agent

**Mission**: Get the code merged and deployed.

**Inputs**: Approved, reviewed code
**Outputs**: Merged PR, deployed to staging/production

**Responsibilities**:
- Create branch and commits following conventions
- **Run requirements review** — spawn a fresh `requirements-reviewer` subagent (context-isolated) to cross-check the diff against original requirements before proceeding
- Push and create draft PR
- Run CI/CD and fix failures
- Verify staging deployment
- Open PR for human review
- Address review feedback
- Update Jira status

**Skills**: `/basic-engineering:ship-n-check` (delegates to the ship-n-check skill for the full release pipeline)

**Subagent type**: Delegates to ship-n-check skill, which spawns a `requirements-reviewer` subagent internally (uses `.claude/agents/requirements-reviewer` if defined, otherwise `general-purpose` with inline prompt)

---

## Handoff Contracts

Each agent produces a structured artifact that feeds into the next:

```
Analyst --[Structured Requirements]--> Architect
Architect --[Solution Design]--> Implementer
Architect --[Solution Design]--> Tester (parallel)
Implementer --[Code + Tests]--> Reviewer
Tester --[E2e Tests]--> Reviewer
Reviewer --[Approved Code]--> Release
```

### Handoff Rules

1. **Never skip a handoff** — each agent needs the previous artifact
2. **Artifacts are append-only** — later agents can add to them but not remove
3. **Checkpoint artifacts** — Analyst and Architect outputs must be user-approved before handoff
4. **Parallel handoff** — Implementer and Tester both receive the Solution Design simultaneously
