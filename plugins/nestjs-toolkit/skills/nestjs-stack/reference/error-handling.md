# NestJS Error Handling

## Principles

- **Separate domain errors from HTTP errors**: Domain throws domain exceptions, presentation maps them
- **Use exception filters**: Let NestJS catch and transform consistently
- **Consistent error shapes**: Every error response follows the same structure
- **Never expose internals**: Stack traces and SQL errors stay in logs

**Rule:** Domain and Application layers MUST NOT import `@nestjs/common` HTTP exceptions.

## Domain Exception Pattern

Location: `modules/<domain>/domain/exceptions/`

```typescript
export abstract class DomainException extends Error {
  abstract readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class OrderNotFoundException extends DomainException {
  readonly code = 'ORDER_NOT_FOUND';
  constructor(orderId: number) {
    super(`Order ${orderId} not found`);
  }
}
```

## Exception Filter

```typescript
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly statusMap: Record<string, HttpStatus> = {
    ORDER_NOT_FOUND: HttpStatus.NOT_FOUND,
    INVALID_STATE_TRANSITION: HttpStatus.CONFLICT,
    BUSINESS_RULE_VIOLATION: HttpStatus.UNPROCESSABLE_ENTITY,
  };

  catch(exception: DomainException, host: ArgumentsHost) {
    const status = this.statusMap[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    // Log, then return consistent shape
  }
}
```

## Error-to-HTTP Mapping

| Domain Error | HTTP Status | When |
|---|---|---|
| Not found | 404 | Entity doesn't exist |
| Invalid state transition | 409 | State machine violation |
| Business rule violation | 422 | Domain invariant broken |
| Insufficient permissions | 403 | Domain-level auth |
| Duplicate | 409 | Uniqueness constraint |
