---
name: snc-staging
description: "TRIGGER when: user says 'check staging', 'verify staging', 'port-forward', 'staging sanity check', or references staging verification. DO NOT trigger for: full done flow, CI/CD, PR review, or other stages."
argument-hint: '[ticket-number]'
model: sonnet
---

## Purpose

Verify the deployment on staging by connecting to the K8s cluster, port-forwarding, and running sanity checks.

## Working Directory

All temporary and generated files are stored under `docs/<identifier>/` in the repo root:
- Use the ticket number if available (e.g., `docs/PRT-123/`)
- Otherwise use the branch name (e.g., `docs/fix-auth-bug/`)

## Standalone Invocation

```
/basic-engineering:snc-staging PRT-123
```

If no ticket number is provided, derive from the current branch name.

## Authentication

If kubectl commands fail with authentication errors, the user may need to authenticate manually in their terminal. Claude Code may not have the right credentials for cluster access. Guide the user through their project's auth steps (e.g., SSO login, kubeconfig update).

### AWS Profile Detection

**Do NOT assume a default AWS profile.** Detect the correct profile from the user's environment:

1. **Always read the full file first** — use the `Read` tool on `~/.aws/config` to see all profiles (including `[default]`)
2. Check `$AWS_PROFILE` — but note it may point to a non-EKS profile (e.g., Bedrock)
3. Look for profiles with `sso_role_name` containing `Staging` or `Engineer`

Do NOT rely on `grep '\[profile'` — this misses the `[default]` section which may hold the staging SSO config.

If no staging profile is found or kubectl fails, ask the user which AWS profile to use. Never hardcode or guess profile names.

## Configuration

Check the project's `CLAUDE.md` or `AGENTS.md` for staging config. If not documented, **auto-detect from helm files**:

| Setting | How to detect |
|---------|--------------|
| **kubectl context** | Check `AGENTS.md` or ask user |
| **Namespace (master)** | Infer from repo/service name (e.g., `partnership` repo -> `partnership` namespace) |
| **Namespace (feature)** | Common patterns: `playground`, `preview`, `staging` — check `AGENTS.md` or ask user |
| **Health endpoint** | Read helm values for `readinessProbe.httpGet.path` or `livenessProbe.httpGet.path` |
| **Container port** | Read helm values for `containerPort` or probe port |
| **Pod names** | Read `Chart.yaml` for aliases/dependencies — pod names follow `{release}-{alias}` pattern |
| **Exclude pods** | Read helm values for `daemons` (e.g., event-consumer, worker) and non-API aliases — these are not the main API pod |
| **Auth headers** | Check controller decorators or middleware for required headers |
| **Dashboards** | Check `AGENTS.md` for ArgoCD, K8s Dashboard URLs |

## Commands

### Namespace Determination

Many projects use different namespaces for master/main vs feature branches. Determine namespace before running kubectl commands:

```bash
BRANCH=$(git branch --show-current)
BRANCH_SLUG=$(echo "$BRANCH" | tr '[:upper:]' '[:lower:]' | tr '_' '-')

# Auto-infer: master/main -> repo/service name
# Feature branch -> check AGENTS.md for the shared namespace (common: "playground", "preview")
```

**Auto-infer logic for master namespace**: Use the repo name or the primary helm chart name from `helm/*/Chart.yaml`.

If the project doesn't document namespace mapping, ask the user.

### Pod Identification

Auto-detect which pods to look for and which to exclude:

1. Read `helm/*/Chart.yaml` — find aliases/dependencies to know pod name patterns
2. Read helm values — find `daemons` entries to know which pods to exclude (non-API workloads)
3. Filter for the main API pod only

```bash
kubectl --context <context> get pods -n <namespace> | grep "<app-name>-$BRANCH_SLUG"
```

**Note:** Feature branch deployments may auto-delete after a TTL (e.g., 1 day). If not found, the user may need to re-trigger deployment via CI/CD.

