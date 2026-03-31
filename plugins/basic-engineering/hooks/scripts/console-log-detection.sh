#!/bin/bash
# console-log-detection.sh — PostToolUse hook for Write|Edit
# Warns if written/edited content contains debug statements.

set -uo pipefail

INPUT=$(cat)

# Extract the content being written or the new_string being edited
CONTENT=""
if command -v jq &>/dev/null; then
  # For Write tool: check content field
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty' 2>/dev/null)
  # For Edit tool: check new_string field
  if [ -z "$CONTENT" ]; then
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty' 2>/dev/null)
  fi
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
else
  # Rough extraction without jq — limited but functional
  CONTENT=$(echo "$INPUT" | grep -o '"content"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"content"\s*:\s*"//;s/"$//')
  if [ -z "$CONTENT" ]; then
    CONTENT=$(echo "$INPUT" | grep -o '"new_string"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"new_string"\s*:\s*"//;s/"$//')
  fi
  FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"file_path"\s*:\s*"//;s/"$//')
fi

if [ -z "${CONTENT:-}" ]; then
  exit 0
fi

# Skip test files — debug statements are expected there
if [ -n "${FILE_PATH:-}" ]; then
  case "$FILE_PATH" in
    *.test.*|*.spec.*|*__tests__*|*__mocks__*|*test_*|*_test.*)
      exit 0
      ;;
  esac
fi

WARNINGS=""

# JavaScript/TypeScript debug statements
if echo "$CONTENT" | grep -qE 'console\.(log|debug|info|warn|error)\('; then
  WARNINGS="${WARNINGS} console.log/debug statement"
fi

if echo "$CONTENT" | grep -qE '\bdebugger\b'; then
  WARNINGS="${WARNINGS}, debugger statement"
fi

# Python debug statements
if echo "$CONTENT" | grep -qE '\bimport\s+pdb\b|\bpdb\.set_trace\(\)'; then
  WARNINGS="${WARNINGS}, Python pdb debugger"
fi

if echo "$CONTENT" | grep -qE '\bbreakpoint\(\)'; then
  WARNINGS="${WARNINGS}, Python breakpoint()"
fi

if echo "$CONTENT" | grep -qE '\bprint\(' && echo "$FILE_PATH" | grep -qE '\.(py)$'; then
  WARNINGS="${WARNINGS}, Python print() statement"
fi

# Ruby debug statements
if echo "$CONTENT" | grep -qE '\bbinding\.pry\b|\bbinding\.irb\b'; then
  WARNINGS="${WARNINGS}, Ruby binding.pry/irb"
fi

if echo "$CONTENT" | grep -qE '\bbyebug\b'; then
  WARNINGS="${WARNINGS}, Ruby byebug"
fi

# Clean up leading comma/space
WARNINGS=$(echo "$WARNINGS" | sed 's/^[, ]*//')

if [ -n "$WARNINGS" ]; then
  echo "⚠️ Debug statement(s) detected: ${WARNINGS}. Remove before committing."
fi
