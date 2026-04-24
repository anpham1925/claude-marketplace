---
name: ai-dlc-construct
description: "Internal phase of the ai-dlc pipeline — implements the solution using TDD in dependency waves, writes e2e tests, and updates the traceability matrix. Invoke directly only via /engineering-toolkit:ai-dlc-construct when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for implementation decisions across dependency waves.

## Agent: Constructor

**Mission**: Build the solution using TDD in dependency waves, write e2e tests, and maintain traceability from ACs through code to tests.

**Inputs**: `state.md`, `prd-plans/specs.md` (Solution Design), `prd-plans/flows.md`, `prd-plans/domain-model.md` (if produced)
**Outputs**: Code + unit tests + e2e tests + updated `state.md` (Code Files / Test Files columns of traceability matrix)
**Subagent type**: `general-purpose` — each wave component gets its own subagent with fresh context

**Definition of Done**:
- Every AC has at least one passing unit test — ACs without test coverage fail the phase
- E2E tests cover the happy path plus the critical failure modes from Logical Design
- Language-appropriate lint, type-check, and test suites are green locally
- Traceability matrix updated: AC → file(s) → test(s)
- No TODOs or commented-out code introduced; no hardcoded dates
- For bug-fix intents: fix report written (symptom → root cause → fix → regression test)

## Why This Phase Exists

AI-DLC's Construction phase is the "Bolt" — an intense, rapid implementation cycle. It combines Implement + Test into a single phase, producing a cohesive deliverable with full test coverage and traceability to acceptance criteria.

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify the prerequisite design phase is completed. Load:
- Solution Design from `docs/<identifier>/prd-plans/specs.md`
- Flow diagrams from `docs/<identifier>/prd-plans/flows.md`
- Domain Model from `docs/<identifier>/prd-plans/domain-model.md` (if exists)
- Traceability Matrix from state.md

See [shared reference](../ai-dlc/reference/shared.md) for format.

### Create Branch

If not already on a feature branch, create one before starting. See [shared reference](../ai-dlc/reference/shared.md) for branch naming convention.

### Transition Ticket

Before starting construction:
- **Move to In Progress**: Use `getTransitionsForJiraIssue` to find the transition ID, then `transitionJiraIssue`
- **Assign to current user**: Use `lookupJiraAccountId`, then `editJiraIssue`

If Jira operations fail, warn and continue — never block for a Jira update.

### Organize into Dependency Waves

Analyze the file plan from Logical Design. Group by dependency:

- **Wave 1**: Foundational (no internal deps) — domain models, value objects, DTOs, event schemas
- **Wave 2**: Depends on Wave 1 — services, command/query handlers, repositories
- **Wave 3+**: Depends on previous — controllers, integration wiring, module registration

For small tickets (1-2 components), a single wave is fine.

Present the wave plan to the user before starting.

### Execute Each Wave (TDD)

Within a wave, **launch parallel subagents** for independent components:
- Each subagent receives: Solution Design + Domain Model + relevant existing code only
- Each subagent follows the TDD loop below
- Wait for all subagents in a wave to complete before starting the next wave
- After each wave, run all tests to verify no conflicts

### TDD Loop (for each behavior within a component)

