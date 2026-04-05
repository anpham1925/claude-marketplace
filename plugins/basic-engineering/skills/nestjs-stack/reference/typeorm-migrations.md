# TypeORM Migrations

## Steps

- Generate timestamp: `node -e "console.log(Date.now())"`
- Verify it's after the last migration in the directory
- Write idempotent SQL: `IF NOT EXISTS` / `IF EXISTS`
- Order dependencies: parent tables before foreign keys

## Naming Rules

| Rule | Example |
|---|---|
| 13-digit millisecond timestamp | `1730801860055` |
| Must be after last deployed | Check migrations directory |
| Descriptive class name | `CreateOrdersTable`, `AddColumnToOrders` |

## Template

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateYourTable1731455272415 implements MigrationInterface {
  name = 'CreateYourTable1731455272415';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "your_table" (
        "id" BIGSERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "your_table"`);
  }
}
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| Old timestamp | Regenerate from current time |
| ALTER before CREATE | Reorder timestamps |
| FK before referenced table | Create tables first |
| Missing idempotency | Add `IF NOT EXISTS` |
