---
name: improve-codebase-architecture
description: "Explore a codebase to surface architectural friction, identify shallow modules that could be deepened, and produce an opinionated refactor RFC as a Jira ticket. Uses parallel sub-agents to design radically different interface options, then recommends one. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, make a codebase more testable or AI-navigable, or mentions 'deep modules', 'shallow modules', 'refactor plan', or 'architecture review'."
argument-hint: '[module-path | repo-root | "focus-hint"]'
model: opus
---

> **Recommended model: Opus** — Architectural judgement and parallel interface design benefit from deep reasoning.

## Agent: Architect-Reviewer

**Mission**: Read a codebase like a newcomer would, surface architectural friction, discover opportunities for deepening shallow modules, design multiple candidate interfaces in parallel, and produce a refactor RFC as a Jira ticket.

**Inputs**: A scope hint (optional path, module, or free-form focus area), access to the repo
**Outputs**: A Jira ticket containing the refactor RFC; summary printed inline

**Definition of Done**:
- At least 3 deepening candidates surfaced, each with coupling analysis and dependency category
- User picks one candidate (or user declines — valid outcome)
- Problem space framed before interface design — constraints, dependencies, illustrative sketch
- 3+ radically different interface designs produced via parallel sub-agents
- Opinionated recommendation (or hybrid) presented with reasoning
- Jira ticket created with durable-language RFC; URL printed

## Iron Law

**This skill never modifies production code.** It produces a ticket — the actual refactor runs through `ai-dlc` once the RFC is approved. Exploration and interface sketching are read-only.

## Why This Skill Exists

Our `ai-dlc-logical-design` picks one pattern and runs with it. That's correct inside an active pipeline where speed matters. Outside that pipeline — periodic architecture reviews, onboarding audits, pre-refactor planning — we need a different cadence: slower, adversarial, multi-option. This skill fills that gap.

A **deep module** (Ousterhout) has a small interface and a large implementation. Deep modules are more testable, more AI-navigable, and let you test at the boundary instead of inside. Shallow modules — where the interface is nearly as complex as the implementation — are tax without benefit. See `engineering-foundations/reference/deep-modules.md` for the underlying framing.

## Steps

### 1. Scope the exploration

If the user passed an argument, use it as the entry point:
- Path (e.g. `src/checkout/`) — explore that subtree
- "focus-hint" (e.g. "the notification system") — search for relevant modules first
- No argument — ask which area to review, then proceed

Do NOT boil the ocean. Pick one cohesive area; if the user wants a broader sweep, invoke the skill again.

### 2. Explore organically (not by checklist)

Spawn an `Explore` subagent with the scope. Prompt it to navigate the codebase *as a newcomer would* and note **where it experiences friction**. The friction itself is the signal. Look for:

- Places where understanding one concept requires bouncing between many small files
- Modules so shallow that the interface is nearly as complex as the implementation
- Pure functions extracted *only for testability* where real bugs hide in how they're called
- Tightly-coupled module clusters with integration risk in the seams
- Untested or hard-to-test areas

Do NOT enforce rigid heuristics — the subagent reports friction, not a score.

### 3. Present candidates to user

Present a numbered list of deepening opportunities. For each:

- **Cluster**: which modules/concepts are involved (by responsibility, not by path — see durable language rule)
- **Why they're coupled**: shared types, call patterns, co-ownership of a concept
- **Dependency category**: see `REFERENCE.md`
- **Test impact**: what existing tests would be replaced by boundary tests

Do NOT propose interfaces yet. Ask: "Which of these would you like to explore?"

If the user picks none, that's a valid outcome — offer to save the candidate list as a backlog document and exit.

### 4. User picks a candidate

### 5. Frame the problem space

Before spawning design sub-agents, write a user-facing framing of the chosen candidate:

- Constraints any new interface must satisfy (from existing callers, NFRs, dependencies)
- Dependencies it would rely on (classified into the four categories)
- A rough illustrative code sketch to ground the constraints — **NOT a proposal**, just a way to make the constraints concrete

