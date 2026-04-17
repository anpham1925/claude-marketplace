# engineering-toolkit — Engineering Toolkit

An opinionated toolkit for Claude Code covering the full development lifecycle from requirements to deployment.

## Install

```bash
# 1. Add the marketplace
/plugin marketplace add anpham1925/claude-marketplace

# 2. Install the core toolkit
/plugin install engineering-toolkit@anpham-marketplace

# 3. Install framework stacks (optional — only install what you use)
/plugin install nestjs-toolkit@anpham-marketplace
/plugin install django-toolkit@anpham-marketplace
/plugin install nextjs-toolkit@anpham-marketplace
```

## How It Works

The plugin has **two orchestrators** that handle most workflows. You rarely need to invoke individual skills directly — the orchestrators route to the right phase/stage automatically.

```
                           "work on TICKET-123"
                           "fix this bug"
                           "build a new feature"
                                  |
                                  v
                          +--------------+
                          |   AI-DLC     |  <-- Development orchestrator
                          |  (ai-dlc)    |      Adaptive pipeline: Plan → Build → Ship
                          +--------------+
                                  |
                    +-------------+-------------+
                    |             |             |
               Discovery    Plan/Build    Release
               (optional)   (adaptive)    (delegates)
                                               |
                                               v
                                      +--------------+
                                      | Ship & Check |  <-- Shipping orchestrator
                                      | (ship-n-check)|     Branch → Quality → CI → PR
                                      +--------------+
```

### When to use what

| You want to... | Just say... | What triggers |
|---|---|---|
| Work on a Jira ticket | "start TICKET-123" or "work on TICKET-123" | `ai-dlc` — full adaptive pipeline |
| Build a new feature | "build a user dashboard" | `ai-dlc` — starts with Discovery if vague, Plan if clear |
| Fix a bug | "fix the auth bug" or "investigate why payments fail" | `ai-dlc` — Plan classifies as bug-fix, adds Investigate if root cause unclear |
| Ship your code | "I'm done" or "ship it" or "commit and push" | `ship-n-check` — branch, quality, CI/CD, PR |
| Debug something | "why is this failing?" or "investigate TICKET-123" | `investigate` — hypothesis-driven root cause analysis |
| Decompose a large ticket | "break this down" or "split into sub-tasks" | `sdlc-breakdown` — threshold-based task decomposition |
| Switch to fast mode | "dev mode" | `mode-dev` — bias toward action, minimal discussion |
| Explore before acting | "research mode" | `mode-research` — read-only, no code changes |
| Review code quality | "review mode" | `mode-review` — adversarial checklist-driven review |
| Check PR feedback | "check PR comments" or "what did reviewers say" | `ship-pr-review` — reads all 3 GitHub comment sources |
| Get standup summary | "daily summary" or "what did I do today" | `daily-summary` — aggregates GitHub + Jira + Slack |
| Learn from past reviews | "learn from reviews" or "what mistakes do we keep making" | `review-learning` — cross-ticket pattern detection |
| Refresh stale docs | "update docs" or "check docs" | `update-docs` — scans for drift against code changes |

### Example: Full feature workflow

```bash
# 1. Start with a ticket — AI-DLC adapts the pipeline automatically
/engineering-toolkit:ai-dlc TICKET-123

# AI-DLC will:
#   Plan     → classify intent, determine which phases to run
#   Inception → extract requirements, NFRs, risks
#   Design   → architecture decisions, ADRs
#   Construct → TDD implementation in waves
#   Verify   → AC verification + adversarial code review
#   Release  → delegates to ship-n-check (branch → PR → CI → merge)
#   Observe  → post-deploy health checks (if NFRs exist)

# Each phase runs as an isolated subagent. The main session stays lean.
# Checkpoints pause for your approval between phases.
```

### Example: Quick bug fix

```bash
# Just describe the bug — AI-DLC auto-adapts for bug fixes
/engineering-toolkit:ai-dlc TICKET-456

# AI-DLC detects "bug-fix" intent and runs a compressed pipeline:
#   Plan → Inception (light) → Construct → Verify → Release
# No Domain Design, no Logical Design — straight to fixing.

# If root cause is unclear, it adds an Investigate phase:
#   Plan → Investigate → Inception (light) → Construct → Verify → Release
```

