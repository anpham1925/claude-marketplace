---
name: investigate
description: "Structured debugging skill — systematic root-cause investigation with hypothesis testing, scope freeze, and 3-strike escalation. Use when diagnosing bugs, tracing failures, or answering 'why is this broken?' before attempting any fix. Triggers on: 'investigate', 'debug this', 'why is this failing', 'root cause', 'trace this bug', 'what's causing this'."
argument-hint: '[TICKET-ID or bug description]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for hypothesis formation and root cause analysis.

## Agent: Investigator

**Mission**: Find the root cause of a bug or failure through structured hypothesis-driven investigation. Produce a clear investigation report BEFORE any fix is attempted.

**Inputs**: Bug report, error message, Jira ticket, or symptom description
**Outputs**: `investigation.md` with root cause, evidence trail, and recommended fix approach

## Iron Law

**No fixes without investigation.** This skill finds the bug — it does not fix it. The investigation report feeds into `ai-dlc-construct` (for pipeline bugs) or direct implementation (for standalone debugging).

## Steps

### 1. Gather Context

**If a Jira ticket ID is provided:**
- Use `getJiraIssue` to read the full ticket
- Extract: description, reproduction steps, environment, linked incidents

**If a bug description is provided:**
- Parse for: error message, stack trace, affected endpoint/feature, when it started

**Check for existing state:**
- Read `docs/<identifier>/state.md` if it exists (may have pipeline context)
- Read `docs/<identifier>/investigation.md` if a prior investigation was interrupted

### 2. Scope the Investigation

Identify what to investigate and what NOT to touch:

**Spawn a `codebase-explorer` subagent** to quickly locate:
- The affected module/service/directory
- Entry points (API handlers, event consumers, cron jobs)
- Dependencies (DB queries, external API calls, cache operations)
- Recent changes in the area (`git log --oneline -20 -- <affected path>`)

Define the scope boundary:
> **Investigation scope**: `{module/path}`
> **Entry point**: `{handler/endpoint}`
> **Dependencies**: `{list}`
> **Recent changes**: `{last N commits in this area}`

Present the scope to the user before proceeding. The scope constrains where the debugger agent will look — it won't investigate outside this boundary without asking.

### 3. Run the Investigation

**Spawn a `debugger` subagent** via the Agent tool with `subagent_type: "engineering-toolkit:debugger"`. Include in the prompt:
- The scoped module boundary
- Symptom description and any error messages/stack traces
- Entry points and dependencies identified in step 2
- Recent git history for the affected area
- Honeycomb context (if available and relevant — e.g., production errors)

The debugger agent will:
1. Form hypotheses (max 3 rounds)
2. Test each hypothesis with minimal, targeted checks
3. Log evidence for every hypothesis (confirmed or rejected)
4. Produce a structured investigation report

**If Honeycomb access is relevant** (production issue, latency regression, error spike):
Include in the debugger prompt:
- "Use Honeycomb MCP tools for evidence gathering"
- "Reference `honeycomb:production-investigation` skill for query patterns"
- The affected service name and environment

### 4. Review Investigation Results

Read the debugger's investigation report. Evaluate:

| Outcome | Action |
|---------|--------|
| **ROOT CAUSE FOUND** | Present to user with recommended fix approach |
| **INCONCLUSIVE (3 strikes)** | Present what was learned and ruled out, ask user for additional context |

### 5. Write Investigation Artifact

Write `docs/<identifier>/investigation.md` with the debugger's report, plus any additional context from the Jira ticket or conversation.

```markdown
# Investigation: {title}

**Ticket**: {ID or N/A}
**Date**: {date}
**Status**: ROOT CAUSE FOUND | INCONCLUSIVE

## Symptoms
- {What was observed}
- {Reproduction steps}

## Scope
- **Module**: {path}
- **Entry point**: {handler}
- **Dependencies**: {list}

## Investigation Trail

### Hypothesis 1: {title}
- **Theory**: {what we thought}
- **Test**: {what we did}
- **Result**: CONFIRMED | REJECTED
- **Learned**: {insight}

### Hypothesis 2: {title}
...

## Root Cause
{Clear explanation with file:line references}

## Recommended Fix Approach
{What should change and why — NOT the actual code}
- Affected files: {list}
- Risk level: {low | medium | high}
- Breaking changes: {yes/no}

## Ruled Out
- {Rejected hypotheses — prevents re-investigation}

## Next Steps
- [ ] {Specific action items}
```

### CHECKPOINT — Investigation Handoff

Present the investigation results and recommend next steps:

**If root cause found:**
> **Investigation complete — root cause identified.**
>
> **Root cause**: {one-line summary}
> **Location**: {file:line}
> **Recommended fix**: {approach}
> **Risk**: {low | medium | high}
>
> Options:
> 1. **Fix it now** — I'll proceed to implement the fix {via ai-dlc-construct if in pipeline, or directly}
> 2. **Create a ticket** — I'll write up a Jira ticket with the investigation findings
> 3. **Need more context** — Tell me what's missing
>
> What would you like to do?

**If inconclusive:**
> **Investigation inconclusive after 3 hypotheses.**
>
> **What we know**: {summary of findings}
> **What we ruled out**: {rejected hypotheses}
> **What would help**: {additional context, access, or data that could unblock}
>
> Would you like to provide more context, or should I create a ticket with what we've found?

### Handoff to ai-dlc (if in pipeline)

If the investigation was triggered from the ai-dlc pipeline (bug-fix intent where root cause was unclear), hand the `investigation.md` back to the orchestrator. The orchestrator routes to Construct with the investigation as input — the fix-report becomes the basis for the implementation.

## Integration with ai-dlc

This skill integrates with the ai-dlc pipeline at two points:

1. **Plan → Investigate → Construct**: When Plan classifies a bug-fix intent but the root cause is unclear, it routes through Investigate before Construct.
2. **Observe → Investigate**: When the Observe phase detects anomalies (ALERT status), it can recommend running Investigate to diagnose the issue.

## Standalone Usage

```
/engineering-toolkit:investigate PROJ-123            # Investigate a Jira ticket
/engineering-toolkit:investigate "API returns 500 on /partners endpoint"  # Investigate a symptom
/engineering-toolkit:investigate                    # Asks what to investigate
```

## Rules

- **NEVER** apply fixes during investigation — investigation and fixing are separate concerns
- **NEVER** skip the scoping step — always define the boundary before diving in
- **NEVER** let the debugger exceed 3 hypothesis rounds — escalate to the user
- **ALWAYS** spawn a `debugger` subagent for the investigation (isolated — no source file edits)
- **ALWAYS** produce `investigation.md` with full evidence trail
- **ALWAYS** present the root cause and recommended fix to the user before any implementation
- **ALWAYS** record what was ruled out — it's as valuable as the root cause
- If the issue is in production, check Honeycomb first for observability data
