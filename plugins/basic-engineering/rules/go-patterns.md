---
paths:
  - "**/*.go"
---

# Go Patterns

- **Functional options**: `func WithTimeout(d time.Duration) Option` for configurable constructors
- **Repository pattern**: Interface in domain package, implementation in infrastructure
- **Error handling**: Custom error types with `errors.Is()` / `errors.As()` — sentinel errors for expected cases
- **Middleware pattern**: `func(http.Handler) http.Handler` for HTTP middleware chains
- **Worker pool**: Buffered channels + goroutines for bounded concurrency
- **Graceful shutdown**: `signal.NotifyContext` + `sync.WaitGroup` for clean teardown
- **Struct embedding**: Composition over inheritance — embed interfaces, not structs
- **Testing**: `testify` for assertions, `gomock` or `mockery` for mocks, `testcontainers-go` for integration tests
- **Config**: `envconfig` or `viper` with struct tags — never `os.Getenv()` in business logic
