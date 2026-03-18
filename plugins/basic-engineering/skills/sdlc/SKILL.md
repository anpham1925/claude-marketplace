---
name: sdlc
description: Full SDLC orchestration with 7 composable stages — analyze, design, implement, test, verify, review, release. Uses agent teams with Jira integration, human checkpoints, and goal-backward verification. Use when starting a ticket end-to-end, analyzing requirements, designing solutions, implementing features, or running the full development lifecycle.
argument-hint: '[stage] [TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — This skill involves deep reasoning, architecture decisions, or code review.

## Quick Navigation

| If you need to...                        | Read                                              |
| ---------------------------------------- | ------------------------------------------------- |
| Understand agent roles and handoffs      | [reference/agents.md](reference/agents.md)        |
| See detailed stage instructions          | [reference/stages.md](reference/stages.md)        |
| Understand verification methodology      | [reference/verification.md](reference/verification.md) |
| Run the full pipeline                    | Full Pipeline below                               |

## Invocation

```
/basic-engineering:sdlc PRT-123              # Full pipeline from analyze to release
/basic-engineering:sdlc analyze PRT-123      # Analyze only — gather requirements
/basic-engineering:sdlc design               # Design — solution design (uses Analyze output)
/basic-engineering:sdlc implement            # Implement — TDD implementation
/basic-engineering:sdlc test                 # Test — e2e and integration tests
/basic-engineering:sdlc verify               # Verify — goal-backward verification
/basic-engineering:sdlc review               # Review — code review
/basic-engineering:sdlc release              # Release — PR, CI/CD, staging, deploy
```

Stages are composable. Run individually or let the full pipeline run with checkpoints.

## Stage Overview

```
[Analyze] --> checkpoint --> [Design + Revision Loop] --> checkpoint --+--> [Implement]
                                                                      |        |
                                                            (orchestrator  [Test] (parallel)
                                                            creates plan)      |
                                                                          [Verify] --> [Review] --> checkpoint --> [Release]
```

Plan creation happens between the Design checkpoint and Implement. It is an **orchestrator step**, not a separate stage — the orchestrator writes `specs.md` (the execution plan) from the approved design, then hands it to the Implementer and Tester.

| Stage | Agent | Model | Input | Output |
|-------|-------|-------|-------|--------|
| Analyze | Analyst | haiku | Jira ticket ID | Structured requirements |
| Design | Architect + Plan-Checker | opus / sonnet | Requirements | Solution design + ADR + execution plan (`specs.md`) |
| Implement | Implementer | sonnet | Execution plan (`specs.md`) | Code + unit tests (TDD) |
| Test | Tester | sonnet | Execution plan (`specs.md`) + code | E2e tests |
| Verify | Verifier | sonnet | Goal + must-haves + code | Verification report |
| Review | Reviewer | opus | Code changes + verification report | Review feedback |
| Release | Release | sonnet | Approved code | Merged PR |

## Parsing Arguments

- If `$ARGUMENTS` contains a stage name (`analyze`, `design`, `implement`, `test`, `verify`, `review`, `release`), run that stage only
- If `$ARGUMENTS` contains a ticket ID (matches pattern like `PRT-123`, `PSR-456`, `MOX-789`), use it as the Jira ticket
- If no stage specified, run the **Full Pipeline**
- If no ticket ID and stage requires one, **ask the user**

## Pre-Stage Checklist (MANDATORY)

**Before executing ANY stage, you MUST complete this checklist:**

- [ ] **Read `reference/stages.md`** — find the section for the stage you are about to execute, read the full detailed instructions
- [ ] **Read `reference/agents.md`** — understand the agent role, its responsibilities, and output templates for this stage
- [ ] **If the stage is Verify**, also read `reference/verification.md` — understand the goal-backward methodology
- [ ] **If the stage delegates to another skill** (e.g., Release → `basic-engineering:ship-n-check`), **invoke it via the Skill tool** — do NOT freestyle

Skipping this checklist is a rule violation. Do not approximate or improvise stage behavior from the summary below — the summaries are navigation aids, not the full instructions.

## State Tracking