### Example: Vague idea (no ticket yet)

```bash
# Challenge the idea before engineering begins
/engineering-toolkit:ai-dlc discovery

# Discovery asks 6 forcing questions:
#   1. What's the pain? (specific examples, not hypotheticals)
#   2. Who feels it? (persona, frequency, severity)
#   3. What exists today? (workarounds)
#   4. What's the smallest version? (narrow wedge)
#   5. What's the 10x version? (ambition)
#   6. What breaks if we're wrong? (validation)
#
# Then reframes the problem and recommends the narrowest viable approach.
```

### Example: Ship code after you're done coding

```bash
# Ship-n-check handles the full git pipeline
/engineering-toolkit:ship-n-check

# Pipeline:
#   Branch & Commit → Requirements Review → Local Quality
#   → Push & PR → CI/CD → Staging → PR Review
#
# Each stage has quality gates. Review feedback is captured
# for cross-ticket pattern detection.
```

### Example: Debug a production issue

```bash
# Structured investigation with hypothesis testing
/engineering-toolkit:investigate "API returns 500 on /users endpoint"

# Spawns a debugger subagent that:
#   1. Scopes the investigation (module, entry point, dependencies)
#   2. Forms hypotheses (max 3 rounds)
#   3. Tests each with minimal checks (grep, test runs, logs)
#   4. Produces a structured report with root cause + recommended fix
#
# The debugger never fixes — it investigates. Fixing happens after.
```

### Example: Run individual phases

```bash
# You can run any AI-DLC phase directly
/engineering-toolkit:ai-dlc plan TICKET-123      # Just classify and plan
/engineering-toolkit:ai-dlc inception            # Just extract requirements
/engineering-toolkit:ai-dlc construct            # Just TDD implement
/engineering-toolkit:ai-dlc verify               # Just verify + code review
```

## Trigger Reference

Skills trigger automatically based on what you say. Here's the complete routing:

### Auto-triggered (you don't need to invoke these)

| Trigger | Skill | When |
|---|---|---|
| Mention a ticket ID | `ai-dlc` | "start TICKET-123", "work on TICKET-123" |
| Start development | `ai-dlc` | "build this", "implement this", "plan this" |
| Ship/commit/push | `ship-n-check` | "I'm done", "ship it", "commit", "push", "create PR" |
| NestJS code | `nestjs-toolkit:nestjs-stack` | Code imports from `@nestjs/`, TypeORM, etc. (separate plugin) |
| Next.js code | `nextjs-toolkit:nextjs-stack` | Code imports from `next`, `next/navigation`, etc. (separate plugin) |
| Django code | `django-toolkit:django-stack` | Code imports from `django`, `rest_framework`, etc. (separate plugin) |
| TypeScript files | TS rules | Coding style, patterns, security rules activate on `*.ts`/`*.tsx` |
| Python files | Python rules | Coding style, patterns, security rules activate on `*.py` |
| Go files | Go rules | Coding style, patterns, security rules activate on `*.go` |
| Test files | Test rules | Fixture rules, testing patterns activate on `*.spec.ts`, etc. |

### Explicitly invoked (say the trigger phrase or use the slash command)

| Trigger phrase | Skill |
|---|---|
| "dev mode", "coding mode" | `mode-dev` |
| "research mode", "exploration mode" | `mode-research` |
| "review mode", "quality mode" | `mode-review` |
| "investigate", "debug this", "why is this failing" | `investigate` |
| "break this down", "split this ticket" | `sdlc-breakdown` |
| "daily summary", "what did I do today", "standup" | `daily-summary` |
| "learn from reviews", "what mistakes do we keep making" | `review-learning` |
| "update docs", "refresh docs", "docs are stale" | `update-docs` |
| "context budget", "what's using tokens" | `context-budget` |
| "compact", "running out of context" | `strategic-compaction` |
| "learn from this", "save this pattern" | `continuous-learning` |
| "create a story", "create a ticket" | `create-user-story` |
| "add storybook", "setup storybook" | `setup-storybook` |
| "check PR comments", "what did reviewers say" | `ship-pr-review` |
| "how should I test this", "explain TDD", "write an ADR" | `engineering-foundations` |

