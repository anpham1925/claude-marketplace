---
paths:
  - "**/*.go"
---

# Go Coding Style

- **Accept interfaces, return structs**: Function parameters should be interfaces, return values should be concrete types
- **Keep interfaces small**: 1-3 methods maximum
- **Error wrapping**: Use `errors.New()` or `fmt.Errorf()` with `%w` for wrapping — never string concatenation
- **Table-driven tests**: Prefer table-driven tests for comprehensive coverage
- **`context.Context` first**: Use as first parameter for cancellation and deadlines
- **Named return values**: Only when it aids documentation — avoid naked returns
- **Import grouping**: stdlib, external, internal — with blank line separators
- **Prefer `sync.Once`**: Over `init()` for lazy initialization
- **Use `io.Reader`/`io.Writer`**: For I/O abstraction
- **Avoid `interface{}` / `any`**: Use generics (Go 1.18+) where appropriate
- **Package names**: Short, lowercase, no underscores — `http` not `http_utils`

## Reference Example

```go
// Good — accept interface, return struct, context first, %w for wrapping
type OrderRepo interface {
    FindByID(ctx context.Context, id OrderID) (*Order, error)
}

func CancelOrder(ctx context.Context, repo OrderRepo, id OrderID) (*Order, error) {
    order, err := repo.FindByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("cancel order %s: %w", id, err)
    }
    if order == nil {
        return nil, ErrOrderNotFound
    }
    order.Cancel()
    return order, nil
}

// Bad — returns interface (caller can't type-assert cleanly), context last,
// concatenates errors (breaks errors.Is/As)
func CancelOrderBad(id string, ctx context.Context) (OrderReader, error) {
    o, err := db.Find(id)
    if err != nil {
        return nil, errors.New("cancel failed: " + err.Error())
    }
    return o, nil
}
```
