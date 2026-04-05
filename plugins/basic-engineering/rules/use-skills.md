---
paths:
  - "**/*"
---

# Always Use Skills — Route Through Orchestrators

NEVER run raw git commit, git push, gh pr create, or similar commands directly. Use the appropriate **orchestrator** skill which routes to the right stage automatically:

| When you need to... | Use this skill |
|---|---|
| Development work (tickets, features, bugs, requirements, design, implementation, tests, review) | `basic-engineering:sdlc` |
| Ship code (commit, push, PR, CI/CD, staging, reviews) | `basic-engineering:ship-n-check` |
| Check PR comments / read PR reviews / see reviewer feedback | `basic-engineering:ship-pr-review` |
| NestJS architecture or conventions | `basic-engineering:nestjs-stack` |
| Methodology / how-to guidance | `basic-engineering:engineering-foundations` |

**Routing rule**: Always prefer the orchestrator. Only invoke individual stage skills (e.g., `/basic-engineering:ship-branch`, `/basic-engineering:sdlc-analyze`) when the user explicitly names them. The orchestrators encode the correct ordering, conventions, and quality gates.

This is a hard rule — even if it seems faster to run a quick `git commit` or `gh pr create`, always delegate to the skill. The skills encode team conventions, PR formatting, CI watching, and quality checks that raw commands skip.
