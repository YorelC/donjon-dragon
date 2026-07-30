# Audit de dégraissage — back + front

Mesuré le 2026-07-30 sur `main` (après `chore(lint)` + `docs(agents)`).
Source des chiffres : ESLint fraîchement installé, `depcheck`, et un scan
d'imports (aucun module n'est déclaré mort sans vérification manuelle).

État de la DoD au moment de l'audit :

| Commande | Résultat |
|---|---|
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ (avec les overrides de dette du § 6) |
| `pnpm test` | ❌ — 2 causes pré-existantes, voir § 5 |

---

## 1. Violations de structure — back

**Aucune violation bloquante.** Les 5 modules (`auth`, `character`, `combat`,
`friendship`, `user`) respectent le découpage `01`→`04`.

| Constat | Fichiers | Gravité |
|---|---|---|
| Fichiers de logique hors des 4 couches | aucun (`app.module.ts`, `main.ts`, `typed-express.d.ts` sont des racines légitimes) | — |
| Mongoose hors `04-infrastructure/` | `auth`, `character`, `friendship`, `user` → `01-interface/*.module.ts` | acceptable : `MongooseModule.forFeature` est du câblage DI, pas de l'accès données |
| Import direct `02-application` → `04-infrastructure` | 15 occurrences, **toutes dans des `*.test.ts`** | acceptable : un test d'use-case doit instancier ses adapters in-memory |
| Import `04-infrastructure` → `02-application` | aucun | — |
| Module `user` sans `02-application/` | `back/src/user/` | à surveiller : les use-cases user vivent dans `auth/02-application` |
| `back/src/scripts/` hors des 4 couches | `seed-users.script.ts` | acceptable : script hors application, exclu du périmètre par consigne |

Point de nommage (mineur, non bloquant) : dans `combat/03-domain/`, `dice.entity.ts`
et `combat.entity.ts` ne contiennent que des types, la logique étant dans
`dice.ts` / `combat.ts` — alors qu'ailleurs `*.entity.ts` porte types **et**
fonctions (`character.entity.ts`, `friendship.entity.ts`). Incohérence de
convention, pas une duplication.

## 2. Fonctions et hooks > 20 lignes

Mesure : `eslint` avec `max-lines-per-function` (20, hors lignes vides et
commentaires ; 60 pour `*.view.tsx` et `*.page.tsx`).

**Total : 65 fonctions hors limite** — 7 au back, 58 au front (dont 39 dans du
shadcn généré, voir § 6).

### Back (7)

| Fichier | Fonction | Lignes |
|---|---|---|
| `auth/02-application/login.use-case.ts` | `execute` | 23 |
| `auth/02-application/refresh-tokens.use-case.ts` | `execute` | 27 |
| `auth/02-application/verify-email.use-case.ts` | `execute` | 27 |
| `character/03-domain/character.entity.ts` | `createCharacter` | 21 |
| `friendship/01-interface/friendship.controller.ts` | `sendFriendRequest` | 26 |
| `friendship/01-interface/friendship.controller.ts` | `acceptFriendRequest` | 26 |
| `friendship/01-interface/friendship.controller.ts` | `refuseFriendRequest` | 23 |

Les 3 méthodes de `friendship.controller.ts` sont le même patron : un `try` qui
appelle un use-case suivi d'une cascade de `instanceof` → exception HTTP. Une
fonction de mapping erreur domaine → exception HTTP les ramène toutes sous 20.

### Front — code applicatif (14)

