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
- `docs/**/*.md` — but **skip** the exclusions below
- `.env.example` — check for new/removed environment variables
- `mkdocs.yaml` or `mkdocs.yml` — docs site navigation config (if present)

**Canonical current-state docs** (if the project uses the features/ convention):
- `docs/features/<feature>/OVERVIEW.md` — "read this first" current-state doc per feature. When code changes affect a feature, this is the **first place** to check for drift.
- `docs/features/<feature>/architecture.md` — optional deeper domain/design doc
- `docs/features/<feature>/runbook.md` — optional operational reference

These are **long-lived** docs describing what the feature does today — not historical artifacts. Treat drift against them as higher priority than drift against older TDRs.

**Skip entirely** (not project docs):
- `docs/tickets/**` — ticket-scoped, short-lived artifacts (specs.md, state.md, review-feedback.md). These are history-of-this-ticket, not current-state.
- `docs/features/<feature>/history/**` — archived phase TDRs and bug-fix artifacts. Historical snapshots; intentionally not kept in sync with current code.
- Legacy top-level ticket folders (`docs/PROJ-xxx/`, `docs/proj-xxx-*/`) on repos that haven't migrated yet — treat the same as `docs/tickets/**`.

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

**Priority order** when the project uses the `docs/features/` convention:

1. **Feature OVERVIEW.md first** — if the code change touches a feature's module/domain, start with `docs/features/<feature>/OVERVIEW.md`. This is the canonical current-state doc; drift here is high-impact because agents and humans read it first.
2. **Feature architecture.md / runbook.md** — if the change affects architecture or operations, check these too.
3. **Root docs** (README.md, CONTRIBUTING.md, ARCHITECTURE.md) — project-wide references.
4. **Other scattered docs** — anything else in `docs/` that isn't under `tickets/` or `history/`.

**Inferring which feature a code change belongs to**: look at the module path in the diff.
- `modules/<domain>/**` or `apps/api/src/modules/<domain>/**` → likely maps to `docs/features/<matching-feature>/`
- The feature folder name is **not always the same as the domain name**. When the name is non-obvious, scan the feature's `OVERVIEW.md` for a "Key modules" section that lists the actual code paths owned by that feature — use that as the authoritative mapping.
- If you cannot confidently identify the feature folder, flag it in the report rather than guessing.
- Multi-feature changes can legitimately update multiple `OVERVIEW.md` files in the same run.
- **Prefer one feature folder per domain, not per ticket.** If a ticket introduces a new scope that fits inside an existing domain (e.g. a new endpoint for an existing feature), update that feature's OVERVIEW — don't spin up a new `features/<ticket-scoped-name>/` folder. If the project has a `docs/guidelines/DOC_ORGANIZATION.md` or similar "when to create vs extend" document, defer to it.

**Skip**:
- `mkdocs.yaml` / `mkdocs.yml` — handled separately by Step 4. Do not cross-reference or edit it here.
- `docs/tickets/**` and `docs/features/<feature>/history/**` — already filtered in Step 2; do not re-include.

### 4. Update mkdocs.yaml Navigation

If the project has a `mkdocs.yaml` (or `mkdocs.yml`), keep its `nav:` section in sync with doc changes from the diff:

| Change | Action |
|--------|--------|
| **New doc file in `docs/`** | Add a nav entry under the appropriate section. Match the existing naming style (title-cased, descriptive). Place it logically near related entries. |
| **Deleted doc file** | Remove the nav entry that references the deleted path. |
| **Renamed/moved doc file** | Update the path in the existing nav entry. Keep the display title unless the rename implies a title change. |
| **No doc file changes** | Don't touch mkdocs.yaml. |

**Rules:**
- Only modify the `nav:` section — never change `plugins:`, `site_name:`, `repo_url:`, or other top-level keys
- Paths in nav are relative to `docs/` (e.g., a file at `docs/foo/bar.md` is listed as `foo/bar.md`)
- Match the indentation and formatting style of existing nav entries exactly
- If unsure where a new doc belongs in the nav hierarchy, place it at the end of the most relevant existing section

**Preferred nav structure** when the project uses the `docs/features/` + `docs/tickets/` convention:

```yaml
nav:
  - Home: index.md
  - Getting Started: getting-started.md
  - Features:
      - Partner Payouts:
          - Overview: features/partner-payouts/OVERVIEW.md
          - Architecture: features/partner-payouts/architecture.md   # only if file exists
          - Runbook: features/partner-payouts/runbook.md             # only if file exists
          - History:
              - Phase 1 Foundation DB: features/partner-payouts/history/phase-1-foundation-database/TDR.md
              # ... other history entries
      - Coupon Claiming:
          - Overview: features/coupon-claiming/OVERVIEW.md
          # ...
  - Tickets:
      - PROJ-802: tickets/PROJ-802/specs.md
      - PROJ-785: tickets/PROJ-785/specs.md
      # flat list, one entry per ticket, pointing to the primary spec or state doc
  - ADRs: # ...
  - Guidelines: # ...
  - Runbooks: # ...
  - Apps: # ...
```

**Per-feature nav rules**:
- The `Overview` entry is always first and always present (OVERVIEW.md is required for every feature folder)
- `Architecture` and `Runbook` entries are **only added if the corresponding file exists** — don't list empty placeholders
- `History:` section lists archived phase docs and bug-fix artifacts under the feature; entries point to the relevant file inside `history/`
- When adding a new feature folder, insert its section alphabetically under `Features:` unless the existing ordering is deliberate

**Per-ticket nav rules**:
- Each ticket gets a single nav entry under `Tickets:` pointing to its primary doc (usually `specs.md`, fall back to `state.md` or `PRD.md`)
- Do not nest sub-entries for individual ticket artifacts — that noise belongs inside the ticket folder, not in the site nav

### 5. Update Drifted Docs

For each doc with detected drift:
- Edit only the specific stale sections — don't rewrite the file
- Keep the existing style and formatting
- Don't add new sections, headers, or content beyond fixing the drift
- Don't "improve" wording that isn't wrong

For CLAUDE.md/AGENTS.md — don't edit, just flag:
> **Note**: `CLAUDE.md` references `{thing}` which has changed. Manual review recommended.

### 6. Report

Produce a summary of what was checked and what was updated:

```markdown
## Docs Update Report

### Updated
- `README.md` — Updated API endpoint reference from `/v1/partners` to `/v2/partners` (line 45)
- `.env.example` — Added `REDIS_CLUSTER_URL` (new env var from diff)
- `mkdocs.yaml` — Added nav entry for `proj-123-feature/PRD.md`, removed stale entry for deleted `old-feature.md`

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
