---
paths:
  - "**/*.py"
---

# Python Coding Style

- **Type hints everywhere**: Annotate all functions — `def process(items: list[str]) -> dict[str, int]:`
- **Prefer `pathlib.Path`**: Use over `os.path` for all file system operations
- **Use `dataclasses` or `pydantic.BaseModel`**: For data structures — no raw dicts for domain objects
- **Prefer f-strings**: Over `.format()` or `%` — but use `.format()` for log messages (lazy evaluation)
- **Use `collections.abc`**: For type hints (`Sequence`, `Mapping`) not concrete types
- **Prefer `enumerate()`**: Over `range(len())` for indexed iteration
- **Walrus operator `:=`**: Use for assignment in conditions where it improves readability
- **Use `__slots__`**: On classes with many instances to reduce memory footprint
- **Prefer `functools.cache` / `lru_cache`**: Over manual memoization
- **Context managers (`with`)**: For all resource management — files, connections, locks

## Reference Example

```python
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

# Good — type hints, pathlib, dataclass, Sequence not list
@dataclass(frozen=True, slots=True)
class Order:
    id: str
    total: int
    status: OrderStatus

def load_orders(source: Path) -> Sequence[Order]:
    with source.open() as f:
        return [Order(**row) for row in json.load(f)]

# Bad — no hints, os.path, raw dict, concrete list in signature
def load(src):
    f = open(os.path.join("data", src))
    return [{"id": r["id"], "total": r["total"]} for r in json.load(f)]
```
