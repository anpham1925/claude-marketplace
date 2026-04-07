# Test-Driven Development

> Claude already knows TDD basics. This file covers **our specific conventions and the mistakes Claude makes most often**.

## When to Apply TDD

| Apply TDD | Skip TDD |
|---|---|
| New business logic / domain rules | Wiring-only code (module imports, DI) |
| Bug fixes (write test that repros) | Simple config changes |
| State transitions | Renaming / reformatting |
| Validation logic | Auto-generated code |
| Complex calculations | |

## Our Conventions (Where We Differ from Defaults)

- **Coverage target: 70% minimum** for new code
- **Test file co-location** — `.spec.ts` next to the implementation file, not in a separate `__tests__/` directory
- **Dynamic dates only** — see patterns below. This is the #1 failure mode.
- **Never modify existing tests to fix failures** — fix the application logic. Only change tests if requirements changed.
- **Only mock at system boundaries** — external APIs, not internal modules. Claude over-mocks by default.

## Dynamic Date Patterns

**CRITICAL: Never hardcode dates in tests.** Claude does this constantly.

```typescript
// WRONG — will break in a different year/month
const date = new Date('2024-01-15');

// RIGHT — always relative to now
const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);
const nextYear = now.getFullYear() + 1;
```

## E2E Test Conventions

These are the most common mistakes Claude makes in e2e tests:

| ONLY Mock | NEVER Mock |
|---|---|
| External payment/third-party APIs | Internal services |
| External auth providers | Command/Event handlers |
| External feature flag services | Guards and strategies |
| | Database repositories |

- **Generate real auth tokens** — don't mock auth middleware
- **Verify from database** — don't just check API response, query the DB to confirm persistence
- **Test the full request-to-response flow** — that's the point of e2e

## Mock Signature Rule

Match mock signatures to actual constructor parameters. Claude frequently creates mocks with wrong parameter shapes, causing confusing runtime errors.

```typescript
// WRONG — missing parameters the real constructor expects
const mockService = { findOne: jest.fn() };

// RIGHT — match the actual interface
const mockService: jest.Mocked<UserService> = {
  findOne: jest.fn(),
  create: jest.fn(),
  // ... all methods from the interface
};
```

## Checklists

### Unit Test Checklist

- [ ] Tests cover all new public methods and edge cases
- [ ] Mocks match actual constructor signatures
- [ ] No hardcoded dates
- [ ] All tests pass
- [ ] Did NOT modify existing tests to fix failures

### E2E Test Checklist

- [ ] Only external services mocked
- [ ] Generated valid auth tokens
- [ ] No hardcoded dates
- [ ] Verified data from database
- [ ] Did NOT modify existing e2e tests to fix failures
