# AP Claude Marketplace

This repository contains Claude Code plugins. Each plugin lives under `plugins/` and follows the standard plugin structure.

## Plugin Structure

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── agents/                   # Agent definitions
├── rules/                    # Context-triggered rules
├── skills/                   # User-invocable skills
│   └── <skill-name>/
│       ├── SKILL.md          # Skill entry point
│       └── reference/        # Supporting docs
└── README.md
```

## Conventions

- Skills are invoked as `/<plugin-name>:<skill-name>`
- Each skill must have a `SKILL.md` with frontmatter (name, description)
- Reference files are loaded on-demand by skills, not eagerly
- Agents define subagent roles with specific tools and responsibilities
- Rules trigger based on file path patterns
