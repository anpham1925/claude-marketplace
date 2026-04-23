---
paths:
  - "**/*.ts"
  - "**/*.js"
  - "**/*.py"
  - "**/*.go"
---

# Structured Logging Rules

When using structured loggers, follow the context-first pattern.

## Principles

- **Structured fields over string interpolation**: Use key-value context for searchability in log aggregators
- **Initialize logger with class/module name**: Every log should identify its source
- **Log at appropriate levels**: `error` for failures, `warn` for recoverable/degraded, `info`/`log` for normal flow, `debug` for troubleshooting
- **Never log sensitive data**: Passwords, tokens, PII, connection strings

## Anti-Patterns

- Template literals for structured data — not searchable in log aggregators
- Inconsistent log levels — everything at `info` defeats the purpose
- Missing context — log the relevant IDs (userId, orderId, etc.), not just messages

## Reference Example

```ts
// Good — structured fields, context first (Pino contract)
logger.info({ userId, orderId, amount }, 'Order cancelled');

// Bad — context buried in the message string, not queryable
logger.info(`Order cancelled for user ${userId}, order ${orderId}, $${amount}`);
```

```python
# Good — structured extra, message is a template
logger.info("order.cancelled", extra={"user_id": user_id, "order_id": order_id})

# Bad — f-string eagerly interpolates and the fields aren't structured
logger.info(f"Cancelled order {order_id} for user {user_id}")
```

```go
// Good — zap/slog style key-value context
logger.Info("order cancelled", zap.String("user_id", userID), zap.String("order_id", orderID))

// Bad — fmt.Sprintf loses the structure
logger.Info(fmt.Sprintf("Cancelled order %s for user %s", orderID, userID))
```
