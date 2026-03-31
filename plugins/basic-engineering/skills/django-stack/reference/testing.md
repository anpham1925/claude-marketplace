# Django Testing Patterns

## Test Structure

```python
import pytest
from django.utils import timezone
from freezegun import freeze_time
from apps.orders.models import Order
from apps.orders.services import OrderService
from tests.factories import OrderFactory, UserFactory


@pytest.mark.django_db
class TestOrderService:
    def test_create_order(self):
        # Arrange
        customer = UserFactory()
        items = [{"product_id": 1, "quantity": 2, "price": "10.00"}]

        # Act
        order = OrderService.create_order(customer=customer, items=items)

        # Assert
        assert order.status == Order.Status.DRAFT
        assert order.customer == customer
        # Verify from DB, not just the returned object
        order.refresh_from_db()
        assert order.total_amount == Decimal("20.00")

    def test_cancel_placed_order(self):
        order = OrderFactory(status=Order.Status.PLACED)

        OrderService.cancel_order(order, cancelled_by=order.customer)

        order.refresh_from_db()
        assert order.status == Order.Status.CANCELLED

    def test_cannot_cancel_shipped_order(self):
        order = OrderFactory(status=Order.Status.SHIPPED)

        with pytest.raises(ValueError, match="cannot be cancelled"):
            OrderService.cancel_order(order, cancelled_by=order.customer)
```

## Factory Pattern

```python
# tests/factories.py
import factory
from apps.users.models import User
from apps.orders.models import Order

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    first_name = factory.Faker("first_name")

class OrderFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Order

    customer = factory.SubFactory(UserFactory)
    status = Order.Status.DRAFT
    total_amount = factory.Faker("pydecimal", left_digits=3, right_digits=2, positive=True)
```

## API Testing

```python
@pytest.mark.django_db
class TestOrderAPI:
    def test_list_orders(self, api_client, user):
        OrderFactory.create_batch(3, customer=user)
        OrderFactory()  # Another user's order

        api_client.force_authenticate(user=user)
        response = api_client.get("/api/orders/")

        assert response.status_code == 200
        assert len(response.data["results"]) == 3  # Only own orders

    def test_create_order_unauthenticated(self, api_client):
        response = api_client.post("/api/orders/", {})
        assert response.status_code == 401
```

## Fixtures (conftest.py)

```python
# tests/conftest.py
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user():
    return UserFactory()

@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client
```

## Date Handling

```python
# NEVER hardcode dates
# BAD
order = OrderFactory(placed_at=datetime(2024, 1, 1))

# GOOD — use freeze_time
@freeze_time("2024-01-15 12:00:00")
def test_order_placed_at(self):
    order = OrderFactory(status=Order.Status.DRAFT)
    order.place()
    assert order.placed_at == timezone.now()
```

## Rules

- Use `pytest` + `pytest-django`, not unittest
- Use `factory_boy` for test data, not fixtures or raw `create()`
- Always `refresh_from_db()` to verify persistence
- Never mock the ORM — use a real test database
- Freeze time for date-dependent tests
- AAA pattern: Arrange, Act, Assert
- One assertion concept per test (multiple asserts OK if same concept)
