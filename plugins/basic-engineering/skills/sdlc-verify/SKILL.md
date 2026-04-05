---
name: sdlc-verify
description: "Internal stage of the sdlc pipeline — verifies every acceptance criterion by walking through deliverables end-to-end. Invoke directly only via /basic-engineering:sdlc-verify when explicitly requested by name. For general requests like 'verify ACs' or 'check deliverables', use prt:sdlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for acceptance verification.

## Agent: Verifier

**Mission**: Confirm every acceptance criterion is met by exercising deliverables end-to-end.

**Inputs**: Structured Requirements (acceptance criteria) + Implementation (code + tests)
**Outputs**: Verification Report (PASS / FAIL / PARTIAL per deliverable)
**Subagent type**: `general-purpose` — **MUST be a fresh subagent** (context-isolated from the Implementer to avoid bias)

## Why This Stage Exists

Tests prove code works in isolation. Verification proves the feature works as a user would experience it. This stage catches integration gaps, missing edge cases, and acceptance criteria that passed tests but don't actually work end-to-end.

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify Implement and Test are completed. See [shared reference](../sdlc/reference/shared.md) for state.md format.

### Extract Deliverables

- Read the Structured Requirements (from Analyze) and acceptance criteria
- Create a checklist of testable deliverables — one per acceptance criterion
- Include any implicit deliverables (e.g., "error message shown" implies the error path works)

### Walk Through Each Deliverable

**Spawn a fresh Verifier subagent** for each deliverable (or group of related deliverables):
- Identify how to verify it (run a specific test, curl an endpoint, check database state)
- Execute the verification
- Compare actual vs expected outcome
- Mark as **PASS**, **FAIL**, or **PARTIAL** (works but with caveats)

### Debug Failures

For each FAIL item:
- Spawn a debug subagent with: the failing deliverable description, expected vs actual output, relevant source code
- The debug agent diagnoses root cause and produces a fix plan
- Apply the fix, re-verify the item

### Produce Verification Report

```markdown
## Verification Report

| # | Deliverable | Status | Notes |
|---|-------------|--------|-------|
| 1 | {acceptance criterion} | PASS | {how verified} |
| 2 | {acceptance criterion} | FAIL -> PASS | {root cause, fix applied} |
| 3 | {acceptance criterion} | PARTIAL | {works but Z caveat} |

## Fixes Applied
- {Fix 1 — what was wrong, what was changed}

## Remaining Issues
- {PARTIAL or unresolved items}
```

### Update Jira

Post verification report summary as a comment (see [shared reference](../sdlc/reference/shared.md) for comment format).

### Update State

Update `docs/<identifier>/state.md` — mark Verify as completed.

## Rules

- **ALWAYS** use a fresh subagent for verification — never verify inline (avoids implementation bias)
- **NEVER** skip verification for "simple" changes — even a one-line fix can break something
- Max 2 fix-and-verify cycles per deliverable — if still failing after 2 attempts, mark as FAIL and report to user
- PARTIAL items must be explicitly flagged to the Reviewer in the next stage
- **ALWAYS** update `docs/<identifier>/state.md`
- **ALWAYS** post a Jira comment after completing verification
