# nextjs-toolkit

Next.js 14+ patterns for App Router, Server Components, Server Actions, data fetching, and performance.

## Install

```bash
/plugin install nextjs-toolkit@anpham-marketplace
```

## Usage

The skill triggers automatically when Claude detects Next.js code (imports from `next`, `next/navigation`, `@next/`) or when you ask about Next.js patterns.

```bash
# Explicit invocation
/nextjs-toolkit:nextjs-stack

# Auto-triggers on questions like:
# "create a new page"
# "add a server action"
# "optimize this component"
# "set up middleware"
```

## Reference Topics (5)

| Topic | What It Covers |
|---|---|
| **App Router** | Route structure, layouts, loading/error states, metadata |
| **Components** | Server vs Client Components, composition patterns |
| **Data Fetching** | Server-side fetching, caching, revalidation |
| **Server Actions** | Form handling, mutations, optimistic updates |
| **Performance** | Image optimization, code splitting, Core Web Vitals |

References are loaded on-demand — only the relevant topic is read when needed.
