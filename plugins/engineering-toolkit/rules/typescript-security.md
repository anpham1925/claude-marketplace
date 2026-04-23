---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
---

# TypeScript Security

- **No `eval()`**: Never use `eval()`, `new Function()`, or `vm.runInNewContext()` with user input
- **Sanitize HTML output**: Use DOMPurify or equivalent — never `dangerouslySetInnerHTML` with raw user input
- **Validate external input**: Validate all external input at API boundaries with Zod or class-validator
- **Parameterized queries**: Use parameterized queries — never string interpolation in SQL
- **No secrets in code**: Never store secrets in code — use environment variables via a config service
- **Explicit CORS origins**: Set CORS origins explicitly — never `*` in production
- **Timing-safe comparison**: Use `crypto.timingSafeEqual` for secret comparison — never `===`
- **Validate redirect URLs**: Validate redirect URLs against an allowlist — prevent open redirect
- **Secure cookies**: Set `httpOnly`, `secure`, `sameSite` on all cookies
- **Rate limit auth endpoints**: Rate limit authentication endpoints to prevent brute force

## Reference Example

```ts
// Good — Zod validation at the boundary, parameterized query, timing-safe compare
@Post('login')
async login(@Body() body: unknown) {
  const { email, token } = LoginSchema.parse(body);
  const row = await this.db.query(
    'SELECT token_hash FROM users WHERE email = $1',
    [email],
  );
  const expected = Buffer.from(row.token_hash);
  const actual = Buffer.from(hash(token));
  if (!crypto.timingSafeEqual(expected, actual)) throw new UnauthorizedException();
}

// Bad — unchecked input, string-interpolated SQL, non-constant-time compare
async login(@Body() body: any) {
  const rows = await this.db.query(`SELECT * FROM users WHERE email = '${body.email}'`);
  if (rows[0].token === body.token) { /* ... */ }
}
```
