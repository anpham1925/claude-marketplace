# Django Performance Patterns

## Query Optimization

```python
# N+1 Problem — BAD
orders = Order.objects.all()
for order in orders:
    print(order.customer.name)  # 1 query per order!

# FIXED — select_related for ForeignKey/OneToOne
orders = Order.objects.select_related("customer").all()

# FIXED — prefetch_related for ManyToMany/reverse FK
orders = Order.objects.prefetch_related("items").all()
```

## Database Indexes

```python
class Order(models.Model):
    class Meta:
        indexes = [
            # Composite index for common query patterns
            models.Index(fields=["status", "-created_at"]),
            # Partial index (PostgreSQL)
            models.Index(
                fields=["customer"],
                condition=Q(status="placed"),
                name="idx_placed_orders_customer",
            ),
        ]
```

## Caching

```python
from django.core.cache import cache

# Simple key-value
def get_dashboard_stats(user_id: int) -> dict:
    cache_key = f"dashboard_stats:{user_id}"
    stats = cache.get(cache_key)
    if stats is None:
        stats = OrderSelector.dashboard_stats(user_id)
        cache.set(cache_key, stats, timeout=300)  # 5 minutes
    return stats

# Invalidate on mutation
def place_order(order):
    order.place()
    cache.delete(f"dashboard_stats:{order.customer_id}")
```

## Bulk Operations

```python
# BAD — N queries
for item in items:
    OrderItem.objects.create(order=order, **item)

# GOOD — 1 query
OrderItem.objects.bulk_create([
    OrderItem(order=order, **item) for item in items
])

# Bulk update
Order.objects.filter(status="draft", created_at__lt=cutoff).update(status="expired")
```

## Pagination

```python
# Always paginate list endpoints
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.CursorPagination",
    "PAGE_SIZE": 25,
}

# Cursor pagination > offset pagination for large datasets
# (offset has O(n) cost for large offsets)
```

## Async Views (Django 4.1+)

```python
# For I/O-bound views (external API calls, etc.)
async def external_api_view(request):
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
    return JsonResponse(response.json())
```

## Celery for Background Tasks

```python
# Offload heavy work to background tasks
from celery import shared_task

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation(self, order_id: int):
    try:
        order = Order.objects.select_related("customer").get(id=order_id)
        EmailService.send_confirmation(order)
    except Order.DoesNotExist:
        return  # Order deleted, skip
    except EmailError as e:
        self.retry(exc=e)
```

## Checklist

- [ ] `select_related` / `prefetch_related` on all queryset methods
- [ ] Indexes on fields used in `filter()`, `order_by()`, `exclude()`
- [ ] `django-debug-toolbar` in development (catch N+1)
- [ ] Pagination on all list endpoints
- [ ] Cache expensive computations
- [ ] `bulk_create` / `bulk_update` for batch operations
- [ ] Background tasks for slow operations (email, PDF, external API)
- [ ] `CONN_MAX_AGE` set for connection pooling