| Fichier | Fonction | Lignes | Limite |
|---|---|---|---|
| `App.tsx` | `App` | 27 | 20 |
| `pages/profile/friends/…/containers/friends.container.tsx` | `FriendsContainer` | 63 | 20 |
| `pages/combat/_internal/containers/combat.container.tsx` | `CombatContainer` | 54 | 20 |
| `pages/register/_internal/hooks/use-register-form.ts` | `useRegisterForm` | 46 | 20 |
| `pages/combat/_internal/hooks/use-combat.ts` | `useCombat` | 42 | 20 |
| `pages/login/_internal/containers/login.container.tsx` | `LoginContainer` | 39 | 20 |
| `pages/characters/…/containers/characters.container.tsx` | `CharactersContainer` | 36 | 20 |
| `pages/characters/…/containers/character-form.container.tsx` | `CharacterFormContainer` | 29 | 20 |
| `pages/register/_internal/containers/register.container.tsx` | `RegisterContainer` | 24 | 20 |
| `shared/api/refresh.ts` | `performRefresh` | 21 | 20 |
| `pages/profile/friends/…/views/friends.view.tsx` | `FriendsView` | 84 | 60 |
| `pages/register/_internal/views/register.view.tsx` | `RegistrationForm` | 70 | 60 |
| `pages/combat/_internal/views/dice-roller.view.tsx` | `DiceRollerView` | 69 | 60 |
| `pages/characters/…/views/character-form.view.tsx` | `CharacterFormView` | 67 | 60 |

### Front — `shared/components/` (44)

- `atoms/` : **39 fonctions** hors limite, sur 16 fichiers. Code généré par le
  CLI shadcn — **hors périmètre du refactor**, override permanent (§ 6).
- `molecules/` : **5 fonctions** hors limite, toutes dans des fichiers jamais
  importés (`combat-log` 111 l., `dice-roller` 138 l., `skill-check` 136 l.,
  `item-card` 78 l., `spell-card` 76 l., `ability-score` 54 l.). Elles
  disparaissent avec le lot 1 — inutile de les découper avant de les supprimer.
- `layout/nav.tsx` : `Nav` (29) et `MobileNav` (33).

## 3. Violations de structure — front

La structure `pages/<route>/<route>.page.tsx` + `_internal/` est **respectée
partout** : 11 pages, 11 `.page.tsx`, tous de 5 à 7 lignes et sans logique,
11 dossiers `_internal/`. Aucun import cross-page.

| # | Violation | Emplacement | Gravité |
|---|---|---|---|
| F1 | Une view appelle des hooks (`useState` ×2) — une view doit être pure | `pages/combat/_internal/views/dice-roller.view.tsx:19-20` | **haute** — c'est la règle front la plus structurante |
| F2 | `shared/` importe le `_internal` d'une page | `shared/components/layout/nav.tsx:6` → `@/pages/login/_internal/queries/use-logout` | **haute** — inverse la dépendance shared → pages |
| F3 | Import direct d'une primitive hors wrapper | `pages/profile/_internal/views/profile-layout.view.tsx:2` (`lucide-react`), `pages/profile/friends/…/queries/use-send-friend-request.ts:2` (`sonner`) | faible — icônes et fonction `toast()`, pas des primitives de rendu ; carve-out assumé, la règle ne cible que radix/shadcn/cmdk |
| F4 | Hooks appelés hors container | `App.tsx` (`useAuthStore` dans `HomeRoute`) | faible — `HomeRoute` est un aiguillage de route, pas une view |
| F5 | Nommage de fichier hors convention kebab-case | `shared/hooks/useLocalStorage.tsx` (et extension `.tsx` sans JSX) | faible |

## 4. Le gras

### 4a. Code mort — 2 610 lignes jamais importées

| Périmètre | Fichiers | Lignes |
|---|---|---|
| `front/src/shared/components/atoms/` | 16 (accordion, alert-dialog, avatar, checkbox, collapsible, command, dropdown-menu, menubar, popover, radio-group, separator, skeleton, switch, table, textarea, tooltip) | 1 552 |
| `front/src/shared/components/molecules/` | 7 (ability-score 98, combat-log 155, dice-roller 202, hit-points 42, item-card 141, skill-check 175, spell-card 152) | 965 |
| `front/src/shared/constants/translations/` | `transRacesClasses.ts` | 29 |
| `back/src/**/04-infrastructure/` | `null-email-sender` 11, `in-memory-refresh-token.repository` 29, `in-memory-character.repository` 24 | 64 |

Nuance importante :
- Les **atoms** sont un catalogue shadcn. Les supprimer économise des lignes
  mais ils se régénèrent en une commande — **je recommande de les garder**.
