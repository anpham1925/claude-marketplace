---
name: ai-dlc-construct
description: "Internal phase of the ai-dlc pipeline — implements the solution using TDD in dependency waves, writes e2e tests, and updates the traceability matrix. Invoke directly only via /engineering-toolkit:ai-dlc-construct when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for implementation decisions across dependency waves.

## Agent: Constructor

**Mission**: Build the solution using TDD in dependency waves, write e2e tests, and maintain traceability from ACs through code to tests.

**Inputs**: `state.md`, `prd-plans/specs.md` (Solution Design), `prd-plans/flows.md`, `prd-plans/domain-model.md` (if produced)
**Outputs**: Code + unit tests + e2e tests + `prd-plans/constraints.md` + updated `state.md` (Code Files / Test Files columns of traceability matrix)
**Return Contract**: see [Subagent Return Contract](../ai-dlc/reference/shared.md#subagent-return-contract) — final return MUST be the 7-line structured shape, not free-form prose
**Subagent type**: `general-purpose` — each wave component gets its own subagent with fresh context

**Definition of Done**:
- Every AC has at least one passing unit test — ACs without test coverage fail the phase
- E2E tests cover the happy path plus the critical failure modes from Logical Design
- Language-appropriate lint, type-check, and test suites are green locally
- Traceability matrix updated: AC → file(s) → test(s)
- No TODOs or commented-out code introduced; no hardcoded dates
- For bug-fix intents: fix report written (symptom → root cause → fix → regression test)
- Every constraint in `prd-plans/constraints.md` is encoded as a CI assertion (grep, lint rule, or runtime check) that fails on violation. The constraints file itself is durable (kept after merge).

## Why This Phase Exists

AI-DLC's Construction phase is the "Bolt" — an intense, rapid implementation cycle. It combines Implement + Test into a single phase, producing a cohesive deliverable with full test coverage and traceability to acceptance criteria.

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify the prerequisite design phase is completed. Load:
- Solution Design from `docs/<identifier>/prd-plans/specs.md`
- Flow diagrams from `docs/<identifier>/prd-plans/flows.md`
- Domain Model from `docs/<identifier>/prd-plans/domain-model.md` (if exists)
- Traceability Matrix from state.md
- **Pre-push / pre-commit hook** at `.husky/pre-push`, `.husky/pre-commit`, `lefthook.yml`, or `.git/hooks/pre-{push,commit}` — Construct's Wave Gate must run a superset of its commands (see §Wave Gate below)

See [shared reference](../ai-dlc/reference/shared.md) for format.

### Create Branch

If not already on a feature branch, create one before starting. See [shared reference](../ai-dlc/reference/shared.md) for branch naming convention.

### Transition Ticket

Before starting construction:
- **Move to In Progress**: Use `getTransitionsForJiraIssue` to find the transition ID, then `transitionJiraIssue`
- **Assign to current user**: Use `lookupJiraAccountId`, then `editJiraIssue`

If Jira operations fail, warn and continue — never block for a Jira update.

### Extract Constraints

Before any code is written, scan the Solution Design (`prd-plans/specs.md`) and Logical Design for **negative requirements** — explicit prohibitions, "always X" rules, and "we deliberately do NOT do Y" rationales. These are the requirements most likely to be lost when a subagent summarizes the spec to write code from it.

Search the spec for prohibitive phrases: `must not`, `never`, `do not`, `deliberately`. Pay special attention to passages of the form "Why we use X (and not Y)" — Y is a prohibition. (Note: `always` and `only` appear in both positive and negative requirements; if found, re-read the sentence to verify a prohibition before extracting it as a constraint.)

Write each one to `docs/<identifier>/prd-plans/constraints.md` with this shape:

```markdown
# Construct Constraints

## C-1 — Worker must run continuously as a daemon
- **Forbidden tokens**: `--stop-when-empty`
- **Required behavior**: `queue:work` invoked without lifecycle-exit flags
- **Rationale (verbatim)**: "We **always** want the worker process to keep going... `--stop-when-empty` would make the worker exit when the queue empties under normal operation — wrong shape for a daemonset."
- **Source**: `prd-plans/specs.md § Worker lifecycle`
- **Enforcement**: CI grep `! grep -r 'stop-when-empty' helm/`
```

**Why this step exists**: Subagents that synthesize implementation from a spec reliably preserve positive requirements ("use queue:work, daemon-shaped") but lose negative ones ("never use --stop-when-empty"). Extracting constraints once, up front, into a structured machine-checkable file means every subsequent subagent and every CI check operates against the same canonical "what NOT to do" list.

This file is **durable** — kept in the repo after merge, the same way `specs.md` and `domain-model.md` are kept. It's not pipeline plumbing.

Present the constraints file to the user before starting waves. Each entry should be challenged: "is this enforceable?" If a constraint can't be encoded as a grep, lint rule, or runtime check, it must be reframed until it can — otherwise it's an aspiration, not a constraint.

### Organize into Dependency Waves

Analyze the file plan from Logical Design. Group by dependency:

- **Wave 1**: Foundational (no internal deps) — domain models, value objects, DTOs, event schemas
- **Wave 2**: Depends on Wave 1 — services, command/query handlers, repositories
- **Wave 3+**: Depends on previous — controllers, integration wiring, module registration

For small tickets (1-2 components), a single wave is fine.

Present the wave plan to the user before starting.

### Execute Each Wave (TDD)

Within a wave, **launch parallel subagents** for independent components:
- Each subagent receives: Solution Design + Domain Model + **`prd-plans/constraints.md` verbatim (never summarized)** + relevant existing code only
- Each subagent's prompt MUST include a **constraint acknowledgement** preamble:
  > "Before writing code, list which constraints from `constraints.md` apply to your component and state how each will be avoided. After finishing, run `grep -r '<forbidden_tokens>' <changed files>` for every applicable constraint and report any matches as a violation."
- Each subagent follows the TDD loop below
- Wait for all subagents in a wave to complete before starting the next wave
- After each wave, run all tests **and run the constraints grep across all changed files** — any match is a violation that must be fixed before the next wave starts

### TDD Loop (for each behavior within a component)

**Anti-pattern — horizontal slicing.** Do NOT write all tests first, then all implementation. Tests written in bulk verify *imagined* behavior — they test the shape of data/signatures instead of user-facing behavior, and they become insensitive to real changes. Within a wave, each component goes one test → one implementation → repeat. Each test responds to what you learned from the previous cycle.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical tracer bullets):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  ...
```

- **Red** — Write a failing test
  - **Test authoring is owned by the `engineering-toolkit:inspector` agent.** Within a wave, dispatch `engineering-toolkit:inspector` (passing the `<id>` + the constraint file + the AC under test) to author the failing test; it owns all test files, writes its RED report to `.claude/artifacts/<id>/inspector-report.md`, and returns a pointer. The implementing subagent does not write tests — it reads the inspector's report by path and makes them pass (see `rules/agent-artifacts.md`).
  - Test file next to implementation (`.spec.ts`)
  - AAA pattern: Arrange, Act, Assert
  - Test the specific behavior from an acceptance criterion
  - Run the test — verify it fails for the right reason
- **Green** — Write minimum code
  - Only enough to make the test pass
  - Don't optimize or generalize yet
  - Run the test — verify it passes
  - **If test fails**: Enter the Self-Correction Loop (see below)
- **Validate** — Run computational sensors immediately
  - `lint --fix` on changed files
  - `type-check` on changed files
  - Fix any issues before proceeding — don't accumulate errors
- **Refactor** — Clean up
  - Remove duplication, improve naming
  - Run tests — verify still green
- **Commit** — Save progress
  - Commit after each Green phase
  - Message: `{action}: [TICKET] {what behavior was added}` — use `feat:` for features, `fix:` for bug-fixes (match the intent type from Level 1 Plan)

### Self-Correction Loop (max 3 attempts)

When a test fails during the Green phase:

```
Attempt 1: Read error → fix → re-run test
Attempt 2: Read error + review test assumptions → fix → re-run test
Attempt 3: Read error + review design alignment → fix → re-run test
→ Still failing? STOP — flag to user with error context
```

**Debugging-probe hygiene**: if you use throwaway probe scripts (temp `.int-spec.ts` files, ad-hoc curl loops, SQL probes) to surface an unmapped error, follow [background-process-discipline](../../rules/background-process-discipline.md) — wait on, kill, or re-use every backgrounded probe. Abandoning a probe to try a different approach without killing it leaks DB connections and CPU.

Each retry MUST feed the error message back as context. Don't retry blindly — each attempt should try a different approach based on what the error reveals:
- Attempt 1: Fix the obvious issue (typo, missing import, wrong assertion)
- Attempt 2: Question the test — is the test correct? Does it match the AC?
- Attempt 3: Question the design — does the implementation approach need to change?

### Wave Gate (after every wave; before declaring it complete)

Before declaring a wave complete, run the **full** local test surface — not just the default `pnpm test` / `yarn test` script. Many projects split fast unit tests from slower integration suites behind an env flag (`INTEGRATION=1`, `E2E=1`, `pnpm test:integration`, `make integration-test`, etc.) and the default `test` script runs the unit subset only. A passing unit run says nothing about the integration surface.

Discovery order (do this once at the start of Construct; cache the discovered command set in `prd-plans/constraints.md`):

1. **Read the pre-push hook** at `.husky/pre-push` / `lefthook.yml` / `.git/hooks/pre-push`. Whatever it runs is the canonical "green locally" definition. The Wave Gate MUST run a superset of these commands. **In well-maintained repos this single source is usually sufficient.**
2. **Read the project's CI configuration** — `.github/workflows/*.yml`, `.gitlab-ci.yml`, `.circleci/config.yml`, `azure-pipelines.yml`, `Jenkinsfile` — for the non-unit test jobs. CI is the ultimate ground truth for "what counts as green" and most repos commit it.
3. **Read the language-appropriate task runner** based on what's in the repo:
   - **Node/TS**: `package.json` `scripts` for entries with `integration`, `e2e`, `int-spec`, or `int-test`
   - **Python**: `Makefile`, `justfile`, `pyproject.toml` `[tool.pytest.ini_options]` markers (commonly `pytest -m integration`)
   - **Go**: `Makefile` targets, `go test -tags integration` patterns in `scripts/`, or build-tag-gated `_test.go` files
   - **Rust**: `Cargo.toml` `[features]` for `integration`, or `cargo test --features integration` in CI
   - **JVM (Gradle/Maven)**: `build.gradle` task names like `integrationTest`, `pom.xml` `<phase>` bindings
4. **Spot-check `test/integration/` / `tests/integration/` / `integration_test.go` files** — if integration tests exist but no obvious script targets them, the project gates them behind an env var, build tag, or marker; find it in the integration-suite's config.

If steps 2-4 surface a command set that's missing from step 1's hook, the hook is incomplete — but Wave Gate still runs the broader set (CI catches what local doesn't, so Wave Gate should match CI not the hook).

Run the discovered command set at every wave gate. If any command fails, fix before the next wave starts — accumulated integration failures are far more expensive to triage after multiple waves stack changes.

**Why this is non-negotiable**: pre-push hooks are the last line of defence and they run integration suites by default in well-maintained repos. A Construct that satisfies only `pnpm test` and declares Verify PASS, then loses at `git push` to an integration-suite regression, forces a 30-60 min fix-and-push cycle on the Release path — including a fixup commit that breaks PR atomicity. The few extra minutes per wave are dramatically cheaper.

### Write E2E Tests

After implementation waves complete (or in parallel once contracts are stable):

- One e2e test per acceptance criterion
- Edge cases: invalid input, missing data, unauthorized, boundary values
- Error paths: external service failures, invalid state, validation failures
- Only mock external services — never mock internal modules
- Dynamic dates (never hardcode)
- Verify DB state, not just API response

### Update Traceability Matrix

After each wave, update the traceability matrix in `state.md`:

| AC | Domain Model | Design Decision | Code Files | Test Files |
|----|-------------|-----------------|------------|------------|
| AC-1 | Refund aggregate | CQRS pattern | `refund.entity.ts`, `create-refund.handler.ts` | `refund.entity.spec.ts`, `create-refund.e2e-spec.ts` |

**Every AC must have entries in Code Files and Test Files columns.**

### Follow the Design

- Use the file structure from the Solution Design
- Implement the interfaces/contracts as defined
- Follow the domain model (aggregates, events, rules)
- Don't deviate without flagging it

### Handle Deviations

If the design doesn't work in practice:
- Document why
- Suggest an alternative
- Flag to user at next checkpoint
- Don't silently change the approach

### Write Fix Report (bug-fix intents only)

When the Level 1 Plan classifies the intent as **bug-fix**, produce `docs/<identifier>/prd-plans/fix-report.md`:

```markdown
# Fix Report: <TICKET>

## Symptom
{What the user/system observed — error message, wrong behavior, data inconsistency}

## Root Cause
{Why it happened — the actual code/logic/data defect, not just where it broke}
{Reference specific file:line where the defect lived}

## Investigation
{How the root cause was found — what was checked, what was ruled out}
- Checked: {what was investigated}
- Ruled out: {alternative hypotheses that were eliminated}

## Fix
{What was changed and why this fix is correct}
- `path/to/file.ts:line` — {what changed}

## Regression Prevention
- **Test added**: {test file and what it covers}
- **Why it wasn't caught**: {gap in existing tests or monitoring}

## Impact
- **Affected users/flows**: {scope of the bug}
- **Data remediation**: {needed | not needed — details if needed}
```

**Why**: Bug fixes skip Domain Design and Logical Design, so without this file there's no durable design artifact. The fix-report captures *why* it broke, *how* it was fixed, and *how we prevent it next time* — context that a code diff alone can't provide. Future features touching the same area benefit from knowing what went wrong here.

This file is **kept** after merge (same as specs.md/domain-model.md) — it's durable knowledge, not pipeline plumbing.

**Durable language rule**: In the Root Cause, Fix, and Regression Prevention sections, describe **modules, behaviors, and contracts** — not file paths or line numbers. A `file.ts:42` reference rots the moment the file is renamed or split. Keep file:line references inside `investigation.md` (short-lived) but strip them from the fix-report. The fix-report should read like a spec about a durable concept ("the retry handler on the webhook consumer"), not a diff ("lines 40-58 of consumer.ts").

### Update Jira

Dispatch the [clerk agent](../../agents/clerk.md) via the Task tool with the [Phase→Clerk brief](../ai-dlc/reference/shared.md#phase-clerk-brief). See [Failure semantics](../ai-dlc/reference/shared.md#failure-semantics-for-clerk-dispatch) — even if clerk fails, the phase still marks completed in `state.md` (consistent with the existing "warn and continue" promise at line 53 of this file).

Brief at this call site:
- `state`: completed
- `phase`: construct
- `summary`: "Construct complete — {n_waves} TDD wave(s), {ac_done}/{ac_count} ACs delivered"
- `state_md_path`: `docs/<identifier>/state.md`
- `ac_count` / `nfr_count` / `risk_count`: from state.md tables
- `files`: list of changed files (relative to repo root)
- `branch`: current branch (`git rev-parse --abbrev-ref HEAD`)
- `repo`: repository name or path

### Update State

Update `docs/<identifier>/state.md`:
- Mark Construct as completed
- Update Traceability Matrix (Code Files + Test Files columns)
- Record any deviations from design

## Implementation Rules

- Follow existing code patterns from Inception/Design research
- Use existing utilities before creating new ones
- Only mock external services in tests
- Dynamic dates in all tests
- Proper logging (context first, message second)
- Proper error handling (domain errors extend DomainError)
- Every AC must have at least one unit test and one e2e test

## Rules

See [common phase rules](../ai-dlc/reference/shared.md#common-phase-rules) for state updates, Jira comments, and checkpoint protocol.

Phase-specific:
- **NEVER** implement without reading the Solution Design first
- **NEVER** launch a wave subagent without `constraints.md` in its prompt verbatim — summarizing it loses negative requirements, which is the primary failure mode this step prevents
- **NEVER** complete a wave without running the constraints grep against changed files
- **NEVER** skip TDD — write tests first, always
- **NEVER** skip the Validate step — lint + type-check after every Green, not just at the end
- **NEVER** retry a failing test blindly — each attempt must use a different approach based on the error
- **NEVER** horizontal-slice within a wave — one test → one implementation → repeat, never test1..N then impl1..N
- **ALWAYS** use subagents for implementation — never execute inline
- **ALWAYS** commit after each Green phase
- **ALWAYS** run all tests after each wave to catch conflicts
- **ALWAYS** use existing test factories/fixtures before creating inline test data
- If the design doesn't work in practice, flag it — don't silently deviate
- If the self-correction loop exhausts 3 attempts, STOP and flag to user
