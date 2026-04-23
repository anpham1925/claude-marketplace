---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "**/*.spec.js"
  - "**/*.test.js"
  - "**/*.test.py"
  - "**/*_test.go"
  - "**/*.e2e.spec.ts"
  - "**/*.e2e-spec.ts"
  - "**/*_test.rs"
  - "**/*.test.tsx"
  - "**/*.spec.tsx"
---

# Testing Rules

- **TDD**: Write tests before implementation. Red-Green-Refactor cycle.
- **Coverage**: 70% minimum for new code
- **Only mock at system boundaries**: Never mock internal services, handlers, or repositories
- **Never hardcode dates**: Use dynamic date generation so tests pass in future years
- **AAA pattern**: Arrange, Act, Assert in every test
- **Test behavior, not implementation**: Focus on what the method does, not how
- **Never modify existing tests to fix failures**: Fix the application logic instead
- **Verify from the data store**: Don't just check the API response — verify persistence

## Reference Example

```ts
it('marks an order as cancelled once the customer confirms', async () => {
  // Arrange — dynamic date, boundary mock only, factory for valid state
  const cancelledAt = new Date();
  const order = OrderFactory.pending({ customerId: 'C-1' });
  await repo.save(order);

  // Act
  await handler.handle(new CancelOrderCommand(order.id, 'C-1'));

  // Assert — verify persistence, not just the return value
  const stored = await repo.findById(order.id);
  expect(stored.status).toBe('CANCELLED');
  expect(stored.cancelledAt.getTime()).toBeGreaterThanOrEqual(cancelledAt.getTime());
});
```

```python
def test_cancels_order_when_customer_confirms(order_repo, handler):
    # Arrange — factory, dynamic date
    order = OrderFactory.pending(customer_id="C-1")
    order_repo.save(order)

    # Act
    handler.handle(CancelOrderCommand(order.id, "C-1"))

    # Assert — read back from the store
    stored = order_repo.find_by_id(order.id)
    assert stored.status == OrderStatus.CANCELLED
    assert stored.cancelled_at <= datetime.now(UTC)
```
