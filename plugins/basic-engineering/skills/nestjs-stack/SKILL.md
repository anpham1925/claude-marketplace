---
name: nestjs-stack
description: NestJS architecture patterns and conventions for DDD + Hexagonal + CQRS projects. Use when writing NestJS code, designing APIs, handling errors, structuring modules, writing TypeORM queries or migrations, adding auth guards, configuring environment variables, or adding structured logging. Also use for questions about code placement, module structure, or domain model implementation in NestJS. Triggers for NestJS, DDD, hexagonal architecture, CQRS, TypeORM migration, API design, error handling patterns, config modules, auth guards, structured logging, "where should I put this code", "how to structure this module".
model: sonnet
---

Partnership Engineering's opinionated NestJS patterns for DDD + Hexagonal + CQRS projects. Before applying any topic, read its reference file in `reference/`.

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

## Gotchas

Claude-specific failure modes in NestJS codebases:

- **Throwing `HttpException` from domain/application layer** — Claude defaults to HTTP exceptions everywhere. Domain layer must throw domain-specific exceptions; the exception filter maps them to HTTP responses.
- **Using `process.env.X` instead of ConfigService** — Claude reaches for `process.env` out of habit. Always inject `ConfigService` and use `.get()`.
- **Putting auth logic in services** — Claude tends to add `if (!user.isAdmin)` checks inside service methods. Auth belongs in guards; services receive already-validated context.
- **Returning entities directly from controllers** — Claude skips DTO mapping when "it's the same shape anyway." Always use response DTOs, even if they mirror the entity — the contract must be explicit.
- **Circular imports between modules** — Claude creates circular dependencies when wiring cross-module services. Use `forwardRef()` as last resort; prefer restructuring.
- **Logging message-first instead of context-first** — Claude writes `logger.log('User created', { userId })` instead of `logger.log({ userId }, 'User created')`. Pino expects context object first.
- **Raw SQL when QueryBuilder suffices** — Claude jumps to raw SQL for anything beyond `.find()`. Follow the hierarchy: built-in methods > QueryBuilder > raw SQL.
- **Forgetting to release QueryRunner** — Must always release in a `finally` block. Claude sometimes puts `release()` only in the happy path.
- **Importing from other module's internal paths** — Use the module's public API (barrel exports), not deep `../other-module/internal/file` imports.

## Key Rules (Always Apply)

- **Domain layer MUST NOT import HTTP exceptions** — use domain exceptions, map in filters
- **Never access `process.env` directly** — use ConfigService
- **Auth in guards, not in services** — domain receives validated user context
- **DTOs for all input/output** — never expose entities directly
- **Relative imports within modules** — path aliases across modules
- **Context-first logging** — structured fields before message string
- **Query hierarchy** — built-in methods first, query builder second, raw SQL last resort
- **Release query runners** — always in a `finally` block
