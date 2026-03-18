# Agent Role Definitions

Each agent has a bounded responsibility, clear inputs/outputs, and specific skills it leverages.

## Model Selection

Each agent has a recommended model based on the nature of its work:

| Agent | Model | Reasoning |
|-------|-------|-----------|
| Analyst | haiku | Codebase search and extraction — speed over depth |
| Architect | opus | Architecture decisions require deep reasoning |
| Plan-Checker | sonnet | Validation checklist — systematic, not creative |
| Implementer | sonnet | Code generation — high volume, pattern-following |
| Tester | sonnet | Test generation — systematic, pattern-following |
| Verifier | sonnet | Systematic checks — grep/glob verification, not creative |
| Reviewer | opus | Deep code review requires nuanced judgment |
| Release | sonnet | Git workflow and CI/CD — procedural |

Pass the model via the `model` parameter on the Agent tool call. If the agent delegates to a pre-defined agent file (e.g., `code-reviewer.md`), the model in the agent file takes precedence.

## 1. Analyst Agent

**Mission**: Understand the ticket and produce structured requirements.
**Model**: haiku

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
**Model**: opus

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

## 3. Plan-Checker Agent

**Mission**: Validate design quality before execution begins — catch issues when they're cheap to fix.
**Model**: sonnet

**Inputs**: Solution Design from Architect + Structured Requirements from Analyst
**Outputs**: Validation result (PASS or list of issues)

**Responsibilities**:
- Verify every acceptance criterion maps to at least one file change
- Check interfaces are concrete TypeScript (not prose descriptions)
- Verify no contradictions between design and existing code patterns
- Check every new file has a clear consumer (not orphaned)
- Validate `depends_on` relationships make sense

**Subagent type**: `general-purpose`

**Validation Checklist**:
- [ ] Every acceptance criterion → file change mapping exists
- [ ] Interfaces are TypeScript, not prose
- [ ] New files have consumers
- [ ] No contradictions with existing patterns
- [ ] Risk mitigations are concrete, not vague

**On failure**: return specific issues to Architect for revision. Max 3 revision iterations.

---

## 4. Implementer Agent

**Mission**: Build the solution using TDD, following the execution plan.
**Model**: sonnet

**Inputs**: Execution plan (`specs.md`) with task breakdown
**Outputs**: Code changes with passing unit tests

**Responsibilities**:
- Read each task's `read_first` files before starting
- Execute the concrete `action` for each task
- Follow TDD: Red -> Green -> Refactor for each behavior
- Verify each task's `acceptance_criteria` after completing it
- Commit after each Green phase
- Follow codebase conventions (naming, imports, error handling, logging)
- Apply deviation rules (auto-fix bugs/security, STOP for architectural changes)

**Skills**: `/testing-unit`, `/domain-model`, `/error-handling`, `/logging` (or project-specific equivalents)

**Subagent type**: `general-purpose` (multi-step implementation)

**TDD Rhythm**:
- Read the task's `read_first` files
- Write a failing test for the behavior (Red)
- Write minimum code to pass (Green)
- Refactor if needed
- Verify `acceptance_criteria` (grep/test check)
- Commit
- Pick next task (respecting `depends_on`), repeat

**Deviation Rules**:
| Rule | Situation | Action |
|------|-----------|--------|
| 1 | Bug found | Auto-fix, `fix:` commit |
| 2 | Missing validation/security | Auto-add |
| 3 | Blocking issue | Auto-fix (max 3 attempts) |
| 4 | Architectural change | **STOP and ask** |

**Guards**:
- Analysis paralysis: 5+ reads without a write = stuck, surface the blocker
- Fix attempts: max 3 per issue, then document and move on
- Scope boundary: only fix issues caused by current task

---

## 5. Tester Agent

**Mission**: Validate the implementation through e2e and integration tests.
**Model**: sonnet

**Inputs**: Execution plan (`specs.md`) + Implementation (code)
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

## 6. Verifier Agent

**Mission**: Confirm the implementation achieves the goal, not just that tasks completed.
**Model**: sonnet

**Inputs**: Goal + Must-Haves (from `specs.md`) + Implementation (code)
**Outputs**: Verification report (PASSED / GAPS_FOUND / HUMAN_NEEDED)

**Responsibilities**:
- Extract must-haves from specs.md Goal and acceptance criteria
- Three-level artifact verification: exists → substantive → wired
- Anti-pattern scanning (TODO/FIXME, stubs, dead exports, log-only handlers)
- Identify items that need human verification (visual, UX, performance)
- Produce structured verification report with file:line references

**Subagent type**: `general-purpose`

**Core Principle**: Do NOT trust task completion claims or summaries. Verify independently by checking files on disk, running grep checks, and tracing wiring.

**Three-Level Check**:
| Level | Question | How |
|-------|----------|-----|
| Exists | Is the artifact present? | Glob/grep for file/symbol |
| Substantive | Is it real, not a stub? | Check for TODO, empty returns, placeholders |
| Wired | Is it connected? | Check imports, route registrations, DI bindings |

**Gap Closure**: if gaps found, return specific gaps (with file:line) to Implementer. On re-verification, deep check failed items, quick regression check passed items. Max 2 iterations.

See [verification.md](verification.md) for technology-specific patterns.

---

## 7. Reviewer Agent

**Mission**: Ensure code quality, architecture compliance, and security.
**Model**: opus

**Inputs**: Full diff of all changes + verification report
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

## 8. Release Agent

**Mission**: Get the code merged and deployed.
**Model**: sonnet

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
Architect <--[Revision Loop]--> Plan-Checker (max 3 iterations)
Architect --[Solution Design]--> Orchestrator creates Plan (specs.md)
                                        |
                                        +--> Implementer (execution plan)
                                        +--> Tester (execution plan, parallel)
Implementer --[Code + Tests]--> Verifier
Tester --[E2e Tests]--> Verifier
Verifier --[Gaps]--> Implementer (gap closure, max 2 iterations)
Verifier --[Verification Report]--> Reviewer
Reviewer --[Approved Code]--> Release
```

### Handoff Rules

- **Never skip a handoff** — each agent needs the previous artifact
- **Artifacts are append-only** — later agents can add to them but not remove
- **Checkpoint artifacts** — Analyst and Architect outputs must be user-approved before handoff
- **Parallel handoff** — Implementer and Tester both receive the execution plan simultaneously
- **Revision loops are bounded** — Design: max 3 iterations, Verify gap closure: max 2 iterations
- **Pass file paths, not content** — agents read artifacts from disk, keeping the orchestrator thin

### Thin Orchestrator Principle

The orchestrator (main conversation) should use ~15% of its context for routing and state. Heavy work goes to agents, each getting a fresh context window. This prevents quality degradation from accumulated context.

- Write artifacts to files → pass file paths to agents
- Never paste large code blocks inline in the orchestrator
- Each agent reads what it needs from `read_first` and artifact files
