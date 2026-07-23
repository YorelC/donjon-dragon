---
name: ui-review
description: Audit or refactor visual/styling concerns for donjon-dragon front (front/src) — shadcn/ui components, Tailwind v4 tokens, colors, spacing, dark mode, layout polish, empty states, skeletons. NOT for structural React refactors → react-architecture. NOT for new feature scaffold.
allowed-tools: Read, Grep, Glob, Edit, MultiEdit
---

# UI REVIEW — donjon-dragon

Front only (`front/src`). Stack: shadcn/ui « new-york », Tailwind v4 via `@tailwindcss/vite` — tokens live
in `@theme` inside `front/src/index.css`, dark mode via `@variant dark`. NO `tailwind.config.js`.

## WORKFLOW
1. Read @ui-antipatterns.md → quick wins first
2. Read @ui-tokens.md → enforce design system
3. Read @ui-components.md → shadcn patterns
4. Read @ui-layout.md → only if the task involves page structure

## PROJECT NOTES
- `cn()` from `front/src/lib/utils.ts` (clsx + tailwind-merge) — the standard shadcn convention here.
- Repeated Tailwind chain across 2+ places → global class in `@layer components` of `front/src/index.css`
  (see `/design-system`), never a copy-pasted chain, never a long per-file className variable, never a CVA
  map used purely to dodge duplication.
- `components/atoms` = shadcn primitives (edit in place). `components/molecules` = D&D composites
  (dice-roller, combat-log, hit-points, spell-card, item-card, ability-score, skill-check). `components/bases`
  = pre-shadcn legacy, being phased out — don't add to it, migrate opportunistically if touched.

## OUTPUT
- Before/after diffs only, not full files
- One-line explanation per change
- Group by concern (colors, spacing, components)
- Flag behaviour-affecting changes explicitly
- List unfixed issues and why
