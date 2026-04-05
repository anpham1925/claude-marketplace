---
name: ai-dlc
description: "AI-Driven Development Lifecycle — unified intent-to-production orchestrator combining AI-DLC methodology with full SDLC and shipping pipeline. Use whenever the user mentions a Jira ticket ID, wants to start development, or says 'ai-dlc'. This orchestrator adaptively plans which phases to run based on intent type (green-field, brown-field, refactor, bug-fix, spike), then drives the conversation proactively — AI recommends, human validates. Phases: Plan → Inception → Domain Design → Logical Design → Construct → Verify → Release → Observe. Triggers for 'ai-dlc PRT-123', 'start ai-dlc', 'plan this ticket', 'full lifecycle'. Prefer this over sdlc + ship-n-check for end-to-end workflows."
argument-hint: '[phase] [TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — This skill orchestrates deep reasoning across multiple phases with adaptive planning.

## Quick Navigation

| Phase | Skill | What It Does |
|-------|-------|-------------|
| Plan | `/basic-engineering:ai-dlc-plan` | Classify intent, generate adaptive Level 1 Plan |
| Inception | `/basic-engineering:ai-dlc-inception` | Requirements + NFRs + risks + measurement + code elevation |
| Domain Design | `/basic-engineering:ai-dlc-domain-design` | Pure DDD modeling (aggregates, events, business rules) |
| Logical Design | `/basic-engineering:ai-dlc-logical-design` | Architectural patterns + NFR mapping + ADRs + plan summary |
| Construct | `/basic-engineering:ai-dlc-construct` | TDD wave implementation + e2e tests + traceability |
| Verify | `/basic-engineering:ai-dlc-verify` | AC verification + code review + traceability validation |
| Release | `/basic-engineering:ai-dlc-release` | Branch → PR → CI/CD → staging → merge (delegates to ship-*) |
| Observe | `/basic-engineering:ai-dlc-observe` | Post-deploy health + Honeycomb observability |

## Invocation

```
/basic-engineering:ai-dlc PRT-123              # Full adaptive pipeline
/basic-engineering:ai-dlc plan PRT-123         # Plan phase only
/basic-engineering:ai-dlc inception            # Inception only (uses Plan output)
/basic-engineering:ai-dlc domain-design        # Domain Design only
/basic-engineering:ai-dlc logical-design       # Logical Design only
/basic-engineering:ai-dlc construct            # Construct only
/basic-engineering:ai-dlc verify               # Verify only
/basic-engineering:ai-dlc release              # Release only
/basic-engineering:ai-dlc observe              # Observe only
```

Phases are composable. Run individually or let the adaptive pipeline run with checkpoints.

## Parsing Arguments

- If `$ARGUMENTS` contains a phase name (`plan`, `inception`, `domain-design`, `logical-design`, `construct`, `verify`, `release`, `observe`), **invoke that phase's skill via the Skill tool**
- If `$ARGUMENTS` contains a ticket ID (matches pattern like `PRT-123`, `PSR-456`, `MOX-789`), pass it to the phase skill
- If no phase specified, run the **Full Adaptive Pipeline** starting from Plan
- If no ticket ID and phase requires one, **ask the user**

## Phase Invocation

**When running a specific phase**, invoke it via the Skill tool:
- `plan PRT-123` → invoke `/basic-engineering:ai-dlc-plan PRT-123`
- `inception` → invoke `/basic-engineering:ai-dlc-inception`
- `domain-design` → invoke `/basic-engineering:ai-dlc-domain-design`
- etc.

**When running the full pipeline**, invoke each phase skill sequentially via the Skill tool, following the adaptive Level 1 Plan from the Plan phase.

## Pipeline Overview

### Full Pipeline (all phases)

```
[ai-dlc-plan] → checkpoint → [ai-dlc-inception] → checkpoint
    → [ai-dlc-domain-design] → checkpoint → [ai-dlc-logical-design] → checkpoint
        → [ai-dlc-construct] → [ai-dlc-verify] → checkpoint
            → [ai-dlc-release] → [ai-dlc-observe]
```

### Adaptive Pipeline

The Plan phase classifies the intent and determines which phases to run. Not every intent needs every phase:

