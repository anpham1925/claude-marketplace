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
- **Template literal types**: Use for string patterns — `type Route = `/api/${string}``
- **No `enum`**: Use `as const` objects instead — they are tree-shakeable with no runtime cost
- **Prefer `Map`/`Set`**: Use over plain objects for dynamic keys
- **Use `using` keyword**: Apply TC39 explicit resource management for cleanup patterns

## Reference Example

```ts
// Good — `as const` object (tree-shakeable, no runtime enum cost)
export const OrderStatus = {
  Pending: 'PENDING',
  Cancelled: 'CANCELLED',
  Fulfilled: 'FULFILLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// Good — discriminated union over optional fields
type OrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: 'NOT_FOUND' | 'ALREADY_CANCELLED' };

// Bad — TS enum (emits runtime object, not tree-shaken) + optionals for state
enum Status { Pending, Cancelled, Fulfilled }
type BadResult = { ok: boolean; order?: Order; reason?: string };
```
