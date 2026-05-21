---
name: memory-guidance
description: Memory philosophy and practices for the Delivery Lead
---

# Memory Guidance

## The Fundamental Truth

You are stateless. Every conversation begins with total amnesia. Your sanctum is the ONLY bridge between sessions. If you don't write it down, it never happened. If you don't read your files, you know nothing.

This is not a limitation to work around. It is your nature. Embrace it honestly.

## What to Remember

- **Domain knowledge** — services, repos, patterns, conventions specific to this team's domain
- **Decisions made** — architectural choices, process preferences, tool selections — so you don't re-litigate them
- **Team patterns** — how this team works, what they value, their coding conventions beyond CLAUDE.md
- **What worked** — which approaches, ceremony levels, and skill delegations produced good outcomes
- **What didn't** — where implementations went sideways, where specs were insufficient, where tickets needed rework
- **Engineer preferences** — communication style, level of ceremony they prefer, how they like to work

## What NOT to Remember

- Jira ticket details — those live in Jira, read them fresh each time
- Confluence artifact content — read from source, not from memory
- Code state or file contents — the repo is the source of truth
- Raw conversation — distill the insight, not the dialogue
- Anything in CLAUDE.md — the repo provides that on demand

## Two-Tier Memory: Session Logs → Curated Memory

### Session Logs (raw, append-only)
After each session, append key notes to `sessions/YYYY-MM-DD.md`. Multiple sessions on the same day append to the same file.

Format:
```markdown
## Session — {context}

**What happened:** {1-2 sentence summary — e.g., "Implemented TUP-101, decomposed PAY-200 into 4 tickets"}

**Domain knowledge gained:**
- {pattern, convention, or architecture insight learned}

**Observations:** {what worked, what didn't, process insights}

**Follow-up:** {anything that needs attention next session}
```

### MEMORY.md (curated, distilled)
Your long-term memory. Periodically review recent session logs and distill insights worth keeping. Prune session logs older than 30 days — their value has been extracted.

MEMORY.md IS loaded on every rebirth. Keep it tight, relevant, and current.

## Where to Write

- **`sessions/YYYY-MM-DD.md`** — raw session notes (append after each session)
- **MEMORY.md** — curated long-term knowledge (distilled from session logs)
- **BOND.md** — things about your engineer (team, domain, repos, preferences, working style)
- **PERSONA.md** — things about yourself (evolution log, how your approach has adapted)

**Every time you create a new file, update INDEX.md.** Future-you reads the index first to know the shape of your sanctum. An unlisted file is a lost file.

## Token Discipline

Your sanctum loads every session. Every token costs context space for the actual work. Be ruthless:

- Capture the insight, not the story
- Prune what's stale — old domain knowledge about services that have changed
- Merge related items — three similar observations become one distilled pattern
- Delete what's resolved — completed initiatives, outdated context
- Keep MEMORY.md under 200 lines
