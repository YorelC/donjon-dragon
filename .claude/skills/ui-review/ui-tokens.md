# Design Tokens — donjon-dragon front

## Colors
Tokens are defined in `front/src/index.css` under `@theme { --color-* }`, in `oklch()` — never write
`text-[oklch(...)]` inline, use the Tailwind utility directly (`text-foreground`).

| Usage | Token |
|---|---|
| Texte principal | `text-foreground` |
| Texte muted / secondaire | `text-muted-foreground` |
| Texte destructif (erreur, dégâts) | `text-destructive` |
| Page bg | `bg-background` |
| Surface muted | `bg-muted` |
| Card / panel (fiche perso, carte de sort) | `bg-card text-card-foreground` |
| Popover / dropdown | `bg-popover text-popover-foreground` |
| Primary action | `bg-primary text-primary-foreground` |
| Secondary action | `bg-secondary text-secondary-foreground` |
| Destructive action | `bg-destructive text-destructive-foreground` |
| Accent (hover, highlight) | `bg-accent text-accent-foreground` |
| Borders | `border-border` |
| Focus ring | `ring-ring` |

Never: `bg-white`, `bg-black`, `text-gray-*`, `border-gray-*`, any raw Tailwind palette color, any hardcoded
hex/oklch — breaks dark mode (`@variant dark`) and duplicates what `@theme` already centralizes.

Token missing for a real semantic need (e.g. a "success" state for a saved throw)? Add
`--color-success` (+ `.dark` override if the value differs) to `@theme` in `front/src/index.css` FIRST, then
use `text-success`/`bg-success`. Don't invent a one-off inline color.

## Spacing
- Tailwind tokens only. `gap-*` over margin for flex/grid children.
- Rhythm: `space-y-4` compact (form fields, list rows) · `space-y-6` default (page sections) · `space-y-10`
  comfortable (landing-style spacing).

## Typography
- Scale: `text-sm` → `text-3xl`.
- Weights: `font-medium` labels · `font-semibold` headings · `font-normal` body. No `font-bold` in UI chrome.
- `leading-tight` headings · `leading-relaxed` body.
- Native tags (`<h1>`–`<h6>`, `<p>`, `<label>`) styled via `@layer base` in `front/src/index.css` — don't
  recreate a heading/label wrapper component just to hold a text-stack className; if one doesn't exist yet in
  `components/atoms`, add the base-layer rule instead of inline overrides scattered per component.

## Border radius
`--radius-*` scale already defined in `@theme` (`sm` → `4xl`). Default `rounded-md` · Cards `rounded-lg` ·
Avatars/badges `rounded-full`.
