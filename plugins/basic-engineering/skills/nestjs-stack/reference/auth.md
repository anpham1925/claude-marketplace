# NestJS Authentication & Authorization

## Architecture

```
Request -> AuthGuard (JWT) -> RolesGuard (authz) -> Controller -> Service
              |                    |
         Reject 401          Reject 403
```

## Key Patterns

- **JwtStrategy**: `PassportStrategy(Strategy)` with `validate()` returning user context
- **JwtAuthGuard**: Global guard with `@Public()` bypass via Reflector
- **RolesGuard**: Checks `@Roles()` metadata against `request.user.roles`
- **@CurrentUser()**: `createParamDecorator` to extract user from request

## Rules

1. Auth in guards, not controllers or services
2. Decorators for authorization (`@Roles()`, `@Public()`)
3. Separate authn from authz — different guards
4. Domain layer receives validated user context, never verifies tokens
5. Token secrets from ConfigService, not hardcoded

## Common Mistakes

| Mistake | Fix |
|---|---|
| Manual `req.headers.authorization` | `JwtAuthGuard` + `@CurrentUser()` |
| Hardcoded JWT secret | `ConfigService.getOrThrow()` |
| Inline role checks | `@Roles()` + `RolesGuard` |
| Missing `@Public()` on login | Mark public routes explicitly |
