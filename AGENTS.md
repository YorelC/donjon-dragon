# Instructions agents — SaaS D&D

## Stack
Monorepo pnpm (`shared`, `back`, `front`), TypeScript strict.
- `shared` : schémas Zod partagés (`@donjon-dragon/shared`).
- `back` : NestJS (API + WebSocket Socket.IO), architecture hexagonale (`01-interface` → `02-application` → `03-domain` → `04-infrastructure`), MongoDB via Mongoose, Redis pour le combat.
- `front` : React 18 SPA (Vite), shadcn/ui + Tailwind v4, Zustand + TanStack Query.
Tests : Vitest (back + front).

## Règles
- Pas de `any`. Validation Zod sur toute entrée externe.
- Repository pattern obligatoire : accès Mongo uniquement via un port `03-domain/`, jamais Mongoose direct dans `02-application/`.
- `02-application/` et `04-infrastructure/` ne s'importent jamais entre eux, seulement via `03-domain/`.

## Architecture stricte

Ces règles sont armées dans ESLint (`eslint.config.base.mjs`) : ce ne sont pas
des voeux, elles cassent le lint. Les overrides temporaires listés dans
`back/eslint.config.mjs` et `front/eslint.config.mjs` sont de la dette,
inventoriée dans `docs/refactor/audit-degraissage.md` — on en retire, jamais
on n'en ajoute.

### Back (NestJS hexagonal)
- Chaque module suit la structure numérotée : `01-interface/` (controllers,
  gateways WS, DTO), `02-application/` (use cases), `03-domain/` (entités,
  ports, services métier purs), `04-infrastructure/` (adapters Mongoose, Redis).
  Aucun fichier de logique hors de ces 4 dossiers.
- Toute fonction ou méthode : **20 lignes de corps maximum**. Au-delà, extraire
  des sous-fonctions nommées par leur intention.

### Front (React SPA)
- `pages/<route>/<route>.page.tsx` : SEUL point d'entrée d'une route
  (react-router), à la manière de Next.js. Un `.page.tsx` ne contient aucune
  logique : il compose des containers.
- `*.container.tsx` : le SEUL endroit où l'on appelle des hooks (queries
  TanStack, stores Zustand, hooks maison) et où l'on assemble les composants UI.
  Le container prépare les props et rend la view.
- `*.view.tsx` : composant PUR. Entrée = props, sortie = JSX. Interdits dans une
  view : hooks, stores, fetch, effets. Une view se construit UNIQUEMENT avec les
  composants de `shared/components` et les views locales de sa page.
- Une view **n'importe jamais un container**. Une zone à logique lui arrive en
  prop `ReactNode` (slot nommé ou `children`), injectée par le container parent
  ou par la page. Corollaire : une zone de page qui a sa propre logique mérite
  sa propre paire container + view dans `_internal/` ; la composition de ces
  zones se fait au niveau container ou page, jamais dans une view.

```tsx
// ✗ la view compose — elle devient dépendante de la logique
import { FriendsListContainer } from "../containers/friends-list.container";
export function FriendsView() {
  return <section><FriendsListContainer /></section>;
}

// ✓ la view reçoit un slot — elle reste pure et testable sans provider
export function FriendsView({ friendsList }: { friendsList: ReactNode }) {
  return <section>{friendsList}</section>;
}
// et la page (ou le container parent) compose :
<FriendsView friendsList={<FriendsListContainer />} />
```
- Hooks : **20 lignes de corps maximum**. Un hook qui grossit se découpe en
  hooks et fonctions pures nommées qu'il compose.
- Fonctions front : 20 lignes maximum, comme au back. Les views et les pages ont
  droit à 60 lignes (leur corps est du JSX) : au-delà, découper en sous-views —
  de même dès que le rendu dépasse 3 niveaux d'imbrication.
- Jamais d'import direct de primitives radix/shadcn dans `pages/` : tout passe
  par `shared/components`. Les wrappers vivent dans `shared/components/atoms/`
  (générés par le CLI shadcn, non refactorés) et `shared/components/molecules/`
  (composés maison).
