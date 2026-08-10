---
paths:
  - "front/src/**/*.container.tsx"
---

# Containers

- Le container est le **seul** endroit où l'on appelle des hooks : queries TanStack,
  stores Zustand, hooks maison. Il prépare les props et rend sa view.
- Il ne contient pas de JSX de présentation : il assemble. Le rendu appartient à la view.
- Une zone à logique se passe à une view en prop `ReactNode`, jamais en important la
  view d'une autre page.
- 20 lignes de corps maximum. Un container qui grossit signale une view à découper en
  sous-views, ou une logique à extraire dans un hook de `_internal/hooks/`.
- Jamais d'import direct de primitives radix ou shadcn : tout passe par
  `@/shared/components`.

Les hooks de la page vivent dans `_internal/hooks/` (20 lignes max, ils composent), les
queries TanStack dans `_internal/queries/`, les stores Zustand locaux dans
`_internal/stores/`, les schémas dans `_internal/types/`.

**Rien de `_internal/` n'est importé depuis une autre page** : c'est armé par ESLint
(`CROSS_PAGE_INTERNAL_IMPORTS`). Ce qui doit être partagé remonte dans
`front/src/shared/` par une décision explicite, dans un commit dédié.
