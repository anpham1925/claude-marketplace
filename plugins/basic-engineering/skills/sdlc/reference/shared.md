# SDLC Shared Reference

Cross-cutting concerns shared by all SDLC stage skills. Each stage skill links here for common protocols.

---

## Session State (state.md)

The pipeline maintains a state file at `docs/<identifier>/state.md` for resumability across sessions.

**Location**: `docs/<identifier>/state.md`
- Use the ticket number if available (e.g., `docs/PRT-123/state.md`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/state.md`)

**When to update**: After completing each stage and after each checkpoint.

**Format**:
```markdown
# Pipeline State

## Current Position
- **Stage**: {current or last completed stage}
- **Status**: {completed | in-progress | blocked}
- **Mode**: {full | quick}
- **Ticket**: {ticket ID or N/A}
- **Branch**: {branch name}

## Completed Stages
- [x] Analyze — {timestamp}
- [x] Design — {timestamp}
- [ ] Break Down Tasks (optional)
- [ ] Implement
- [ ] Test
- [ ] Verify
- [ ] Review
- [ ] Release

## Key Decisions
- {Decision 1 — made during which stage}

## Blockers / Open Questions
- {Blocker or question — status}

## Artifacts
- `specs.md` — {created | pending}
- `flows.md` — {created | pending}
- `review-feedback.md` — {created | pending}
```

**Resuming**: When starting any stage, check for `state.md` first. If it exists, read it and resume from the current position. Present the state summary to the user before continuing.

---

## Jira Integration

Use the Atlassian MCP tools throughout:

| Action | Tool | When |
|--------|------|------|
| Read ticket | `getJiraIssue` | Analyze: read full ticket details |
| Get transitions | `getTransitionsForJiraIssue` | Before transitioning status |
| Transition status | `transitionJiraIssue` | Analyze: -> In Progress, Release: -> Done |
| Post comment | `addCommentToJiraIssue` | After each stage with artifact summary |
| Read linked issues | `getJiraIssue` | Analyze: understand dependencies |
| Create sub-task | `createJiraIssue` | Break Down: create sub-tasks for each split |
| Link sub-task | `createIssueLink` | Break Down: link sub-tasks to parent ticket |

### Comment Format

Post a comment to Jira after each stage completion:

```
**[SDLC: {Stage Name}] — Completed**

{Brief summary of what was produced}

Key decisions:
- {Decision 1}
- {Decision 2}

Artifacts:
- {Link or description of output}
```

---

## Git Branch Naming

**Ticket number is recommended.** Ask the user if not provided.

Format: `<ticket-or-feature>` (e.g., `PROJ-740`, `fix-auth-bug`, `add-user-endpoint`)

**Length limit**: Helm release names are derived as `<repo-name>-<branch-name>` and must be **≤ 53 characters** (Helm/Kubernetes constraint). Before creating a branch, verify that `<repo-name>-<branch-name>` does not exceed 53 chars. If it does, shorten the branch name. For example, `partnership-fix-perk-eligibility-growthbook-version-attr` (54 chars) fails — use `fix/perk-gb-version-attr` instead.

---

## Config

This skill reads config from `${CLAUDE_PLUGIN_DATA}/config.json`. Fields:

- `jiraProjectPrefix` — e.g., `PRT`, `PSR`, `MOX` (used to validate ticket IDs)
- `testCommands` — e.g., `yarn test`, `yarn test:e2e`, `yarn test:cov`
- `lintCommands` — e.g., `yarn lint --fix`, `yarn type-check`
- `branchConvention` — e.g., `{ticket}` or `{type}/{ticket}-{slug}`
- `reviewBot` — e.g., name of GitHub review bot to watch for

If config is missing, the skill falls back to auto-detecting from `package.json` scripts.

---

## Context Freshness Rules

Context degrades as the conversation grows. To prevent "context rot":

- **Every stage agent MUST be a subagent** — never execute a stage inline in the main conversation
- **Subagents receive only their inputs** — pass the structured artifact from the previous stage, not the full conversation history
- **Wave subagents are independent** — each parallel Implementer within a wave receives the Solution Design + only relevant files
- **Debug subagents are disposable** — they get only the failing deliverable + relevant code
- **Main session stays lean** — only hold: state.md contents, stage summaries, and checkpoint decisions
- **If the main session feels slow or outputs degrade**, proactively start a new subagent

---

## Handoff Contracts

Each stage produces a structured artifact that feeds into the next:

```
Analyst --[Structured Requirements]--> Architect
Architect --[Solution Design + Plan Summary]--> Decomposer (optional)
  If breakdown: Decomposer --[Jira Sub-tasks]--> STOP (each sub-task gets own SDLC cycle)
  If no breakdown: Architect --[Solution Design]--> Implementer
Architect --[Solution Design]--> Tester (parallel)
Implementer --[Code + Tests]----\
                                 +--> Verifier --[Verification Report]--> Reviewer
Tester --[E2e Tests]------------/
Reviewer --[Approved Code]--> Release
```

### Rules

- **Never skip a handoff** — each agent needs the previous artifact
- **Artifacts are append-only** — later agents can add but not remove
- **Checkpoint artifacts** — Analyst and Architect outputs must be user-approved before handoff
- **Parallel handoff** — Implementer and Tester both receive the Solution Design simultaneously
- **Verification before review** — Verifier runs after Implement+Test, Reviewer receives both code and Verification Report
