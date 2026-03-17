---
paths:
  - "**/*.ts"
  - "**/*.js"
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.py"
  - "**/*.go"
  - "**/*.rs"
---

# Naming Conventions

## General Principles

- **Be specific**: Names should describe the single responsibility
- **No generic names**: Avoid vague class names like "Service", "Manager", "Helper" without a specific prefix
- **Consistent casing**: Follow the language's conventions
- **Functions**: State-changing → use verbs (`processItem`, `activateUser`). Value-returning → use nouns or `get`/`is`/`has`

## No Generic Names

If you can't name it with a specific verb describing its single responsibility, the class is doing too much.

| Don't Use | Use Instead | Why |
|---|---|---|
| `PayoutService` | `PayoutItemProcessor` | Describes its single responsibility |
| `UserService` | `UserRegistrationHandler` | Specific about what it does |
| `AccountHelper` | `AccountSuspensionHandler` | Clear bounded purpose |

## Code Style

- No superfluous comments — code should be self-documenting
- Action comments encouraged: `TODO`, `FIXME`, `HACK`, `NOTE` with context
- Comments explain WHY, not WHAT
