# Stage Details

Detailed instructions for each SDLC stage.

---

## Analyze

**Agent**: Analyst
**Goal**: Turn a Jira ticket into structured, actionable requirements.

### Steps

- **Read the Jira ticket**
  ```
  Use getJiraIssue with the ticket ID
  Extract: summary, description, acceptance criteria, comments, linked issues
  ```

- **Research the codebase**
  - Launch Explore subagents to find:
    - Affected modules (search for related entities, handlers, controllers)
    - Existing similar implementations (patterns to follow)
    - Related tests (understand current test coverage)
  - Parallelize searches across different modules

- **Identify scope**
  - What exactly needs to change?
  - What must NOT change? (scope boundaries)
  - Are there dependencies on other tickets?

- **Surface ambiguities**
  - If acceptance criteria are vague, list specific open questions
  - If linked issues contradict, flag the conflict
  - If scope seems larger than a single ticket, suggest breaking down

- **Produce the Structured Requirements**
  - Use the template from agents.md
  - Be specific — "update the payout module" is too vague, "add a new handler in modules/payout/application/commands/" is actionable

- **Update Jira**
  - Transition ticket to "In Progress" (use `getTransitionsForJiraIssue` first to find the right transition ID)
  - Post requirements summary as a comment

- **CHECKPOINT** — Present to user and wait for approval

### What Good Analysis Looks Like

- Every acceptance criterion is testable (can write a test for it)
- Affected files are specific (not just "the payout module")
- Open questions have a proposed answer or suggested person to ask
- Scope boundaries are explicit

---

## Design (with Revision Loop)

**Agent**: Architect + Plan-Checker
**Goal**: Produce an implementable solution design, validated through a revision loop.

### Steps

- **Deep-dive the codebase**
  - Read the files identified in Analyze
  - Find the closest existing implementation to use as a pattern
  - Understand the current architecture of affected modules

