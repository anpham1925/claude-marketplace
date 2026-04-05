# Ship & Check Shared Reference

Cross-cutting concerns shared by all ship-n-check stage skills.

---

## Working Directory

All temporary and generated files for this workflow are stored under `docs/<identifier>/` in the repo root:
- Use the ticket number if available (e.g., `docs/PRT-123/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/`)

Create the directory if it doesn't exist. Files stored here:

**Artifacts (commit into PR):**
- `stage-gate.md` — stage completion checklist
- `review-feedback.md` — cumulative review feedback log
- `prd-plans/specs.md`, `prd-plans/flows.md` — design documents

**Temp working files (do NOT commit):**
- `commit-msg.txt` — temp commit message file (used by `git commit -F`)
- `pr-body.md` — temp PR body file (used by `gh pr create --body-file`)

---

## Branch Naming

See [SDLC shared reference](../../sdlc/reference/shared.md#git-branch-naming) for branch naming convention and Helm length limit.

---

## Commit Convention

Format: `[action]: [TICKET] message` (ticket optional if no ticket system)

| Action      | When                                       |
| ----------- | ------------------------------------------ |
| `feat:`     | New feature                                |
| `fix:`      | Bug fix                                    |
| `chore:`    | Maintenance, config, dependencies          |
| `refactor:` | Code restructuring without behavior change |
| `docs:`     | Documentation changes                      |
| `test:`     | Adding or updating tests                   |

Always include `Co-Authored-By` tag. Use `-F` with a temp file for commit messages (avoid `$()` command substitution).

---

## PR Rules

- **Always** create PRs as draft (`--draft` flag)
- **Always** use `gh pr create` (not GitHub web UI)
- PR body must have Summary and Test plan sections
- PR title under 70 chars, matches commit convention

---

## Git Rules

- **NEVER** force push to `master`/`main`
- **NEVER** use `git add -A` or `git add .` — stage specific files only
- **NEVER** stage files unrelated to the current task
- **NEVER** commit `.env`, credentials, or secrets
- **NEVER** use `--no-verify` unless user explicitly asks
- **NEVER** amend commits unless user explicitly asks — always NEW commits
- **NEVER** use `$()` or `<()` process substitution in commit commands — write the message to `docs/<identifier>/commit-msg.txt` using the Write tool, then `git commit -F docs/<identifier>/commit-msg.txt`
- **ALWAYS** create a new branch — never commit directly to `master`/`main`
- **ALWAYS** use `gh pr create` for PRs

---

## Stage Gate Protocol

Every stage writes a completion marker to `docs/<identifier>/stage-gate.md`. Every stage verifies the previous marker exists before starting.

**If the previous gate is missing, STOP and complete the missing stage first.**

### Gate Format

```markdown
# Stage Gate — <identifier>

- [x] **Branch & Commit** — committed at <timestamp>
- [x] **Requirements Review** — passed at <timestamp>
- [x] **Local Quality** — lint/types/tests clean at <timestamp>
- [x] **Simplify** — reviewed at <timestamp>
- [x] **Push & PR** — PR #<number> created at <timestamp>
- [x] **CI/CD (tests)** — all test jobs passed at <timestamp>
- [x] **CI/CD (build/deploy)** — all jobs passed at <timestamp>
- [x] **Staging** — verified at <timestamp>
- [x] **Open PR for Review** — marked ready at <timestamp>
- [x] **Address Reviews** — completed at <timestamp>
```

### Gate Rules

- **Before starting any stage**: Read `stage-gate.md`, verify previous stage is checked off
- **After completing any stage**: Add/update checkbox entry with brief note
- Use the Write or Edit tool — never raw shell commands

### Address Reviews Sub-Gates

```markdown
- [x] **Address Reviews** — completed at <timestamp>
  - [x] Read all comments (inline + issue-level + top-level reviews)
  - [x] Categorized: <N> actionable, <N> debatable, <N> informational
  - [x] Fixed locally + local checks passed
  - [x] Replied to ALL <N> comments on PR
  - [x] Committed and pushed fixes
```

**The "Replied to ALL comments" sub-gate MUST be checked before "Committed and pushed fixes".**

### Resume Flow

When resuming (no changes to commit), start the gate file from the appropriate stage:

```markdown
# Stage Gate — <identifier> (resumed)

- [x] **Branch & Commit** — skipped (already on branch, nothing to commit)
- [ ] **CI/CD (tests)** — ...
```

---

## Review Feedback Format

Review feedback is written to **two locations** — a per-ticket ephemeral log and a persistent cross-ticket log:

| Location | Purpose | Lifecycle |
|----------|---------|-----------|
| `docs/<identifier>/review-feedback.md` | Pipeline-scoped log for the current ticket | Deleted after merge |
| `PERSISTENT_FEEDBACK_FILE` (see below) | Cross-ticket learning log for pattern detection | Survives merges, accumulates across tickets |

### Persistent Feedback File Location

The persistent file lives in the **Claude Code project memory directory** — outside the repo, never committed:

```
${CLAUDE_PROJECT_MEMORY_DIR}/review-feedback.md
```

Resolve `CLAUDE_PROJECT_MEMORY_DIR` by converting the absolute project path to a slug: replace each `/` with `-`, prepend `-`. The directory is `~/.claude/projects/<slug>/memory/`. Example: project at `/Users/jane/work/myrepo` → `~/.claude/projects/-Users-jane-work-myrepo/memory/`.

### Dual-Write Protocol

When appending review feedback:
1. **Always** append to `docs/<identifier>/review-feedback.md` (per-ticket, for pipeline visibility)
2. **Always** append to the persistent feedback file (cross-ticket, for learning)

### Entry Format

```markdown
---

## [YYYY-MM-DD] TICKET — source: self-review | requirements-review | ci-fix | pr-review | verify

### AUTO-FIX
- [ ] [file:line] Description of issue and fix applied

### NEEDS-INPUT
- [ ] [file:line] Description of issue — options: A) ... B) ...

### INFO
- [file:line] Observation (no action needed)

### Summary
- **Auto-fixed**: N issues
- **Needs input**: N issues
- **Info**: N observations
```

### Pattern Detection

Before writing a new entry to the **persistent** feedback file, scan it for repeated issues:
- If the same type of issue appears 2+ times across different entries (different tickets), flag it to the user
- Suggest a rule improvement (e.g., add to CLAUDE.md, update a skill, add a lint rule)
- If 7+ days have passed since the last `## Review Learning Analysis` marker, recommend running `/basic-engineering:review-learning`

---

## Config

This skill reads config from `${CLAUDE_PLUGIN_DATA}/config.json` if it exists (shared with sdlc skill). Relevant fields:

- `testCommands` — commands for lint, type-check, tests
- `branchConvention` — branch naming pattern
- `reviewBot` — name of the review bot to watch for in PR comments

If config is missing, fall back to auto-detecting from `package.json` scripts.
