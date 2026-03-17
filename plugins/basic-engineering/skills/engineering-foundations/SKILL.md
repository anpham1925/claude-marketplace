---
name: engineering-foundations
description: Engineering methodology — TDD, domain modeling, code review, requirements gathering, architecture planning, and ADR writing. Use when writing tests, designing domains, reviewing code, gathering requirements, planning features, or documenting decisions.
model: opus
---

> **Recommended model: Opus** — This skill involves deep reasoning, architecture decisions, or code review.

Opinionated engineering methodology. Before applying any topic, read its reference file in `reference/`.

## Topics

| Topic | When to Use | Reference |
|---|---|---|
| **TDD** | Writing unit tests, e2e tests, fixing failing tests | `reference/tdd.md` |
| **Domain Modeling** | Implementing rich domain models with business rules, state transitions | `reference/domain-model.md` |
| **Code Review** | Reviewing PRs, validating code quality, self-review | `reference/code-review.md` |
| **Requirements** | Gathering requirements, clarifying business logic, defining scope | `reference/requirements.md` |
| **Architecture Planning** | Planning features, making architectural decisions, designing solutions | `reference/architecture.md` |
| **ADR Writing** | Documenting significant architectural decisions | `reference/adr.md` |

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
