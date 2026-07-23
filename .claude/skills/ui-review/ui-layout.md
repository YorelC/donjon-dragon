# Layout Patterns — donjon-dragon front

## Page shell (`pages/<segment>/<segment>.page.tsx` and its `_internal/views/`)
```tsx
<div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Titre</h1>
      <p className="text-sm text-muted-foreground">Description</p>
    </div>
    <Button>Action principale</Button>
  </div>
</div>
```
Repeated across 2+ routes? Extract to a global `.page-shell` class in `front/src/index.css` (`@layer
components`) instead of copy-pasting the chain (see `/design-system`).

## Responsive card grid (character sheets, spell list, item grid)
```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
```

## Sidebar layout
```tsx
<div className="flex h-screen overflow-hidden">
  <aside className="hidden w-64 shrink-0 border-r border-border md:flex md:flex-col">{/* nav */}</aside>
  <main className="flex flex-1 flex-col overflow-y-auto">{/* content */}</main>
</div>
```

## Combat log / scrollable list polish
- Row hover: `hover:bg-muted/50 transition-colors`
- Sticky header (e.g. round/turn indicator): `sticky top-0 z-10 bg-background`
- Sortable/filterable column: `cursor-pointer select-none` + a lucide chevron icon
- Always show count/context (e.g. "Round 3 · 5 combatants") near the top of a long list
