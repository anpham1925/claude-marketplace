---
name: sdlc-design
description: "Internal stage of the sdlc pipeline — designs a solution with options analysis and plan summary (specs.md + flows.md). Invoke directly only via /basic-engineering:sdlc-design when explicitly requested by name. For general requests like 'design the solution' or 'architect this', use prt:sdlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: opus
---

> **Recommended model: Opus** — Deep reasoning for architecture decisions.

## Agent: Architect

**Mission**: Design a solution that fits the codebase and is implementable.

**Inputs**: Structured Requirements from Analyze
**Outputs**: Solution Design artifact + Plan Summary (specs.md + flows.md) + ADR if significant
**Subagent type**: `Explore` for research, then synthesize

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify Analyze is completed. Load the Structured Requirements. See [shared reference](../sdlc/reference/shared.md) for state.md format.

### Deep-dive the Codebase

- Use the repos identified during Analyze (from the [repo registry](../sdlc/reference/repo-registry.md) routing) — scope exploration to those repos only
- Read the files identified in Analyze within those repos
- Find the closest existing implementation to use as a pattern
- Understand the current architecture of affected modules

### Design the Approach

- Consider 2-3 options (don't just pick the first idea)
- Evaluate against: simplicity, consistency with existing patterns, testability
- Recommend one approach with clear reasoning

### Define Contracts

- Interfaces that new code must implement
- DTOs for new endpoints
- Event schemas for new Kafka events
- Database schema changes (if any)

### Map File Changes

- List every file that needs to be created or modified
- For each file, describe what changes and why
- Follow the project's architecture rules (controllers in apps/, business logic in modules/, etc.)

### Assess Risks

- Breaking changes?
- Migration needed?
- Performance implications?
- Feature flag needed?

### Create ADR if Needed

Significant architectural decisions warrant an ADR.

### Produce Solution Design

```markdown
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

### Update Jira

Post design summary as a comment (see [shared reference](../sdlc/reference/shared.md) for comment format).

### Update State

Update `docs/<identifier>/state.md` — mark Design as completed, record decisions and trade-offs.

### CHECKPOINT

Present design to user for approval before proceeding.

---

## Plan Summary (after Design approval)

After the Design checkpoint is approved, create a plan folder before implementation starts.

**Folder location:** `docs/<identifier>/prd-plans/`

### Write `specs.md`

Summarize all decisions from Analyze and Design:

```markdown
# <Ticket ID>: <Goal (one sentence)>

## Requirements (from Analyze)
- **Goal**: <one sentence>
- **Acceptance criteria**:
  - <criterion 1>
  - <criterion 2>
- **Scope**: <what's in / what's out>
- **Affected modules**: <list>
- **Open questions resolved**: <any questions answered>

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
<Additional context from checkpoints>
```

### Write `flows.md`

Document the solution's data/control flow as Mermaid diagrams:

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
<Clarifications about the flow>
```

Include as many diagrams as needed for key flows (request flow, data flow, state transitions).

### Generate `flows.png` via Excalidraw MCP (best-effort)

- Call `mcp__exca__read_me` to learn the element format
- Call `mcp__exca__create_view` to render the diagram
- Call `mcp__exca__export_to_excalidraw` to get a URL
- Screenshot via Playwright MCP, save as `flows.png`

If Excalidraw or Playwright MCP is unavailable, skip — Mermaid diagrams are the primary source of truth.

### Plan Folder Structure

```
docs/<identifier>/prd-plans/
├── specs.md
├── flows.md
└── flows.png (best-effort)
```

## What Good Design Looks Like

- An Implementer can start coding without asking questions
- File changes are specific and follow project structure rules
- Contracts are defined in TypeScript (not just prose)
- Trade-offs are honest (every option has cons)

## Rules

- **NEVER** design in a vacuum — always read existing code first. Find the closest existing pattern.
- **ALWAYS** present 2-3 options with trade-offs
- **ALWAYS** post a Jira comment after completing design
- **ALWAYS** update `docs/<identifier>/state.md`
- **ALWAYS** checkpoint — present design and wait for user approval
- **ALWAYS** write Plan Summary (specs.md + flows.md) after Design approval
