# Django Security Patterns

## Authentication & Authorization

```python
# Prefer Django's built-in auth + DRF permissions
from rest_framework.permissions import BasePermission

class IsOrderOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.customer == request.user

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOrderOwner]
```

## Input Validation

- Always validate at serializer level — never trust client data
- Use Django's `validators` on model fields for domain constraints
- DRF serializers validate before `perform_create`/`perform_update`

## SQL Injection Prevention

```python
# SAFE — ORM handles parameterization
User.objects.filter(email=user_input)

# SAFE — parameterized raw SQL
User.objects.raw("SELECT * FROM users WHERE email = %s", [user_input])

# DANGEROUS — string formatting in SQL
User.objects.raw(f"SELECT * FROM users WHERE email = '{user_input}'")  # NEVER
```

## XSS Prevention

- Django templates auto-escape by default — never use `|safe` with user input
- DRF returns JSON — XSS risk is lower but still sanitize HTML fields
- Set `Content-Security-Policy` header

## CSRF Protection

- Django CSRF middleware is ON by default — don't disable it
- DRF uses `SessionAuthentication` CSRF by default
- Token-based auth (JWT) doesn't need CSRF but needs secure token storage

## Security Checklist

- [ ] `DEBUG = False` in production
- [ ] `SECRET_KEY` from environment variable
- [ ] `ALLOWED_HOSTS` explicitly set
- [ ] HTTPS enforced (`SECURE_SSL_REDIRECT = True`)
- [ ] `SECURE_HSTS_SECONDS` set (31536000 for 1 year)
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] `X_FRAME_OPTIONS = "DENY"`
- [ ] Database credentials from environment
- [ ] File upload validation (type, size, name sanitization)
- [ ] Rate limiting on auth endpoints (django-ratelimit)
- [ ] `django.middleware.security.SecurityMiddleware` enabled
- [ ] Run `python manage.py check --deploy` before deploying

## Secrets Management

```python
# settings/base.py
import environ

env = environ.Env()

SECRET_KEY = env("DJANGO_SECRET_KEY")
DATABASE_URL = env("DATABASE_URL")
# NEVER hardcode secrets
```
