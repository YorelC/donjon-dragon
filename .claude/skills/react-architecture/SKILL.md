---
name: react-architecture
description: Audit or refactor donjon-dragon front (front/src) component structure — too many props, god components, props drilling, logic mixed with UI, repeated JSX, oversized functions, hook extraction. NOT for styling → see design-system.
allowed-tools: Read, Grep, Glob, Edit, MultiEdit
---

# REACT ARCHITECTURE — donjon-dragon

Front only (`front/src`). Senior React engineer. Structure only — never touch logic while refactoring
structure, and vice versa.

Target shape: Container/Presenter per CLAUDE.md — `use-*.ts` (hook, all state/logic, 1 hook = 1
responsibility) → `*.container.tsx` (calls hooks, composes views, no JSX styling) → `*.view.tsx` (pure props
→ JSX, no hooks/state/effects). Not yet fully migrated everywhere — flag drift, don't silently "fix" scope
beyond what was asked.

## WORKFLOW
1. Read @antipatterns.md → identify red flags
2. Read @refactoring.md → pick technique
3. Apply. Flag any behaviour-affecting change explicitly.

## OUTPUT
- Before/after diffs only, not full files
- One-line explanation per change
