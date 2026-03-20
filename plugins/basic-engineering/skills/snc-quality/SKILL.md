---
name: snc-quality
description: "TRIGGER when: user says 'requirements review', 'self-review', 'code quality check', 'run quality checks', or references the requirements review or local quality stage. DO NOT trigger for: full done flow, CI/CD, or other stages."
argument-hint: '[ticket-number]'
model: sonnet
---

## Purpose

Validate that changes match requirements AND meet code quality standards — before pushing, creating PRs, or touching CI/CD. This stage has two sub-stages: **Requirements Review** (blocking gate) and **Code Quality Review**.

## Working Directory

All temporary and generated files are stored under `docs/<identifier>/` in the repo root:
- Use the ticket number if available (e.g., `docs/PRT-123/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/`)

## Standalone Invocation

```
/basic-engineering:snc-quality PRT-123
```

If no ticket number is provided, derive from the current branch name or ask the user.

---

## Requirements Review (Blocking)

### Get Requirements Source

Requirements are needed to cross-check the changes. Get them from one of these sources:

1. **Jira ticket** (preferred) — if a ticket ID is available, read it via MCP (`getJiraIssue`). Extract: summary, description, acceptance criteria, scope.
2. **PRD file** — if no ticket, ask the user for a file path to a PRD or requirements document. Read it with the Read tool.
3. **Direct input** — if neither, ask the user to paste or describe the requirements directly in the prompt.

**Never skip this step.** If no requirements source is available, ask the user. Do not proceed without requirements.

### Run Requirements Review

1. Get requirements source (see above)
2. Run `git diff master...HEAD` to see all changes
3. Run `git diff master...HEAD --name-only` to get the list of changed files
4. **Spawn a NEW subagent** (type: `general-purpose`) with the requirements review prompt below. **This MUST be a subagent, not inline review** — the main agent has been implementing the code and carries implicit bias about what it built and why. A fresh subagent sees only the requirements and the diff, giving an unbiased, adversarial perspective. Never skip the subagent and review inline.
5. The subagent returns a structured report

### Requirements Review Prompt (for subagent)

Pass the following to the subagent along with the requirements text and diff:

```
You are a requirements reviewer. Your job is to cross-check code changes against the original requirements and challenge the developer on any mismatches.

## Inputs
- Requirements: {paste requirements text}
- Changed files: {paste file list}
- Diff: {paste diff}

## Cross-Check

For each acceptance criterion in the requirements:
1. Is it fully addressed by the changes? Which files/functions implement it?
2. If partially addressed, what's missing?
3. If not addressed at all, flag it.

For each changed file in the diff:
1. Does it relate to a requirement? Which one?
2. If it doesn't relate to any requirement, flag it as **over-scope**.

## What to Look For

### Under-Delivery
- Acceptance criteria with no corresponding code changes
- Criteria that are only partially implemented (e.g., happy path but no error handling)
- Missing tests for required behaviors

### Over-Scope
- Files changed that don't relate to any acceptance criterion
- New features or refactoring beyond what was requested
- "While I'm here" improvements that weren't part of the requirements

### Gaps
- Edge cases implied by requirements but not handled
- Error paths not covered (what if the API returns 500? what if the DB is down?)
- Integration points mentioned in requirements but not wired up
- Missing validation for inputs described in requirements

## Output Format

Return EXACTLY this format:

### Requirements Coverage

| # | Acceptance Criterion | Status | Evidence |
|---|---------------------|--------|----------|
| 1 | {criterion text} | COVERED / PARTIAL / MISSING | {file:line or explanation} |

### Over-Scope Changes

| File | Change | Related Requirement | Verdict |
|------|--------|-------------------|---------|
| {file} | {what changed} | {requirement or NONE} | IN-SCOPE / OVER-SCOPE |

### Gaps Found
- {gap description} — {which requirement it relates to}

### Verdict
**PASS** — all criteria covered, no over-scope, no gaps
OR
**FAIL** — {summary of issues that must be resolved}

### Challenges for the Developer
- {direct question challenging the developer on a specific finding}
```

### Handling the Result

