---
name: ai-dlc
description: "AI-Driven Development Lifecycle — the primary development orchestrator for end-to-end workflows. Use whenever the user mentions a Jira ticket ID, wants to start development, analyze requirements, design a solution, implement features, write tests, verify acceptance criteria, review code, or release. Adaptively plans which phases to run based on intent type (green-field, brown-field, refactor, bug-fix, spike). AI recommends, human validates. Triggers for 'ai-dlc TICKET-123', 'start TICKET-123', 'work on this ticket', 'plan this ticket', 'analyze this ticket', 'design the solution', 'implement this', 'write tests', 'verify ACs', 'review the code', 'full lifecycle', 'start development', 'quick fix for TICKET'. Also use for 'sdlc' — the SDLC pipeline has been merged into AI-DLC."
argument-hint: '[phase] [TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — This skill orchestrates deep reasoning across multiple phases with adaptive planning.

## Quick Navigation

| Phase | Skill | What It Does |
|-------|-------|-------------|
| Discovery | `/engineering-toolkit:ai-dlc-discovery` | Challenge problem statement, reframe, surface hidden requirements (optional) |
| Plan | `/engineering-toolkit:ai-dlc-plan` | Classify intent, generate adaptive Level 1 Plan |
| Investigate | `/engineering-toolkit:investigate` | Systematic root-cause debugging with hypothesis testing (optional, bug-fix) |
| Inception | `/engineering-toolkit:ai-dlc-inception` | Requirements + NFRs + risks + measurement + code elevation |
| Domain Design | `/engineering-toolkit:ai-dlc-domain-design` | Pure DDD modeling (aggregates, events, business rules) |
| Logical Design | `/engineering-toolkit:ai-dlc-logical-design` | Architectural patterns + NFR mapping + ADRs + plan summary |
| Construct | `/engineering-toolkit:ai-dlc-construct` | TDD wave implementation + e2e tests + traceability |
| Verify | `/engineering-toolkit:ai-dlc-verify` | AC verification + code review + traceability validation |
| Release | `/engineering-toolkit:ai-dlc-release` | Branch → PR → CI/CD → staging → merge (delegates to ship-*) |
| Observe | `/engineering-toolkit:ai-dlc-observe` | Post-deploy health + Honeycomb observability |

### Utility Phases

| Phase | Skill | What It Does |
|-------|-------|-------------|
| Breakdown | `/engineering-toolkit:sdlc-breakdown` | Split large tickets into independent deployable sub-tasks with Jira tickets |

## Invocation

```
/engineering-toolkit:ai-dlc TICKET-123           # Full adaptive pipeline
/engineering-toolkit:ai-dlc discovery            # Discovery only (challenge the problem before planning)
/engineering-toolkit:ai-dlc plan TICKET-123      # Plan phase only
/engineering-toolkit:ai-dlc investigate TICKET-123  # Investigate only (root-cause debugging)
/engineering-toolkit:ai-dlc inception            # Inception only (uses Plan output)
/engineering-toolkit:ai-dlc domain-design        # Domain Design only
/engineering-toolkit:ai-dlc logical-design       # Logical Design only
/engineering-toolkit:ai-dlc construct            # Construct only
/engineering-toolkit:ai-dlc verify               # Verify only
/engineering-toolkit:ai-dlc release              # Release only
/engineering-toolkit:ai-dlc observe              # Observe only
/engineering-toolkit:ai-dlc breakdown            # Decompose a large ticket into sub-tasks
```

Phases are composable. Run individually or let the adaptive pipeline run with checkpoints.

## Parsing Arguments

- If `$ARGUMENTS` contains `breakdown`, invoke `/engineering-toolkit:sdlc-breakdown` directly (standalone utility)
- If `$ARGUMENTS` contains a phase name (`discovery`, `plan`, `investigate`, `inception`, `domain-design`, `logical-design`, `construct`, `verify`, `release`, `observe`), **spawn that phase as a subagent via the Agent tool**
- If `$ARGUMENTS` contains a ticket ID (matches pattern like `PROJ-123`, `FEAT-456`), pass it to the phase subagent
- If no phase specified, run the **Full Adaptive Pipeline** starting from Plan
- If no ticket ID and phase requires one, **ask the user**

### SDLC Backward Compatibility

If `$ARGUMENTS` contains old SDLC stage names, map them:
- `analyze` → `inception`
- `design` → `logical-design`
- `implement` → `construct`
- `test` → `construct` (e2e tests are bundled)
- `verify` → `verify`
- `review` → `verify` (code review is bundled)
- `release` → `release`
- `quick` → Treat as a normal invocation — the Plan phase auto-adapts for small fixes

## Phase Execution

Each phase runs as an **isolated subagent** via the Agent tool. The subagent:
1. Receives a focused prompt with its inputs (state.md path, artifact paths)
2. Reads the phase skill file for methodology (e.g., `ai-dlc-inception/SKILL.md`)
3. Does the work — reads code, makes decisions, writes artifacts
4. Returns a summary to the orchestrator

The orchestrator stays lean — it only holds state.md contents, phase summaries, and checkpoint decisions.

### Spawning a Phase Subagent

For each phase, spawn an Agent with:
- **prompt**: What to do, which inputs to read, which artifacts to write
- **subagent_type**: Match to the best agent type for the work

