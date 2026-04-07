---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "**/*.spec.js"
  - "**/*.test.js"
  - "**/*.test.py"
  - "**/*_test.go"
  - "**/*.e2e.spec.ts"
  - "**/*.e2e-spec.ts"
  - "**/*_test.rs"
  - "**/*.test.tsx"
  - "**/*.spec.tsx"
---

# Testing Rules

- **TDD**: Write tests before implementation. Red-Green-Refactor cycle.
- **Coverage**: 70% minimum for new code
- **Only mock at system boundaries**: Never mock internal services, handlers, or repositories
- **Never hardcode dates**: Use dynamic date generation so tests pass in future years
- **AAA pattern**: Arrange, Act, Assert in every test
- **Test behavior, not implementation**: Focus on what the method does, not how
- **Never modify existing tests to fix failures**: Fix the application logic instead
- **Verify from the data store**: Don't just check the API response — verify persistence
