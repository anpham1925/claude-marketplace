---
paths:
  - "**/skills/**/SKILL.md"
  - "**/.claude/skills/**/SKILL.md"
---

# Skill Dispatch Pattern — Inline vs Subagent

When authoring or modifying a SKILL.md, decide BEFORE writing the body whether the skill should run inline or dispatch to a Task subagent. Inline-by-default is the common failure mode that has bitten ship-n-check (v6.9.0) and sdlc-breakdown (v6.10.0) — both bloated the parent context until the model hit the 200k window or the user hit a context-tier billing wall.

**The dispatcher pattern is not model-tier-gated.** It applies regardless of which model the parent is running:
- ≤200k tiers (haiku, opus-standard): inline runs hit the wall and the session aborts. Dispatch is the only viable path.
- 1M tiers (opus-1m, sonnet-1m): the wall is softer but real — extra-usage billing kicks in, prompt cache TTL (~5 min) gets evicted, latency grows turn-over-turn, and a session crash mid-flow loses everything because the parent did the work instead of writing artifacts.

The trigger is *bloat*, not *model size*. Author every skill assuming a haiku parent could run it tomorrow.

## Decision Rule

A skill MUST dispatch its core work to a `general-purpose` Task subagent if it does **any** of the following:

| Trigger | Why it bloats the parent |
|---|---|
| Reads 3+ files with substantial content (specs, plans, code modules) | Each file lands verbatim in the parent transcript |
| Calls external APIs that return long payloads (Jira issues, GitHub PRs, Slack threads, Honeycomb queries) | API responses accumulate across the skill |
| Runs multi-step analysis (red-team review, architecture audit, traceability check) | Intermediate reasoning fills the window |
| Is a stage of an orchestrator (ship-*, ai-dlc-*) that may be invoked alongside other stages | Stage transcripts compound across the pipeline |
| Loads on-demand reference docs from `reference/` | Reference content was meant to load lazily, not into the parent |

A skill MAY run inline if **all** of the following hold:
- It performs ≤2 file reads, no external API calls, and no multi-step analysis
- It is a thin orchestrator that only dispatches to other skills/subagents
- It returns a short result (a config value, a routing decision, a prompt template)

When in doubt, dispatch. The cost of a subagent round-trip is small; the cost of blowing the context window is a session abort.

## Required Structure for Dispatcher Skills

A dispatcher SKILL.md has three parts:

1. **Frontmatter + 1-paragraph dispatcher note** explaining that the work runs in a subagent and the parent only handles user-approval checkpoints + side-effecting writes (Jira, git, etc.).
2. **A `## Subagent Dispatch` section** with the verbatim Task() prompt template the parent must use. The template MUST:
   - Specify `subagent_type="general-purpose"` (or another agent if appropriate)
   - List the steps the subagent runs (file reads, analysis, draft output)
   - Forbid side effects the subagent must NOT perform (Jira creation, file writes that the parent should gate, state.md updates)
   - End with a structured `Return ONLY this summary:` block — fixed shape, no transcripts, no diffs, no command output
3. **A `## After Subagent Returns` section** describing what the parent does with the summary: present to user, gate on approval, perform side effects, write state.

See `plugins/engineering-toolkit/skills/sdlc-breakdown/SKILL.md` and `plugins/engineering-toolkit/skills/ship-n-check/SKILL.md` for canonical examples.

## Direct-Invocation Dispatch Template <a id="direct-invocation-dispatch"></a>

For skills that can also be invoked indirectly (e.g., ai-dlc phase skills called by the orchestrator's Agent tool), use the lighter `## Invocation Mode` header pattern instead of the full dispatcher rewrite. The skill stays usable from the orchestrator's subagent context AND avoids inline loading on direct slash-command invocation.

**Required header at the top of the SKILL.md (right after frontmatter):**

```markdown
## Invocation Mode

**Direct invocation** (slash command — `/engineering-toolkit:<this-skill>`): the parent MUST stop here and dispatch via the Task tool, then act on the returned summary. Do NOT execute the steps below inline. Use this prompt template:

> You are running the <X> phase/skill. Read `<absolute-path-to-this-SKILL.md>` and execute the **Steps** section directly, IGNORING the `## Invocation Mode` block. Do NOT perform user-facing checkpoints (`AskUserQuestion`), Jira writes, or `state.md` updates — return them to the parent in the structured summary. Return ONLY:
> - Status: PASS | NEEDS_USER_INPUT | FAIL
> - Outputs produced: <artifact paths or proposed content>
> - Open questions for parent: <list, if any>
> - Recommended next step: <one line>

**Indirect invocation** (called from another agent's Task subagent — e.g. ai-dlc orchestrator passing file paths): skip this `Invocation Mode` block and proceed to **Steps** directly. The orchestrator already isolated you in a subagent; nested dispatch would be redundant.

**Parent-only after-actions** (run only on direct invocation, after the subagent returns):
- <skill-specific user checkpoints, Jira side effects, file writes, state.md updates>
```

The rule is: **the subagent reads, analyzes, drafts; the parent gates on user input and performs side effects.** Indirect callers (orchestrators) handle the gate themselves and pass file paths, so the skill body works for both modes.

Orchestrators that spawn phase subagents via Agent/Task MUST include the explicit instruction "**ignore the `## Invocation Mode` block at the top of the phase SKILL.md and execute the Steps directly**" in their subagent prompts, otherwise the skill will dispatch a second subagent (nested dispatch).

## Single-Stage Invocation Is Supported

The `## Invocation Mode` header preserves three independent invocation paths — do NOT couple the dispatcher pattern to "orchestrator-only" in the skill body:

1. **Direct single-skill invocation** (`/engineering-toolkit:ai-dlc-inception PROJ-123`): user invokes one phase skill directly. Parent reads the SKILL.md, hits Invocation Mode, dispatches Task subagent, then handles user-facing checkpoints and side effects. No orchestrator involved.
2. **Orchestrator full-pipeline** (`/engineering-toolkit:ai-dlc PROJ-123`): orchestrator iterates phases, spawning one subagent per phase with the skip-instruction. Each phase subagent executes Steps directly.
3. **Orchestrator single-phase routing** (`/engineering-toolkit:ai-dlc inception PROJ-123`): orchestrator parses the phase name from `$ARGUMENTS`, spawns ONE phase subagent with the skip-instruction, then stops. This is the existing arg-parsing in ai-dlc/SKILL.md.

When authoring a phase skill, the Steps section MUST be self-sufficient (it can be run by either a parent-spawned subagent OR an orchestrator-spawned subagent — both call into the same Steps). Don't add code paths that assume "the orchestrator already did X."

## Anti-patterns

- **"The skill loads everything for context, then acts"** — that's the inline failure mode. The subagent loads; the parent acts on the summary.
- **Subagent that performs side effects** — Jira creation, git commits, breakdown.md writes, state.md updates all belong in the parent, after the user-approval checkpoint. The subagent only proposes.
- **Returning the full transcript** — defeats the purpose. Enforce a fixed `Return ONLY this summary:` shape.
- **Recommending `model: sonnet` or `model: opus` for a thin dispatcher** — the parent is now mostly orchestration; `model: haiku` is usually right. The subagent picks its own model based on the task.
- **Calling `Skill(/engineering-toolkit:*)` from another skill's body** — Skill calls run inline in the caller's context. Dispatch via Task subagent that itself invokes the skill internally.

## Version Bump

Every plugin modification requires a version bump in **both**:
- `plugins/<name>/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