| Phase | Subagent Type | Model | Inputs (read from docs/) | Outputs (write to docs/) |
|-------|-------------|-------|-------------------------|------------------------|
| Discovery | `general-purpose` | opus | Ticket/intent | `discovery.md`, `state.md` |
| Plan | `general-purpose` | opus | Ticket/intent, `discovery.md` (if exists) | `state.md` |
| Investigate | `general-purpose` | opus | `state.md`, symptoms/errors | `investigation.md` |
| Inception | `codebase-explorer` | opus | `state.md`, `investigation.md` (if exists) | `specs.md` |
| Domain Design | `general-purpose` | opus | `state.md`, `specs.md` | `domain-model.md` |
| Logical Design | `general-purpose` | opus | `state.md`, `specs.md`, `domain-model.md` | `flows.md` |
| Construct | `general-purpose` | opus | `specs.md`, `flows.md` | Code + tests |
| Verify | `code-reviewer` | opus | `specs.md`, code diff | `review-feedback.md` |
| Release | `general-purpose` | sonnet | `state.md` | PR URL |
| Observe | `general-purpose` | sonnet | `state.md`, NFRs | Health report |

### Prompt Template for Phase Subagents

When spawning a phase subagent, include in the prompt:
1. **Phase skill path**: Tell it to read the skill file for full methodology: `Read /path/to/skills/ai-dlc-{phase}/SKILL.md for the detailed steps.`
2. **Identifier**: The docs directory (e.g., `docs/PROJ-123/`)
3. **Input artifacts**: Which files to read from the docs directory
4. **Output contract**: Which files to write to the docs directory
5. **Ticket ID**: If applicable
6. **Context from previous phase**: Brief summary (not full history)

Example prompt for Inception:
```
You are the Inception agent for ticket PROJ-123.

Read the methodology: /path/to/skills/ai-dlc-inception/SKILL.md
Read your inputs: docs/PROJ-123/state.md (contains Level 1 Plan)

Your job: Analyze the ticket, research the codebase, and produce the Inception Artifact.
Write your output to: docs/PROJ-123/specs.md
Update: docs/PROJ-123/state.md (mark Inception complete, populate ACs/NFRs/risks)

Context from Plan phase: {brief summary of plan findings}
```

### What the Orchestrator Does Between Phases

After each subagent completes:
1. Read the updated `state.md` and output artifact
2. Present the **checkpoint summary** to the user (AI-initiated flow)
3. Recommend the next phase
4. On user approval, spawn the next subagent

**When running a specific phase** (direct invocation like `/engineering-toolkit:ai-dlc inception`): Even for single-phase invocation, spawn it as a subagent. The user gets the same clean artifact-based contract.

## Pipeline Overview

### Full Pipeline (all phases)

```
[ai-dlc-discovery] → checkpoint → [ai-dlc-plan] → checkpoint
    → [investigate] → checkpoint (if bug-fix with unclear root cause)
        → [ai-dlc-inception] → checkpoint
            → [ai-dlc-domain-design] → checkpoint → [ai-dlc-logical-design] → checkpoint
                → [ai-dlc-construct] → [ai-dlc-verify] → checkpoint
                    → [ai-dlc-release] → [ai-dlc-observe]
```

### Discovery Phase (Optional — Phase 0)

Discovery runs BEFORE Plan when the problem isn't well-defined. It challenges the request with 6 forcing questions, reframes the problem, and recommends the narrowest viable wedge.

**When Discovery runs:**
- User provides a vague/broad request with no ticket number
- User explicitly invokes discovery (`/engineering-toolkit:ai-dlc discovery`)
- Plan phase detects unclear scope and recommends discovery (see Plan's scope detection)

**When Discovery is skipped:**
- Well-defined ticket with clear acceptance criteria
- Bug fix with clear reproduction steps
- Refactor with defined scope
- User provides a ticket ID with ACs already written

When starting a full pipeline (`/engineering-toolkit:ai-dlc` without a ticket ID), check if the intent is vague or broad. If so, start with Discovery. If the user provides a ticket ID, skip to Plan.

### Adaptive Pipeline

The Plan phase classifies the intent and determines which phases to run. Not every intent needs every phase:

| Intent Type | Pipeline |
|-------------|----------|
| **Vague/broad request** | Discovery → Plan → (rest determined by Plan) |
| **Bug fix (root cause known)** | Plan → Inception (light) → Construct → Verify → Release |
| **Bug fix (root cause unclear)** | Plan → Investigate → Inception (light) → Construct → Verify → Release |
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

## Harness Engineering

AI-DLC is structured as a harness with **guides** (feedforward controls that steer before acting) and **sensors** (feedback controls that observe after acting). See [reference/harness.md](reference/harness.md) for the full classification and [reference/harness-templates.md](reference/harness-templates.md) for service archetype templates.

## Checkpoint Rules

- **ALWAYS** pause after Discovery (if run) — reframing + approach must be approved
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
- **Running phases inline instead of as subagents** — Always spawn phases via the Agent tool.
- **Forgetting NFR validation in Verify** — Each NFR from Inception must have corresponding implementation.
- **Skipping Observe for features with NFRs** — If Inception identified performance/reliability NFRs, always Observe.

## Rules

- **NEVER** skip the Plan phase — always classify intent and generate Level 1 Plan
- **NEVER** skip checkpoints — always get user approval at defined points
- **NEVER** implement without a design — Domain Design for new concepts, Logical Design for all features
- **NEVER** skip TDD in the Construct phase — write tests first
- **ALWAYS** spawn phases as subagents via the Agent tool — the main session only orchestrates checkpoints
- **ALWAYS** follow the AI-initiated flow — recommend next action after every checkpoint
- **ALWAYS** follow the adaptive pipeline from Plan — skip phases the Plan excludes
- **ALWAYS** post Jira comments after each phase
- **ALWAYS** update `docs/<identifier>/state.md` after completing each phase
- **ALWAYS** check for `state.md` at the start — resume if a previous session was interrupted
- **ALWAYS** update the traceability matrix as phases complete
- If a phase fails or gets stuck, **STOP** and inform the user — don't retry endlessly
