# Frontend Engineering Skill

Rules and best practices for building frontend applications (React Native / Expo, Next.js, React).
Apply these from day one — retrofitting is 3x more expensive than doing it right upfront.

---

## 1. Design Token System (MANDATORY)

Never use raw values (hex colors, pixel numbers) in components. Define tokens once, import everywhere.

### Structure

```
src/design/
  tokens.ts       # colors, spacing, radii, fontSizes, fontWeights, shadows
```

### Rules
- **Colors**: Every hex value lives in `tokens.colors`. Name semantically (`primary`, `income`, `expense`, `textPrimary`, `border`) not by color (`green`, `red`).
- **Spacing**: Use a scale (`xs: 4, sm: 8, md: 12, lg: 16, xl: 20, 2xl: 24`). Never write `padding: 17`.
- **Radii**: Define `sm, md, lg, xl, full`. Never write `borderRadius: 12` inline.
- **Typography**: Define `fontSizes` and `fontWeights` as named scales.
- **Shadows**: Define as reusable objects (React Native) or CSS vars (web).

### Why
- Change the entire app's look by editing one file
- Consistent spacing/sizing across all screens
- New developers can't introduce rogue values
- Theme switching (dark mode) becomes a token swap, not a 200-file edit

### Example (React Native)
```ts
// tokens.ts
export const colors = {
  primary: "#4CAF50",
  primaryLight: "#E8F5E9",
  income: "#4CAF50",
  expense: "#F44336",
  background: "#f8f9fa",
  surface: "#ffffff",
  textPrimary: "#1a1a1a",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#e0e0e0",
} as const;

// Component usage
import { colors } from "@/design/tokens";
<View style={{ backgroundColor: colors.background }}>
```

### Example (Web — Chakra UI)
```ts
// theme/tokens.ts — for inline overrides
export const colors = { primary: "#4CAF50" } as const;

// For Chakra, extend the theme system with custom semantic tokens.
// Use Chakra's built-in palette (gray.500, green.600) for standard colors.
// Only use tokens.ts for values Chakra doesn't cover.
```

---

## 2. Component Abstraction Layers

### The Rule: Never use library components directly in page/screen code.

Wrap every 3rd-party component (Chakra `<Button>`, RN `<TextInput>`, MUI `<TextField>`) in your own component.

### Why
- **Library upgrade**: Chakra v3 → v4 changes API? Fix ONE file, not 50.
- **Consistency**: Your `<AppButton>` enforces your design (border radius, font weight, padding). Raw `<Button>` doesn't.
- **Variants**: Define your variants (`primary`, `secondary`, `danger`, `ghost`) once. Don't repeat `colorPalette="green"` in 30 places.
- **Props simplification**: Expose only what your app needs. Hide library-specific noise.

### Structure
```
src/components/
  ui/                # Atoms — smallest building blocks
    AppButton.tsx
    AppInput.tsx
    Card.tsx
    Chip.tsx
    Tag.tsx
    FAB.tsx
    TypeToggle.tsx
    ErrorBox.tsx
    ModalWrapper.tsx
    SummaryCard.tsx
    index.ts         # Barrel export

  finance/           # Domain molecules/organisms
    TransactionRow.tsx
    TransactionList.tsx
    CategoryPicker.tsx

  journal/           # Domain molecules/organisms
    EntryCard.tsx
    EntryList.tsx
```

### Barrel Export Pattern
```ts
// components/ui/index.ts
export { default as AppButton } from "./AppButton";
export { default as AppInput } from "./AppInput";
export { default as Card } from "./Card";

// Usage in screens
import { AppButton, Card, AppInput } from "@/components/ui";
```

---

## 3. Atomic Design (Adapted)

Not the full Brad Frost methodology — a pragmatic version:

| Level | What | Examples | Where |
|-------|------|---------|-------|
| **Atoms** | Single-purpose UI elements | Button, Input, Card, Tag, Badge, FAB | `components/ui/` |
| **Molecules** | Compositions of atoms for a specific purpose | TypeToggle, CategoryChips, SummaryCard, ErrorBox | `components/ui/` |
| **Organisms** | Domain-specific sections | TransactionList, AddTransactionForm, JournalEntryCard | `components/{domain}/` |
| **Screens/Pages** | Full pages that compose organisms | FinanceScreen, JournalPage | `app/` routes |

### Rules
- Atoms know NOTHING about business logic. They receive props and render.
- Molecules combine atoms but still don't know about API or state.
- Organisms can use hooks, call APIs, manage local state.
- Screens compose organisms and handle routing/navigation.

---

## 4. Styling Rules

### React Native
- Use `StyleSheet.create()` — always. Never inline style objects (they create new references every render).
- Import ALL values from tokens. `grep -r '"#' src/` should return zero hits outside `tokens.ts`.
- Extract repeated style patterns into shared stylesheet or component.

### Web (CSS-in-JS / Chakra / Tailwind)
- Use the framework's design system first (Chakra semantic tokens, Tailwind classes).
- Only fall back to inline `style={}` for values the framework can't express.
- If you write `style={{ color: "#4CAF50" }}` more than once, it belongs in tokens.

