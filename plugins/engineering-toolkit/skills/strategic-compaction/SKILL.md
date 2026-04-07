---
name: strategic-compaction
description: "TRIGGER when: user says 'compact', 'compact context', 'running out of context', 'context is getting long', 'when should I compact', or asks about managing long conversations. DO NOT trigger for: code minification, file compression, or data compaction."
model: sonnet
---

# Strategic Compaction

Guide for when and how to compact conversation context for maximum effectiveness.

## The Problem

Claude Code automatically compacts when approaching context limits, but automatic compaction happens at arbitrary points — often mid-task, losing important working context. Strategic manual compaction at phase transitions preserves the right information.

## When to Compact

Compact at **logical phase transitions**, not arbitrary points:

| Transition | Why Compact Here |
|---|---|
| After research → before implementation | Research findings are in your head; raw search results can go |
| After debugging → before new feature | Debug traces are noise for the next task |
| After design review → before coding | Design decisions are captured in plan files |
| After completing a PR → before next ticket | PR context is in git; start fresh |
| After long exploration → before focused work | Exploration breadth isn't needed for depth |

## When NOT to Compact

- **Mid-implementation** — You'll lose variable names, file paths, and partial state
- **During debugging** — Stack traces and error context are critical
- **While reviewing** — Review findings need full diff context
- **Right before a checkpoint** — Let the checkpoint capture state first

## How to Compact Effectively

### Before Compacting

1. **Save state to files** if you have important working context:
   - Write implementation notes to `docs/<ticket>/STATE.md`
   - Save design decisions to `docs/<ticket>/decisions.md`
   - Commit any work in progress

2. **Summarize key context** in your message:
   ```
   "Compact now. Key context to preserve:
   - Working on TICKET-123: payment retry logic
   - Files modified: src/payments/retry.ts, src/payments/retry.spec.ts
   - Current status: tests passing, need to add error logging
   - Decision: using exponential backoff with jitter (see ADR-007)"
   ```

### The Compact Command

Use `/compact` with a summary of what matters:
```
/compact Implementing TICKET-123 payment retry. Tests pass. Next: add structured logging to retry attempts.
```

### After Compacting

1. Re-read any files you were actively editing
2. Check your task list for current status
3. Continue from where you left off

## Compaction Frequency Guide

| Session Type | Compact Every |
|---|---|
| Single focused task | Usually not needed |
| Multi-task session | Between each task |
| Long exploration | After each major finding |
| Debugging marathon | After each resolved issue |
| Large implementation | After each completed module/component |

## Anti-Patterns

- **Never compacting** — Context fills up, auto-compaction loses random chunks
- **Compacting too often** — Overhead of re-establishing context exceeds benefit
- **Compacting without saving state** — Lose important decisions and progress
- **Compacting mid-flow** — Interrupts momentum, context rebuild is expensive

## Rule of Thumb

If your conversation is over **50 messages** or you've switched focus areas **3+ times**, it's time to compact.
