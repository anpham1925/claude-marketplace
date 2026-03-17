# Stage Details

Detailed instructions for each SDLC stage.

---

## Analyze

**Agent**: Analyst
**Goal**: Turn a Jira ticket into structured, actionable requirements.

### Steps

1. **Read the Jira ticket**
   ```
   Use getJiraIssue with the ticket ID
   Extract: summary, description, acceptance criteria, comments, linked issues
   ```

2. **Research the codebase**
   - Launch Explore subagents to find:
     - Affected modules (search for related entities, handlers, controllers)
     - Existing similar implementations (patterns to follow)
     - Related tests (understand current test coverage)
   - Parallelize searches across different modules

3. **Identify scope**
   - What exactly needs to change?
   - What must NOT change? (scope boundaries)
   - Are there dependencies on other tickets?

4. **Surface ambiguities**
   - If acceptance criteria are vague, list specific open questions
   - If linked issues contradict, flag the conflict
   - If scope seems larger than a single ticket, suggest breaking down

5. **Produce the Structured Requirements**
   - Use the template from agents.md
   - Be specific — "update the payout module" is too vague, "add a new handler in modules/payout/application/commands/" is actionable

6. **Update Jira**
   - Transition ticket to "In Progress" (use `getTransitionsForJiraIssue` first to find the right transition ID)
   - Post requirements summary as a comment

7. **CHECKPOINT** — Present to user and wait for approval

### What Good Analysis Looks Like

- Every acceptance criterion is testable (can write a test for it)
- Affected files are specific (not just "the payout module")
- Open questions have a proposed answer or suggested person to ask
- Scope boundaries are explicit

---

## Design

**Agent**: Architect
**Goal**: Produce an implementable solution design.

### Steps

1. **Deep-dive the codebase**
   - Read the files identified in Analyze
   - Find the closest existing implementation to use as a pattern
   - Understand the current architecture of affected modules

2. **Design the approach**
   - Consider 2-3 options (don't just pick the first idea)
   - Evaluate against: simplicity, consistency with existing patterns, testability
   - Recommend one approach with clear reasoning

3. **Define contracts**
   - Interfaces that new code must implement
   - DTOs for new endpoints
   - Event schemas for new events
   - Database schema changes (if any)

4. **Map file changes**
   - List every file that needs to be created or modified
   - For each file, describe what changes and why
   - Follow the project's architecture rules (controllers in apps/, business logic in modules/, etc.)

5. **Assess risks**
   - Breaking changes?
   - Migration needed?
   - Performance implications?
   - Feature flag needed?

6. **Create ADR if needed**
   - Significant architectural decisions warrant an ADR
   - Use the ADR template from engineering-foundations

7. **Produce the Solution Design**
   - Use the template from agents.md
   - Include enough detail for the Implementer to start without guessing

8. **Post to Jira** — Comment with design summary

9. **CHECKPOINT** — Present to user and wait for approval

### What Good Design Looks Like

- An Implementer can start coding without asking questions
- File changes are specific and follow project structure rules
- Contracts are defined in TypeScript (not just prose)
- Trade-offs are honest (every option has cons)

---

## Implement

**Agent**: Implementer
**Goal**: Build the solution using TDD.

### Steps

1. **Order the work**
   - Sort acceptance criteria by dependency (build foundations first)
   - Identify the simplest behavior to start with

2. **TDD loop** (for each behavior):
   a. **Red** — Write a failing test
      - Test file next to the implementation file (`.spec.ts`)
      - Use AAA pattern: Arrange, Act, Assert
      - Test the specific behavior from acceptance criteria
      - Run the test — verify it fails for the right reason
   b. **Green** — Write minimum code
      - Only enough code to make the test pass
      - Don't optimize or generalize yet
      - Run the test — verify it passes
   c. **Refactor** — Clean up
      - Remove duplication
      - Improve naming
      - Extract functions if needed
      - Run tests — verify still green
   d. **Commit** — Save progress
      - Commit after each Green phase
      - Message: `feat: [TICKET] {what behavior was added}`

3. **Follow the design**
   - Use the file structure from the Solution Design
   - Implement the interfaces/contracts as defined
   - Don't deviate from the design without flagging it

4. **Handle deviations**
   - If the design doesn't work in practice, document why
   - Suggest an alternative and flag to user at next checkpoint
   - Don't silently change the approach

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

1. **Write e2e tests from acceptance criteria**
   - One e2e test per acceptance criterion
   - Test the full request-to-response flow
   - Verify results from database, not just API response

2. **Write edge case tests**
   - Invalid input
   - Missing data
   - Unauthorized access
   - Concurrent requests (if applicable)
   - Boundary values

3. **Write error path tests**
   - External service failures
   - Invalid state transitions
   - Validation failures

4. **Run all tests**
   - `yarn test` — all unit tests pass
   - `yarn test:e2e` — all e2e tests pass
   - `yarn test:cov` — coverage meets threshold

### Parallel Execution

The Tester can start writing e2e tests as soon as the Solution Design (Design stage) defines the API contracts. This means:
- Tester writes e2e test skeletons from contracts while Implementer is coding
- Once implementation is ready, Tester fills in any remaining details and runs tests
- This reduces total elapsed time

---

## Review

**Agent**: Reviewer
**Goal**: Catch issues before the code leaves the developer's machine.

### Steps

1. **Generate the full diff**
   - `git diff master...HEAD`

2. **Review checklist** (see agents.md for full checklist):
   - Architecture compliance
   - Naming conventions
   - Import rules
   - Error handling
   - Test coverage and quality
   - Security
   - Logging format
   - Scope creep (no unnecessary changes)

3. **Categorize findings**
   | Category | Action |
   |----------|--------|
   | AUTO-FIX | Fix immediately without asking |
   | NEEDS-INPUT | Present to user for decision |
   | INFO | Note for awareness, no action needed |

4. **Fix and verify**
   - Auto-fix all AUTO-FIX items
   - Ask user about NEEDS-INPUT items
   - Run `yarn lint --fix`, `yarn type-check`, `yarn test` after fixes
   - Repeat until clean

5. **CHECKPOINT** — Present review summary to user

---

## Release

**Agent**: Release
**Goal**: Get the code merged and deployed.

### Steps

This stage delegates to the ship-n-check skill (`/basic-engineering:ship-n-check` or project-local `/ship-n-check`):

1. **Branch & Commit** — Final commit with all changes
2. **Requirements Review** (blocking) — Spawn a fresh subagent to cross-check the diff against original requirements. Catches under-delivery, over-scope, and gaps. Blocks the pipeline if mismatches found.
3. **Code Quality Review** — Self-review, lint, type-check, test
4. **Push & PR** — Create draft PR
5. **CI/CD** — Watch pipeline, fix failures
6. **Staging** — Verify deployment
7. **Open PR** — Mark ready for review
8. **Address Reviews** — Handle feedback

### Jira Updates

- Post PR link as comment on the Jira ticket
- When PR is merged: transition ticket to "Done" (or appropriate final status)

---

## Resuming a Pipeline

If you've already completed some stages:

| Current state | Command | What happens |
|---------------|---------|--------------|
| Have requirements, need design | `/basic-engineering:sdlc design` | Starts from Design |
| Have design, need implementation | `/basic-engineering:sdlc implement` | Starts from Implement |
| Code written, need review | `/basic-engineering:sdlc review` | Starts from Review |
| Code reviewed, need to ship | `/basic-engineering:sdlc release` | Starts from Release |
| Need to redo analysis | `/basic-engineering:sdlc analyze TICKET` | Restarts from Analyze |