The orchestrator maintains a lightweight state file at `docs/<identifier>/STATE.md` (same `<identifier>` as the plan folder — ticket number or branch name). This file is the pipeline's "living memory" — read it at the start of every stage, update it at the end.

**STATE.md must stay under 100 lines.** It is a digest, not an archive.

```markdown
# STATE — <identifier>

## Position
- **Current stage**: <stage name>
- **Status**: <in-progress | blocked | checkpoint>
- **Last completed**: <stage name> at <timestamp>

## Artifacts
- Requirements: <approved | pending | N/A>
- Design: <approved | pending | N/A>
- Plan: <path to specs.md>
- Verification: <passed | gaps_found | pending>

## Decisions
- <Key decision 1 made during checkpoint>
- <Key decision 2>

## Blockers
- <Active blocker, if any>

## Notes
<Anything the next stage needs to know — deviations, user feedback, etc.>
```

**Rules:**
- Create STATE.md at the start of Analyze (or the first stage run)
- Update after every stage completion and every checkpoint
- If resuming a pipeline, read STATE.md first to understand where things left off
- Keep it under 100 lines — move historical info to Jira comments

---

## Full Pipeline

Run all 7 stages with human checkpoints between major phases.

### Analyze

**Pre-read: `reference/stages.md` > Analyze and `reference/agents.md` > Analyst**

- Read the Jira ticket using MCP (`getJiraIssue`)
- Extract: summary, description, acceptance criteria, linked issues, comments
- Research the codebase — find affected modules, existing patterns, related code
- Produce **Structured Requirements** artifact:
  - Goal (one sentence)
  - Acceptance criteria (bullet list)
  - Scope boundaries (what's in / what's out)
  - Affected modules and files
  - Open questions (if any)
- Update Jira: transition to "In Progress", post requirements summary as comment
- **CHECKPOINT**: Present requirements to user for approval before proceeding

### Design (with Revision Loop)

**Pre-read: `reference/stages.md` > Design and `reference/agents.md` > Architect, Plan-Checker**

- Launch Architect agent with the approved requirements
- Analyze existing codebase patterns — find similar implementations to follow
- Design the solution:
  - Affected files (new + modified)
  - Interfaces and contracts
  - Data flow diagram (text)
  - Approach with trade-offs (2-3 options, recommend one)
- If significant architectural decision, create an ADR
- Produce **Solution Design** artifact
- **Revision loop** — spawn a Plan-Checker agent to review the design:
  - Does every acceptance criterion have a corresponding file change?
  - Are interfaces concrete (TypeScript, not prose)?
  - Are there gaps or contradictions?
  - If issues found → Architect revises → Plan-Checker re-checks (max 3 iterations)
- **CHECKPOINT**: Present design to user for approval before proceeding

### Plan (Orchestrator Step — between Design and Implement)

After the Design checkpoint is approved, the **orchestrator** creates an execution plan that serves as the **direct prompt for the Implementer agent**. This is not a separate stage — it's a transformation step the orchestrator performs before handing off to Implement. Plans are prompts — the plan IS the execution instruction, not a document that becomes one.

**Folder location:** `docs/<identifier>/prd-plans/`
- Use the ticket number if available (e.g., `docs/PRT-123/prd-plans/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/prd-plans/`)

Create the directory if it doesn't exist.

#### Write `specs.md`

This is the execution plan. Every task MUST have `read_first`, `acceptance_criteria`, and a concrete `action`.

```markdown
# <Ticket ID or branch name>: <Goal (one sentence)>

## Goal
<One sentence — what must be TRUE when this is done>

## Must-Haves (from Acceptance Criteria)
- [ ] <Must-have 1 — grep-verifiable condition>
- [ ] <Must-have 2>

## Scope
- **In scope**: <what we're building>
- **Out of scope**: <what we're NOT building>

## Tasks

### Task 1: <concrete action description>
- **read_first**: <file paths the implementer MUST read before starting>
- **action**: <specific, concrete action — NOT "align X with Y" but "add field Z to interface at path/file.ts:line">
- **acceptance_criteria**: <grep-verifiable condition, e.g., "grep -r 'export class FooHandler' modules/foo/">
- **depends_on**: <task numbers this depends on, or "none">

### Task 2: <concrete action description>
- **read_first**: <file paths>
- **action**: <specific action>
- **acceptance_criteria**: <grep-verifiable>
- **depends_on**: <dependencies>

## Design Reference
- **Approach chosen**: <recommended option and why>
- **Key interfaces/contracts**: <brief description or link to Design artifact>
- **ADR**: <link or "N/A">

## Notes
<Any additional context, constraints, or user decisions from checkpoints>
```

