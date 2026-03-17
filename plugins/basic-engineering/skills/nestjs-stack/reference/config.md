# NestJS Configuration

## Rules

1. **Validate at startup** — fail fast, not at first request
2. **Use ConfigService** — never `process.env` in application code
3. **Type your config** — typed namespaces, not raw string keys
4. **Separate by concern** — database, auth, external services get own config

## Typed Config Namespace

```typescript
import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  name: process.env.DATABASE_NAME,
}));
```

## Using Config

```typescript
// GOOD: Typed injection
@Inject(databaseConfig.KEY) private dbConfig: DatabaseConfig

// GOOD: ConfigService
this.configService.getOrThrow<string>('database.host');

// BAD: Raw process.env
process.env.DATABASE_HOST;
```

## Common Mistakes

| Mistake | Fix |
|---|---|
| `process.env.X` scattered | Centralize in config namespaces |
| No validation | Add Joi schema to `ConfigModule.forRoot()` |
| Secrets in defaults | Require via `.required()` |
| `synchronize: true` | Always `false`; use migrations |
