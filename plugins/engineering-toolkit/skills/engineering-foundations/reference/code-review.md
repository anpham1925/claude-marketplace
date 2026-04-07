# Code Review Process

> Claude already knows how to review code. This file covers **our specific review checklist and the format we expect**.

## 5-Section Review

### Architecture Compliance

- Code in the correct layer? (Presentation → Application → Domain → Infrastructure)
- Layer dependency rules respected? (no upward imports)
- No improper code sharing between separate applications?

### Code Quality

- Specific class/function names (not generic "Service", "Helper", "Utils")?
- No circular dependencies?
- Comments explain WHY not WHAT?
- Existing shared utilities reused instead of reinvented?

### Testing

- Unit tests for new business logic?
- E2e tests for new endpoints?
- Only external services mocked? (see tdd.md for details)
- No hardcoded dates?

### Security

- No secrets or credentials in code?
- Input validation at system boundaries?
- Parameterized queries (no string concatenation in SQL)?
- Least privilege applied?

### Domain-Specific

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

## Gotchas for Self-Review

- Claude tends to mark its own code as PASS across all sections. Be adversarial with your own output.
- Claude skips the "scope creep" check — always verify no unnecessary changes snuck in beyond the requirements.
- Claude writes long review comments instead of categorizing into AUTO-FIX / NEEDS-INPUT / INFO. Use the categories.
