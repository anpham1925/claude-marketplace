---
name: sdlc-review
description: "Internal stage of the sdlc pipeline — code review for architecture, quality, security, and test coverage. Invoke directly only via /basic-engineering:sdlc-review when explicitly requested by name. For general requests like 'review code' or 'self-review', use prt:sdlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for code review.

## Agent: Reviewer

**Mission**: Ensure code quality, architecture compliance, and security.

**Inputs**: Full diff of all changes + Verification Report from Verifier
**Outputs**: Review feedback (categorized)
**Subagent type**: Use `code-reviewer` if defined in `.claude/agents/`, otherwise `general-purpose`

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify Verify is completed. Load the Verification Report. See [shared reference](../sdlc/reference/shared.md) for state.md format.

### Generate Full Diff

```bash
git diff origin/master...HEAD
```

### Review Checklist

- [ ] **Architecture**: code in correct layer, proper module boundaries
- [ ] **Naming**: follows conventions, domain terms correct
- [ ] **Imports**: no circular deps, correct aliases
- [ ] **Error handling**: correct error types, retry logic
- [ ] **Tests**: adequate coverage, no hardcoded dates, correct mocking
- [ ] **Security**: input validation, no injection vectors, no exposed secrets
- [ ] **Logging**: correct format (context first, message second)
- [ ] **Scope**: no unnecessary changes beyond what was requested

Include the Verification Report — any PARTIAL items should be flagged.

### Categorize Findings

| Category | Action |
|----------|--------|
| **AUTO-FIX** | Fix immediately without asking |
| **NEEDS-INPUT** | Present to user for decision |
| **INFO** | Note for awareness, no action needed |

### Fix and Verify

- Auto-fix all AUTO-FIX items
- Ask user about NEEDS-INPUT items
- Run lint, type-check, and tests after fixes:
  ```bash
  yarn lint --fix
  yarn type-check
  yarn test
  ```
- Repeat until clean

### Update Jira

Post review summary as a comment (see [shared reference](../sdlc/reference/shared.md) for comment format).

### Update State

Update `docs/<identifier>/state.md` — mark Review as completed.

### CHECKPOINT

Present review summary to user:
- AUTO-FIX items (already fixed)
- NEEDS-INPUT items (awaiting decisions)
- INFO items (for awareness)

## Rules

- **ALWAYS** generate the full diff — don't review from memory
- **NEVER** auto-fix debatable items — always ask the user
- **ALWAYS** run lint, type-check, and tests after making fixes
- **ALWAYS** flag PARTIAL items from the Verification Report
- **ALWAYS** update `docs/<identifier>/state.md`
- **ALWAYS** post a Jira comment after completing review
- **ALWAYS** checkpoint — present review summary and wait for user
