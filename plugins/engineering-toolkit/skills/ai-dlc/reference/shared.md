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

## Decisions
| ID | Phase | Decision | Status | Superseded By | Rationale |
|----|-------|----------|--------|---------------|-----------|
| D-1 | Logical Design | Use saga handler for hipay refund call | active | — | Domain handlers must stay synchronous; external API calls go through sagas |
| D-2 | Logical Design | Refund as write-model aggregate | superseded | D-3 | Red Team flagged eligibility queries don't need refund state |
| D-3 | Red Team loop 1 → Logical Design | Refund as domain event, not aggregate | active | — | Replaces D-2 after Red Team finding RT-2 |

## Blockers / Open Questions
- {Blocker or question — status}

## Activity Log
Append-only. One row per phase completion, checkpoint, or material change. Newest at the bottom.

| Timestamp | Phase | Action | Commit SHA | Notes |
|-----------|-------|--------|------------|-------|
| 2026-05-07T09:12Z | Plan | completed | abc1234 | Intent: brown-field; pipeline includes Red Team |
| 2026-05-07T10:45Z | Inception | completed | def5678 | 4 ACs, 2 NFRs, 1 risk |
| 2026-05-07T12:30Z | Red Team | iteration 1 → loop back to Logical Design | — | Finding RT-2 supersedes D-2 |

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
- **ALWAYS** append a row to state.md "Activity Log" when the phase completes, when a checkpoint resolves, or when a decision changes status (see [Decision Lifecycle Protocol](#decision-lifecycle-protocol))
- **ALWAYS** add new decisions to the state.md "Decisions" table — one row per decision, never inline-edit prose
- **NEVER** delete or rewrite a decision — supersede it by setting `Status: superseded`, `Superseded By: D-N`, and adding a new row for the replacement
- **NEVER** auto-fix debatable items — always ask the user
- **NEVER** dump a long list of open questions on the user — ask one at a time
- **ALWAYS** return your final message to the orchestrator in the shape defined by the [Subagent Return Contract](#subagent-return-contract) — status line, artifacts written, key decisions, assumptions, next phase. No transcript, no preamble. Prose returns force the orchestrator to guess; the contract makes assumptions surface-able and routing deterministic.
- If the phase fails or gets stuck, **STOP** and inform the user — don't retry endlessly

---

## Decision Lifecycle Protocol

Decisions made during the pipeline (option picks, design tradeoffs, scope cuts) live in the **Decisions** table in state.md. They are append-only and never rewritten.

### Why

Red Team loops, scope renegotiations, and post-Verify findings routinely overturn earlier decisions. If decisions are silently rewritten, the trail of *why the design changed* disappears — future engineers (and the next AI session) lose the context they need to avoid re-litigating the same tradeoff. ADRs cover the material/architectural decisions; this table covers the medium-tier ones that don't earn an ADR but still shape the build.

### What counts as a decision

Add a row when:
- A phase picks one option from 2+ alternatives that the user (or red-team) might reasonably revisit
- A scope or interface boundary is fixed
- An NFR target is committed to a specific number
- A library / pattern / dependency is chosen for a new concern

Do NOT add a row for:
- Trivial naming choices already covered by team rules
- Things already captured in an ADR (ADRs are the authoritative record — link from the Decisions row instead)

### Lifecycle

```
active ──supersede──▶ superseded
   │                     ▲
   └─── new row added ───┘
        with Superseded By: D-{old}
```

When a phase replaces an earlier decision (most commonly, Red Team loop-back to Logical Design):
1. **Do not delete** the existing row.
2. Set the existing row's `Status: superseded` and `Superseded By: D-{new ID}`.
3. **Add a new row** for the replacement decision with its own `D-{N}` ID, `Status: active`, and a Rationale that names which finding/feedback drove the change (e.g., "Replaces D-2 after Red Team finding RT-2").

### Activity Log

Sister artifact in the same state.md. Append-only. One row per:
- Phase completion (e.g., "Inception completed")
- Red Team iteration result (e.g., "Red Team loop 1 → loop back to Logical Design")
- Decision status change (e.g., "D-2 superseded by D-3")
- Material checkpoint result (e.g., "User approved Logical Design v2")

Include `Commit SHA` when the change was committed; `—` when in-flight. The log is the canonical resume narrative — when a session dies and resumes, the orchestrator reads the tail of this log first.

### Rule of thumb

If you find yourself editing an existing Decisions row to change its content (other than flipping status to `superseded` and filling in `Superseded By`), stop — that's a protocol violation. Add a new row instead.

---

## Subagent Return Contract

Phase subagents return a structured handoff to the orchestrator. The contract is **not** the deliverable — artifact files in `docs/<identifier>/` remain authoritative. The contract is the *brief* the orchestrator reads to decide what to do next: route to a checkpoint, surface a blocker, or escalate to the user.

### Why

Without a contract, return text is free-form prose. The orchestrator has to parse narrative to answer four questions every time:
- Did the phase succeed, fail, or stall?
- Which artifacts actually got written (vs. mentioned in passing)?
- What assumptions did the subagent make that the next phase will silently inherit?
- What's the recommended next phase?

Implicit answers buried in prose are how upstream defects slip past: a Construct subagent writes "I assumed the existing partner-notification SLA covers AC-2" in paragraph three, the orchestrator skims it as colour, the assumption ships unchallenged. A structured shape forces those assumptions to a labelled line where the orchestrator can surface them at the checkpoint.

### The shape

The subagent's return text MUST be ONLY this — no preamble, no transcript, no diffs, no artifact content:

```
- Status: COMPLETE | BLOCKED | NEEDS_USER_INPUT
- Artifacts written: <comma-separated paths, relative to docs/<identifier>/>
- Key decisions: <one-liner each, max 5; reference D-N from state.md Decisions table or ADR path>
- Assumptions made: <one-liner per assumption the next phase should verify; "none" if none>
- Blockers (if BLOCKED): <what stopped the phase + what would unblock it>
- Open questions (if NEEDS_USER_INPUT): <one per line, with proposed options for the orchestrator to translate>
- Next phase: <recommended phase + 1-line rationale>
```

### Status values

- **COMPLETE** — required outputs produced; orchestrator moves to checkpoint + next-phase recommendation
- **BLOCKED** — phase cannot proceed without external action (missing dep, ambiguous ticket, system failure); orchestrator STOPs and surfaces the blocker, no further dispatch until resolved
- **NEEDS_USER_INPUT** — phase reached a fork the user must decide; orchestrator translates each open question into an `AskUserQuestion` call per the [Open Questions Protocol](#open-questions-protocol), then re-dispatches the subagent (or updates `state.md` and continues, depending on the question)

### What the orchestrator does with the contract

1. **Parse the status line first.** Route deterministically: COMPLETE → checkpoint; BLOCKED → user surface; NEEDS_USER_INPUT → question loop.
2. **Verify artifact paths.** Read each file in "Artifacts written" to build the checkpoint summary. If a listed file is missing on disk, the contract is broken — treat as BLOCKED and re-dispatch with a corrective prompt.
3. **Surface assumptions verbatim.** Every "Assumptions made" line goes into the checkpoint message so the user can challenge it before the next phase inherits it. Do not paraphrase or filter — the subagent flagged them as worth surfacing.
4. **Translate open questions.** Per the [Open Questions Protocol](#open-questions-protocol), feed each question through `AskUserQuestion`. The subagent's option suggestions are raw material — the orchestrator owns the final user-facing shape (one question per call, options first with `(Recommended)`, etc.).
5. **Verify decision rows exist.** Each "Key decisions" line should already have a corresponding row in `state.md` Decisions table (the subagent added it per the [Decision Lifecycle Protocol](#decision-lifecycle-protocol)). The orchestrator confirms — it does not re-add.

### What the subagent MUST NOT include

- Tool-call transcripts, command output, file listings
- Verbatim artifact content (orchestrator reads files from disk)
- Pre-formatted A/B/C prose for user questions (orchestrator owns user-facing translation per the [Open Questions Protocol](#open-questions-protocol))
- Multi-paragraph narrative — the contract is bullet lines, not an essay

### Example return

```
- Status: COMPLETE
- Artifacts written: prd-plans/inception.md, state.md
- Key decisions: D-1 (NFR-1 target P95<200ms, not P99 — ticket isn't customer-facing); D-2 (split AC-3 into AC-3a/AC-3b for testability)
- Assumptions made: AC-2 ("partner notified within 5min") assumes existing partner-notification SLA holds — Construct must verify the SLA covers this code path
- Next phase: Domain Design — Refund and Eligibility aggregates have distinct lifecycles per AC-1/AC-4, worth modelling separately
```

### Why files still win when the contract and disk disagree

The contract is a *brief*, not a source of truth. If the subagent says "Key decisions: D-1 ..." but `state.md` doesn't have a D-1 row, trust the disk and surface the discrepancy. The artifact files are session-death-safe; the contract is in-memory. This is the same reason the [Context Freshness Rules](#context-freshness-rules) say "files are the deliverable, return text is incidental" — the contract just makes the incidental part *parseable*, not authoritative.

### Rules

- **ALWAYS** return only the contract shape — no preamble, no transcript, no diff
- **ALWAYS** set Status explicitly — orchestrator does not infer COMPLETE from "I think we're done"
- **ALWAYS** list assumptions on their own line, even one-liners — assumptions buried in prose are how upstream defects survive
- **NEVER** invent artifact paths — list only files actually written
- **NEVER** pre-format A/B/C options as if speaking to the user — those are raw material for the orchestrator's `AskUserQuestion` translation
- **NEVER** repeat artifact content in the return — reference by path

---

## Open Questions Protocol

When a phase ends with open questions for the user (clarifications, tradeoffs, ambiguous scope), **never** present them as a flat list — users lose track, skip items, or answer with vague batch responses.

**ALWAYS use the `AskUserQuestion` tool** to present each question — never plain text asking the user to reply with "A", "B", or "C". The `AskUserQuestion` tool renders an interactive arrow-key + Enter selector with a built-in free-input ("Other") option, which is the only acceptable UX for this protocol.

Ask **one question at a time** (one `AskUserQuestion` invocation per question, with a single `questions` entry). Each invocation must have:
- **2–3 concrete options** in the `options` array (the tool caps at 4 and auto-appends "Other" — do not add your own free-input option).
- A recommended default marked by placing it **first** and suffixing the label with `(Recommended)`.
- A `header` chip (≤12 chars) and a clear `question` ending in a question mark.
- Rich `description` per option explaining the tradeoff.

Wait for the user's answer before moving to the next question. Record each answer inline in the relevant artifact (e.g., `prd-plans/inception.md` "Open Questions" section, `state.md` "Decisions" table per the [Decision Lifecycle Protocol](#decision-lifecycle-protocol)) as it's resolved — don't batch writes.

### Invocation shape

```
AskUserQuestion({
  questions: [{
    question: "{short question ending in ?}",
    header: "{≤12-char chip}",
    multiSelect: false,
    options: [
      { label: "{option 1} (Recommended)", description: "{tradeoff + implication}" },
      { label: "{option 2}",                description: "{tradeoff + implication}" },
      { label: "{option 3}",                description: "{tradeoff + implication}" }
    ]
  }]
})
```

Before invoking, surface the total count in a short preamble sentence (e.g., "I have 3 questions before we proceed — walking through them one at a time."). Do not surface all the questions themselves upfront.

### Rules

- **ALWAYS** call the `AskUserQuestion` tool for every open question — never inline markdown options asking the user to type "A"/"B"/"C".
- **ALWAYS** surface the total count upfront in the preamble (e.g., "3 questions before we proceed").
- **ALWAYS** give at least 2 substantive options — if you can't think of 2, the question probably isn't ready to ask yet. The tool adds "Other" automatically.
- **NEVER** chain multiple questions in one `AskUserQuestion` invocation — one question per call, wait for the answer, then invoke again for the next.
- **NEVER** use yes/no framing when a spectrum of options exists.
- **NEVER** include a manual "D) Something else" option — the tool's built-in "Other" replaces this.
- Mark a recommendation by making it the first option with "(Recommended)" suffix on the label.

### Orchestrator translation of subagent-surfaced questions

Phase subagents routinely identify user-facing tradeoffs during their work and return them to the orchestrator in their final message. **The subagent's prose is an intermediate representation, not the user-facing form.** The orchestrator MUST translate every such tradeoff into an `AskUserQuestion` call before the user ever sees it.

**The failure mode this rule exists to prevent:** a subagent returns a checkpoint message containing "Option A (Recommended): ... Option B: ... Option C: ..." in prose. The orchestrator, trying to be efficient, relays that prose verbatim to the user and asks them to reply with "A/B/C". This is always wrong, regardless of how cleanly the subagent formatted it.

**Mandatory translation procedure when a subagent returns a user-facing tradeoff:**
1. **Identify** the tradeoff in the subagent's return text (look for "Option A/B/C", "USER-FACING", "surfaced for checkpoint", or any enumeration of user choices).
2. **Extract** into the `AskUserQuestion` shape: a single `question`, a `header` (≤12 chars), and 2–3 `options` with `label` + `description`. Mark the subagent's recommendation (if any) with "(Recommended)" and make it the first option.
3. **Do NOT paste the subagent's prose** into the checkpoint message — it's raw material, not user-facing copy. Summarise the context in one or two sentences, then call the tool.
4. **If `AskUserQuestion` is a deferred tool** in the current harness (not in the default tool list), load it first: `ToolSearch({ query: "select:AskUserQuestion", max_results: 1 })`. Then call the tool. Friction from tool loading is not grounds for falling back to prose.
5. **Record the answer** inline in both `state.md` (Key Decisions) and the owning artifact (e.g., `prd-plans/inception.md` Open Questions section) the moment it arrives — don't batch.

**Phase subagents, when writing their return text, SHOULD:**
- Clearly label any user-facing tradeoff (e.g., prefix with `USER-FACING TRADEOFF (requires AskUserQuestion):`).
- Provide the structured ingredients the orchestrator needs: a concise question, 2–3 option labels, one-line descriptions per option, a recommendation.
- **NOT** pre-format A/B/C prose as if it were the final checkpoint message — the orchestrator will translate.

If you ever catch yourself writing "Please respond with A, B, or C" in a checkpoint, stop — that's the protocol violation. Load `AskUserQuestion` and call it.

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
