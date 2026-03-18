---
name: nestjs-stack
description: "TRIGGER when: code imports @nestjs/*, typeorm, class-validator, or user asks about NestJS patterns, error handling, guards, interceptors, DTOs, migrations, domain models, CQRS, or logging format. Also trigger when creating new modules, controllers, services, or entities. DO NOT trigger for: non-NestJS Node.js code, frontend code, or general TypeScript questions."
model: sonnet
---

Opinionated NestJS patterns for DDD + Hexagonal + CQRS projects. Before applying any topic, read its reference file in `reference/`.

## Topics

| Topic | When to Use | Reference |
|---|---|---|
| **Error Handling** | Exception filters, domain error -> HTTP mapping | `reference/error-handling.md` |
| **Config** | Environment variables, config modules, validation | `reference/config.md` |
| **Auth** | Guards, JWT strategies, RBAC | `reference/auth.md` |
| **API Design** | Endpoints, DTOs, Swagger, pagination | `reference/api-design.md` |
| **Code Structure** | Where to place code, resolving circular imports | `reference/code-structure.md` |
| **Logging** | Structured logging with Pino, correlation IDs | `reference/logging.md` |
| **Domain Model (NestJS)** | @nestjs/cqrs AggregateRoot, EventPublisher | `reference/nestjs-domain-model.md` |
| **TypeORM Migrations** | Creating database migrations | `reference/typeorm-migrations.md` |
| **TypeORM Queries** | Writing queries and transactions | `reference/typeorm-queries.md` |

## Architecture Overview

```
+------------------------------------------------------------------+
|                     PRESENTATION LAYER                            |
|  apps/ (HTTP Controllers, DTOs, Request/Response handling)        |
+------------------------------------------------------------------+
|                     APPLICATION LAYER                             |
|  modules/ (Commands, Queries, Handlers, Events)                   |
+------------------------------------------------------------------+
|                       DOMAIN LAYER                                |
|  libs/common/domain/ (Entities, Value Objects, Enums)             |
+------------------------------------------------------------------+
|                    INFRASTRUCTURE LAYER                            |
|  libs/ (Repositories, External APIs, Database, Messaging)         |
+------------------------------------------------------------------+
```

## Quick Decision Guide

```
Writing an endpoint?
  -> reference/api-design.md + reference/code-structure.md

Handling errors?
  -> reference/error-handling.md

Setting up config/env?
  -> reference/config.md

Adding authentication?
  -> reference/auth.md

Writing a database query?
  -> reference/typeorm-queries.md

Creating a migration?
  -> reference/typeorm-migrations.md

Implementing a domain model with events?
  -> reference/nestjs-domain-model.md

Adding logging?
  -> reference/logging.md
```

## Key Rules (Always Apply)

1. **Domain layer MUST NOT import HTTP exceptions** — use domain exceptions, map in filters
2. **Never access `process.env` directly** — use ConfigService
3. **Auth in guards, not in services** — domain receives validated user context
4. **DTOs for all input/output** — never expose entities directly
5. **Relative imports within modules** — path aliases across modules
6. **Context-first logging** — structured fields before message string
7. **Query hierarchy** — built-in methods first, query builder second, raw SQL last resort
8. **Release query runners** — always in a `finally` block

## Gotchas

Common failure points — if Claude keeps hitting these, the skill needs updating:

- **Throwing `HttpException` from domain layer** — Domain services must throw domain exceptions (e.g., `PayoutNotFoundException`). HTTP mapping belongs in exception filters, not business logic.
- **Using `process.env.FOO` directly** — Works in dev, breaks in test. Always use `ConfigService.get()` with a typed config namespace.
- **Forgetting `@ApiProperty()` on DTO fields** — Swagger docs will be empty. Every DTO field needs the decorator, including nested objects.
- **Circular module dependencies** — Module A imports Module B which imports Module A. Use `forwardRef()` or restructure with a shared module.
- **TypeORM migration not matching entity** — Entity has a new column but no migration. Always generate a migration after entity changes: `yarn migration:generate`.
- **Raw SQL without parameterization** — `query(\`SELECT * WHERE id = '${id}'\`)` is SQL injection. Use `query('SELECT * WHERE id = $1', [id])`.
- **Auth logic in services instead of guards** — Services receive an already-authenticated user context. If you're checking `req.user` inside a service, the guard is missing.
- **Exposing entities as API responses** — Entities have internal fields (timestamps, soft-delete flags). Always map to a response DTO.
- **Query runner not released** — `queryRunner.connect()` without a `finally { await queryRunner.release() }` leaks connections.
