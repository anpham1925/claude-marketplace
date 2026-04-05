# basic-engineering — Engineering Toolkit

An opinionated toolkit for Claude Code covering the full development lifecycle from requirements to deployment.

## Install

```bash
# 1. Add the marketplace
/plugin marketplace add anpham1925/claude-marketplace

# 2. Install the plugin
/plugin install basic-engineering@anpham-marketplace
```

## What's New in v4.3

- **AI-DLC orchestrator** — Adaptive intent-to-production lifecycle with 8 phases (Plan, Inception, Domain Design, Logical Design, Construct, Verify, Release, Observe). Classifies intent type (bug-fix, feature, refactor, spike) and adapts pipeline accordingly.
- **Daily summary** — Aggregate GitHub + Jira + Slack activity into standup format, send as Slack DM
- **Review learning** — Progressive review feedback loop with persistent project memory, auto-triggered weekly pattern analysis
- **Ship-* skill naming** — Renamed snc-* to ship-* for semantic clarity (ship-branch, ship-quality, ship-push-pr, ship-cicd, ship-staging, ship-pr-review)
- **Issue-level PR comments** — ship-pr-review now reads all 3 GitHub comment sources (top-level, inline, issue-level)
- **Git conventions rule** — Always-on rule for branch naming, commit convention, PR convention
- **Hook path resolution** — Uses `${CLAUDE_PLUGIN_ROOT}` for reliable hook paths
- **Git safety improvements** — Only checks first line of commands, avoids false positives from heredocs/PR bodies

## Skills

### Orchestrators

| Skill | Invoke | What It Does |
|---|---|---|
| **SDLC** | `/basic-engineering:sdlc PRT-123` | 8-stage SDLC pipeline with Jira integration, agent teams, and human checkpoints |
| **Ship & Check** | `/basic-engineering:ship-n-check` | 6-stage git workflow — branch, quality, push, CI/CD, staging, PR review |
| **AI-DLC** | `/basic-engineering:ai-dlc PRT-123` | Adaptive intent-to-production lifecycle — AI recommends, human validates. 8 phases with NFR tracking, traceability matrix, DDD modeling |

### AI-DLC Phase Skills

| Skill | Invoke | What It Does |
|---|---|---|
| **Plan** | `/basic-engineering:ai-dlc-plan` | Classify intent type, generate adaptive Level 1 Plan |
| **Inception** | `/basic-engineering:ai-dlc-inception` | Requirements + NFRs + risks + measurement + code elevation |
| **Domain Design** | `/basic-engineering:ai-dlc-domain-design` | Pure DDD modeling (aggregates, events, business rules) |
| **Logical Design** | `/basic-engineering:ai-dlc-logical-design` | Architectural patterns + NFR mapping + ADRs + plan summary |
| **Construct** | `/basic-engineering:ai-dlc-construct` | TDD wave implementation + e2e tests + traceability |
| **Verify** | `/basic-engineering:ai-dlc-verify` | AC verification + code review + traceability validation |
| **Release** | `/basic-engineering:ai-dlc-release` | Branch → PR → CI/CD → staging → merge (delegates to ship-*) |
| **Observe** | `/basic-engineering:ai-dlc-observe` | Post-deploy health + Honeycomb observability |

### SDLC Stage Skills

| Skill | Invoke | What It Does |
|---|---|---|
| **Analyze** | `/basic-engineering:sdlc-analyze PRT-123` | Gather requirements from Jira ticket + codebase research |
| **Design** | `/basic-engineering:sdlc-design PRT-123` | Solution design with revision loop + plan creation (specs.md) |
| **Breakdown** | `/basic-engineering:sdlc-breakdown PRT-123` | Split large plans into independent sub-tasks with Jira tickets |
| **Implement** | `/basic-engineering:sdlc-implement PRT-123` | TDD implementation following the execution plan |
| **Test** | `/basic-engineering:sdlc-test PRT-123` | E2e and integration tests from acceptance criteria |
| **Verify** | `/basic-engineering:sdlc-verify PRT-123` | Goal-backward verification (exists/substantive/wired) |
| **Review** | `/basic-engineering:sdlc-review PRT-123` | Code review for quality, architecture, security |
| **Release** | `/basic-engineering:sdlc-release PRT-123` | Delegates to ship-n-check + Jira transitions |

### Ship & Check Stage Skills

| Skill | Invoke | What It Does |
|---|---|---|
| **Branch** | `/basic-engineering:ship-branch PRT-123` | Branch creation, staging, commit with conventions |
| **Quality** | `/basic-engineering:ship-quality PRT-123` | Requirements review (blocking) + code quality checks |
| **Push & PR** | `/basic-engineering:ship-push-pr PRT-123` | Push to remote + create draft PR |
| **CI/CD** | `/basic-engineering:ship-cicd PRT-123` | Monitor CI/CD pipelines, analyze and fix failures |
| **Staging** | `/basic-engineering:ship-staging PRT-123` | Staging verification with health and endpoint checks |
| **PR Review** | `/basic-engineering:ship-pr-review PRT-123` | Open PR for review + read ALL feedback (inline + issue-level + top-level) |

### Mode Switching Skills

| Skill | Invoke | What It Does |
|---|---|---|
| **Dev Mode** | `/basic-engineering:mode-dev` | Build fast, explain later — bias toward action, minimal discussion |
| **Research Mode** | `/basic-engineering:mode-research` | Read-only exploration — understand before acting |
| **Review Mode** | `/basic-engineering:mode-review` | Adversarial quality review — systematic checklist-driven analysis |

