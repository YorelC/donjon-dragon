---
paths:
  - "front/src/**/*.view.tsx"
---

# Views : composants purs

- Entrée = props, sortie = JSX. **Interdits** : hooks, stores, fetch, effets.
- Une view se construit uniquement avec les composants de `@/shared/components` et les
  views locales de sa page. Jamais d'import direct de `radix-ui`, `cmdk` ou d'une autre
  primitive : tout passe par un wrapper de `shared/components/atoms/`.
- **Une view compose les containers de sa page**, directement, par import. Une zone qui
  a sa propre logique est un container : on l'importe là où on le pose. Jamais de prop
  `ReactNode` pour injecter de la logique — le slot déporte le montage loin de sa
  déclaration et rend l'arbre React DevTools illisible.

```tsx
// ✓ la view pose le container à l'endroit exact où il se rend
import { FriendsListContainer } from "../containers/friends-list.container";
export function FriendsView() {
  return <section><FriendsListContainer /></section>;
}

// ✗ le slot : owner et parent divergent, on ne sait plus qui rend quoi
export function FriendsView({ friendsList }: { friendsList: ReactNode }) {
  return <section>{friendsList}</section>;
}
```

- La view reste **sans hook, sans store, sans fetch, sans effet** : c'est ça, sa pureté.
  Composer un container n'y change rien, la logique reste dans le container.
- `children` reste légitime pour du contenu générique — layout, wrapper, carte — quand
  la view ignore ce qu'on lui passe. Ce n'est pas un slot de logique.
- Un container d'une **autre page** reste interdit (`CROSS_PAGE_INTERNAL_IMPORTS`) : ce
  qui doit servir ailleurs remonte dans `@/shared`, par un commit dédié.
- Corollaire : une zone de page qui a sa propre logique mérite sa propre paire
  container + view dans `_internal/`. Ce qui traverse une view en props, ce sont des
  données et des callbacks, jamais du JSX à logique.
- 60 lignes de corps maximum (le corps est du JSX). Au-delà, ou dès que le rendu dépasse
  3 niveaux d'imbrication, découper en sous-views.

## Découpe : quatre seuils, pas un jugement

Une view n'attend pas la limite de 60 lignes pour se découper. Dès qu'un de ces seuils
tombe, le bloc devient une fonction nommée dans le **même fichier** :

- bloc JSX de plus de **8 lignes** ;
- **tout** JSX anonyme dans un `.map` — une ligne de liste est toujours un composant ;
- bloc qui a besoin d'un commentaire pour se comprendre ;
- nom impossible à trouver en 3 mots : c'est qu'il en faut deux, de composants.

```tsx
// ✗ la ligne de liste est anonyme : illisible dans DevTools, intestable seule
{friends.map((friend) => (
  <Card key={friend.friendshipId}>{/* 20 lignes */}</Card>
))}

// ✓ chaque ligne porte son nom
{friends.map((friend) => (
  <FriendRow key={friend.friendshipId} friend={friend} removal={removal} />
))}
```

Forme imposée : `function Nom()` déclarée, jamais `const Nom = () =>` — DevTools a besoin
du nom. Le composant exporté en haut, ses sous-composants dessous, les helpers en bas,
dans l'ordre de lecture descendante. Un sous-composant qui dépasse **3 props** signale
des props à regrouper en un objet nommé — `removal`, `pagination`, `selection`.

On sort un sous-composant dans son propre fichier quand le fichier dépasse 150 lignes,
quand un autre fichier s'en sert, ou quand il porte 3 `useState` : dans ce dernier cas
c'est un hook de `_internal/hooks/` qu'il faut extraire d'abord.

Détail et checklist : skill `subcomponent-split`.

L'interdiction des primitives, la frontière entre pages et la limite de lignes sont
armées par ESLint (`frontViewPurityConfig`, `frontViewConfig`) : elles cassent le lint,
elles ne se négocient pas. L'absence de hook dans une view ne l'est pas — c'est une
règle de revue.
