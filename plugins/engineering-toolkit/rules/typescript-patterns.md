---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
---

# TypeScript Patterns

- **Result pattern**: Return `{ ok: true, data } | { ok: false, error }` instead of throwing for expected failures
- **Builder pattern**: Use fluent API with `this` return type for complex object construction
- **Repository pattern**: Abstract data access behind interfaces — never import ORM entities in the application layer
- **Guard clauses**: Early returns over nested if/else
- **Barrel exports**: Use `index.ts` only at module boundaries, not within modules
- **Dependency injection**: Constructor injection with interfaces, not concrete classes
- **Zod schemas**: Derive TypeScript types from Zod schemas (`z.infer<typeof schema>`), not the reverse
- **Error boundaries**: Catch at system boundaries, let errors propagate within modules
