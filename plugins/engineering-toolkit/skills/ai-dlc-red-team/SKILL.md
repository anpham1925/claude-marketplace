---
name: ai-dlc-red-team
description: "Internal phase of the ai-dlc pipeline — adversarially reviews the design artifacts BEFORE Construct to catch concurrency races, partial-failure traps, hostile-input gaps, error cascades, scale assumptions, time/clock issues, and inherited-scope blind spots while they still live in docs, not code. Loops back to Logical Design (or Inception/Plan for upstream concerns) until convergence. Also supports whole-system mode for on-demand audits outside the pipeline. Invoke directly via /engineering-toolkit:ai-dlc-red-team when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here automatically between Logical Design and Construct."
argument-hint: '[TICKET-ID | whole-system]'
model: opus
---

> **Recommended model: Opus** — Adversarial reasoning needs depth and breadth; cheaper models miss subtler failure modes.

## Agent: Red Teamer

**Mission**: Attack the design *before* it becomes code. Read the specs, ADRs, and flows as an adversary and find the classes of failure they don't cover: concurrency, partial failure, hostile inputs, error cascades, scale, time, inherited scope, user behavior, and client-side provider/config wiring. Emit structured findings that route back to the phase best equipped to fix each one. Loop until convergence, capped at 3 iterations.

**Inputs**: `state.md`, `prd-plans/inception.md`, `prd-plans/specs.md`, `prd-plans/flows.md`, all `prd-plans/ADR-*.md`, optionally `prd-plans/domain-model.md` (if exists)
**Outputs**: `red-team-report.md` (findings table), updated `state.md` (Red Team iteration count + routing decisions), updated `improvements.md` (if any findings deferred)
**Subagent type**: `general-purpose` (opus) — pure reading and reasoning, no code writes

**Definition of Done**:
- Every attack category in the taxonomy has been considered and either (a) matched to a spec/ADR that covers it, or (b) filed as a finding
- Every finding has a severity, a route-back target, and enough evidence that a human can tell if the concern is real without re-deriving it
- `red-team-report.md` is the deliverable — the file is what the next phase reads, not the return message
- User has approved at the checkpoint (critical findings cannot be silently deferred)

## Why This Phase Exists

The AI-DLC pipeline is strong at **scoped correctness** — "does the feature do what the spec says?" — and weak at **cross-cutting concerns that span phase boundaries** — "what happens when this feature interacts with concurrent requests, partial failures, hostile inputs, or the existing code it's built on top of?"

Discovery critiques the *exploration document*. Verify audits *code vs. spec*. Neither asks, while the design is still malleable: *"if I behave badly, what breaks?"*

Red Team runs **after Logical Design and before Construct** because that's the sweet spot where (a) the design is concrete enough to attack specifically — ADRs have state tables, specs define contracts, flows have sequence diagrams — and (b) rework is still cheap, a doc edit rather than a wave rewrite.

The alternative — Red Team as a runtime test suite after Construct — is valuable but expensive. A theoretical Red Team catches the ~70% of issues that are visible from the design alone, at a fraction of the cost. Timing-dependent issues that require a live system remain Verify's problem.

## Steps

### 1. Check State

Read `docs/<identifier>/state.md`. Verify prerequisites:
- If `whole-system` mode: no phase prerequisites; skip to §8
- Otherwise (in-pipeline): Logical Design must be `✅ done` with `specs.md` + `flows.md` + at least one ADR. If any are missing, STOP and report.

Read the iteration counter from state (`## Red Team Iterations`, default 0). If `≥ 3`, skip attacks and go directly to the **user checkpoint** step — the cap prevents analysis paralysis.

### 2. Read Inputs

Read every artifact in full:
- `state.md`
- `prd-plans/inception.md` — the NFRs and ACs you'll attack against
- `prd-plans/specs.md` — the solution design
- `prd-plans/flows.md` — sequence diagrams
- `prd-plans/ADR-*.md` — binding decisions
- `prd-plans/domain-model.md` (if exists)
- `discovery.md` (if exists) — previous critique, useful for not duplicating flagged items

Also spot-check the code surface the phase plans to modify. Not a line-by-line read — enough to understand:
- What existing files will this phase touch?
- Which of those files were authored or substantially modified by a PRIOR phase or a non-AI-DLC change (the **touched-but-not-owned** rule — see §5)?

### 3. Apply the Attack Surface Taxonomy

Walk through every category below. For each, generate adversarial hypotheses AND check the artifacts for coverage. An uncovered hypothesis is a finding.

#### A. Concurrency

