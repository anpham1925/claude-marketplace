---
paths:
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/*.e2e-spec.ts"
  - "**/*.e2e.spec.ts"
---

# Use Existing Test Fixtures

Before creating inline test data, search for existing factories and fixtures:

1. Search for factories in these common locations:
   - `__tests__/fixtures/` or `__test__/fixtures/`
   - `test/factories/` or `test/fixtures/`
   - Adjacent `*.factory.ts` files
2. If a factory exists for the entity you're testing, **USE IT** — don't recreate test data inline
3. Only create a new factory when no existing one covers the entity
4. New factories must follow the same pattern as existing ones in the project

## Why

- Factories encode valid domain state — inline objects often miss required fields or use invalid combinations
- When a schema changes, one factory update fixes all tests — inline objects break silently
- AI-generated test data tends toward minimal/naive objects that don't reflect real-world data shapes
