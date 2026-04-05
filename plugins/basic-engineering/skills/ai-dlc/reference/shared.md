# AI-DLC Shared Reference

Cross-cutting concerns shared by all AI-DLC phase skills. Each phase skill links here for common protocols.

---

## Session State (state.md)

The pipeline maintains a state file at `docs/<identifier>/state.md` for resumability across sessions.

**Location**: `docs/<identifier>/state.md`
- Use the ticket number if available (e.g., `docs/PRT-123/state.md`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/state.md`)

**When to update**: After completing each phase and after each checkpoint.

**Format**:
```markdown
# AI-DLC Pipeline State

## Current Position
- **Phase**: {current or last completed phase}
- **Status**: {completed | in-progress | blocked}
- **Intent Type**: {green-field | brown-field | refactor | bug-fix | performance | spike}
- **Ticket**: {ticket ID or N/A}
- **Branch**: {branch name}

## Level 1 Plan
{Adaptive pipeline determined during Plan phase}
- [x] Plan
- [x] Inception
- [ ] Domain Design
- [ ] Logical Design
- [ ] Construct
- [ ] Verify
- [ ] Release
- [ ] Observe

## NFRs
| ID | Category | Requirement | Target | Status |
|----|----------|-------------|--------|--------|
| NFR-1 | Performance | API response time | <200ms P95 | pending |
| NFR-2 | Security | Input validation | OWASP Top 10 | pending |

## Risk Register
| ID | Risk | Impact | Likelihood | Mitigation | Status |
|----|------|--------|------------|------------|--------|
| R-1 | Breaking API change | High | Medium | Versioned endpoint | open |

## Measurement Criteria
- {How we measure success — e.g., "Error rate <0.1% after deploy"}

## Traceability Matrix
| AC | Domain Model | Design Decision | Code Files | Test Files |
|----|-------------|-----------------|------------|------------|
| AC-1 | {entity/aggregate} | {option chosen} | {file paths} | {test paths} |

## Key Decisions
- {Decision 1 — made during which phase}

## Blockers / Open Questions
- {Blocker or question — status}

## Artifacts
- `specs.md` — {created | pending}
- `flows.md` — {created | pending}
- `domain-model.md` — {created | pending}
- `review-feedback.md` — {created | pending}
```

**Resuming**: When starting any phase, check for `state.md` first. If it exists, read it and resume from the current position. Present the state summary to the user before continuing.

---

## AI-Initiated Recommendation Protocol

After every checkpoint, the orchestrator MUST proactively recommend the next action. Use this template:

```
**{Phase Name} complete.**

Key findings:
- {Finding 1}
- {Finding 2}

I recommend proceeding to **{Next Phase}** because {reasoning based on findings}.
Specifically, I plan to {brief description of what the next phase will focus on}.

Shall I proceed?
```

This reverses the conversation direction — AI drives, human validates.

---

## Intent Classification

Used by the Plan phase to determine the adaptive pipeline:

| Intent Type | Signals | Default Pipeline |
|-------------|---------|-----------------|
| **green-field** | No existing code in target area, "new feature", "build from scratch" | Full pipeline (all 8 phases) |
| **brown-field** | Existing code to modify, "add feature to", "enhance", "extend" | Full pipeline with code elevation in Inception |
| **refactor** | "Refactor", "restructure", "clean up", "migrate" | Plan → Inception (elevation) → Logical Design → Construct → Verify → Release |
| **bug-fix** | "Fix", "bug", "broken", "regression", "defect" | Plan → Inception (light) → Construct → Verify → Release |
| **performance** | "Slow", "optimize", "latency", "throughput", "scale" | Plan → Inception (+ profiling) → Logical Design → Construct → Verify → Release → Observe |
| **spike** | "Investigate", "spike", "research", "explore", "POC" | Plan → Inception → Domain Design → STOP |

---

## Jira Integration

Use the Atlassian MCP tools throughout:

| Action | Tool | When |
|--------|------|------|
| Read ticket | `getJiraIssue` | Plan/Inception: read full ticket details |
| Get transitions | `getTransitionsForJiraIssue` | Before transitioning status |
| Transition status | `transitionJiraIssue` | Construct: -> In Progress, Release: -> Done |
| Post comment | `addCommentToJiraIssue` | After each phase with artifact summary |
| Read linked issues | `getJiraIssue` | Inception: understand dependencies |
| Create sub-task | `createJiraIssue` | Inception: when decomposing epics into units |
| Link sub-task | `createIssueLink` | Inception: link units to parent intent |

### Comment Format

Post a comment to Jira after each phase completion:

```
**[AI-DLC: {Phase Name}] — Completed**

{Brief summary of what was produced}

Key decisions:
- {Decision 1}
- {Decision 2}

NFRs identified: {count} | Risks: {count} | ACs: {count}

Artifacts:
- {Link or description of output}
```

---

## Git Branch Naming

Same as SDLC convention. Format: `<ticket-or-feature>` (e.g., `PROJ-740`, `fix-auth-bug`)

**Length limit**: `<repo-name>-<branch-name>` must be **<= 53 characters** (Helm/Kubernetes constraint).

---

## Handoff Contracts

Each phase produces a structured artifact that feeds into the next:

```
Planner --[Level 1 Plan]--> Inceptor
Inceptor --[Inception Artifact (Reqs + NFRs + Risks + Measurements)]--> Domain Designer
Domain Designer --[Domain Model]--> Logical Designer
Logical Designer --[Solution Design + Plan Summary]--> Constructor
Constructor --[Code + Tests + Traceability]--> Verifier
Verifier --[Verified Code + Review Feedback]--> Releaser
Releaser --[Merged PR]--> Observer
Observer --[Observation Report]--> DONE
```

### Inception Artifact Format

```markdown
## Goal
{One sentence}

## Acceptance Criteria
- [ ] AC-1: {criterion}

## Scope
**In scope**: ...
**Out of scope**: ...

## Affected Modules
- `modules/{name}` — {what changes}

## Existing Patterns
- {Similar implementation at path:line}

## NFRs
| ID | Category | Requirement | Target |
|----|----------|-------------|--------|

## Risk Assessment
| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|

## Measurement Criteria
- {How we know this succeeded}

## Code Elevation (brown-field only)
### Static Model
- {Components, responsibilities, relationships}
### Dynamic Model
- {Interaction flows for key use cases}

## Open Questions
- {Question — who can answer}
```

### Domain Model Artifact Format

```markdown
## Aggregates
### {AggregateName}
- **Root Entity**: {name}
- **Entities**: {list}
- **Value Objects**: {list}
- **Invariants**: {business rules that must hold}

## Domain Events
- `{EventName}` — triggered when {condition}

## Repository Interfaces
- `{RepoName}` — {operations}

## State Transitions
{Mermaid state diagram}

## Component Interactions
{Mermaid sequence diagram}
```

### Rules

- **Never skip a handoff** — each phase needs the previous artifact
- **Artifacts are append-only** — later phases can add but not remove
- **Checkpoint artifacts** — Plan, Inception, Domain Design, and Logical Design outputs must be user-approved before handoff
- **Traceability is cumulative** — each phase adds its column to the traceability matrix
- **AI recommends after every checkpoint** — never just stop silently

---

## Traceability Matrix Protocol

The traceability matrix links every acceptance criterion through the full pipeline:

| Column | Populated By | Content |
|--------|-------------|---------|
| **AC** | Inception | Acceptance criterion text |
| **Domain Model** | Domain Design | Entity/aggregate/event that implements it |
| **Design Decision** | Logical Design | Chosen pattern/option |
| **Code Files** | Construct | File paths of implementation |
| **Test Files** | Construct | File paths of tests |

**Rules**:
- Every AC MUST have entries in all columns by the end of Verify
- Verify phase validates completeness — gaps are flagged as FAIL
- Matrix is stored in `state.md` and updated after each phase

---

## Phase Gating

AI-DLC uses **two gating mechanisms** for different scopes:

### AI-DLC Phases (Plan → Observe): `state.md`

The `state.md` "Level 1 Plan" section tracks phase completion. Every phase skill:
1. **Before starting**: Reads `state.md`, verifies the previous phase is marked completed
2. **After completing**: Updates `state.md`, marks the phase as completed with timestamp

**If the previous phase is not completed, STOP and complete it first.**

This is simpler than a separate gate file because the orchestrator manages phase sequencing and `state.md` already carries all the context each phase needs.

### Release Sub-Stages (Branch → PR Review): `stage-gate.md`

The Release phase delegates to ship-n-check, which uses its own `stage-gate.md` for granular sub-stage gating (branch, quality, push, CI/CD, staging, PR review). See [ship-n-check shared reference](../../ship-n-check/reference/shared.md) for that protocol.

---

## Working Directory

All files for the pipeline stored under `docs/<identifier>/`:

**Durable design knowledge (keep after merge):**
- `prd-plans/specs.md` — consolidated specifications, NFR targets, design rationale
- `prd-plans/flows.md` — flow diagrams (Mermaid)
- `prd-plans/domain-model.md` — domain model artifact
- `prd-plans/fix-report.md` — root cause, fix, regression prevention (bug-fix intents)
- `prd-plans/ADR-*.md` — architecture decision records

**Pipeline plumbing (delete after merge):**
- `state.md` — pipeline position tracking
- `commit-msg.txt` — temp commit message file
- `pr-body.md` — temp PR body file
- `review-feedback.md` — cumulative review feedback log

**Temp working files (do NOT commit):**
- `commit-msg.txt` — temp commit message file
- `pr-body.md` — temp PR body file

---

## Config

Reads config from `${CLAUDE_PLUGIN_DATA}/config.json` (shared with sdlc/ship skills). Fields:

- `jiraProjectPrefix` — e.g., `PRT`, `PSR`, `MOX`
- `testCommands` — e.g., `yarn test`, `yarn test:e2e`
- `lintCommands` — e.g., `yarn lint --fix`, `yarn type-check`
- `branchConvention` — e.g., `{ticket}` or `{type}/{ticket}-{slug}`
- `reviewBot` — name of GitHub review bot
- `honeycombDataset` — dataset name for Observe phase queries
- `honeycombEnvironment` — environment for Observe phase

If config is missing, fall back to auto-detecting from `package.json` scripts.

---

## Context Freshness Rules

- **Every phase agent MUST be a subagent** — never execute a phase inline
- **Subagents receive only their inputs** — pass the structured artifact, not full history
- **Wave subagents are independent** — each gets Solution Design + relevant files only
- **Fresh subagents for verification** — Verifier MUST NOT be the Constructor
- **Main session stays lean** — hold only: state.md contents, phase summaries, checkpoint decisions
- **AI-initiated recommendations** use findings from the just-completed phase, not recalled history

---

## Review Feedback Format

Same dual-write protocol as ship-n-check shared. See [ship-n-check shared reference](../../ship-n-check/reference/shared.md#review-feedback-format) for the full protocol.

**Summary**: Every feedback entry is written to **both**:
1. `docs/<identifier>/review-feedback.md` — per-ticket (deleted after merge)
2. `${CLAUDE_PROJECT_MEMORY_DIR}/review-feedback.md` — persistent (survives merges, accumulates across tickets)

Sources in AI-DLC: `inception | domain-design | logical-design | construct | verify | ci-fix | pr-review`

```markdown
---

## [YYYY-MM-DD] TICKET — source: verify | ci-fix | pr-review

### AUTO-FIX
- [ ] [file:line] Description of issue and fix applied

### NEEDS-INPUT
- [ ] [file:line] Description of issue — options: A) ... B) ...

### INFO
- [file:line] Observation (no action needed)

### Summary
- **Auto-fixed**: N issues
- **Needs input**: N issues
- **Info**: N observations
```