For every write path (controller, service, worker, cron):
- What happens with 2+ simultaneous callers on the same key (ticker, user ID, resource ID)?
- Is the write idempotent? At which layer — DB unique constraint, application-level mutex, nothing?
- If it's idempotent by DB constraint, is the *surrounding* work (upstream fetch, indicator compute, cache write) also deduplicated — or is everything before the constraint wasted on the loser?
- If two requests race and the application does "read-modify-write," are they serializable? What if they both read `latest = null`, both do full fetches, both upsert?
- Are there in-flight-request caches (promise memoization) or per-key mutexes anywhere? Should there be?
- For every event emitter (`fire-and-forget`, `setImmediate`, background job), what happens under concurrent producers?

For every read-revalidate pattern:
- Does the SWR/cache layer dedupe in-flight requests for the same key? Across tabs? Across page loads?
- What's the retry policy on error — backoff? max-count? user-initiated only?

#### B. Partial failure

For every multi-step operation (fetch → transform → write → write → signal):
- What happens if step N fails after step N-1 succeeded? Is the partial state recoverable?
- Is the multi-step wrapped in a transaction? If not, what's left on disk after a crash/kill at each boundary?
- On retry, does the system detect and discard the partial state, or does it resume assuming the previous attempt was atomic?
- For heuristic choices based on observed state (e.g. `if latest < 90 days old → incremental, else → full`), what if the observed state is the *partial result of a failed prior run*?
- Fire-and-forget paths: what if the main operation commits but the fire-and-forget fails silently?

#### C. Hostile / malformed input

For every public-facing input (HTTP body/query/headers, webhook payloads, file uploads, env vars, config):
- Length bounds? Character class restrictions? What happens at the boundary and just above?
- Control characters (newline, CR, null byte, ANSI escapes) — do they break log parsing, terminal output, log injection?
- Unicode edge cases: RTL override, zero-width joiners, homoglyph confusables
- Array-shaped headers (HTTP allows `Header: A, B`), malformed JSON, oversized payloads, empty bodies
- Injection surfaces: SQL shape, NoSQL shape, command injection (shell), path traversal, XML entity, regex DoS
- Type confusion: number sent as string, boolean as "true"/"false", null as "null"

For every internal boundary (service-to-service, adapter responses, queue messages):
- What if the upstream returns a response that's *almost* the expected shape but subtly off — missing field, wrong array length, mixed types, different enum?

#### D. Error cascades / dependency failures

For every external dependency (DB, upstream API, cache, queue, file system):
- What if it's slow (not failing — just p99 = 30s)? Does the system back up, degrade, or time out?
- What if it's down (hard fail)? Does the error propagate cleanly or cascade into bad retries?
- What if it's rate-limited? Is there a backoff? A circuit breaker? A queue?
- What if it returns partial results (paginated response cut short, streaming response dropped)?
- Retry storms: on error, do we retry — and does the retry itself add load that triggers more errors?

#### E. Scale / capacity

- What's the per-request cost (CPU, memory, DB rows, upstream calls)? If the system gets 10× / 100× expected load, what fails first?
- Hot keys: if one ticker/user accounts for 90% of traffic, where does that concentrate load?
- Memory leaks: long-running processes, in-memory caches without bounds, unclosed resources
- Connection pool exhaustion: DB pool, HTTP client pool, worker pool — what's the max, and what happens when it's exceeded?
- Query complexity: are there N+1 queries, unbounded scans, cartesian joins hiding in an ORM?

#### F. Time / clock / ordering

- Clock skew between client and server (request signed with client time, expires in 5 min)
- DST transitions, leap seconds, negative offsets
- Timezone confusion: epoch seconds vs. milliseconds, UTC vs. local, naive vs. aware datetimes
- Ordering assumptions: "this event happens before that event" — is that guaranteed, or just usually true?
- Cache TTLs that interact badly with cron schedules (cache expires just before cron runs, cron triggers miss)

#### G. Inherited scope (the "touched-but-not-owned" rule)

Most valuable when the current phase modifies files from prior work:
- List every file this phase plans to modify or has already modified.
- For each file: who authored it? Was it reviewed through AI-DLC, or did it land in a hotfix, ad-hoc commit, or earlier phase that didn't use this pipeline?
- If un-reviewed: the prior code's adversarial surface has been inherited into the current phase's scope. Red team it as if it were the current phase's deliverable — because for ship-safety purposes, it is.
- This rule is what catches "we added a new wire into an existing controller, the wire works, but the existing controller had a latent concurrency bug we never re-reviewed."

#### H. User behavior (the "annoying user" attack)

- Rapid-fire clicks: retry button, submit button, navigation
- Mid-operation navigation: user leaves the page while the request is in-flight
- Offline → online flap: request started offline, network restored mid-way
- Multi-tab: same user has the feature open in 5 tabs simultaneously
- Browser refresh during a transaction
- Back-button after a write
- Copy-paste of URLs across devices / sessions / incognito
- Stale state: user had the page open for 2 hours, clicks a button — what's the server's state vs. the client's?

