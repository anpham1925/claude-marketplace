#!/usr/bin/env bash
# Skill-First Rule — injected into every user prompt to enforce skill usage

cat <<'HOOK_OUTPUT'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"BLOCKING REQUIREMENT — SKILL-FIRST RULE\n\nYou MUST check available skills (listed in system reminders) and invoke the matching Skill tool BEFORE writing any code, creating any files, or making any edits. This is NON-NEGOTIABLE.\n\nSTEPS:\n1. Read the user request\n2. Check the available skills list in system reminders\n3. If a skill matches, invoke it via the Skill tool BEFORE doing anything else\n4. Follow the skill instructions PRECISELY\n5. Only if NO skill matches may you proceed manually\n\nFAILURE TO USE A SKILL WHEN ONE EXISTS IS A VIOLATION."}}
HOOK_OUTPUT
