---
paths:
  - "**/*.py"
---

# Python Patterns

- **Repository pattern**: Abstract DB access behind protocol classes
- **Service layer**: Business logic in services, not views/routes
- **Dependency injection**: Use `functools.partial` or protocols, not class hierarchies
- **Guard clauses**: Early returns, avoid deep nesting
- **Structured logging**: Use `structlog` or `logging.getLogger(__name__)` with extra fields — never f-string in log calls
- **Async patterns**: Use `asyncio.gather()` for concurrent I/O, `asyncio.TaskGroup` (3.11+) for structured concurrency
- **Error handling**: Custom exception hierarchy per domain, catch specific exceptions
- **Config**: Pydantic `BaseSettings` with `.env` files — never `os.environ.get()` directly in business logic
- **Testing**: Use `pytest` with fixtures, `factory_boy` for test data, `respx`/`responses` for HTTP mocking

## Reference Example

```python
from typing import Protocol

# Good — repository protocol in domain, guard clauses, custom domain error
class OrderRepository(Protocol):
    def find_by_id(self, order_id: OrderId) -> Order | None: ...
    def save(self, order: Order) -> None: ...

class OrderNotFoundError(DomainError):
    pass

def cancel_order(order_id: OrderId, repo: OrderRepository) -> Order:
    order = repo.find_by_id(order_id)
    if order is None:
        raise OrderNotFoundError(order_id)
    if order.is_cancelled():
        return order  # idempotent

    order.cancel()
    repo.save(order)
    return order

# Bad — direct ORM dependency in business logic, deep nesting, generic exception
def cancel(order_id: str) -> dict:
    order = OrderModel.objects.filter(id=order_id).first()
    if order:
        if order.status != "CANCELLED":
            order.status = "CANCELLED"
            order.save()
            return {"ok": True}
        else:
            return {"ok": True}
    else:
        raise Exception("not found")
```
