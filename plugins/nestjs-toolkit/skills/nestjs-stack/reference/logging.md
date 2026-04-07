# NestJS Logging (Pino)

## Context-First Format

```typescript
// CORRECT
this.logger.log({ userId, accountId, orderId }, 'Processing order');
this.logger.error({ error: err.message, orderId }, 'Payment failed');

// WRONG
this.logger.log('Processing order', { userId, accountId });
this.logger.log(`Processing order for user ${userId}`);
```

## Setup

- Initialize: `private readonly logger = new Logger(MyService.name);`
- Correlation ID middleware on every request
- Request logging interceptor for method/URL/status/duration

## Log Levels

| Level | When |
|---|---|
| ERROR | Unexpected failures, unhandled errors |
| WARN | Recoverable issues, degraded state |
| LOG | Business events, state changes |
| DEBUG | Troubleshooting detail |

## Never Log

Passwords, JWT tokens, PII, full request bodies in production, DB connection strings.
