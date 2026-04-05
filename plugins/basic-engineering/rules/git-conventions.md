---
paths:
  - "**/*"
---

# Git Conventions (always-on)

These rules apply whenever you create branches, commit, or interact with git — regardless of which skill is active or whether any skill is active at all.

## Branch Naming

**Ticket number is recommended.** Ask the user if not provided.

Format: `<ticket-or-feature>` (e.g., `PRT-740`, `fix-auth-bug`, `add-user-endpoint`)

If a `branchConvention` is set in `${CLAUDE_PLUGIN_DATA}/config.json`, follow it:
- `{ticket}` → `PRT-123`
- `{type}/{ticket}-{slug}` → `feat/PRT-123-add-payout-endpoint`

**Length limit**: Helm release names = `<repo-name>-<branch-name>` and must be **≤ 53 characters**. Before creating a branch, verify. If too long, shorten the branch name (e.g., `fix/perk-gb-version-attr` instead of `fix-perk-eligibility-growthbook-version-attr`).

## Commit Convention

Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

Every commit must include a Co-Authored-By trailer with the model name, e.g.:
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## PR Convention

- Always create PRs as `--draft`
- Never force-push. Never push to main/master
- Stage specific files — never use `git add .` or `git add -A`