- `_internal/` dans chaque dossier de page regroupe TOUT ce qui n'appartient
  qu'à cette page : `containers/`, `views/`, `hooks/`, `queries/` (TanStack :
  queryOptions, keys, mutations), `stores/` (Zustand local), `types/`. Rien de
  `_internal/` n'est importé depuis une autre page ; ce qui doit être partagé
  remonte dans `shared/` par une décision explicite (commit dédié).

```
front/src/
├── pages/
│   └── characters/
│       ├── characters.page.tsx                   # route : compose les containers, zéro logique
│       └── _internal/
│           ├── containers/characters.container.tsx   # hooks + orchestration, rend la view
│           ├── views/character-sheet.view.tsx        # pur : props in, JSX out
│           ├── hooks/use-character-form.ts           # <= 20 lignes, compose
│           ├── queries/use-character.ts              # TanStack Query
│           ├── stores/character.store.ts             # Zustand local à la page
│           └── types/character-schema.ts
└── shared/
    ├── components/atoms/       # wrappers shadcn générés
    ├── components/molecules/   # composés maison (form-text-input, hit-points…)
    ├── components/layout/      # nav, private-route
    ├── api/                    # client fetch + refresh
    ├── constants/              # routes, api-routes
    ├── hooks/ · stores/ · types/ · utils/
```

### Clean code et lecture en article (stepdown rule)
- Un fichier se lit de haut en bas comme un article : l'élément exporté
  principal en tête, les détails et helpers en dessous, chaque niveau
  d'abstraction appelant le niveau juste inférieur.
- Noms révélateurs d'intention, early returns, pas de `any`, pas de commentaire
  qui excuse du code illisible — on rend le code lisible à la place.

## Définition de « terminé »
`pnpm typecheck`, `pnpm lint` ET `pnpm test` passent, dans cet ordre.
Vérifier par `git diff`, jamais sur une sortie textuelle.
Il n'existe pas de script `build` à la racine : ne pas l'invoquer.

## Chaîne de production (pipeline v3, détail dans hermes/01-equipe.md)
Charly ⇄ `margarette` (clarification, réponses R-NNN via skill product) → ticket [SPEC] →
`bernadette` (spec en unités atomiques UA-NNN, `specs/`) →
`architecte` (ADR, schémas Zod `shared/`, ports `03-domain/`, plan E-NNN) → [`designer` si UI] →
`orchestrateur` (découpe en tickets de 1 à 3 UA) →
[`testeur` ∥ `ouvrier`/`dev-senior`] en dual-sandbox → ticket [INTEG] →
`revieweur` (fusion tests+code, contrôle de traçabilité UA↔test↔commit) →
`devops` (CI, déploiement) → `scribe` (changelog, doc). `securite` : audit transversal avant release.
Routage du code : seules les UA taguées [ALGO] et les bugs difficiles vont à `dev-senior`
(pont claude -p) ; tout le reste va à `ouvrier`. Les tests sont écrits par `testeur`, jamais
par l'architecte ni par les devs.
Chaque agent ne franchit jamais l'étape suivante à la place de celui dont c'est le rôle.

## Interdits
Aucun refactor non demandé. Aucune dépendance ajoutée sans justification.
Ne jamais toucher `.env`, les scripts de seed/migration MongoDB, ni le CI.

## Kanban (board Hermès dnd-saas)
- Chaque tâche vient d'un ticket t_xxxx ; l'ID figure dans chaque commit :
  `type(scope): sujet [t_xxxx][UA-NNN]`.
- Lire le fichier `MODE` à la racine avant toute tâche ; terminer par `kanban_complete`
  avec metadata (changed_files, commands_run, test_results, next_agent_hints).
- Blocages normalisés : `review-required:` / `decision-needed:` / `quota:` / `dependency:`
- Granularité : standard défini dans `04-granularite.md` (chaîne R → UA → INV → E → ticket → test).
  Un ticket de code = 1 à 3 UA, une seule couche hexagonale. Ticket flou ou trop gros
  → `kanban_block("dependency: ticket à redécouper — <motif>")` : refuser est un succès.
- Dual-sandbox : le `testeur` ne lit que `shared/` + `03-domain/` ; les devs ne lisent
  jamais les fichiers de test du testeur ; fusion chez le `revieweur`.
- Prompts des profils et documentation du pipeline : dossier `hermes/` de ce repo.
