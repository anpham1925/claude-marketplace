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
