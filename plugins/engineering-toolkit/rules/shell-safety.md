---
paths:
  - "**/*"
---

# Shell Command Safety

When running shell commands, NEVER use patterns that trigger permission prompts. This is a hard rule — no exceptions.

## Forbidden Patterns

| Pattern | Why It Triggers | Safe Alternative |
|---|---|---|
| `\(.field)` in jq | Looks like `$()` command substitution | Use object syntax: `{key: .field}` |
| `\n` in jq strings | Escape sequence in quoted context | Use object output or `--jsonlines` |
| `$()` subshells | Actual command substitution | Run commands separately, copy values manually |
| `> file` output redirection | Writes to filesystem | Use the Write tool instead |
| `#` in heredocs | Looks like comment injection | Use the Write tool instead |
| `echo "..."` in chained commands | Quoted characters in flag names | Run commands separately, no echo separators |
| `printf ... > file` or `echo > file` | Output redirection to filesystem | Use the Write tool instead, then reference the file |

## jq Examples

```bash
# WRONG — triggers permission prompt
gh api repos/OWNER/REPO/pulls/1/comments --jq '.[] | "\(.path):\(.line)\nBODY: \(.body)"'

# CORRECT — object syntax, no permission prompt
gh api repos/OWNER/REPO/pulls/1/comments --jq '.[] | {path: .path, line: (.line // .original_line), body: .body}'
```

## General Rule

If a command needs string interpolation, escape sequences, or subshells — break it into multiple simple commands and handle formatting in your response, not in the shell.
