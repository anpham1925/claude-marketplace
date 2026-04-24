---
name: ai-dlc
description: "AI-Driven Development Lifecycle — unified intent-to-production orchestrator with adaptive planning, design, adversarial review, implementation, verification, release, and observability. Use whenever the user mentions a Jira ticket ID, wants to start development, or says 'ai-dlc'. This orchestrator adaptively plans which phases to run based on intent type (green-field, brown-field, refactor, bug-fix, spike), then drives the conversation proactively — AI recommends, human validates. Phases: Plan → Inception → Domain Design → Logical Design → Red Team → Construct → Verify → Release → Observe. Triggers for 'ai-dlc PROJ-123', 'start ai-dlc', 'plan this ticket', 'full lifecycle'. The Release phase delegates to ship-n-check internally for the full git workflow."
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
| Red Team | `/engineering-toolkit:ai-dlc-red-team` | Adversarially attack the design artifacts before Construct; loop back to Logical Design (or Inception/Plan) until convergence or 3-iter cap |
| Construct | `/engineering-toolkit:ai-dlc-construct` | TDD wave implementation + e2e tests + traceability |
| Verify | `/engineering-toolkit:ai-dlc-verify` | AC verification + code review + traceability validation |
| Release | `/engineering-toolkit:ai-dlc-release` | Branch → PR → CI/CD → staging → merge (delegates to ship-*) |
| Observe | `/engineering-toolkit:ai-dlc-observe` | Post-deploy health + Honeycomb observability |

## Invocation

```
/engineering-toolkit:ai-dlc PROJ-123              # Full adaptive pipeline
/engineering-toolkit:ai-dlc discovery            # Discovery only (challenge the problem before planning)
/engineering-toolkit:ai-dlc plan PROJ-123         # Plan phase only
/engineering-toolkit:ai-dlc investigate PROJ-123  # Investigate only (root-cause debugging)
/engineering-toolkit:ai-dlc inception            # Inception only (uses Plan output)
/engineering-toolkit:ai-dlc domain-design        # Domain Design only
/engineering-toolkit:ai-dlc logical-design       # Logical Design only
/engineering-toolkit:ai-dlc red-team             # Red Team only (adversarial review of current design artifacts)
/engineering-toolkit:ai-dlc red-team whole-system  # Whole-system audit (outside the phase pipeline)
/engineering-toolkit:ai-dlc construct            # Construct only
/engineering-toolkit:ai-dlc verify               # Verify only
/engineering-toolkit:ai-dlc release              # Release only
/engineering-toolkit:ai-dlc observe              # Observe only
```

Phases are composable. Run individually or let the adaptive pipeline run with checkpoints.

## Parsing Arguments

- If `$ARGUMENTS` contains a phase name (`discovery`, `plan`, `investigate`, `inception`, `domain-design`, `logical-design`, `red-team`, `construct`, `verify`, `release`, `observe`), **spawn that phase as a subagent via the Agent tool**
- If `$ARGUMENTS` contains a ticket ID (matches pattern like `PROJ-123`, `PROJ2-456`, `PROJ3-789`), pass it to the phase subagent
- If no phase specified, run the **Full Adaptive Pipeline** starting from Plan
- If no ticket ID and phase requires one, **ask the user**

## Phase Execution

Each phase runs as an **isolated subagent** via the Agent tool. The subagent:
1. Receives a prompt with **file paths only** — methodology path, input artifact paths, output artifact paths
2. Reads all context from files (skill methodology, state.md, previous artifacts) — never from raw text in the prompt
3. Does the work — reads code, makes decisions, writes artifacts
4. Writes all outputs to artifact files — the files ARE the deliverable, not the subagent's return text

The orchestrator stays lean — after each subagent completes, it reads `state.md` and the output artifact files to build the checkpoint summary. **Never rely on the subagent's return text for context** — if the session dies mid-pipeline, artifact files must contain everything needed to resume.

### Spawning a Phase Subagent

For each phase, spawn an Agent with:
- **prompt**: What to do, which inputs to read, which artifacts to write
- **subagent_type**: Match to the best agent type for the work

All paths are relative to `docs/<identifier>/`. Every phase also updates `state.md` — the "Outputs" column lists phase-specific artifacts on top of that.

