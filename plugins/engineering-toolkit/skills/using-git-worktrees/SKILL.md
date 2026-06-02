---
name: using-git-worktrees
description: "Use when starting feature work that needs isolation from the current workspace, or before executing an implementation plan — ensures an isolated workspace exists, preferring the harness's native worktree tool and falling back to a manual git worktree only when none is available. Triggers on 'work in a worktree', 'isolate this work', 'set up a worktree', 'start a branch in isolation'."
model: opus
---

# Using Git Worktrees

Do the work in an isolated workspace so the user's current branch and working copy stay untouched. **Detect existing isolation first, then prefer a native tool, then fall back to a manual git worktree. Never fight the harness.**

## Step 0 — Detect existing isolation (do this before creating anything)

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

- **`GIT_DIR != GIT_COMMON`** → you are likely already in a linked worktree. **Submodule guard:** run `git rev-parse --show-superproject-working-tree` — if it returns a path you are in a submodule (treat as a normal repo), not a worktree. If it's empty, you really are in a worktree: **skip to Step 3**, do not nest another worktree.
- **`GIT_DIR == GIT_COMMON`** → normal checkout. If the user hasn't already stated a worktree preference, ask for consent before creating one ("Set up an isolated worktree so your current branch stays clean?"). Honor an existing declared preference without re-asking; if they decline, work in place and skip to Step 3.

## Step 1 — Create the isolated workspace (try in this order)

### 1a. Native worktree tool (preferred)

If the harness provides a worktree mechanism — a tool named `EnterWorktree`, a `WorktreeCreate` hook, a `/worktree` command, or a `--worktree` flag — **use it and skip to Step 3.** Native tools place the directory, create the branch, and clean up automatically. Running `git worktree add` when a native tool exists creates phantom state the harness can't see or remove — this is the single most common mistake.

> In this environment the native tool is **`EnterWorktree`**. Prefer it. (Note: it operates on the session's repository — if the session's working directory is not itself a git repo, EnterWorktree will fail; fall through to 1b.)

### 1b. Manual git worktree (fallback only)

Only if no native tool applies.

**Directory choice** (explicit user preference beats observed state):
1. A worktree directory declared in your instructions → use it.
2. An existing `.worktrees/` (preferred) or `worktrees/` at the repo root → use it (`.worktrees/` wins if both exist).
3. Otherwise default to `.worktrees/` at the repo root.

**Safety — project-local dirs must be git-ignored before use:**
```bash
git check-ignore -q .worktrees || { echo ".worktrees/" >> .gitignore && git add .gitignore && git commit -m "chore: ignore .worktrees"; }
```
Skipping this tracks worktree contents and pollutes the repo.

**Create it:**
```bash
git worktree add ".worktrees/$BRANCH_NAME" -b "$BRANCH_NAME"
cd ".worktrees/$BRANCH_NAME"
```

**Sandbox fallback:** if `git worktree add` fails with a permission/sandbox error, tell the user the sandbox blocked it and you're working in the current directory instead, then continue with Steps 3–4 in place.

## Step 3 — Project setup

Auto-detect and install:
```bash
[ -f package.json ]    && npm install
[ -f pyproject.toml ]  && poetry install 2>/dev/null || { [ -f requirements.txt ] && pip install -r requirements.txt; }
[ -f go.mod ]          && go mod download
[ -f Cargo.toml ]      && cargo build
```

## Step 4 — Verify a clean baseline

Run the project's test command before changing anything (`npm test` / `pytest` / `go test ./...` / `cargo test`).
- **Tests fail** → report the failures and ask whether to proceed or investigate. A dirty baseline makes it impossible to tell your new bugs from pre-existing ones.
- **Tests pass** → report: `Worktree ready at <path>; baseline green (<N> tests); ready to implement <feature>.`

## Quick reference

| Situation | Action |
|---|---|
| Already in a linked worktree | Skip creation (Step 0) |
| In a submodule | Treat as a normal repo (Step 0 guard) |
| Native tool (`EnterWorktree`) available | Use it (Step 1a) |
| No native tool | Manual git worktree (Step 1b) |
| `.worktrees/` and `worktrees/` both exist | Use `.worktrees/` |
| Directory not git-ignored | Add to `.gitignore` + commit first |
| Permission/sandbox error on create | Work in place, tell the user |
| Baseline tests fail | Report + ask before proceeding |

## Never

- Create a worktree when Step 0 shows you're already isolated.
- Use `git worktree add` when a native tool exists — use the native tool.
- Create a project-local worktree without verifying it's git-ignored.
- Skip the baseline test run, or proceed past failing baseline tests without asking.
