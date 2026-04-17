---
name: continuous-learning
description: "TRIGGER when: user says 'learn from this', 'save this pattern', 'remember this approach', 'extract instincts', 'what have we learned', 'instinct status', or wants to capture reusable patterns from the current session. DO NOT trigger for: saving user preferences (use memory), documenting decisions (use ADRs), or one-time context."
model: opus
---

# Continuous Learning — Instinct Extraction

Mine sessions for reusable patterns and codify them as "instincts" — atomic, high-confidence behaviors that improve over time.

## What is an Instinct?

An instinct is a specific, actionable pattern learned from experience:

```yaml
- id: "ts-zod-derive"
  pattern: "When creating TypeScript types for API boundaries, derive types from Zod schemas using z.infer<>"
  confidence: 0.7
  evidence:
    - "Session 2024-01-15: Caught type/schema drift in payment API"
    - "Session 2024-02-03: Prevented validation bug in user registration"
  scope: project  # project | global
  tags: [typescript, validation, api]
```

## Confidence Scores

| Score | Meaning | Action |
|---|---|---|
| 0.3 | Observed once, might be coincidence | Record but don't apply automatically |
| 0.5 | Seen 2-3 times, likely a real pattern | Apply when relevant, mention to user |
| 0.7 | Consistent pattern with evidence | Apply proactively |
| 0.9 | Battle-tested, never been wrong | Apply always |

## Instinct Lifecycle

```
Observation → Candidate (0.3) → Pattern (0.5) → Instinct (0.7) → Principle (0.9)
                                                                      ↓
                                                              Auto-promote to global
                                                              (when seen in 2+ projects)
```

## How to Extract Instincts

### From Current Session

1. Review what happened in this session:
   - What bugs were found and fixed?
   - What patterns worked well?
   - What approaches failed and why?
   - What did the code review catch?

2. For each observation, ask:
   - Is this specific enough to be actionable?
   - Would this help in a different context?
   - Is it about the project, or about engineering in general?

3. Write instincts to `.claude/instincts.yml`:

```yaml
instincts:
  - id: "unique-kebab-case-id"
    pattern: "Clear, actionable statement"
    confidence: 0.3  # Start low, increase with evidence
    evidence:
      - "Session YYYY-MM-DD: What happened"
    scope: project
    tags: [relevant, tags]
    created: "YYYY-MM-DD"
    updated: "YYYY-MM-DD"
```

### From Git History

Scan recent commits for patterns:
1. `git log --oneline -20` — What kinds of fixes keep recurring?
2. `git log --all --grep="fix:"` — What breaks most often?
3. Look for patterns in:
   - Repeated fix types (same module, same error class)
   - Review feedback themes
   - CI failures

### From Code Review Feedback

When reviewing or addressing review comments:
1. Was this feedback predictable? Could a rule have caught it?
2. Is this the second time this feedback has come up?
3. If yes → create or strengthen an instinct

## Instinct Management

### View Current Instincts
Read `.claude/instincts.yml` and present summary:
```
## Instinct Status

**Total:** 12 instincts (3 global, 9 project-scoped)

### High Confidence (≥0.7)
- [ts-zod-derive] Derive TS types from Zod schemas — 0.8 (4 evidence)
- [api-error-envelope] Wrap all API errors in standard envelope — 0.7 (3 evidence)

### Growing (0.4-0.6)
- [test-date-freeze] Freeze time in date-dependent tests — 0.5 (2 evidence)

### New (≤0.3)
- [retry-jitter] Add jitter to retry delays — 0.3 (1 evidence)

### Ready for Promotion (project → global)
- [ts-zod-derive] Seen in 2 projects, confidence 0.8 ✓
```

### Update Confidence
When an instinct is confirmed or contradicted:
- Confirmed: `confidence = min(confidence + 0.1, 0.9)`
- Contradicted: `confidence = max(confidence - 0.2, 0.1)`
- If confidence drops below 0.1: remove the instinct

### Promote to Global
When an instinct reaches confidence ≥ 0.8 AND has been observed in 2+ projects:
1. Move from `.claude/instincts.yml` to `~/.claude/global-instincts.yml`
2. Set `scope: global`
3. Keep project-specific evidence

## Integration with Other Skills

- **Engineering Foundations**: Instincts inform the proactive checklist
- **Code Review**: High-confidence instincts become review checklist items
- **AI-DLC Logical Design**: Instincts about architecture inform option evaluation
- **Ship-n-Check**: Instincts about CI failures inform fix strategies

## Anti-Patterns

- **Too vague**: "Write good tests" is not an instinct. "Freeze `Date.now()` in tests that compare timestamps" is.
- **Too project-specific**: "Use `PaymentService.retry()`" is too narrow. "Add jitter to retry delays to prevent thundering herd" is reusable.
- **Never pruning**: Instincts that are never confirmed should decay and be removed.
- **Starting at high confidence**: Always start at 0.3. Earn confidence through evidence.
