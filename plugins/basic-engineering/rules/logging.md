---
paths:
  - "**/*.ts"
  - "**/*.js"
  - "**/*.py"
  - "**/*.go"
---

# Structured Logging Rules

When using structured loggers, follow the context-first pattern.

## Principles

- **Structured fields over string interpolation**: Use key-value context for searchability in log aggregators
- **Initialize logger with class/module name**: Every log should identify its source
- **Log at appropriate levels**: `error` for failures, `warn` for recoverable/degraded, `info`/`log` for normal flow, `debug` for troubleshooting
- **Never log sensitive data**: Passwords, tokens, PII, connection strings

## Anti-Patterns

- Template literals for structured data — not searchable in log aggregators
- Inconsistent log levels — everything at `info` defeats the purpose
- Missing context — log the relevant IDs (userId, orderId, etc.), not just messages
