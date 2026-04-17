#!/bin/bash
# ship-conventions.sh — PreToolUse hook for Bash
# Reads rules from conventions.json (single source of truth).
# To change a rule, edit conventions.json — not this script.

set -euo pipefail

INPUT=$(cat)

# Locate conventions.json relative to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$SCRIPT_DIR/../conventions.json"

if [ ! -f "$CONFIG" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Extract the command — try jq first, fall back to grep (consistent with other hooks)
if command -v jq &>/dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
else
  COMMAND=$(echo "$INPUT" | grep -o '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//')
fi

if [ -z "${COMMAND:-}" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Early exit: skip all checks for non-git/gh commands
case "$COMMAND" in
  *git\ * | *gh\ *) ;;
  *)
    echo '{"decision": "approve"}'
    exit 0
    ;;
esac

# jq is required for config-driven rules (grep fallback only covers command extraction)
if ! command -v jq &>/dev/null; then
  echo '{"decision": "approve", "message": "ship-conventions hook requires jq for rule evaluation. Rules not enforced."}'
  exit 0
fi

# FIRST_LINE: for matching the command itself (ignores heredoc/PR body content)
# COMMAND: for matching across multiline content (e.g., $() in commit messages)
FIRST_LINE=$(echo "$COMMAND" | head -1)

# Read config once to avoid repeated jq subprocess spawns
CONFIG_DATA=$(cat "$CONFIG")

# Helper: read a config value from pre-loaded config
cfg() {
  echo "$CONFIG_DATA" | jq -r "$1" 2>/dev/null
}

cfg_bool() {
  val=$(echo "$CONFIG_DATA" | jq -r "$1" 2>/dev/null)
  [ "$val" = "true" ]
}

# Helper: emit a block decision with safe JSON encoding
block() {
  jq -n --arg reason "Blocked: $1" '{"decision": "block", "reason": $reason}'
  exit 0
}

# -------------------------------------------------------------------
# 1. Branch name checks — advisory only (not blocking)
# -------------------------------------------------------------------
# Branch naming is guided by skill instructions, not enforced by hooks.
# When the user explicitly provides a branch name, the agent uses it as-is.
# See ship-n-check/reference/shared.md for branch naming conventions.

# -------------------------------------------------------------------
# 2. Commit with $() or <() process substitution
# -------------------------------------------------------------------
if cfg_bool '.commit.blockProcessSubstitution'; then
  if echo "$COMMAND" | grep -qE 'git\s+commit\s.*((-[a-zA-Z]*m\s|--message[= ]).*\$\(|<\()'; then
    block "$(cfg '.commit.processSubstitutionMessage')"
  fi
fi

# -------------------------------------------------------------------
# 3. Commit on protected branch
# -------------------------------------------------------------------
if cfg_bool '.commit.requireFeatureBranch'; then
  if echo "$FIRST_LINE" | grep -qE '^\s*git\s+commit\b'; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    PROTECTED=$(cfg '.commit.protectedBranches // [] | .[]')
    for branch in $PROTECTED; do
      if [ "$CURRENT_BRANCH" = "$branch" ]; then
        block "$(cfg '.commit.featureBranchMessage')"
      fi
    done
  fi
fi

# -------------------------------------------------------------------
# 4. Broad staging — read blockedArgs from config
# -------------------------------------------------------------------
if echo "$FIRST_LINE" | grep -qE 'git\s+add\b'; then
  STAGING_MSG=$(cfg '.staging.blockMessage')
  BLOCKED_ARGS=$(cfg '.staging.blockedArgs // [] | .[]')
  for arg in $BLOCKED_ARGS; do
    case "$arg" in
      .)
        # Match "git add ." — dot must be followed by whitespace or end-of-line
        if echo "$FIRST_LINE" | grep -qE 'git\s+add\s+\.(\s|$)'; then
          block "$STAGING_MSG"
        fi
        ;;
      *)
        # Match flags like -A, --all as word-bounded arguments after git add
        ESCAPED=$(printf '%s' "$arg" | sed 's/[.[\*^$()+?{|]/\\&/g')
        if echo "$FIRST_LINE" | grep -qE "git\s+add\s+[^ ]*${ESCAPED}\b"; then
          block "$STAGING_MSG"
        fi
        ;;
    esac
  done

  # Blocked file patterns (e.g., commit-msg*.txt)
  BLOCKED_FILE_MSG=$(cfg '.staging.blockedFileMessage // empty')
  if [ -n "$BLOCKED_FILE_MSG" ]; then
    while IFS= read -r PATTERN; do
      if echo "$FIRST_LINE" | grep -qE "$PATTERN"; then
        block "$BLOCKED_FILE_MSG"
      fi
    done < <(echo "$CONFIG_DATA" | jq -r '.staging.blockedFilePatterns // [] | .[]')
  fi
fi

# -------------------------------------------------------------------
# 5. PR without --draft
# -------------------------------------------------------------------
if cfg_bool '.pr.requireDraft'; then
  if echo "$FIRST_LINE" | grep -qE 'gh\s+pr\s+create'; then
    if ! echo "$FIRST_LINE" | grep -qE -- '--draft'; then
      block "$(cfg '.pr.draftMessage')"
    fi
  fi
fi

echo '{"decision": "approve"}'
