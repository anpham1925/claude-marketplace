#!/bin/bash
# session-context.sh — Helper script for session start/end context management
# Source this script; do not execute it directly.
#
# Usage:
#   source plugins/engineering-toolkit/hooks/scripts/session-context.sh
#   session_start    # Call at the beginning of a session
#   session_end      # Call at the end of a session

set -euo pipefail

SESSION_STATE_DIR=".claude"
SESSION_STATE_FILE="${SESSION_STATE_DIR}/session-state.json"

# Ensure session directory exists
_ensure_session_dir() {
  mkdir -p "$SESSION_STATE_DIR" 2>/dev/null
}

# Load previous session context if it exists
session_start() {
  _ensure_session_dir

  if [ -f "$SESSION_STATE_FILE" ]; then
    echo "--- Previous Session Context ---"

    if command -v jq &>/dev/null; then
      LAST_TIMESTAMP=$(jq -r '.last_updated // "unknown"' "$SESSION_STATE_FILE" 2>/dev/null)
      LAST_BRANCH=$(jq -r '.git_branch // "unknown"' "$SESSION_STATE_FILE" 2>/dev/null)
      LAST_SUMMARY=$(jq -r '.summary // "No summary available"' "$SESSION_STATE_FILE" 2>/dev/null)
      TOOL_COUNT=$(jq -r '.tool_count // 0' "$SESSION_STATE_FILE" 2>/dev/null)

      echo "  Last active: ${LAST_TIMESTAMP}"
      echo "  Branch:      ${LAST_BRANCH}"
      echo "  Tools used:  ${TOOL_COUNT}"
      echo "  Summary:     ${LAST_SUMMARY}"
    else
      echo "  (install jq for detailed session state)"
      cat "$SESSION_STATE_FILE" 2>/dev/null
    fi

    echo "--------------------------------"
  else
    echo "No previous session state found. Starting fresh."
  fi
}

# Save current session summary
# Usage: session_end "Brief summary of what was done"
session_end() {
  _ensure_session_dir

  local SUMMARY="${1:-Session ended}"
  local TIMESTAMP
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Get current git branch
  local GIT_BRANCH
  GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

  # Count tool usage from cost log if available
  local TOOL_COUNT=0
  local COST_LOG="${SESSION_STATE_DIR}/cost-log.jsonl"
  if [ -f "$COST_LOG" ]; then
    TOOL_COUNT=$(wc -l < "$COST_LOG" | tr -d ' ')
  fi

  if command -v jq &>/dev/null; then
    echo "{}" | jq -c \
      --arg ts "$TIMESTAMP" \
      --arg branch "$GIT_BRANCH" \
      --arg summary "$SUMMARY" \
      --argjson count "$TOOL_COUNT" \
      '{last_updated: $ts, git_branch: $branch, summary: $summary, tool_count: $count}' \
      > "$SESSION_STATE_FILE"
  else
    cat > "$SESSION_STATE_FILE" <<ENDJSON
{"last_updated":"${TIMESTAMP}","git_branch":"${GIT_BRANCH}","summary":"${SUMMARY}","tool_count":${TOOL_COUNT}}
ENDJSON
  fi

  echo "Session state saved to ${SESSION_STATE_FILE}"
}
