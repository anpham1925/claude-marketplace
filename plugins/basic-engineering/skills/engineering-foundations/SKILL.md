---
name: engineering-foundations
description: "TRIGGER when: (1) PROACTIVE — user asks to build, implement, create, or scaffold a feature, module, API, service, or app. Load this skill BEFORE writing production code to ensure TDD, domain modeling, and architecture planning are applied. (2) EXPLICIT — user says 'write tests', 'TDD', 'red-green-refactor', 'design the domain', 'review this code', 'gather requirements', 'plan the architecture', 'write an ADR', or asks about testing strategy, domain modeling, or code review process. Also trigger when user asks 'how should I structure this?' or 'what are the trade-offs?'. (3) CATCH — if you are about to write multiple files of production code without any test files, STOP and load this skill first. DO NOT trigger for: running existing tests (use test-runner agent), NestJS-specific patterns (use nestjs-stack), CI/CD workflows, or trivial one-line changes."
model: opus
---

> **Recommended model: Opus** — This skill involves deep reasoning, architecture decisions, or code review.

Opinionated engineering methodology. Before applying any topic, read its reference file in `reference/`.

## When This Skill Loads Proactively

If this skill was loaded because you're about to implement a feature (not because the user explicitly asked for TDD/testing), follow this checklist:

1. **Before writing production code** — Define acceptance criteria. What does "done" look like?
2. **Write the test first** — Red-green-refactor. The test must fail before you write the implementation.
3. **Design the domain** — If building entities/models, read `reference/domain-model.md`. Avoid anemic models.
4. **Plan the architecture** — If making structural decisions, read `reference/architecture.md`. Present 2-3 options with trade-offs.
5. **After implementation** — Self-review using `reference/code-review.md` checklist.

If the user asks you to "just build it fast", you can streamline — but still write tests alongside, not after.

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

## Gotchas

Common failure points — if Claude keeps hitting these, the skill needs updating:

- **Writing tests after code (Green-Red)** — TDD means Red first. Writing the implementation then adding tests is just "testing", not TDD. The test must fail before you write production code.
- **Testing implementation, not behavior** — `expect(service.processPayment).toHaveBeenCalledWith(...)` tests how, not what. Test the observable outcome: `expect(account.balance).toBe(900)`.
- **Anemic domain models** — Entity with only getters/setters and all logic in services. If `Payout.approve()` doesn't exist but `PayoutService.approvePayout()` does, the domain model is anemic.
- **Architecture decision without trade-offs** — "We should use Event Sourcing" without listing the cons (complexity, eventual consistency, debugging difficulty). Always present 2-3 options with honest trade-offs.
- **Over-engineering for hypothetical requirements** — Adding a plugin system "in case we need it later." Build for current requirements. The right amount of complexity is the minimum needed.
- **Code review scope creep** — Reviewer suggests refactoring unrelated code. Review only what changed. Pre-existing issues go in a separate ticket.
- **Requirements without acceptance criteria** — "Support bulk operations" is not a requirement. "Given 100 payouts, when bulk-approve is called, then all 100 transition to APPROVED within 5 seconds" is.
- **ADR without status** — Every ADR needs a status (Proposed/Accepted/Deprecated/Superseded). An ADR without status is just a document.
