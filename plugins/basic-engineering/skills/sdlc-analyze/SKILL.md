---
name: sdlc-analyze
description: "Internal stage of the sdlc pipeline — extracts structured requirements from a Jira ticket. Invoke directly only via /basic-engineering:sdlc-analyze when explicitly requested by name. For general requests like 'analyze this ticket' or 'start PRT-123', use prt:sdlc which routes here automatically."
argument-hint: '<TICKET-ID>'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for requirements analysis.

## Agent: Analyst

**Mission**: Understand the ticket and produce structured requirements.

**Inputs**: Jira ticket ID
**Outputs**: Structured Requirements artifact
**Subagent type**: Use `codebase-explorer` if defined in `.claude/agents/`, otherwise `Explore`

## Steps

### Check for Existing State

Read `docs/<identifier>/state.md` if it exists. If Analyze is already completed, ask the user if they want to re-run. See [shared reference](../sdlc/reference/shared.md) for state.md format.

### Read the Jira Ticket

Use `getJiraIssue` with the ticket ID. Extract: summary, description, acceptance criteria, comments, linked issues.

**Never infer from title alone.** Always read the full ticket.

### Route to Relevant Repos

Before exploring, identify which repositories are relevant to this ticket. Read the [repo registry](../sdlc/reference/repo-registry.md) and apply the routing algorithm:

- **Prefix match**: Use the ticket's Jira project prefix (e.g., `PRT`) to load the default repo set from the Team Defaults table
- **Keyword match**: Scan the ticket summary, description, and acceptance criteria for domain keywords. Check each repo's keyword list in the registry. Add any repos that match.
- **Component/label match**: If the Jira ticket has Component or Label fields, check those against repo keywords too.
- **Confirm with user**: Present the resolved repo list — "Based on the ticket, I'll search these repos: **[list]**. Should I add or remove any?"

### Research the Codebase

Launch Explore subagents **only for the confirmed repos** to find:
- Affected modules (search for related entities, handlers, controllers)
- Existing similar implementations (patterns to follow)
- Related tests (understand current test coverage)

For each repo, pass the subagent the absolute repo path. Parallelize searches across repos.

### Identify Scope

- What exactly needs to change?
- What must NOT change? (scope boundaries)
- Are there dependencies on other tickets?

### Surface Ambiguities

- If acceptance criteria are vague, list specific open questions
- If linked issues contradict, flag the conflict
- If scope seems larger than a single ticket, suggest breaking down

### Produce Structured Requirements

```markdown
## Goal
{One sentence describing what this ticket achieves}

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}

## Scope
**In scope**: {What we're building}
**Out of scope**: {What we're NOT building}

## Affected Modules
- `modules/{name}` — {what changes}
- `apps/{name}` — {what changes}

## Existing Patterns
- {Similar implementation found at path:line}

## Open Questions
- {Question 1} — {who can answer}
```

Be specific — "update the payout module" is too vague, "add a new handler in `modules/payout/application/commands/`" is actionable.

### Update Jira

- Post requirements summary as a comment (see [shared reference](../sdlc/reference/shared.md) for comment format)

### Update State

Update `docs/<identifier>/state.md` — create file, mark Analyze as completed, record key decisions.

### CHECKPOINT

Present requirements to user for approval before proceeding.

## What Good Analysis Looks Like

- Every acceptance criterion is testable (can write a test for it)
- Affected files are specific (not just "the payout module")
- Open questions have a proposed answer or suggested person to ask
- Scope boundaries are explicit

## Rules

- **NEVER** skip reading the Jira ticket — always call `getJiraIssue` and read full description, acceptance criteria, and comments
- **ALWAYS** route via the repo registry before exploring — scope Explore subagents to confirmed repos, don't search the entire workspace
- **ALWAYS** post a Jira comment after completing analysis
- **ALWAYS** update `docs/<identifier>/state.md`
- **ALWAYS** checkpoint — present requirements and wait for user approval
- If acceptance criteria are vague, list open questions — don't fill in assumptions silently
