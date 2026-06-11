#!/bin/bash
# worktree-fetch-default.sh — PreToolUse hook for EnterWorktree
#
# Ensures the local origin/<default-branch> ref is fresh BEFORE EnterWorktree
# branches from it. EnterWorktree (fresh mode) branches from the *locally-cached*
# origin ref and does NOT fetch first — so if the clone is behind remote, the new
# worktree is based on a stale base and anything merged in the gap becomes a
# guaranteed merge conflict. This hook closes that window.
#
# Best-effort and non-blocking: a fetch failure (offline, no remote, etc.) must
# NEVER block worktree creation. Always exits 0 with no stdout (= no decision,
# normal permission flow proceeds).

set -uo pipefail

INPUT=$(cat)

# --- Extract cwd from the hook payload (jq if available, grep fallback) ---
if command -v jq &>/dev/null; then
  CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
else
  CWD=$(echo "$INPUT" | grep -o '"cwd"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"cwd"[[:space:]]*:[[:space:]]*"//;s/"$//')
fi
[ -z "${CWD:-}" ] && CWD="$PWD"

# --- Resolve the git repo containing cwd; if none, there is nothing to fetch ---
REPO=$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null) || exit 0

# --- Determine the default branch: main → master → remote HEAD ---
if git -C "$REPO" show-ref --verify --quiet refs/remotes/origin/main; then
  BRANCH=main
elif git -C "$REPO" show-ref --verify --quiet refs/remotes/origin/master; then
  BRANCH=master
else
  BRANCH=$(git -C "$REPO" remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p' | head -1)
fi
[ -z "${BRANCH:-}" ] && exit 0

# --- Fetch the latest default branch so EnterWorktree branches from the true tip ---
# Best-effort only — failure must not block worktree creation.
git -C "$REPO" fetch origin "$BRANCH" >/dev/null 2>&1 || true

exit 0
