---
name: setup-storybook
description: "TRIGGER when: user says 'add storybook', 'setup storybook', 'component showcase', 'story files', or references setting up Storybook for a project. DO NOT trigger for: writing individual stories for existing Storybook setups, or general UI component questions."
argument-hint: '[framework]'
model: sonnet
---

## Purpose

Set up Storybook from scratch for a React project. Covers installation, configuration, writing stories for all UI components, dark mode support, and deployment. This skill captures the full setup flow — adapt it to the project's specific stack.

## Standalone Invocation

```
/basic-engineering:setup-storybook
/basic-engineering:setup-storybook next  # hints at Next.js project
```

## Steps

### Step 1: Explore the project

Before installing anything, understand the stack:

1. Read `package.json` — framework, UI library, React version
2. Read `tsconfig.json` — path aliases (critical for Storybook resolution)
3. Read the theme/design system file — provider setup, tokens, dark mode approach
4. Read the root layout/providers — understand the provider nesting order
5. List all UI components — atoms, components, shared UI
6. Read each component file — understand props, dependencies, context requirements

**Key questions to answer:**
- What UI library? (Chakra UI, MUI, Radix, Tailwind-only, etc.)
- What provider wrapping is needed? (Theme, QueryClient, Auth, i18n, etc.)
- Do components use path aliases? Which ones?
- Are there components that need special context? (React Query, Auth, Router)
- Does the project use Tailwind CSS?

### Step 2: Choose the builder

| Project type | Recommended builder | Package |
|---|---|---|
| React (CRA, Vite, custom) | Vite | `@storybook/react-vite` |
| Next.js (uses next/image, next/link, SSR) | Next.js | `@storybook/nextjs` |
| Next.js (static export, no Next.js-specific features in components) | Vite | `@storybook/react-vite` |

**Decision rule:** If the atoms/components import from `next/*` (next/image, next/link, next/router), use `@storybook/nextjs`. Otherwise, `@storybook/react-vite` is faster and simpler.

### Step 3: Install dependencies

```bash
npm install --save-dev \
  @storybook/react-vite@^8.6.0 \
  @storybook/addon-essentials@^8.6.0 \
  @storybook/addon-themes@^8.6.0 \
  @storybook/blocks@^8.6.0 \
  @storybook/react@^8.6.0 \
  @storybook/test@^8.6.0 \
  storybook@^8.6.0 \
  vite-tsconfig-paths
```

**Version pinning is critical.** All `@storybook/*` packages must be on the same major.minor version. Mixing versions (e.g., `@storybook/addon-themes@10.x` with `storybook@8.x`) causes peer dependency conflicts.

**React 19 requires Storybook 8.4+.** Pin `^8.6.0` or later.

Add scripts to `package.json`:
```json
{
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

### Step 4: Create .storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/react-vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (config) => {
    config.plugins = [...(config.plugins || []), tsconfigPaths()];
    return config;
  },
};

export default config;
```

**Path aliases:** Use `vite-tsconfig-paths` to auto-resolve all aliases from `tsconfig.json`. Do NOT manually duplicate aliases in Vite config.

**For `@storybook/nextjs` builder**, replace the framework block:
```typescript
framework: {
  name: '@storybook/nextjs',
  options: {},
},
// No viteFinal needed — Next.js builder reads tsconfig paths automatically
```

### Step 5: Create .storybook/preview.tsx

This is the most important file — it wraps every story with the providers your components need.

```typescript
import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
// Import your project's theme provider and CSS
// import { ThemeProvider } from '../src/theme';
// import '../src/app/globals.css';

const preview: Preview = {
  decorators: [
    // Dark mode toggle in toolbar
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
    // Provider wrapper — match your app's provider nesting order
    (Story) => (
      // <ThemeProvider>
        <Story />
      // </ThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

**Provider checklist — only include what your components actually need:**

| Provider | When to include | When to skip |
|---|---|---|
| Theme/UI provider | Always (components need styling) | Never skip |
| QueryClientProvider | Components use `useIsFetching`, `useQueryClient` | No component reads query state |
| AuthProvider | Components call `useAuth` directly | Components receive auth data via props |
| RouterProvider | Components use `useRouter`, `Link` | Pure presentational components |
| i18n provider | Components use `useTranslation` | No i18n |

**Rule:** Only add providers that your atoms/components **directly import hooks from**. Check each component's imports. Don't blindly copy the app's full provider tree.

### Step 6: Handle Tailwind CSS

If the project uses Tailwind CSS:

1. Import `globals.css` in `.storybook/preview.tsx`:
   ```typescript
   import '../src/app/globals.css';
   ```

2. Add Storybook paths to `tailwind.config.ts` content:
   ```typescript
   content: [
     './src/**/*.{js,ts,jsx,tsx,mdx}',
     './.storybook/**/*.{ts,tsx}',
   ],
   ```

### Step 7: Update .gitignore

Add `storybook-static/` to `.gitignore`.

### Step 8: Write stories for each component

**Story file naming:** Co-locate with the component. `Button.tsx` → `Button.stories.tsx` in the same directory.

**Story structure:**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',  // e.g., 'Atoms/Button', 'Components/Table'
  component: MyComponent,
  args: {
    // Default args for all stories
  },
  argTypes: {
    // Interactive controls
    someProp: { control: 'text' },
    variant: { control: 'select', options: ['a', 'b', 'c'] },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },  // or use fn() in args
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const VariantB: Story = {
  args: { variant: 'b' },
};
```

