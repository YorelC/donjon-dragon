# SaaS D&D — instructions

## Stack
Monorepo pnpm (`shared`, `back`, `front`), TypeScript strict.
- `shared` : schémas Zod partagés (`@donjon-dragon/shared`), contrat front ↔ back.
- `back` : NestJS (API HTTP), hexagonal par module, MongoDB via Mongoose.
- `front` : React 18 SPA (Vite), shadcn/ui + Tailwind v4, Zustand + TanStack Query.
Tests : Vitest (back + front), Playwright pour l'e2e (`front/e2e/`).

## Documentation de référence
- Lire `docs/README.md` avant toute modification fonctionnelle importante.
- `docs/PRODUCT.md`, `docs/REQUIREMENTS.md` et `docs/DECISIONS/` décrivent la cible
  normative. Le code existant décrit seulement l'état actuel.
- Toute nouvelle règle métier met à jour la spécification avant le plan et le code.
- Les transcripts sous `docs/HISTORY/` sont des archives non normatives. Ne les lire
  que pour retrouver l'origine d'une décision ou résoudre une ambiguïté.
- Une information absente n'est pas inventée : inscrire `DÉCISION REQUISE` avec les
  options et leurs conséquences.

## Clean Code — imposé
- **20 lignes de corps maximum** par fonction, et **un seul niveau d'abstraction** par
  fonction. Au-delà, extraire des sous-fonctions nommées par leur intention.
- Lecture descendante, en forme d'article : le quoi avant le comment, l'appelant juste
  au-dessus de l'appelé, chaque niveau appelant le niveau juste inférieur.
- Noms révélant l'intention. **3 paramètres maximum.** Pas de paramètre booléen de
  contrôle : il cache deux fonctions dans une.
- Zéro nombre ou chaîne magique : une constante nommée, ou rien.
- Pas de commentaire qui paraphrase le code. Un commentaire dit *pourquoi*, jamais
  *quoi* : si le code est illisible, on le rend lisible au lieu de l'excuser.
- Une fonction fait une chose, sans effet de bord caché. Early returns plutôt
  qu'imbrication.
- **Pas de `break` ni de `continue`** : extraire une fonction nommée, ou utiliser
  `find` / `filter` / `some` / `every`.
- **À partir de 3 conditions**, remplacer `if` / `switch` par un objet de dispatch
  `Record<Key, () => T>` appelé par sa clé, avec branche par défaut explicite.
- SOLID, KISS, DRY.

## Règles générales
- Pas de `any`. Validation Zod sur toute entrée externe.
- Repository pattern obligatoire : accès Mongo uniquement via un port, jamais Mongoose
  direct dans un use-case.
- Ces règles sont armées par ESLint (`eslint.config.base.mjs`) et, au back, par
  dependency-cruiser (`back/.dependency-cruiser.cjs`). Elles cassent le lint. Le seul
  override du monorepo est le shadcn vendu de `front/src/shared/components/atoms/` :
  on n'en ajoute pas.

## Architecture back
```
back/src/
├── modules/<module>/{presentation,application,domain,infrastructure,testing}/
├── kernel/{application,domain,infrastructure,testing}/   socle partagé
├── common/    plomberie Nest (guards, filters, pipes, decorators, security)
├── config/    contrat d'environnement Zod + namespaces
└── scripts/   composition roots hors application
```
Il n'existe **aucun dossier numéroté** `01-interface/` à `04-infrastructure/` : si tu
lis ça quelque part, le document est périmé.

Les conventions de chaque couche sont dans `.claude/rules/`, chargées quand tu ouvres un
fichier concerné. Carte détaillée, flux de bout en bout, justification des 19 règles
dependency-cruiser et modèle d'autorisation : `docs/architecture-back.md`.

Point de départ de tout refactor back : `pnpm --filter back lint:arch`, puis partir des
violations réelles et non d'une intuition de lecture.

## Architecture front
`pages/<route>/<route>.page.tsx` est le seul point d'entrée d'une route. Une page compose
des containers, un container appelle les hooks et rend une view, une view est pure. Tout
ce qui n'appartient qu'à une page vit dans son `_internal/`. Le détail est dans
`.claude/rules/front-*.md`.

## Doc-first NestJS
Versions : NestJS 10.x, `@nestjs/mongoose` 10, Mongoose 8, `@nestjs/config` 4,
`@nestjs/passport` 11, zod 3. Vérifier la doc de CES versions.

- Avant d'écrire une API NestJS que tu n'as pas déjà vue dans ce projet, consulte
  https://docs.nestjs.com/ et cite la page utilisée.
- Primitives du framework plutôt qu'équivalent maison : `ConfigService` et jamais
  `process.env`, un guard et jamais un `if` d'autorisation dans un controller, un
  exception filter et jamais des `try/catch` de mapping dispersés, l'injection et
  jamais un `new`.
- Doute, ou doc muette sur le cas : **arrête-toi et demande un lien.** Ne devine pas une
  signature, n'invente pas un décorateur, ne transpose pas un pattern d'un autre
  framework.
- **Décisions qui appartiennent à Charly**, à lui présenter avec leurs conséquences :
  transaction Mongo, ajout d'une lib tierce, introduction de rôles ou de permissions,
  tout ce qui élargit la surface d'attaque.

Pages d'entrée : `/modules`, `/fundamentals/custom-providers`, `/techniques/configuration`,
`/techniques/validation`, `/techniques/mongodb`, `/security/authentication`,
`/recipes/passport`, `/guards`, `/interceptors`, `/pipes`, `/exception-filters`,
`/fundamentals/testing`.

## Protocole de déplacement
Remonter du code d'un périmètre local vers un périmètre partagé est une **décision
explicite, dans un commit dédié** — jamais un effet de bord d'une autre tâche :
- `front/src/pages/<page>/_internal/` → `front/src/shared/`
- `back/src/modules/<module>/` → `back/src/kernel/`

Dans l'autre sens, rien ne descend : un module ne récupère pas du code partagé pour le
spécialiser, il définit son propre port.

## Définition de « terminé »
`pnpm typecheck`, `pnpm lint` ET `pnpm test` passent, dans cet ordre.
Vérifier par `git diff`, jamais sur une sortie textuelle.
Il n'existe pas de script `build` à la racine : ne pas l'invoquer.

## Interdits
Aucun refactor non demandé. Aucune dépendance ajoutée sans accord.
Ne jamais toucher `.env`, les scripts de seed ou de migration MongoDB, ni le CI.

## Pipeline et Kanban
Les commits suivent le format `type(scope): sujet`, sans identifiant de ticket ni
d'unité atomique imposé. Lire le fichier `MODE` à la racine avant toute tâche. Chaîne
de production, conventions de board et dual-sandbox : `docs/pipeline-hermes.md`.
