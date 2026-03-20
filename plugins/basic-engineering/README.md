# basic-engineering — Engineering Toolkit

An opinionated toolkit for Claude Code covering the full development lifecycle from requirements to deployment.

## Install

```bash
# 1. Add the marketplace
/plugin marketplace add anpham1925/claude-marketplace

# 2. Install the plugin
/plugin install basic-engineering@anpham-marketplace
```

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

### Utility Skills

| Skill | Invoke | What It Does |
|---|---|---|
| **Create User Story** | `/basic-engineering:create-user-story` | Create Jira user stories with structured format |

### Coding Pattern Skills

| Skill | Invoke | What It Does |
|---|---|---|
| **NestJS Stack** | `/basic-engineering:nestjs-stack` | NestJS patterns — error handling, config, auth, API design, logging, TypeORM |
| **Engineering Foundations** | `/basic-engineering:engineering-foundations` | TDD, domain modeling, code review, requirements, architecture, ADRs |

## Usage

```bash
# Full SDLC for a Jira ticket
/basic-engineering:sdlc PRT-123

# Run a single stage
/basic-engineering:sdlc-analyze PRT-123
/basic-engineering:sdlc-design PRT-123

# Ship current changes through the pipeline
/basic-engineering:ship-n-check

# Run individual ship stages
/basic-engineering:snc-commit PRT-123
/basic-engineering:snc-quality PRT-123

# Create a Jira user story
/basic-engineering:create-user-story
```

## What's Included

### Workflow Skills
- **sdlc**: Analyze -> Design -> Breakdown (optional) -> Implement -> Test -> Verify -> Review -> Release
  - Goal-backward verification (exists/substantive/wired checks)
  - Plans-as-prompts with deep work rules (`read_first`, `acceptance_criteria`, concrete `action`)
  - Thin orchestrator — agents get fresh context windows, orchestrator stays lean
  - Deviation rules — auto-fix bugs, STOP for architectural changes
  - STATE.md for lightweight pipeline tracking (<100 lines)
  - Design revision loop with Plan-Checker agent (max 3 iterations)
  - Per-agent model selection (opus/sonnet/haiku based on task nature)
- **ship-n-check**: Commit -> Requirements Review -> Quality Checks -> Simplify -> Push -> CI/CD -> Staging -> PR Review

### Agents
- **requirements-reviewer**: Cross-checks code changes against acceptance criteria
- **code-reviewer**: Reviews code for quality, architecture, security
- **test-runner**: Runs tests, analyzes failures, fixes and re-runs
- **codebase-explorer**: Fast codebase research and exploration
- **ci-watcher**: Monitors CI/CD pipelines and reports failures

## Opinions

This toolkit reflects opinionated engineering choices:
- DDD + Hexagonal + CQRS architecture
- TDD with Red-Green-Refactor, 70% coverage target
- Pino structured logging (context-first)
- TypeORM for database access
- class-validator + Swagger for API design
- Rich domain models with @nestjs/cqrs

Other teams may have different preferences — and that's fine. Fork or build your own toolkit.
