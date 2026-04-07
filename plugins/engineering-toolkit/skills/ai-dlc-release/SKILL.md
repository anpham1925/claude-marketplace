---
name: ai-dlc-release
description: "Internal phase of the ai-dlc pipeline — gets code from branch to merged PR by delegating to the existing ship-n-check pipeline. Invoke directly only via /engineering-toolkit:ai-dlc-release when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: sonnet
---

> **Recommended model: Sonnet** — Execution-focused, delegates to ship-* stages.

## Agent: Releaser

**Mission**: Get verified, reviewed code merged by invoking the existing ship-n-check pipeline stages.

**Inputs**: Verified code from Verify phase
**Outputs**: Merged PR, Jira updated
**Delegation**: Invokes existing ship-* stage skills via the Skill tool

## Why This Phase Exists

AI-DLC's Release phase reuses the battle-tested ship-n-check pipeline. There's no need to reinvent branch creation, quality gates, CI/CD monitoring, staging verification, or PR review — those skills already handle it well. This phase is a thin orchestrator that delegates.

## Steps

### Check State

Read `docs/<identifier>/state.md`. Verify that Verify is completed. See [shared reference](../ai-dlc/reference/shared.md) for format.

### Determine Ticket Number

Extract the ticket number from:
1. `state.md` ticket field
2. `$ARGUMENTS` if provided
3. Ask the user if not available

### Delegate to Ship Pipeline

Invoke each ship stage skill sequentially via the Skill tool:

1. **Branch & Commit**: invoke `/engineering-toolkit:ship-branch {ticket}`
2. **Quality Checks**: invoke `/engineering-toolkit:ship-quality {ticket}`
3. **Simplify**: invoke `/simplify`
4. **Push & PR**: invoke `/engineering-toolkit:ship-push-pr {ticket}`
5. **CI/CD**: invoke `/engineering-toolkit:ship-cicd {ticket}`
6. **Staging**: invoke `/engineering-toolkit:ship-staging {ticket}`
7. **PR Review**: invoke `/engineering-toolkit:ship-pr-review {ticket}`

Each ship stage has its own checkpoints and gates. Follow them as defined in the ship-n-check pipeline.

### Post-Release Jira Updates

After the PR is merged:
- Transition ticket to "Done" (use `getTransitionsForJiraIssue` + `transitionJiraIssue`)
- Post final comment with PR link and summary

### Archive Pipeline Artifacts

After merge, separate durable knowledge from ephemeral plumbing:

**Keep** (valuable for future features touching the same area):
- `prd-plans/domain-model.md` — domain concepts, aggregates, business rules
- `prd-plans/specs.md` — design rationale, NFR targets, alternatives rejected
- `prd-plans/flows.md` — architecture flow diagrams
- `prd-plans/fix-report.md` — root cause, fix, regression prevention (bug-fix intents)
- `prd-plans/ADR-*.md` — architectural decision records
- `review-feedback.md` — review findings for cross-ticket pattern detection via `/engineering-toolkit:review-learning`

**Delete** (only useful during the active pipeline):
- `state.md` — pipeline position tracking
- `commit-msg.txt`, `pr-body.md` — temp files

```bash
git rm -f docs/<identifier>/state.md
git rm -f docs/<identifier>/commit-msg.txt docs/<identifier>/pr-body.md
# Keep: docs/<identifier>/prd-plans/
```

Commit: `chore: [TICKET] archive pipeline artifacts, keep design docs`

**Why**: The `prd-plans/` folder preserves *why* decisions were made — ADRs, rejected alternatives, NFR targets, domain model rationale. The code shows *what* exists; these docs show *why* it exists that way. Future features benefit from this context during Inception's code elevation.

### Auto-Trigger Review Learning

After archiving, scan `docs/**/review-feedback.md` (glob across all ticket docs in the repo) to check for accumulated feedback across tickets.

Count the total number of feedback entries across all `review-feedback.md` files. If there are entries from 3+ different tickets, suggest running review learning:

- **If 3+ tickets have feedback**: Ask the user before proceeding:
  > **{N} review feedback entries** found across {M} tickets. There may be recurring patterns worth turning into rules.
  >
  > Would you like me to run review learning now? (`/engineering-toolkit:review-learning`)

  Only invoke `/engineering-toolkit:review-learning` if the user confirms. If declined, move on.
- **If < 3 tickets**: Skip silently — not enough data to detect meaningful cross-ticket patterns.

### Update State

Update `docs/<identifier>/state.md`:
- Mark Release as completed
- Record PR number and merge status

### AI-Initiated Recommendation

After release completes:

> **Release complete.** PR #{number} has been merged.
>
> {If Observe is in the Level 1 Plan:}
> I recommend proceeding to **Observe** to verify the deployment is healthy. I'll check error rates and latency in Honeycomb against the NFR targets from Inception.
>
> {If Observe is NOT in the Level 1 Plan:}
> The AI-DLC pipeline is complete. All {N} acceptance criteria are verified, {N} NFRs addressed, and code is merged.
>
> Shall I {proceed to Observe | wrap up}?

## Rules

- **ALWAYS** delegate to ship-* stage skills — never reimplement shipping logic
- **ALWAYS** follow ship-n-check checkpoints and gates
- **ALWAYS** transition Jira ticket to "Done" after merge
- **ALWAYS** update `docs/<identifier>/state.md`
- **ALWAYS** use AI-initiated recommendation after completion
- If any ship stage fails, follow its error handling (e.g., CI fix-and-retry loop)