Show this to the user, then proceed immediately to §6. The user reads and thinks while sub-agents run in parallel. Don't wait for the user here.

### 6. Design multiple interfaces in parallel

Spawn 3+ sub-agents **in a single message** using the Agent tool (subagent_type: `general-purpose`). Each must produce a **radically different** interface for the deepened module.

Give each sub-agent its own technical brief (file paths are fine here — these briefs are ephemeral and won't be persisted in the RFC). Assign each agent a different design constraint:

- **Agent 1 — Minimal**: "Minimize the interface — aim for 1-3 entry points max. Hide as much as possible."
- **Agent 2 — Flexible**: "Maximize flexibility — support many use cases and extension points. Favor composability."
- **Agent 3 — Common-case**: "Optimize for the most common caller. Make the default case trivial, advanced cases possible."
- **Agent 4 (if cross-boundary deps exist) — Ports & Adapters**: "Design around the ports & adapters pattern. Production adapter + in-memory test adapter."

Each sub-agent outputs:
1. Interface signature (types, methods, params)
2. Usage example showing how callers use it
3. What complexity it hides internally
4. Dependency strategy (how deps are handled — see `REFERENCE.md`)
5. Trade-offs (where this design is strong, where it's weak)

### 7. Compare designs and recommend

Present designs sequentially, then compare them in prose (2-3 paragraphs). Call out:
- Which trade-offs are cheap vs. expensive in this codebase
- Where designs diverge on dependency strategy
- Where one design's strength hides a weakness (e.g. "flexible" often means "hard to debug")

**Then give your own opinionated recommendation.** Options:
- Pick one design outright with reasoning
- Propose a hybrid that combines specific elements (e.g. "minimal surface from Agent 1 + port pattern from Agent 4")

Be specific. The user wants a strong read, not a menu reprint.

### 8. User picks (or accepts recommendation)

### 9. Create the Jira ticket

Use Jira MCP tooling (`createJiraIssue`) to file a refactor RFC. Use the template in `REFERENCE.md`.

**Durable language rule** (matches the `investigate`/`ai-dlc-construct` convention):
- Describe modules by **responsibility and contract**, not by file path
- A refactor RFC often sits in the backlog for weeks — file:line references rot
- The only exception: include a short "Starting points" section with file paths as implementation hints, clearly marked as ephemeral

Do NOT ask the user to review the ticket body before filing — post it and share the URL. If the user wants changes, they can edit directly in Jira.

### 10. Print summary

After filing, print:
- Ticket URL
- One-line summary of the chosen deepening
- The key interface decision (one line)
- Estimated scope category: **Small** (1-2 days), **Medium** (1 week), **Large** (multi-sprint)

## Integration with ai-dlc

- This skill produces a ticket. The ticket flows into `ai-dlc` via the normal pipeline: Plan → Inception → (Domain Design, if new concepts) → Logical Design → Red Team → Construct.
- In `ai-dlc-logical-design`, the RFC's chosen interface becomes the starting point — Logical Design may still need to elaborate (ADRs, flows), but the interface choice is pre-made.
- `ai-dlc-red-team` attacks the chosen design before Construct runs — the RFC is not exempt from that gate.

## Rules

- **NEVER** modify code during this skill — exploration and design only
- **NEVER** propose interfaces before presenting candidates and getting user pick
- **NEVER** spawn design sub-agents sequentially when 3+ are needed — always parallel in a single message
- **NEVER** present designs without an opinionated recommendation — menus without a strong read are unhelpful
- **ALWAYS** frame the problem space for the user before spawning sub-agents (§5) — they need it to evaluate the designs
- **ALWAYS** use durable language in the Jira ticket — describe contracts, not file paths
- **ALWAYS** apply "replace, don't layer" to the testing strategy — deepening a module should delete the old shallow-unit tests, not layer boundary tests on top of them
- **ALWAYS** include a dependency category for every candidate and every design
- If no candidate is worth pursuing, say so and exit — padded architecture reviews are worse than none
