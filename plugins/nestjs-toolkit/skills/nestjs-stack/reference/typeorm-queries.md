# TypeORM Queries & Transactions

## Query Hierarchy

| Level | Method | When |
|---|---|---|
| 1. Built-in | `.find()`, `.save()` | Try first |
| 2. Query Builder | `.createQueryBuilder()` | Complex joins |
| 3. Raw SQL | `queryRunner.query()` | Last resort: UPSERT, JSONB |

## Transaction Pattern

```typescript
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();

try {
  await queryRunner.startTransaction();
  await queryRunner.query('UPDATE ...', [params]);
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();  // CRITICAL: mandatory
}
```

## Parameterized Queries

| Engine | Placeholder |
|---|---|
| PostgreSQL | `$1, $2, $3` |
| MySQL | `?` |

```typescript
// GOOD
.where('s.userId = :userId', { userId })

// BAD — SQL injection
.where(`s.userId = ${userId}`)
```

## Tips

- Prefer `.getMany()` over `.getRawMany()`
- Use `.getRawOne()` only for aggregations
- Always release query runners in `finally`
