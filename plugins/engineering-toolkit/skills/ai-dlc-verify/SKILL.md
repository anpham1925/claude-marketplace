---
name: ai-dlc-verify
description: "Internal phase of the ai-dlc pipeline — verifies acceptance criteria, reviews code quality, validates traceability and NFR compliance. Invoke directly only via /engineering-toolkit:ai-dlc-verify when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for acceptance verification and code review.

## Agent: Verifier

**Mission**: Confirm every acceptance criterion is met, review code quality, validate traceability completeness, and verify NFR compliance.

**Inputs**: Code + tests from Construct, `prd-plans/inception.md` (ACs, NFRs, risks), `prd-plans/specs.md` (Solution Design), Traceability Matrix from `state.md`
**Outputs**: `review-feedback.md` (Review Feedback) + updated `state.md` (Verification Report, AC status)
**Subagent type**: `general-purpose` — **MUST be a fresh subagent** (context-isolated from the Constructor to avoid bias)

## Why This Phase Exists

AI-DLC's verification combines Verify + Review into a single phase, adding traceability validation and NFR compliance checks. A fresh subagent prevents the "works on my machine" bias that comes from the same agent verifying its own work.

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify Construct is completed. Load:
- Inception Artifact from `docs/<identifier>/prd-plans/inception.md` (ACs, NFRs, risks)
- Traceability Matrix from `state.md`
- Solution Design from `docs/<identifier>/prd-plans/specs.md`

See [shared reference](../ai-dlc/reference/shared.md) for format.

### Part 1: Acceptance Criterion Verification

**Spawn a fresh Verifier subagent** (NOT the Constructor):

For each acceptance criterion:
1. Identify how to verify it (run tests, check code paths, trace data flow)
2. Execute the verification
3. Compare actual vs expected
4. Mark as **PASS**, **FAIL**, or **PARTIAL**

#### Debug Failures

For each FAIL:
- Spawn a debug subagent with: failing deliverable, expected vs actual, relevant code
- Debug agent diagnoses root cause and produces a fix
- Apply fix, re-verify
- Max 2 fix-and-verify cycles per deliverable

### Part 2: Traceability Validation

Check the traceability matrix for completeness:

| Check | Pass Criteria |
|-------|--------------|
| Every AC has Domain Model entry | (if Domain Design phase ran) |
| Every AC has Design Decision entry | Non-empty |
| Every AC has Code Files entry | Files exist and contain relevant implementation |
| Every AC has Test Files entry | Files exist and tests pass |

**Gaps are flagged as FAIL.** Missing traceability means we can't prove the AC is implemented.

### Part 3: NFR Validation

For each NFR from Inception:

| NFR Category | How to Validate |
|-------------|----------------|
| Performance | Check for N+1 queries, unbounded results, missing indexes |
| Security | Check input validation, injection vectors, auth guards |
| Scalability | Check for stateless design, connection pooling |
| Reliability | Check for retry logic, circuit breakers, error handling |
| Compliance | Check for data handling, logging, audit trails |
| Observability | Validate against the **Observability Plan** from Inception: are the planned SLIs measurable, instrumentation points implemented, structured logging present with correlation IDs? |

Mark each NFR as: **ADDRESSED** (pattern implemented), **PARTIAL** (incomplete), or **NOT ADDRESSED**.

### Part 4: Code Review

**Spawn a `code-reviewer` subagent** with risk context from state.md. Include in the prompt:
- Complexity band (e.g. "Complexity: Medium")
- Risk register entries with severity (e.g. "Risks: R-1 HIGH — concurrent balance updates")
- NFR categories flagged (e.g. "NFRs: security, reliability, data-integrity")
- The instruction: "Scale your adversarial analysis depth based on these risk signals."

This enables the code-reviewer's adversarial section to automatically calibrate depth — deep analysis for high-risk changes, light checks for routine work.

Generate the full diff (detect default branch per `rules/git-conventions.md`):
```bash
git diff ${DEFAULT_BRANCH}...HEAD
```

