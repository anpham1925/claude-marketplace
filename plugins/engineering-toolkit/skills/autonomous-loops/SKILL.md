---
name: autonomous-loops
description: "TRIGGER when: user says 'autonomous loop', 'run this repeatedly', 'watch and fix', 'continuous pipeline', 'agent loop', 'orchestrate agents', 'multi-agent', or asks about running Claude Code in automated/unattended workflows. DO NOT trigger for: simple for/while loops in code, CI/CD pipeline configuration, or single-run automation."
model: opus
---

# Autonomous Loop Patterns

Catalog of architectures for running Claude Code in automated, multi-iteration, or multi-agent workflows.

## Pattern 1: Simple Pipeline (`claude -p`)

**When:** Single-pass automation, CI integration, batch processing

```bash
# Basic: pipe a prompt, get a result
echo "Review this diff for security issues" | claude -p

# With context: read file, process, output
cat src/api/routes.ts | claude -p "List all endpoints and their auth requirements"

# Chained: output of one feeds the next
claude -p "Analyze this codebase and list all TODO comments" | \
  claude -p "Prioritize these TODOs by impact and create a markdown checklist"
```

**Strengths:** Simple, composable, stateless
**Weaknesses:** No iteration, no error recovery, no state between steps

---

## Pattern 2: Fix Loop (Watch → Detect → Fix → Verify)

**When:** CI failures, lint errors, test failures that need iterative fixing

```bash
#!/bin/bash
MAX_ATTEMPTS=3
attempt=0

while [ $attempt -lt $MAX_ATTEMPTS ]; do
  # Run checks
  npm test 2>&1 | tee /tmp/test-output.txt
  if [ $? -eq 0 ]; then
    echo "All tests passing"
    exit 0
  fi

  # Feed failures to Claude for fixing
  cat /tmp/test-output.txt | claude -p "Fix the failing tests. Only modify test files if the test expectations are wrong. Otherwise fix the source code."

  attempt=$((attempt + 1))
done

echo "Failed after $MAX_ATTEMPTS attempts"
exit 1
```

**Strengths:** Bounded retries, automated recovery
**Weaknesses:** No learning between iterations, risk of oscillating fixes
**Guard rails:** Always bound the loop (max 3-5 attempts). Log each attempt.

---

## Pattern 3: Worktree Parallelism

**When:** Multiple independent tasks that can be worked on simultaneously

```bash
# Create isolated worktrees for parallel work
git worktree add /tmp/task-1 -b feature/task-1
git worktree add /tmp/task-2 -b feature/task-2
git worktree add /tmp/task-3 -b feature/task-3

# Run Claude in each worktree in parallel
claude -p "Implement user authentication" --cwd /tmp/task-1 &
claude -p "Add payment processing" --cwd /tmp/task-2 &
claude -p "Create admin dashboard" --cwd /tmp/task-3 &

wait  # Wait for all to complete

# Review and merge results
for dir in /tmp/task-{1,2,3}; do
  cd "$dir" && git diff main
done
```

**Strengths:** True parallelism, isolated state, no conflicts during work
**Weaknesses:** Merge conflicts at integration, no shared context between workers
**Guard rails:** Tasks must be independent. Run integration tests after merge.

---

## Pattern 4: State Machine Loop

**When:** Multi-stage workflows with decision points and rollback

```
┌──────────┐
│  PLAN    │──→ approved ──→ ┌──────────┐
└──────────┘                 │ IMPLEMENT│
     ↑ rejected              └──────────┘
     └────────────────────────────┘   │
                                      ↓ done
                              ┌──────────┐
                              │  TEST    │
                              └──────────┘
                                   │
                          pass ←───┼───→ fail
                           ↓              ↓
                    ┌──────────┐   ┌──────────┐
                    │  REVIEW  │   │   FIX    │──→ (back to TEST)
                    └──────────┘   └──────────┘
                           │
                    approve ↓
                    ┌──────────┐
                    │  SHIP    │
                    └──────────┘
```

