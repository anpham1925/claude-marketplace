# NestJS Code Structure (DDD + Hexagonal + CQRS)

## Code Placement Decision Tree

```
HTTP controller/endpoint?         -> presentation layer (apps/)
Business logic (handler/command)? -> application/domain layer (modules/)
External API client / DB adapter? -> infrastructure layer (libs/)
Shared utility?                   -> common library (libs/common/)
Shared domain enum/type/event?    -> common domain library
```

## DDD Module Structure

```
modules/<domain>/
├── application/
│   ├── commands/         # Command definitions
│   ├── queries/          # Query definitions
│   ├── handlers/         # Command/Query handlers
│   ├── event-handlers/   # Domain event handlers
│   └── dtos/             # Data Transfer Objects
├── domain/               # For complex domains
│   ├── entities/         # Rich domain models
│   ├── events/           # Domain events
│   └── exceptions/       # Domain-specific exceptions
├── infrastructure/
│   ├── <domain>.factory.ts
│   └── <domain>-domain.repository.ts
└── index.ts              # Barrel export for external consumers
```

## Import Rules

| Context | Rule |
|---|---|
| Within Same Module | Relative: `./service.ts` |
| Cross-Module | Alias: `@modules/other-module` |
| From libs | Alias: `@lib/common` |
| Barrel Exports | Only for external consumption, never within same module |

## NestJS DI Rule

When adding a service to a constructor, IMMEDIATELY update module imports.

## Circular Dependency Fix

- Switch to relative imports within same module
- Import constants directly from source files
- Check for self-import through barrel export
