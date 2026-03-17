---
name: nestjs-stack
description: NestJS patterns — error handling, config, auth, API design, code structure, logging, domain models, TypeORM. Use when working with NestJS, designing APIs, handling errors, writing queries, or structuring code.
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