**Anti-pattern — horizontal slicing.** Do NOT write all tests first, then all implementation. Tests written in bulk verify *imagined* behavior — they test the shape of data/signatures instead of user-facing behavior, and they become insensitive to real changes. Within a wave, each component goes one test → one implementation → repeat. Each test responds to what you learned from the previous cycle.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical tracer bullets):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  ...
```

- **Red** — Write a failing test
  - Test file next to implementation (`.spec.ts`)
  - AAA pattern: Arrange, Act, Assert
  - Test the specific behavior from an acceptance criterion
  - Run the test — verify it fails for the right reason
- **Green** — Write minimum code
  - Only enough to make the test pass
  - Don't optimize or generalize yet
  - Run the test — verify it passes
  - **If test fails**: Enter the Self-Correction Loop (see below)
- **Validate** — Run computational sensors immediately
  - `lint --fix` on changed files
  - `type-check` on changed files
  - Fix any issues before proceeding — don't accumulate errors
- **Refactor** — Clean up
  - Remove duplication, improve naming
  - Run tests — verify still green
- **Commit** — Save progress
  - Commit after each Green phase
  - Message: `{action}: [TICKET] {what behavior was added}` — use `feat:` for features, `fix:` for bug-fixes (match the intent type from Level 1 Plan)

### Self-Correction Loop (max 3 attempts)

When a test fails during the Green phase:

```
Attempt 1: Read error → fix → re-run test
Attempt 2: Read error + review test assumptions → fix → re-run test
Attempt 3: Read error + review design alignment → fix → re-run test
→ Still failing? STOP — flag to user with error context
```

Each retry MUST feed the error message back as context. Don't retry blindly — each attempt should try a different approach based on what the error reveals:
- Attempt 1: Fix the obvious issue (typo, missing import, wrong assertion)
- Attempt 2: Question the test — is the test correct? Does it match the AC?
- Attempt 3: Question the design — does the implementation approach need to change?

### Write E2E Tests

After implementation waves complete (or in parallel once contracts are stable):

- One e2e test per acceptance criterion
- Edge cases: invalid input, missing data, unauthorized, boundary values
- Error paths: external service failures, invalid state, validation failures
- Only mock external services — never mock internal modules
- Dynamic dates (never hardcode)
- Verify DB state, not just API response

### Update Traceability Matrix

After each wave, update the traceability matrix in `state.md`:

| AC | Domain Model | Design Decision | Code Files | Test Files |
|----|-------------|-----------------|------------|------------|
| AC-1 | Refund aggregate | CQRS pattern | `refund.entity.ts`, `create-refund.handler.ts` | `refund.entity.spec.ts`, `create-refund.e2e-spec.ts` |

**Every AC must have entries in Code Files and Test Files columns.**

### Follow the Design

- Use the file structure from the Solution Design
- Implement the interfaces/contracts as defined
- Follow the domain model (aggregates, events, rules)
- Don't deviate without flagging it

### Handle Deviations

If the design doesn't work in practice:
- Document why
- Suggest an alternative
- Flag to user at next checkpoint
- Don't silently change the approach

### Write Fix Report (bug-fix intents only)

When the Level 1 Plan classifies the intent as **bug-fix**, produce `docs/<identifier>/prd-plans/fix-report.md`:

```markdown
# Fix Report: <TICKET>

## Symptom
{What the user/system observed — error message, wrong behavior, data inconsistency}

## Root Cause
{Why it happened — the actual code/logic/data defect, not just where it broke}
{Reference specific file:line where the defect lived}

## Investigation
{How the root cause was found — what was checked, what was ruled out}
- Checked: {what was investigated}
- Ruled out: {alternative hypotheses that were eliminated}

## Fix
{What was changed and why this fix is correct}
- `path/to/file.ts:line` — {what changed}

## Regression Prevention
- **Test added**: {test file and what it covers}
- **Why it wasn't caught**: {gap in existing tests or monitoring}

## Impact
- **Affected users/flows**: {scope of the bug}
- **Data remediation**: {needed | not needed — details if needed}
```

**Why**: Bug fixes skip Domain Design and Logical Design, so without this file there's no durable design artifact. The fix-report captures *why* it broke, *how* it was fixed, and *how we prevent it next time* — context that a code diff alone can't provide. Future features touching the same area benefit from knowing what went wrong here.

This file is **kept** after merge (same as specs.md/domain-model.md) — it's durable knowledge, not pipeline plumbing.

**Durable language rule**: In the Root Cause, Fix, and Regression Prevention sections, describe **modules, behaviors, and contracts** — not file paths or line numbers. A `file.ts:42` reference rots the moment the file is renamed or split. Keep file:line references inside `investigation.md` (short-lived) but strip them from the fix-report. The fix-report should read like a spec about a durable concept ("the retry handler on the webhook consumer"), not a diff ("lines 40-58 of consumer.ts").

### Update Jira

Post construction summary as a comment. For bug fixes, include the root cause and fix summary from the fix report.

### Update State

Update `docs/<identifier>/state.md`:
- Mark Construct as completed
- Update Traceability Matrix (Code Files + Test Files columns)
- Record any deviations from design

## Implementation Rules

- Follow existing code patterns from Inception/Design research
- Use existing utilities before creating new ones
- Only mock external services in tests
- Dynamic dates in all tests
- Proper logging (context first, message second)
- Proper error handling (domain errors extend DomainError)
- Every AC must have at least one unit test and one e2e test

## Rules

See [common phase rules](../ai-dlc/reference/shared.md#common-phase-rules) for state updates, Jira comments, and checkpoint protocol.

Phase-specific:
- **NEVER** implement without reading the Solution Design first
- **NEVER** skip TDD — write tests first, always
- **NEVER** skip the Validate step — lint + type-check after every Green, not just at the end
- **NEVER** retry a failing test blindly — each attempt must use a different approach based on the error
- **NEVER** horizontal-slice within a wave — one test → one implementation → repeat, never test1..N then impl1..N
- **ALWAYS** use subagents for implementation — never execute inline
- **ALWAYS** commit after each Green phase
- **ALWAYS** run all tests after each wave to catch conflicts
- **ALWAYS** use existing test factories/fixtures before creating inline test data
- If the design doesn't work in practice, flag it — don't silently deviate
- If the self-correction loop exhausts 3 attempts, STOP and flag to user
