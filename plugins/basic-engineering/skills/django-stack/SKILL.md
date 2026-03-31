---
name: django-stack
description: "TRIGGER when: code imports from 'django', 'rest_framework', 'celery', or user asks about Django patterns, DRF, Django ORM, migrations, signals, middleware, or Django project structure. Also trigger when creating new models, views, serializers, or management commands. DO NOT trigger for: generic Python questions without Django context, Flask, or FastAPI."
model: sonnet
---

> **Recommended model: Sonnet** — Pattern application and code generation.

Opinionated Django + DRF patterns. Before applying any topic, read its reference file in `reference/`.

## When to Apply

This skill auto-triggers when working in a Django codebase. Apply these patterns:

1. **Models & ORM** → Read `reference/models.md`
2. **Views & DRF** → Read `reference/views-drf.md`
3. **Security** → Read `reference/security.md`
4. **Testing** → Read `reference/testing.md`
5. **Performance** → Read `reference/performance.md`

## Architecture Overview

```
project/
├── config/                    # Project config (settings, urls, wsgi, asgi)
│   ├── settings/
│   │   ├── base.py           # Shared settings
│   │   ├── local.py          # Development overrides
│   │   ├── production.py     # Production overrides
│   │   └── test.py           # Test overrides
│   ├── urls.py               # Root URL config
│   └── celery.py             # Celery app config
├── apps/
│   └── <app_name>/
│       ├── models/            # Domain models (split when >200 lines)
│       ├── views/             # Views or ViewSets
│       ├── serializers/       # DRF serializers
│       ├── services/          # Business logic (not in views or models)
│       ├── selectors/         # Complex query logic
│       ├── tasks/             # Celery tasks
│       ├── signals/           # Signal handlers
│       ├── admin.py           # Admin configuration
│       ├── urls.py            # App URL config
│       └── tests/
│           ├── test_models.py
│           ├── test_views.py
│           └── test_services.py
├── common/                    # Shared utilities, base classes, mixins
└── manage.py
```

## Key Rules

| Rule | Why |
|---|---|
| Business logic in services, not views | Views handle HTTP; services handle business rules |
| Fat models are OK for model-specific logic | `Order.can_cancel()` belongs on the model |
| Services for cross-model logic | `OrderService.place_order()` coordinates models |
| Selectors for complex queries | Keep querysets out of views — `UserSelector.active_premium()` |
| Never raw SQL unless ORM can't express it | ORM prevents injection and handles escaping |
| Explicit is better than implicit | Avoid magic — prefer explicit field lists over `__all__` |
| Migrations are immutable in production | Never edit a migration that's been applied — create a new one |
| Signals are a last resort | Prefer explicit calls in services over signals (signals hide control flow) |

## Quick Reference

```
Need to create/modify a model?
  → Read reference/models.md

Need to create an API endpoint?
  → Read reference/views-drf.md

Need to handle security?
  → Read reference/security.md

Need to write tests?
  → Read reference/testing.md

Need to optimize performance?
  → Read reference/performance.md
```
