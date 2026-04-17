---
name: ai-dlc-plan
description: "Internal phase of the ai-dlc pipeline — classifies intent type and generates an adaptive Level 1 Plan. Invoke directly only via /engineering-toolkit:ai-dlc-plan when explicitly requested by name. For general requests like 'plan this ticket' or 'start PROJ-123', use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '<TICKET-ID or intent description>'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for intent classification and adaptive planning.

## Agent: Planner

**Mission**: Classify the intent, assess complexity, and generate an adaptive Level 1 Plan that determines which phases the pipeline will execute.

**Inputs**: Jira ticket ID or free-form intent description
**Outputs**: Level 1 Plan (intent type, phases to execute, complexity assessment)

## Why This Phase Exists

Traditional development lifecycles run every stage for every task. AI-DLC adapts — a bug fix doesn't need Domain Design, a spike doesn't need Release. The Plan phase ensures the right amount of process for the task at hand.

## Steps

### Check for Existing State

Read `docs/<identifier>/state.md` if it exists. If Plan is already completed, ask the user if they want to re-plan. See [shared reference](../ai-dlc/reference/shared.md) for state.md format.

### Read Discovery Output (if exists)

Check for `docs/<identifier>/discovery.md`. If it exists, read it and use it as primary input:
- The reframed problem (not the original request)
- The recommended approach
- Open questions Discovery flagged for Plan to address

Discovery output takes precedence over the raw ticket description — it represents a refined understanding of what to build.

### Read the Intent

**If a Jira ticket ID is provided:**
- Use `getJiraIssue` with the ticket ID
- Extract: summary, description, acceptance criteria, issue type, labels, linked issues, comments
- **Never infer from title alone.** Always read the full ticket.

**If a free-form intent is provided:**
- Parse the description for scope, goals, and constraints
- Ask clarifying questions if the intent is ambiguous

### Detect Unclear Scope

If there's no `discovery.md` AND the intent shows signs of unclear scope, recommend Discovery before proceeding:

**Signals of unclear scope:**
- No acceptance criteria in the ticket
- Description uses solution-language instead of problem-language ("add a button" vs "users can't do X")
- Scope is broad or ambiguous ("improve", "better", "redesign", "rethink")
- Multiple unrelated concerns in a single ticket
- Free-form intent without specifics

If unclear scope is detected:
> **I notice the scope isn't well-defined yet** — {explain what's unclear}.
>
> I recommend running **Discovery** first to challenge the problem statement and narrow the scope before planning.
>
> Shall I run Discovery, or do you want to proceed with Plan as-is?

If the user chooses to proceed without Discovery, continue with Plan normally.

### Classify Intent

Analyze the ticket/intent and classify into one of these types:

| Intent Type | Signals |
|-------------|---------|
| **green-field** | No existing code in target area, "new feature", "build from scratch", new module/service |
| **brown-field** | Existing code to modify, "add feature to", "enhance", "extend" existing functionality |
| **refactor** | "Refactor", "restructure", "clean up", "migrate", "tech debt", no behavior change |
| **bug-fix** | "Fix", "bug", "broken", "regression", "defect", "error", specific failure description |
| **performance** | "Slow", "optimize", "latency", "throughput", "scale", "memory", "CPU" |
| **spike** | "Investigate", "spike", "research", "explore", "POC", "prototype", "feasibility" |

If unclear, present the classification to the user and ask for confirmation.

### Detect Unclear Root Cause (bug-fix intents)

For **bug-fix** intents, assess whether the root cause is known:

**Root cause is CLEAR when:**
- The ticket describes exactly what's wrong and which code/config to change
- The reproduction steps point directly to the failing code path
- A specific error message with stack trace identifies the location

**Root cause is UNCLEAR when:**
- The ticket describes symptoms but not the cause ("API returns 500 sometimes")
- The failure is intermittent or environment-dependent
- Multiple possible causes exist ("could be X, Y, or Z")
- The error is vague ("something broke after deploy")

If the root cause is unclear, add **Investigate** to the pipeline before Construct:

