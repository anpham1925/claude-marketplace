---
name: review-learning
description: Analyze review feedback logs across tickets for repeated patterns, then suggest and optionally apply rule/skill/agent improvements. Use when the user wants to learn from past review mistakes, identify recurring issues across PRs, or improve coding rules based on historical feedback. Also auto-triggered by ai-dlc-release when feedback exists across 3+ tickets. Triggers for "learn from reviews", "what mistakes do we keep making", "improve our rules", "analyze review patterns", "recurring review issues".
argument-hint: '[optional: focus area like "naming", "imports", "tests"]'
model: sonnet
---

Analyze review feedback across tickets and turn repeated patterns into durable improvements (rules, skills, agents, lint config).

## Invocation Mode

Follows the [skill-dispatch-pattern rule](../../rules/skill-dispatch-pattern.md#direct-invocation-dispatch).

**Direct invocation** (or auto-triggered by ai-dlc-release when 3+ tickets have feedback): the parent MUST stop here and dispatch via the Task tool. Do NOT execute the steps below inline — globbing `docs/**/review-feedback.md` and reading every entry across many tickets will fill the parent context with raw feedback before any synthesis happens.

Subagent prompt:

> You are the review-learning subagent. Read `<absolute-path-to-this-SKILL.md>` (skip the Invocation Mode block). Execute steps 1–7 (Read Feedback Logs, Parse, Categorize, Filter Already-Addressed, Detect Repeats, Assess Severity, Generate Report). Do NOT execute step 8 (Apply Improvements), step 9 (Mark Items as Addressed), or step 10 (Mark Analysis Complete). Return ONLY:
> - Tickets analyzed: <count>
> - Patterns found: <list with counts + severity>
> - Recommended actions: <prioritized list — for each, the proposed file edit + rationale>
> - One-off issues skipped: <count>
> - Full Report markdown: <the synthesized "Review Learning Analysis" report>

**Parent-only after-actions**:
- Present the report and recommended actions to the user
- For each recommended action, `AskUserQuestion` to approve/skip/modify before applying any rule/skill/agent edit
- Apply approved edits via Edit on rule/skill/agent files (step 8)
- Mark items as addressed in the source `review-feedback.md` files (step 9 — append-only, never overwrite)
- Write the analysis report (step 10)

## Feedback File Location

Review feedback lives in the repo under `docs/<identifier>/review-feedback.md` — one file per ticket/branch. To collect feedback across all tickets, glob `docs/**/review-feedback.md`.

## Steps

### 1. Read the Feedback Logs

Glob `docs/**/review-feedback.md` to find all feedback files across tickets. Read each file and concatenate the entries. If no files are found, inform the user:

> No review feedback has been collected yet. Feedback is automatically appended during `ai-dlc-verify` (local review) and `ship-pr-review` (PR review). Run a full pipeline first.

### 2. Parse Entries

Each entry starts with `---` followed by `## [date] TICKET — source: ...`. Extract:
- Date
- Ticket ID
- Source (verify, pr-review, ci-fix, self-review, etc.)
- Issues by category (AUTO-FIX, NEEDS-INPUT, INFO)

### 3. Categorize Issues

Group all issues by type:
- **naming** — variable, function, class, file naming
- **imports** — circular deps, wrong aliases, missing imports
- **architecture** — wrong layer, module boundary violation
- **testing** — missing coverage, hardcoded dates, wrong mocking
- **error-handling** — wrong error types, missing domain errors
- **security** — injection, validation, exposed secrets
- **logging** — wrong format, missing context
- **domain** — wrong domain terms, model mismatch
- **lint** — formatting, style issues
- **scope** — unnecessary changes beyond what was requested
- **other** — anything that doesn't fit above

### 4. Filter Already-Addressed Items

Skip any item that already has a `→ **Rule created**` or `→ **Declined**` annotation — these were addressed in a previous analysis. Focus only on unaddressed items (`- [ ]` without any rule annotation).

### 5. Detect Repeats

Find **unaddressed** issues that appear **2+ times across different entries** (different tickets or dates). Same-ticket duplicates don't count — we want cross-ticket patterns.

### 6. Assess Severity

Rank repeated issues by:
- **Frequency** — how many times across how many tickets
- **Impact** — AUTO-FIX (low) < INFO (medium) < NEEDS-INPUT (high)
- **Source** — pr-review issues (caught by humans/bots) are higher signal than self-review

### 7. Generate Report

```markdown
# Review Learning Report — [date]

## Repeated Patterns Found

### Pattern 1: [Issue Type] — seen N times across M tickets
- **First seen**: [date] [ticket] — source: [source]
- **Last seen**: [date] [ticket] — source: [source]
- **Examples**: [brief list of occurrences with file:line]
- **Root cause**: [why this keeps happening — missing rule? ambiguous convention? skill gap?]
- **Suggested fix**: [concrete action]
- **Where to apply**: [specific file path]

### Pattern 2: ...

## One-Off Issues (no action needed)
- [list of issues that appeared only once — tracked for future repeat detection]

## Status Summary
- **Total items**: N
- **Already addressed** (from prior analyses): N (skipped)
- **Unaddressed items scanned**: N
- **Repeated patterns found**: N (actionable)
- **One-off items**: N (tracked for future)

## Recommended Actions (priority order)

1. [Highest priority — most frequent, highest impact]
2. [Second priority]
3. ...
```

### 8. Apply Improvements (with user confirmation)

For each recommended action, propose the specific change and ask the user:

> **Pattern: {issue type}** — seen {N} times across {M} tickets
>
> I'd like to add this rule to `{target file}`:
> ```
> {concrete rule text}
> ```
>
> Apply this? (yes/no/modify)

**Where to apply**:

| Issue Type | Target |
|---|---|
| Naming convention | Target project's `.claude/rules/` or `CLAUDE.md` |
| Import pattern | Target project's `.claude/rules/` or `CLAUDE.md` |
| Architecture violation | Target project's `CLAUDE.md` or `AGENTS.md` |
| Testing pattern | Target project's `.claude/rules/` or `CLAUDE.md` |
| Domain naming | Target project's `.claude/rules/` |
| Lint/formatting | Target project's `.eslintrc` or lint config |
| Workflow/process mistake | This plugin's skill files (`plugins/engineering-toolkit/skills/`) |
| Agent behavior | This plugin's agent definitions |

### 9. Mark Items as Addressed

After the user confirms a rule improvement, **annotate the original items** in the corresponding `docs/<identifier>/review-feedback.md` file that contributed to that pattern:

```markdown
- [x] [src/service.ts:42] Missing null check — added guard
  → **Rule created** [2026-04-10]: `.claude/rules/null-checks.md`
```

For declined items, mark them so they aren't re-proposed:

```markdown
- [-] [src/service.ts:42] Missing null check — added guard
  → **Declined** [2026-04-10]: user says one-off, not a pattern
```

This ensures:
- Next analysis skips already-addressed items
- You can see at a glance which items led to rules vs which are still unaddressed
- Declined items won't be re-proposed unless new occurrences appear

### 10. Mark Analysis Complete

After applying (or declining) all improvements, append a marker to each `docs/<identifier>/review-feedback.md` file that was analyzed:

```markdown
---

## Review Learning Analysis — [YYYY-MM-DD]

- **Entries analyzed**: N (from [first date] to [last date])
- **Unaddressed items scanned**: N
- **Patterns found**: N repeated, N one-off
- **Rules created**: [list of rules added and where]
- **Declined**: [list of patterns user declined and why]
- **Still unaddressed**: N items (not yet repeated enough to warrant a rule)
```

This marker helps future analyses skip already-analyzed entries.

## Auto-Trigger Integration

`ai-dlc-release` prompts the user to run this skill when:
- Feedback files exist across 3+ different tickets (`docs/**/review-feedback.md`)
- The release phase completes successfully

The user must confirm before the analysis runs — it is never auto-invoked silently.

It can also be manually invoked anytime via `/engineering-toolkit:review-learning`.

## Rules

- **ALWAYS** show the raw data (occurrences) before making recommendations
- **ALWAYS** propose concrete rule text, not vague suggestions
- **ALWAYS** ask the user before applying any change
- **NEVER** apply changes without user confirmation
- If no repeated patterns are found, say so — don't invent patterns
- If `$ARGUMENTS` is provided, focus analysis on that area only (e.g., "naming", "imports", "tests")
- Count only cross-ticket repeats — same-ticket duplicates are noise
- Prioritize pr-review source issues (external signal) over self-review (internal signal)
