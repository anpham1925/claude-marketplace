---
paths:
  - "**/*"
---

# Agent Artifact Communication — Files, Not Raw Text

Subagents in this plugin communicate through **artifact files**, not by pasting their output into each other's prompts. An orchestrator (skill) that dispatches a subagent passes **file paths**; the subagent reads its inputs from those paths and writes its output to a new artifact file. This keeps prompts small, makes handoffs resumable after a session dies, and gives every dispatch an auditable trail.

## The two artifact tiers

| Tier | Location | Lifetime | Holds |
|---|---|---|---|
| **Transient agent handoffs** | `.claude/artifacts/<id>/` | Per run; safe to discard | Scout briefs, review findings, investigation reports, routing briefs, CI results — anything one agent produces for the orchestrator or the next agent |
| **Durable pipeline artifacts** | `docs/<id>/` | Committed with the ticket | `state.md`, `prd-plans/*`, `review-feedback.md`, ADRs — the canonical AI-DLC record |

`<id>` resolution order: **ticket ID** (e.g. `PROJ-123`) → **branch name** → a short **session slug**. Use the same `<id>` for every agent in one run so artifacts co-locate.

## Rules

1. **Handoffs are file paths, not content.** When dispatching a subagent, tell it which files to read; never paste a prior agent's full output into the prompt. (Exception: small verbatim constraints that must not be summarized — e.g. `prd-plans/constraints.md` — may still be passed inline by design.)
2. **Every agent writes one primary artifact** to `.claude/artifacts/<id>/<agent>-<role>.md` (e.g. `scout-brief.md`, `code-reviewer-findings.md`, `debugger-report.md`).
3. **Agent returns are a pointer, not a payload.** A subagent returns to the orchestrator only: `status` (COMPLETE | BLOCKED | NEEDS_INPUT), the **artifact path(s)**, and a ≤5-line summary. The file is authoritative.
4. **Read-only agents stay read-only on source.** Agents granted `Write` purely for artifacts must write **only** under `.claude/artifacts/<id>/` — never to source files. (`clerk` is the exception: its artifact is the tracker comment it posts, not a local file.)
5. **Durable beats transient for resumability.** If the output is part of the committed pipeline record (state, specs, review feedback), write it to `docs/<id>/` per the AI-DLC artifact contract instead of (or in addition to) the transient tier.

See `skills/ai-dlc/reference/artifacts.md` for the durable-tier contracts and the Subagent Return Contract.
