---
paths:
  - "**/*"
---

# Always Use Skills — Route Through Orchestrators

NEVER run raw git commit, git push, gh pr create, or similar commands directly. Use the appropriate **orchestrator** skill which routes to the right stage automatically:

| When you need to... | Use this skill |
|---|---|
| Development work (tickets, features, bugs, requirements, design, implementation, tests, review) | `engineering-toolkit:ai-dlc` |
| Ship code (commit, push, PR, CI/CD, staging, reviews) | `engineering-toolkit:ship-n-check` |
| Check PR comments / read PR reviews / see reviewer feedback | `engineering-toolkit:ship-pr-review` |
| NestJS architecture or conventions | `nestjs-toolkit:nestjs-stack` (install `nestjs-toolkit`) |
| Django / DRF patterns | `django-toolkit:django-stack` (install `django-toolkit`) |
| Next.js patterns | `nextjs-toolkit:nextjs-stack` (install `nextjs-toolkit`) |
| Methodology / how-to guidance | `engineering-toolkit:engineering-foundations` |

**Routing rule**: Always prefer the orchestrator. Only invoke individual stage skills (e.g., `/engineering-toolkit:ship-branch`, `/engineering-toolkit:ai-dlc-inception`) when the user explicitly names them. The orchestrators encode the correct ordering, conventions, and quality gates.

This is a hard rule — even if it seems faster to run a quick `git commit` or `gh pr create`, always delegate to the skill. The skills encode team conventions, PR formatting, CI watching, and quality checks that raw commands skip.
