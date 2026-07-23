# Anti-patterns & Golden Rules — donjon-dragon front

## Red flags
- [ ] > 3 props on a component
- [ ] > 20 lines in a function (project-wide rule, CLAUDE.md)
- [ ] > 150 lines in a file (project-wide rule, CLAUDE.md)
- [ ] Props drilling > 2 levels
- [ ] Copy-pasted JSX
- [ ] Logic and UI in the same component (violates Container/Presenter split)
- [ ] > 3 useState in one component
- [ ] Comments explaining what code does (rename instead)

## Anti-pattern table
| ❌ | ✅ |
|---|---|
| Props drilling via render prop | Extract to a `use-*.ts` hook, compose in container |
| God component | Decompose: `<DiceRoller />` `<CombatLog />` `<HitPoints />` (molecules) |
| Business logic in JSX handler | Named function in the `use-*.ts` hook |
| `key={index}` | Stable unique id from data (e.g. character/spell id) |
| Inline ternary with complex JSX | Named subcomponent |
| `useEffect` for derived state | Compute inline or `useMemo` |
| Logic + JSX in one `.tsx` file | Split into `use-x.ts` (logic) + `x.view.tsx` (JSX) + `x.container.tsx` (wiring) |

## Hard limits
| Threshold | Action |
|---|---|
| > 3 props | Extract hook or group into an object |
| > 20 lines | Decompose |
| > 150 lines (file) | Split sub-components / extract hook |
| > 3 useState | Extract hook |
| Props drilling > 2 levels | Composition, or lift to a hook both levels share |

## Golden Rules
1. **Max 3 props** — extract hook, reduce to real props
2. **Handlers orchestrate** — `rollDice()` → `applyResult()` → `logAction()`, logic in the hook
3. **Components render, hooks think** — `const { roll, history } = useDiceRoller()`
4. **Name repeated JSX** — `<SpellCard key={spell.id} />` not an inline `<div className="...">`
5. **Named sub-components** — `function SpellCardHeader()` not an inline arrow. Visible in DevTools. Name = what it represents.