- **Design the approach**
  - Consider 2-3 options (don't just pick the first idea)
  - Evaluate against: simplicity, consistency with existing patterns, testability
  - Recommend one approach with clear reasoning

- **Define contracts**
  - Interfaces that new code must implement
  - DTOs for new endpoints
  - Event schemas for new events
  - Database schema changes (if any)

- **Map file changes**
  - List every file that needs to be created or modified
  - For each file, describe what changes and why
  - Follow the project's architecture rules (controllers in apps/, business logic in modules/, etc.)

- **Assess risks**
  - Breaking changes?
  - Migration needed?
  - Performance implications?
  - Feature flag needed?

- **Create ADR if needed**
  - Significant architectural decisions warrant an ADR
  - Use the ADR template from engineering-foundations

- **Produce the Solution Design**
  - Use the template from agents.md
  - Include enough detail for the Implementer to start without guessing

- **Revision Loop** — Spawn a Plan-Checker agent to validate the design:
  - Does every acceptance criterion map to at least one file change?
  - Are interfaces defined in TypeScript (not just prose)?
  - Does every new file have a clear purpose and consumer?
  - Are there contradictions between the design and existing code patterns?
  - If issues found → Architect revises → Plan-Checker re-checks
  - **Max 3 iterations** — if still failing after 3, surface the issues at the checkpoint

- **Post to Jira** — Comment with design summary

- **CHECKPOINT** — Present to user and wait for approval (include any unresolved Plan-Checker issues)

### What Good Design Looks Like

- An Implementer can start coding without asking questions
- File changes are specific and follow project structure rules
- Contracts are defined in TypeScript (not just prose)
- Trade-offs are honest (every option has cons)
- Every acceptance criterion has a corresponding file change (validated by Plan-Checker)

---

## Implement

**Agent**: Implementer
**Goal**: Build the solution using TDD, following the execution plan.

### Steps

- **Read the execution plan** (`specs.md`)
  - For each task, read the `read_first` files before starting
  - Follow task order respecting `depends_on` relationships
  - Verify each task's `acceptance_criteria` after completing it

- **TDD loop** (for each task/behavior):
  - **Red** — Write a failing test
    - Test file next to the implementation file (`.spec.ts`)
    - Use AAA pattern: Arrange, Act, Assert
    - Test the specific behavior from acceptance criteria
    - Run the test — verify it fails for the right reason
  - **Green** — Write minimum code
    - Only enough code to make the test pass
    - Don't optimize or generalize yet
    - Run the test — verify it passes
  - **Refactor** — Clean up
    - Remove duplication
    - Improve naming
    - Extract functions if needed
    - Run tests — verify still green
  - **Commit** — Save progress
    - Commit after each Green phase
    - Message: `feat: [TICKET] {what behavior was added}`

- **Self-verify each task**
  - After completing a task, run its `acceptance_criteria` check (grep, test, etc.)
  - Mark the task as done in specs.md only if the check passes

### Deviation Rules

The Implementer has clear authority boundaries for handling unexpected situations:

| Rule | Situation | Action |
|------|-----------|--------|
| **Rule 1** | Bug discovered during implementation | Auto-fix, commit separately with `fix:` prefix |
| **Rule 2** | Missing error handling, validation, or security check critical to the task | Auto-add — these are implicit requirements |
| **Rule 3** | Blocking issue prevents current task from working | Auto-fix if ≤3 attempts, then document and move on |
| **Rule 4** | Architectural change, scope expansion, or design disagreement | **STOP and ask** — surface at next checkpoint |

**Scope boundary**: only fix issues directly caused by current task's changes. Don't fix pre-existing issues you happen to notice.

**Analysis Paralysis Guard**: if 5+ consecutive Read/Grep/Glob calls without any Write/Edit, you are stuck. Stop, document the specific blocker, and surface it to the orchestrator.

**Fix Attempt Limit**: max 3 auto-fix attempts per blocking issue. After 3, document the issue and move to the next task.

### Implementation Rules

- Follow existing code patterns found during Analyze/Design
- Use existing utilities before creating new ones
- Only mock external services in tests
- Dynamic dates in all tests
- Proper logging format (context first, message second)
- Proper error handling (domain errors extend DomainError)

---

## Test

**Agent**: Tester
**Goal**: Validate the implementation with e2e and edge case tests.

### Steps

- **Write e2e tests from acceptance criteria**
  - One e2e test per acceptance criterion
  - Test the full request-to-response flow
  - Verify results from database, not just API response

- **Write edge case tests**
  - Invalid input
  - Missing data
  - Unauthorized access
  - Concurrent requests (if applicable)
  - Boundary values

- **Write error path tests**
  - External service failures
  - Invalid state transitions
  - Validation failures

- **Run all tests**
  - `yarn test` — all unit tests pass
  - `yarn test:e2e` — all e2e tests pass
  - `yarn test:cov` — coverage meets threshold

### Parallel Execution

The Tester can start writing e2e tests as soon as the execution plan (`specs.md`) is ready and defines the API contracts. This means:
- Tester writes e2e test skeletons from contracts while Implementer is coding
- Once implementation is ready, Tester fills in any remaining details and runs tests
- This reduces total elapsed time

---

## Verify

**Agent**: Verifier
**Goal**: Confirm that the implementation achieves the goal, not just that tasks completed.

### Core Principle

**Task completion ≠ goal achievement.** A task can be "done" (code written, tests pass) but the goal not met (feature doesn't work end-to-end because components aren't wired together). Verify catches this.

### Steps

- **Extract must-haves**
  - Read `specs.md` — the Goal and Must-Haves are the source of truth
  - Each must-have becomes a verification target

- **Three-level artifact check** (for each must-have):

  | Level | Question | How to check |
  |-------|----------|--------------|
  | **Exists** | Is the file/function/endpoint present? | Glob for the file, grep for the symbol |
  | **Substantive** | Is it a real implementation, not a stub? | Check for TODO/FIXME, empty returns, placeholder values, log-only handlers |
  | **Wired** | Is it connected to the system? | Check imports, route registrations, DI bindings, module exports |

- **Anti-pattern scan** across all new/modified files:
  - `TODO`, `FIXME`, `HACK` in new code
  - Empty catch blocks
  - Functions that only log (no business logic)
  - Exports with zero external call sites (dead code)

- **Identify human-needed items**
  - Visual correctness, UX flow, performance under load
  - These can't be machine-verified — list them explicitly

- **Produce verification report**:
  ```
  ## Verification Report

  **Outcome**: PASSED | GAPS_FOUND | HUMAN_NEEDED

  ### Must-Have Verification
  | Must-Have | Exists | Substantive | Wired | Status |
  |-----------|--------|-------------|-------|--------|
  | <criterion> | ✓/✗ | ✓/✗ | ✓/✗ | PASS/FAIL |

  ### Gaps (if any)
  - <file:line> — <what's missing and why it matters>

  ### Anti-Patterns Found
  - <file:line> — <issue>

  ### Human Verification Needed
  - <item that needs manual checking>
  ```

- **Gap closure loop**:
  - If GAPS_FOUND → return specific gaps to Implementer → Implementer fixes → Verifier re-checks
  - On re-verification: deep check on previously failed items, quick regression check on passed items
  - **Max 2 gap-closure iterations** — after that, surface remaining gaps at the Review checkpoint

### What Good Verification Looks Like

- Every must-have checked at all 3 levels (not just "file exists")
- Gaps reference specific file:line locations (not vague descriptions)
- Human-needed items are explicit (not a catch-all for "I didn't check")
- Anti-pattern scan covers all new code, not just the happy path

See [reference/verification.md](verification.md) for technology-specific verification patterns.

---

## Review

**Agent**: Reviewer
**Goal**: Catch issues before the code leaves the developer's machine.

### Steps

- **Generate the full diff**
  - `git diff master...HEAD`

- **Review checklist** (see agents.md for full checklist):
  - Architecture compliance
  - Naming conventions
  - Import rules
  - Error handling
  - Test coverage and quality
  - Security
  - Logging format
  - Scope creep (no unnecessary changes)

- **Categorize findings**
  | Category | Action |
  |----------|--------|
  | AUTO-FIX | Fix immediately without asking |
  | NEEDS-INPUT | Present to user for decision |
  | INFO | Note for awareness, no action needed |

- **Fix and verify**
  - Auto-fix all AUTO-FIX items
  - Ask user about NEEDS-INPUT items
  - Run `yarn lint --fix`, `yarn type-check`, `yarn test` after fixes
  - Repeat until clean

- **CHECKPOINT** — Present review summary to user

---

## Release

**Agent**: Release
**Goal**: Get the code merged and deployed.

### Steps

This stage delegates to the ship-n-check skill (`/basic-engineering:ship-n-check` or project-local `/ship-n-check`):

- **Branch & Commit** — Final commit with all changes
- **Requirements Review** (blocking) — Spawn a fresh subagent to cross-check the diff against original requirements. Catches under-delivery, over-scope, and gaps. Blocks the pipeline if mismatches found.
- **Code Quality Review** — Self-review, lint, type-check, test
- **Push & PR** — Create draft PR
- **CI/CD** — Watch pipeline, fix failures
- **Staging** — Verify deployment
- **Open PR** — Mark ready for review
- **Address Reviews** — Handle feedback

### Jira Updates

- Post PR link as comment on the Jira ticket
- When PR is merged: transition ticket to "Done" (or appropriate final status)

---

## Resuming a Pipeline

If you've already completed some stages (check STATE.md first):

| Current state | Command | What happens |
|---------------|---------|--------------|
| Have requirements, need design | `/basic-engineering:sdlc design` | Starts from Design |
| Have design, need implementation | `/basic-engineering:sdlc implement` | Starts from Implement |
| Code written, need verification | `/basic-engineering:sdlc verify` | Starts from Verify |
| Code verified, need review | `/basic-engineering:sdlc review` | Starts from Review |
| Code reviewed, need to ship | `/basic-engineering:sdlc release` | Starts from Release |
| Need to redo analysis | `/basic-engineering:sdlc analyze TICKET` | Restarts from Analyze |
