---
name: design-system
description: Author or review any donjon-dragon front code (front/src) for the shadcn/ui + Tailwind v4 design system — semantic tokens, native typography, and DRY className via global @apply classes. Trigger "build a component", "style", "UI", or /design-system.
allowed-tools: Read, Grep, Glob, Write, Edit, MultiEdit
---

# DESIGN SYSTEM GUARDIAN — donjon-dragon

Front only (`front/`). Stack: React 18 + Vite SPA, shadcn/ui style « new-york », Tailwind v4 via
`@tailwindcss/vite` (NO `tailwind.config.js`, NO `globals.css`). `cn()` = `front/src/shared/utils/utils.ts`.

## BEFORE TOUCH CODE
- Read `front/src/index.css` → tokens live in `@theme { --color-* }`, dark mode via `@variant dark`.
- Glob `front/src/shared/components/atoms/` → shadcn primitives already installed (edit in place, never wrap).
- `shared/components/molecules/` = D&D composites (dice-roller, combat-log, hit-points…). `pages/<segment>/`
  = routes (`<segment>.page.tsx` + `_internal/{hooks,containers,views}/`).

## RULES

**Color / typo → semantic token only. Never raw palette.**
- ❌ `bg-blue-600` `text-zinc-900` `border-slate-200`
- ✅ `bg-background` `bg-card` `bg-primary` `bg-muted` `text-foreground` `text-muted-foreground` `border-border`
- Token missing? Add `--color-x` to `@theme` in `front/src/index.css`. THEN use `bg-x`.

**Repeated className chain → GLOBAL class, never duplicated inline.**
- Same 3+ utilities in 2+ places → define ONCE in `front/src/index.css`:
  ```css
  @layer components {
    .stat-card { @apply flex flex-col gap-2 rounded-lg border border-border bg-card p-4; }
  }
  ```
  then use `<div className="stat-card">` in the components.
- ❌ Duplicating the long utility chain inline in every component.
- ❌ Hiding it in a long per-file `const className = "..."` or an oversized CVA variant map to dodge the rule.
- The single source of truth for a recurring chain = one global class.

**`cn()` = conditional composition only.** Merge dynamic/conditional classes
(`cn('stat-card', isActive && 'ring-2 ring-ring')`). NOT for de-duplicating a static recurring chain — that
goes to a global class.

**shadcn owned.** Primitive exists? Use `front/src/shared/components/atoms/*`. Install: `npx shadcn@latest add <c>`.

## CHECKLIST BEFORE SHIP
- [ ] Zero raw palette utilities (no `bg-<color>-<n>`) in app components
- [ ] Zero repeated className chain — recurring chains extracted to `@layer components` in `index.css`
- [ ] No long inline className duplicated across files, no CVA map used as a DRY workaround
- [ ] `cn()` only for conditional/dynamic classes
- [ ] New color goes through `@theme`, not hardcoded
