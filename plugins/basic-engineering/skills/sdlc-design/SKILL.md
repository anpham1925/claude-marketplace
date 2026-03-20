---
name: sdlc-design
description: "TRIGGER when: user says 'design a solution', 'architect this', 'create the design', 'write the plan', or references the design/planning stage. DO NOT trigger for: full SDLC pipeline, analyze, implement, or other stages."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Architecture decisions require deep reasoning.

## Purpose

Design a solution that fits the codebase and is implementable. Includes the revision loop (Plan-Checker) and plan creation (specs.md, flows.md). This is the second stage of the SDLC pipeline but can run standalone.

## Standalone Invocation

```
/basic-engineering:sdlc-design PRT-123
```

If no ticket ID is provided, derive from the current branch name or ask the user.

## State Tracking

Read `docs/<identifier>/STATE.md` at start (if it exists). Update Current stage, Status, Artifacts, and Notes when done. If standalone (no orchestrator), derive identifier from branch name.

## Agent: Architect

**Mission**: Design a solution that fits the codebase and is implementable.
**Model**: opus

**Subagent type**: `Explore` for research, then synthesize

### Inputs
- Structured Requirements from Analyst

### Outputs
- Solution Design artifact (+ ADR if significant decision)

### Responsibilities
- Analyze codebase architecture and find similar implementations
- Design file structure (new files + modifications)
- Define interfaces and contracts between components
- Present 2-3 approach options with trade-offs, recommend one
- Create ADR for significant architectural decisions
- Ensure design follows existing patterns and conventions

## Agent: Plan-Checker

**Mission**: Validate design quality before execution begins — catch issues when they're cheap to fix.
**Model**: sonnet

**Subagent type**: `general-purpose`

### Inputs
- Solution Design from Architect + Structured Requirements from Analyst

### Outputs
- Validation result (PASS or list of issues)

### Validation Checklist
- [ ] Every acceptance criterion → file change mapping exists
- [ ] Interfaces are TypeScript, not prose
- [ ] New files have consumers
- [ ] No contradictions with existing patterns
- [ ] Risk mitigations are concrete, not vague

**On failure**: return specific issues to Architect for revision. Max 3 revision iterations.

## Steps

- **Deep-dive the codebase**
  - Read the files identified in Analyze
  - Find the closest existing implementation to use as a pattern
  - Understand the current architecture of affected modules

- **Design the approach**
  - Consider 2-3 options (don't just pick the first idea)
  - Evaluate against: simplicity, consistency with existing patterns, testability
  - Recommend one approach with clear reasoning

- **Define contracts**
  - Interfaces that new code must implement
  - DTOs for new endpoints
  - Event schemas for new events
  - Database schema changes (if any)

- **Map file changes**
  - List every file that needs to be created or modified
  - For each file, describe what changes and why
  - Follow the project's architecture rules (controllers in apps/, business logic in modules/, etc.)

- **Assess risks**
  - Breaking changes?
  - Migration needed?
  - Performance implications?
  - Feature flag needed?

- **Create ADR if needed**
  - Significant architectural decisions warrant an ADR
  - Use the ADR template from engineering-foundations

- **Produce the Solution Design**
  - Use the template below
  - Include enough detail for the Implementer to start without guessing

- **Revision Loop** — Spawn a Plan-Checker agent to validate the design:
  - Does every acceptance criterion map to at least one file change?
  - Are interfaces defined in TypeScript (not just prose)?
  - Does every new file have a clear purpose and consumer?
  - Are there contradictions between the design and existing code patterns?
  - If issues found → Architect revises → Plan-Checker re-checks
  - **Max 3 iterations** — if still failing after 3, surface the issues at the checkpoint

- **Post to Jira** — Comment with design summary

- **CHECKPOINT** — Present to user and wait for approval (include any unresolved Plan-Checker issues)

## Plan Creation (Orchestrator Step)

After the Design checkpoint is approved, create an execution plan that serves as the **direct prompt for the Implementer agent**. Plans are prompts — the plan IS the execution instruction, not a document that becomes one.

**Folder location:** `docs/<identifier>/prd-plans/`
- Use the ticket number if available (e.g., `docs/PRT-123/prd-plans/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/prd-plans/`)

Create the directory if it doesn't exist.

### Write `specs.md`

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

### Write `flows.md`

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

### Generate `flows.png` via Excalidraw MCP

Render the flow as a visual diagram using the Excalidraw MCP tools:

- Call `mcp__exca__read_me` to learn the element format
- Call `mcp__exca__create_view` to render the flow diagram (translate the Mermaid logic into Excalidraw elements — boxes, arrows, decision diamonds)
- Call `mcp__exca__export_to_excalidraw` to get a shareable URL
- Take a screenshot of the rendered diagram using Playwright MCP (`browser_navigate` to the URL, then `browser_take_screenshot`)
- Save the screenshot as `flows.png` in the plan folder

If the Excalidraw or Playwright MCP is unavailable, skip `flows.png` and note it in `flows.md` — the Mermaid diagrams are the primary source of truth.

### Plan folder structure

```
docs/<identifier>/prd-plans/
├── specs.md      # Requirements + design decisions + file plan
├── flows.md      # Mermaid flow diagrams (source of truth)
└── flows.png     # Visual diagram from Excalidraw (best-effort)
```

## Jira Comment Format

Post a comment to Jira after completion:

```
**[SDLC: Design] — Completed**

{Brief summary of what was produced}

Key decisions:
- {Decision 1}
- {Decision 2}

Artifacts:
- {Link or description of output}
```

## Solution Design Template

```
## Approach
{High-level description of the chosen approach}

### Options Considered
| Option | Pros | Cons |
|--------|------|------|
| A: {name} | ... | ... |
| B: {name} | ... | ... |
| **C: {recommended}** | ... | ... |

## File Changes

### New Files
- `path/to/new-file.ts` — {purpose}

### Modified Files
- `path/to/existing.ts` — {what changes and why}

## Interfaces / Contracts
```typescript
// Key interfaces the implementation must satisfy
```

## Data Flow
{Text description or ASCII diagram of how data flows}

## Dependencies
- {External service or module dependency}

## Risks
- {Risk 1} — {mitigation}
```

## What Good Design Looks Like

- An Implementer can start coding without asking questions
- File changes are specific and follow project structure rules
- Contracts are defined in TypeScript (not just prose)
- Trade-offs are honest (every option has cons)
- Every acceptance criterion has a corresponding file change (validated by Plan-Checker)

## Rules

- **NEVER** design without reading the codebase first
- **NEVER** skip the Plan-Checker revision loop
- **ALWAYS** present 2-3 options with trade-offs
- **ALWAYS** define contracts in TypeScript, not prose
- **ALWAYS** post a Jira comment after completion
- **ALWAYS** update STATE.md after completion
- **ALWAYS** present design at the CHECKPOINT and wait for approval
- Enforce the max 3 iteration limit on the revision loop — surface unresolved issues at the checkpoint
