---
paths:
  - ".claude/rules/**"
  - "**/rules/**/*.md"
---

# Rule Authoring Checklist

When creating or modifying path-scoped rules (files with `paths:` frontmatter):

## File Extension Coverage

Always verify that the `paths:` scope covers **all relevant file extensions** for the feature domain:

| Domain | Extensions to include |
|---|---|
| TypeScript source | `**/*.ts`, `**/*.tsx` |
| Test files | `**/*.spec.ts`, `**/*.spec.tsx`, `**/*.e2e-spec.ts`, `**/*.e2e.spec.ts` |
| JavaScript | `**/*.js`, `**/*.jsx` |
| Styles | `**/*.css`, `**/*.scss` |
| Config | `**/*.json`, `**/*.yaml`, `**/*.yml` |

If the rule applies to a domain that uses multiple extensions (e.g., React uses both `.ts` and `.tsx`), include all of them. A rule scoped only to `**/*.ts` will silently miss `.tsx` files.

## Version Bump

Every plugin modification requires a version bump in **both**:
- `plugins/<name>/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

| Change Type | Bump |
|---|---|
| Removing skills/breaking changes | Major (e.g., 5.0.0 → 6.0.0) |
| Adding features/rules/agents | Minor (e.g., 5.0.0 → 5.1.0) |
| Fixing existing rules/skills | Patch (e.g., 5.1.0 → 5.1.1) |
