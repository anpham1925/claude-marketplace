# Ship & Check Shared Reference

Cross-cutting concerns shared by all ship-n-check stage skills.

---

## Working Directory

All temporary and generated files for this workflow are stored under `docs/<identifier>/` in the repo root:
- Use the ticket number if available (e.g., `docs/PROJ-123/`)
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

**User-provided names always take precedence.** If the user gives a specific branch name, use it exactly as-is — do not validate, add prefixes, or apply conventions on top. Skip all naming guidance below.

**When no name is provided**, derive one from the ticket or context:
- Jira ticket: `PROJ-123`, `PROJ-456-short-desc`
- No ticket: kebab-case description like `fix-auth-bug`, `add-user-endpoint`

**Branch naming ≠ commit conventions.** Commit types (`feat`, `fix`, `chore`) belong in commit messages, not branch names. Never derive branch prefixes from commit conventions.

**Length limit**: Helm release names are derived as `<repo-name>-<branch-name>` and must be **<= 53 characters** (Helm/Kubernetes constraint). Before creating a branch, verify that `<repo-name>-<branch-name>` does not exceed 53 chars. If it does, shorten the branch name.

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

### Stage Workflow Template

Every ship-* stage follows the same entry/exit pattern. Individual SKILL.md files link here instead of repeating it.

**On entry:**
1. Read `docs/<identifier>/stage-gate.md`
2. Verify the previous stage is checked off (if not first stage)
3. If `stage-gate.md` doesn't exist and this is `ship-branch`, create it
4. If `stage-gate.md` doesn't exist and this is NOT `ship-branch`, STOP — run the missing stage first

**On exit:**
1. Check off the completed stage in `docs/<identifier>/stage-gate.md`
2. Write a brief note and timestamp next to the checkmark

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

## Long-Running Operations

Some pipeline stages wait on something external for 10-30+ minutes (CI/CD runs, staging deploys, review-bot workflows). Two things govern how you handle these: **how you wait** and **how you keep the user informed**.

### Wait by detaching the command — never by polling

The wait itself is a single blocking command run in the background. The harness re-invokes you when it exits, so you burn no tokens while waiting and never sit in a poll loop:

| Waiting on | Command | How to run it |
|---|---|---|
| A CI/CD run | `gh run watch "$RUN_ID" --exit-status` | `Bash` with `run_in_background: true` |
| A pod becoming ready | `kubectl --context <ctx> wait --for=condition=Ready pod/<pod> -n <ns> --timeout=300s` | `Bash` with `run_in_background: true` |
| A review-bot workflow | `gh run watch "$RUN_ID" --exit-status` | `Bash` with `run_in_background: true` |

`gh run watch` and `kubectl wait` block until their condition is met and exit non-zero on failure. They are **event-driven** — they long-poll the API for you — not token-driven. Backgrounding them means the harness re-invokes you the moment they exit.

**Never** wrap a wait in a `for … sleep` loop, and never re-query status "every N seconds" from the model. That spends a model turn per poll for no benefit and is the single biggest source of wasted CI-wait cost. If you genuinely need to gate on a condition no single command expresses, use the `Monitor` tool — still not a model-driven sleep loop.

### Wait at the level that owns the conversation

Run the wait from the **top-level agent driving the pipeline**, not inside a stage subagent you are blocking on. If the orchestrator dispatches a stage subagent and *that* subagent backgrounds the watch, the re-invoke lands on the subagent while the orchestrator sits blocked waiting for it to return — which re-creates the "stuck subagent that never closes" problem.

So:
- The **orchestrator** backgrounds the watch itself (it already holds the run ID from the push/PR stage).
- **Subagents are for work, not for waiting** — spawn one to read failed-job logs and propose a bias-isolated fix *when a run fails*, not to sit on a green run.

### Never go silent

- **Before starting**: tell the user what you're waiting on and the rough wait (e.g. "CI is running, ~10-20 min — I'll report the moment it finishes").
- **On the re-invoke**: immediately report the full result.

Because the harness re-invokes you when the backgrounded command exits, there is no "I'll be notified, then idle in silence" gap — you *will* be re-invoked, and you report at that instant. If you catch yourself about to poll in a sleep loop "so the user sees progress", stop: background the watch instead and report on exit.

---

## Config

This skill reads config from `${CLAUDE_PLUGIN_DATA}/config.json` if it exists (shared with ai-dlc skill). Relevant fields:

- `testCommands` — commands for lint, type-check, tests
- `reviewBot` — name of the review bot to watch for in PR comments

If config is missing, fall back to auto-detecting from `package.json` scripts.