### Never auto-triggered (internal — called by orchestrators)

These are phase/stage skills invoked by `ai-dlc` or `ship-n-check`. You can call them directly with slash commands, but usually the orchestrator handles routing:

- `ai-dlc-discovery`, `ai-dlc-plan`, `ai-dlc-inception`, `ai-dlc-domain-design`, `ai-dlc-logical-design`, `ai-dlc-construct`, `ai-dlc-verify`, `ai-dlc-release`, `ai-dlc-observe`
- `ship-branch`, `ship-quality`, `ship-push-pr`, `ship-cicd`, `ship-staging`

## Architecture

### Orchestrator + Subagent Pattern

AI-DLC uses a **lean orchestrator** that spawns **isolated subagents** for each phase:

```
Main Session (orchestrator)
  |-- spawn Plan subagent --> writes state.md --> returns summary
  |   '-- CHECKPOINT: user approves
  |-- spawn Inception subagent --> writes specs.md --> returns summary
  |   '-- CHECKPOINT: user approves
  |-- spawn Design subagent --> writes flows.md --> returns summary
  |   '-- CHECKPOINT: user approves
  |-- spawn Construct subagent --> writes code + tests --> returns summary
  |-- spawn Verify subagent --> writes review-feedback.md --> returns summary
  |   '-- CHECKPOINT: user approves
  '-- spawn Release subagent --> creates PR --> returns URL
```

**Why subagents?**
- **Context isolation** — each phase gets a fresh context window, not polluted by previous phases
- **Main session stays lean** — only holds state.md, phase summaries, checkpoint decisions
- **Artifact-driven** — clear contract between phases (specs.md, flows.md, etc.)
- **Better quality** — each subagent gets full context budget for its specific task

### Harness Engineering

AI-DLC is structured as a **harness** with guides (feedforward controls) and sensors (feedback controls):

| Type | Examples | When |
|---|---|---|
| **Guides** | Rules, skill prompts, design artifacts, test fixtures rule | Before acting — steer the model |
| **Sensors** | lint, type-check, tests, code-reviewer agent, CI/CD | After acting — catch issues |

See `ai-dlc/reference/harness.md` for the full control classification.

### Adaptive Pipeline

The Plan phase classifies intent and determines which phases to run:

| Intent | Pipeline |
|---|---|
| Vague request | Discovery --> Plan --> (rest determined by Plan) |
| Bug fix (root cause known) | Plan --> Inception (light) --> Construct --> Verify --> Release |
| Bug fix (root cause unclear) | Plan --> Investigate --> Inception (light) --> Construct --> Verify --> Release |
| Small feature | Plan --> Inception --> Logical Design --> Construct --> Verify --> Release |
| Full feature | Plan --> Inception --> Domain Design --> Logical Design --> Construct --> Verify --> Release --> Observe |
| Refactor | Plan --> Inception (code elevation) --> Logical Design --> Construct --> Verify --> Release |
| Spike | Plan --> Inception --> Domain Design --> STOP |

## Agents (8)

| Agent | Model | Purpose |
|---|---|---|
| **planner** | opus | Read-only implementation planning — 2-3 approaches with trade-offs |
| **security-reviewer** | opus | OWASP Top 10 vulnerability scanning, secrets detection |
| **requirements-reviewer** | opus | Adversarial cross-check of code vs acceptance criteria |
| **code-reviewer** | opus | Quality, architecture, naming, security, adversarial analysis |
| **test-runner** | sonnet | Run tests, analyze failures, fix and re-run (max 3 attempts) |
| **codebase-explorer** | haiku | Fast codebase research and pattern discovery |
| **ci-watcher** | sonnet | Monitor CI/CD pipelines, analyze failures |
| **debugger** | opus | Hypothesis-driven debugging — investigates without fixing (max 3 rounds) |

## Rules (18)

Context-triggered rules that activate when matching files are edited:

