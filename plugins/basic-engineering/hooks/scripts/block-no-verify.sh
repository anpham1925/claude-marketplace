#!/bin/bash
# block-no-verify.sh — PreToolUse hook for Bash
# Blocks git commit --no-verify and git push --force to main/master.

set -euo pipefail

# Read tool input from stdin
INPUT=$(cat)

# Extract the command — try jq first, fall back to grep
if command -v jq &>/dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
else
  COMMAND=$(echo "$INPUT" | grep -o '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//')
fi

# If we couldn't extract a command, approve by default
if [ -z "${COMMAND:-}" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Check for git commit --no-verify or -n (short flag for --no-verify)
# Match patterns: git commit --no-verify, git commit -n, git commit -anm (flags containing n)
if echo "$COMMAND" | grep -qE 'git\s+commit\b.*--no-verify'; then
  echo '{"decision": "block", "reason": "Blocked: git commit --no-verify bypasses pre-commit hooks. Remove --no-verify and let hooks run."}'
  exit 0
fi

if echo "$COMMAND" | grep -qE 'git\s+commit\s+-[a-zA-Z]*n'; then
  echo '{"decision": "block", "reason": "Blocked: git commit with -n flag bypasses pre-commit hooks. Remove the -n flag and let hooks run."}'
  exit 0
fi

# Check for git push --force to main/master
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force(-with-lease)?\b.*\b(main|master)\b'; then
  echo '{"decision": "block", "reason": "Blocked: force push to main/master is destructive. Use a feature branch or create a PR instead."}'
  exit 0
fi

if echo "$COMMAND" | grep -qE 'git\s+push\s+.*-f\b.*\b(main|master)\b'; then
  echo '{"decision": "block", "reason": "Blocked: force push (-f) to main/master is destructive. Use a feature branch or create a PR instead."}'
  exit 0
fi

# Also catch: git push origin main --force (branch before flag)
if echo "$COMMAND" | grep -qE 'git\s+push\s+\S+\s+(main|master)\s+.*--force'; then
  echo '{"decision": "block", "reason": "Blocked: force push to main/master is destructive. Use a feature branch or create a PR instead."}'
  exit 0
fi

if echo "$COMMAND" | grep -qE 'git\s+push\s+\S+\s+(main|master)\s+-f\b'; then
  echo '{"decision": "block", "reason": "Blocked: force push (-f) to main/master is destructive. Use a feature branch or create a PR instead."}'
  exit 0
fi

echo '{"decision": "approve"}'
