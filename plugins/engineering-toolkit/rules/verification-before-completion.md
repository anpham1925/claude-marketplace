---
paths:
  - "**/*"
---

# Verification Before Completion — Evidence Before "Done"

Claiming work is complete, fixed, or passing without having just verified it is not efficiency — it is a false statement. This rule is the completion-claim counterpart to [evidence-based reasoning](evidence-based.md): that rule governs *factual* claims; this one governs *success/completion* claims.

## The iron law

**No completion claim without fresh verification evidence from this session.**

If you have not run the verifying command in the current turn, you cannot say the thing it would prove. "Tests pass", "build is green", "the bug is fixed", "the stage is done" — each requires output you produced *now*, not a remembered earlier run, not "should pass", not an agent's self-report.

## The gate (run before any success/completion statement)

1. **Identify** — which command or observation actually proves this claim?
2. **Run** — execute the full command fresh (not a partial or cached run).
3. **Read** — the complete output: exit code, failure count, the specific symptom.
4. **Compare** — does the output actually confirm the claim?
   - No → state the real status *with* the evidence.
   - Yes → state the claim *with* the evidence.
5. **Only then** — make the claim.

Skipping a step is asserting without evidence, not verifying.

## What each claim actually requires

| Claim | Sufficient evidence | NOT sufficient |
|---|---|---|
| Tests pass | Test run this session: 0 failures, with the count | A previous run, "should pass" |
| Lint/type-check clean | Tool output: 0 errors | A partial check, extrapolation |
| Build succeeds | Build command: exit 0 | "Lint passed" (lint ≠ compile) |
| Bug fixed | The original failing symptom now passes | Code changed, assumed fixed |
| Regression test is real | Red→green verified (revert fix → test FAILS → restore → passes) | Test passes once |
| Subagent completed | The diff/artifact shows the change | The agent *reported* success |
| Requirements met | Line-by-line check against the AC list | "Tests pass, so it's done" |

## Rationalizations to reject

| Excuse | Reality |
|---|---|
| "Should work now" | Then running it costs nothing — run it. |
| "I'm confident" | Confidence is not evidence. |
| "Just this once" | There are no exceptions. |
| "The agent said it succeeded" | Verify the diff/artifact independently. |
| "Partial check is enough" | A partial check proves only the part you ran. |
| "Different wording, so the rule doesn't apply" | Spirit over letter — any phrasing that implies success is a claim. |

## Red flags — stop and verify

- About to write "Done", "Fixed", "All passing", "Perfect", "Should be good" — without fresh output.
- About to commit, push, open a PR, or check off a stage gate without running the gate's checks.
- Trusting a subagent's "success" without inspecting the diff/artifact.
- Hedging words ("should", "probably", "seems to") standing in for verification.

## Applies to

Every success, completion, or satisfaction statement — exact phrases, paraphrases, and implications alike — before: committing, pushing, PR creation, checking a stage gate, marking a task complete, moving to the next task, or relaying a subagent's result. In a background session this is also the bar for the `result:` headline.

See also: [evidence-based.md](evidence-based.md) · the `verify` skill (run the app to confirm behaviour) · `engineering-toolkit:ai-dlc-verify` and `engineering-toolkit:ship-quality` (pipeline verification gates).
