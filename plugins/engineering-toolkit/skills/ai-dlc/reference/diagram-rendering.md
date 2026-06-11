# Plan View — one readable local page at every checkpoint

The design phases write markdown artifacts (`domain-model.md`, `specs.md`,
`flows.md`, ADRs) with Mermaid as text. Reading raw Mermaid across several files
at a checkpoint is slow, and complex graphs render as spaghetti. This protocol
combines the plan's artifacts into **one self-contained HTML page** — prose
rendered to HTML, Mermaid rendered **inline as SVG** right where it sits in the
document — written next to the plan as `plan-view.html` and surfaced at the
checkpoint, instead of asking the user to copy Mermaid into mermaid.live.

**The local `.md` files stay the canonical, version-controlled source of truth.**
`plan-view.html` is a generated *read-view*: disposable, regenerated each phase,
and not where design knowledge lives. This keeps git history, PR review of
design, and offline access intact while giving the user a single readable page.

Rendering is server-side (prose → `marked`, Mermaid → `beautiful-mermaid` with
ELK layout — minimal edge crossings). SVG is embedded inline and its external
font `@import` is stripped, so the page has **no client framework or CDN
dependency** and opens identically offline (a tiny vanilla zoom overlay is the
only script).

## When to run

- **Domain Design** — after writing `domain-model.md`, before the checkpoint. Creates the page.
- **Logical Design** — after writing `specs.md` + `flows.md`, before the checkpoint. Regenerates the same page in place with the new artifacts.

One `plan-view.html` per plan, regenerated in place as phases add artifacts.

## Step 1 — Build the combined page

The builder is at `skills/ai-dlc/scripts/build-plan-view.mjs` within the
engineering-toolkit plugin (from a sibling ai-dlc skill, that's
`../ai-dlc/scripts/build-plan-view.mjs`). `<plugin-root>` below is the
engineering-toolkit plugin directory — the one containing `skills/`.

Pass **every plan artifact that exists so far**, in reading order. Missing files
are skipped with a warning, so it is safe to pass the full list every phase:

```bash
node <plugin-root>/skills/ai-dlc/scripts/build-plan-view.mjs \
  --in docs/<identifier>/prd-plans/domain-model.md \
  --in docs/<identifier>/prd-plans/specs.md \
  --in docs/<identifier>/prd-plans/flows.md \
  --out docs/<identifier>/prd-plans/plan-view.html \
  --title "<identifier> — <short plan name>"
```

- Add `--in` lines for ADRs (`prd-plans/ADR-*.md`) once they exist.
- Each `--in` file becomes a navigable section (titled by its first H1, else its filename). Diagrams render inline in document order.
- The script prints the output HTML path on its last stdout line.
- First run installs `beautiful-mermaid` + `marked` once into `~/.cache/engineering-toolkit-plan-view/` (a few seconds; needs npm registry access). Later runs are instant. If it hangs rather than errors, an npm registry / proxy access issue is the likely cause — say so and stop, don't keep retrying.
- `--theme` defaults to `github-light`; any beautiful-mermaid theme name works.
- **Non-blocking**: if the build fails (e.g. no npm access), note it in one line and proceed to the checkpoint pointing at the raw `.md` artifacts. The plan view is a convenience, never a gate.

## Step 2 — Record the path in state.md

Record the page under a `Plan View` line in `state.md` so later phases regenerate
the same file instead of creating duplicates:

```markdown
## Plan View
- path: docs/<identifier>/prd-plans/plan-view.html
- last rendered: <phase name>
```

## Step 3 — Surface at the checkpoint

The checkpoint message points at the page as the readable view; the local `.md`
files remain the artifacts of record:

```
- View the full plan (prose + diagrams): docs/<identifier>/prd-plans/plan-view.html
```

## Keep the page fresh — rebuild on every plan change

`plan-view.html` must reflect the current plan. Treat the **Activity Log** as the
trigger: **any time you append a state.md Activity Log row that reflects a change
to rendered plan content, rebuild the Plan View** in the same step. That
includes — beyond the two design checkpoints:

