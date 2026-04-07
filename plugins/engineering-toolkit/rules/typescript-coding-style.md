---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
---

# TypeScript Coding Style

- **Prefer `interface` over `type`**: Use `interface` for object shapes — they are extendable and produce better error messages
- **Use `unknown` over `any`**: Narrow with type guards instead of opting out of type safety
- **Prefer `const` assertions**: Use `as const` for literal types to preserve narrow types
- **Discriminated unions over optional properties**: Model state variants as `{ status: 'loading' } | { status: 'success', data: T }` not optional fields
- **Prefer `readonly`**: Use `readonly` arrays and properties where mutation is not needed
- **Use `satisfies` operator**: Validate types without widening — `const config = { ... } satisfies Config`
- **Template literal types**: Use for string patterns — `type Route = \`/api/${string}\``
- **No `enum`**: Use `as const` objects instead — they are tree-shakeable with no runtime cost
- **Prefer `Map`/`Set`**: Use over plain objects for dynamic keys
- **Use `using` keyword**: Apply TC39 explicit resource management for cleanup patterns
