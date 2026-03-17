# PR Review Checking

## Purpose

Mark PR ready for review, wait for review bots, check and address feedback — from both human reviewers and review bots.

## Flow

1. **Mark PR ready** — `gh pr ready`
2. **Wait for review workflow** — discover and watch with `gh run watch`
3. **Read all review comments** — from human reviewers and review bots
4. **Categorize feedback** — separate actionable items from informational comments
5. **Address feedback** — fix issues, ask user about debatable items
6. **If actionable** — convert to draft, fix, loop back to Push & PR stage
7. **Push fixes** — commit and push any changes made
8. **Inform the user** — summary of what was addressed

## Commands

### Find PR for Current Branch

```bash
gh pr view --json number --jq '.number'
```

### Check Review Decision Status

```bash
gh pr view --json reviewDecision --jq '.reviewDecision'
```

Possible values: `APPROVED`, `CHANGES_REQUESTED`, `REVIEW_REQUIRED`, or empty (no reviews yet).

### List All Reviews (top-level)

```bash
gh pr view --json reviews --jq '.reviews[] | {author: .author.login, state: .state, body: .body}'
```

### Get Inline Review Comments

`gh pr view` commands use the current branch PR by default. `gh api` commands require OWNER/REPO and PR_NUMBER — get these by running `gh repo view --json nameWithOwner --jq '.nameWithOwner'` and `gh pr view --json number --jq '.number'` separately first.

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments --jq '.[] | {author: .user.login, path: .path, line: (.line // .original_line), body: .body}'
```

### Check for Review Bot Comments

```bash
# Inline review comments from bots
gh api "repos/OWNER/REPO/pulls/PR_NUMBER/comments" --jq '.[] | select(.user.login | test("claude|code\\.review|copilot"; "i")) | {author: .user.login, path: .path, line: (.line // .original_line), body: .body}'

# Top-level review comments from bots
gh pr view --json reviews --jq '.reviews[] | select(.author.login | test("claude|code\\.review|copilot"; "i")) | {state: .state, body: .body}'
```

## Address Feedback

### Step 1: Categorize and Fix Locally

For each review comment:

1. **If actionable fix** — fix the code, run local checks (lint, type-check, tests)
2. **If debatable/unclear** — ask the user before making changes
3. **If informational** — no code change needed
4. **If from a review bot** (Claude, Copilot, etc.) — treat the same as human reviewer feedback

### Step 2: Reply to Every Comment on the PR

**ALWAYS reply to every review comment directly on the PR** — both addressed and ignored. This is mandatory, not optional. Do this AFTER local fixes but BEFORE pushing.

For each comment, reply using `gh api`:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments/COMMENT_ID/replies \
  -X POST \
  -f body='Your reply here'
```

Reply guidelines:
- **Addressed (code changed)** — explain what was fixed and how
- **Ignored with reason** — explain why the feedback was not actioned
- **Debatable** — explain the trade-off, mention that user was consulted
- Keep replies concise but substantive — not just "acknowledged"

### Step 3: Push (only if code was changed)

After fixing code AND replying to all comments, commit and push:

```bash
printf 'fix: [<TICKET>] address PR review feedback\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>\n' > docs/<identifier>/commit-msg.txt
git commit -F docs/<identifier>/commit-msg.txt
git push
```

If no actionable comments (all ignored/informational), replies were already posted — **DONE**.

## Waiting for Review Workflow

**NEVER poll with sleep loops.** Use `gh run watch` to block until the review workflow completes.

### Step 1: Discover the Review Workflow

Don't hardcode workflow names — discover them from `gh pr checks`.
Run each command separately — **never use `$()` command substitution**:

```bash
# Find the review check from PR checks
# If no check appears yet, re-run this command once after a few seconds
gh pr checks --json name,state,workflow --jq '.[] | select(.name | test("claude|review|code\\.review|copilot"; "i")) | {name: .name, state: .state, workflow: .workflow}'
```

If no review check appears, the workflow may not trigger for this PR (e.g., markdown-only changes with path filters). In that case, skip to reading comments directly.

### Step 2: Watch the Review Workflow

Use the workflow name from step 1. Run each as a separate command:

```bash
# Find the run ID using the workflow name from step 1
gh run list --branch "BRANCH_NAME" --workflow "WORKFLOW_NAME" --limit 1 --json databaseId,status

# Watch the run (blocks until done — no polling)
gh run watch RUN_ID --exit-status
```

### Step 3: Read Review Comments

After the workflow completes, read all review comments (see Commands section above).

### No Review Workflow Triggered

If no review check appears (e.g., markdown-only PR with path filters):

1. Check for any human reviews: `gh pr view "$PR_NUMBER" --json reviews`
2. If none -> inform user: "No review workflow triggered and no human reviews"
3. PR is ready — **DONE**

## Rules

- **ALWAYS** check for both human reviews AND bot comments (Claude, Copilot, etc.)
- **ALWAYS** read inline review comments AND issue comments (review bots often post both)
- **ALWAYS** reply to EVERY review comment on the PR — both addressed and ignored (with reasons)
- **NEVER** leave review comments without a reply — silence is not acceptable
- **NEVER** poll with sleep loops — use `gh run watch` to block until review workflows complete
- **NEVER** dismiss or resolve review comments without addressing them
- **NEVER** auto-fix debatable items — ask the user
- **ALWAYS** run local checks after making fixes before pushing
