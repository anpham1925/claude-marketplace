---
name: sdlc-implement
description: "TRIGGER when: user says 'implement this', 'start coding', 'build the solution', 'TDD', or references the implementation stage. DO NOT trigger for: full SDLC pipeline, analyze, design, or other stages."
argument-hint: '[TICKET-ID]'
model: sonnet
---

> **Recommended model: Sonnet** — Code generation — high volume, pattern-following.

## Purpose

Build the solution using TDD, following the execution plan. This is the third stage of the SDLC pipeline but can run standalone.

## Standalone Invocation

```
/basic-engineering:sdlc-implement PRT-123
```

If no ticket ID is provided, derive from the current branch name or ask the user. Expects `docs/<identifier>/prd-plans/specs.md` to exist.

## State Tracking

Read `docs/<identifier>/STATE.md` at start (if it exists). Update Current stage, Status, Artifacts, and Notes when done. If standalone (no orchestrator), derive identifier from branch name.

## Agent: Implementer

**Mission**: Build the solution using TDD, following the execution plan.
**Model**: sonnet

**Subagent type**: `general-purpose` (multi-step implementation)

### Inputs
- Execution plan (`specs.md`) with task breakdown

### Outputs
- Code changes with passing unit tests

### Responsibilities
- Read each task's `read_first` files before starting
- Execute the concrete `action` for each task
- Follow TDD: Red -> Green -> Refactor for each behavior
- Verify each task's `acceptance_criteria` after completing it
- Commit after each Green phase
- Follow codebase conventions (naming, imports, error handling, logging)
- Apply deviation rules (auto-fix bugs/security, STOP for architectural changes)

## Steps

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

## Deviation Rules

The Implementer has clear authority boundaries for handling unexpected situations:

| Rule | Situation | Action |
|------|-----------|--------|
| **Rule 1** | Bug discovered during implementation | Auto-fix, commit separately with `fix:` prefix |
| **Rule 2** | Missing error handling, validation, or security check critical to the task | Auto-add — these are implicit requirements |
| **Rule 3** | Blocking issue prevents current task from working | Auto-fix if ≤3 attempts, then document and move on |
| **Rule 4** | Architectural change, scope expansion, or design disagreement | **STOP and ask** — surface at next checkpoint |

**Scope boundary**: only fix issues directly caused by current task's changes. Don't fix pre-existing issues you happen to notice.

## Guards

- **Analysis Paralysis Guard**: if 5+ consecutive Read/Grep/Glob calls without any Write/Edit, you are stuck. Stop, document the specific blocker, and surface it to the orchestrator.
- **Fix Attempt Limit**: max 3 auto-fix attempts per blocking issue. After 3, document the issue and move to the next task.

## Implementation Rules

- Follow existing code patterns found during Analyze/Design
- Use existing utilities before creating new ones
- Only mock external services in tests
- Dynamic dates in all tests
- Proper logging format (context first, message second)
- Proper error handling (domain errors extend DomainError)

## Rules

- **NEVER** implement without an execution plan (`specs.md`)
- **NEVER** skip TDD — write tests first
- **ALWAYS** read `read_first` files before starting each task
- **ALWAYS** verify `acceptance_criteria` after each task
- **ALWAYS** commit after each Green phase
- **ALWAYS** follow existing codebase patterns
- **ALWAYS** update STATE.md after completion
- If stuck (5+ reads without writing), **STOP** and surface the blocker
- If a blocking issue persists after 3 fix attempts, document and move on
