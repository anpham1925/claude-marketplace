# Models & ORM Patterns

## Model Design

```python
from django.db import models
from django.utils import timezone
from common.models import BaseModel  # created_at, updated_at, id


class Order(BaseModel):
    """Rich domain model — behavior lives here."""

    class Status(models.TextChoices):
        DRAFT = "draft"
        PLACED = "placed"
        PAID = "paid"
        SHIPPED = "shipped"
        CANCELLED = "cancelled"

    customer = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    placed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["customer", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"Order {self.id} ({self.status})"

    # Domain logic ON the model
    def can_cancel(self) -> bool:
        return self.status in (self.Status.DRAFT, self.Status.PLACED)

    def place(self) -> None:
        if self.status != self.Status.DRAFT:
            raise ValueError(f"Cannot place order in status {self.status}")
        self.status = self.Status.PLACED
        self.placed_at = timezone.now()
        self.save(update_fields=["status", "placed_at", "updated_at"])
```

## QuerySet Patterns

```python
class OrderQuerySet(models.QuerySet):
    def active(self):
        return self.exclude(status=Order.Status.CANCELLED)

    def for_customer(self, customer_id: int):
        return self.filter(customer_id=customer_id)

    def placed_after(self, date):
        return self.filter(placed_at__gte=date)


class OrderManager(models.Manager):
    def get_queryset(self):
        return OrderQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()


class Order(BaseModel):
    objects = OrderManager()
    # ...
```

## Selectors (Complex Queries)

```python
# apps/orders/selectors.py
from django.db.models import Sum, Count, Q

class OrderSelector:
    @staticmethod
    def dashboard_stats(customer_id: int) -> dict:
        return Order.objects.filter(
            customer_id=customer_id
        ).aggregate(
            total_orders=Count("id"),
            total_spent=Sum("total_amount", filter=Q(status=Order.Status.PAID)),
            pending_orders=Count("id", filter=Q(status=Order.Status.PLACED)),
        )
```

## Migration Rules

- Never edit applied migrations — create new ones
- Always review auto-generated migrations before committing
- Use `RunPython` with `reverse_code` for data migrations
- Add `db_index=True` to fields used in `filter()` / `order_by()`
- Use `update_fields` in `.save()` to prevent race conditions
- Always set `on_delete` explicitly — never rely on defaults

## Anti-Patterns

- `Model.objects.all()` in views — use selectors or filtered querysets
- `__all__` in serializer `Meta.fields` — explicitly list fields
- N+1: accessing related objects in a loop without `select_related`/`prefetch_related`
- Business logic in `save()` override — use services for cross-cutting logic
- Mutable default arguments in model methods
