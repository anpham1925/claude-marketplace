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

## Git Conventions

Branch naming, commit convention, PR convention, and git safety rules are defined in the **always-on `git-conventions` rule** (`rules/git-conventions.md`). That rule is the single source of truth — do not duplicate those rules here.

Key points for quick reference:
- Branch format: `<ticket-or-feature>` — user-provided names take precedence
- Commit format: `<type>: [TICKET] <description>` — always include `Co-Authored-By`
- PRs always as `--draft` — use `gh pr create`
- Use Write tool + `git commit -F` — never `$()` substitution

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

Review feedback is written to `docs/<identifier>/review-feedback.md` — a per-ticket log committed into the PR.

| Location | Purpose | Lifecycle |
|----------|---------|-----------|
| `docs/<identifier>/review-feedback.md` | Pipeline-scoped log for the current ticket | Committed into PR, kept after merge for cross-ticket pattern detection |

When appending review feedback, **always** append to `docs/<identifier>/review-feedback.md`.

### Entry Format

```markdown
---

## [YYYY-MM-DD] TICKET — source: self-review | verify | ci-fix | pr-review

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

Before writing a new entry, scan `docs/**/review-feedback.md` (glob across all ticket docs in the repo) for repeated issues:
- If the same type of issue appears 2+ times across different entries (different tickets), flag it to the user
- Suggest a rule improvement (e.g., add to CLAUDE.md, update a skill, add a lint rule)
- If 7+ days have passed since the last `/engineering-toolkit:review-learning` run, recommend running it

---

## Config

This skill reads config from `${CLAUDE_PLUGIN_DATA}/config.json` if it exists (shared with sdlc skill). Relevant fields:

- `testCommands` — commands for lint, type-check, tests
- `branchConvention` — branch naming pattern
- `reviewBot` — name of the review bot to watch for in PR comments

If config is missing, fall back to auto-detecting from `package.json` scripts.