The code-reviewer will apply its full checklist (architecture, quality, error handling, testing, security, adversarial). In addition, verify these domain-specific checks inline:
- [ ] **Logging**: correct format (context first, message second)
- [ ] **Scope**: no unnecessary changes beyond what was requested
- [ ] **Domain model compliance**: implementation matches domain model
- [ ] **Design compliance**: implementation follows logical design decisions

### Categorize Findings

| Category | Action |
|----------|--------|
| **AUTO-FIX** | Fix immediately without asking |
| **NEEDS-INPUT** | Present to user for decision |
| **INFO** | Note for awareness, no action needed |

### Fix and Verify

- Auto-fix all AUTO-FIX items
- Run lint, type-check, and tests after fixes
- Repeat until clean

### Append to Review Feedback

After completing the code review (Part 4), append a `source: verify` entry to `docs/<identifier>/review-feedback.md`. See [shared reference](../ai-dlc/reference/shared.md#review-feedback-format) for the entry format.

Include all findings from the code review checklist — AUTO-FIX items (with what was changed), NEEDS-INPUT items, and INFO observations. This captures the local review signal for cross-ticket pattern detection.

### GATE: Review Feedback Written

Before proceeding to the Combined Report, verify:
1. `docs/<identifier>/review-feedback.md` exists
2. It contains a `source: verify` entry for this ticket
3. ALL findings from the code review (AUTO-FIX, NEEDS-INPUT, INFO) are documented

**If the file is missing or incomplete, write it NOW.** Do not proceed to the Combined Report until this gate passes. This is non-negotiable — without feedback traces, `/engineering-toolkit:review-learning` has no data for cross-ticket pattern detection.

### Produce Combined Report

```markdown
## Verification Report

### Acceptance Criteria
| # | AC | Status | Notes |
|---|-----|--------|-------|
| 1 | {criterion} | PASS | {how verified} |
| 2 | {criterion} | FAIL -> PASS | {root cause, fix applied} |

### Traceability
| Check | Status |
|-------|--------|
| All ACs → Domain Model | PASS |
| All ACs → Design Decision | PASS |
| All ACs → Code Files | PASS |
| All ACs → Test Files | PASS |

### NFR Compliance
| NFR | Status | Evidence |
|-----|--------|----------|
| NFR-1: {target} | ADDRESSED | {what was implemented} |

### Code Review
| Category | Count | Details |
|----------|-------|---------|
| AUTO-FIX | N | {summary} |
| NEEDS-INPUT | N | {summary} |
| INFO | N | {summary} |

### Fixes Applied
- {Fix 1 — what was wrong, what was changed}

### Remaining Issues
- {PARTIAL, NEEDS-INPUT, or unresolved items}
```

### Update Jira

Post verification summary as a comment.

### Update State

Update `docs/<identifier>/state.md`:
- Mark Verify as completed
- Update any traceability gaps that were fixed
- Record review decisions

### CHECKPOINT — Review Verification Results

Present results and recommend next phase (see [AI-initiated recommendation protocol](../ai-dlc/reference/shared.md#ai-initiated-recommendation-protocol)):

> **Verification complete.**
>
> - **ACs**: {N} PASS, {N} FAIL->PASS, {N} PARTIAL
> - **Traceability**: {complete | gaps in X}
> - **NFRs**: {N} addressed, {N} partial, {N} not addressed
> - **Code Review**: {N} auto-fixed, {N} needs input
>
> {If NEEDS-INPUT items exist: present them and ask for decisions}
>
> After resolving any open items, I recommend proceeding to **Release** to create a branch, commit, and open a PR.
>
> Shall I proceed?

## Rules

See [common phase rules](../ai-dlc/reference/shared.md#common-phase-rules) for state updates, Jira comments, and checkpoint protocol.

Phase-specific:
- **ALWAYS** use a fresh subagent for verification — never verify inline
- **ALWAYS** validate traceability completeness — every AC must trace through all columns
- **ALWAYS** validate NFR compliance — every NFR must be addressed
- **NEVER** skip code review — even for small changes
- Max 2 fix-and-verify cycles per deliverable
- PARTIAL items must be explicitly flagged at the checkpoint
- **NEVER** proceed past the Review Feedback gate without writing feedback — this is a blocking requirement, not optional cleanup
