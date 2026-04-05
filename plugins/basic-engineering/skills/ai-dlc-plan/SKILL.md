---
name: ai-dlc-plan
description: "Internal phase of the ai-dlc pipeline — classifies intent type and generates an adaptive Level 1 Plan. Invoke directly only via /basic-engineering:ai-dlc-plan when explicitly requested by name. For general requests like 'plan this ticket' or 'start PRT-123', use basic-engineering:ai-dlc which routes here automatically."
argument-hint: '<TICKET-ID or intent description>'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for intent classification and adaptive planning.

## Agent: Planner

**Mission**: Classify the intent, assess complexity, and generate an adaptive Level 1 Plan that determines which phases the pipeline will execute.

**Inputs**: Jira ticket ID or free-form intent description
**Outputs**: Level 1 Plan (intent type, phases to execute, complexity assessment)

## Why This Phase Exists

Traditional SDLC runs every stage for every task. AI-DLC adapts — a bug fix doesn't need Domain Design, a spike doesn't need Release. The Plan phase ensures the right amount of process for the task at hand.

## Steps

### Check for Existing State

Read `docs/<identifier>/state.md` if it exists. If Plan is already completed, ask the user if they want to re-plan. See [shared reference](../ai-dlc/reference/shared.md) for state.md format.

### Read the Intent

**If a Jira ticket ID is provided:**
- Use `getJiraIssue` with the ticket ID
- Extract: summary, description, acceptance criteria, issue type, labels, linked issues, comments
- **Never infer from title alone.** Always read the full ticket.

**If a free-form intent is provided:**
- Parse the description for scope, goals, and constraints
- Ask clarifying questions if the intent is ambiguous

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

### Pipeline
1. [x] **Plan** — (this phase)
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
- Complexity: {band}
- New domain concepts: {yes/no — list if yes}
- NFR-sensitive: {yes/no}
```

### Update State

Create `docs/<identifier>/state.md` with the Level 1 Plan. See [shared reference](../ai-dlc/reference/shared.md) for format.

### CHECKPOINT — AI-Initiated Recommendation

Present the Level 1 Plan and proactively recommend the next phase:

> **Plan complete.** I classified this as a **{type}** intent with **{complexity}** complexity.
>
> Pipeline: {list of included phases}
> Skipped: {list of excluded phases with reasons}
>
> I recommend proceeding to **Inception** to {what inception will focus on}.
>
> You can adjust the pipeline — add or remove phases. Shall I proceed?

## Rules

- **NEVER** skip classification — always determine intent type before generating a plan
- **NEVER** generate a one-size-fits-all pipeline — adapt to the intent
- **ALWAYS** read the full Jira ticket (not just the title) when a ticket ID is provided
- **ALWAYS** present the Level 1 Plan for user approval
- **ALWAYS** use AI-initiated recommendation after the checkpoint
- **ALWAYS** update `docs/<identifier>/state.md`
- If intent type is ambiguous, ask the user — don't guess silently
