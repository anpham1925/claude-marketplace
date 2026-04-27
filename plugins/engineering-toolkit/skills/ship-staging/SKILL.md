---
name: ship-staging
description: "Internal stage of the ship-n-check pipeline — verifies staging deployment with health and endpoint checks. Invoke directly only via /engineering-toolkit:ship-staging when explicitly requested by name. For general requests like 'check staging' or 'verify deployment', use engineering-toolkit:ship-n-check which routes here automatically."
argument-hint: '[ticket-number]'
model: haiku
---

## Purpose

Find the staging pod, port-forward, and verify the deployment with health and endpoint checks.

## Steps

### Gate Check

Follow the [stage workflow template](../ship-n-check/reference/shared.md#stage-workflow-template). Verify "CI/CD (build/deploy)" is checked.

### Detect Configuration

Check the project's `CLAUDE.md` or `AGENTS.md` for staging config. If not documented, **auto-detect from helm files**:

| Setting | How to detect |
|---------|--------------|
| **kubectl context** | Check `AGENTS.md` or ask user |
| **Namespace (master)** | Infer from repo/service name |
| **Namespace (feature)** | Check `AGENTS.md` or ask user (common: `playground`, `preview`) |
| **Health endpoint** | Read helm values for `readinessProbe.httpGet.path` |
| **Container port** | Read helm values for `containerPort` |
| **Pod names** | Read `Chart.yaml` for aliases — pod names follow `{release}-{alias}` |
| **Exclude pods** | Read helm values for `daemons` (non-API workloads) |

### AWS Profile Detection

**Do NOT assume a default AWS profile.** Use the Read tool on `~/.aws/config` to see all profiles. Look for profiles with `sso_role_name` containing `Staging` or `Engineer`. If unclear, ask the user.

### Determine Namespace

```bash
BRANCH=$(git branch --show-current)
BRANCH_SLUG=$(echo "$BRANCH" | tr '[:upper:]' '[:lower:]' | tr '_' '-')
```

- master/main → repo name (e.g., `my-app` repo → `my-app` namespace)
- Feature branch → check AGENTS.md for shared namespace

### Find the Pod

```bash
kubectl --context <context> get pods -n <namespace> | grep "<app-name>-$BRANCH_SLUG"
```

Exclude non-API pods (daemons, workers, consumers). If not found, deployment may have auto-deleted — inform user.

### Wait for Running State

If pod is not Running, retry up to 12 times with 15s sleep (3 min max):

```bash
for i in $(seq 1 12); do
  POD_STATUS=$(kubectl --context <context> get pods -n <namespace> | grep "<app-name>-$BRANCH_SLUG" | awk '{print $3}')
  [ "$POD_STATUS" = "Running" ] && break
  sleep 15
done
```

### Verify Container Port

```bash
kubectl --context <context> get pod "$POD_NAME" -n <namespace> -o jsonpath='{.spec.containers[*].ports[*].containerPort}'
```

### Port-Forward (background)

```bash
kubectl --context <context> port-forward -n <namespace> "$POD_NAME" <local-port>:<container-port>
```

Run with `run_in_background: true`.

### Sanity Check

```bash
# Health check
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:<local-port>/health

# Authenticated endpoint (adapt headers to project)
curl -s -o /dev/null -w "HTTP %{http_code}" \
  -H "Authorization: Bearer <token>" \
  http://localhost:<local-port>/api/v1/some-endpoint
```

### PR-Affected Endpoint Check

Identify endpoints touched by the PR:

```bash
git diff origin/master...HEAD --name-only | grep -E 'controller|route|handler'
```

Read changed files to extract route paths. Build and execute curl commands for each.

### Stop Port-Forward

Stop the background port-forward process. Inform user of results.

### Gate Write

Check off "Staging" in `stage-gate.md`.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| kubectl context not found | Run kubeconfig update for your cluster |
| Authentication errors | User must authenticate in terminal (SSO) |
| Feature branch pods not found | Deployment may have auto-deleted; re-trigger via CI/CD |
| Cluster scope error | Specify namespace with `-n <namespace>` |

## Rules

- **NEVER** assume a default AWS profile — detect or ask user
- **ALWAYS** determine namespace based on branch
- **ALWAYS** check container port before port-forwarding — don't assume
- **ALWAYS** auto-detect from helm files before falling back to AGENTS.md or asking user
- **ALWAYS** check PR diff to identify affected endpoints
- **ALWAYS** stop port-forward after all checks pass
- If kubectl auth fails, instruct user to authenticate manually