### Cross-platform
- Keep token VALUES identical between mobile and web (`primary` = `#4CAF50` in both).
- Token STRUCTURE may differ (RN uses objects, web uses CSS vars or Chakra tokens).
- Consider a shared `tokens.json` that both platforms import if the project grows.

---

## 5. File Organization

### Feature-based, not type-based

```
# BAD — type-based (scales terribly)
components/
  buttons/
  inputs/
  cards/
hooks/
services/

# GOOD — feature/domain-based
src/
  design/          # Tokens, theme
  components/
    ui/            # Shared atoms & molecules
    finance/       # Finance domain components
    journal/       # Journal domain components
  hooks/           # Shared hooks (useAuth, useAppLock)
  services/        # API, crypto
  types/           # TypeScript types
  lib/             # Utilities (formatCurrency, formatDate)
```

### Rules
- Collocate related code. If `TransactionRow` is only used in finance, put it in `components/finance/`.
- Shared components go in `components/ui/`.
- Each domain folder is self-contained — you can understand it without reading other domains.

---

## 6. Don't Couple to Libraries

### The abstraction test
Ask: "If I swap [Chakra / MUI / Tailwind / RN Paper], how many files change?"

- **Bad answer**: 50+ files — you're directly coupled.
- **Good answer**: 5-10 files (your atom wrappers) — you're abstracted.

### Practical rules
- Page/screen files import from `@/components/ui`, NEVER from `@chakra-ui/react` directly.
- The ONLY files that import library components are atom wrappers in `components/ui/`.
- Exception: layout primitives (`Box`, `Flex`, `View`) can be used directly — they're too fundamental to wrap.

---

## 7. State & Data Flow

### Rules
- **Context for auth/global state** — wrap in providers, consume via hooks.
- **Component state for UI** — form inputs, toggles, modals open/close.
- **Server state via hooks** — `useFetch`, `useTransactions`, etc. Don't scatter `api.get()` calls across components.
- **Encrypt/decrypt at the boundary** — components work with decrypted data. Encryption happens in the service layer, not in UI code.

---

## 8. Common Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Do This Instead |
|---|---|---|
| Hardcoded colors in components | Can't theme, inconsistent | Design tokens |
| Copy-paste component with slight changes | Bugs in one copy not fixed in others | Extract with props/variants |
| `style={{ marginTop: 24 }}` in 50 places | Magic numbers, can't change globally | `spacing["2xl"]` from tokens |
| Import `Button` from Chakra in pages | Library upgrade = rewrite pages | Import `AppButton` from `ui/` |
| Monster 500-line screen components | Hard to test, reuse, review | Extract organisms & molecules |
| Inline error handling patterns | Inconsistent UX | `<ErrorBox message={err} />` |
| Duplicated modal overlay code | Change animation = edit everywhere | `<ModalWrapper>` |

---

## 9. Checklist Before Starting a Frontend Project

```
[ ] Design tokens defined (colors, spacing, radii, typography, shadows)
[ ] UI atom components created (Button, Input, Card)
[ ] Barrel export (index.ts) for components/ui/
[ ] Library components wrapped (never imported directly in pages)
[ ] Folder structure is feature/domain-based
[ ] Auth context + API client set up with interceptors
[ ] TypeScript strict mode enabled
[ ] No hardcoded hex colors outside tokens.ts
```

---

## 10. Refactoring Existing Projects

If you already wrote it wrong (like we did), refactor in this order:

1. **Create tokens.ts** — Extract all colors/spacing/sizing. Find-and-replace across files.
2. **Extract atoms** — Start with the most-used: Button, Input, Card. Wrap library components.
3. **Extract molecules** — TypeToggle, ErrorBox, Modal wrappers.
4. **Update screens** — Import from `ui/` barrel export, replace inline patterns.
5. **Grep for violations** — `grep -r '"#' src/` should only hit `tokens.ts`. `grep -r 'from "@chakra-ui' src/` should only hit `components/ui/`.

---

## Quick Reference: Token Naming Convention

```
colors.primary          # Brand color
colors.primaryLight     # Light variant for backgrounds
colors.income           # Semantic: income = green
colors.expense          # Semantic: expense = red
colors.background       # App background
colors.surface          # Card/container background
colors.textPrimary      # Main text
colors.textSecondary    # Secondary text
colors.textMuted        # Disabled/placeholder text
colors.border           # Borders & dividers
colors.error            # Error states
colors.warning          # Warning states

spacing.xs → 4          # Tight gaps
spacing.sm → 8          # Small gaps
spacing.md → 12         # Medium gaps
spacing.lg → 16         # Standard padding
spacing.xl → 20         # Large padding
spacing["2xl"] → 24     # Section spacing
spacing["3xl"] → 32     # Large section spacing

radii.sm → 8            # Tags, badges
radii.md → 12           # Cards, inputs, buttons
radii.lg → 16           # Large cards
radii.xl → 20           # Pills, filter chips
radii.full → 28         # FABs, avatars
```