- Les **molecules** sont du code maison, et deux d'entre elles
  (`combat-log.tsx` 155 l., `dice-roller.tsx` 202 l.) **doublonnent** des views
  vivantes bien plus courtes (`combat-log.view.tsx` 38 l.,
  `dice-roller.view.tsx` 88 l.). C'est le vrai gras : 965 lignes à supprimer.
- Les 3 adapters in-memory du back sont morts **parce que les tests qui les
  utilisaient ont été supprimés**. À supprimer aussi, ou à re-brancher quand les
  tests reviennent — décision à prendre, pas un automatisme.

### 4b. Symboles morts détectés par le lint (17)

Imports et variables jamais utilisés : `Controller` (×2, containers characters
et login), `hashVerificationToken` (register.use-case), `SendFriendRequestDto`
(friendship.controller), `Model` (seed-users), `conMod` (character.entity),
`ApiError` + `API_ROUTES` (api.test), `within` (nav.test), `AlertDescription`
(combat-log), `cn` (dice-roller) ; `prefer-const` ×5 ; `no-useless-assignment`
×1 (`levelColor` dans spell-card).

### 4c. Dépendances non utilisées (`depcheck`)

| Paquet | Dépendance | Verdict |
|---|---|---|
| back | `@nestjs/passport` | supprimable — l'auth passe par des guards maison, pas par passport |
| back | `ioredis` | **à conserver** — Redis pour le combat est au planning (AGENTS.md) ; sinon supprimer |
| back | `@nestjs/schematics`, `@nestjs/testing`, `@vitest/coverage-v8` | outillage, faux positifs |
| front | `@shadcn/react` | supprimable — les atoms importent `radix-ui` directement ; en prime c'est ce paquet qui tire un peer `react@>=19` non satisfait |
| back, front | `@donjon-dragon/shared` signalé « manquant » | faux positif : résolu par le workspace pnpm |

### 4d. `console.log`

4 occurrences, **toutes légitimes** : `main.ts:10` (démarrage serveur) et
`seed-users.script.ts` (×3, sortie d'un script CLI, hors périmètre).

## 5. `pnpm test` ne passe pas — 2 causes pré-existantes

Aucune n'est due au dégraissage ; les deux doivent être traitées, sinon la DoD
reste inatteignable et le lint ne sert à rien.

1. **`shared` n'a aucun fichier de test** → `vitest run` sort en code 1 et
   arrête le `pnpm -r test` avant même que `back` et `front` ne tournent.
   Correctif : `vitest run --passWithNoTests`.
2. **`front` : 58 tests verts mais 2 rejets non gérés** →
   `shared/api/refresh.ts:13`. `inFlight.finally(...)` crée une promesse dérivée
   que personne n'attend : quand le refresh échoue, elle rejette sans handler.
   Correctif : relâcher le verrou dans la chaîne même de `inFlight`
   (`try/finally` dans une fonction interne) plutôt qu'un `.finally()` détaché.
   Ce correctif fait aussi tomber `performRefresh` sous les 20 lignes.

## 6. Overrides ESLint en place = la dette

Le lint passe aujourd'hui grâce à ces overrides. **Chaque ligne supprimée est un
lot terminé.** Ils sont volontairement listés dossier par dossier, jamais en
désactivation globale.

### Non-dette (carve-outs assumés)
| Override | Fichier | Raison |
|---|---|---|
| `max-lines-per-function: off` sur `src/shared/components/atoms/**` | `front/eslint.config.mjs` | code généré par le CLI shadcn, régénérable |
| `max-lines-per-function: off` sur `**/*.test.ts(x)` | `eslint.config.base.mjs` | un `describe()` est un conteneur, pas une unité de logique |
| `argsIgnorePattern: "^_"` | `eslint.config.base.mjs` | paramètre imposé par un port, volontairement ignoré |

### Dette à résorber
| # | Override | Paquet | Lot qui le retire |
|---|---|---|---|
| D1 | `max-lines-per-function` off sur `src/auth/02-application/**` | back | L5 |
| D2 | `max-lines-per-function` off sur `src/character/03-domain/**` | back | L5 |
| D3 | `max-lines-per-function` off sur `src/friendship/01-interface/**` | back | L4 |
| D4 | `no-unused-vars` off sur 4 fichiers back | back | L2 |
| D5 | `max-lines-per-function` off sur `src/pages/**/containers/**` | front | L6 |
| D6 | `max-lines-per-function` off sur `src/pages/**/hooks/**` | front | L6 |
| D7 | `max-lines-per-function` off sur `src/pages/**/views/**` | front | L7 |
| D8 | `max-lines-per-function` off sur `src/App.tsx` | front | L7 |
| D9 | `max-lines-per-function` off sur `src/shared/api/refresh.ts` | front | L3 |
| D10 | `max-lines-per-function` off sur `src/shared/components/molecules/**` | front | L1 (suppression) |
| D11 | `max-lines-per-function` off sur `src/shared/components/layout/**` | front | L8 |
| D12 | `no-unused-vars` / `prefer-const` / `no-useless-assignment` off (5 globs) | front | L2 |
| D13 | `no-restricted-imports` off sur `nav.tsx` | front | L8 |

## 7. Plan de refactor, ordonné en lots

Ordre choisi : d'abord le gras sans déplacement (moins on refactore de lignes
qu'on va supprimer, mieux c'est), puis les corrections de frontière, puis les
découpes de fonctions — de la plus isolée à la plus large.

