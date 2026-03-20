---
name: sdlc-release
description: "TRIGGER when: user says 'release this', 'ship it' (in SDLC context), 'create PR and deploy', or references the release stage. DO NOT trigger for: full SDLC pipeline, or ship-n-check directly."
argument-hint: '[TICKET-ID]'
model: sonnet
---

> **Recommended model: Sonnet** — Git workflow and CI/CD — procedural.

## Purpose

Get the code merged and deployed. Delegates to `ship-n-check` for the full release pipeline and handles Jira post-merge transitions. This is the seventh and final stage of the SDLC pipeline but can run standalone.

## Standalone Invocation

```
/basic-engineering:sdlc-release PRT-123
```

If no ticket ID is provided, derive from the current branch name or ask the user.

## State Tracking

Read `docs/<identifier>/STATE.md` at start (if it exists). Update Current stage, Status, Artifacts, and Notes when done. If standalone (no orchestrator), derive identifier from branch name.

## Agent: Release

**Mission**: Get the code merged and deployed.
**Model**: sonnet

**Subagent type**: Delegates to ship-n-check skill, which manages its own subagents internally.

### Inputs
- Approved, reviewed code

### Outputs
- Merged PR, deployed to staging/production

## Steps

**Delegate to `/basic-engineering:ship-n-check`** via the Skill tool (or project-local `/ship-n-check` if installed standalone). This handles:

- **Branch & Commit** — Final commit with all changes
- **Requirements Review** (blocking) — Spawn a fresh subagent to cross-check the diff against original requirements. Catches under-delivery, over-scope, and gaps. Blocks the pipeline if mismatches found.
- **Code Quality Review** — Self-review, lint, type-check, test
- **Push & PR** — Create draft PR
- **CI/CD** — Watch pipeline, fix failures
- **Staging** — Verify deployment
- **Open PR** — Mark ready for review
- **Address Reviews** — Handle feedback

## Jira Post-Merge Updates

After the ship-n-check pipeline completes:

- Post PR link as comment on the Jira ticket
- When PR is merged: transition ticket to "Done" (or appropriate final status)
  - Use `getTransitionsForJiraIssue` first to find the right transition ID
  - Use `transitionJiraIssue` to transition

### Comment Format

```
**[SDLC: Release] — Completed**

PR: {PR URL}
Status: Merged and deployed to staging

Artifacts:
- PR: {PR URL}
- CI: All checks passing
- Staging: Verified
```

## Rules

- **NEVER** freestyle the release — always delegate to ship-n-check
- **ALWAYS** update Jira with PR link after PR creation
- **ALWAYS** transition Jira to "Done" after merge
- **ALWAYS** update STATE.md after completion
- If Jira MCP tools aren't connected, ask the user whether to proceed without Jira or set it up first
