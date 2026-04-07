---
name: ai-dlc-discovery
description: "Internal phase of the ai-dlc pipeline — challenges the problem statement, reframes the request, and surfaces hidden requirements before engineering begins. Invoke directly only via /engineering-toolkit:ai-dlc-discovery when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here when scope is unclear."
argument-hint: '[TICKET-ID or intent description]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for challenging assumptions and reframing problems.

## Agent: Discovery

**Mission**: Challenge the problem statement, push back on solution-first thinking, surface hidden requirements, and recommend the narrowest viable wedge before engineering begins.

**Inputs**: Jira ticket ID, free-form intent, or vague feature request
**Outputs**: `discovery.md` with reframed problem, approaches, and recommendation
**Subagent type**: `general-purpose`

## Why This Phase Exists

Teams often build the wrong thing — not because the engineering is bad, but because the problem wasn't questioned. Tickets describe solutions ("add a retry button") when the real pain is something deeper ("users lose work when the upload fails silently"). Discovery catches these scope issues before they become expensive rework.

This phase is **optional** — it runs when the request is vague or broad, and is skipped when the ticket has clear acceptance criteria.

## When to Run

| Scenario | Run Discovery? |
|----------|---------------|
| Vague feature request (no ticket, no ACs) | **Yes** |
| Broad initiative ("improve performance", "better UX") | **Yes** |
| New product idea or exploratory work | **Yes** |
| User explicitly asks (`/engineering-toolkit:ai-dlc discovery`, "challenge this idea") | **Yes** |
| Plan phase detects unclear scope and recommends discovery | **Yes** |
| Well-defined ticket with clear ACs | **Skip** — proceed to Plan |
| Bug fix with clear reproduction steps | **Skip** — proceed to Plan |
| Refactor with defined scope | **Skip** — proceed to Plan |

## Steps

### Check for Existing State

Read `docs/<identifier>/state.md` if it exists. If Discovery is already completed, ask the user if they want to re-run. See [shared reference](../ai-dlc/reference/shared.md) for state.md format.

### Read the Intent

**If a Jira ticket ID is provided:**
- Use `getJiraIssue` with the ticket ID
- Extract: summary, description, acceptance criteria, comments, linked issues
- Look for signals of vague scope: missing ACs, solution-language instead of problem-language

**If a free-form intent is provided:**
- Parse for what the user wants and, more importantly, what they haven't said

### Challenge with 6 Forcing Questions

Work through these interactively. Use `AskUserQuestion` for each — don't batch them. Listen to the answer before asking the next question. Adapt follow-ups based on what you learn.

#### 1. What's the pain?

> "Give me a specific example of when this problem hurt. Not a hypothetical — a real moment."

Why: Specific examples reveal the actual problem. Hypotheticals reveal what someone thinks the problem might be.

- If the user gives a hypothetical, push back: "That sounds like what might happen. When did it actually happen?"
- If the user gives a solution, redirect: "That's a solution. What's the problem it solves? When did you last feel that problem?"

#### 2. Who feels it?

> "Which user persona is affected? How often? How severely?"

Why: "Everyone" means nobody. Narrow to a specific persona and frequency.

- Push for specificity: "Which specific user type is affected?"
- Push for frequency: "Once a week? Once a day? Every transaction?"
- Push for severity: "Is it annoying or blocking? Do they have a workaround?"

#### 3. What exists today?

> "What workarounds exist? Why aren't they enough?"

Why: Understanding workarounds reveals the actual gap. Sometimes the workaround is 80% good enough and the engineering effort isn't justified.

- Ask about manual processes, existing tools, or competing products
- If no workaround exists, that's a signal of either high need or low priority (nobody bothered)

#### 4. What's the smallest version?

> "If you could only ship ONE thing this week, what would move the needle most?"

Why: Forces prioritization. The answer to this question is almost always the right starting point.

- Reject scope creep: "That's three things. Pick one."
- If the user can't pick one, that's a signal the problem isn't well understood yet

#### 5. What's the 10x version?

> "Forget constraints. What would this look like if it were 10x better than anything else?"

Why: Surfaces the real ambition. The gap between the smallest version and the 10x version reveals the roadmap.

- This is NOT the thing to build first. It's the thing to build toward.
- Use it to evaluate whether the smallest version is on the right trajectory