**Deep Work Rules** — a task is NOT ready if:
- `read_first` is empty (implementer would be guessing)
- `acceptance_criteria` can't be verified with grep/test (too vague)
- `action` says "align", "ensure", or "update as needed" without specifying what exactly

#### Write `flows.md`

Document the solution's data/control flow as a Mermaid diagram:

```markdown
# Flow Diagram

## <Flow name>

\`\`\`mermaid
graph TD
    A[Step 1] --> B[Step 2]
    B --> C{Decision}
    C -->|Yes| D[Path A]
    C -->|No| E[Path B]
\`\`\`

## Notes

<Any clarifications about the flow>
```

Include as many diagrams as needed to cover the key flows (e.g., request flow, data flow, state transitions).

#### Generate `flows.png` via Excalidraw MCP

Render the flow as a visual diagram using the Excalidraw MCP tools:

- Call `mcp__exca__read_me` to learn the element format
- Call `mcp__exca__create_view` to render the flow diagram (translate the Mermaid logic into Excalidraw elements — boxes, arrows, decision diamonds)
- Call `mcp__exca__export_to_excalidraw` to get a shareable URL
- Take a screenshot of the rendered diagram using Playwright MCP (`browser_navigate` to the URL, then `browser_take_screenshot`)
- Save the screenshot as `flows.png` in the plan folder

If the Excalidraw or Playwright MCP is unavailable, skip `flows.png` and note it in `flows.md` — the Mermaid diagrams are the primary source of truth.

#### Plan folder structure

```
docs/<identifier>/prd-plans/
├── specs.md      # Requirements + design decisions + file plan
├── flows.md      # Mermaid flow diagrams (source of truth)
└── flows.png     # Visual diagram from Excalidraw (best-effort)
```

### Implement

**Pre-read: `reference/stages.md` > Implement and `reference/agents.md` > Implementer**

- Read `specs.md` — each task's `read_first` files, then execute the `action`
- Follow TDD — Red-Green-Refactor cycle:
  - Write a failing test for the first behavior
  - Write minimum code to pass
  - Refactor while green
  - Repeat for each behavior in the acceptance criteria
- Commit after each Green phase
- Follow the execution plan's task order (respect `depends_on`)

**Deviation Rules** (what the Implementer can do without asking):
- **Auto-fix**: bugs discovered during implementation (Rule 1)
- **Auto-add**: missing error handling, validation, or security checks critical to the task (Rule 2)
- **Auto-fix**: blocking issues that prevent the current task from working (Rule 3)
- **STOP and ask**: architectural changes, scope expansion, or design disagreements (Rule 4)
- **Scope boundary**: only fix issues directly caused by current task's changes

**Analysis Paralysis Guard**: if 5+ consecutive Read/Grep/Glob calls without any Write/Edit, the implementer is stuck — stop, document the blocker, and surface it.

### Test

**Pre-read: `reference/stages.md` > Test and `reference/agents.md` > Tester**

- Can start in parallel with Implement once contracts are defined
- Write e2e tests covering the acceptance criteria
- Write edge case and error path tests
- Run all tests and ensure they pass

### Verify

**Pre-read: `reference/stages.md` > Verify, `reference/agents.md` > Verifier, and `reference/verification.md`**

- Run goal-backward verification: start from "what must be TRUE" (the Goal in specs.md), work backwards through artifacts
- Three-level artifact check for every must-have:
  - **Exists** — file/function/endpoint is present
  - **Substantive** — not a stub, placeholder, or TODO
  - **Wired** — connected to the rest of the system (imported, called, routed)
