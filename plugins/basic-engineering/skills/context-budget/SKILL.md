---
name: context-budget
description: "TRIGGER when: user says 'context budget', 'token budget', 'optimize context', 'what's using tokens', 'reduce context usage', or asks about context window efficiency. DO NOT trigger for: general performance optimization, code size reduction, or bundle size analysis."
model: sonnet
---

# Context Budget Analyzer

Audit and optimize token consumption across your Claude Code configuration.

## Why This Matters

Every component loaded into Claude's context window costs tokens:
- CLAUDE.md files: ~200-2000 tokens each
- MCP tool schemas: ~500 tokens per tool
- Rules (context-triggered): loaded when matching files are edited
- Skills: loaded on invocation (not always-on)
- Agent definitions: loaded when spawned

Excessive context consumption degrades response quality — the model has less room to think.

## Audit Workflow

### Step 1: Inventory Always-On Components

Check what loads on every conversation:

1. **CLAUDE.md files** — Read all CLAUDE.md and AGENTS.md files
   ```
   Find: **/CLAUDE.md, **/AGENTS.md
   Estimate: count lines × ~4 tokens/line
   ```

2. **MCP servers** — Check `.mcp.json` or `.claude/settings.json`
   ```
   Each MCP server adds all its tool schemas (~500 tokens/tool)
   A server with 20 tools = ~10,000 tokens always loaded
   ```

3. **Memory files** — Check memory index
   ```
   Find: MEMORY.md + all referenced memory files
   Estimate: count lines × ~4 tokens/line
   ```

### Step 2: Classify Components

| Classification | Description | Action |
|---|---|---|
| **Always needed** | Core instructions, primary MCP tools | Keep |
| **Sometimes needed** | Language-specific rules, specialized skills | Ensure lazy-loaded |
| **Rarely needed** | Niche MCP tools, old memory entries | Remove or defer |

### Step 3: Optimization Strategies

#### MCP is the biggest lever
Each MCP tool schema costs ~500 tokens. A server with 30 tools burns 15K tokens before you type anything.

**Actions:**
- Remove MCP servers you don't actively use
- Prefer MCP servers with fewer, focused tools over monolithic ones
- Use `allowedTools` in MCP config to limit which tools are exposed

#### CLAUDE.md file hygiene
- Keep project CLAUDE.md under 200 lines
- Use `@file` references for detailed docs (loaded on demand)
- Move long instructions to skills (loaded on invocation)
- Remove stale instructions

#### Memory pruning
- Review memory index quarterly
- Remove memories that duplicate what's in code/docs
- Keep memories under 50 lines each

#### Rules are free until triggered
- Rules with `paths:` patterns only load when matching files are edited
- This is already efficient — no action needed unless you have catch-all patterns

### Step 4: Report

Present findings as:

```
## Context Budget Report

### Always-On Token Usage
| Component | Tokens (est.) | Notes |
|---|---|---|
| CLAUDE.md | ~800 | Could trim §3 |
| AGENTS.md | ~400 | OK |
| MCP: github | ~5,000 | 10 tools × 500 |
| MCP: memory | ~2,500 | 5 tools × 500 |
| Memory files | ~600 | 3 files |
| **Total** | **~9,300** | |

### Recommendations
1. [High impact] Remove unused MCP server X — saves ~Y tokens
2. [Medium] Move §Z from CLAUDE.md to a skill — saves ~W tokens
3. [Low] Prune memory file A — saves ~V tokens

### Context Budget Health
- 🟢 Under 15K: Healthy
- 🟡 15K-30K: Monitor
- 🔴 Over 30K: Optimize immediately
```

## Quick Check Command

For a fast estimate without full audit:
1. Count CLAUDE.md lines: `wc -l **/CLAUDE.md`
2. Count MCP tools: check `.mcp.json` tool count
3. Count memory files: check MEMORY.md entries

Rule of thumb: **keep always-on context under 15K tokens** to leave room for code, conversation, and reasoning.
