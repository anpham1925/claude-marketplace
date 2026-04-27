---
name: ship-pr-review
description: "PR review stage — opens PR for review, waits for bots, reads ALL feedback (inline + issue-level + top-level), and addresses it. Use directly for 'check PR comments', 'check PR reviews', 'read PR feedback', 'what did reviewers say'. Also invoked by ship-n-check as the final pipeline stage."
argument-hint: '[ticket-number]'
model: haiku
---

## Purpose

Mark PR ready for review, wait for review workflows, read all feedback, and address it. This stage covers both "Open PR for Review" and "Address Reviews".

## Steps

### Gate Check

Follow the [stage workflow template](../ship-n-check/reference/shared.md#stage-workflow-template). Verify "Staging" is checked.

---

## Open PR for Review

### Mark PR Ready

```bash
gh pr ready
```

### Transition Ticket to In Review

- Use `getTransitionsForJiraIssue` to find the transition ID for "In Review" (or equivalent status)
- Call `transitionJiraIssue` to move the ticket

If the transition fails, warn the user and continue — never block the workflow for a Jira update.

### Discover Review Workflow

Don't hardcode workflow names — discover from `gh pr checks`:

```bash
gh pr checks --json name,state,workflow --jq '.[] | select(.name | test("claude|review|code\\.review|copilot"; "i")) | {name: .name, state: .state, workflow: .workflow}'
```

If no review check appears, the workflow may not trigger for this PR (e.g., markdown-only). Skip to reading comments.

### Watch the Review Workflow

Run each as a separate command — **never use `$()` command substitution**:

```bash
# Find run ID
gh run list --branch "BRANCH_NAME" --workflow "WORKFLOW_NAME" --limit 1 --json databaseId,status

# Watch (blocks until done)
gh run watch RUN_ID --exit-status
```

### Read Review Comments

Fetch from **all three** GitHub comment sources — review bots and humans post to different endpoints:

```bash
# 1. Top-level reviews (approve/request-changes with body)
gh pr view --json reviews --jq '.reviews[] | {author: .author.login, state: .state, body: .body}'

# 2. Inline review comments (code-level, on specific lines)
gh repo view --json nameWithOwner --jq '.nameWithOwner'
gh pr view --json number --jq '.number'
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments --jq '.[] | {author: .user.login, path: .path, line: (.line // .original_line), body: .body}'

# 3. Issue-level comments (general PR comments — bots often post here)
gh api repos/OWNER/REPO/issues/PR_NUMBER/comments --jq '.[] | {author: .user.login, body: .body, created_at: .created_at}'
```

**All three are required.** Missing any source risks reporting "no feedback" when comments exist.

### Gate Write

Check off "Open PR for Review" in `stage-gate.md`.

---

## Address Reviews

### Gate Check

Verify "Open PR for Review" is checked.

### Read All Comments

Re-fetch **all three** comment sources (same commands as "Read Review Comments" above) to catch any new feedback posted since the last read:

1. Top-level reviews: `gh pr view --json reviews`
2. Inline review comments: `gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments`
3. Issue-level comments: `gh api repos/OWNER/REPO/issues/PR_NUMBER/comments`

**All three are required** — review bots often post to issue comments, not inline.

**Sub-gate:** Check off `Read all comments` in stage-gate.md.

### Categorize Feedback

For each comment, **verify the claim before categorizing** — grep the code, check tool schemas, read the docs. Don't assume a reviewer (bot or human) is correct.

- **Actionable** — verified correct, code change needed
- **Incorrect** — verified incorrect, reply with evidence, no code change
- **Debatable** — needs user input
- **Informational** — no action needed

**Sub-gate:** Check off `Categorized: N actionable, N incorrect, N debatable, N informational`.

### Fix Locally (if actionable)

- Convert PR back to draft: `gh pr ready --undo`
- Fix issues locally
- Ask user about debatable items
- Run local checks (lint, type-check, tests)

**Sub-gate:** Check off `Fixed locally + local checks passed`.

### Reply to EVERY Comment on the PR

**ALWAYS reply to every review comment** — both addressed and ignored. Do this AFTER local fixes but BEFORE pushing.

For **inline review comments** (from pulls endpoint):
```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments/COMMENT_ID/replies \
  -X POST \
  -f body='Your reply here'
```

For **issue-level comments** (from issues endpoint):
```bash
gh api repos/OWNER/REPO/issues/PR_NUMBER/comments \
  -X POST \
  -f body='Replying to @AUTHOR: Your reply here'
```

Reply guidelines:
- **Addressed** — explain what was fixed and how
- **Ignored** — explain why
- **Debatable** — explain trade-off, mention user was consulted

**Sub-gate:** Check off `Replied to ALL N comments on PR`.

### Push Fixes (ONLY after replies sub-gate)

**Only after the "Replied to ALL comments" sub-gate is checked:**

Use the Write tool for commit message, then:

```bash
git commit -F docs/<identifier>/commit-msg.txt
git push
```

**Sub-gate:** Check off `Committed and pushed fixes`.

### Loop Back

After pushing fixes → loop back to CI/CD stage (CI/CD → Staging → Open PR → Address Reviews).

### No Actionable Comments

If no actionable comments (all informational/ignored) — replies already posted. No code changes needed — proceed to feedback and gate write.

### Append to Review Feedback

After addressing all comments (whether fixes were needed or not), append a `source: pr-review` entry to `docs/<identifier>/review-feedback.md`. See [shared reference](../ship-n-check/reference/shared.md#review-feedback-format) for the entry format.

Include in the entry:
- Each reviewer comment that was **actionable** → under `AUTO-FIX` with what was changed
- Each **debatable** item → under `NEEDS-INPUT` with the decision made
- Each **informational** comment → under `INFO`

This captures the external reviewer signal for cross-ticket pattern detection.

### GATE: PR Review Feedback Written

Before checking off "Address Reviews" in stage-gate.md, verify:
1. `docs/<identifier>/review-feedback.md` exists
2. It contains a `source: pr-review` entry for this round
3. ALL reviewer comments (actionable, debatable, informational) are documented

**If the file is missing or incomplete, write it NOW.** Do not proceed until this gate passes.

### Gate Write

Check off "Address Reviews" in `stage-gate.md`. Max 3 review-fix iterations — stop and inform user after 3 rounds.

## Review Decision Check

```bash
gh pr view --json reviewDecision --jq '.reviewDecision'
```

Values: `APPROVED`, `CHANGES_REQUESTED`, `REVIEW_REQUIRED`, or empty.

## Rules

- **ALWAYS** check for both human reviews AND bot comments
- **ALWAYS** read inline comments AND issue comments
- **ALWAYS** reply to EVERY review comment — silence is not acceptable
- **NEVER** push code until "Replied to ALL comments" sub-gate is checked
- **NEVER** poll with sleep loops — use `gh run watch`
- **NEVER** dismiss or resolve comments without addressing them
- **NEVER** auto-fix debatable items — ask the user
- **ALWAYS** run local checks after making fixes before pushing
- **NEVER** exceed 3 review-fix iterations — stop and inform user
- **NEVER** complete "Address Reviews" without writing feedback to review-feedback.md — this is a blocking gate
