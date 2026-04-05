---
name: engineering-foundations
description: Methodology and best-practices reference for Partnership Engineering. Use when the user asks HOW to approach something — testing strategies, TDD patterns, domain modeling with business rules, requirements gathering techniques, architecture planning, or writing ADRs. This is a teaching/guidance skill, not an execution skill. Triggers for "how should I test this", "what's the TDD approach", "explain domain modeling", "write an ADR", "plan this feature's architecture", "what are our testing patterns", "how do we gather requirements". Do NOT use for executing development work (use sdlc) or reviewing existing code changes (use sdlc via its review stage).
model: opus
---

> **Recommended model: Opus** — This skill involves deep reasoning, architecture decisions, or code review.

Partnership Engineering's opinionated methodology. Before applying any topic, read its reference file in `reference/`.

## Topics

| Topic | When to Use | Reference |
|---|---|---|
| **TDD** | Writing unit tests, e2e tests, fixing failing tests | `reference/tdd.md` |
| **Domain Modeling** | Implementing rich domain models with business rules, state transitions | `reference/domain-model.md` |
| **Code Review** | Reviewing PRs, validating code quality, self-review | `reference/code-review.md` |
| **Requirements** | Gathering requirements, clarifying business logic, defining scope | `reference/requirements.md` |
| **Architecture Planning** | Planning features, making architectural decisions, designing solutions | `reference/architecture.md` |
| **ADR Writing** | Documenting significant architectural decisions | `reference/adr.md` |

## Gotchas

Claude-specific failure modes in engineering methodology:

- **Hardcoding dates in tests** — Claude's most persistent bad habit. Always use dynamic date generation (`new Date()`, relative offsets). Never `'2024-01-15'`.
- **Modifying existing tests to make them pass** — When a test fails, Claude's instinct is to "fix" the test. Fix the application code instead. Only modify tests if the requirements changed.
- **Mocking internal modules in e2e tests** — Claude mocks everything for convenience. In e2e tests, only mock external services (payment APIs, auth providers). Internal services, handlers, guards, and repositories must be real.
- **One giant PR with no intermediate commits** — Claude builds everything then commits once. Commit after each TDD Green phase.
- **Designing from scratch when patterns exist** — Claude invents new architectures instead of finding the closest existing implementation in the codebase. Always search for similar code first.
- **Presenting only one option** — Architecture planning requires 2-3 options with trade-offs. Claude tends to present its preferred approach as the only option.
- **ADRs with no "Rejected Alternatives"** — Claude writes ADRs that only describe the chosen approach. The rejected alternatives section is the most valuable part.
- **Skipping the "what's out of scope" section** — Requirements must explicitly define what is NOT being built. Claude omits this, leading to scope creep.

## General Principles

| Principle | What to Do |
|---|---|
| **Clarify Constraints** | Scale? Budget? Existing systems? Timeline? MVP or production? |
| **Prioritize Simplicity** | Simplest solution that works. "The best code is no code." |
| **Security by Design** | Least privilege, encryption, input validation, parameterized queries |
| **Present Options** | 2-3 options with trade-offs. Then recommend one. |

## Quick Decision Guide

```
Need to write/fix tests?
  -> Read reference/tdd.md

Need to design a domain model?
  -> Read reference/domain-model.md

Need to review code?
  -> Read reference/code-review.md

Need to gather or clarify requirements?
  -> Read reference/requirements.md

Need to plan a feature or make architecture decisions?
  -> Read reference/architecture.md

Need to document a significant decision?
  -> Read reference/adr.md
```
