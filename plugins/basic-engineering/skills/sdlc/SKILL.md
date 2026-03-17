---
name: sdlc
description: Full SDLC orchestration with 6 composable stages — analyze, design, implement, test, review, release. Uses agent teams with Jira integration and human checkpoints. Use when starting a ticket end-to-end, analyzing requirements, designing solutions, implementing features, or running the full development lifecycle.
argument-hint: '[stage] [TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — This skill involves deep reasoning, architecture decisions, or code review.

## Quick Navigation

| If you need to...                        | Read                                              |
| ---------------------------------------- | ------------------------------------------------- |
| Understand agent roles and handoffs      | [reference/agents.md](reference/agents.md)        |
| See detailed stage instructions          | [reference/stages.md](reference/stages.md)        |
| Run the full pipeline                    | Full Pipeline below                               |

## Invocation

```
/basic-engineering:sdlc PRT-123              # Full pipeline from analyze to release
/basic-engineering:sdlc analyze PRT-123      # Analyze only — gather requirements
/basic-engineering:sdlc design               # Design — solution design (uses Analyze output)
/basic-engineering:sdlc implement            # Implement — TDD implementation
/basic-engineering:sdlc test                 # Test — e2e and integration tests
/basic-engineering:sdlc review               # Review — code review
/basic-engineering:sdlc release              # Release — PR, CI/CD, staging, deploy
```

Stages are composable. Run individually or let the full pipeline run with checkpoints.

## Stage Overview

```
[Analyze] --> checkpoint --> [Design] --> checkpoint --> [Plan Summary] --> [Implement]
                                                                     |
                                                               [Test] (parallel)
                                                                  |
                                                           [Review] --> checkpoint --> [Release]
```

| Stage | Agent | Input | Output | Jira Transition |
|-------|-------|-------|--------|-----------------|
| Analyze | Analyst | Jira ticket ID | Structured requirements | To Do -> In Progress |
| Design | Architect | Requirements | Solution design + ADR | — |
| Implement | Implementer | Solution design | Code + unit tests (TDD) | — |
| Test | Tester | Solution design + code | E2e tests | — |
| Review | Reviewer | Code changes | Review feedback | — |
| Release | Release | Approved code | Merged PR | In Progress -> Done |

## Parsing Arguments

1. If `$ARGUMENTS` contains a stage name (`analyze`, `design`, `implement`, `test`, `review`, `release`), run that stage only
2. If `$ARGUMENTS` contains a ticket ID (matches pattern like `PRT-123`, `PSR-456`, `MOX-789`), use it as the Jira ticket
3. If no stage specified, run the **Full Pipeline**
4. If no ticket ID and stage requires one, **ask the user**

## Pre-Stage Checklist (MANDATORY)

**Before executing ANY stage, you MUST complete this checklist:**

- [ ] **Read `reference/stages.md`** — find the section for the stage you are about to execute, read the full detailed instructions
- [ ] **Read `reference/agents.md`** — understand the agent role, its responsibilities, and output templates for this stage
- [ ] **If the stage delegates to another skill** (e.g., Release → `basic-engineering:ship-n-check`), **invoke it via the Skill tool** — do NOT freestyle

Skipping this checklist is a rule violation. Do not approximate or improvise stage behavior from the summary below — the summaries are navigation aids, not the full instructions.

---

## Full Pipeline

Run all 6 stages with human checkpoints between major phases.

### Analyze

**Pre-read: `reference/stages.md` > Analyze and `reference/agents.md` > Analyst**

1. Read the Jira ticket using MCP (`getJiraIssue`)
2. Extract: summary, description, acceptance criteria, linked issues, comments
3. Research the codebase — find affected modules, existing patterns, related code
4. Produce **Structured Requirements** artifact:
   - Goal (one sentence)
   - Acceptance criteria (bullet list)
   - Scope boundaries (what's in / what's out)
   - Affected modules and files
   - Open questions (if any)
5. Update Jira: transition to "In Progress", post requirements summary as comment
6. **CHECKPOINT**: Present requirements to user for approval before proceeding

### Design

**Pre-read: `reference/stages.md` > Design and `reference/agents.md` > Architect**

7. Launch Architect agent with the approved requirements
8. Analyze existing codebase patterns — find similar implementations to follow
9. Design the solution:
   - Affected files (new + modified)
   - Interfaces and contracts
   - Data flow diagram (text)
   - Approach with trade-offs (2-3 options, recommend one)
10. If significant architectural decision, create an ADR
11. Produce **Solution Design** artifact
12. **CHECKPOINT**: Present design to user for approval before proceeding

### Plan Summary (between Design and Implement)

