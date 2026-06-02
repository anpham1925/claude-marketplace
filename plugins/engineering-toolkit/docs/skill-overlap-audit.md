# engineering-toolkit — Skill & Agent Overlap Audit

**Date:** 2026-06-02 · **Scope:** `plugins/engineering-toolkit` (36 skills, 10 agents after this change) · **Ported from:** hipages `prt` plugin (PRs #121, #123, #124)

This audit clusters skills/agents that do similar things, rates overlap severity, and records the consolidation action taken. It accompanies three cross-cutting changes adopted from the upstream `prt` plugin: all skills/agents run on `model: opus`; subagents communicate via artifact files under `.claude/artifacts/<id>/` (see `rules/agent-artifacts.md`); CI/deploy waits are backgrounded commands rather than poll loops (see `skills/ship-n-check/reference/shared.md`).

## Method

- Built the inbound-reference map by grepping every skill/agent name across `skills/`, `agents/`, `hooks/`, and the manifests.
- Wired-agent map (who dispatches whom): `clerk` ← ai-dlc skills; `code-reviewer` ← ai-dlc-verify, ship-pr-review; `debugger` ← investigate; `scout` ← investigate, ai-dlc-inception; `steward` ← ship-pr-review; `ci-watcher` ← ship-cicd.
- **Previously-unwired agents** (`inspector`, `surveyor`, `security-reviewer`, `requirements-reviewer`) are distinct capabilities, not duplicates — so they were **wired in**, not deleted.
- Hooks reference no skills/agents by name → consolidation is safe from a hook standpoint. The manifest does not enumerate skills/agents (only a description with counts).
- **Difference from upstream `prt`:** this plugin has no `fixer` agent and no hipages-specific `add-job-posting-partner` skill, so those clusters/wirings are omitted; the `investigate` "Fix it now" path proceeds via `ai-dlc-construct` (in pipeline) or directly, rather than dispatching a fixer.

## Cluster findings & actions

| # | Cluster | Severity | Genuine duplication | Action taken |
|---|---------|----------|---------------------|--------------|
| 1 | `investigate` ↔ `debugger` | Med | Both speak of "root cause"; but investigate *orchestrates* and debugger *hypothesis-tests (no fix)* | Kept both. Clarified boundaries; investigate now hands the debugger its scope via the `scout-brief.md` artifact and reads back `debugger-report.md` |
| 2 | `ship-cicd` ↔ `ci-watcher` | **High** | Job classification, fix-and-retry loop, infra-error list duplicated in both | **De-duplicated.** Procedure lives canonically in `agents/ci-watcher.md`; `ship-cicd` reduced to an orchestration shell that backgrounds the watch and dispatches the agent on failure, reading `.claude/artifacts/<id>/ci-watcher-results.md` |
| 3 | `ship-pr-review` ↔ `steward` | Med | Both categorise PR feedback | Kept both; added artifact-path handoff (`steward-report.md`) |
| 4 | `context-budget` ↔ `strategic-compaction` ↔ `handoff` | **High** | strategic-compaction's "save state → compact" is a subset of handoff's discipline | **Merged & deleted.** `strategic-compaction` folded into `handoff` ("Strategic context compaction" section) and **removed**. `context-budget` kept (diagnostic, distinct). Skills 37 → 36 |
| 5 | `continuous-learning` ↔ `review-learning` | Med | Both end in "improve rules" | Kept both; **cross-linked**. Instincts (per-session) vs durable rules (cross-ticket review findings) |
| 6 | `mode-dev` / `mode-research` / `mode-review` | Med | Look like pipeline stages | Kept all; added "behavioural overlay, **not** a pipeline stage" notes pointing at `ai-dlc-construct` / `ai-dlc-discovery`+scout / `ai-dlc-verify` |
| 7 | `delivery-lead` ↔ `ai-dlc` | **High** | Two front-ends to the lifecycle | Kept both; **formalised delegation** — delivery-lead owns relationship/context/memory and hands technical phases to `/engineering-toolkit:ai-dlc`; must not duplicate phase logic |
| 8 | `scout` ↔ `surveyor` ↔ `mode-research` ↔ `ai-dlc-discovery` | Med | Appear to overlap on "exploration" | Kept all; **layered & wired** — surveyor (repo routing) → scout (file discovery) → discovery (problem reframing). `surveyor` wired into ai-dlc-inception's repo-routing step |
| 9 | `sdlc-breakdown` ↔ `create-user-story` ↔ `ai-dlc-inception` | Med | All touch tickets | Kept all; documented the flow: create-user-story (pre) → inception (understand) → sdlc-breakdown (split after design) |
| 10 | `engineering-foundations` ↔ `ai-dlc-domain-design` ↔ `ubiquitous-language` | Low | DDD concepts restated | Kept all; clarified chain — foundations = concept source, domain-design = apply, ubiquitous-language = vocabulary, framework-stack plugins = code |
| 11 | `mode-review` ↔ `ai-dlc-verify` ↔ `ship-quality` ↔ reviewer agents | **High** | Each carried its own review checklist | **Canonicalised** one checklist at `skills/engineering-foundations/reference/code-review.md`; all surfaces reference it. **Wired `requirements-reviewer`** (ship-quality + ai-dlc-verify) and **`security-reviewer`** (ai-dlc-verify) as independent review lenses |

## Net roster change

- **Skills:** 37 → **36** (deleted `strategic-compaction`, absorbed into `handoff`).
- **Agents:** **10 kept.** The 4 previously-unwired agents (`inspector`, `surveyor`, `security-reviewer`, `requirements-reviewer`) are now dispatched by at least one skill.
- **No orchestrator or pipeline-stage skills were merged** — the ai-dlc and ship-n-check decompositions are intentional, not redundant.

## Cross-cutting changes shipped alongside

- **Model:** every skill (already on opus) and every agent set to `model: opus` (`ci-watcher`, `clerk`, `requirements-reviewer` were the remaining non-opus agents).
- **Comms:** subagents write to `.claude/artifacts/<id>/` and return a pointer (status + path + ≤5-line summary); read-only agents got a `Write` tool scoped to that directory. New `rules/agent-artifacts.md` documents the convention; `skills/ai-dlc/reference/artifacts.md` gained the transient-vs-durable tier table.
- **Backgrounded waits:** CI/CD and staging waits run as backgrounded `gh run watch` / `kubectl wait` at the orchestrator level (re-invoked on exit), never sleep-poll loops or blocked subagents.
- **Evidence hook:** new `hooks/scripts/evidence-based.sh` injects the evidence-based rule on every prompt, companion to `skill-first.sh`.
