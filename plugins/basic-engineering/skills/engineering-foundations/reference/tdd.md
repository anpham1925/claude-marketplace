# Test-Driven Development

## Red-Green-Refactor Cycle

1. **Red** — Write a failing test first that describes the expected behavior
2. **Green** — Write the minimum implementation to make the test pass
3. **Refactor** — Clean up code while keeping tests green
4. **Repeat** — Pick the next behavior and start a new cycle

## When to Apply TDD

| Apply TDD | Skip TDD |
|---|---|
| New business logic / domain rules | Wiring-only code (module imports, DI) |
| Bug fixes (write test that repros) | Simple config changes |
| State transitions | Renaming / reformatting |
| Validation logic | Auto-generated code |
| Complex calculations | |

## Core Rules

1. **Arrange-Act-Assert pattern** in every test
2. **Never hardcode dates** — use dynamic date generation
3. **Test behavior, not implementation** — focus on what, not how
4. **Never modify tests to fix CI failures** — fix the application logic instead
5. **Only mock at system boundaries** — mock external services, not internal modules

## Unit Test Guidelines

- Coverage target: 70% minimum for new code
- Match mock signatures to actual constructor parameters
- Test edge cases and error paths, not just happy path

### What to Test vs What NOT to Test

| Test | Don't Test |
|---|---|
| Service methods with business logic | Simple getters/setters |
| Complex calculations | ORM/framework methods |
| Error handling and edge cases | Framework code itself |
| Validation logic | |

## E2E Test Guidelines

- **Only mock external services**: Never mock internal services, handlers, guards, or repositories
- **Test the full request-to-response flow**: That's the whole point
- **Verify from the database**: Don't just check API response — verify persistence
- **Generate real auth tokens**: Don't mock auth middleware

### What to Mock in E2E

| ONLY Mock | NEVER Mock |
|---|---|
| External payment/third-party APIs | Internal services |
| External auth providers | Command/Event handlers |
| External feature flag services | Guards and strategies |
| | Database repositories |

## Dynamic Date Patterns

**CRITICAL: Never hardcode dates in tests.**

```
const now = new Date();
const currentYear = now.getFullYear();
const nextYear = currentYear + 1;
const lastYear = currentYear - 1;

const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
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
