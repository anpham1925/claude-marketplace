#!/bin/bash
# cost-tracker.sh — PostToolUse hook for all tools
# Appends tool usage to .claude/cost-log.jsonl for cost estimation.

# Don't use set -e here — we never want cost tracking to block anything
set +e

INPUT=$(cat)

# Extract tool name and basic info
TOOL_NAME=""
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if command -v jq &>/dev/null; then
  TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
else
  TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"tool_name"\s*:\s*"//;s/"$//')
fi

# If we can't determine the tool name, silently exit
if [ -z "${TOOL_NAME:-}" ]; then
  exit 0
fi

# Ensure the log directory exists
LOG_DIR=".claude"
LOG_FILE="${LOG_DIR}/cost-log.jsonl"
mkdir -p "$LOG_DIR" 2>/dev/null

# Build the log entry — keep it minimal
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"

if command -v jq &>/dev/null; then
  # Use jq to build proper JSON
  echo "{}" | jq -c \
    --arg ts "$TIMESTAMP" \
    --arg tool "$TOOL_NAME" \
    --arg session "$SESSION_ID" \
    '{timestamp: $ts, tool: $tool, session: $session}' \
    >> "$LOG_FILE" 2>/dev/null
else
  # Manual JSON construction
  echo "{\"timestamp\":\"${TIMESTAMP}\",\"tool\":\"${TOOL_NAME}\",\"session\":\"${SESSION_ID}\"}" \
    >> "$LOG_FILE" 2>/dev/null
fi

# Always exit successfully — cost tracking should never block the user
exit 0