**Implementation:**
- Track state in a file (e.g., `STATE.md` or `.claude/loop-state.json`)
- Each stage reads state, does work, updates state
- Failed stages retry with bounded attempts
- State file enables resume after interruption

**Strengths:** Resumable, auditable, each stage gets fresh context
**Weaknesses:** Complexity, state management overhead
**Guard rails:** Bound retries per stage. Checkpoint state after each transition.

---

## Pattern 5: Supervisor + Workers

**When:** Complex tasks that benefit from coordination

```
┌─────────────────────┐
│    SUPERVISOR       │  (Opus — plans and reviews)
│  - Decomposes task  │
│  - Assigns workers  │
│  - Reviews results  │
│  - Makes decisions  │
└─────────────────────┘
     │         │         │
     ↓         ↓         ↓
┌─────────┐ ┌─────────┐ ┌─────────┐
│ WORKER 1│ │ WORKER 2│ │ WORKER 3│  (Sonnet — executes)
│ Task A  │ │ Task B  │ │ Task C  │
└─────────┘ └─────────┘ └─────────┘
```

**Implementation with Claude Code subagents:**
- Supervisor runs in main conversation (Opus model)
- Workers spawned via Agent tool with specific, scoped prompts
- Workers return results; supervisor integrates
- Each worker gets a fresh context window (thin orchestrator principle)

**Strengths:** Best model for each role, fresh context per worker, parallel execution
**Weaknesses:** Coordination overhead, workers can't see each other's work
**Guard rails:** Supervisor must validate worker output. Workers should be stateless.

---

## Pattern 6: DAG Orchestration (Advanced)

**When:** Large initiatives (RFC-level changes) with complex dependencies

```
RFC Document
     │
     ↓
┌──────────────┐
│ DECOMPOSE    │  Break into dependency graph
└──────────────┘
     │
     ↓
┌──────────────────────────────┐
│        Task DAG              │
│  A ──→ B ──→ D              │
│  A ──→ C ──→ D              │
│        C ──→ E              │
│  (A,B,C independent tiers)  │
└──────────────────────────────┘
     │
     ↓
┌──────────────┐
│ EXECUTE      │  Run tasks respecting dependencies
│ (parallel    │  Each task → own worktree + quality pipeline
│  where safe) │  Merge queue with conflict resolution
└──────────────┘
     │
     ↓
┌──────────────┐
│ INTEGRATE    │  Merge all branches, run full test suite
└──────────────┘
```

**Quality Pipeline Per Task:**
- Trivial (1-2 lines): lint only
- Small (< 50 lines): lint + type-check + unit tests
- Medium (50-200 lines): full test suite + code review
- Large (200+ lines): full suite + security review + architecture review

**Strengths:** Maximum parallelism, proportional quality gates, handles complex dependencies
**Weaknesses:** Very complex, requires robust merge strategy
**Guard rails:** Each task must be independently deployable. Integration tests are mandatory.

---

## Choosing a Pattern

| Scenario | Pattern |
|---|---|
| One-off automation | 1. Simple Pipeline |
| Fix CI failures | 2. Fix Loop |
| Multiple independent features | 3. Worktree Parallelism |
| Full AI-DLC workflow | 4. State Machine |
| Complex feature with subtasks | 5. Supervisor + Workers |
| Large multi-team initiative | 6. DAG Orchestration |

## Anti-Patterns

- **Unbounded loops** — Always set MAX_ATTEMPTS. An infinite fix loop will burn tokens and make things worse.
- **Shared mutable state** — Workers modifying the same files cause conflicts. Use worktrees or file-level locking.
- **No checkpointing** — If the loop crashes, you lose all progress. Save state after each iteration.
- **Monolithic prompts** — Don't pass the entire context to every worker. Each gets only what it needs (thin orchestrator).
- **Missing integration tests** — Parallel workers can each pass independently but break together. Always test the merge.
- **No stall detection** — If a worker is stuck (5+ iterations without progress), escalate to supervisor or user.
