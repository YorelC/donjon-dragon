---
paths:
  - "front/src/**/*.view.tsx"
---

# Views : composants purs

- Entrée = props, sortie = JSX. **Interdits** : hooks, stores, fetch, effets.
- Une view se construit uniquement avec les composants de `@/shared/components` et les
  views locales de sa page. Jamais d'import direct de `radix-ui`, `cmdk` ou d'une autre
  primitive : tout passe par un wrapper de `shared/components/atoms/`.
- **Une view n'importe jamais un container.** Une zone à logique lui arrive en prop
  `ReactNode`, slot nommé ou `children`, injectée par le container parent ou par la page.

```tsx
// ✗ la view compose : elle devient dépendante de la logique
import { FriendsListContainer } from "../containers/friends-list.container";
export function FriendsView() {
  return <section><FriendsListContainer /></section>;
}

// ✓ la view reçoit un slot : elle reste pure et testable sans provider
export function FriendsView({ friendsList }: { friendsList: ReactNode }) {
  return <section>{friendsList}</section>;
}
```

- Corollaire : une zone de page qui a sa propre logique mérite sa propre paire
  container + view dans `_internal/`. La composition se fait au niveau container ou
  page, jamais dans une view.
- 60 lignes de corps maximum (le corps est du JSX). Au-delà, ou dès que le rendu dépasse
  3 niveaux d'imbrication, découper en sous-views.

Les trois premières règles sont armées par ESLint (`frontViewPurityConfig`,
`frontViewConfig`) : elles cassent le lint, elles ne se négocient pas.
