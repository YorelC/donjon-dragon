# Anti-patterns — donjon-dragon front

| ❌ | ✅ |
|---|---|
| `text-gray-500` | `text-muted-foreground` |
| `bg-white` / `bg-black` | `bg-background` / `bg-foreground` |
| `border-gray-200` | `border-border` |
| `w-[320px]` | `w-80` or `max-w-sm` |
| Custom `fixed inset-0` modal | `<Dialog>` |
| `className={a + ' ' + b}` | `cn(a, b)` |
| `<button>` sans variant shadcn | `<Button variant="ghost">` |
| `title="tooltip"` | `<Tooltip>` |
| Hardcoded hex/oklch color | Semantic token (`bg-primary`, `text-foreground`…) defined once in `@theme` |
| Same long Tailwind chain in 2+ components | Global class in `@layer components` (`front/src/index.css`), see `/design-system` |
| Inline ternary of classes | `cva()` when it's a real visual variant — not as a DRY workaround |
| `onClick` on a `<div>` | `<button>` or `role="button"` |
| Spinner alone | `<Skeleton>` matching content shape |
| Empty list = rien affiché | Empty state avec icône + message |
| `text-[oklch(var(--foreground))]` | `text-foreground` |
| `text-[oklch(var(--muted-foreground))]` | `text-muted-foreground` |
| `border-[oklch(var(--border))]` | `border-border` |
