# django-toolkit

Django + DRF patterns for models, views, serializers, security, testing, and performance.

## Install

```bash
/plugin install django-toolkit@anpham-marketplace
```

## Usage

The skill triggers automatically when Claude detects Django code (imports from `django`, `rest_framework`, `celery`) or when you ask about Django patterns.

```bash
# Explicit invocation
/django-toolkit:django-stack

# Auto-triggers on questions like:
# "create a new model"
# "write a serializer"
# "add a management command"
# "optimize this queryset"
```

## Reference Topics (5)

| Topic | What It Covers |
|---|---|
| **Models** | Django ORM patterns, field choices, signals, managers |
| **Views & DRF** | ViewSets, serializers, permissions, pagination |
| **Security** | CSRF, authentication, input validation, secrets |
| **Testing** | pytest-django, factories, fixtures, mocking |
| **Performance** | Query optimization, caching, select_related, Celery |

References are loaded on-demand — only the relevant topic is read when needed.
