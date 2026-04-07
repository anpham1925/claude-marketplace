---
name: ship-quality
description: "Internal stage of the ship-n-check pipeline — requirements review (blocking) plus lint, type-check, and tests. Invoke directly only via /engineering-toolkit:ship-quality when explicitly requested by name. For general requests like 'check quality' or 'run local checks', use engineering-toolkit:ship-n-check which routes here automatically."
argument-hint: '[ticket-number]'
model: opus
---

> **Recommended model: Opus** — Requirements cross-checking requires deep reasoning.

## Purpose

Validate that changes match requirements AND meet code quality standards — before pushing, creating PRs, or touching CI/CD. Two sub-stages executed in order.

## Steps

### Gate Check

Read `docs/<identifier>/stage-gate.md`. Verify "Branch & Commit" is checked. See [shared reference](../ship-n-check/reference/shared.md) for stage-gate protocol.

---

## Requirements Review (Blocking)

### Get Requirements Source

Get requirements from one of these sources (in priority order):
- **Jira ticket** (preferred) — if a ticket ID is available, read via `getJiraIssue`
- **PRD file** — ask user for a file path to a PRD or requirements document
- **Direct input** — ask user to paste or describe requirements

**Never skip this step.** If no source is available, ask the user.

### Get the Diff

```bash
git diff origin/master...HEAD
git diff origin/master...HEAD --name-only
```

### Spawn Requirements Reviewer Subagent

**This MUST be a subagent, not inline review** — the main agent carries implicit bias from implementation. A fresh subagent sees only requirements + diff.

Pass the following prompt to a NEW `general-purpose` subagent:

```
You are a requirements reviewer. Your job is to cross-check code changes against the original requirements and challenge the developer on any mismatches.

## Inputs
- Requirements: {paste requirements text}
- Changed files: {paste file list}
- Diff: {paste diff}

## Cross-Check

For each acceptance criterion:
- Is it fully addressed by the changes? Which files/functions implement it?
- If partially addressed, what's missing?
- If not addressed at all, flag it.

For each changed file:
- Does it relate to a requirement? Which one?
- If not, flag as **over-scope**.

## What to Look For

### Under-Delivery
- Acceptance criteria with no corresponding code changes
- Criteria only partially implemented (happy path but no error handling)
- Missing tests for required behaviors

### Over-Scope
- Files changed that don't relate to any acceptance criterion
- New features or refactoring beyond what was requested

### Gaps
- Edge cases implied by requirements but not handled
- Error paths not covered
- Integration points mentioned but not wired up

## Output Format

### Requirements Coverage
| # | Acceptance Criterion | Status | Evidence |
|---|---------------------|--------|----------|
| 1 | {criterion} | COVERED / PARTIAL / MISSING | {file:line or explanation} |

### Over-Scope Changes
| File | Change | Related Requirement | Verdict |
|------|--------|-------------------|---------|
| {file} | {what changed} | {requirement or NONE} | IN-SCOPE / OVER-SCOPE |

### Gaps Found
- {gap description} — {which requirement it relates to}

### Verdict
**PASS** — all criteria covered, no over-scope, no gaps
OR
**FAIL** — {summary of issues}

### Challenges for the Developer
- {direct question challenging the developer}
```

### Handle the Result

- **PASS** → proceed to Code Quality Review
- **FAIL** → present the full report to the user. For each issue:
  - **Fix it** — make the change, then re-run requirements review
  - **Accept it** — explicitly acknowledge the gap with a reason
  - Do NOT proceed until all issues are resolved or accepted (max 3 iterations)

### Gate Write

Check off "Requirements Review" in `stage-gate.md`.

---

## Code Quality Review

### Self-Review the Diff

Run `git diff` (or `git diff --cached` for staged changes). Check against:

- **Architecture compliance** — code in correct layer
- **Code quality** — naming, imports, error handling, logging
- **Domain naming** — project-specific conventions
- **Testing coverage** — unit and e2e tests present
- **Security** — no secrets, parameterized queries, input validation

### Write Feedback

Append structured feedback to `docs/<identifier>/review-feedback.md`. See [shared reference](../ship-n-check/reference/shared.md) for feedback format.

Use `source: self-review` for the entry header:
```
## [YYYY-MM-DD] TICKET — source: self-review
```

Categorize findings:

| Category | Action |
|----------|--------|
| **AUTO-FIX** | Fix immediately without asking |
| **NEEDS-INPUT** | Ask user before changing |
| **INFO** | No action needed |

### Fix and Run Quality Checks

- Auto-fix AUTO-FIX items
- Ask user about NEEDS-INPUT items
- Run all checks:
  ```bash
  # Lint (auto-fix)
  yarn lint --fix      # or project equivalent
  # Type check
  yarn type-check      # or project equivalent
  # Tests
  yarn test            # or project equivalent
  ```
- Re-lint if any code changed
- Repeat until clean

### GATE: Quality Feedback Written

Before proceeding to the next stage, verify `docs/<identifier>/review-feedback.md` contains a `source: self-review` entry with all findings documented. **Do not proceed until this gate passes.**

### Gate Write

Check off "Local Quality" in `stage-gate.md`.

## Rules

- **NEVER** skip the Requirements Review — it is a blocking gate
- **NEVER** proceed to Code Quality Review if Requirements Review returns FAIL
- **NEVER** review requirements inline — always spawn a fresh subagent
- **NEVER** auto-fix debatable items — always ask the user
- **ALWAYS** run lint, type-check, and tests
- **NEVER** delete `docs/<identifier>/review-feedback.md` — always append
- **ALWAYS** scan `docs/**/review-feedback.md` for repeated patterns before writing a new entry
- **ALWAYS** stage any files changed by lint/formatting
- If any quality check fails and can't be fixed, **STOP** and inform the user
- **NEVER** proceed past quality checks without documenting findings in review-feedback.md — this is a blocking gate
