---
name: daily-summary
description: >-
  Generate a daily standup summary from GitHub, Jira, and Slack activity, then
  send it as a Slack DM to yourself. Use whenever the user wants a daily summary,
  standup prep, end-of-day recap, or asks 'what did I do today/yesterday'.
  Triggers on: 'daily summary', 'standup', 'what did I work on', 'recap my day',
  'start of day', 'end of day', 'SOD', 'EOD', 'summarize my day',
  'what happened yesterday'. Also use when user asks to summarize a specific
  past date's work activity.
argument-hint: '[sod|eod|YYYY-MM-DD]'
model: sonnet
---

# Daily Summary

Aggregate work activity across GitHub, Jira, and Slack for a given day, format it as a standup (Done / In Progress / Blockers), and send it as a Slack DM to yourself.

## Prerequisites

This skill queries 3 external systems. For each, it prefers CLI tools and falls back to MCP:

| Source | Primary (CLI) | Fallback (MCP) |
|--------|--------------|----------------|
| **GitHub** | `gh` CLI (`gh search prs`) | GitHub MCP (if available) |
| **Jira** | — | Atlassian MCP (`searchJiraIssuesUsingJql`) |
| **Slack** | — | Slack MCP (`slack_search_public_and_private`, `slack_read_thread`, `slack_send_message`) |

**Before gathering data**, check what's available:
1. Run `which gh` — if `gh` is installed and authenticated (`gh auth status`), use it for GitHub queries. Otherwise check for a GitHub MCP server.
2. Check if Atlassian MCP tools are available (try calling `getJiraIssue` with a known ticket). If not, skip Jira.
3. Check if Slack MCP tools are available (try calling `slack_read_user_profile`). If not, skip Slack.

**At least one source must be available.** If none are reachable, tell the user:
> "I couldn't connect to any data source. To use daily-summary, set up at least one of: `gh` CLI (run `gh auth login`), Atlassian MCP server, or Slack MCP server."

If only some sources are available, proceed with what works and note which sources were skipped in the output.

## Argument Parsing

| Input | Meaning |
|-------|---------|
| _(none)_ | Auto-detect: before 12:00 local time = SOD (previous business day), after 12:00 = EOD (today) |
| `sod` | Previous business day (skip weekends — Friday if run on Monday) |
| `eod` | Today |
| `YYYY-MM-DD` | That specific date |
| Natural language (`yesterday`, `last friday`) | Resolve to absolute date |

Set `TARGET_DATE` to the resolved date. The query window is the full calendar day: `TARGET_DATE 00:00` to `TARGET_DATE 23:59`.

## Step 1 — Resolve User Identities

Run these in parallel — they're independent:

1. **GitHub** — `gh api user --jq '.login'` to get username
2. **Slack** — call `slack_read_user_profile` (no args) to get your user ID and display name
3. **Jira** — no lookup needed; use `currentUser()` in JQL

## Step 2 — Gather Activity (parallel)

Launch 3 independent data-gathering efforts. Use subagents where possible for speed.

### 2a. GitHub — PRs across your org

Replace `YOUR_ORG` with your GitHub org (or remove `--owner=` entirely to search across all your PRs).

```bash
# Merged on target date
gh search prs --author=@me --merged=TARGET_DATE..TARGET_DATE \
  --owner=YOUR_ORG --json title,number,repository,url,state --limit 50

# Created on target date
gh search prs --author=@me --created=TARGET_DATE..TARGET_DATE \
  --owner=YOUR_ORG --json title,number,repository,url,state --limit 50

# Open PRs (in review) — only include if updatedAt falls on target date
gh search prs --author=@me --state=open \
  --owner=YOUR_ORG --json title,number,repository,url,state,updatedAt --limit 50

# PRs I reviewed on target date
gh search prs --reviewed-by=@me --updated=TARGET_DATE..TARGET_DATE \
  --owner=YOUR_ORG --json title,number,repository,url,state --limit 50
```

Classify:
- **Merged on target date** → Done
- **Created or updated, still open** → In Progress
- **Reviewed by me (not authored)** → Done (code review)

### 2b. Jira — Tickets and comments

Use `searchJiraIssuesUsingJql` with `cloudId: "<your-org>.atlassian.net"`, `responseContentFormat: "markdown"`.

**Query 1 — Assigned tickets updated on target date:**
```
assignee = currentUser() AND updated >= "TARGET_DATE" AND updated < "TARGET_DATE+1"
ORDER BY updated DESC
```
Fields: `summary, status, issuetype, priority, updated`

**Query 2 — Tickets where I transitioned status:**
```
status changed BY currentUser() DURING ("TARGET_DATE", "TARGET_DATE+1")
ORDER BY updated DESC
```
Fields: `summary, status, issuetype, priority, updated`

Deduplicate by issue key across both queries.

Classify by current status:
- `Done`, `Closed`, `Resolved`, `Released` → Done
- `Blocked`, `On Hold`, `Impediment` → Blockers
- Everything else (`In Progress`, `In Review`, `In Development`, `To Do`, `Open`) → In Progress

### 2c. Slack — Conversations

Use `slack_search_public_and_private`:
```
query: "from:<@SLACK_USER_ID> on:TARGET_DATE"
sort: "timestamp"
sort_dir: "asc"
limit: 20
include_context: true
```

For each result:
1. Note channel name and message content
2. If the message is part of a thread, call `slack_read_thread` with that channel_id and thread_ts to get full context
3. Group messages by channel and thread

Filter out noise — skip messages that are just:
- Emoji reactions or simple acks ("ok", "thanks", "sounds good")
- Bot interactions or automated messages
- Messages in social/random channels unless they contain work discussion

Focus on extracting:
- Technical discussions and decisions
- Questions asked or answered
- Blockers raised
- Status updates shared

## Step 3 — Synthesize Standup

Cross-reference items across all 3 sources. A Jira ticket may have a matching PR and a Slack thread discussing it — combine these into a single bullet rather than listing them 3 times.

### Output Template

```
*Daily Summary — TARGET_DATE (Day of Week)*

*Done*
- [TICKET-ID] Short description — merged PR #N in repo-name
- Code review: PR #N "title" in repo-name
- Discussion: topic in #channel — outcome

*In Progress*
- [TICKET-ID] Short description — PR #N open (N comments to address)
- Working on: description from Slack/commits

*Blockers*
- [TICKET-ID] Short description — waiting on X
- Raised in #channel: brief description

*Key Conversations*
- #channel: brief summary of notable discussion
- Thread with @person: topic and outcome
```

Rules:
- Each bullet: 1 line, concise (~100 chars)
- Omit any section that has zero items (including Key Conversations)
- Key Conversations is only for substantive discussions not already covered by Done/In Progress
- If a data source returned nothing, don't mention it — just omit those items
- Target 10-20 bullets total; this is a summary, not an exhaustive log

## Step 4 — Send to Slack

1. Show the draft summary to the user in the terminal
2. Ask: "Ready to send this to yourself on Slack? Any changes?"
3. On approval, use `slack_send_message` with:
   - `channel_id`: the user's own Slack user ID (DM to self)
   - `message`: the formatted standup

If the user wants changes, edit the summary and show it again.

## Hard Rules

- NEVER fabricate activity — only report what the data sources returned
- NEVER include other people's activity — this is a personal summary
- If a data source fails (auth error, API timeout), report the failure, continue with the others
- Deduplicate aggressively — one work item = one bullet, even if it appeared in all 3 sources
- Keep the Slack search focused — if the first search returns >20 results, narrow by channel or topic rather than paginating through everything