- a decision is superseded (Decision Lifecycle: `D-2 superseded by D-3`)
- an artifact the page renders is edited (`domain-model.md`, `specs.md`, `flows.md`)
- an ADR is added, changed, or superseded
- a Red Team loop-back rewrites the design

**The refresh procedure** (idempotent — same file, overwritten):

1. Re-run `build-plan-view.mjs` over the current artifacts → regenerate `plan-view.html` (Step 1).
2. Bump `last rendered` under the `Plan View` line in `state.md`.

Scope and safety:

- **Skip if there's no `Plan View` path yet** (first created in Domain Design) — nothing to rebuild before then.
- **Skip pure-process rows** that don't change rendered content (e.g. "User approved Logical Design v2" with no edits).
- **Non-blocking**: if the build fails, note it in one line, point at the `.md` artifacts, and continue. The `.md` files remain the source of truth, so a stale page is never a correctness risk — only a convenience gap to fix on the next rebuild.

This makes "the page is always current" a cross-phase invariant tied to the
Activity Log, not something each phase re-implements.

## Diagram set by intent

Which diagrams to draw depends on the ticket's **intent type** (set by the Plan
phase — see [Intent Classification](shared.md#intent-classification)). These are
**recommended defaults, not a hard checklist**: start from the set for the
intent, then tailor to the actual feature — add one the feature clearly needs,
drop one that doesn't apply. ai-dlc's pipeline is adaptive; the diagram set is
too. Over-drawing (forcing five diagrams onto a small change) is its own
readability problem — fit the feature.

Each design phase owns part of the set, so a plan's diagrams accrue across the
two checkpoints onto the same page:

- **Domain Design** owns: **state machine(s)** (aggregate lifecycle), **interaction sequence(s)**.
- **Logical Design** owns: **context/system flow**, **data flow**, **error/retry flow**, **ER** (when persistence/schema changes), **before/after structure** (refactor).

Recommended set per intent (only phases that actually run for that intent appear
— a refactor has no Domain Design, a spike has no Logical Design, etc.):

| Intent | Domain Design | Logical Design |
|--------|---------------|----------------|
| **green-field** | state machine(s) for stateful aggregates · key interaction sequence(s) | context/system flow · data flow · ER (if it persists data) · error/retry (if failure paths matter) |
| **brown-field** | state machine (if states change) · integration sequence with existing components | before→after flow of the affected area · data flow (if the data path changes) · error/retry |
| **refactor** | _(phase not run)_ | before/after structure (class or component flowchart) · sequence (only if call paths change) — no domain diagrams unless behaviour changes |
| **performance** | _(phase not run)_ | current vs target flow · sequence highlighting latency hotspots · optional XY chart of before/after metric |
| **spike** | optional concept/context sketch only — no mandate | _(phase not run — spike stops after Domain Design)_ |
| **bug-fix** | _(phase not run)_ | _(phase not run — light pipeline; no design diagrams)_ |

**Multi-intent ticket**: base on the primary intent's set, then add the
secondary intent's signature diagram (e.g. brown-field + bug-fix → before/after
flow plus an expected-vs-actual sequence of the defect path).

**Coverage note at the checkpoint.** Because these are defaults the AI tailors
(not a hard gate), make the choice visible: each design checkpoint includes a
one-line **diagram coverage** note listing the intent's recommended diagrams for
that phase — which were included, and which were dropped *and why*. This keeps an
adaptive set honest without box-ticking. Example:

```
Diagram coverage (green-field · Logical Design): context flow ✓ · data flow ✓ · error/retry ✓ · ER omitted (no schema change)
```

## Keeping diagrams readable

ELK layout removes most edge tangle on its own, but the strongest anti-spaghetti
move is still **several focused diagrams over one mega-graph**. Prefer separate
mermaid blocks per concern (request flow, state machine, error/retry,
domain-event flow) — each renders inline at its place in the document.