#### 6. What breaks if we're wrong?

> "What's the cost of building the wrong thing? How do we validate cheaply?"

Why: Calibrates risk. A low-cost experiment is better than a high-confidence guess.

- Push for validation: "How would you know within a week if this is working?"
- Push for cost: "If this fails, what did we waste? A day? A sprint? A quarter?"

### Reframe the Problem

After the 6 questions, synthesize what you learned. Often the real problem is different from the stated request.

**Pattern: Solution → Problem reframing**
- User said: "Add a retry button to the upload form"
- Reframed: "Users lose work when uploads fail silently. The real need is reliable upload with progress visibility — a retry button is one possible solution, but preventing the failure is better."

Present the reframing to the user:
> "You asked for X. Based on what you described, the actual problem is Y. Here's why I think so: {evidence from their answers}. Does this reframing feel right, or am I missing something?"

Let the user agree, disagree, or adjust. Don't proceed until alignment.

### Generate Approaches

Produce exactly 3 implementation approaches at different scope levels:

#### Approach 1: Narrow Wedge
- Smallest thing that moves the needle
- Ships this sprint
- Validates the core assumption
- Estimated effort: {days}

#### Approach 2: Balanced
- Solves the core problem well
- Ships in 1-2 sprints
- Covers key edge cases
- Estimated effort: {days}

#### Approach 3: Full Vision
- The 10x version
- Multi-sprint or multi-quarter
- Complete solution with scale
- Estimated effort: {weeks/months}

### Recommend and Validate

Always recommend the narrow wedge with a clear rationale:

> **My recommendation: Start with Approach 1 (Narrow Wedge).**
>
> Rationale: {why this is the right starting point}
> Validation: {how to know within a week if it's working}
> Path to Approach 2: {what you'd learn from the wedge that informs the next step}

### Write Discovery Artifact

Write `docs/<identifier>/discovery.md`:

```markdown
# Discovery: {title}

## Original Request
{What the user initially asked for}

## Reframed Problem
{The actual problem, based on the 6 forcing questions}

## User Persona & Pain
- **Who**: {persona}
- **Frequency**: {how often they feel the pain}
- **Severity**: {blocking | painful | annoying}
- **Current workaround**: {what they do today}

## Approaches

### Approach 1: Narrow Wedge — {name}
{Description}
- **Effort**: {days}
- **Validates**: {core assumption}
- **Ships by**: {when}

### Approach 2: Balanced — {name}
{Description}
- **Effort**: {days}
- **Depends on**: {what we learn from Approach 1}

### Approach 3: Full Vision — {name}
{Description}
- **Effort**: {weeks/months}
- **Why not start here**: {reason}

## Recommendation
**Start with Approach {N}.**
- Rationale: {why}
- Validation: {how to measure success within a week}
- Next step: {how this informs the next approach}

## Key Decisions
- {Decision made during discovery, with rationale}

## Open Questions
- {Anything unresolved that Plan/Inception should address}
```

### Update State

Create or update `docs/<identifier>/state.md`:
- Mark Discovery as completed
- Record the recommended approach
- List open questions for the Plan phase

### CHECKPOINT — AI-Initiated Recommendation

Present results and recommend next phase:

> **Discovery complete.**
>
> - **Original request**: {what the user asked}
> - **Reframed problem**: {the actual problem}
> - **Recommended approach**: Approach {N} — {name} ({effort estimate})
> - **Open questions**: {count, if any}
>
> I recommend proceeding to **Plan** to classify the intent type and generate the adaptive pipeline for Approach {N}.
>
> Shall I proceed?

## Rules

- **ALWAYS** use AskUserQuestion for each forcing question — don't batch
- **ALWAYS** push back on solution-first thinking — redirect to problems
- **ALWAYS** push for specific examples over hypotheticals
- **ALWAYS** produce exactly 3 approaches at different scope levels
- **ALWAYS** recommend starting with the narrowest wedge
- **ALWAYS** get alignment on the reframing before generating approaches
- **NEVER** accept the first framing without questioning it
- **NEVER** skip the reframing step — even if the original request seems clear
- **NEVER** recommend the full vision as the starting point
- **ALWAYS** write `discovery.md` with structured output
- **ALWAYS** update `docs/<identifier>/state.md`
- **ALWAYS** use AI-initiated recommendation at the checkpoint
