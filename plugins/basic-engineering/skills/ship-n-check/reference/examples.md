# Git Workflow — Bash Steps

## Full Git Workflow Steps

### 1. Check current state

```bash
git status
git diff
git log --oneline -5
```

### 2. Create branch from current HEAD

```bash
git checkout -b <branch-name>
```

### 3. Stage specific files only

```bash
git add path/to/file1.ts path/to/file2.ts
```

### 4. Commit with convention

Use the `Write` tool to create `docs/<identifier>/commit-msg.txt` (avoids `printf > file` redirection triggering permission prompts), then commit:

```bash
# First: use Write tool to create docs/<identifier>/commit-msg.txt with the message
git commit -F docs/<identifier>/commit-msg.txt
```

### 5. Push with upstream tracking

```bash
git push -u origin <branch-name>
```

### 6. Create PR using `gh` (always as draft)

Use the `Write` tool to create `docs/<identifier>/pr-body.md` (avoids `#`-prefixed lines and redirection triggering permission prompts), then create PR:

```bash
# First: use Write tool to create docs/<identifier>/pr-body.md with the PR body
gh pr create --draft --title "<action>: <short title>" --body-file docs/<identifier>/pr-body.md
```

## Common Operations

### Amend last commit (only if user explicitly asks)

```bash
# First: use Write tool to create docs/<identifier>/commit-msg.txt with the updated message
git commit --amend -F docs/<identifier>/commit-msg.txt
```

### View PR checks

```bash
gh pr checks
```

### View PR comments

```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments
```
