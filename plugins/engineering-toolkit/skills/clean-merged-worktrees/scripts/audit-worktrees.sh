#!/usr/bin/env bash
# Audit git worktrees across a workspace and classify each by its PR state.
# READ-ONLY: never removes anything. Prints one decision line per worktree.
#
# Output format (pipe-delimited):
#   STATUS|repo|worktree_path|branch|detail
# STATUS is one of:
#   REMOVE     - branch's PR is MERGED and no PR is still OPEN  -> safe to remove
#   KEEP_OPEN  - branch has an OPEN PR                          -> leave
#   KEEP_NOPR  - no PR found (or only closed-unmerged)          -> leave
#
# Usage: audit-worktrees.sh [workspace-root]   (defaults to $PWD)
#
# Requires the GitHub CLI (`gh`) authenticated against an account that can see
# the repos in the workspace. If your private repos live under a non-default
# gh account, switch to it first: `gh auth switch --user <account>`.

set -uo pipefail

ROOT="${1:-$PWD}"

# Find primary repo checkouts: immediate subdirs whose .git is a directory.
# Linked worktrees have .git as a FILE, so they're excluded here and instead
# discovered via `git worktree list` of their primary.
for repo_dir in "$ROOT"/*/; do
  repo_dir="${repo_dir%/}"
  [ -d "$repo_dir/.git" ] || continue
  repo_name="$(basename "$repo_dir")"

  owner_repo="$(cd "$repo_dir" && gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)"

  # Main worktree path = first line of `git worktree list`.
  main_wt="$(git -C "$repo_dir" worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2; exit}')"

  # Walk each worktree (porcelain blocks separated by blank lines).
  git -C "$repo_dir" worktree list --porcelain 2>/dev/null | awk '
    /^worktree /{wt=$2}
    /^branch /{br=$2}
    /^detached/{br="(detached)"}
    /^$/{print wt"\t"br; wt="";br=""}
    END{if(wt!="")print wt"\t"br}
  ' | while IFS=$'\t' read -r wt br; do
    [ -z "$wt" ] && continue
    [ "$wt" = "$main_wt" ] && continue          # never touch the primary checkout

    branch="${br#refs/heads/}"
    if [ -z "$branch" ] || [ "$branch" = "(detached)" ]; then
      echo "KEEP_NOPR|$repo_name|$wt|${branch:-(detached)}|detached or no branch"
      continue
    fi

    if [ -z "$owner_repo" ]; then
      echo "KEEP_NOPR|$repo_name|$wt|$branch|could not resolve repo for gh"
      continue
    fi

    # All PRs whose head == this branch, any state.
    states="$(gh pr list --repo "$owner_repo" --head "$branch" --state all \
              --json number,state,mergedAt 2>/dev/null)"

    if [ -z "$states" ] || [ "$states" = "[]" ]; then
      echo "KEEP_NOPR|$repo_name|$wt|$branch|no PR found"
      continue
    fi

    has_open="$(echo "$states"   | grep -c '"state": *"OPEN"')"
    has_merged="$(echo "$states" | grep -c '"state": *"MERGED"')"
    pr_nums="$(echo "$states" | grep -o '"number": *[0-9]*' | grep -o '[0-9]*' | paste -sd, -)"

    if [ "$has_open" -gt 0 ]; then
      echo "KEEP_OPEN|$repo_name|$wt|$branch|open PR(s) #$pr_nums"
    elif [ "$has_merged" -gt 0 ]; then
      echo "REMOVE|$repo_name|$wt|$branch|merged PR(s) #$pr_nums"
    else
      echo "KEEP_NOPR|$repo_name|$wt|$branch|only closed-unmerged PR(s) #$pr_nums"
    fi
  done
done
