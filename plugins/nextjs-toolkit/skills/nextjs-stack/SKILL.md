---
name: nextjs-stack
description: "TRIGGER when: code imports from 'next', 'next/navigation', 'next/image', '@next/', or user asks about Next.js patterns, App Router, Server Components, Server Actions, data fetching, middleware, or Next.js project structure. Also trigger when creating new pages, layouts, or API routes in a Next.js project. DO NOT trigger for: generic React questions without Next.js context, or other frameworks."
model: sonnet
---

> **Recommended model: Sonnet** — Pattern application and code generation.

Opinionated Next.js patterns for App Router (Next.js 14+). Before applying any topic, read its reference file in `reference/`.

## When to Apply

This skill auto-triggers when working in a Next.js codebase. Apply these patterns:

1. **Creating pages/layouts** → Read `reference/app-router.md`
2. **Fetching data** → Read `reference/data-fetching.md`
3. **Server Actions / mutations** → Read `reference/server-actions.md`
4. **Components** → Read `reference/components.md`
5. **Performance** → Read `reference/performance.md`

## Architecture Overview

```
app/
├── (auth)/                    # Route group — shared auth layout
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/               # Route group — shared dashboard layout
│   ├── layout.tsx             # Dashboard shell with nav
│   ├── page.tsx               # Dashboard home
│   └── settings/page.tsx
├── api/                       # Route Handlers (REST endpoints)
│   └── webhooks/route.ts
├── layout.tsx                 # Root layout (html, body, providers)
├── loading.tsx                # Root loading UI
├── error.tsx                  # Root error boundary
├── not-found.tsx              # 404 page
└── global-error.tsx           # Global error boundary
lib/
├── actions/                   # Server Actions
├── db/                        # Database client + queries
├── auth/                      # Auth utilities
└── utils/                     # Shared utilities
components/
├── ui/                        # Primitive UI components
└── features/                  # Feature-specific components
```

## Key Rules

| Rule | Why |
|---|---|
| Server Components by default | Smaller bundle, direct DB access, no client JS |
| `'use client'` only when needed | Interactive state, browser APIs, event handlers |
| Never fetch in Client Components | Data flows down from Server Components or via Server Actions |
| Colocate loading/error files | Each route segment can have its own loading.tsx and error.tsx |
| Server Actions for mutations | Type-safe, progressive enhancement, no API route needed |
| Validate all Server Action input | Server Actions are public endpoints — treat input as untrusted |
| Use `unstable_cache` or `React.cache` | Deduplicate requests within a single render |
| Metadata API for SEO | Export `metadata` or `generateMetadata` from pages/layouts |

## Quick Reference

```
Need to create a new page?
  → Read reference/app-router.md

Need to fetch data?
  → Read reference/data-fetching.md

Need a form or mutation?
  → Read reference/server-actions.md

Need to decide server vs client component?
  → Read reference/components.md

Need to optimize performance?
  → Read reference/performance.md
```
