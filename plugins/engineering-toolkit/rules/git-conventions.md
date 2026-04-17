---
paths:
  - "**/*"
---

# Git Conventions (always-on)

These rules apply whenever you create branches, commit, or interact with git — regardless of which skill is active or whether any skill is active at all.

## Branch Naming

**User-provided names always take precedence.** If the user gives a specific branch name, use it exactly as-is — do not validate, add prefixes, or apply conventions on top. Skip all naming guidance below.

**When no name is provided**, derive from ticket or context:
- Jira ticket: `PROJ-123`, `PROJ-456-short-desc`
- No ticket: kebab-case description like `fix-auth-bug`, `add-user-endpoint`

**Branch naming ≠ commit conventions.** Commit types (`feat`, `fix`, `chore`) belong in commit messages, not branch names. Never derive branch prefixes from commit conventions.

**Length limit**: Helm release names = `<repo-name>-<branch-name>` and must be **≤ 53 characters**. Before creating a branch, verify. If too long, shorten the branch name.

## Commit Convention

Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

Every commit must include a Co-Authored-By trailer with the model name, e.g.:
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Default Branch Detection

When running `git diff` or `git log` against the default branch, **never hardcode `main` or `master`**. Some repos use `master`, others use `main`. Detect it:

```bash
DEFAULT_BRANCH=$(git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's|origin/||')
[ -z "$DEFAULT_BRANCH" ] && DEFAULT_BRANCH=$(git branch -r | grep -oE 'origin/(main|master)' | head -1 | sed 's|origin/||')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}
```

Then use `git diff ${DEFAULT_BRANCH}...HEAD` instead of hardcoding a branch name.

## PR Convention

- Always create PRs as `--draft`
- Never force-push. Never push to main/master
- Stage specific files — never use `git add .` or `git add -A`
