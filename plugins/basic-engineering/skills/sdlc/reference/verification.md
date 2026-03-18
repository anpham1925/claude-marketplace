# Verification Patterns

Reference for the Verifier agent. Technology-specific patterns for checking that artifacts are real implementations, not stubs.

---

## Three-Level Verification

Every must-have is checked at three levels. Passing level 1 does NOT mean levels 2-3 are satisfied.

### Level 1: Exists

The file, function, endpoint, or schema is present.

```bash
# File exists
glob "src/modules/foo/handlers/bar.handler.ts"

# Symbol exists
grep "export class BarHandler" src/modules/foo/

# Route exists
grep "'/api/v1/bar'" src/apps/
```

### Level 2: Substantive

The implementation is real, not a placeholder.

**Red flags** (any of these = FAIL at level 2):
- `TODO`, `FIXME`, `HACK`, `XXX` in the implementation
- Empty function body or `return undefined`/`return null` without logic
- `console.log` or `logger.log` as the only statement in a handler
- `throw new Error('Not implemented')`
- Placeholder values: `'placeholder'`, `'TODO'`, `0` as default for business logic

**Technology-specific checks:**

| Artifact | Stub indicator |
|----------|---------------|
| API handler/controller | Returns hardcoded response, no service call |
| Service method | Empty body or just logs |
| Repository/query | Returns empty array/null without querying |
| Database migration | Empty `up()` or `down()` |
| Test file | Only `it.todo()` or `test.skip()` |
| React component | Returns `null` or `<div>TODO</div>` |
| Event handler | Only logs, no business logic |
| DTO/validation | No validation decorators or constraints |

### Level 3: Wired

The artifact is connected to the rest of the system — it's imported, called, and reachable.

**Common wiring patterns to check:**

| Integration | How to verify |
|------------|---------------|
| Handler → Service | Handler file imports and calls the service |
| Service → Repository | Service file imports and calls the repository |
| Controller → Route | Controller is registered in the module's routing |
| Module → App | Module is imported in the app module |
| Event → Handler | Event handler is registered (e.g., `@EventPattern`, `@OnEvent`) |
| Migration → Schema | Migration creates/alters the table that the entity maps to |
| DTO → Controller | Controller method parameter uses the DTO type |
| Guard → Route | Guard is applied via decorator or module config |

**How to check wiring:**
```bash
# Is the handler imported anywhere?
grep "import.*BarHandler" src/ --include="*.ts"

# Is the module registered?
grep "BarModule" src/apps/ --include="*.module.ts"

# Is the route reachable?
grep "bar" src/apps/ --include="*.controller.ts"

# Does anything call this service method?
grep "barService\.\(create\|update\|delete\)" src/ --include="*.ts"
```

**Dead export detection:**
```bash
# Find exports with zero external consumers
# If a symbol is exported but grep finds it only in its own file → dead code
```

---

## Anti-Pattern Scan

Run across ALL new/modified files (use `git diff --name-only master...HEAD`):

| Pattern | Grep | Severity |
|---------|------|----------|
| TODO/FIXME in new code | `grep -n 'TODO\|FIXME\|HACK\|XXX'` | HIGH — must be resolved |
| Empty catch | `grep -n 'catch.*{}\|catch.*{\s*}'` | HIGH — swallows errors |
| Log-only handler | Function with only `console.log`/`logger` calls | MEDIUM — no business logic |
| Hardcoded credentials | `grep -n 'password\|secret\|api.key.*=.*"'` | CRITICAL — security |
| Dead exports | Export not imported anywhere outside its file | LOW — cleanup |

---

## Verification Report Template

```markdown
## Verification Report — <identifier>

**Outcome**: PASSED | GAPS_FOUND | HUMAN_NEEDED
**Date**: <timestamp>
**Specs**: <path to specs.md>

### Must-Have Verification

| # | Must-Have | Exists | Substantive | Wired | Status |
|---|-----------|--------|-------------|-------|--------|
| 1 | <criterion from specs.md> | ✓ | ✓ | ✓ | PASS |
| 2 | <criterion> | ✓ | ✗ (stub) | — | FAIL |

### Gaps

- `src/modules/foo/bar.handler.ts:42` — handler returns hardcoded response, no service call (Level 2 fail)
- `src/modules/foo/bar.module.ts` — BarHandler not registered in providers (Level 3 fail)

### Anti-Patterns

- `src/modules/foo/baz.service.ts:15` — `// TODO: implement validation` in new code
- `src/modules/foo/error.handler.ts:8` — empty catch block

### Human Verification Needed

- Visual: verify the new dashboard widget renders correctly at different viewport sizes
- Performance: verify batch processing handles 10k+ records without timeout

### Re-verification Notes (if gap closure iteration)

- Previously failed items re-checked: <list>
- Regression check on passed items: <all still passing | issues found>
```
