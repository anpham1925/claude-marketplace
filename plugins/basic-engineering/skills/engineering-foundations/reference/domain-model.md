# Rich Domain Model Patterns

## When to Use Each Pattern

| Scenario | Pattern |
|---|---|
| Simple CRUD operations | Simple Repository |
| State machine transitions (PENDING -> APPROVED) | Rich Domain Model |
| Business invariants to enforce | Rich Domain Model |
| Domain events needed | Rich Domain Model |
| Multiple operations must be atomic | Rich Domain Model |
| No complex business rules | Simple Repository |

## Pattern 1: Simple Repository (Basic CRUD)

```
class EntityRepository extends BaseRepository<Entity> {
  async findByCode(code: string): Promise<Entity | null> {
    return this.findOne({ where: { code } });
  }
}
```

## Pattern 2: Rich Domain Model

### Required Structure

```
<domain>/
├── domain/
│   ├── models/              # Aggregate roots
│   ├── events/              # Domain events
│   └── exceptions/          # Domain-specific exceptions
├── infrastructure/
│   ├── <domain>.factory.ts           # Factory for creating domain objects
│   └── <domain>-domain.repository.ts # Repository (model <-> entity)
└── application/
    ├── commands/             # Command definitions
    └── handlers/             # Command handlers
```

### Domain Model (Aggregate Root)

```
class OrderModel {
  private status: OrderStatus;
  private events: DomainEvent[] = [];

  confirm(userId: number): void {
    this.assertCanTransition('confirm');
    this.status = OrderStatus.CONFIRMED;
    this.validate();
    this.raise(new OrderConfirmedEvent(this.id, userId));
  }

  private raise(event: DomainEvent): void {
    this.events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this.events];
    this.events = [];
    return events;
  }
}
```

### Factory Pattern

```
class OrderFactory {
  create(entity: OrderEntity): OrderModel {
    const model = new OrderModel(entity);
    // Wire up event publishing, context, etc.
    return model;
  }
}
```

### Handler Pattern

```
async execute(command: ConfirmOrderCommand) {
  const model = await this.domainRepository.findById(id);
  model.confirm(userId);              // Domain behavior
  await this.domainRepository.save(model);  // Persist
  const events = model.pullEvents();  // Collect events
  await this.eventPublisher.publishAll(events);  // Publish after persistence
}
```

## Key Principles

- **Domain model** encapsulates all business rules — no anemic models
- **Factory** handles object creation and wiring
- **Repository** converts between domain model and persistence entity
- **Handlers** orchestrate: load -> behavior -> persist -> publish
- **No framework imports** inside the domain model — keep it pure
