---
paths:
  - "**/*.go"
---

# Go Security

- **Use `crypto/rand`**: For random values — never `math/rand` for security
- **Use `html/template`**: Not `text/template` for HTML output — it auto-escapes
- **Always close `http.Response.Body`**: Use `defer resp.Body.Close()` after error check
- **Set timeouts**: On `http.Client` and `http.Server` — never use defaults (no timeout = DoS risk)
- **Prepared statements for SQL**: Never `fmt.Sprintf` in queries
- **Validate all user input**: At handler level, before passing to business logic
- **Use `golang.org/x/crypto/bcrypt`**: For password hashing
- **Security headers**: Set `Strict-Transport-Security` and other security headers
- **Use `context.WithTimeout`**: For all external calls — prevent hanging goroutines
- **Run `govulncheck` and `gosec`**: In CI for vulnerability and security scanning

## Reference Example

```go
// Good — prepared statement, crypto/rand, timeouts on client, context for cancellation
import (
    "crypto/rand"
    "crypto/subtle"
    "database/sql"
    "net/http"
    "time"
)

var httpClient = &http.Client{Timeout: 10 * time.Second}

func newToken() ([]byte, error) {
    b := make([]byte, 32)
    _, err := rand.Read(b)
    return b, err
}

func findUser(ctx context.Context, db *sql.DB, email string) (*User, error) {
    row := db.QueryRowContext(ctx, "SELECT id, token_hash FROM users WHERE email = $1", email)
    // ...
}

func tokensEqual(a, b []byte) bool {
    return subtle.ConstantTimeCompare(a, b) == 1
}

// Bad — fmt.Sprintf in SQL, math/rand for tokens, default http client has no timeout
import mrand "math/rand"

func findUserBad(db *sql.DB, email string) (*User, error) {
    q := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)
    return scan(db.Query(q))
}

func tokenBad() string {
    return strconv.Itoa(mrand.Int())  // predictable
}

resp, _ := http.Get(url)  // no timeout = goroutine leak on hung server
```