| Rule | Files | What It Enforces |
|---|---|---|
| **Git Conventions** | _(always on)_ | Branch naming, commit format (`type: [TICKET] desc`), PR convention, git safety |
| **Use Skills** | _(always on)_ | Route through orchestrators, never raw git/gh commands |
| **Shell Safety** | _(always on)_ | No `$()` subshells, no `>` redirection, no `\(.field)` in jq |
| **TypeScript Coding Style** | `*.ts`, `*.tsx` | `unknown` over `any`, `as const` over `enum`, discriminated unions |
| **TypeScript Patterns** | `*.ts`, `*.tsx` | Result pattern, guard clauses, Zod schema-first, DI |
| **TypeScript Security** | `*.ts`, `*.tsx` | No `eval`, parameterized queries, CORS, timing-safe comparisons |
| **Python Coding Style** | `*.py` | Type hints, pathlib, dataclasses, f-strings |
| **Python Patterns** | `*.py` | Repository pattern, service layer, structured logging, async |
| **Python Security** | `*.py` | No pickle/eval, bcrypt, defusedxml, dependency auditing |
| **Go Coding Style** | `*.go` | Accept interfaces/return structs, table-driven tests, context |
| **Go Patterns** | `*.go` | Functional options, middleware chains, graceful shutdown |
| **Go Security** | `*.go` | crypto/rand, timeouts, prepared statements, govulncheck |
| **Testing** | `*.spec.ts`, `*.test.py`, etc. | TDD, 70% coverage, no mocking internals, AAA pattern |
| **Naming** | `*.ts`, `*.py`, `*.go`, etc. | Specific names, no generic Service/Manager/Helper |
| **Logging** | `*.ts`, `*.py`, `*.go`, etc. | Structured fields, context-first, no sensitive data |
| **Architecture Boundaries** | `*.ts`, `*.tsx` | Layer import direction enforcement (apps/modules/libs) |
| **Test Fixtures** | `*.spec.ts`, `*.e2e-spec.ts` | Use existing factories before creating inline test data |
| **Rule Authoring** | `rules/**/*.md` | File extension coverage checklist + version bump rules |

## Hooks (8)

Deterministic guardrails — hooks enforce rules that prompt instructions follow only ~80% of the time:

| Hook | Trigger | What It Does |
|---|---|---|
| **skill-first** | UserPromptSubmit | Enforces skill usage before manual code changes |
| **block-no-verify** | PreToolUse (Bash) | Blocks `--no-verify` and force pushes to main/master |
| **git-safety** | PreToolUse (Bash) | Blocks `reset --hard`, `clean -f`, `checkout .`, `branch -D main` |
| **ship-conventions** | PreToolUse (Bash) | Config-driven git/gh guardrails: feature-branch-only commits, draft-PR enforcement, blocked `git add -A`, blocked process substitution. Rules live in `hooks/conventions.json` — edit the JSON, not the script. |
| **sensitive-file-warning** | PreToolUse (Read) | Warns when reading `.env`, `.pem`, `.key`, credentials |
| **auto-format-check** | PostToolUse (Bash) | Detects formatting issues in build/lint output |
| **console-log-detection** | PostToolUse (Write/Edit) | Warns on `console.log`, `debugger`, `import pdb` (skips test/markdown) |
| **session-context** | Session lifecycle | Saves/loads session state for continuity |

### Configuring conventions

The `ship-conventions` hook reads `hooks/conventions.json` as its single source of truth. To change rules, edit the JSON — not the script. See `config.example.json` for per-repo AI-DLC overrides (default branch, deploy workflow name, staging context, etc.).

## Opinions

This toolkit reflects opinionated engineering choices:

- **TDD** — Red-Green-Refactor-Validate, 70% coverage target
- **Hooks over prompts** — deterministic enforcement > prompt adherence
- **Subagent isolation** — each phase gets a fresh context window, orchestrator stays lean
- **Adversarial review** — assume bugs exist until proven otherwise, risk-scaled depth
- **Adaptive pipelines** — intent classification determines which phases run, not a fixed sequence
- **AI drives, human validates** — orchestrator recommends next actions, user approves at checkpoints
- **Artifact-driven contracts** — phases communicate through files (state.md, specs.md, flows.md), not conversation history
- **Framework-specific patterns** — NestJS (DDD + Hexagonal + CQRS), Next.js (App Router + Server Components), Django (DRF + Service Layer)

Other teams may have different preferences — and that's fine. Fork or build your own toolkit.