**What stories to write per component type:**

| Component type | Stories to write |
|---|---|
| Button/CTA | Default, each variant, each size, disabled, loading |
| Input/TextField | Default, each type (text/email/password), disabled, with value |
| Select/Dropdown | Default, with options, with label |
| Form (modal/inline) | Open state, with various field types, closed state |
| Table | With data, empty, with caption |
| Table fragments (header/body) | Wrap in `<Table.Root>` decorator |
| Pagination | First page, middle page, last page, single page |
| Loading/Spinner | Default (usually no props) |
| Auth forms (Login/Register) | Default with `onSubmit: fn()`, fullscreen layout |

**Special cases:**

**Table fragments** that render `<thead>`/`<tbody>` need a table wrapper:
```typescript
decorators: [
  (Story) => (
    <Table.Root>
      <Story />
    </Table.Root>
  ),
],
```

**Modal/Dialog components** that require `open={true}` to be visible:
```typescript
args: {
  isOpen: true,
  onClose: fn(),
},
```

**Components that depend on React Query's `useIsFetching`:**
```typescript
function LoadingWrapper() {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.fetchQuery({
      queryKey: ['storybook-mock'],
      queryFn: () => new Promise(() => {}), // never resolves
    });
  }, [queryClient]);
  return <YourComponent />;
}

export const Loading: Story = {
  render: () => (
    <QueryClientProvider client={new QueryClient()}>
      <LoadingWrapper />
    </QueryClientProvider>
  ),
};
```

**Fullscreen components** (login pages, etc.):
```typescript
parameters: {
  layout: 'fullscreen',
},
```

### Step 9: Verify the build

```bash
npm run build-storybook
```

**This is critical.** The dev server (`npm run storybook`) is more lenient than the production build. Always verify `build-storybook` passes before pushing.

Check that `storybook-static/index.html` exists after build.

### Step 10: Set up deployment

**Option A: Vercel (recommended if already using Vercel)**

1. Go to Vercel → New Project → Import same repo
2. Set Application Preset to `Storybook` (auto-detected) or set:
   - Build Command: `npm run build-storybook`
   - Output Directory: `storybook-static`
   - Framework Preset: `Other`
3. Deploy — both projects auto-deploy on push to main

No GitHub Actions workflow needed. Vercel handles it.

**Option B: GitHub Pages (free for public repos)**

Create `.github/workflows/deploy-storybook.yml`:

```yaml
name: Deploy Storybook to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build-storybook
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: storybook-static
      - id: deployment
        uses: actions/deploy-pages@v4
```

Requires: repo Settings → Pages → Source → "GitHub Actions".

**Option C: Netlify/Cloudflare Pages**

Same as Vercel — create a second project with `npm run build-storybook` as build command and `storybook-static` as output.

## CHECKPOINT

Before committing, present to user and WAIT for approval:
- List of story files created
- Storybook build result (pass/fail)
- Deployment strategy chosen

## Common Pitfalls

| Pitfall | Solution |
|---|---|
| `@storybook/*` version mismatch | Pin ALL storybook packages to same major.minor |
| Path aliases not resolving | Use `vite-tsconfig-paths` in `viteFinal`, not manual aliases |
| `@storybook/test` not installed | It's a separate package from `storybook` — install explicitly |
| Components unstyled in stories | Missing theme provider in `preview.tsx` decorator |
| Dark mode not working | Use `@storybook/addon-themes` with `withThemeByClassName` |
| Modal/Dialog invisible | Set `open={true}` / `isOpen={true}` in default args |
| Table fragments render broken HTML | Wrap in `<Table.Root>` via story decorator |
| `useIsFetching` returns 0 | Story needs a wrapper that triggers a pending query |
| Tailwind classes purged | Add `.storybook/**` and story file paths to `tailwind.config` content |
| `use client` warnings during build | Harmless — Vite ignores RSC directives, no action needed |
| `next/font` not loading in Storybook | Expected — fonts fall back to system fonts, cosmetic only |
| Dev server works but `build-storybook` fails | Always verify with `npm run build-storybook` before pushing |

## Rules

- **NEVER** install Storybook without first exploring the project's stack and components
- **NEVER** blindly copy the app's full provider tree into preview.tsx — only include what components actually need
- **NEVER** skip `npm run build-storybook` verification — dev mode hides errors
- **ALWAYS** pin all `@storybook/*` packages to the same version
- **ALWAYS** co-locate story files next to their components
- **ALWAYS** use `vite-tsconfig-paths` for path alias resolution (not manual config)
- **ALWAYS** present the list of created files and build result at CHECKPOINT
