---
name: sdlc-implement
description: "Internal stage of the sdlc pipeline — implements the solution using TDD in dependency waves. Invoke directly only via /basic-engineering:sdlc-implement when explicitly requested by name. For general requests like 'implement this' or 'start coding', use prt:sdlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for implementation decisions.

## Agent: Implementer

**Mission**: Build the solution using TDD, following the Architect's design. Organize work into dependency waves.

**Inputs**: Solution Design from Design stage
**Outputs**: Code changes with passing unit tests
**Subagent type**: `general-purpose` — each wave component gets its own subagent with fresh context

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify Design is completed. Load the Solution Design from `docs/<identifier>/prd-plans/specs.md`. See [shared reference](../sdlc/reference/shared.md) for state.md format.

### Create Branch

If not already on a feature branch, create one before starting implementation. See [SDLC shared reference](../sdlc/reference/shared.md#git-branch-naming) for branch naming convention and Helm length limit.

### Transition Ticket

Before starting implementation:

- **Move to In Progress**: Use `getTransitionsForJiraIssue` to find the transition ID for "In Progress", then call `transitionJiraIssue`.
- **Assign to current user**: Use `lookupJiraAccountId` with the user's email (ask if unknown), then call `editJiraIssue` to set the assignee.

If any Jira operation fails (transition not available, user not found, etc.), warn the user and continue — never block the workflow for a Jira update.

### Organize into Waves

Analyze the acceptance criteria and Solution Design file plan. Group components by dependency:

- **Wave 1**: Foundational components with no internal dependencies (e.g., domain models, value objects, DTOs)
- **Wave 2**: Components depending on Wave 1 (e.g., services, handlers, repositories)
- **Wave 3+**: Components depending on previous waves (e.g., controllers, integration wiring)

For small tickets (1-2 components), a single wave is fine — don't force artificial parallelism.

Present the wave plan to the user before starting.

**Wave Example** — for a ticket adding a new "refund" feature:
```
Wave 1 (parallel):  Refund entity + RefundCreatedEvent + CreateRefundCommand DTO
Wave 2 (parallel):  CreateRefundHandler + RefundRepository
Wave 3 (sequential): RefundController wiring
```

### Execute Each Wave

Within a wave, **launch parallel Implementer subagents** for independent components:
- Each subagent receives: Solution Design + relevant existing code only (not full conversation)
- Each subagent follows the TDD loop below
- Wait for all subagents in a wave to complete before starting the next wave
- After each wave, run all tests to verify no conflicts between parallel work

### TDD Loop (for each behavior within a component)

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

### Follow the Design

- Use the file structure from the Solution Design
- Implement the interfaces/contracts as defined
- Don't deviate from the design without flagging it

### Handle Deviations

- If the design doesn't work in practice, document why
- Suggest an alternative and flag to user at next checkpoint
- Don't silently change the approach

### Update Jira

Post implementation summary as a comment (see [shared reference](../sdlc/reference/shared.md) for comment format).

### Update State

After each wave completes, update `docs/<identifier>/state.md`.

## Implementation Rules

- Follow existing code patterns found during Analyze/Design
- Use existing utilities before creating new ones
- Only mock external services in tests
- Dynamic dates in all tests
- Proper logging format (context first, message second)
- Proper error handling (domain errors extend DomainError)

## Rules

- **NEVER** implement without reading the Solution Design first
- **NEVER** skip TDD — write tests first, always
- **ALWAYS** use subagents for implementation — never execute inline in the main conversation
- **ALWAYS** commit after each Green phase
- **ALWAYS** update `docs/<identifier>/state.md` after each wave
- **ALWAYS** run all tests after each wave to catch conflicts
- **ALWAYS** post a Jira comment after completing implementation
- If the design doesn't work in practice, flag it — don't silently deviate
