# Hooks — engineering-toolkit

Deterministic guardrails for Claude Code. Hooks enforce rules that prompt instructions alone follow only ~80% of the time.

## Philosophy: Hooks over Prompts

Prompt-based instructions ("never force push to main") rely on the model's compliance. In practice, this works about 80% of the time — the other 20% happens when the model is deep in a complex task, following a chain of reasoning that overrides soft instructions.

Hooks are **deterministic**. They run as shell scripts before or after every tool call. A hook that blocks `git push --force` to main will block it 100% of the time, regardless of what the model is trying to do. Use hooks for rules that must never be violated.

**Use prompts for:** guidance, preferences, style, approach
**Use hooks for:** safety rails, blocking dangerous operations, audit trails

## Hook Inventory

### UserPromptSubmit Hooks (run when user submits a prompt)

| Script | Matcher | What it does |
|--------|---------|--------------|
| `skill-first.sh` | (all prompts) | Injects a blocking requirement to check and invoke matching skills before writing code |

### PreToolUse Hooks (run before the tool executes)

| Script | Matcher | What it does |
|--------|---------|--------------|
| `block-no-verify.sh` | `Bash` | Blocks `git commit --no-verify` and `git push --force` to main/master |
| `git-safety.sh` | `Bash` | Blocks `git reset --hard`, `git clean -f`, `git checkout .`, `git restore .`, `git branch -D main/master`. Warns on force pushes to other branches and rebases onto shared branches |
| `sensitive-file-warning.sh` | `Read` | Warns when reading files matching sensitive patterns (`.env`, `.pem`, `.key`, `credentials`, `secret`, `token`, `id_rsa`, SSH/AWS/GPG directories) |

### PostToolUse Hooks (run after the tool executes)

| Script | Matcher | What it does |
|--------|---------|--------------|
| `auto-format-check.sh` | `Bash` | After lint/build/test commands, detects formatting issues in output and suggests running the project's formatter |
| `console-log-detection.sh` | `Write\|Edit` | Warns when written/edited code contains debug statements (`console.log`, `debugger`, `binding.pry`, `import pdb`, `breakpoint()`, `print()` in .py files). Skips test files and markdown files |

### Helpers

| Script | What it does |
|--------|--------------|
| `session-context.sh` | Source-able helper for session start/end. Loads previous session state from `.claude/session-state.json` on start, saves summary on end |

## Installation

Copy the relevant hook entries from `hooks.json` into your project's `.claude/settings.json`:

```bash
# View the hook configuration
cat plugins/engineering-toolkit/hooks/hooks.json
```

Then merge the `hooks` key into your `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash plugins/engineering-toolkit/hooks/scripts/skill-first.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "bash plugins/engineering-toolkit/hooks/scripts/block-no-verify.sh"
      },
      {
        "matcher": "Bash",
        "command": "bash plugins/engineering-toolkit/hooks/scripts/git-safety.sh"
      },
      {
        "matcher": "Read",
        "command": "bash plugins/engineering-toolkit/hooks/scripts/sensitive-file-warning.sh"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "command": "bash plugins/engineering-toolkit/hooks/scripts/auto-format-check.sh"
      },
      {
        "matcher": "Write|Edit",
        "command": "bash plugins/engineering-toolkit/hooks/scripts/console-log-detection.sh"
      }
    ]
  }
}
```

### Using session-context.sh

This is a source-able helper, not a hook. Use it in your own scripts:

```bash
source plugins/engineering-toolkit/hooks/scripts/session-context.sh

# At session start — prints previous session context
session_start

# At session end — saves current state
session_end "Implemented auth module and wrote tests"
```

## Dependencies

- **Required:** `bash` (v4+)
- **Recommended:** `jq` (for reliable JSON parsing; all scripts degrade gracefully without it)

## Hook Response Format

PreToolUse hooks communicate decisions via JSON on stdout:

- **Approve:** `{"decision": "approve"}`
- **Approve with warning:** `{"decision": "approve", "message": "warning text"}`
- **Block:** `{"decision": "block", "reason": "explanation"}`

PostToolUse hooks print warnings/suggestions as plain text to stdout. Empty output means no issues.

## Customization

Each script is self-contained. To disable a hook, remove its entry from `.claude/settings.json`. To customize behavior, edit the script directly — they are intentionally small and readable.
