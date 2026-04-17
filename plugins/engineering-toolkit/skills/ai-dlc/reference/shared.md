# AI-DLC Shared Reference

Cross-cutting concerns shared by all AI-DLC phase skills. Each phase skill links here for common protocols.

---

## Session State (state.md)

The pipeline maintains a state file at `docs/<identifier>/state.md` for resumability across sessions.

**Location**: `docs/<identifier>/state.md`
- Use the ticket number if available (e.g., `docs/PROJ-123/state.md`)
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

## Observability Plan
- **Archetype**: {HTTP API | Event Consumer | Worker | Frontend}
- **SLIs/SLOs**: {count} defined — {brief list}
- **Instrumentation**: {count} points — {brief list}
- **Alerts**: {new alerts / covered by existing}

## Traceability Matrix
| AC | Domain Model | Design Decision | Code Files | Test Files |
|----|-------------|-----------------|------------|------------|
| AC-1 | {entity/aggregate} | {option chosen} | {file paths} | {test paths} |

## Key Decisions
- {Decision 1 — made during which phase}

## Blockers / Open Questions
- {Blocker or question — status}

## Artifacts
- `prd-plans/inception.md` — {created | pending}
- `prd-plans/domain-model.md` — {created | pending}
- `prd-plans/specs.md` — {created | pending}
- `prd-plans/flows.md` — {created | pending}
- `review-feedback.md` — {created | pending}
```

**Resuming**: When starting any phase, check for `state.md` first. If it exists, read it and resume from the current position. Present the state summary to the user before continuing.

---

## Common Phase Rules

Every ai-dlc phase skill MUST follow these rules. Phase-specific SKILL.md files link here instead of repeating them.

- **ALWAYS** update `docs/<identifier>/state.md` after completing the phase
- **ALWAYS** post a Jira comment with phase summary after completing (see [Jira Integration](#jira-integration) for format)
- **ALWAYS** use AI-initiated recommendation at the checkpoint (see [protocol below](#ai-initiated-recommendation-protocol))
- **ALWAYS** check for `state.md` at the start — resume if a previous session was interrupted
- **ALWAYS** update the traceability matrix as phases complete (see [Traceability Matrix Protocol](#traceability-matrix-protocol))
- **ALWAYS** ask open questions one at a time with multiple-choice options (see [Open Questions Protocol](#open-questions-protocol))
- **NEVER** auto-fix debatable items — always ask the user
- **NEVER** dump a long list of open questions on the user — ask one at a time
- If the phase fails or gets stuck, **STOP** and inform the user — don't retry endlessly

---

## Open Questions Protocol

When a phase ends with open questions for the user (clarifications, tradeoffs, ambiguous scope), **never** present them as a flat list — users lose track, skip items, or answer with vague batch responses.

Instead, ask **one question at a time** in an interactive prompt with:
- **At least 3 concrete options** the phase considers plausible (A, B, C, …)
- **One "free input" option** for the user to write their own answer
- A recommended default marked with `(recommended)` when the phase has a clear lean

Wait for the user's answer before moving to the next question. Record each answer inline in the relevant artifact (e.g., `prd-plans/inception.md` "Open Questions" section, `state.md` "Key Decisions") as it's resolved — don't batch writes.

### Template

```
**Question {N} of {total}: {short question}**

{1-2 sentence context — why this matters, what depends on it}

Options:
A) {option 1 — concrete, actionable}
B) {option 2 — concrete, actionable} (recommended)
C) {option 3 — concrete, actionable}
D) Something else — please describe

Which option do you choose?
```

### Rules

- **ALWAYS** surface the total count upfront so the user knows the scope (e.g., "I have 3 questions before we proceed")
- **ALWAYS** give at least 3 substantive options — if you can't think of 3, the question probably isn't ready to ask yet
- **ALWAYS** include option D (or equivalent) for free-form input
- **NEVER** chain multiple questions in one prompt — one at a time, wait for the answer
- **NEVER** use yes/no framing when a spectrum of options exists
- Mark a recommendation when the phase has a clear lean, but still let the user override

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

See [ship-n-check shared reference](../../ship-n-check/reference/shared.md#branch-naming) for branch naming convention and Helm length limit.

---

## Handoff Contracts, Artifact Formats & Traceability

See [artifacts.md](artifacts.md) for:
- Handoff chain (which files flow between phases)
- Inception Artifact Format (template for `prd-plans/inception.md`)
- Domain Model Artifact Format (template for `prd-plans/domain-model.md`)
- Artifact rules (append-only, file paths not content, session-death safe)
- Traceability Matrix Protocol (AC columns, populated-by, validation rules)

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
- `prd-plans/inception.md` — Inception Artifact (ACs, NFRs, risks, Observability Plan, code elevation for brown-field)
- `prd-plans/domain-model.md` — domain model artifact
- `prd-plans/specs.md` — Solution Design + Plan Summary (consolidated specs, NFR-to-design mapping, design rationale)
- `prd-plans/flows.md` — flow diagrams (Mermaid)
- `prd-plans/fix-report.md` — root cause, fix, regression prevention (bug-fix intents)
- `prd-plans/ADR-*.md` — architecture decision records
- `review-feedback.md` — review findings for cross-ticket pattern detection via `/engineering-toolkit:review-learning`

**Pipeline plumbing (delete after merge):**
- `state.md` — pipeline position tracking

**Temp working files (do NOT commit):**
- `commit-msg.txt` — temp commit message file
- `pr-body.md` — temp PR body file

---

## Config

Reads config from `${CLAUDE_PLUGIN_DATA}/config.json` (shared with ship skills). Fields:

- `testCommands` — e.g., `yarn test`, `yarn test:e2e`
- `lintCommands` — e.g., `yarn lint --fix`, `yarn type-check`
- `reviewBot` — name of GitHub review bot
- `honeycombDataset` — dataset name for Observe phase queries
- `honeycombEnvironment` — environment for Observe phase

Branch naming and Jira project prefix are derived from the ticket ID at runtime — not stored in config. This supports working across multiple projects without reconfiguration.

If config is missing, fall back to auto-detecting from `package.json` scripts.

---

## Context Freshness Rules

- **Every phase agent MUST be a subagent** — never execute a phase inline
- **Subagents receive file paths, not content** — the prompt contains methodology path + input/output artifact paths. No raw text, no summaries, no context blobs from the orchestrator
- **Subagents read all context from files** — state.md for pipeline position, previous artifact files for input context. If it's not in a file, the subagent doesn't need it
- **Subagents write all outputs to files** — artifact files ARE the deliverable. The subagent's return text to the orchestrator is incidental, not authoritative
- **Orchestrator reads files after each phase** — build checkpoint summaries from state.md and output artifacts, not from subagent return text
- **Session-death safe** — if the session dies between phases, all completed work is in artifact files. The next session reads state.md and resumes with zero context loss
- **Wave subagents are independent** — each gets Solution Design path + relevant file paths only
- **Fresh subagents for verification** — Verifier MUST NOT be the Constructor
- **Main session stays lean** — hold only: file paths, checkpoint decisions, user approvals

---

## Review Feedback Format

See [ship-n-check shared reference](../../ship-n-check/reference/shared.md#review-feedback-format) for the full protocol.

**Summary**: Every feedback entry is written to `docs/<identifier>/review-feedback.md` (committed into the PR, deleted after merge).

Sources: `self-review | verify | ci-fix | pr-review`

```markdown
---

## [YYYY-MM-DD] TICKET — source: self-review | verify | ci-fix | pr-review

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
