#!/bin/bash
# sensitive-file-warning.sh — PreToolUse hook for Read
# Warns (does not block) when reading files that may contain secrets.

set -euo pipefail

INPUT=$(cat)

# Extract the file path — try jq first, fall back to grep
if command -v jq &>/dev/null; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
else
  FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"file_path"\s*:\s*"//;s/"$//')
fi

if [ -z "${FILE_PATH:-}" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Get just the filename for pattern matching
FILENAME=$(basename "$FILE_PATH")

# Check against sensitive patterns
SENSITIVE=false
REASON=""

case "$FILENAME" in
  .env|.env.*)
    SENSITIVE=true
    REASON="environment variable file"
    ;;
  *credentials*|*credential*)
    SENSITIVE=true
    REASON="credentials file"
    ;;
  *secret*|*secrets*)
    SENSITIVE=true
    REASON="secrets file"
    ;;
  *.pem)
    SENSITIVE=true
    REASON="PEM certificate/key file"
    ;;
  *.key)
    SENSITIVE=true
    REASON="private key file"
    ;;
  id_rsa|id_rsa.*|id_ed25519|id_ed25519.*)
    SENSITIVE=true
    REASON="SSH private key"
    ;;
  *token*|*tokens*)
    SENSITIVE=true
    REASON="token file"
    ;;
esac

# Also check the full path for sensitive directories
if [ "$SENSITIVE" = false ]; then
  case "$FILE_PATH" in
    */.ssh/*)
      SENSITIVE=true
      REASON="SSH directory file"
      ;;
    */.aws/*)
      SENSITIVE=true
      REASON="AWS configuration file"
      ;;
    */.gnupg/*)
      SENSITIVE=true
      REASON="GPG directory file"
      ;;
  esac
fi

if [ "$SENSITIVE" = true ]; then
  if command -v jq &>/dev/null; then
    echo "{\"decision\": \"approve\", \"message\": \"⚠️ Reading sensitive file ($REASON): $FILE_PATH\"}"
  else
    echo "{\"decision\": \"approve\", \"message\": \"⚠️ Reading sensitive file ($REASON): $FILE_PATH\"}"
  fi
else
  echo '{"decision": "approve"}'
fi
