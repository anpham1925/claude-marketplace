# Code Review Process

## Review Checklist

- [ ] **Architecture Compliance** — code in correct layer, dependency direction respected
- [ ] **Naming Conventions** — descriptive names, consistent casing, no generic "Service" names
- [ ] **Import Rules** — no circular dependencies, clean module boundaries
- [ ] **Error Handling** — correct error types, errors logged before transforming, no swallowed errors
- [ ] **Logging** — structured logging with context, consistent format
- [ ] **Testing** — AAA pattern, dynamic dates, only external services mocked
- [ ] **Comments** — explain WHY not WHAT, action comments (TODO/FIXME) have context
- [ ] **Security** — no secrets in code, input validation at boundaries, parameterized queries
- [ ] **Existing Patterns** — checked for existing utilities/patterns before reinventing

## 5-Section Review

### 1. Architecture Compliance

- Code in the correct layer?
- Layer dependency rules respected? (Presentation -> Application -> Domain -> Infrastructure)
- No improper code sharing between separate applications?

### 2. Code Quality

- Specific class/function names (not generic "Service")?
- No circular dependencies?
- Comments explain WHY not WHAT?
- Existing shared utilities used?

### 3. Testing

- Unit tests for new business logic?
- E2e tests for new endpoints?
- Only external services mocked?
- No hardcoded dates?
- AAA pattern followed?

### 4. Security

- No secrets or credentials in code?
- Input validation at system boundaries?
- Parameterized queries?
- Least privilege applied?

### 5. Domain-Specific

- Domain naming conventions followed?
- State transitions valid?
- Domain events raised at correct points?
- Backward compatible?

## Output Format

```
## Code Review: [Feature/PR Name]

### Architecture Compliance: [PASS | NEEDS IMPROVEMENT | FAIL]
- [Findings]

### Code Quality: [PASS | NEEDS IMPROVEMENT | FAIL]
- [Findings]

### Testing: [PASS | NEEDS IMPROVEMENT | FAIL]
- [Findings]

### Security: [PASS | NEEDS IMPROVEMENT | FAIL]
- [Findings]

### Domain-Specific: [PASS | NEEDS IMPROVEMENT | FAIL]
- [Findings]

### Summary
- **Overall**: [PASS | NEEDS IMPROVEMENT | FAIL]
- **Blocking Issues**: [List or "None"]
- **Suggestions**: [Non-blocking improvements]
```
