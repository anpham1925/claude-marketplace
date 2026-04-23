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

## Reference Example

```go
// Good — functional options, sentinel error for expected case, errors.Is for caller checks
var ErrOrderNotFound = errors.New("order not found")

type Client struct {
    timeout time.Duration
    retries int
}

type Option func(*Client)

func WithTimeout(d time.Duration) Option { return func(c *Client) { c.timeout = d } }
func WithRetries(n int) Option           { return func(c *Client) { c.retries = n } }

func NewClient(opts ...Option) *Client {
    c := &Client{timeout: 5 * time.Second, retries: 3}
    for _, opt := range opts { opt(c) }
    return c
}

// Caller side — clean check via errors.Is
if errors.Is(err, ErrOrderNotFound) {
    return http.StatusNotFound
}

// Bad — config struct forces the caller to zero unused fields,
// string-matching on error messages is brittle
type BadConfig struct { Timeout, Retries, MaxIdle, TLSMinVersion int }
if strings.Contains(err.Error(), "not found") { /* ... */ }
```
