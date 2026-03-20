---
name: sdlc-verify
description: "TRIGGER when: user says 'verify this', 'check the implementation', 'goal-backward verification', 'are we done', or references the verification stage. DO NOT trigger for: full SDLC pipeline, code review, or other stages."
argument-hint: '[TICKET-ID]'
model: sonnet
---

> **Recommended model: Sonnet** — Systematic checks — grep/glob verification, not creative.

## Purpose

Confirm the implementation achieves the goal, not just that tasks completed. Task completion ≠ goal achievement. This is the fifth stage of the SDLC pipeline but can run standalone.

## Standalone Invocation

```
/basic-engineering:sdlc-verify PRT-123
```

If no ticket ID is provided, derive from the current branch name or ask the user. Expects `docs/<identifier>/prd-plans/specs.md` and implementation code to exist.

## State Tracking

Read `docs/<identifier>/STATE.md` at start (if it exists). Update Current stage, Status, Artifacts, and Notes when done. If standalone (no orchestrator), derive identifier from branch name.

## Agent: Verifier

**Mission**: Confirm the implementation achieves the goal, not just that tasks completed.
**Model**: sonnet

**Subagent type**: `general-purpose`

### Inputs
- Goal + Must-Haves (from `specs.md`) + Implementation (code)

### Outputs
- Verification report (PASSED / GAPS_FOUND / HUMAN_NEEDED)

### Core Principle
Do NOT trust task completion claims or summaries. Verify independently by checking files on disk, running grep checks, and tracing wiring.

## Steps

- **Extract must-haves**
  - Read `specs.md` — the Goal and Must-Haves are the source of truth
  - Each must-have becomes a verification target

- **Three-level artifact check** (for each must-have):

  | Level | Question | How to check |
  |-------|----------|--------------|
  | **Exists** | Is the file/function/endpoint present? | Glob for the file, grep for the symbol |
  | **Substantive** | Is it a real implementation, not a stub? | Check for TODO/FIXME, empty returns, placeholder values, log-only handlers |
  | **Wired** | Is it connected to the system? | Check imports, route registrations, DI bindings, module exports |

- **Anti-pattern scan** across all new/modified files:
  - `TODO`, `FIXME`, `HACK` in new code
  - Empty catch blocks
  - Functions that only log (no business logic)
  - Exports with zero external call sites (dead code)

- **Identify human-needed items**
  - Visual correctness, UX flow, performance under load
  - These can't be machine-verified — list them explicitly

- **Produce verification report** (see template below)

- **Gap closure loop**:
  - If GAPS_FOUND → return specific gaps to Implementer → Implementer fixes → Verifier re-checks
  - On re-verification: deep check on previously failed items, quick regression check on passed items
  - **Max 2 gap-closure iterations** — after that, surface remaining gaps at the Review checkpoint

## Three-Level Verification Patterns

### Level 1: Exists

```bash
# File exists
glob "src/modules/foo/handlers/bar.handler.ts"

# Symbol exists
grep "export class BarHandler" src/modules/foo/

# Route exists
grep "'/api/v1/bar'" src/apps/
```

### Level 2: Substantive

**Red flags** (any of these = FAIL at level 2):
- `TODO`, `FIXME`, `HACK`, `XXX` in the implementation
- Empty function body or `return undefined`/`return null` without logic
- `console.log` or `logger.log` as the only statement in a handler
- `throw new Error('Not implemented')`
- Placeholder values: `'placeholder'`, `'TODO'`, `0` as default for business logic

**Technology-specific checks:**

| Artifact | Stub indicator |
|----------|---------------|
| API handler/controller | Returns hardcoded response, no service call |
| Service method | Empty body or just logs |
| Repository/query | Returns empty array/null without querying |
| Database migration | Empty `up()` or `down()` |
| Test file | Only `it.todo()` or `test.skip()` |
| React component | Returns `null` or `<div>TODO</div>` |
| Event handler | Only logs, no business logic |
| DTO/validation | No validation decorators or constraints |

