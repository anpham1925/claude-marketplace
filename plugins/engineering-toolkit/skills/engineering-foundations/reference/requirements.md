# Requirements Gathering

## Questions to Ask

- **Who is the user?** (End user, admin, API consumer, etc.)
- **What problem are we solving?** (Business context)
- **What are the acceptance criteria?** (How do we know it's done?)
- **What are the edge cases?** (Error handling, validation)
- **What are the dependencies?** (Other systems, APIs, features)
- **What is the priority?** (Must-have vs. nice-to-have)

## Priority Levels

| Priority | Definition | Example |
|---|---|---|
| **CRITICAL** | Blocking, must be first | Security vulnerability, data loss |
| **HIGH** | Significant business impact | Core feature for launch |
| **MEDIUM** | Improves user experience | UX improvements, optimizations |
| **LOW** | Nice-to-have | Minor polish, edge cases |

## Requirements Template

```markdown
## Feature: [Feature Name]

### Overview
High-level description

### Business Context
Why are we building this?

### User Stories
- As a [user type], I want [action] so that [benefit]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Edge Cases
- What happens when X?
- What happens when Y?

### Technical Considerations
High-level tech requirements

### Tasks
- [ ] Task 1
- [ ] Task 2
```

## Non-Functional Requirements

| Category | Questions |
|---|---|
| **Performance** | How fast? Acceptable latency? |
| **Availability** | Required uptime? Maintenance windows? |
| **Scalability** | Expected traffic? Peak load? |
| **Data** | Volume? Retention? |

## Common Mistakes

- Not defining acceptance criteria clearly
- Forgetting edge cases and error scenarios
- Not considering backward compatibility
- Mixing detailed technical implementation with requirements
