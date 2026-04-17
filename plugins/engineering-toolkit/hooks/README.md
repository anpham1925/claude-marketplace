# Hooks — engineering-toolkit

Deterministic guardrails for Claude Code. Hooks enforce rules that prompt instructions alone follow only ~80% of the time.

## Philosophy: Hooks over Prompts

Prompt-based instructions ("never force push to main") rely on the model's compliance. In practice, this works about 80% of the time — the other 20% happens when the model is deep in a complex task, following a chain of reasoning that overrides soft instructions.

Hooks are **deterministic**. They run as shell scripts before or after every tool call. A hook that blocks `git push --force` to main will block it 100% of the time, regardless of what the model is trying to do. Use hooks for rules that must never be violated.

**Use prompts for:** guidance, preferences, style, approach
**Use hooks for:** safety rails, blocking dangerous operations, audit trails

## Hook Inventory

### PreToolUse Hooks (run before the tool executes)

| Script | Matcher | What it does |
|--------|---------|--------------|
| `block-no-verify.sh` | `Bash` | Blocks `git commit --no-verify` and `git push --force` to main/master |
| `git-safety.sh` | `Bash` | Blocks `git reset --hard`, `git clean -f`, `git checkout .`, `git restore .`, `git branch -D main/master`. Warns on force pushes to other branches and rebases onto shared branches |
| `ship-conventions.sh` | `Bash` | Config-driven shipping conventions (reads `conventions.json`). Blocks `$()` in commits, PRs without `--draft`, broad staging, and commits on protected branches. Branch naming is advisory (handled by skill instructions, not hooks) |
| `sensitive-file-warning.sh` | `Read` | Warns when reading files matching sensitive patterns (`.env`, `.pem`, `.key`, `credentials`, `secret`, `token`, `id_rsa`, SSH/AWS/GPG directories) |

### PostToolUse Hooks (run after the tool executes)

| Script | Matcher | What it does |
|--------|---------|--------------|
| `auto-format-check.sh` | `Bash` | After lint/build/test commands, detects formatting issues in output and suggests running the project's formatter |
| `console-log-detection.sh` | `Write\|Edit` | Warns when written/edited code contains debug statements (`console.log`, `debugger`, `binding.pry`, `import pdb`, `breakpoint()`, `print()` in .py files). Skips test files |

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
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/block-no-verify.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/git-safety.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/ship-conventions.sh"
          }
        ]
      },
      {
        "matcher": "Read",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/sensitive-file-warning.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/auto-format-check.sh"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/console-log-detection.sh"
          }
        ]
      },
    ]
  }
}
```

### Using session-context.sh

This is a source-able helper, not a hook. Use it in your own scripts:

```bash
source ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-context.sh

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

To disable a hook, remove its entry from `.claude/settings.json`.

`ship-conventions.sh` is **config-driven** — edit `conventions.json` to change rules without touching the script:

| Config key | What it controls |
|------------|------------------|
| `branch.*` | Advisory only — recommended patterns and guidance message for branch naming. Not enforced by hooks; skill instructions handle this |
| `commit.blockProcessSubstitution` | Block `$()` and `<()` in git commit commands |
| `commit.requireFeatureBranch` | Block commits on protected branches |
| `commit.protectedBranches` | Array of branches where direct commits are blocked |
| `staging.blockedArgs` | Array of `git add` arguments to block (e.g., `["-A", "--all", "."]`) |
| `pr.requireDraft` | Require `--draft` on `gh pr create` |

Other hooks are self-contained scripts — edit them directly.
