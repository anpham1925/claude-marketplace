# NestJS Domain Model (@nestjs/cqrs)

NestJS-specific patterns using `@nestjs/cqrs` for event-driven domain models.

## AggregateRoot

```typescript
import { AggregateRoot } from '@nestjs/cqrs';

export class OrderModel extends AggregateRoot {
  confirm(userId: number): void {
    this.assertCanTransition('confirm');
    this.status = OrderStatus.CONFIRMED;
    this.apply(new OrderConfirmedEvent(this.id, userId));
  }
}
```

## Factory with EventPublisher

```typescript
@Injectable()
export class OrderFactory {
  constructor(private eventPublisher: EventPublisher) {}

  create(entity: OrderEntity): OrderModel {
    const model = new OrderModel(entity);
    return this.eventPublisher.mergeObjectContext(model);
  }
}
```

## Handler with model.commit()

```typescript
async execute(command: ConfirmOrderCommand) {
  const model = await this.domainRepository.findById(id);
  model.confirm(userId);
  await this.save(entity);
  model.commit();  // Publish events via AggregateRoot
}
```

## Domain Repository

```typescript
export class OrderDomainRepository extends ModelRepository<OrderModel, OrderEntity> {
  toModel(entity: OrderEntity): OrderModel {
    return this.factory.create(entity);  // Factory wires up events
  }
}
```

## Rules

- Extend `AggregateRoot` from `@nestjs/cqrs`
- Factory uses `EventPublisher.mergeObjectContext()`
- Handler calls `model.commit()` after persistence
- Use `this.apply(new Event())` not manual event lists
