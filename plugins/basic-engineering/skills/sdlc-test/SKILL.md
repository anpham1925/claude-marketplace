---
name: sdlc-test
description: "TRIGGER when: user says 'write e2e tests', 'test this implementation', 'add integration tests', or references the testing stage. DO NOT trigger for: full SDLC pipeline, unit tests during TDD, or other stages."
argument-hint: '[TICKET-ID]'
model: sonnet
---

> **Recommended model: Sonnet** — Test generation — systematic, pattern-following.

## Purpose

Validate the implementation through e2e and integration tests. This is the fourth stage of the SDLC pipeline but can run standalone.

## Standalone Invocation

```
/basic-engineering:sdlc-test PRT-123
```

If no ticket ID is provided, derive from the current branch name or ask the user. Expects `docs/<identifier>/prd-plans/specs.md` and implementation code to exist.

## State Tracking

Read `docs/<identifier>/STATE.md` at start (if it exists). Update Current stage, Status, Artifacts, and Notes when done. If standalone (no orchestrator), derive identifier from branch name.

## Agent: Tester

**Mission**: Validate the implementation with e2e and edge case tests.
**Model**: sonnet

**Subagent type**: Use `test-runner` if defined in `.claude/agents/`, otherwise `general-purpose`

### Inputs
- Execution plan (`specs.md`) + Implementation (code)

### Outputs
- E2e tests, edge case tests

### Responsibilities
- Write e2e tests covering acceptance criteria
- Write edge case and error path tests
- Only mock external services (never internal)
- Generate real JWT tokens for auth
- Use dynamic dates (never hardcode)
- Verify results from database, not just API responses

## Steps

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

## Parallel Execution

The Tester can start writing e2e tests as soon as the execution plan (`specs.md`) is ready and defines the API contracts. This means:
- Tester writes e2e test skeletons from contracts while Implementer is coding
- Once implementation is ready, Tester fills in any remaining details and runs tests
- This reduces total elapsed time

## Rules

- **NEVER** mock internal services — only mock external services
- **NEVER** hardcode dates — use dynamic dates
- **ALWAYS** verify results from database, not just API responses
- **ALWAYS** cover acceptance criteria with e2e tests
- **ALWAYS** include edge case and error path tests
- **ALWAYS** update STATE.md after completion
