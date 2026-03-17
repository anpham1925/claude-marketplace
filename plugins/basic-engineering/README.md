# basic-engineering — Engineering Toolkit

An opinionated toolkit for Claude Code covering the full development lifecycle from requirements to deployment.

## Skills

| Skill | Invoke | What It Does |
|---|---|---|
| **SDLC** | `/basic-engineering:sdlc PRT-123` | 6-stage SDLC with Jira integration, agent teams, and human checkpoints |
| **Ship & Check** | `/basic-engineering:ship-n-check` | 8-stage git workflow — branch, commit, push, PR, CI/CD, staging |
| **NestJS Stack** | `/basic-engineering:nestjs-stack` | NestJS patterns — error handling, config, auth, API design, code structure, logging, TypeORM |
| **Engineering Foundations** | `/basic-engineering:engineering-foundations` | TDD, domain modeling, code review, requirements, architecture planning, ADRs |

## Install

```bash
/plugin install basic-engineering@ap-claude-marketplace
```

## Usage

```bash
# Full SDLC for a Jira ticket
/basic-engineering:sdlc PRT-123

# Ship current changes through the pipeline
/basic-engineering:ship-n-check

# Get NestJS guidance (auto-loads based on context, or invoke directly)
/basic-engineering:nestjs-stack

# Get methodology guidance
/basic-engineering:engineering-foundations
```

## What's Included

### Workflow Skills
- **sdlc**: Analyze -> Design -> Implement -> Test -> Review -> Release
- **ship-n-check**: Branch -> Commit -> Requirements Review -> Quality Checks -> Push -> CI/CD -> Staging -> PR Review

### Coding Pattern Skills
- **nestjs-stack**: Error handling, config, auth, API design, code structure, logging, NestJS domain models, TypeORM migrations, TypeORM queries
- **engineering-foundations**: TDD (Red-Green-Refactor), rich domain modeling, code review process, requirements gathering, architecture planning, ADR writing

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
