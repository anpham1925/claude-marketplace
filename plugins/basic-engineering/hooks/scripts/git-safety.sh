#!/bin/bash
# git-safety.sh — PreToolUse hook for Bash
# Blocks destructive git operations that can cause data loss.

set -euo pipefail

INPUT=$(cat)

# Extract the command
if command -v jq &>/dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
else
  COMMAND=$(echo "$INPUT" | grep -o '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//')
fi

if [ -z "${COMMAND:-}" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# --- BLOCK: git reset --hard ---
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  echo '{"decision": "block", "reason": "Blocked: git reset --hard discards all uncommitted changes permanently. Use git stash or create a backup branch first."}'
  exit 0
fi

# --- BLOCK: git clean -f (force clean untracked files) ---
if echo "$COMMAND" | grep -qE 'git\s+clean\s+-[a-zA-Z]*f'; then
  echo '{"decision": "block", "reason": "Blocked: git clean -f permanently deletes untracked files. Review untracked files with git clean -n first."}'
  exit 0
fi

# --- BLOCK: git checkout . (discard all working tree changes) ---
if echo "$COMMAND" | grep -qE 'git\s+checkout\s+\.\s*$'; then
  echo '{"decision": "block", "reason": "Blocked: git checkout . discards all working tree changes. Use git stash to preserve your changes."}'
  exit 0
fi

# --- BLOCK: git restore . (discard all working tree changes) ---
if echo "$COMMAND" | grep -qE 'git\s+restore\s+\.\s*$'; then
  echo '{"decision": "block", "reason": "Blocked: git restore . discards all working tree changes. Use git stash to preserve your changes."}'
  exit 0
fi

# --- BLOCK: git branch -D on main/master ---
if echo "$COMMAND" | grep -qE 'git\s+branch\s+-D\s+(main|master)\b'; then
  echo '{"decision": "block", "reason": "Blocked: deleting main/master branch is destructive and likely unintended."}'
  exit 0
fi

# --- WARN: git push --force (not to main/master, those are blocked by block-no-verify.sh) ---
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force\b|git\s+push\s+.*-f\b'; then
  # main/master force pushes are already blocked by block-no-verify.sh
  # Warn on force push to any other branch
  if ! echo "$COMMAND" | grep -qE '\b(main|master)\b'; then
    echo "{\"decision\": \"approve\", \"message\": \"⚠️ Force push detected. This rewrites remote history. Make sure this is intentional.\"}"
    exit 0
  fi
fi

# --- WARN: git rebase on shared branches ---
if echo "$COMMAND" | grep -qE 'git\s+rebase\s+(origin/)?(main|master|develop)\b'; then
  echo "{\"decision\": \"approve\", \"message\": \"⚠️ Rebasing onto a shared branch. This is usually fine for local branches, but avoid rebasing commits that have already been pushed.\"}"
  exit 0
fi

echo '{"decision": "approve"}'
