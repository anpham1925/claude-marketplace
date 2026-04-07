---
paths:
  - "**/*"
---

# Git Conventions (always-on)

These rules apply whenever you create branches, commit, or interact with git — regardless of which skill is active or whether any skill is active at all.

## Branch Naming

**User-provided names take precedence.** If the user gives a specific branch name, use it exactly as-is — do not add prefixes or apply conventions on top.

**Ticket number is recommended.** Ask the user if not provided.

Format: `<ticket-or-feature>` (e.g., `PROJ-740`, `fix-auth-bug`, `add-user-endpoint`)

If a `branchConvention` is set in `${CLAUDE_PLUGIN_DATA}/config.json`, follow it:
- `{ticket}` → `PROJ-123`
- `{type}/{ticket}-{slug}` → `feat/PROJ-123-add-payout-endpoint`

**Branch naming ≠ commit conventions.** Commit types (`feat`, `fix`, `chore`) belong in commit messages, not branch names. Never derive branch prefixes from commit conventions.

**Length limit**: Helm release names = `<repo-name>-<branch-name>` and must be **≤ 53 characters**. Before creating a branch, verify. If too long, shorten the branch name (e.g., `fix/perk-gb-version-attr` instead of `fix-perk-eligibility-growthbook-version-attr`).

## Commit Convention

Format: `<type>: [TICKET] <description>`

| Type | When |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `chore:` | Maintenance, config, dependencies |
| `refactor:` | Code restructuring without behavior change |
| `docs:` | Documentation changes |
| `test:` | Adding or updating tests |

Every commit must include a Co-Authored-By trailer with the model name, e.g.:
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Use `-F` with a temp file for commit messages — write the message to `docs/<identifier>/commit-msg.txt` using the Write tool, then `git commit -F docs/<identifier>/commit-msg.txt`. Avoid `$()` command substitution in commit commands.

## PR Convention

- Always create PRs as `--draft`
- Always use `gh pr create` (not GitHub web UI)
- PR body must have Summary and Test plan sections
- PR title under 70 chars, matches commit convention
- Never force-push. Never push to main/master
- Stage specific files — never use `git add .` or `git add -A`

## Git Safety Rules

- **NEVER** force push to `master`/`main`
- **NEVER** use `git add -A` or `git add .` — stage specific files only
- **NEVER** stage files unrelated to the current task
- **NEVER** commit `.env`, credentials, or secrets
- **NEVER** use `--no-verify` unless user explicitly asks
- **NEVER** amend commits unless user explicitly asks — always NEW commits
- **NEVER** use `$()` or `<()` process substitution in commit commands
- **ALWAYS** create a new branch — never commit directly to `master`/`main`
- **ALWAYS** use `gh pr create` for PRs
