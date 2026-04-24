# Reference — improve-codebase-architecture

## Dependency Categories

When assessing a candidate for deepening, classify its dependencies. The category decides the testing strategy and determines whether deepening is viable.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable — merge the modules and test directly. No adapter, no stand-in.

### 2. Local-substitutable

Dependencies with local test stand-ins (PGLite for Postgres, memfs for the filesystem, nock/msw for HTTP). Deepenable if the stand-in exists in the codebase or is easy to add. The deepened module is tested with the stand-in running in-process.

### 3. Remote-but-owned (Ports & Adapters)

Your own services across a network boundary (internal microservices, internal APIs). Define a **port** (interface) at the module boundary. The deep module owns the logic; the transport is injected. Tests use an in-memory adapter. Production uses the real HTTP/gRPC/queue adapter.

Recommendation shape:
> "Define a shared interface (port) at the module boundary, implement an HTTP adapter for production and an in-memory adapter for testing. The logic becomes one deep module even though it's deployed across a network boundary."

### 4. True external (Mock)

Third-party services (Stripe, Twilio, OAuth providers, SES) you don't control. Mock at the boundary. The deepened module takes the external dependency as an injected port; tests provide a mock implementation.

## Testing Strategy

Core principle: **replace, don't layer.**

- Old unit tests on shallow inner modules become waste once boundary tests exist — **delete them**
- New tests live at the deepened module's interface boundary
- Tests assert on observable outcomes through the public interface, not internal state
- Tests should survive internal refactors — they describe behavior, not implementation
- Layering new boundary tests on top of old inner tests doubles maintenance and mutes the refactor benefit

## Jira Ticket Template

Use this as the body of the ticket created by the skill. All sections mandatory.

```markdown
## Problem

Describe the architectural friction in durable language (contracts, responsibilities — not file paths):

- Which modules are shallow or tightly coupled, and why
- What integration risk exists in the seams between them
- Why this makes the codebase harder to navigate, test, or maintain
- Which existing tests are brittle as a consequence

## Proposed Interface

The chosen interface design:

- Interface signature (types, methods, params) — in prose or pseudo-code, not a diff
- Usage example showing how callers use it
- What complexity it hides internally
- What callers stop needing to know

## Dependency Strategy

Which category applies (see REFERENCE.md §Dependency Categories) and how dependencies are handled:

- **In-process**: merged directly
- **Local-substitutable**: tested with [specific stand-in]
- **Ports & adapters**: port definition, production adapter, test adapter
- **Mock**: mock boundary for external services

## Testing Strategy

- **New boundary tests to write**: behaviors to verify at the interface (in durable language)
- **Old tests to delete**: the shallow inner-module tests that become redundant — list by responsibility, not by path, since the refactor will rename files
- **Test environment needs**: stand-ins, adapters, fixtures required

## Implementation Recommendations

Durable architectural guidance that is NOT coupled to current file paths:

- What the module should own (responsibilities)
- What it should hide (implementation details)
- What it should expose (interface contract)
- How callers should migrate to the new interface

## Starting Points (ephemeral — may rot)

File paths the implementer should read first. Clearly marked as ephemeral — these are hints, not requirements:

- `src/path/to/existing-shallow-module.ts` — absorbed into the new module
- `src/path/to/caller.ts` — largest caller, migration reference
- `tests/path/to/old-unit-test.spec.ts` — delete after boundary tests pass

## Scope Estimate

- **Size**: Small (1-2 days) | Medium (1 week) | Large (multi-sprint)
- **Risk**: Low | Medium | High
- **Touches tests**: {count} test files affected (most to be deleted)
- **Breaking for callers**: yes/no — if yes, migration note required
```

## Common Anti-Patterns to Call Out

When presenting candidates in §3, these patterns are almost always worth deepening:

- **Data-class + service-class pairs** where the service is mostly dispatching through the data class — merge them
- **Pure-function-extracted-for-testability** where the real bugs live in the caller's orchestration
- **Adapter modules that pass through unchanged** — the adapter is taxing, not abstracting
- **Module clusters that share a single concept but 3+ types across 5+ files** — usually one aggregate in hiding

## When NOT to Recommend Deepening

- The module has multiple independent lifecycles (e.g. read-path and write-path evolve at different rates) — deepening couples them artificially
- The shallow structure is load-bearing for team-ownership boundaries (two teams own two files on purpose) — deepening creates a coordination tax
- The module is about to be rewritten or deleted — deepening is waste

If any of these apply, note them in the candidate analysis and don't recommend the refactor.
