---
paths:
  - "**/*"
---

# Background-Process Discipline

When a Bash command is launched in background — either explicitly via `run_in_background: true` or auto-backgrounded by the harness on a long-running command — the process keeps consuming CPU, memory, DB connections, and file locks until it exits or is killed. The harness's task-notification system tells you when it completes; it does **not** kill it when you stop caring. Silent CPU drain is on you.

Phase 15f's debugging session left a probe-jest process running for **2+ hours** before manual cleanup — chewing through a database connection, an idle TypeORM data source, and a node process tree that would have blocked unrelated test runs.

## When this applies

Any backgrounded probe call during debugging: jest, pnpm, curl, node, python, psql, k6 — anything that you didn't immediately wait on.

## Required cleanup — exactly one of these must happen

For every backgrounded probe before moving on to the next debugging strategy:

1. **Wait on it** — use the Monitor tool, or a tight polling loop:
   ```bash
   until grep -q "Tests:" /path/to/output 2>/dev/null; do sleep N; done
   tail -20 /path/to/output
   ```
   Then proceed with the captured output.

2. **Kill it** — capture the task-id at launch (the harness returns it; e.g., `bo7gczl34`) or the PID (`ps -ef | grep <marker>`), then `kill <PID>` when abandoning the approach. Verify:
   ```bash
   ps -ef | grep <marker> | grep -v grep
   ```
   Empty output means the kill succeeded.

3. **Re-use it** — do not launch a second background probe while the first is still running. Verify the first is done (or kill it) before launching a new one.

## Anti-pattern — "I'll just try a different approach"

The most common failure mode: a probe doesn't return quickly, so the agent abandons it and tries something else. The probe keeps running. Five rounds of "different approaches" later, five probes are running concurrently, all holding DB connections.

If you abandon an approach, **kill the probe first**. No exceptions.

## Probe file hygiene

If your probe writes a throwaway file (e.g., `zz-probe.int-spec.ts`):

- Commit the cleanup to the same shell line that launches it: `cat > probe.ts << EOF ... EOF; jest probe.ts; rm -f probe.ts`.
- If the probe gets killed before reaching the `rm`, do a manual `rm -f` after the kill.
- Use a distinctive filename (`zz-probe.ts`, `tmp-debug-*.ts`) so a stray file is obvious in `git status`.

## End-of-session check

Before declaring a debugging session complete, run:

```bash
ps -ef | grep -E "<your-marker>|jest.*<your-repo>|pnpm.*<your-repo>" | grep -v grep
```

Any survivors are orphans. Kill them. Verify the working tree is free of probe files:

```bash
git status --short | grep -E "probe|zz-|tmp-debug"
```

## Why this matters

Stranded probe processes:
- Hold DB connections open (Postgres connection-pool exhaustion → unrelated test runs fail)
- Hold file locks (TypeORM migration locks, node_modules write locks, .git index locks)
- Hold ports (3000, 5432-clones used by ephemeral test schemas, 8080)
- Burn CPU (an idle jest worker with watch mode still ticks)

A single forgotten `INTEGRATION=1 jest --watchAll` consumes ~3% CPU and 200MB RSS indefinitely. Ten forgotten probes can saturate a developer laptop.
