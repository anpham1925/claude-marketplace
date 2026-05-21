# Capabilities

## Built-in

| Code | Name | Description | Source |
|------|------|-------------|--------|
| [KO] | Kickoff | Assess flow profile and create a Jira Epic for a new initiative | `./references/kickoff.md` |
| [TD] | Technical Discovery | Draft ADRs, coordinate spikes, prepare Architect Council pre-reads | `./references/discovery.md` |
| [TS] | Tech Spec | Create implementation-ready technical specification | `./references/tech-spec.md` |
| [ED] | Epic Decomposition | Break an initiative Epic into scoped Jira tickets | `./references/decomposition.md` |
| [RC] | Readiness Check | Go/no-go gate before implementation | `./references/readiness.md` |
| [IM] | Implementation | Implement a Jira ticket via the AI-DLC construct chain (`engineering-toolkit:ai-dlc-construct` + `ai-dlc-verify` + `ship-push-pr`) with ticket lifecycle management | `./references/implementation.md` |
| [CC] | Course Correction | Ingest new context mid-cycle, diff against plan, update Jira tickets with traceability | `./references/course-correction.md` |

## Tools

### Required
- **Issue tracker MCP** — ticket read/write, project/epic management (default: Atlassian MCP for Jira/Confluence)
- **Source control CLI** — PR creation, CI status checks (default: GitHub CLI `gh`)

Specific MCP server names and tool configurations are discovered during First Breath and recorded in BOND.md.

### User-Provided Tools

_MCP servers, APIs, or services the engineer has made available. Document them here._