### Level 3: Wired

**Common wiring patterns to check:**

| Integration | How to verify |
|------------|---------------|
| Handler → Service | Handler file imports and calls the service |
| Service → Repository | Service file imports and calls the repository |
| Controller → Route | Controller is registered in the module's routing |
| Module → App | Module is imported in the app module |
| Event → Handler | Event handler is registered (e.g., `@EventPattern`, `@OnEvent`) |
| Migration → Schema | Migration creates/alters the table that the entity maps to |
| DTO → Controller | Controller method parameter uses the DTO type |
| Guard → Route | Guard is applied via decorator or module config |

**How to check wiring:**
```bash
# Is the handler imported anywhere?
grep "import.*BarHandler" src/ --include="*.ts"

# Is the module registered?
grep "BarModule" src/apps/ --include="*.module.ts"

# Is the route reachable?
grep "bar" src/apps/ --include="*.controller.ts"

# Does anything call this service method?
grep "barService\.\(create\|update\|delete\)" src/ --include="*.ts"
```

**Dead export detection:**
```bash
# Find exports with zero external consumers
# If a symbol is exported but grep finds it only in its own file → dead code
```

## Anti-Pattern Scan

Run across ALL new/modified files (use `git diff --name-only master...HEAD`):

| Pattern | Grep | Severity |
|---------|------|----------|
| TODO/FIXME in new code | `grep -n 'TODO\|FIXME\|HACK\|XXX'` | HIGH — must be resolved |
| Empty catch | `grep -n 'catch.*{}\|catch.*{\s*}'` | HIGH — swallows errors |
| Log-only handler | Function with only `console.log`/`logger` calls | MEDIUM — no business logic |
| Hardcoded credentials | `grep -n 'password\|secret\|api.key.*=.*"'` | CRITICAL — security |
| Dead exports | Export not imported anywhere outside its file | LOW — cleanup |

## Verification Report Template

```markdown
## Verification Report — <identifier>

**Outcome**: PASSED | GAPS_FOUND | HUMAN_NEEDED
**Date**: <timestamp>
**Specs**: <path to specs.md>

### Must-Have Verification

| # | Must-Have | Exists | Substantive | Wired | Status |
|---|-----------|--------|-------------|-------|--------|
| 1 | <criterion from specs.md> | ✓ | ✓ | ✓ | PASS |
| 2 | <criterion> | ✓ | ✗ (stub) | — | FAIL |

### Gaps

- `src/modules/foo/bar.handler.ts:42` — handler returns hardcoded response, no service call (Level 2 fail)
- `src/modules/foo/bar.module.ts` — BarHandler not registered in providers (Level 3 fail)

### Anti-Patterns

- `src/modules/foo/baz.service.ts:15` — `// TODO: implement validation` in new code
- `src/modules/foo/error.handler.ts:8` — empty catch block

### Human Verification Needed

- Visual: verify the new dashboard widget renders correctly at different viewport sizes
- Performance: verify batch processing handles 10k+ records without timeout

### Re-verification Notes (if gap closure iteration)

- Previously failed items re-checked: <list>
- Regression check on passed items: <all still passing | issues found>
```

## What Good Verification Looks Like

- Every must-have checked at all 3 levels (not just "file exists")
- Gaps reference specific file:line locations (not vague descriptions)
- Human-needed items are explicit (not a catch-all for "I didn't check")
- Anti-pattern scan covers all new code, not just the happy path

## Rules

- **NEVER** skip verification — task completion != goal achievement
- **NEVER** trust task completion claims — verify independently on disk
- **ALWAYS** check at all 3 levels: exists, substantive, wired
- **ALWAYS** run anti-pattern scan on all new/modified files
- **ALWAYS** produce a structured verification report
- **ALWAYS** update STATE.md after completion
- Max 2 gap-closure iterations — surface remaining gaps at the Review checkpoint
