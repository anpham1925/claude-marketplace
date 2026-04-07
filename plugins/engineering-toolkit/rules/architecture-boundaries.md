---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Architecture Import Boundaries

When writing or reviewing imports, enforce these layer boundaries:

## Rules

| From | Can Import | CANNOT Import |
|------|-----------|---------------|
| `apps/<name>/` | `modules/`, `libs/` | Other `apps/` directories |
| `modules/<name>/` | `libs/`, other `modules/` (via root barrel) | `apps/` |
| `libs/<name>/` | Other `libs/` | `modules/`, `apps/` |

## Within a Module

- Use **relative imports** (`./`, `../`) for files within the same module
- Use **path aliases** (`@modules/`, `@lib/`) for cross-module imports
- Import from the **module root barrel** (`@modules/payout`), not deep paths (`@modules/payout/application/handlers/`)

## After Each Implementation Wave

Verify no new boundary violations were introduced. Quick check:
- Files in `apps/` should not have imports from other `apps/` directories
- Files in `libs/` should not have imports from `modules/` or `apps/`
- Files in `modules/` should not have imports from `apps/`

## Why

These boundaries enforce the hexagonal architecture. Violations create hidden coupling that makes modules non-deployable independently.
