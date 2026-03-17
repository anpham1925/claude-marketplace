# NestJS API Design

## REST Conventions

```
GET    /orders              # List (paginated)
GET    /orders/:id          # Get one
POST   /orders              # Create
PATCH  /orders/:id          # Partial update
DELETE /orders/:id          # Delete
POST   /orders/:id/approve  # State transition
```

Rules: plural nouns, kebab-case, no verbs except actions, max 2 levels deep.

## HTTP Status Codes

| Operation | Code |
|---|---|
| GET | 200 |
| POST (create) | 201 |
| PATCH/PUT | 200 |
| DELETE | 204 |
| POST (action) | 200 |

## Key Patterns

- **Request DTO**: `class-validator` + `@ApiProperty` decorators
- **Response DTO**: `static from(entity)` factory method — never expose entities
- **Pagination**: `PaginationQueryDto` + `PaginatedResponseDto<T>`
- **Partial Update**: `PartialType(CreateDto)` from `@nestjs/swagger`

## Common Mistakes

| Mistake | Fix |
|---|---|
| Returning entity directly | Response DTO with `static from()` |
| No validation | `class-validator` decorators on DTO |
| Using `@Res()` | Return values, let NestJS serialize |
| Missing `@Type(() => Number)` | Query params are strings — transform |
| No pagination | Always paginate list endpoints |
