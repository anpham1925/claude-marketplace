---
name: sdlc-analyze
description: "TRIGGER when: user says 'analyze this ticket', 'gather requirements', 'understand this ticket', or references analyzing a Jira ticket. DO NOT trigger for: full SDLC pipeline, design, implementation, or other stages."
argument-hint: '[TICKET-ID]'
model: haiku
---

> **Recommended model: Haiku** — Codebase search and extraction — speed over depth.

## Purpose

Turn a Jira ticket into structured, actionable requirements. This is the first stage of the SDLC pipeline but can run standalone.

## Standalone Invocation

```
/basic-engineering:sdlc-analyze PRT-123
```

If no ticket ID is provided, derive from the current branch name or ask the user.

## State Tracking

Read `docs/<identifier>/STATE.md` at start (if it exists). Update Current stage, Status, Artifacts, and Notes when done. If standalone (no orchestrator), derive identifier from branch name.

## Agent: Analyst

**Mission**: Understand the ticket and produce structured requirements.
**Model**: haiku

**Subagent type**: Use `codebase-explorer` if defined in `.claude/agents/`, otherwise `Explore`

### Inputs
- Jira ticket ID

### Outputs
- Structured Requirements artifact

### Responsibilities
- Read and parse Jira ticket (summary, description, acceptance criteria, comments, linked issues)
- Research codebase to identify affected modules and existing patterns
- Identify scope boundaries — what's in, what's out
- Surface open questions and ambiguities
- Produce a clear, actionable requirements document

## Steps

- **Read the Jira ticket**
  ```
  Use getJiraIssue with the ticket ID
  Extract: summary, description, acceptance criteria, comments, linked issues
  ```

- **Research the codebase**
  - Launch Explore subagents to find:
    - Affected modules (search for related entities, handlers, controllers)
    - Existing similar implementations (patterns to follow)
    - Related tests (understand current test coverage)
  - Parallelize searches across different modules

- **Identify scope**
  - What exactly needs to change?
  - What must NOT change? (scope boundaries)
  - Are there dependencies on other tickets?

- **Surface ambiguities**
  - If acceptance criteria are vague, list specific open questions
  - If linked issues contradict, flag the conflict
  - If scope seems larger than a single ticket, suggest breaking down

- **Produce the Structured Requirements**
  - Use the template below
  - Be specific — "update the payout module" is too vague, "add a new handler in modules/payout/application/commands/" is actionable

- **Update Jira**
  - Transition ticket to "In Progress" (use `getTransitionsForJiraIssue` first to find the right transition ID)
  - Post requirements summary as a comment

- **CHECKPOINT** — Present to user and wait for approval

## Jira Integration

| Action | Tool | When |
|--------|------|------|
| Read ticket | `getJiraIssue` | Read full ticket details |
| Get transitions | `getTransitionsForJiraIssue` | Before transitioning status |
| Transition status | `transitionJiraIssue` | -> In Progress |
| Post comment | `addCommentToJiraIssue` | After producing requirements |
| Read linked issues | `getJiraIssue` | Understand dependencies |

### Comment Format

Post a comment to Jira after completion:

```
**[SDLC: Analyze] — Completed**

{Brief summary of what was produced}

Key decisions:
- {Decision 1}
- {Decision 2}

Artifacts:
- {Link or description of output}
```

## Structured Requirements Template

```
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

## What Good Analysis Looks Like

- Every acceptance criterion is testable (can write a test for it)
- Affected files are specific (not just "the payout module")
- Open questions have a proposed answer or suggested person to ask
- Scope boundaries are explicit

## Rules

- **NEVER** skip reading the Jira ticket — always understand before building
- **ALWAYS** research the codebase to find affected modules and patterns
- **ALWAYS** post a Jira comment after completion
- **ALWAYS** update STATE.md after completion
- **ALWAYS** present requirements at the CHECKPOINT and wait for approval
- If Jira MCP tools aren't connected, ask the user whether to proceed without Jira or set it up first
