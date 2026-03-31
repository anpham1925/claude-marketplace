# Performance Patterns

## Image Optimization

```tsx
import Image from 'next/image'

// Always use next/image — automatic optimization, lazy loading, WebP
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority  // Only for above-the-fold images (LCP)
  placeholder="blur"  // Requires static import or blurDataURL
/>
```

## Font Optimization

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

## Bundle Analysis

```bash
# Analyze client bundle
ANALYZE=true next build  # with @next/bundle-analyzer configured
```

Watch for:
- Large client components that should be server components
- Heavy libraries imported in client components (use dynamic import)
- Barrel imports pulling in entire modules

## Dynamic Imports

```tsx
import dynamic from 'next/dynamic'

// Only load on client, with loading state
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // Skip server render if component uses browser APIs
})
```

## Route Segment Config

```tsx
// Per-page configuration
export const dynamic = 'force-static'  // or 'force-dynamic', 'auto'
export const revalidate = 3600  // ISR: revalidate every hour
export const fetchCache = 'default-cache'
export const runtime = 'nodejs'  // or 'edge'
```

## Partial Prerendering (PPR)

```tsx
// next.config.js
module.exports = { experimental: { ppr: true } }

// Static shell + dynamic holes
export default function Page() {
  return (
    <div>
      <StaticHeader />           {/* Prerendered at build */}
      <Suspense fallback={<Skeleton />}>
        <DynamicContent />        {/* Streamed at request time */}
      </Suspense>
    </div>
  )
}
```

## Rules

- Use `next/image` for all images — never raw `<img>`
- Use `next/font` for all fonts — prevents layout shift
- Dynamic import heavy client libraries
- `priority` only on LCP image (usually hero/banner)
- Prefer Server Components to reduce JS bundle
- Use Suspense boundaries to stream slow content
- Run Lighthouse in CI to catch regressions