| Phase | Subagent Type | Model | Inputs | Outputs |
|-------|-------------|-------|--------|---------|
| Discovery | `general-purpose` | opus | Ticket/intent | `discovery.md`, `state.md` |
| Plan | `planner` | opus | Ticket/intent, `discovery.md` (if exists) | `state.md` (Level 1 Plan) |
| Investigate | `debugger` | opus | `state.md`, symptoms/errors | `investigation.md`, `state.md` |
| Inception | `general-purpose` | opus | `state.md`, `investigation.md` (if exists) | `prd-plans/inception.md`, `state.md` (ACs, NFRs, risks, traceability scaffold) |
| Domain Design | `general-purpose` | opus | `state.md`, `prd-plans/inception.md` | `prd-plans/domain-model.md`, `state.md` (traceability: Domain Model column) |
| Logical Design | `general-purpose` | opus | `state.md`, `prd-plans/inception.md`, `prd-plans/domain-model.md` (if exists) | `prd-plans/specs.md`, `prd-plans/flows.md`, `prd-plans/ADR-*.md`, `state.md` (traceability: Design Decision column) |
| Red Team | `general-purpose` | opus | `state.md`, `prd-plans/inception.md`, `prd-plans/specs.md`, `prd-plans/flows.md`, `prd-plans/ADR-*.md` | `red-team-report.md`, `state.md` (Red Team iteration count + routing decisions) |
| Construct | `general-purpose` | sonnet | `state.md`, `prd-plans/specs.md`, `prd-plans/flows.md`, `prd-plans/domain-model.md` (if exists), `red-team-report.md` (if exists) | Code + tests, `state.md` (traceability: Code Files, Test Files columns) |
| Verify | `code-reviewer` | opus | `state.md`, `prd-plans/inception.md`, `prd-plans/specs.md`, code diff | `review-feedback.md`, `state.md` |
| Release | `general-purpose` | sonnet | `state.md` | Merged PR, `state.md` |
| Observe | `general-purpose` | sonnet | `state.md`, `prd-plans/inception.md` (Observability Plan) | `state.md` (Observation Report) |

### Prompt Template for Phase Subagents

When spawning a phase subagent, pass **file paths only** — no raw content, no summaries, no context blobs. The subagent reads everything it needs from files.

Include in the prompt:
1. **Phase skill path**: The methodology file to read first
2. **Identifier**: The docs directory (e.g., `docs/PROJ-123/`)
3. **Input artifact paths**: Which files to read from the docs directory
4. **Output artifact paths**: Which files to write to the docs directory
5. **Ticket ID**: If applicable

**Do NOT include:**
- Summaries or context from previous phases (subagent reads state.md and artifact files instead)
- Raw text excerpts from artifacts
- Your interpretation of what the previous phase found

Example prompt for Inception:
```
You are the Inception agent for ticket PROJ-123.

Read the methodology: /path/to/skills/ai-dlc-inception/SKILL.md

Read your inputs:
- docs/PROJ-123/state.md (contains Level 1 Plan from previous phase)

Write your outputs:
- docs/PROJ-123/prd-plans/inception.md (Inception Artifact)
- Update docs/PROJ-123/state.md (mark Inception complete, populate ACs/NFRs/risks)

Ticket: PROJ-123
```

### What the Orchestrator Does Between Phases

