# Harness Engineering Reference

Based on [Harness Engineering for Coding Agents](https://martinfowler.com/articles/harness-engineering.html).

**Agent = Model + Harness.** The harness is everything except the model — guides that steer before acting, and sensors that observe after acting.

---

## Control Classification

### Guides (Feedforward) — Steer Before Acting

| Control | Category | When Active |
|---|---|---|
| `.claude/rules/*.md` | Maintainability | Always (path-scoped) |
| Skill prompts (phase instructions) | Behaviour | During each phase |
| CLAUDE.md / AGENTS.md | Architecture | Always |
| Plan phase (intent classification) | Behaviour | Start of pipeline |
| Inception (NFRs, risks) | Behaviour | Before design |
| Domain Design (DDD model) | Architecture | Before implementation |
| Logical Design (specs.md) | Architecture | Before implementation |
| Test fixtures rule | Maintainability | During test writing |
| Architecture boundaries rule | Architecture | During implementation |

### Sensors (Feedback) — Observe After Acting

| Control | Type | Category | When Run |
|---|---|---|---|
| `lint --fix` | Computational | Maintainability | After each Green (TDD Validate step) |
| `type-check` | Computational | Maintainability | After each Green (TDD Validate step) |
| `test` (unit) | Computational | Behaviour | During TDD Red/Green |
| `test` (e2e) | Computational | Behaviour | After implementation waves |
| Requirements reviewer agent | Inferential | Behaviour | ship-quality (pre-integration) |
| Code reviewer agent | Inferential | Architecture | ship-quality / ai-dlc-verify |
| CI/CD pipeline | Computational | All | Post-integration |
| Honeycomb Observe phase | Computational | Architecture | Post-deploy (continuous) |

---

## Harness Categories

### Maintainability Harness
**Goal**: Code is readable, consistent, and doesn't rot.

| Aspect | Guide | Sensor |
|---|---|---|
| Naming | `naming.md` rule | Lint (eslint naming rules) |
| Logging | `logging.md` rule | — |
| Imports | `imports.md` rule (repo-level) | Lint (import order) |
| Code style | `typescript-coding-style.md` rule | Lint + Prettier |
| Test quality | `test-fixtures.md` rule | — (mutation testing would fill this gap) |

### Architecture Fitness Harness
**Goal**: System structure stays aligned with intended design.

| Aspect | Guide | Sensor |
|---|---|---|
| Layer boundaries | `architecture-boundaries.md` rule | Import check after each wave |
| Module coupling | `nestjs-stack` skill (code placement tree) | — (dependency metrics would fill this gap) |
| CQRS compliance | Domain Design phase | Code reviewer agent |
| NFR targets | Inception phase (NFR table) | Verify phase + Observe phase |

### Behaviour Harness
**Goal**: Code does what the requirements say.

| Aspect | Guide | Sensor |
|---|---|---|
| Acceptance criteria | Inception artifact (AC list) | Unit tests (TDD) + e2e tests |
| Error handling | `error-handling.md` rule (repo-level) | e2e tests (error paths) |
| Edge cases | Logical Design (specs.md) | e2e tests (boundary values) |
| Requirements alignment | — | Requirements reviewer agent |
| Traceability | Traceability matrix | Verify phase (completeness check) |

---

## The Steering Loop

When an issue recurs across tickets:

```
Issue detected → docs/<identifier>/review-feedback.md → pattern detection
  → 2+ occurrences across tickets? → suggest rule improvement
  → 3+ tickets with feedback? → trigger /engineering-toolkit:review-learning
```

This closes the loop: sensors detect issues → feedback log accumulates → patterns emerge → new guides/sensors are added → fewer issues next time.

---

## Known Gaps

| Gap | Category | What Would Fill It |
|---|---|---|
| No mutation testing | Behaviour | Stryker or similar — validate test quality |
| No dependency coupling metrics | Architecture | Custom script measuring import fan-out |
| No automated layer violation detection | Architecture | Script checking import paths (could automate architecture-boundaries rule) |
| Inferential sensors are expensive | All | Run selectively — not on every change |
| Test quality unvalidated | Behaviour | Approved fixtures help, but mutation testing is the real answer |

---

## Timing: Keep Quality Left

```
Pre-action          During Construction         Pre-integration          Post-integration      Continuous
─────────────────── ─────────────────────────── ──────────────────────── ───────────────────── ──────────
Rules load          TDD: Red → Green → Validate ship-quality:            CI/CD pipeline:       Observe:
Plan classifies     lint + type-check each cycle  Requirements review    Full test suite       Honeycomb
Inception NFRs      Self-correction loop (3x)     Code review agent      Build + deploy        SLO monitoring
Design artifacts    Architecture import check     lint + type-check      SonarCloud            Burn alerts
                    Test fixture enforcement
```

The further left a control runs, the cheaper and faster the fix. Don't wait until CI to catch a lint error.