| Lot | Périmètre | Contenu | Risque | Overrides retirés |
|---|---|---|---|---|
| **L0** | `shared/package.json`, `front/src/shared/api/refresh.ts` | Débloquer la DoD : `--passWithNoTests` sur shared, corriger le `.finally()` détaché de `refresh.ts` (§ 5) | faible | D9 |
| **L1** | `front/src/shared/components/molecules/`, `constants/translations/` | Supprimer les 7 molecules et `transRacesClasses.ts` jamais importés (965 + 29 lignes). Les molecules vivantes (`field-error`, `form-*-input`) restent | faible — zéro import à mettre à jour | D10 |
| **L2** | 10 fichiers back + front | Supprimer les imports/variables morts, `prefer-const`, `no-useless-assignment` (§ 4b) | faible — `--fix` sur la majorité | D4, D12 |
| **L3** | `back/src/**/04-infrastructure/` | **Décision requise** : supprimer les 3 adapters in-memory morts, ou les garder en attendant le retour des tests | faible | — |
| **L4** | `back/package.json`, `front/package.json` | Retirer `@nestjs/passport` et `@shadcn/react`. **Décision requise** sur `ioredis` | faible | — |
| **L5** | `back/src/friendship/01-interface/` | Extraire le mapping erreur domaine → exception HTTP, partagé par les 3 méthodes du controller | faible — patron répété identique | D3 |
| **L6** | `back/src/auth/02-application/`, `character/03-domain/` | Découper les 4 fonctions > 20 lignes en sous-fonctions nommées | moyen — cœur métier auth, couvert par 3 tests seulement | D1, D2 |
| **L7** | `front/src/pages/**/containers/`, `**/hooks/` | Découper les 6 containers et 2 hooks > 20 lignes : sortir la logique dans des hooks composés | moyen — 8 fichiers, peu de tests derrière | D5, D6 |
| **L8** | `front/src/pages/**/views/`, `App.tsx` | Découper les 4 views > 60 lignes en sous-views. **Corrige F1** au passage : sortir les 2 `useState` de `dice-roller.view.tsx` vers son container | moyen — la correction de F1 change la frontière container/view | D7, D8 |
| **L9** | `front/src/shared/components/layout/`, `pages/login/_internal/queries/` | **Corrige F2** : remonter `use-logout` de `pages/login/_internal/` vers `shared/`, puis découper `Nav` et `MobileNav` | faible — un seul consommateur | D11, D13 |
| **L10** | `front/src/shared/hooks/` | **Corrige F5** : renommer `useLocalStorage.tsx` → `use-local-storage.ts` (2 imports à mettre à jour) | faible | — |

Deux décisions m'attendent avant L3 et L4 : le sort des adapters in-memory du
back, et celui d'`ioredis`.
