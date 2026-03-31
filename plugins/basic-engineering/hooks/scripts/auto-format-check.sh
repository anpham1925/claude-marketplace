#!/bin/bash
# auto-format-check.sh — PostToolUse hook for Bash
# After build/test/lint commands, checks output for formatting issues
# and suggests running the project's formatter.

set -euo pipefail

INPUT=$(cat)

# Extract the command and output
if command -v jq &>/dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
  OUTPUT=$(echo "$INPUT" | jq -r '.tool_output.stdout // empty' 2>/dev/null)
  STDERR=$(echo "$INPUT" | jq -r '.tool_output.stderr // empty' 2>/dev/null)
else
  COMMAND=$(echo "$INPUT" | grep -o '"command"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"command"\s*:\s*"//;s/"$//')
  OUTPUT=""
  STDERR=""
fi

if [ -z "${COMMAND:-}" ]; then
  exit 0
fi

# Only check after build/test/lint commands
IS_RELEVANT=false
case "$COMMAND" in
  *npm\ run\ lint*|*npx\ eslint*|*eslint*) IS_RELEVANT=true ;;
  *npm\ run\ build*|*npm\ run\ test*|*npx\ tsc*) IS_RELEVANT=true ;;
  *yarn\ lint*|*yarn\ build*|*yarn\ test*) IS_RELEVANT=true ;;
  *pnpm\ lint*|*pnpm\ build*|*pnpm\ test*) IS_RELEVANT=true ;;
  *prettier\ --check*|*prettier\ -c*) IS_RELEVANT=true ;;
  *cargo\ clippy*|*cargo\ check*|*cargo\ build*) IS_RELEVANT=true ;;
  *go\ vet*|*golangci-lint*) IS_RELEVANT=true ;;
  *ruff\ check*|*flake8*|*pylint*|*mypy*) IS_RELEVANT=true ;;
esac

if [ "$IS_RELEVANT" = false ]; then
  exit 0
fi

COMBINED="${OUTPUT:-}${STDERR:-}"

# Look for common formatting issue patterns
ISSUES_FOUND=false
SUGGESTIONS=""

if echo "$COMBINED" | grep -qiE 'formatting|format.*error|style.*error|indent.*error|whitespace'; then
  ISSUES_FOUND=true
  SUGGESTIONS="Formatting issues detected in output."
fi

if echo "$COMBINED" | grep -qiE 'prettier.*--write|Run.*prettier|run.*format'; then
  ISSUES_FOUND=true
  SUGGESTIONS="${SUGGESTIONS} Output suggests running a formatter (e.g., prettier --write)."
fi

if echo "$COMBINED" | grep -qiE 'eslint.*--fix|Run.*eslint.*fix|auto-?fix'; then
  ISSUES_FOUND=true
  SUGGESTIONS="${SUGGESTIONS} Output suggests running eslint --fix."
fi

if echo "$COMBINED" | grep -qiE 'cargo fmt|rustfmt'; then
  ISSUES_FOUND=true
  SUGGESTIONS="${SUGGESTIONS} Output suggests running cargo fmt."
fi

if echo "$COMBINED" | grep -qiE 'gofmt|goimports'; then
  ISSUES_FOUND=true
  SUGGESTIONS="${SUGGESTIONS} Output suggests running gofmt."
fi

if echo "$COMBINED" | grep -qiE 'ruff format|black|autopep8|isort'; then
  ISSUES_FOUND=true
  SUGGESTIONS="${SUGGESTIONS} Output suggests running a Python formatter."
fi

if [ "$ISSUES_FOUND" = true ]; then
  echo "⚠️ ${SUGGESTIONS} Consider running the project's formatter before committing."
fi
