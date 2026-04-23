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

## Reference Example

```python
import secrets
import bcrypt
from defusedxml import ElementTree  # not xml.etree

# Good — parameterized query, secrets module, bcrypt for passwords
def authenticate(email: str, password: str, db) -> User | None:
    row = db.execute(
        "SELECT id, password_hash FROM users WHERE email = %s",
        (email,),
    ).fetchone()
    if row is None:
        return None
    if not bcrypt.checkpw(password.encode(), row.password_hash):
        return None
    return User(id=row.id)

def new_token() -> str:
    return secrets.token_urlsafe(32)  # cryptographically secure

# Bad — SQL injection, predictable random, SHA-256 for passwords
def authenticate_bad(email: str, password: str, db):
    row = db.execute(f"SELECT * FROM users WHERE email = '{email}'").fetchone()
    if row and hashlib.sha256(password.encode()).hexdigest() == row.password_hash:
        return row

import random
def token_bad() -> str:
    return str(random.randint(0, 10**12))  # seedable, not secret-grade
```
