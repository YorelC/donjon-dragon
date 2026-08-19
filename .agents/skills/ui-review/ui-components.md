# shadcn/ui Component Patterns — donjon-dragon front

## Prefer shadcn primitives from `shared/components/atoms`
| Need | Use |
|---|---|
| Modal | `<Dialog>` |
| Notification | `<Toast>` (project uses `sonner`) |
| Dropdown | `<DropdownMenu>` |
| Form | `<Form>` + `react-hook-form` + `zod` (both already in front deps, via `@hookform/resolvers`) |
| Tooltip | `<Tooltip>` |
| Loading | `<Skeleton>` |
| Command palette | `<Command>` (project has `cmdk`) |

Check `shared/components/atoms` before installing — if the primitive already exists, edit in place, don't wrap it.
Missing? `npx shadcn@latest add <component>`.

## cn() — always for class merging
```tsx
import { cn } from '@/shared/utils/utils';
<div className={cn('rounded-lg border bg-card p-6', className)} />
```

## cva — 2+ visual variants
```tsx
const badgeVariants = cva('px-3 py-1 rounded-full text-xs font-medium', {
  variants: { variant: { hit: 'bg-muted text-foreground', miss: 'bg-destructive/10 text-destructive' } },
  defaultVariants: { variant: 'hit' },
});
```
Don't reach for `cva` just to avoid a repeated static chain — that's what a global `@layer components` class
is for (see `/design-system`). Use `cva` when there are real visual **variants**, not as a dedup trick.

## Button
```tsx
// Loading
<Button disabled={isRolling}>
  {isRolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isRolling ? 'Rolling…' : 'Roll'}
</Button>
// Icon-only — always aria-label
<Button variant="ghost" size="icon" aria-label="Delete character"><Trash2 className="h-4 w-4" /></Button>
```

## Form field
```tsx
<FormField control={form.control} name="name" render={({ field }) => (
  <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
)} />
```

## Empty state — never render nothing
```tsx
{characters.length === 0 && (
  <div className="flex flex-col items-center gap-3 py-16 text-center">
    <div className="rounded-full bg-muted p-4"><UsersIcon className="h-6 w-6 text-muted-foreground" /></div>
    <p className="text-sm font-medium">Aucun personnage</p>
    <p className="text-xs text-muted-foreground">Créez votre premier personnage pour commencer.</p>
  </div>
)}
```

## Skeleton — match real content shape
```tsx
<div className="space-y-3">
  <Skeleton className="h-5 w-2/3" />
  <Skeleton className="h-4 w-full" />
</div>
```

## Micro-interactions
```tsx
"transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"  // card hover
"transition-colors duration-150"                                        // color
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" // focus
```
