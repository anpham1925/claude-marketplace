# Component Patterns

## Server vs Client Components

**Use Server Component (default) when:**
- Fetching data
- Accessing backend resources directly
- Keeping sensitive info on server (tokens, keys)
- Reducing client bundle size

**Use Client Component (`'use client'`) when:**
- Using `useState`, `useEffect`, `useReducer`
- Browser-only APIs (localStorage, IntersectionObserver)
- Event listeners (onClick, onChange)
- Custom hooks that use state/effects

## Composition Pattern

Push `'use client'` to the leaves. Keep parent Server Components:

```tsx
// app/page.tsx — Server Component
import { SearchBar } from '@/components/search-bar'  // Client
import { ProductList } from '@/components/product-list'  // Server

export default async function Page() {
  const products = await getProducts()  // Direct DB access
  return (
    <div>
      <SearchBar />  {/* Client: has state for search input */}
      <ProductList products={products} />  {/* Server: just renders data */}
    </div>
  )
}
```

## Passing Server Data to Client Components

```tsx
// Server Component fetches, Client Component interacts
async function Page() {
  const data = await getData()  // Server-side fetch
  return <InteractiveChart data={data} />  // Serialized to client
}
```

Rules:
- Props passed to Client Components must be serializable (no functions, classes, Dates)
- Use `JSON.parse(JSON.stringify(data))` if unsure about serializability
- For large data, consider streaming with Suspense instead

## Error Boundaries

```tsx
'use client'
// app/dashboard/error.tsx
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

## Loading States

```tsx
// app/dashboard/loading.tsx — automatically wraps page in Suspense
export default function Loading() {
  return <DashboardSkeleton />
}
```
