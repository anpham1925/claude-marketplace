---
paths:
  - "**/*.py"
---

# Python Patterns

- **Repository pattern**: Abstract DB access behind protocol classes
- **Service layer**: Business logic in services, not views/routes
- **Dependency injection**: Use `functools.partial` or protocols, not class hierarchies
- **Guard clauses**: Early returns, avoid deep nesting
- **Structured logging**: Use `structlog` or `logging.getLogger(__name__)` with extra fields — never f-string in log calls
- **Async patterns**: Use `asyncio.gather()` for concurrent I/O, `asyncio.TaskGroup` (3.11+) for structured concurrency
- **Error handling**: Custom exception hierarchy per domain, catch specific exceptions
- **Config**: Pydantic `BaseSettings` with `.env` files — never `os.environ.get()` directly in business logic
- **Testing**: Use `pytest` with fixtures, `factory_boy` for test data, `respx`/`responses` for HTTP mocking