After the Design checkpoint is approved, create a plan folder with specs and flow diagrams before starting implementation.

**Folder location:** `docs/<identifier>/prd-plans/`
- Use the ticket number if available (e.g., `docs/PRT-123/prd-plans/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/prd-plans/`)

Create the directory if it doesn't exist.

#### 1. Write `specs.md`

Summarize all decisions and plans from Analyze and Design:

```markdown
# <Ticket ID or branch name>: <Goal (one sentence)>

## Requirements (from Analyze)

- **Goal**: <one sentence>
- **Acceptance criteria**:
  - <criterion 1>
  - <criterion 2>
- **Scope**: <what's in / what's out>
- **Affected modules**: <list of modules and key files>
- **Open questions resolved**: <any questions that were answered during analysis>

## Design Decisions (from Design)

- **Approach chosen**: <recommended option and why>
- **Alternatives considered**:
  - <option A — why rejected>
  - <option B — why rejected>
- **Key interfaces/contracts**: <brief description>
- **Data flow**: <brief description>
- **ADR**: <link or "N/A">

## File Plan

| Action | File |
|--------|------|
| Create | <new file path> |
| Modify | <existing file path> |

## Notes

<Any additional context, constraints, or user decisions from checkpoints>
```

#### 2. Write `flows.md`

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

#### 3. Generate `flows.png` via Excalidraw MCP

Render the flow as a visual diagram using the Excalidraw MCP tools:

1. Call `mcp__exca__read_me` to learn the element format
2. Call `mcp__exca__create_view` to render the flow diagram (translate the Mermaid logic into Excalidraw elements — boxes, arrows, decision diamonds)
3. Call `mcp__exca__export_to_excalidraw` to get a shareable URL
4. Take a screenshot of the rendered diagram using Playwright MCP (`browser_navigate` to the URL, then `browser_take_screenshot`)
5. Save the screenshot as `flows.png` in the plan folder

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

13. Follow TDD — Red-Green-Refactor cycle:
    a. Write a failing test for the first behavior
    b. Write minimum code to pass
    c. Refactor while green
    d. Repeat for each behavior in the acceptance criteria
14. Commit after each Green phase
15. Follow the solution design's file structure and interfaces

### Test

**Pre-read: `reference/stages.md` > Test and `reference/agents.md` > Tester**

16. Can start in parallel with Implement once contracts are defined
17. Write e2e tests covering the acceptance criteria
18. Write edge case and error path tests
19. Run all tests and ensure they pass

### Review

**Pre-read: `reference/stages.md` > Review and `reference/agents.md` > Reviewer**

20. Generate full diff of all changes
21. Review against: architecture compliance, naming conventions, security, test coverage, error handling
22. Categorize findings: AUTO-FIX / NEEDS-INPUT / INFO
23. Auto-fix AUTO-FIX items, ask user about NEEDS-INPUT
24. Run linter, type checker, and tests after fixes
25. **CHECKPOINT**: Present review summary to user

### Release

**Pre-read: `reference/stages.md` > Release and `reference/agents.md` > Release. Then delegate to `basic-engineering:ship-n-check` via the Skill tool.**

26. Delegate to `/basic-engineering:ship-n-check` skill (or project-local `/ship-n-check` if installed standalone)
27. This handles: branch, commit, **requirements review (blocking)**, code quality review, push, draft PR, CI/CD, staging, open PR, address reviews
28. The ship-n-check skill's Requirements Review spawns a fresh requirements-reviewer subagent that cross-checks the diff against the original requirements — catching under-delivery, over-scope, and gaps before the PR is created
29. Update Jira: post PR link as comment, transition to "Done" when merged

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
**[SDLC Stage N: {Stage Name}] — Completed**

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
- Implement + Test flow without checkpoints between them
- Release has its own checkpoints via the workflow skill

## Agent Team Rules

- Use `subagent_type=Explore` for codebase research in Analyze and Design
- Use `subagent_type=general-purpose` for implementation and testing in Implement and Test
- Launch Implementer and Tester agents in **parallel** when possible
- Each agent receives only the artifacts from previous stages, not the full conversation
- See [reference/agents.md](reference/agents.md) for detailed agent role definitions

## Rules

- **NEVER** skip the Analyze stage — always understand before building
- **NEVER** skip checkpoints — always get user approval at defined points
- **NEVER** implement without a design — even for "simple" changes, at minimum document the approach
- **NEVER** skip TDD in the Implement stage — write tests first
- **ALWAYS** post Jira comments after each stage
- **ALWAYS** follow existing codebase patterns found during Analyze/Design
- If a stage fails or gets stuck, **STOP** and inform the user — don't retry endlessly
