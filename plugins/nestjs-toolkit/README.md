# nestjs-toolkit

NestJS-specific implementation of DDD, Hexagonal Architecture, and CQRS patterns.

> **Note**: For language-agnostic DDD/architecture theory (aggregates, domain events, architecture layers, TDD), use `engineering-toolkit:engineering-foundations`. This plugin covers the NestJS-specific **how** — `@nestjs/cqrs`, TypeORM, module structure, NestJS DI.

## Install

```bash
/plugin install nestjs-toolkit@anpham-marketplace
```

## Usage

The skill triggers automatically when Claude detects NestJS code (imports from `@nestjs/`, TypeORM, etc.) or when you ask about NestJS patterns.

```bash
# Explicit invocation
/nestjs-toolkit:nestjs-stack

# Auto-triggers on questions like:
# "where should I put this code?"
# "how to structure this module?"
# "add an auth guard"
# "write a TypeORM migration"
```

## Reference Topics (9)

| Topic | What It Covers |
|---|---|
| **Code Structure** | Module layout, code placement tree, DDD layers |
| **API Design** | REST conventions, DTOs, Swagger annotations |
| **Error Handling** | Domain errors, error hierarchy, HTTP mapping |
| **TypeORM Queries** | Repository patterns, query builders, N+1 prevention |
| **TypeORM Migrations** | Migration workflow, safe patterns, rollback |
| **Auth** | Guards, JWT, API keys, composed auth |
| **Config** | Environment variables, validation, typed config |
| **Domain Model** | Aggregates, entities, value objects, domain events |
| **Logging** | Structured logging, context-first, correlation IDs |

References are loaded on-demand — only the relevant topic is read when needed.
