---
name: update-docs
description: "Scan existing documentation for drift against code changes, then make minimal targeted updates. Use when shipping code, after implementation, or to refresh stale docs. Triggers on: 'update docs', 'refresh docs', 'check docs', 'docs are stale'. Also invoked automatically by ship-branch before committing."
argument-hint: '[path to scope docs check, or omit for project-wide]'
model: sonnet
---

> **Recommended model: Sonnet** — Execution-focused doc scanning and editing.

## Mission

Cross-reference code changes against existing project documentation. Find docs that drifted from reality. Make minimal, targeted updates. Never create new docs or rewrite existing ones.

## When This Runs

- **In pipeline**: Called by `ship-branch` before staging files. Doc updates get committed together with code.
- **Standalone**: `/engineering-toolkit:update-docs` for ad-hoc doc refresh.

## Steps

### 1. Get the Diff

Determine what code changed. Detect the default branch first (`master` or `main`):

```bash
# Detect default branch
DEFAULT_BRANCH=$(git rev-parse --abbrev-ref origin/HEAD 2>/dev/null | sed 's|origin/||')
[ -z "$DEFAULT_BRANCH" ] && DEFAULT_BRANCH=$(git branch -r | grep -oE 'origin/(main|master)' | head -1 | sed 's|origin/||')
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}

git diff ${DEFAULT_BRANCH}...HEAD --stat
git diff ${DEFAULT_BRANCH}...HEAD
```

If no diff (e.g., standalone run on the default branch), fall back to:
```bash
git diff HEAD~5 --stat
```

Extract from the diff:
- Files added, modified, or deleted
- Functions/classes/endpoints that changed
- Configuration or environment variable changes
- Module structure changes (new dirs, moved files)

### 2. Scan Existing Docs

Find all documentation files that could be affected:

```bash
# Markdown files in project root and docs/
# Exclude node_modules, dist, .git, and pipeline artifacts (docs/<ticket>/)
```

Use Glob to find:
- `*.md` in project root (README.md, ARCHITECTURE.md, CONTRIBUTING.md, etc.)
- `docs/**/*.md` — but **skip** `docs/<ticket-id>/` directories (pipeline artifacts, not project docs)
- `.env.example` — check for new/removed environment variables

**Exclude from auto-editing** (flag only):
- `CLAUDE.md` — pipeline configuration, risky to auto-edit
- `AGENTS.md` — pipeline configuration, risky to auto-edit
- Generated docs: files in `swagger/`, `typedoc/`, `api-docs/`, or containing `<!-- auto-generated -->` markers
- `CHANGELOG.md` — separate concern

### 3. Cross-Reference Each Doc

For each doc file found, check if it references anything that changed:

| Check | How |
|-------|-----|
| **File paths** | Does the doc mention file paths that were renamed, moved, or deleted? |
| **Function/class names** | Does it reference functions or classes that were renamed or removed? |
| **API endpoints** | Does it list endpoints that changed (path, method, params, response)? |
| **CLI commands** | Does it document commands that changed? |
| **Config/env vars** | Does it reference environment variables that were added or removed? |
| **Module structure** | Does it describe a module layout that changed? |
| **Behavior** | Does it describe behavior that was modified by the diff? |

For each reference found, check if it's still accurate against the current code.

### 4. Update Drifted Docs

For each doc with detected drift:
- Edit only the specific stale sections — don't rewrite the file
- Keep the existing style and formatting
- Don't add new sections, headers, or content beyond fixing the drift
- Don't "improve" wording that isn't wrong

For CLAUDE.md/AGENTS.md — don't edit, just flag:
> **Note**: `CLAUDE.md` references `{thing}` which has changed. Manual review recommended.

### 5. Report

Produce a summary of what was checked and what was updated:

```markdown
## Docs Update Report

### Updated
- `README.md` — Updated API endpoint reference from `/v1/partners` to `/v2/partners` (line 45)
- `.env.example` — Added `REDIS_CLUSTER_URL` (new env var from diff)

### Flagged for Manual Review
- `CLAUDE.md` — References `modules/payout/services/` which was restructured

### No Changes Needed
- `CONTRIBUTING.md` — All references still accurate
- `docs/api-guide.md` — No overlap with diff
```

## Constraints

- **Never create new doc files** — only update existing ones
- **Never rewrite** — minimal, targeted edits to stale sections only
- **Never auto-edit CLAUDE.md or AGENTS.md** — flag drift for manual review
- **Never edit generated docs** — skip swagger, typedoc, auto-generated markers
- **Never edit CHANGELOG** — that's a separate concern
- **Skip if no drift detected** — don't make changes for the sake of it
- If unsure whether something drifted, leave it alone — false positives are worse than missed drift
