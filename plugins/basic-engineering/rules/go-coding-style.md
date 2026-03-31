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