### Pod Readiness Wait

If the pod is not yet in `Running` state, retry up to 12 times with 15s sleep (3 min max):

```bash
for i in $(seq 1 12); do
  POD_STATUS=$(kubectl --context <context> get pods -n <namespace> | grep "<app-name>-$BRANCH_SLUG" | awk '{print $3}')
  [ "$POD_STATUS" = "Running" ] && break
  sleep 15
done
```

### Check Container Port

Always verify the container port before port-forwarding — don't assume a fixed port:

```bash
kubectl --context <context> get pod "$POD_NAME" -n <namespace> -o jsonpath='{.spec.containers[*].ports[*].containerPort}'
```

### Port-Forward (run in background)

```bash
kubectl --context <context> port-forward -n <namespace> "$POD_NAME" <local-port>:<container-port>
```

Run this with `run_in_background: true`.

### Sanity Check

```bash
# Health check (unauthenticated)
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:<local-port>/health

# Authenticated endpoint (adapt headers to your project)
curl -s -o /dev/null -w "HTTP %{http_code}" \
  -H "Authorization: Bearer <token>" \
  http://localhost:<local-port>/api/v1/some-endpoint
```

### PR-Affected Endpoint Check

Identify endpoints touched by the PR and curl them:

```bash
# Get changed controller/route files
gh pr diff --name-only | grep -E 'controller|route|handler'

# Or from local diff
git diff master...HEAD --name-only | grep -E 'controller|route|handler'
```

Then read the changed files to extract route paths and build curl commands.

### Batch Testing (optional)

If testing multiple IDs:

```bash
while read -r id; do
  echo "=== ID $id ==="
  curl -s "http://localhost:<local-port>/api/v1/path/${id}" | jq .
  echo
done < ids.txt
```

## Complete Flow

```
1. Get branch name and slug from current branch
2. Auto-detect from helm: health endpoint, container port, pod names, exclude list
3. Determine namespace: master/main -> repo/service name, feature -> check AGENTS.md or ask user
4. Detect AWS profile: check $AWS_PROFILE or ~/.aws/config — ask user if unclear
5. kubectl get pods -n <namespace> | grep <app-name>[-<slug>] (excluding non-API pods)
6. If not found — deployment may have auto-deleted, inform user
7. Wait for Running state if needed (up to 12 retries, 15s apart)
8. Verify container port from jsonpath matches helm expectation
9. kubectl port-forward -n <namespace> "$POD_NAME" <local-port>:<container-port>
10. Sanity check: curl health endpoint (auto-detected from helm)
11. PR check: identify affected endpoints from diff, curl each one
12. Stop port-forward after all checks pass
13. Inform user: "Staging sanity + PR endpoint checks passed"
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| kubectl context not found | Run kubeconfig update for your cluster |
| Authentication errors | User must authenticate in their terminal (SSO, etc.) |
| Feature branch pods not found | Deployment may have auto-deleted; re-trigger via CI/CD |
| `cannot list resource "pods" at the cluster scope` | Specify a namespace with `-n <namespace>` |

## Rules

- **NEVER** assume a default AWS profile — detect from `$AWS_PROFILE` or `~/.aws/config`, ask user if unclear
- **ALWAYS** determine namespace based on branch — master/main and feature branches often use different namespaces
- If kubectl auth fails, instruct user to authenticate manually — Claude may not have cluster credentials
- **ALWAYS** check the container port before port-forwarding — don't assume a fixed port
- **ALWAYS** auto-detect health endpoint, container port, pod names, and exclude list from helm files before falling back to AGENTS.md or asking user
- Ask the user for project-specific configuration if not available in helm files or `AGENTS.md`
- Ask the user for API endpoints if not already known
- **ALWAYS** check the PR diff to identify affected endpoints and curl those too
- Port-forward should run in the background
- **ALWAYS** stop the port-forward after all checks pass
