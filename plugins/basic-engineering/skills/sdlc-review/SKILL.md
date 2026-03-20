---
name: sdlc-review
description: "TRIGGER when: user says 'review the code', 'code review', 'check my changes', or references the review stage. DO NOT trigger for: full SDLC pipeline, PR review, or ship-n-check review."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep code review requires nuanced judgment.

## Purpose

Ensure code quality, architecture compliance, and security before the code leaves the developer's machine. This is the sixth stage of the SDLC pipeline but can run standalone.

## Standalone Invocation

```
/basic-engineering:sdlc-review PRT-123
```

If no ticket ID is provided, derive from the current branch name or ask the user.

## State Tracking

Read `docs/<identifier>/STATE.md` at start (if it exists). Update Current stage, Status, Artifacts, and Notes when done. If standalone (no orchestrator), derive identifier from branch name.

## Agent: Reviewer

**Mission**: Ensure code quality, architecture compliance, and security.
**Model**: opus

**Subagent type**: Use `code-reviewer` if defined in `.claude/agents/`, otherwise `general-purpose`

### Inputs
- Full diff of all changes + verification report

### Outputs
- Review feedback (categorized)

## Steps

- **Generate the full diff**
  - `git diff master...HEAD`

- **Review checklist**:
  - [ ] Architecture: code in correct layer, proper boundaries
  - [ ] Naming: follows conventions, domain terms correct
  - [ ] Imports: no circular deps, correct aliases
  - [ ] Error handling: correct error types, retry logic
  - [ ] Tests: adequate coverage, no hardcoded dates, correct mocking
  - [ ] Security: input validation, no injection vectors
  - [ ] Logging: correct format (context first, message second)
  - [ ] No unnecessary changes beyond scope

- **Categorize findings**

  | Category | Action |
  |----------|--------|
  | AUTO-FIX | Fix immediately without asking |
  | NEEDS-INPUT | Present to user for decision |
  | INFO | Note for awareness, no action needed |

- **Fix and verify**
  - Auto-fix all AUTO-FIX items
  - Ask user about NEEDS-INPUT items
  - Run `yarn lint --fix`, `yarn type-check`, `yarn test` after fixes
  - Repeat until clean

- **CHECKPOINT** — Present review summary to user

## Rules

- **NEVER** skip the review — always review before shipping
- **NEVER** auto-fix debatable items — always ask the user
- **ALWAYS** review against the full checklist
- **ALWAYS** categorize findings as AUTO-FIX / NEEDS-INPUT / INFO
- **ALWAYS** run lint, type-check, and tests after fixes
- **ALWAYS** update STATE.md after completion
- **ALWAYS** present review summary at the CHECKPOINT and wait for approval