- If the subagent returns **PASS** — proceed to Code Quality Review
- If the subagent returns **FAIL**:
  1. Present the full report to the user
  2. For each issue, ask the user to either:
     - **Fix it** — make the code change, then re-run requirements review
     - **Accept it** — explicitly acknowledge the gap/over-scope with a reason
  3. Do NOT proceed to Code Quality Review until all issues are resolved or accepted
  4. If the user fixes code, re-run the requirements review (max 3 iterations)

---

## Code Quality Review

### Self-Review (Review Diff)

Review your own changes before committing:

1. Run `git diff` (or `git diff --cached` for staged changes) to see all modifications
2. Check each change against the review sections below
3. Append structured feedback to `docs/<identifier>/review-feedback.md` (with dated section header)
4. Fix AUTO-FIX issues immediately, ask user about NEEDS-INPUT items

### Review Sections to Check

1. **Architecture compliance** — code in correct layer
2. **Code quality** — naming, imports, error handling, logging
3. **Domain naming** — project-specific naming conventions followed
4. **Testing coverage** — unit and e2e tests present
5. **Security** — no secrets, parameterized queries, input validation
6. **Documentation** — README and PR description updated if behavior, API, config, or usage changed

### Review Categories

| Category        | What                                                    | Action                     |
| --------------- | ------------------------------------------------------- | -------------------------- |
| **AUTO-FIX**    | Lint, naming, missing types, obvious bugs               | Claude fixes without input |
| **NEEDS-INPUT** | Debatable items, design decisions, unclear requirements | Ask user before changing   |
| **INFO**        | Observations that don't require changes                 | No action needed           |

## Quality Checks

Run all checks and fix issues. Use the project's configured commands:

```bash
# Lint (auto-fix if supported)
<project-lint-command>

# Type check
<project-type-check-command>

# Run tests for affected files
<project-test-command> <affected-files>
```

Common examples:
- **yarn**: `yarn lint --fix`, `yarn type-check`, `yarn test <pattern>`
- **npm**: `npm run lint -- --fix`, `npm run type-check`, `npm test -- <pattern>`
- **pnpm**: `pnpm lint --fix`, `pnpm type-check`, `pnpm test <pattern>`
- **bun**: `bun run lint --fix`, `bun run type-check`, `bun test <pattern>`

**ALWAYS** run lint with auto-fix before staging/committing — any step that changes source code must be followed by a lint pass before `git add` or `git commit`.

## Review Feedback Format

**Append** a new dated section to `docs/<identifier>/review-feedback.md`. Never overwrite — the log is cumulative.

```markdown
---

## [YYYY-MM-DD] TICKET — source: self-review | requirements-review | ci-fix | pr-review

### AUTO-FIX

- [ ] [file:line] Description of issue and fix applied

### NEEDS-INPUT

- [ ] [file:line] Description of issue — options: A) ... B) ...

### INFO

- [file:line] Observation (no action needed)

### Summary

- **Auto-fixed**: N issues
- **Needs input**: N issues
- **Info**: N observations
```

**Source values**: `requirements-review` (Requirements Review), `self-review` (Code Quality Review), `ci-fix` (CI/CD), `pr-review` (Open PR / Address Reviews)

## Pattern Detection

Before writing a new entry, scan the existing feedback log for repeated issues:

1. Read `docs/<identifier>/review-feedback.md` if it exists
2. Compare new findings against previous entries
3. If the same type of issue appears 2+ times across different entries:
   - Flag it to the user: "Repeated issue detected: [description] — seen N times"
   - Suggest a rule improvement (e.g., add to CLAUDE.md/AGENTS.md, update a skill, add a lint rule)
4. Track patterns like: same lint error, same architectural mistake, same naming violation

## Rules

- **NEVER** skip the Requirements Review — it is a blocking gate
- **NEVER** proceed to Code Quality Review if Requirements Review returns FAIL — wait for user resolution
- **NEVER** skip the Code Quality Review
- **NEVER** auto-fix debatable items — always ask the user
- **ALWAYS** run lint, type-check, and tests
- **NEVER** delete `docs/<identifier>/review-feedback.md` — always append with a dated section header
- **ALWAYS** scan the feedback log for repeated patterns before writing a new entry
- **ALWAYS** stage any files changed by lint or formatting — never leave formatter changes as uncommitted noise
- If any quality check fails and can't be fixed, **STOP** and inform the user
