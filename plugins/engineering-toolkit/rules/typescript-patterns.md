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

## Reference Example

```ts
// Good — Result pattern for expected failures, guard clauses
async function cancelOrder(id: string): Promise<OrderResult> {
  const order = await repo.findById(id);
  if (!order) return { ok: false, reason: 'NOT_FOUND' };
  if (order.isCancelled()) return { ok: false, reason: 'ALREADY_CANCELLED' };

  order.cancel();
  await repo.save(order);
  return { ok: true, order };
}

// Good — Zod schema is the source of truth, type is derived
const OrderSchema = z.object({ id: z.string().uuid(), total: z.number().positive() });
type Order = z.infer<typeof OrderSchema>;

// Bad — throwing for expected failures forces every caller into try/catch
async function cancelOrderBad(id: string): Promise<Order> {
  const order = await repo.findById(id);
  if (!order) throw new Error('not found');
  // ...
}
```
