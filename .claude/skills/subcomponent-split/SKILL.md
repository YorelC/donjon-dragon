---
name: subcomponent-split
description: Split a donjon-dragon front (front/src) React component into named subcomponents in the same file when ≤150 lines. Triggers on any component creation or modification in front/src.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# SUBCOMPONENT SPLIT — donjon-dragon

Front only (`front/src`). Applies to `components/atoms` (shadcn primitives — edit in place, rarely split),
`components/molecules` (D&D composites: dice-roller, combat-log, hit-points, spell-card, item-card,
ability-score, skill-check), `components/routes` (pages).

## RULES

**Every UI boundary = named function.**
- Block > 8 lines? → subcomponent
- Block inside `.map`? → subcomponent (never anonymous JSX in map)
- Block needs a comment to understand? → subcomponent
- Can't name it in 3 words? → split more

**Form:**
- `function Name()` declared — never `const X = () =>` (DevTools needs the name)
- Parent component exported, subcomponents private (non-exported)
- Order: exported component top → subcomponents → helpers bottom
- Name = what it **represents** (DiceResultRow, SpellCardHeader) — not what it does
- `key` = stable data id, never index
- shadcn primitive exists in `components/atoms`? Use it. Never restyle a raw `<input>` or `<div>`.
- Repeated Tailwind chain across subcomponents → follow `/design-system` (global `@apply` class in
  `front/src/index.css`), not a copy-pasted className.

## EXTRACT TO OWN FILE WHEN
- File > 150 lines (project-wide limit, see CLAUDE.md)
- Subcomponent used by another file
- Subcomponent has 3+ own `useState`/`useEffect` → extract a `use-*.ts` hook first (Container/Presenter split)
- Subcomponent has > 3 props → group into an object, no prop drilling

## CHECKLIST
- [ ] No anonymous JSX block > 8 lines in exported component
- [ ] No anonymous JSX in `.map`
- [ ] Each subcomponent named after what it represents
- [ ] File ≤ 150 lines
- [ ] DevTools tree readable by name alone
