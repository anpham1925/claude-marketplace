---
name: handoff
description: "Compact the current conversation into a handoff document so a fresh Claude Code session (or another agent) can continue the work without losing context. Also covers strategic context compaction — when and how to `/compact` within a session at phase transitions. TRIGGER when: user says 'handoff', 'hand off', 'pass this to another session', 'session handoff', 'pick this up later', 'context is too long, save state', 'compact', 'compact context', 'when should I compact', 'context is getting long', or wants to end one session and resume in a new one. DO NOT trigger for: within-AI-DLC orchestrator-to-subagent return (use Subagent Return Contract in ai-dlc/reference/shared.md), or PR-handoff to a teammate (use update-docs + a PR description)."
argument-hint: '[focus area or "from <agent>"]'
model: opus
---

# Handoff

Compact the current conversation into a structured document that a fresh Claude Code session — or another human/agent — can read to pick up the work exactly where you left it.

This is the **session-to-session** handoff. For within-pipeline subagent handoff inside `ai-dlc`, use the [Subagent Return Contract](../ai-dlc/reference/shared.md#subagent-return-contract) instead — same instinct, tighter shape, scoped to phase outputs.

## When to use

- The current session is running long and you want to start fresh without losing context
- You're stopping for the day and want tomorrow's session (yours or a teammate's) to resume cleanly
- You're escalating to a different agent (or a human) and need a brief that doesn't require reading the transcript
- The context has gotten muddy and a clean restart with a clean brief is faster than recovering

## When NOT to use

- **Within an AI-DLC run** — that's the Subagent Return Contract's job ([shared.md](../ai-dlc/reference/shared.md#subagent-return-contract))
- **Mid-task context bloat with no break point** — `/compact` in-place instead of a full handoff (see [Strategic context compaction](#strategic-context-compaction) below)
- **Capturing decisions or learnings for future sessions** — use the `auto memory` system (write to `MEMORY.md`)
- **Documenting completed work for teammates** — use `update-docs` + a PR description

## Strategic context compaction

A handoff to a *new* session is the heavyweight option. The lightweight cousin is compacting **within** the current session with `/compact` — and the same "reference, don't duplicate; save state first" discipline applies. (This guidance absorbs the former `strategic-compaction` skill.)

### When to compact (vs. handoff)

Compact at **logical phase transitions**, not arbitrary points. Reach for `/compact` (stay in session) rather than a full handoff when the work continues but the recent context is now noise:

| Transition | Why compact here |
|---|---|
| After research → before implementation | Findings are captured; raw search results can go |
| After debugging → before new feature | Debug traces are noise for the next task |
| After design review → before coding | Decisions live in plan files / ADRs |
| After completing a PR → before next ticket | PR context is in git; start fresh |
| After long exploration → before focused work | Breadth isn't needed for depth |

### When NOT to compact

- **Mid-implementation** — you'll lose variable names, file paths, partial state
- **During debugging** — stack traces and error context are critical
- **While reviewing** — review findings need full diff context
- **Right before a checkpoint** — let the checkpoint capture state first

### How to compact effectively

1. **Save state to files first** — write working notes to `docs/<identifier>/state.md`, decisions to ADRs, and commit WIP. Anything not in a file is at risk.
2. **Run `/compact` with a one-line summary** of what matters, e.g.
   `/compact Implementing PROJ-123 payment retry. Tests pass. Next: add structured logging to retry attempts.`
3. **After compacting**, re-read the files you were actively editing and check the task list before continuing.

**Rule of thumb:** if the conversation is over ~50 messages or you've switched focus areas 3+ times, compact. If you're also leaving the session (or about to start a *heavy* phase), write a full handoff instead — use the rest of this skill.

## What to produce

A single Markdown file saved to the **`docs/` folder in the current working directory** (`./docs/`, created if absent). Handoffs live alongside the project they describe so the next session — or a teammate — finds them in the repo.

- Path: `./docs/handoff-<slug>.md` (relative to the current working directory)
- The slug is a short kebab-case description of the work in flight (e.g., `port-auth-patterns`, `debug-fraud-test-leak`)
- Print the absolute path at the end so the user can `cat` it or pass it to the next session

## Document shape

```markdown
# Handoff: <one-line goal>

**From session**: <date + agent + model if known>
**Focus area**: <user-provided argument, or "general continuation">
**Working directory**: <absolute path>
**Git branch**: <branch name + commit SHA at tip>

## Goal

<2-3 sentences. What is the user trying to accomplish? Not what we did — what's left to be true at the end.>

## State of play

<Bullet list of the most relevant load-bearing facts:
- which files / paths matter and why
- which branches, PRs, or external systems are in flight
- which tickets / issues / Slack threads relate
- any environment / config / credentials needed (REDACT secrets — name them, never reveal them)
>

## What's done

<Bullet list. Each item: 1 line + a reference (commit SHA, PR URL, file path, ticket ID). DO NOT restate the content of those references — point to them. Avoiding duplication is the whole point.>

## What's next

<Numbered list, in execution order. Each step:
- 1-2 sentences on what to do
- Which file / command / skill to start with
- The success criterion (how does the next agent know it's done)
>

## Open questions

<One per line. Anything blocked on user input, ambiguous, or where the previous session made an assumption that should be challenged. Pair each question with the assumption the previous session made.>

## Skills the next session should invoke

<Pick from the skills available in this plugin/marketplace. Examples:
- `/engineering-toolkit:ai-dlc-construct` — if mid-Construct phase, ticket=PROJ-123, state.md at docs/PROJ-123/
- `/engineering-toolkit:ship-n-check` — if work is done and just needs to ship
- `/engineering-toolkit:investigate` — if root-causing a bug
Only list skills the next session will actually need; don't dump the full catalog.>

## What to AVOID

<Things the previous session tried that didn't work, gotchas the next session would otherwise re-discover, files NOT to touch. Two or three items max — this section is a landmine map, not a complete tour.>

## Memory hints

<Anything the previous session noticed about the user's preferences, feedback they gave, or working-style patterns that should carry forward but might not yet be in `MEMORY.md`. The next session can decide whether to promote any of these to permanent memory.>
```

## Steps

### 1. Parse arguments

The user may supply `$ARGUMENTS` as a free-form focus area (e.g., `"the PR review feedback loop"`) or as `from <agent-name>` if they want the doc framed for another agent.

- If absent: title the goal generically as "general continuation"
- If present: use as the `Focus area` line and bias the document toward that area

### 2. Scan the conversation

Read the most recent messages in the current session. Pay particular attention to:

- The original user goal (what did they ask for?)
- What's been done since (tool calls, files changed, commits made, PRs opened)
- What's still TODO (anything the user agreed to but you haven't done yet, anything you flagged as "next step" earlier)
- Decisions made and *why* (not just the outcome — the reasoning, so the next session doesn't re-litigate)
- Open questions (anything you asked the user that didn't get a definitive answer, anything you assumed without asking)
- Mistakes made and corrected (so the next session doesn't repeat them)

### 3. Reference, don't restate

For anything that already exists as a durable artifact, **link by path or URL** rather than copying content into the handoff:

- Commits: reference by SHA (use `git log --oneline` to get recent ones)
- PRs: reference by URL (use `gh pr view` to get current state if needed)
- Files: reference by absolute or repo-relative path with line numbers if specific (`file.ts:42`)
- External systems: reference by Jira ID, Slack permalink, Linear URL, Confluence URL, etc.

The handoff doc is a navigation map, not a transcript. The next session can follow the links to read details on demand.

### 4. Redact sensitive data

NEVER paste any of these into the handoff doc:

- API keys, tokens, passwords
- PII (emails, phone numbers, addresses, names of internal customers)
- Internal secret URLs or hostnames
- Anything from a `.env*` file

When the next session needs a secret, the doc names what's needed and where to source it ("set `DATABASE_URL` from 1Password vault `dev-secrets`"). It NEVER reveals the value.

### 5. Write the file

Resolve the target directory: **`docs/` in the current working directory** (`./docs/`). Create it if it doesn't exist (`mkdir -p docs`).

Filename pattern: `handoff-<slug>.md`, where the slug is a short kebab-case description of the work in flight (e.g. `aidlc-dispatch-fix`) — distinct slugs keep concurrent handoffs from colliding. Only add a `-<YYYYMMDDTHHMMSS>` suffix if a handoff with the same slug already exists and you want to keep both.

Save the document to `./docs/handoff-<slug>.md` with the `Write` tool. If the harness blocks the Write tool (e.g. a background-isolation guard), write the same file via a shell heredoc instead.

### 6. Print the path and a brief summary

End the response with:

```
Handoff saved: <absolute path>

Next session: open this file first, then run:
  <one suggested skill or command, derived from the doc's "What's next" section>
```

Keep the summary under 5 lines — the doc is the real deliverable.

## Rules

- **ALWAYS** save to `./docs/` in the current working directory (create it if absent) — handoffs live with the project they describe
- **ALWAYS** reference artifacts by path/URL, never duplicate their content into the handoff
- **ALWAYS** redact secrets — name them, never reveal them
- **ALWAYS** include "What to AVOID" — landmines from this session save the next one hours
- **NEVER** treat the handoff doc as the source of truth — disk state (commits, files, PRs) wins on conflict
- **NEVER** include tool-call transcripts or raw command output — the doc is a brief, not a log
- **NEVER** pad the document — if there's nothing for a section ("Open questions: none"), say so and move on
- **NEVER** save under `docs/<identifier>/` (a per-ticket subfolder) — that path is reserved for AI-DLC per-ticket artifacts. The handoff goes in `docs/` itself, not a ticket subdir.

## Why this skill exists

When a session ends — context exhausted, day over, escalation, or you just want a clean restart — the alternative to a handoff is one of:

1. **Hoping the next session figures it out from `git log`** — works for trivial work, fails for anything where the *why* matters more than the *what*.
2. **Leaving cryptic TODOs in code or markdown** — half-state, ages poorly, gets committed.
3. **Re-reading the transcript** — assumes the transcript is even available, and burns time that the handoff doc would have saved.

A 200-line handoff doc, written once at the natural pause, lets the next session land with the same context the previous one had — minus the noise. Same instinct as the [Subagent Return Contract](../ai-dlc/reference/shared.md#subagent-return-contract), wider scope: that one is structured for a specific phase boundary inside `ai-dlc`; this one handles arbitrary session boundaries across any work.
