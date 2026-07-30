# Mission : dégraissage complet + mise en conformité architecturale (back + front)

Tu es développeur senior et gardien des conventions de ce repo. Ta mission a 4 phases strictement ordonnées. Tu ne passes à la phase suivante qu'une fois la précédente terminée, et tu t'ARRÊTES à la fin de la phase 2 pour me laisser valider le plan.

Contraintes globales, non négociables :
- DoD après chaque modification : `pnpm typecheck` puis `pnpm lint` puis `pnpm test`, dans cet ordre. Vérification par `git diff`, jamais sur une sortie textuelle.
- Interdits : `.env`, scripts de seed/migration MongoDB, CI, toute modification de comportement fonctionnel (ce refactor est isofonctionnel : structure et lisibilité uniquement).
- `knowledges/` est ma culture personnelle, PAS des règles métier : ne t'en sers jamais comme spécification.
- Commits : `refactor(scope): sujet` ou `docs(scope): sujet` ou `chore(lint): sujet`, un commit par lot cohérent.

---

## PHASE 0 : Lecture (aucune écriture)

1. Lis `AGENTS.md`, `04-granularite.md`, `package.json` des 3 paquets.
2. Inventorie `front/src/shared/` (ou l'équivalent existant) : liste les composants disponibles, leurs conventions de nommage, comment ils wrappent shadcn/ui. C'est la référence : les règles front ci-dessous doivent être illustrées avec les VRAIS noms de ce dossier.
3. Cartographie la structure actuelle de `front/src/` et de `back/src/` (arborescence, 2 niveaux).

## PHASE 1 : Graver les règles dans AGENTS.md + les armer dans ESLint

### 1a. Ajouter à AGENTS.md une section « Architecture stricte » avec exactement ces règles :

**Back (NestJS hexagonal) :**
- Chaque module suit la structure numérotée : `01-interface/` (controllers, gateways WS, DTO), `02-application/` (use cases), `03-domain/` (entités, ports, services métier purs), `04-infrastructure/` (adapters Mongoose, Redis, etc.). Aucun fichier de logique hors de ces 4 dossiers.
- Toute fonction/méthode : **20 lignes de corps maximum**. Au-delà : extraire des sous-fonctions nommées par leur intention.

**Front (React SPA) :**
- `front/src/pages/<route>/<route>.page.tsx` : SEUL point d'entrée d'une route (react-router), à la manière de Next.js. Un `.page.tsx` ne contient aucune logique : il compose des containers.
- `*.container.tsx` : le SEUL endroit où l'on appelle des hooks (queries TanStack, stores Zustand, hooks maison) et où l'on assemble les composants UI. Le container prépare les props et rend la view.
- `*.view.tsx` : composant PUR. Entrée = props, sortie = JSX. Interdits dans une view : hooks, stores, fetch, effets, et tout IMPORT de container. Une view se construit UNIQUEMENT avec les composants de `shared/components` (wrappers shadcn ou composés) et les views locales de sa page. Les zones à logique lui parviennent en props `ReactNode` (slots ou `children`) : c'est le container parent (ou la page) qui instancie les sous-containers et les injecte dans les slots de la view. Corollaire : une zone de page qui a sa propre logique devient sa propre paire container + view dans `_internal/` ; la composition de zones se fait toujours au niveau container ou page, jamais dans une view.
- Hooks : **20 lignes de corps maximum**. Un hook qui grossit se découpe en hooks et fonctions pures nommées qu'il compose.
- Fonctions front : 20 lignes de corps maximum, comme au back. Pour les views (JSX), découper en sous-views dès que le rendu dépasse ~60 lignes ou 3 niveaux d'imbrication.
- Jamais d'import direct de primitives radix/shadcn dans `pages/` : tout passe par `shared/components`.
- `_internal/` dans chaque dossier de page, regroupant TOUT ce qui n'appartient qu'au périmètre de cette page : `containers/`, `views/`, `hooks/`, `queries/` (TanStack Query : queryOptions, keys, mutations), `stores/` (Zustand local), `types.ts`. Rien de `_internal/` n'est importé depuis une autre page ; ce qui doit être partagé remonte dans `shared/` par une décision explicite (commit dédié).

Arborescence de référence à inclure dans AGENTS.md (adapte les noms aux vraies pages du projet) :
```
front/src/
├── pages/
│   └── fiche-personnage/
│       ├── fiche-personnage.page.tsx        # route : compose les containers, zéro logique
│       └── _internal/
│           ├── containers/stats.container.tsx   # hooks + orchestration, rend la view
│           ├── views/stats.view.tsx             # pur : props in, JSX out
│           ├── hooks/use-stats.ts               # <= 20 lignes, compose
│           ├── queries/personnage.queries.ts    # TanStack Query
│           ├── stores/stats.store.ts            # Zustand local page
│           └── types.ts
└── shared/
    └── components/                              # base shadcn + composés réutilisables
```

**Clean code et lecture en article (stepdown rule) :**
- Un fichier se lit de haut en bas comme un article : l'élément exporté principal en tête, les détails et helpers en dessous, chaque niveau d'abstraction appelle le niveau juste inférieur.
- Noms révélateurs d'intention, early returns, pas de `any`, pas de commentaire qui excuse du code illisible (on rend le code lisible à la place).

### 1b. Armer les règles dans l'outillage (sinon elles resteront des voeux)

Constat : les scripts `lint` des 3 paquets sont `echo 'ok'`. Mets en place un vrai lint :
- Installer ESLint (flat config) + typescript-eslint dans le monorepo, brancher `pnpm lint` réellement dans `shared`, `back`, `front`.
- Règles minimales : `max-lines-per-function: ["error", {"max": 20, "skipBlankLines": true, "skipComments": true}]` (avec override plus permissif UNIQUEMENT pour les fichiers `*.view.tsx` et `*.page.tsx`), `@typescript-eslint/no-explicit-any: error`, `no-restricted-imports` interdisant les primitives radix/shadcn hors de `shared/components`, une frontière d'import interdisant `pages/**/_internal/**` depuis une autre page, et une règle interdisant tout import de `*.container` dans les fichiers `*.view.tsx` (les zones à logique arrivent en slots ReactNode, jamais par import) (via `eslint-plugin-boundaries` ou `no-restricted-imports` avec patterns, overrides par type de fichier).
- Le lint doit passer sur le code CONFORME ; les violations existantes sont le sujet des phases 2-3, utilise des overrides temporaires par dossier plutôt que de désactiver les règles globalement, et liste ces overrides comme dette dans le rapport.
- Justifie chaque dépendance ajoutée en une ligne dans le commit.

Commit : `chore(lint): eslint flat config + regles architecture [degraissage]` puis `docs(agents): architecture stricte back/front [degraissage]`.

## PHASE 2 : Audit complet (AUCUNE modification de code)

Produis `docs/refactor/audit-degraissage.md` :
1. **Violations structure back** : fichiers hors 01/02/03/04, logique mal placée (Mongoose hors 04, imports 02<->04 directs).
2. **Fonctions et hooks > 20 lignes** : back + front, avec fichier, nom, nombre de lignes (mesure automatique : sortie du lint fraîchement installé).
3. **Violations structure front** : routes sans `.page.tsx`, logique dans des views, hooks appelés hors containers, imports shadcn directs, pages sans `_internal/`, fichiers de page importés depuis une autre page.
4. **Gras** : code mort (exports jamais importés), dépendances non utilisées (`npx depcheck` par paquet), duplications manifestes, fichiers orphelins, `console.log` oubliés.
5. **Plan de refactor ordonné en lots** : chaque lot = périmètre d'un commit, risque (faible/moyen), et l'ordre qui minimise les conflits (d'abord le gras sans déplacement, puis les déplacements de fichiers, puis les découpes de fonctions).

**STOP ICI.** Présente-moi le rapport et le plan de lots. Tu ne commences la phase 3 qu'après mon GO explicite.

## PHASE 3 : Exécution par lots (après mon GO)

- Un lot = un commit, DoD complet après chaque lot, `git diff` relu avant chaque commit.
- Déplacements de fichiers : mets à jour les imports partout, y compris dans les fichiers de test (les IMPORTS seulement, jamais la logique d'un test).
- Découpe de fonction : extraction de sous-fonctions nommées, comportement strictement identique, pas d'optimisation opportuniste.
- Si un lot casse un test et que la correction n'est pas évidente en 2 tentatives : n'insiste pas, note le lot comme bloqué dans le rapport et passe au suivant.

## PHASE 4 : Rapport final

Complète `docs/refactor/audit-degraissage.md` : lots exécutés / bloqués, overrides ESLint restants (la dette à résorber), métriques avant/après (nb de fonctions > 20 lignes, nb de fichiers déplacés, deps supprimées), et les 3 règles que les futurs agents violeront le plus probablement (pour renforcer leurs prompts).
