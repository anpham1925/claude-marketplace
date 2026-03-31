# App Router Patterns

## File Conventions

| File | Purpose |
|---|---|
| `page.tsx` | UI for a route — makes the route publicly accessible |
| `layout.tsx` | Shared UI for a segment and its children — persists across navigations |
| `loading.tsx` | Loading UI — wraps page in React Suspense |
| `error.tsx` | Error UI — wraps page in React Error Boundary |
| `not-found.tsx` | 404 UI — triggered by `notFound()` |
| `route.ts` | API endpoint (GET, POST, etc.) — cannot coexist with page.tsx |
| `template.tsx` | Like layout but re-mounts on navigation (rare) |
| `default.tsx` | Fallback for parallel routes |

## Route Groups

Use `(groupName)` folders to organize without affecting URL:

```
app/
├── (marketing)/        # /about, /blog
│   ├── about/page.tsx
│   └── blog/page.tsx
├── (app)/              # /dashboard, /settings
│   ├── layout.tsx      # App-specific layout with sidebar
│   ├── dashboard/page.tsx
│   └── settings/page.tsx
```

## Dynamic Routes

```tsx
// app/posts/[slug]/page.tsx
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  return <Article post={post} />
}

// Generate static params for SSG
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

## Layouts

```tsx
// app/layout.tsx — Root layout (required)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

Rules:
- Root layout must contain `<html>` and `<body>`
- Layouts don't re-render on navigation — use template.tsx if you need re-mount
- Don't pass data between layout and page via props — fetch independently (React deduplicates)

## Parallel Routes

```
app/
├── @modal/           # Named slot
│   └── login/page.tsx
├── @feed/            # Named slot
│   └── page.tsx
├── layout.tsx        # Receives { children, modal, feed }
└── page.tsx
```

## Intercepting Routes

```
app/
├── feed/
│   └── page.tsx
├── photo/[id]/
│   └── page.tsx        # Full page view
├── @modal/
│   └── (..)photo/[id]/ # Intercepts /photo/[id] with modal
│       └── page.tsx
```

## Metadata

```tsx
// Static
export const metadata: Metadata = {
  title: 'My Page',
  description: 'Page description',
}

// Dynamic
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).id)
  return { title: product.name }
}
```