| Intent Type | Pipeline |
|-------------|----------|
| **Bug fix** | Plan → Inception (light) → Construct → Verify → Release |
| **Small feature** | Plan → Inception → Logical Design → Construct → Verify → Release |
| **Full feature** | Plan → Inception → Domain Design → Logical Design → Construct → Verify → Release → Observe |
| **Refactor** | Plan → Inception (code elevation) → Logical Design → Construct → Verify → Release |
| **Performance** | Plan → Inception (+ profiling) → Logical Design → Construct → Verify → Release → Observe |
| **Spike/research** | Plan → Inception → Domain Design → STOP |
| **Brown-field** | Plan → Inception (code elevation + NFRs) → Domain Design → Logical Design → Construct → Verify → Release → Observe |

The user can always override — add or skip phases at any checkpoint.

## AI-Initiated Flow

**This is the core AI-DLC principle: AI drives, human validates.**

After every checkpoint, the orchestrator MUST:
1. Summarize key findings from the completed phase
2. Proactively recommend the next phase with reasoning
3. Explain what the next phase will specifically focus on
4. Ask "Shall I proceed?"

Example:
> **Inception complete.** I identified 4 acceptance criteria, 2 NFRs (latency <200ms P95, GDPR-compliant data handling), and 1 risk (breaking change to partner API v2). The existing code in `modules/payout/` follows the CQRS pattern.
>
> I recommend proceeding to **Domain Design** to model the `Refund` aggregate with `RefundCreated` and `RefundApproved` domain events, following the existing pattern in `modules/perk/domain/`.
>
> Shall I proceed?

**Never just stop after a phase** — always recommend the next action.

## Checkpoint Rules

- **ALWAYS** pause after Plan — Level 1 Plan must be approved
- **ALWAYS** pause after Inception — requirements + NFRs must be approved
- **ALWAYS** pause after Domain Design — domain model must be approved
- **ALWAYS** pause after Logical Design — solution design must be approved
- Construct + Verify flow without checkpoints between them (unless Verify finds unfixable failures)
- **ALWAYS** pause after Verify — review results presented, NEEDS-INPUT items resolved
- Release has its own checkpoints via ship-* stages
- Observe runs automatically after Release (unless skipped by Level 1 Plan)

## Session State

See [reference/shared.md](reference/shared.md) for state.md format and protocol.

**Resuming**: When starting, check for `docs/<identifier>/state.md`. If it exists, read it and resume from the current position. Read the Level 1 Plan from state to know which phases to execute. Present the state summary to the user before continuing.

## Setup

On first use, check for `${CLAUDE_PLUGIN_DATA}/config.json`. If missing, ask the user for configuration. See [reference/shared.md](reference/shared.md) for config fields.

## Gotchas

Common failure modes — if you catch yourself doing any of these, stop and correct:

- **Skipping the Plan phase** — Always classify intent first. Even for "obvious" bug fixes, Plan determines the pipeline.
- **Running all 8 phases for a bug fix** — Use the adaptive pipeline. Plan determines what's needed.
- **Stopping silently after a checkpoint** — Always recommend the next action (AI-initiated flow).
- **Analyzing without reading the Jira ticket** — Always call `getJiraIssue` and read the full ticket.
- **Designing without domain modeling first** — For new features, Domain Design comes before Logical Design.
- **Skipping code elevation for brown-field** — If modifying existing code, Inception must produce static + dynamic models.
- **Forgetting to update traceability matrix** — Every phase adds its column.
- **Running phases inline instead of via Skill tool** — Always invoke phase skills via the Skill tool.
- **Forgetting NFR validation in Verify** — Each NFR from Inception must have corresponding implementation.
- **Skipping Observe for features with NFRs** — If Inception identified performance/reliability NFRs, always Observe.

## Rules

- **NEVER** skip the Plan phase — always classify intent and generate Level 1 Plan
- **NEVER** skip checkpoints — always get user approval at defined points
- **NEVER** implement without a design — Domain Design for new concepts, Logical Design for all features
- **NEVER** skip TDD in the Construct phase — write tests first
- **ALWAYS** invoke phase skills via the Skill tool — never execute phases inline
- **ALWAYS** follow the AI-initiated flow — recommend next action after every checkpoint
- **ALWAYS** follow the adaptive pipeline from Plan — skip phases the Plan excludes
- **ALWAYS** post Jira comments after each phase
- **ALWAYS** update `docs/<identifier>/state.md` after completing each phase
- **ALWAYS** check for `state.md` at the start — resume if a previous session was interrupted
- **ALWAYS** update the traceability matrix as phases complete
- If a phase fails or gets stuck, **STOP** and inform the user — don't retry endlessly
