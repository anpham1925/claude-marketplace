---
paths:
  - "**/*.ts"
  - "**/*.js"
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.py"
  - "**/*.go"
  - "**/*.rs"
---

# Naming Conventions

## General Principles

- **Be specific**: Names should describe the single responsibility
- **No generic names**: Avoid vague class names like "Service", "Manager", "Helper" without a specific prefix
- **Consistent casing**: Follow the language's conventions
- **Functions**: State-changing → use verbs (`processItem`, `activateUser`). Value-returning → use nouns or `get`/`is`/`has`

## No Generic Names

If you can't name it with a specific verb describing its single responsibility, the class is doing too much.

| Don't Use | Use Instead | Why |
|---|---|---|
| `PayoutService` | `PayoutItemProcessor` | Describes its single responsibility |
| `UserService` | `UserRegistrationHandler` | Specific about what it does |
| `AccountHelper` | `AccountSuspensionHandler` | Clear bounded purpose |

## Code Style

- No superfluous comments — code should be self-documenting
- Action comments encouraged: `TODO`, `FIXME`, `HACK`, `NOTE` with context
- Comments explain WHY, not WHAT

## Reference Example

```ts
// Good — verb-led, single responsibility, WHY comment
export class OrderCancellationHandler {
  // Stripe webhook can arrive before our DB write commits; re-queue on miss.
  async handle(cmd: CancelOrderCommand) { /* ... */ }
}

// Bad — generic suffix, no responsibility signal, WHAT comment
export class OrderService {
  // Cancels an order
  async cancel(id: string) { /* ... */ }
}
```

```python
# Good — verb-led function, single responsibility
def cancel_order(order_id: OrderId) -> CancelledOrder: ...

# Bad — generic, hides what the function actually does
def process_order(order_id: str) -> dict: ...
```