After each subagent completes:
1. **Read the artifact files** — read `state.md` and the phase's output artifact (e.g., `prd-plans/inception.md`, `prd-plans/domain-model.md`, `prd-plans/specs.md`). Do NOT rely on the subagent's return text for context.
2. **Build the checkpoint summary** from the artifact files — extract key findings, counts, decisions
3. Present the checkpoint to the user using the [AI-initiated recommendation protocol](#ai-initiated-flow)
4. On user approval, spawn the next subagent (passing only file paths)

**Why files over return text**: If the session dies between phases, artifact files persist. The next session reads `state.md`, sees which phase completed last, and resumes. No context is lost.

**When running a specific phase** (direct invocation like `/engineering-toolkit:ai-dlc inception`): Even for single-phase invocation, spawn it as a subagent. The user gets the same clean artifact-based contract.

**Resuming a dead session**: Read `state.md` to find the last completed phase. Read the output artifacts for that phase. Present the summary and recommend the next phase. No need to re-run completed phases — their output is in the files.

## Effort Level per Phase

Claude Code CLI effort controls how long the model will think before acting. Pick the effort level that matches the phase's reasoning demand — over-thinking adds latency without improving design-free execution, and under-thinking starves the phases where the real decisions happen.

| Phase | Recommended effort | Reason |
|---|---|---|
| Discovery | `max` | Open-ended reframing — deep thinking pays off |
| Plan | `xhigh` | Classification is structured; xhigh is sufficient |
| Inception | `xhigh` | Structured extraction with clear inputs |
| Domain Design | `max` | Architectural — aggregate/event boundaries stick for the life of the code |
| Logical Design | `max` | Architectural — pattern + NFR trade-offs stick |
| Red Team | `max` | Adversarial reasoning across 9 attack categories — breadth + depth both matter |
| Construct | `xhigh` | Execution — design is already locked; `max` just burns latency |
| Verify | `xhigh` | Structured AC/NFR checks; `max` only if findings are contentious |
| Release | `high` | Mostly delegation to ship-* stages |
| Observe | `high` | Query execution against known NFRs |

**Rule of thumb**: default to `xhigh`; escalate to `max` only for the two Design phases or Discovery. Dropping below `high` risks missed acceptance criteria.

## Pipeline Overview

### Full Pipeline (all phases)

```
[ai-dlc-discovery] → checkpoint → [ai-dlc-plan] → checkpoint
    → [investigate] → checkpoint (if bug-fix with unclear root cause)
        → [ai-dlc-inception] → checkpoint
            → [ai-dlc-domain-design] → checkpoint → [ai-dlc-logical-design] → checkpoint
                → [ai-dlc-red-team] → checkpoint → (loop back to Logical Design / Inception / Plan
                                                    if findings route upstream, capped at 3 iterations)
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
| **Small feature** | Plan → Inception → Logical Design → Red Team → Construct → Verify → Release |
| **Full feature** | Plan → Inception → Domain Design → Logical Design → Red Team → Construct → Verify → Release → Observe |
| **Refactor** | Plan → Inception (code elevation) → Logical Design → Red Team → Construct → Verify → Release |
| **Performance** | Plan → Inception (+ profiling) → Logical Design → Red Team → Construct → Verify → Release → Observe |
| **Spike/research** | Plan → Inception → Domain Design → STOP |
| **Brown-field** | Plan → Inception (code elevation + NFRs) → Domain Design → Logical Design → Red Team → Construct → Verify → Release → Observe |

**Red Team inclusion rule**: runs by default for anything that ships to production (small feature / full feature / refactor / performance / brown-field). Skipped for spike/research (no production impact) and bug-fix (scope is narrow enough that inception-level review is sufficient; can be invoked directly if the fix touches concurrency or state machines).

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

- **ALWAYS** pause after Discovery (if run) — reframing + approach must be approved
- **ALWAYS** pause after Plan — Level 1 Plan must be approved
- **ALWAYS** pause after Inception — requirements + NFRs must be approved
- **ALWAYS** pause after Domain Design — domain model must be approved
- **ALWAYS** pause after Logical Design — solution design must be approved
- **ALWAYS** pause after Red Team — critical findings cannot be silently deferred; user picks loop-back vs. proceed vs. accept-and-defer. If Red Team loops back to an upstream phase, pause again after that phase re-runs before re-spawning Red Team
- Construct + Verify flow without checkpoints between them (unless Verify finds unfixable failures)
- **ALWAYS** pause after Verify — review results presented, NEEDS-INPUT items resolved
- Release has its own checkpoints via ship-* stages
- Observe runs automatically after Release (unless skipped by Level 1 Plan)

## Harness Engineering

AI-DLC is structured as a harness with **guides** (feedforward controls that steer before acting) and **sensors** (feedback controls that observe after acting). See [reference/harness.md](reference/harness.md) for the full classification and [reference/harness-templates.md](reference/harness-templates.md) for service archetype templates.

## Session State

See [reference/shared.md](reference/shared.md) for state.md format and protocol.

**Resuming**: When starting, check for `docs/<identifier>/state.md`. If it exists, read it and resume from the current position. Read the Level 1 Plan from state to know which phases to execute. Present the state summary to the user before continuing.

## Setup

On first use, check for `${CLAUDE_PLUGIN_DATA}/config.json`. If missing, ask the user for configuration. See [reference/shared.md](reference/shared.md) for config fields.

## Gotchas

Common failure modes — if you catch yourself doing any of these, stop and correct:

- **Switching pipelines mid-flow** — If the user started with `/engineering-toolkit:ai-dlc`, stay on AI-DLC. Never switch to `/engineering-toolkit:ship-n-check` directly without asking. The Release phase delegates to ship-* internally.
- **Skipping artifacts for "small" tasks** — Always produce state.md, inception.md, and traceability matrix. If a task seems too small, ASK the user: "This is a small change — should I produce full artifacts or skip?" Never decide unilaterally.
- **Skipping the Plan phase** — Always classify intent first. Even for "obvious" bug fixes, Plan determines the pipeline.
- **Running all 8 phases for a bug fix** — Use the adaptive pipeline. Plan determines what's needed.
- **Stopping silently after a checkpoint** — Always recommend the next action (AI-initiated flow).
- **Analyzing without reading the Jira ticket** — Always call `getJiraIssue` and read the full ticket.
- **Designing without domain modeling first** — For new features, Domain Design comes before Logical Design.
- **Skipping code elevation for brown-field** — If modifying existing code, Inception must produce static + dynamic models.
- **Skipping Red Team because the design "looks fine"** — Red Team is cheap (15–30 min per iteration) and catches classes of failure (concurrency, partial-failure, inherited-scope) that are invisible to spec-correctness review. Only skip for spike or narrow bug-fix intents per the adaptive pipeline.
- **Red Team fixing findings directly instead of routing back** — Red Team critiques; it never edits specs/ADRs/flows. Every finding routes to the cheapest upstream phase that can fix it (usually Logical Design; rarely Inception or Plan). Letting Red Team "fix while reviewing" defeats the critique/design separation.
- **Looping Red Team more than 3 times** — The 3-iteration cap is the safety valve against analysis paralysis. At iteration 3 the orchestrator forces a user checkpoint: ship with remaining findings deferred, or another round. Never silently exceed the cap.
- **Forgetting to update traceability matrix** — Every phase adds its column.
- **Running phases inline instead of as subagents** — Always spawn phases via the Agent tool.
- **Passing raw context to subagents** — Never include summaries, excerpts, or your interpretation in the subagent prompt. Pass file paths only. The subagent reads everything from files.
- **Relying on subagent return text** — After a subagent completes, read the artifact files. Don't use the return text as authoritative context. If the session dies, only files survive.
- **Relaying subagent prose tradeoffs verbatim to the user** — When a phase subagent returns A/B/C options in prose (even labeled "USER-FACING" or "surfaced for checkpoint"), **do NOT paste that prose into the checkpoint message**. The orchestrator MUST translate every user-facing tradeoff into an `AskUserQuestion` tool call — one question, 2–3 options, recommended-first with "(Recommended)" suffix. Prose-with-typed-letters is always wrong, no matter how well-formatted. See [Open Questions Protocol](reference/shared.md#open-questions-protocol) §"Orchestrator translation of subagent-surfaced questions". If the tool isn't in your current tool list, load it via `ToolSearch({ query: "select:AskUserQuestion", max_results: 1 })` — deferred-tool friction is not a valid excuse to regress to prose.
- **Forgetting NFR validation in Verify** — Each NFR from Inception must have corresponding implementation.
- **Skipping Observe for features with NFRs** — If Inception identified performance/reliability NFRs, always Observe.

## Rules

- **NEVER** skip the Plan phase — always classify intent and generate Level 1 Plan
- **NEVER** skip checkpoints — always get user approval at defined points
- **NEVER** implement without a design — Domain Design for new concepts, Logical Design for all features
- **NEVER** skip Red Team for production-bound work — adaptive pipeline includes it for small-feature / full-feature / refactor / performance / brown-field by default. Only spike and bug-fix may skip
- **NEVER** exceed the 3-iteration Red Team cap silently — force a user checkpoint at iteration 3 listing remaining findings + loop-back vs. ship decision
- **NEVER** skip TDD in the Construct phase — write tests first
- **NEVER** switch to ship-n-check mid-flow — Release delegates internally
- **NEVER** skip artifacts without asking the user — even for 1-line changes, ask before skipping
- **ALWAYS** spawn phases as subagents via the Agent tool — the main session only orchestrates checkpoints
- **ALWAYS** pass file paths to subagents, never raw content — subagents read everything from files
- **ALWAYS** read artifact files after subagent completes — build checkpoint summaries from files, not return text
- **ALWAYS** follow the AI-initiated flow — recommend next action after every checkpoint
- **ALWAYS** ask open questions one at a time via the `AskUserQuestion` tool (arrow-key selector with built-in "Other"); never present plain-text A/B/C options asking the user to type a letter — see [Open Questions Protocol](reference/shared.md#open-questions-protocol)
- **ALWAYS** translate subagent-surfaced user-facing tradeoffs into `AskUserQuestion` calls before showing them to the user — never pass a subagent's prose A/B/C block through to the checkpoint message. If `AskUserQuestion` is a deferred tool in the current harness, load it via `ToolSearch` and then call it. "It's faster to just paste the prose" is a bug, not a shortcut.
- **ALWAYS** follow the adaptive pipeline from Plan — skip phases the Plan excludes
- **ALWAYS** post Jira comments after each phase
- **ALWAYS** update `docs/<identifier>/state.md` after completing each phase
- **ALWAYS** check for `state.md` at the start — resume if a previous session was interrupted
- **ALWAYS** update the traceability matrix as phases complete
- If a phase fails or gets stuck, **STOP** and inform the user — don't retry endlessly
