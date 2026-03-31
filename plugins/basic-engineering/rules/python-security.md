---
paths:
  - "**/*.py"
---

# Python Security

- **No `pickle` with untrusted data**: Use JSON or MessagePack for deserialization of external input
- **No `eval()` / `exec()` / `__import__()`**: Never use with user input
- **Use `secrets` module**: For tokens and security-sensitive random values — never `random`
- **Parameterized queries only**: Never f-strings or `.format()` in SQL
- **Use `bcrypt` or `argon2`**: For password hashing — never SHA/MD5
- **Validate file uploads**: Check MIME type, limit size, sanitize filename, store outside webroot
- **Use `defusedxml`**: For XML parsing — prevent XXE attacks
- **Security headers**: Set `Content-Security-Policy`, `X-Frame-Options` headers
- **Never log PII or credentials**: Scrub sensitive fields from log output
- **Pin dependencies**: Audit with `pip-audit` or `safety` in CI