> **This looks like a bug-fix, but the root cause isn't clear yet.**
>
> Symptoms: {what's described}
> Missing: {what we don't know — specific location, reproduction, root cause}
>
> I recommend adding an **Investigate** phase before Construct to systematically find the root cause before attempting a fix.
>
> Pipeline: Plan → Investigate → Inception (light) → Construct → Verify → Release

### Assess Complexity

Evaluate:
- **Modules touched**: How many different modules/repos are affected?
- **Files estimated**: Rough count of files to create/modify
- **AC count**: Number of acceptance criteria
- **New domain concepts**: Does this introduce new aggregates, entities, or events?
- **NFR sensitivity**: Are there performance, security, or compliance concerns?
- **Integration points**: Does this touch external services, APIs, or events?

Complexity bands:
- **Low** (1 module, <5 files, <3 ACs, no new domain concepts)
- **Medium** (1-2 modules, 5-15 files, 3-6 ACs, some new concepts)
- **High** (3+ modules, 15+ files, 6+ ACs, new aggregates, NFR-sensitive)

### Identify Service Archetype

Classify the target service type. This determines which harness template applies. See [harness templates](../ai-dlc/reference/harness-templates.md).

| Archetype | Target |
|---|---|
| **HTTP API** | `apps/api/`, controllers, REST endpoints |
| **Event Consumer** | `apps/event-consumer/`, Kafka handlers, event processors |
| **Worker/Cron** | `apps/workers/`, cron jobs, batch processors |
| **Frontend** | React, React Native, Remix apps |

Include the archetype in the Level 1 Plan. If the ticket touches multiple archetypes (e.g., API + consumer), list all.

### Detect Brown-Field

If modifying existing code, check:
- Do the affected files/modules already exist?
- Is there an established pattern in the target area?
- Would the Inception phase benefit from code elevation (reverse-engineering existing code into models)?

Mark brown-field if existing code needs to be understood before changes can be designed.

### Generate Level 1 Plan

Based on intent type and complexity, produce the adaptive pipeline:

```markdown
## Level 1 Plan

**Intent**: {ticket ID or description}
**Type**: {green-field | brown-field | refactor | bug-fix | performance | spike}
**Complexity**: {low | medium | high}
**Discovery**: {completed | skipped: reason}

### Pipeline
0. [x] **Discovery** — {completed | skipped: well-defined ticket with ACs}
1. [x] **Plan** — (this phase)
1a. [ ] **Investigate** — {included: root cause unclear | skipped: root cause known}
2. [ ] **Inception** — {light | standard | with code elevation}
3. [ ] **Domain Design** — {included | skipped: reason}
4. [ ] **Logical Design** — {standard | lightweight}
5. [ ] **Construct** — TDD waves
6. [ ] **Verify** — AC verification + code review
7. [ ] **Release** — branch → PR → CI/CD → staging → merge
8. [ ] **Observe** — {included | skipped: reason}

### Rationale
{Why this pipeline was chosen — what phases were skipped and why}

### Estimated Scope
- Modules: {list}
- Archetype: {HTTP API | Event Consumer | Worker/Cron | Frontend | mixed}
- Complexity: {band}
- New domain concepts: {yes/no — list if yes}
- NFR-sensitive: {yes/no}
```

### Update State

Create `docs/<identifier>/state.md` with the Level 1 Plan. See [shared reference](../ai-dlc/reference/shared.md) for format.

### CHECKPOINT — Approve Level 1 Plan

Present the Level 1 Plan and proactively recommend the next phase (see [AI-initiated recommendation protocol](../ai-dlc/reference/shared.md#ai-initiated-recommendation-protocol)):

> **Plan complete.** I classified this as a **{type}** intent with **{complexity}** complexity.
>
> Pipeline: {list of included phases}
> Skipped: {list of excluded phases with reasons}
>
> I recommend proceeding to **Inception** to {what inception will focus on}.
>
> You can adjust the pipeline — add or remove phases. Shall I proceed?

## Rules

See [common phase rules](../ai-dlc/reference/shared.md#common-phase-rules) for state updates, Jira comments, and checkpoint protocol.

Phase-specific:
- **NEVER** skip classification — always determine intent type before generating a plan
- **NEVER** generate a one-size-fits-all pipeline — adapt to the intent
- **ALWAYS** read the full Jira ticket (not just the title) when a ticket ID is provided
- **ALWAYS** present the Level 1 Plan for user approval
- If intent type is ambiguous, ask the user — don't guess silently
