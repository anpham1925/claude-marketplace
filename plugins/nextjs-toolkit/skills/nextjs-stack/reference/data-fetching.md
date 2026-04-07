# Data Fetching Patterns

## Server Component Data Fetching (Preferred)

```tsx
// Fetch directly in Server Components — no useEffect, no useState
async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  if (!product) notFound()
  return <ProductDetails product={product} />
}
```

## Parallel Data Fetching

```tsx
// BAD — sequential (waterfall)
const user = await getUser(id)
const posts = await getPosts(id)  // Waits for user

// GOOD — parallel
const [user, posts] = await Promise.all([
  getUser(id),
  getPosts(id),
])
```

## Caching

```tsx
import { unstable_cache } from 'next/cache'

const getCachedUser = unstable_cache(
  async (id: string) => db.user.findUnique({ where: { id } }),
  ['user'],  // Cache key parts
  { revalidate: 3600, tags: ['user'] }  // 1 hour, tagged for on-demand revalidation
)
```

## Request Deduplication

```tsx
import { cache } from 'react'

// React.cache deduplicates within a single render pass
export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})

// Both layout and page can call getUser(id) — only one DB query
```

## Revalidation

```tsx
// Time-based
export const revalidate = 3600  // Revalidate every hour

// On-demand (in Server Action or Route Handler)
import { revalidatePath, revalidateTag } from 'next/cache'
revalidatePath('/products')
revalidateTag('products')
```

## Streaming with Suspense

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      {/* Shows immediately */}
      <StaticContent />

      {/* Streams in when ready */}
      <Suspense fallback={<ChartSkeleton />}>
        <SlowChart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <SlowTable />
      </Suspense>
    </>
  )
}
```

## Client-Side Data (when needed)

For real-time data, polling, or user-specific client state, use SWR or React Query:

```tsx
'use client'
import useSWR from 'swr'

export function NotificationBell() {
  const { data } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 30000,  // Poll every 30s
  })
  return <Bell count={data?.count ?? 0} />
}
```

## Rules

- Fetch in Server Components by default
- Use `Promise.all` for parallel fetches
- Use `React.cache` to deduplicate within a render
- Use `unstable_cache` for cross-request caching
- Stream slow data with Suspense
- Only fetch on client for real-time/interactive needs
