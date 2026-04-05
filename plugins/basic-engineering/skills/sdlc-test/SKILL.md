---
name: sdlc-test
description: "Internal stage of the sdlc pipeline — writes e2e and edge case tests validating acceptance criteria. Invoke directly only via /basic-engineering:sdlc-test when explicitly requested by name. For general requests like 'write tests' or 'add integration tests', use prt:sdlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

## Agent: Tester

**Mission**: Validate the implementation with e2e and edge case tests.

**Inputs**: Solution Design (contracts) + Implementation (code)
**Outputs**: E2e tests, edge case tests
**Subagent type**: Use `test-runner` if defined in `.claude/agents/`, otherwise `general-purpose`

**Can run in parallel with Implementer** once the Architect's contracts are defined.

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify Design is completed (Implement may still be in progress if running in parallel). See [shared reference](../sdlc/reference/shared.md) for state.md format.

### Write E2E Tests from Acceptance Criteria

- One e2e test per acceptance criterion
- Test the full request-to-response flow
- Verify results from database, not just API response

### Write Edge Case Tests

- Invalid input
- Missing data
- Unauthorized access
- Concurrent requests (if applicable)
- Boundary values

### Write Error Path Tests

- External service failures
- Invalid state transitions
- Validation failures

### Run All Tests

- `yarn test` — all unit tests pass
- `yarn test:e2e` — all e2e tests pass
- `yarn test:cov` — coverage meets threshold

### Update Jira

Post test summary as a comment (see [shared reference](../sdlc/reference/shared.md) for comment format).

### Update State

Update `docs/<identifier>/state.md` — mark Test as completed.

## Parallel Execution

The Tester can start writing e2e tests as soon as the Solution Design (Design stage) defines the API contracts:
- Tester writes e2e test skeletons from contracts while Implementer is coding
- Once implementation is ready, Tester fills in remaining details and runs tests
- This reduces total elapsed time

## Testing Rules

- Only mock external services — never mock internal modules
- Dynamic dates in all tests (never hardcode)
- Use AAA pattern: Arrange, Act, Assert
- Generate real JWT tokens for auth tests
- Verify results from database state, not just API responses

## Rules

- **ALWAYS** write at least one e2e test per acceptance criterion
- **ALWAYS** cover error paths and edge cases, not just happy paths
- **ALWAYS** run the full test suite before marking Test as completed
- **ALWAYS** update `docs/<identifier>/state.md`
- **ALWAYS** post a Jira comment after completing testing
