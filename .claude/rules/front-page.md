---
paths:
  - "front/src/**/*.page.tsx"
---

# Pages : points d'entrée de route

- `pages/<route>/<route>.page.tsx` est le SEUL point d'entrée d'une route react-router,
  à la manière de Next.js.
- Une page ne contient **aucune logique** : elle compose des containers. Pas de hook, pas
  de query, pas de store.
- C'est ici, ou dans un container parent, que se fait la composition des zones :
  `<FriendsView friendsList={<FriendsListContainer />} />`. Jamais dans une view.
- Tout ce qui n'appartient qu'à cette page vit dans son `_internal/` :
  `containers/`, `views/`, `hooks/`, `queries/`, `stores/`, `types/`.
- 60 lignes de corps maximum. Jamais d'import direct de primitives radix ou shadcn.

```
front/src/pages/profile/friends/
├── friends.page.tsx              route : compose les containers, zéro logique
└── _internal/
    ├── containers/               hooks + orchestration, rendent les views
    ├── views/                    purs : props in, JSX out
    ├── hooks/                    <= 20 lignes, composent
    ├── queries/                  TanStack : queryOptions, keys, mutations
    └── types/                    schémas Zod du formulaire
```