### Framework Stack Skills

| Skill | Invoke | What It Does |
|---|---|---|
| **NestJS Stack** | `/basic-engineering:nestjs-stack` | NestJS + DDD + Hexagonal + CQRS patterns with 9 reference topics |
| **Next.js Stack** | `/basic-engineering:nextjs-stack` | Next.js 14+ App Router, Server Components, Server Actions, data fetching, performance |
| **Django Stack** | `/basic-engineering:django-stack` | Django + DRF patterns — models, views, security, testing, performance |
| **Engineering Foundations** | `/basic-engineering:engineering-foundations` | TDD, domain modeling, code review, requirements, architecture, ADRs |

### Utility Skills

| Skill | Invoke | What It Does |
|---|---|---|
| **Daily Summary** | `/basic-engineering:daily-summary` | Aggregate GitHub + Jira + Slack activity into standup format |
| **Review Learning** | `/basic-engineering:review-learning` | Analyze review feedback patterns, suggest rule improvements |
| **Create User Story** | `/basic-engineering:create-user-story` | Create Jira user stories with structured format |
| **Setup Storybook** | `/basic-engineering:setup-storybook` | Full Storybook setup with stories + deployment |
| **Context Budget** | `/basic-engineering:context-budget` | Audit token consumption and optimize context window usage |
| **Strategic Compaction** | `/basic-engineering:strategic-compaction` | Guide for when/how to compact conversation context |
| **Continuous Learning** | `/basic-engineering:continuous-learning` | Extract reusable patterns as "instincts" with confidence scoring |
| **Autonomous Loops** | `/basic-engineering:autonomous-loops` | 6 loop architectures for automated/multi-agent workflows |

## Agents

| Agent | Model | Purpose |
|---|---|---|
| **planner** | opus | Read-only implementation planning — 2-3 approaches with trade-offs |
| **security-reviewer** | opus | OWASP Top 10 vulnerability scanning, secrets detection |
| **requirements-reviewer** | opus | Adversarial cross-check of code vs acceptance criteria |
| **code-reviewer** | opus | Quality, architecture, naming, security review |
| **test-runner** | sonnet | Run tests, analyze failures, fix and re-run |
| **codebase-explorer** | haiku | Fast codebase research and pattern discovery |
| **ci-watcher** | sonnet | Monitor CI/CD pipelines, analyze failures |

## Rules (15)

Context-triggered rules that activate when matching files are edited:

| Rule | Files | What It Enforces |
|---|---|---|
| **Git Conventions** | _(always on)_ | Branch naming, commit convention (type(scope): desc), PR convention (draft, no force-push) |
| **Use Skills** | _(always on)_ | Route through orchestrators, never raw git/gh commands |
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
| **Shell Safety** | _(always on)_ | No `$()` subshells, no `>` redirection, no `\(.field)` in jq |

## Hooks

Git safety and quality hooks that enforce rules deterministically (not via prompt instructions):

| Hook | Trigger | What It Does |
|---|---|---|
| **block-no-verify** | PreToolUse (Bash) | Blocks `--no-verify` and force pushes to main/master |
| **git-safety** | PreToolUse (Bash) | Blocks `reset --hard`, `clean -f`, `checkout .`, `branch -D main` |
| **sensitive-file-warning** | PreToolUse (Read) | Warns when reading `.env`, `.pem`, `.key`, credentials |
| **auto-format-check** | PostToolUse (Bash) | Detects formatting issues in build/lint output |
| **console-log-detection** | PostToolUse (Write/Edit) | Warns on `console.log`, `debugger`, `import pdb` |
| **cost-tracker** | PostToolUse | Logs tool usage to `.claude/cost-log.jsonl` |
| **session-context** | Session lifecycle | Saves/loads session state for continuity |

## Usage

```bash
# Full AI-DLC lifecycle for a ticket (adaptive — picks phases based on intent)
/basic-engineering:ai-dlc PRT-123

# Full SDLC for a Jira ticket
/basic-engineering:sdlc PRT-123

# Ship current changes through the pipeline
/basic-engineering:ship-n-check

# Run a single stage
/basic-engineering:sdlc-analyze PRT-123
/basic-engineering:sdlc-design PRT-123

# Switch to dev mode (fast coding)
/basic-engineering:mode-dev

# Switch to research mode (exploration, no code changes)
/basic-engineering:mode-research

# Generate daily standup summary
/basic-engineering:daily-summary

# Audit your context budget
/basic-engineering:context-budget

# Extract learnings from current session
/basic-engineering:continuous-learning

# Analyze review feedback patterns
/basic-engineering:review-learning
```

## Opinions

This toolkit reflects opinionated engineering choices:
- TDD with Red-Green-Refactor, 70% coverage target
- Hooks over prompts — deterministic enforcement > prompt adherence
- Thin orchestrator — agents get fresh context windows, orchestrator stays lean
- Adversarial review — assume bugs exist until proven otherwise
- Plans as prompts — execution plans with `read_first`, `acceptance_criteria`, concrete `action`
- Framework-specific patterns: NestJS (DDD + Hexagonal + CQRS), Next.js (App Router + Server Components), Django (DRF + Service Layer)
- AI-DLC: adaptive pipelines based on intent type, AI drives the conversation, traceability end-to-end

Other teams may have different preferences — and that's fine. Fork or build your own toolkit.
