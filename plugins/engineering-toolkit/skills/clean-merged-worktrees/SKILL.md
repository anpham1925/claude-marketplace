---
name: clean-merged-worktrees
description: Clean up git worktrees across a multi-repo workspace whose PRs are already merged. For each worktree it checks the branch's PR state on GitHub, removes the worktree only if the PR is merged, and leaves it if the PR is open or no PR exists. Use when the user says "clean up worktrees", "remove merged worktrees", "tidy worktrees", or wants to prune finished work.
argument-hint: "[workspace-root] (optional, defaults to current dir)"
allowed-tools: Bash, Read
---

Clean up finished git worktrees safely: remove a worktree **only** when its branch's PR is merged. Never touch a worktree with an open PR, no PR, or a primary repo checkout.

## Procedure

### 1. Audit (read-only)

Run the bundled audit script against the workspace root (default `$PWD`, or `$ARGUMENTS` if provided). The script lives in this skill's `scripts/` dir — invoke it by its absolute path under the plugin root:

```bash
bash <PLUGIN_ROOT>/skills/clean-merged-worktrees/scripts/audit-worktrees.sh $ARGUMENTS
```

It discovers every repo's worktrees, checks each branch's PR state via `gh`, and prints one decision line per worktree:

- `REMOVE|repo|path|branch|detail` — PR merged, no open PR → candidate for removal
- `KEEP_OPEN|...` — branch has an open PR → leave
- `KEEP_NOPR|...` — no PR / only closed-unmerged / detached → leave

The script is read-only and never deletes anything. It requires `gh` authenticated against an account that can see the workspace repos — if your private repos live under a non-default gh account, switch to it first (`gh auth switch --user <account>`).

### 2. Show the plan

Present a short table of what will be removed (REMOVE lines) and what will be kept (KEEP_*), with the PR numbers, **before** removing anything.

### 3. Remove merged worktrees (safe-by-default)

For each `REMOVE` line, attempt a non-force removal first:

```bash
git -C <repo_dir> worktree remove <worktree_path>
```

If it succeeds, it's gone. If it fails with `contains modified or untracked files`, **do not blindly force**. Inspect what's dirty:

```bash
git -C <worktree_path> status --short
```

Then decide:
- **Only throwaway artifacts** — `node_modules`, `.claude/`, `docs/<ticket>/` scratch files (commit-msg/PR-body drafts), `*.cache` / `.phpunit.result.cache`, fetched `charts/`, build output → safe to force-remove:
  ```bash
  git -C <repo_dir> worktree remove --force <worktree_path>
  ```
- **Real uncommitted source changes** (modified tracked files, or untracked source under `src/`/`app/`/etc.) → **STOP**. Do not remove. Surface it to the user and ask, since the branch being merged doesn't guarantee that local work was captured.

### 4. Verify and report

Re-list worktrees per repo to confirm:

```bash
git -C <repo_dir> worktree list
```

Optionally `git -C <repo_dir> worktree prune` to clean stale admin entries. Then report: count removed, count kept (with reasons), and any worktrees skipped because they held real uncommitted work.

## Rules

- **NEVER** remove a primary repo checkout — the audit script already excludes it (a repo's main worktree). Note some repos sit on a non-`master`/`main` branch as their main checkout; that's still primary, leave it.
- **NEVER** force-remove a worktree with real uncommitted source — only force when the dirty files are pure artifacts.
- **NEVER** remove a worktree whose branch has an open PR or no PR.
- A branch can match multiple PRs (e.g. a coincidentally-reused name with an old merged PR). The audit rule is: any **open** PR → keep; else any **merged** PR → remove. The script already encodes this.
- Always show the plan before removing.
