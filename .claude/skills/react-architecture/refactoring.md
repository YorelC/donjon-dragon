# Refactoring Techniques — donjon-dragon front

## Extract Hook
When: 3+ `useState` in one component, or business logic mixed with UI.
Result: component calls one `use-*.ts` hook, returns `{ state, handlers }`. Test the hook with
`renderHook` (Vitest), independent of any JSX.

## Extract Component
When: repeated JSX, or a block needs > 3 words to describe.
Name after what it **represents**, not what it does (`AbilityScoreBadge`, not `RenderScore`).

## Extract Field Sub-Component
When: a form has 3+ inline field blocks → parent becomes a wall.
Rule: sub-component receives only `value` + a semantic `onChange`. Owns its own label, layout, validation
message.
When NOT: single form, < 5 props, no reuse planned, < 3 total fields.

```tsx
// ✅
<CharacterNameField value={form.name} onChange={(v) => updateField('name', v)} />

function CharacterNameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <FormField label="Nom" name="name" required placeholder="Ex: Aragorn"
      value={value} onChange={(e) => onChange(e.target.value)} />
  );
}
```

## Introduce Parameter Object
When: a function has 3+ parameters.

## Replace Handler with Orchestration
When: an event handler contains conditional business logic.
Result: a 3-line orchestration in the handler, logic extracted to the `use-*.ts` hook.

```tsx
// ❌ logic in the handler
function onRoll() {
  const result = Math.floor(Math.random() * 20) + 1;
  if (result === 20) setLog((l) => [...l, 'Critical!']);
  else setLog((l) => [...l, `Rolled ${result}`]);
}

// ✅ orchestration only — logic lives in useDiceRoller()
function onRoll() {
  const result = roll();
  logResult(result);
}
```

## Checklist
- [ ] Testable without rendering children? (hook testable via `renderHook`, independent of the view)
- [ ] Reusable without copy-paste?
- [ ] Readable in 6 months?
- [ ] Followable by a junior without comments?
