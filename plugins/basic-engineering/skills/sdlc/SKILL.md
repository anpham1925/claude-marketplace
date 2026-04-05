---
name: sdlc
description: Primary development workflow skill. Use this whenever the user mentions a Jira ticket ID (PRT-xxx, PART-xxx), wants to start development, analyze requirements, design a solution, break down tasks, implement features, write tests, verify acceptance criteria, review code, or release. This orchestrator routes to the right stage automatically. Triggers for "start PRT-123", "work on this ticket", "analyze this ticket", "design the solution", "break this down", "implement this", "write tests", "verify ACs", "review the code", "TDD this", "gather requirements", "plan implementation", "architect this", "quick fix for TICKET", "full pipeline". Always prefer this over individual sdlc-* stage skills unless the user explicitly invokes a stage by name (e.g. /basic-engineering:sdlc-analyze). Do NOT use for git/shipping operations after code is written — use ship-n-check instead.
argument-hint: '[stage] [TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — This skill orchestrates deep reasoning across multiple stages.

## Quick Navigation

| Stage | Skill | What It Does |
|-------|-------|-------------|
| Analyze | `/basic-engineering:sdlc-analyze` | Jira ticket -> structured requirements |
| Design | `/basic-engineering:sdlc-design` | Requirements -> solution design + plan summary |
| Break Down | `/basic-engineering:sdlc-breakdown` | Plan -> independent sub-tasks (optional) |
| Implement | `/basic-engineering:sdlc-implement` | Design -> code + unit tests (TDD) |
| Test | `/basic-engineering:sdlc-test` | Design + code -> e2e tests |
| Verify | `/basic-engineering:sdlc-verify` | ACs + code -> verification report |
| Review | `/basic-engineering:sdlc-review` | Code changes -> review feedback |
| Release | `/basic-engineering:sdlc-release` | Approved code -> merged PR (delegates to ship-n-check) |

## Invocation

```
/basic-engineering:sdlc PRT-123              # Full pipeline from analyze to release
/basic-engineering:sdlc analyze PRT-123      # Analyze only
/basic-engineering:sdlc design               # Design only (uses Analyze output)
/basic-engineering:sdlc implement            # Implement only
/basic-engineering:sdlc test                 # Test only
/basic-engineering:sdlc verify               # Verify only
/basic-engineering:sdlc review               # Review only
/basic-engineering:sdlc release              # Release only
/basic-engineering:sdlc quick PRT-123        # Quick mode — lightweight flow
/basic-engineering:sdlc breakdown            # Break down tasks only
```

Stages are composable. Run individually or let the full pipeline run with checkpoints.

## Parsing Arguments

- If `$ARGUMENTS` contains `quick`, run **Quick Mode** (see below)
- If `$ARGUMENTS` contains a stage name (`analyze`, `design`, `implement`, `test`, `verify`, `review`, `release`, `breakdown`), **invoke that stage's skill via the Skill tool**
- If `$ARGUMENTS` contains a ticket ID (matches pattern like `PRT-123`, `PSR-456`, `MOX-789`), pass it to the stage skill
- If no stage specified, run the **Full Pipeline**
- If no ticket ID and stage requires one, **ask the user**

## Stage Invocation

**When running a specific stage**, invoke it via the Skill tool:
- `analyze PRT-123` → invoke `/basic-engineering:sdlc-analyze PRT-123`
- `design` → invoke `/basic-engineering:sdlc-design`
- `breakdown` → invoke `/basic-engineering:sdlc-breakdown`
- etc.

**When running the full pipeline**, invoke each stage skill sequentially via the Skill tool, pausing at checkpoints.

## Pipeline Overview

```
[sdlc-analyze] --> checkpoint --> [sdlc-design] --> checkpoint --> Plan Summary --> (sdlc-breakdown?) --> [sdlc-implement]
                                                                                                      |
                                                                                                [sdlc-test] (parallel)
                                                                                                     |
                                                                                              [sdlc-verify] --> [sdlc-review] --> checkpoint --> [sdlc-release]
```

> **Break Down Tasks** is optional. After Plan Summary, the pipeline evaluates whether the plan is large enough to warrant splitting. If so, it offers the user the option. If declined or not applicable, the pipeline continues to Implement.

## Checkpoint Rules

- **ALWAYS** pause after Analyze — requirements must be approved
- **ALWAYS** pause after Design — solution must be approved
- **ALWAYS** pause after Break Down Tasks — breakdown plan must be approved before creating Jira sub-tasks
- **ALWAYS** pause after Review — for NEEDS-INPUT items
- Implement + Test + Verify flow without checkpoints between them (unless Verify finds unfixable failures)
- Release has its own checkpoints via ship-n-check

## Quick Mode

For small fixes, chores, or well-understood changes. Invoke with `/basic-engineering:sdlc quick [TICKET-ID]`.

Quick mode runs a compressed pipeline:
- **Analyze** — read ticket, use [repo registry](reference/repo-registry.md) to identify relevant repos, lightweight scan of affected files (no deep Explore subagents)
- **Implement** — TDD as normal (no separate Design stage — design inline with implementation)
- **Review** — lightweight self-review (no NEEDS-INPUT category — auto-fix or skip)
- **Release** — delegates to `/basic-engineering:ship-n-check` as normal

Skips: Design checkpoint, Plan Summary, separate Test stage, Verify stage.
Still mandatory: TDD in Implement, requirements review in Release, all git rules.

Use full mode when: the ticket touches multiple modules, requires architecture decisions, or has ambiguous requirements.

## Session State

See [reference/shared.md](reference/shared.md) for state.md format and protocol.

**Resuming**: When starting, check for `docs/<identifier>/state.md`. If it exists, read it and resume from the current position. Present the state summary to the user before continuing.

## Setup

On first use, check for `${CLAUDE_PLUGIN_DATA}/config.json`. If missing, ask the user for configuration. See [reference/shared.md](reference/shared.md) for config fields.

## Gotchas

Common failure modes — if you catch yourself doing any of these, stop and correct:

- **Skipping checkpoints for "simple" changes** — Never do this in full mode. Use Quick Mode instead.
- **Analyzing without reading the actual Jira ticket** — Always call `getJiraIssue` and read the full ticket.
- **Designing in a vacuum** — Always find the closest existing pattern first.
- **Forgetting to update state.md** — After each stage, update `docs/<identifier>/state.md`.
- **Running stages inline instead of via Skill tool** — Always invoke stage skills via the Skill tool for context freshness.
- **Producing vague Structured Requirements** — "Update the payout module" is useless. Require specific file paths.
- **Not posting Jira comments** — Every completed stage must post a summary comment to Jira.

## Rules

- **NEVER** skip the Analyze stage — always understand before building
- **NEVER** skip checkpoints — always get user approval at defined points
- **NEVER** implement without a design — even for "simple" changes (Quick Mode: design inline)
- **NEVER** skip TDD in the Implement stage — write tests first
- **ALWAYS** invoke stage skills via the Skill tool — never execute stages inline
- **ALWAYS** post Jira comments after each stage
- **ALWAYS** follow existing codebase patterns found during Analyze/Design
- **ALWAYS** update `docs/<identifier>/state.md` after completing each stage
- **ALWAYS** check for `state.md` at the start — resume if a previous session was interrupted
- If a stage fails or gets stuck, **STOP** and inform the user — don't retry endlessly
