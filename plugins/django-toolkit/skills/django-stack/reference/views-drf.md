# Views & Django REST Framework Patterns

## ViewSet Pattern

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer, OrderCreateSerializer
from apps.orders.services import OrderService
from apps.orders.selectors import OrderSelector


class OrderViewSet(viewsets.ModelViewSet):
    """
    Views handle HTTP concerns only.
    Business logic lives in services.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(customer=self.request.user)
            .select_related("customer")
            .prefetch_related("items")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        # Delegate to service
        OrderService.create_order(
            customer=self.request.user,
            **serializer.validated_data,
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        try:
            OrderService.cancel_order(order, cancelled_by=request.user)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderSerializer(order).data)
```

## Service Layer

```python
# apps/orders/services.py
from django.db import transaction

class OrderService:
    @staticmethod
    @transaction.atomic
    def create_order(customer, items, **kwargs) -> Order:
        order = Order.objects.create(customer=customer, **kwargs)
        for item in items:
            OrderItem.objects.create(order=order, **item)
        order.total_amount = sum(i.subtotal for i in order.items.all())
        order.save(update_fields=["total_amount", "updated_at"])
        return order

    @staticmethod
    def cancel_order(order: Order, cancelled_by) -> None:
        if not order.can_cancel():
            raise ValueError(f"Order {order.id} cannot be cancelled")
        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status", "updated_at"])
        # Explicit > signals: send notification here, not via signal
        NotificationService.send_cancellation(order, cancelled_by)
```

## Serializer Patterns

```python
from rest_framework import serializers

class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.get_full_name", read_only=True)

    class Meta:
        model = Order
        fields = ["id", "status", "total_amount", "customer_name", "placed_at", "created_at"]
        # NEVER use fields = "__all__"

class OrderCreateSerializer(serializers.Serializer):
    """Input serializer — separate from output."""
    items = OrderItemInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item required")
        return value
```

## URL Configuration

```python
# apps/orders/urls.py
from rest_framework.routers import DefaultRouter
from apps.orders.views import OrderViewSet

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")

urlpatterns = router.urls
```

## Rules

- Views handle HTTP only — no business logic
- One serializer for input, one for output
- Always `select_related` / `prefetch_related` in `get_queryset`
- Use `@transaction.atomic` for multi-model mutations
- Return proper HTTP status codes
- Pagination on all list endpoints