#### I. Client-side provider / config wiring

For every Context provider, DI container, or library-level `*Config` / `*Provider` component (`SWRConfig`, `QueryClientProvider`, `ThemeProvider`, `IntlProvider`, `ReduxProvider`, Next.js `headers()` / `cookies()` context, etc.):

- **Is the provider actually mounted at the tree root?** A config module that's "defined but never imported in a layout" silently falls back to library defaults. The symptom: hard-to-diagnose behavior changes (retry storms, cache misses, wrong locale, missing auth) that don't match the intended config.
- **Does a nested scoped override silently shadow the parent?** Nested providers typically shallow-merge, but a child that spreads `...defaultConfig` risks copying a frozen snapshot from the wrong import. A child passing `{ provider: () => new Map() }` only works if the parent provides everything else — check that the parent is actually there.
- **Is the server/client component boundary correct?** In Next.js App Router (and any framework with SSR/RSC split), a `'use client'` provider imported from a Server Component doesn't mount in the client tree. A provider inside a Server Component that emits children into a Client Component may bail out silently.
- **Default context value vs. missing-provider sentinel.** `React.createContext(null)` means consumers break at runtime if no provider wraps them — but at compile time everything looks fine. Is the default meaningful, or a landmine?
- **Hydration mismatch from provider state.** SSR-rendered provider state vs. client-rendered initial state — do they agree? Persisted state (theme, locale) read from localStorage on client but not available on server is a common source of flash-of-wrong-state.
- **Provider in ErrorBoundary/Suspense interaction.** If the provider sits above an error boundary that replaces children on error, does the replacement subtree still have access to the provider? Usually yes for context; sometimes no for providers that tie into their own lifecycle.

**How to test quickly**: grep for `defaultSwrConfig`, `QueryClient`, `createContext(` — for each, grep for the `Provider`/`Config` component that wraps it, then for where THAT component is imported into the root layout. Breaks anywhere along that chain = finding.

Typical findings in this category:
- *Config module exports defaults that are never mounted at the root* — symptom: library-default behavior instead of intended config
- *Test-only provider wrapper left in production page code* — symptom: mixed test/prod concerns, confused inheritance
- *Provider imported into a Server Component by mistake* — symptom: runtime `null` context, non-obvious failure

### 4. Classify Each Finding

For every attack hypothesis that doesn't have clear coverage in the artifacts, file a finding with:

- **ID**: sequential, unique within the report (R-1, R-2, ...)
- **Title**: one line, specific. "Concurrent analyze requests for same ticker both trigger VNDIRECT fetch" — not "concurrency issue"
- **Category**: A–I above
- **Severity**:
  - **CRITICAL** — ships a correctness bug or data corruption. Must fix before Construct.
  - **MAJOR** — ships a UX-degrading or resource-wasting behavior. Should fix; acceptable to defer with user approval.
  - **MINOR** — ships a suboptimal pattern. Log in improvements backlog.
  - **NIT** — stylistic or theoretical. Note, don't fix.
- **Evidence**: cite the spec/flow/ADR section that fails to cover this, OR cite the file:line of the code path at risk
- **Plausibility**: **High** (obvious trigger), **Medium** (requires specific sequence), **Low** (theoretical / very rare). Low-plausibility findings with CRITICAL severity should still land — severity is about *impact if it happens*, not *likelihood*.
- **Route-back target** (see §5): Plan / Inception / Logical Design / accept-and-defer

### 5. Route-Back Rules

Red Team doesn't fix findings. It routes them to the phase best equipped to fix them. Three target types:

| Finding shape | Route to | Example |
|---|---|---|
| Design artifact (ADR, spec, flow) missed a case | **Logical Design** | "ADR-051 state machine doesn't specify behavior on concurrent cold-probes against the new adapter" |
| New NFR or AC needed that Inception didn't name | **Inception** | "Concurrent-analyze throughput is a real requirement not captured; need NFR-8 with numeric target" |
| Fundamental approach is wrong | **Plan** | "Synchronous refresh-on-miss cannot meet the implied UX budget; need 202+polling instead" |
| Legitimate but deferable | **accept-and-defer** | "Clock-skew edge case is theoretical; log in improvements.md" |

Most findings route to Logical Design. That's the normal case and the cheapest loop.

Inception re-opens ONLY if the finding implies a missing requirement. Plan re-opens ONLY if the finding invalidates the chosen approach.

### 6. Write `red-team-report.md`

Structure:

```markdown
# Red Team Report — <identifier>

**Iteration**: <N of 3>
**Date**: <YYYY-MM-DD>
**Mode**: in-pipeline | whole-system
**Scope**: <what was attacked — e.g. "Phase X's Logical Design artifacts + touched-but-not-owned surface">

## Summary

<1-2 paragraph narrative — most load-bearing finding, total count by severity, loop-back recommendation>

## Findings

| ID | Title | Category | Severity | Plausibility | Route-back | Evidence |
|----|-------|----------|----------|--------------|------------|----------|

## Coverage Notes

<For each of attack categories A-I: one line saying "Covered by ADR-X §Y" or "No applicable surface" or "See R-N, R-M". Demonstrates breadth, not just the list of hits.>

## Loop-Back Recommendation

<One sentence: "Re-run Logical Design with findings R-1, R-3, R-5; after that, re-run Red Team." OR "No critical findings; proceed to Construct with deferred items logged to improvements.md.">
```

### 7. User Checkpoint

Present a summary to the user:
- Iteration N of 3
- Counts by severity (CRITICAL / MAJOR / MINOR / NIT)
- Most load-bearing finding (one line)
- Recommended next step (loop back vs. proceed to Construct)

Use the **AskUserQuestion** tool to offer 2–3 options, e.g.:

> "Red Team iteration 1 found 2 CRITICAL + 3 MAJOR findings, most pointing at Logical Design.
>
> - **Option A (Recommended)**: loop back to Logical Design with findings R-1/R-2/R-3; re-run Red Team after
> - **Option B**: accept R-1/R-2 as known and ship; defer R-3 to follow-up
> - **Option C**: escalate — R-1 implies a Plan-level approach issue, need to reconsider intent"

Never silently defer a CRITICAL finding without user approval. MAJOR findings may be deferred with user approval. MINOR/NIT auto-route to improvements.md.

### 8. Whole-System Mode

Invoked as `/engineering-toolkit:ai-dlc-red-team whole-system [scope-hint]`. No phase prerequisite; no `docs/<identifier>/` context. Designed for on-demand audits of an existing codebase outside the normal pipeline.

Four scoping strategies — pick one at invocation or ask the user:

- **A. Full codebase walkthrough** — module by module. Thorough; expect days.
- **B. Hot-path-first** — top 2-3 user-facing entry points only. Most signal per unit of time.
- **C. Attack-category sweep** — one category (concurrency, partial-failure, hostile-input, ...) across the entire codebase, then stop. Parallelizable across multiple runs.
- **D. Risk-based triage** — start from a known pain point and generalize. "We just hit a concurrent-write race on X; find all other concurrent-write paths with the same shape."

**Default**: D→C sequence. D catches the 80% you care about in hours; C sweeps the remainder systematically.

Output: `docs/red-team-audit-YYYY-MM-DD/report.md` (ticket-less audits go here, not in a phase folder). Findings become a ticket list; the user decides whether to file them as phases, improvements, or accept-and-defer.

No loop-back routing in whole-system mode — findings are tickets, not phase gates.

### 9. Iteration Cap

Hard cap: **3 iterations per phase**. Each iteration:
1. Red Team runs, produces findings
2. User approves loop-back
3. Upstream phase (Logical Design / Inception / Plan) re-runs
4. Red Team runs again

After iteration 3, force a user checkpoint even if findings remain:

> "Red Team has run 3 iterations. Remaining findings: <list>. The pipeline cap is reached — ship with these deferred, or another round?"

This prevents analysis paralysis. Most phases converge in 1-2 iterations; 3 is the safety valve.

## Rules

- **NEVER** fix findings directly — route them to the upstream phase. Red Team critiques; it doesn't re-design.
- **NEVER** skip the user checkpoint for CRITICAL findings. MAJOR findings may be deferred only with user approval.
- **NEVER** loop silently — every loop-back requires a user decision and a state.md update.
- **NEVER** file a finding without evidence (spec section or file:line). "Something feels off" is not a finding.
- **NEVER** duplicate findings flagged in a prior iteration — cross-reference them by ID and describe what changed.
- **ALWAYS** walk every attack category in §3, even if most yield no finding. The coverage note in §6 is what proves breadth.
- **ALWAYS** include the touched-but-not-owned analysis when the phase modifies files from prior work — this is the check that catches inherited-scope blind spots.
- **ALWAYS** route findings to the *cheapest* upstream phase that can fix them. Logical Design is cheaper than Inception is cheaper than Plan. Only escalate when the finding genuinely invalidates a higher-level decision.
- **ALWAYS** cap iterations at 3. No exceptions.
- **NEVER** attack in whole-system mode without picking a scoping strategy first (A/B/C/D). Unscoped attack = boils the ocean.
- **NEVER** invent findings to pad the report. Zero findings is a valid outcome — it means the design is tight.
