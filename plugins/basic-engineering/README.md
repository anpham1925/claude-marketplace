# basic-engineering — Engineering Toolkit

An opinionated toolkit for Claude Code covering the full development lifecycle from requirements to deployment.

## Install

```bash
# 1. Add the marketplace
/plugin marketplace add anpham1925/claude-marketplace

# 2. Install the plugin
/plugin install basic-engineering@anpham-marketplace
```

## What's New in v3.0

- **Hooks system** — Git safety, auto-format detection, console.log warnings, cost tracking (hooks-over-prompts philosophy)
- **Language-specific rules** — TypeScript, Python, Go (coding style, patterns, security)
- **Mode switching** — Dev mode (build fast), Research mode (explore first), Review mode (adversarial quality)
- **Framework stacks** — Next.js (App Router, Server Components, Server Actions) + Django (DRF, ORM, Celery)
- **New agents** — Planner (read-only, architecture planning) + Security Reviewer (OWASP Top 10)
- **Context budget analysis** — Audit and optimize token consumption
- **Strategic compaction** — Compact at phase transitions, not arbitrary points
- **Continuous learning** — Extract "instincts" from sessions with confidence scoring
- **Autonomous loop patterns** — 6 architectures from simple pipelines to DAG orchestration

## Skills

### Orchestrators

| Skill | Invoke | What It Does |
|---|---|---|
| **SDLC** | `/basic-engineering:sdlc PRT-123` | 8-stage SDLC pipeline with Jira integration, agent teams, and human checkpoints |
| **Ship & Check** | `/basic-engineering:ship-n-check` | 8-stage git workflow — commit, quality, push, CI/CD, staging, PR review |

### SDLC Stage Skills (standalone)

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

### Ship & Check Stage Skills (standalone)

| Skill | Invoke | What It Does |
|---|---|---|
| **Commit** | `/basic-engineering:snc-commit PRT-123` | Branch creation, staging, commit with conventions |
| **Quality** | `/basic-engineering:snc-quality PRT-123` | Requirements review (blocking) + code quality checks |
| **Push** | `/basic-engineering:snc-push PRT-123` | Push to remote + create draft PR |
| **CI** | `/basic-engineering:snc-ci PRT-123` | 2-phase CI monitoring — tests first, then builds |
| **Staging** | `/basic-engineering:snc-staging PRT-123` | K8s staging verification with port-forwarding |
| **Review** | `/basic-engineering:snc-review PRT-123` | Open PR for review + address feedback |

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

## Rules (13)

Context-triggered rules that activate when matching files are edited:

| Rule | Files | What It Enforces |
|---|---|---|
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

See `hooks/README.md` for installation instructions.

## Usage

```bash
# Full SDLC for a Jira ticket
/basic-engineering:sdlc PRT-123

# Run a single stage
/basic-engineering:sdlc-analyze PRT-123
/basic-engineering:sdlc-design PRT-123

# Ship current changes through the pipeline
/basic-engineering:ship-n-check

# Switch to dev mode (fast coding)
/basic-engineering:mode-dev

# Switch to research mode (exploration, no code changes)
/basic-engineering:mode-research

# Audit your context budget
/basic-engineering:context-budget

# Extract learnings from current session
/basic-engineering:continuous-learning

# Create a Jira user story
/basic-engineering:create-user-story
```

## Opinions

This toolkit reflects opinionated engineering choices:
- TDD with Red-Green-Refactor, 70% coverage target
- Hooks over prompts — deterministic enforcement > prompt adherence
- Thin orchestrator — agents get fresh context windows, orchestrator stays lean
- Adversarial review — assume bugs exist until proven otherwise
- Plans as prompts — execution plans with `read_first`, `acceptance_criteria`, concrete `action`
- Framework-specific patterns: NestJS (DDD + Hexagonal + CQRS), Next.js (App Router + Server Components), Django (DRF + Service Layer)

Other teams may have different preferences — and that's fine. Fork or build your own toolkit.
