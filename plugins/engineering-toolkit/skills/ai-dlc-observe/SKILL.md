---
name: ai-dlc-observe
description: "Internal phase of the ai-dlc pipeline — post-deploy observability checks using Honeycomb, health endpoints, and NFR validation. Invoke directly only via /engineering-toolkit:ai-dlc-observe when explicitly requested by name. For general requests, use engineering-toolkit:ai-dlc which routes here automatically."
argument-hint: '[TICKET-ID]'
model: sonnet
---

> **Recommended model: Sonnet** — Execution-focused observability queries.

## Agent: Observer

**Mission**: Verify the deployment is healthy by checking observability data against NFR targets and baseline metrics.

**Inputs**: Deployed code (from Release), Inception Artifact (NFRs, measurement criteria), Honeycomb config
**Outputs**: Observation Report

## Why This Phase Exists

AI-DLC includes an Operations phase because shipping code isn't the finish line — observing its behavior in production is. This phase closes the loop by checking that NFR targets are met and no regressions were introduced.

## When This Phase Runs

- **Included**: Full features, brown-field with NFRs, performance work
- **Skipped**: Bug fixes (unless user requests), spikes, refactors (unless performance-sensitive)
- **Always available**: Can be invoked manually via `/engineering-toolkit:ai-dlc observe`

## Steps

### Check State

Read `docs/<identifier>/state.md` and `docs/<identifier>/specs.md`. Verify Release is completed. Load:
- NFRs from Inception (performance targets, reliability targets)
- **Observability Plan** from `specs.md` (full SLI targets, instrumentation points, alert conditions)
- Measurement criteria
- Affected services/modules

`state.md` has a brief summary of the plan; `specs.md` has the full details (specific SLI targets like "P95 < 500ms", instrumentation locations, alert thresholds). Use `specs.md` to drive what to query — don't guess which SLIs matter, validate the ones that were explicitly planned.

See [shared reference](../ai-dlc/reference/shared.md) for format.

### Get Honeycomb Context

Use `mcp__honeycomb__get_workspace_context` to understand the workspace. Then use `mcp__honeycomb__get_environment` to identify the right environment for observation.

If `honeycombDataset` and `honeycombEnvironment` are configured in `config.json`, use those directly.

### Wait for Deployment Propagation

After merge, deployments take time to propagate. Wait a reasonable interval:
- Ask the user: "How long does deployment typically take after merge? (default: 5 minutes)"
- Or check the CI/CD pipeline status from the Release phase

### Health Check

If a health endpoint is known (from staging verification or config):
- Verify the service responds with 200
- Check that the deployed version matches (if version endpoint exists)

### Query Error Rates

Use `mcp__honeycomb__run_query` to check error rates:

```
Query: count of errors in the last 30 minutes for affected service
Compare: against baseline from 24 hours ago
```

Parameters:
- **Dataset**: from config or auto-detect from service name
- **Time range**: last 30 minutes
- **Filters**: service name, error status codes (4xx, 5xx)
- **Breakdowns**: by endpoint, by error type

Flag if error rate is significantly higher than baseline.

### Query Latency Metrics

Use `mcp__honeycomb__run_query` for latency:

```
Query: P50, P95, P99 latency for affected endpoints
Compare: against NFR targets from Inception
```

For each NFR with a latency target:
- Query the actual P95/P99
- Compare against the target
- Mark as PASS (within target), WATCH (within 20% of target), or ALERT (exceeds target)

### Check SLOs

Use `mcp__honeycomb__get_slos` to verify SLO compliance:
- Are any SLOs burning budget faster than expected?
- Has the error budget decreased since deployment?

### Check Triggers/Alerts

Use `mcp__honeycomb__get_triggers` to check for active alerts:
- Any new alerts fired since deployment?
- Any existing alerts that changed state?

### Produce Observation Report

```markdown
## Observation Report

**Observed**: {timestamp}
**Service**: {service name}
**Environment**: {environment}
**Time since deploy**: {duration}

### Health
- Endpoint: {url} — {status}

### Error Rates
| Metric | Baseline (24h ago) | Current (30min) | Status |
|--------|-------------------|-----------------|--------|
| Total errors | {N}/min | {N}/min | PASS/WATCH/ALERT |
| 5xx rate | {N}% | {N}% | PASS/WATCH/ALERT |

### Latency
| Endpoint | P50 | P95 | P99 | NFR Target | Status |
|----------|-----|-----|-----|------------|--------|
| {path} | {ms} | {ms} | {ms} | {target} | PASS/WATCH/ALERT |

### SLOs
| SLO | Budget Remaining | Status |
|-----|-----------------|--------|
| {name} | {%} | PASS/WATCH/ALERT |

### Active Alerts
- {alert name} — {status}

### NFR Compliance
| NFR | Target | Actual | Status |
|-----|--------|--------|--------|
| NFR-1 | <200ms P95 | 145ms | PASS |

### Summary
- **Overall**: {HEALTHY | WATCH | ALERT}
- **Action needed**: {none | monitor | investigate}
```

### Handle Alerts

If any metric is in ALERT status:
- Present findings to the user
- Recommend running `/engineering-toolkit:investigate` for systematic root-cause analysis:
  > **ALERT detected** — {metric} exceeds threshold.
  >
  > I recommend running **Investigate** to systematically diagnose the root cause before attempting a fix or rollback.
  >
  > Options:
  > 1. **Investigate** — Run `/engineering-toolkit:investigate` with the alert context
  > 2. **Rollback** — Revert the deployment (if error rate is critically elevated)
  > 3. **Monitor** — Continue watching for {duration} before acting
- Do NOT auto-rollback — always ask the user

### Update Jira

Post observation summary as a comment.

### Update State

Update `docs/<identifier>/state.md`:
- Mark Observe as completed
- Record observation results

### CHECKPOINT — Observation Summary

> **Observe complete. AI-DLC pipeline finished.**
>
> - **Health**: {status}
> - **Error rates**: {status}
> - **Latency**: {status vs NFR targets}
> - **SLOs**: {status}
>
> {If all PASS:} Deployment is healthy. All NFR targets are met. The pipeline is complete.
>
> {If WATCH:} Deployment looks okay but some metrics are near thresholds. I recommend checking again in {time}.
>
> {If ALERT:} Some metrics exceed targets. {Specific findings and recommended actions}.

## Fallback: No Honeycomb Access

If Honeycomb MCP tools are not available or the workspace isn't configured:
- Skip automated queries
- Present a manual observation checklist:
  - [ ] Check error monitoring dashboard
  - [ ] Verify no new alerts
  - [ ] Check key endpoint latency
  - [ ] Verify service health
- Ask the user to confirm observation manually

## Rules

See [common phase rules](../ai-dlc/reference/shared.md#common-phase-rules) for state updates, Jira comments, and checkpoint protocol.

Phase-specific:
- **NEVER** auto-rollback — always present findings and let the user decide
- **ALWAYS** compare against baseline (not just absolute values)
- **ALWAYS** check NFR targets from Inception (not just general health)
- If Honeycomb is unavailable, fall back to manual checklist — don't skip observation entirely