- Scan for anti-patterns: TODO/FIXME in new code, empty catch blocks, log-only error handlers
- Produce verification report:
  - **PASSED** — all must-haves verified at all 3 levels
  - **GAPS_FOUND** — list specific gaps with file:line references → loop back to Implement for fixes
  - **HUMAN_NEEDED** — items that can't be machine-verified (e.g., visual correctness, UX flow)
- If GAPS_FOUND → Implementer fixes gaps → Verifier re-checks (max 2 iterations)

### Review

**Pre-read: `reference/stages.md` > Review and `reference/agents.md` > Reviewer**

- Generate full diff of all changes
- Review against: architecture compliance, naming conventions, security, test coverage, error handling
- Categorize findings: AUTO-FIX / NEEDS-INPUT / INFO
- Auto-fix AUTO-FIX items, ask user about NEEDS-INPUT
- Run linter, type checker, and tests after fixes
- **CHECKPOINT**: Present review summary to user

### Release

**Pre-read: `reference/stages.md` > Release and `reference/agents.md` > Release. Then delegate to `basic-engineering:ship-n-check` via the Skill tool.**

- Delegate to `/basic-engineering:ship-n-check` skill (or project-local `/ship-n-check` if installed standalone)
- This handles: branch, commit, **requirements review (blocking)**, code quality review, push, draft PR, CI/CD, staging, open PR, address reviews
- The ship-n-check skill's Requirements Review spawns a fresh requirements-reviewer subagent that cross-checks the diff against the original requirements — catching under-delivery, over-scope, and gaps before the PR is created
- Update Jira: post PR link as comment, transition to "Done" when merged

## Jira Integration

Use the Atlassian MCP tools throughout:

| Action | Tool | When |
|--------|------|------|
| Read ticket | `getJiraIssue` | Analyze: read full ticket details |
| Get transitions | `getTransitionsForJiraIssue` | Before transitioning status |
| Transition status | `transitionJiraIssue` | Analyze: -> In Progress, Release: -> Done |
| Post comment | `addCommentToJiraIssue` | After each stage with artifact summary |
| Read linked issues | `getJiraIssue` | Analyze: understand dependencies |

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

## Checkpoint Rules

- **ALWAYS** pause after Analyze — requirements must be approved
- **ALWAYS** pause after Design — solution must be approved
- **ALWAYS** pause after Review — for NEEDS-INPUT items
- Implement + Test + Verify flow without human checkpoints (Verify has automated gap-closure loops)
- Release has its own checkpoints via the workflow skill

## Agent Team Rules

### Thin Orchestrator Principle

The main conversation is the orchestrator. It should stay thin — route work to agents, don't do it inline. Each spawned agent gets a **fresh context window**, which prevents quality degradation from accumulated context.

- **Orchestrator budget**: ~15% of context for routing, state tracking, and checkpoints
- **Agent budget**: each agent gets a clean, full context window for its task
- **Never paste large artifacts inline** — write them to files and pass file paths to agents

### Agent Types

- Use `subagent_type=Explore` for codebase research in Analyze and Design
- Use `subagent_type=general-purpose` for implementation, testing, and verification in Implement, Test, and Verify
- Launch Implementer and Tester agents in **parallel** when possible
- Each agent receives only the artifacts from previous stages (via file paths), not the full conversation
- See [reference/agents.md](reference/agents.md) for detailed agent role definitions

## Rules

- **NEVER** skip the Analyze stage — always understand before building
- **NEVER** skip checkpoints — always get user approval at defined points
- **NEVER** implement without a design — even for "simple" changes, at minimum document the approach
- **NEVER** skip TDD in the Implement stage — write tests first
- **NEVER** skip Verify — task completion != goal achievement
- **ALWAYS** post Jira comments after each stage
- **ALWAYS** follow existing codebase patterns found during Analyze/Design
- **ALWAYS** update STATE.md after each stage completion
- If a stage fails or gets stuck, **STOP** and inform the user — don't retry endlessly
- Implementer can auto-fix bugs and blocking issues (deviation rules 1-3) but must STOP for architectural changes (rule 4)
