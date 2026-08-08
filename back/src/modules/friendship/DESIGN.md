# Module `friendship` — spec de conception (pour l'ouvrier)

Archi hexagonale, mêmes conventions que `auth/` et `user/`. Fonctions ≤20 lignes,
fichiers ≤150 lignes, `any` interdit, kebab-case + suffixes. Tests colocalisés
`src/**/*.test.ts`, écrits RED avant l'implémentation.

## Déjà fait par l'Architecte (ne pas refaire)

- `shared/src/friendship-schema.ts` — `FriendshipSchema`, `FriendshipStatusEnum`,
  `SendFriendRequestSchema`, `SearchUsersSchema` + types (exportés via `index.ts`).
- `03-domain/friendship.entity.ts` — fonctions pures + test vert :
  `createFriendRequest(requesterId, recipientId)`, `acceptFriendRequest(f, actingUserId)`,
  `refuseFriendRequest(f, actingUserId)`, `involvesUser(f, userId)`, `friendIdFor(f, userId)`.
- `03-domain/friendship.repository.port.ts` — `FriendshipRepositoryPort`.
- `03-domain/friendship.errors.ts` — toutes les erreurs domain.
- Module `user/` : `UserRepositoryPort` gagne `findByDisplayName` + `searchByDisplayName`
  (implémentés Mongo + in-memory), index Mongoose `unique` sur `displayName`,
  `user/03-domain/user.errors.ts` → `DisplayNameAlreadyTakenError`.

## À implémenter par l'ouvrier

### 04-infrastructure
- `friendship.schema.ts` — schéma Mongoose `Friendship` (`id` unique, `requesterId`,
  `recipientId`, `status`, `createdAt`, `updatedAt`, `versionKey: false`). Ajouter un index
  composé pour accélérer `findBetween` / listes : `{ requesterId: 1, recipientId: 1 }` et
  `{ status: 1 }`. Pas besoin d'unique DB (l'unicité paire est gérée en application via
  `findBetween`).
- `mongo-friendship.repository.ts` — implémente `FriendshipRepositoryPort`.
  `findBetween(a,b)` = `findOne({ $or: [{requesterId:a,recipientId:b},{requesterId:b,recipientId:a}] })`.
  `listAcceptedForUser(u)` = `find({ status:'accepted', $or:[{requesterId:u},{recipientId:u}] })`.
- `in-memory-friendship.repository.ts` — même contrat, pour les tests use-case.

### 02-application (une use-case par fichier, `execute(dto)`)
Injectent `FriendshipRepositoryPort` et/ou `UserRepositoryPort`. Lèvent des erreurs domain,
jamais d'exception HTTP.

| Use-case | Input | Sortie | Règles / erreurs |
|---|---|---|---|
| `SendFriendRequestUseCase` | `{ requesterId, displayName }` | `Friendship` | résout recipient via `userRepo.findByDisplayName` → `RecipientNotFoundError` si absent ; `createFriendRequest` → `CannotFriendSelfError` ; `friendRepo.findBetween` : si `pending` → `FriendRequestAlreadyExistsError`, si `accepted` → `AlreadyFriendsError` ; si `refused` existant, on peut réutiliser/écraser le doc (relancer une demande). `save`. |
| `AcceptFriendRequestUseCase` | `{ friendshipId, actingUserId }` | `Friendship` | `findById` → `FriendshipNotFoundError` ; `acceptFriendRequest(f, actingUserId)` (lève `FriendRequestNotPendingError` / `NotRequestRecipientError`) ; `save`. |
| `RefuseFriendRequestUseCase` | `{ friendshipId, actingUserId }` | `Friendship` | idem via `refuseFriendRequest`. |
| `ListFriendsUseCase` | `{ userId }` | `PublicUser[]` | `listAcceptedForUser` → pour chaque, `friendIdFor(f, userId)` → `userRepo.findById` → `toPublicUser`. |
| `ListPendingReceivedUseCase` | `{ userId }` | `Friendship[]` (+ requester public) | `listPendingReceived`. Enrichir avec le `PublicUser` du requester pour l'affichage. |
| `ListPendingSentUseCase` | `{ userId }` | `Friendship[]` (+ recipient public) | `listPendingSent`. |
| `RemoveFriendUseCase` | `{ userId, friendshipId }` | `void` | `findById` → `FriendshipNotFoundError` ; si `!involvesUser(f, userId)` → `NotFriendshipParticipantError` ; `deleteById`. |
| `SearchUsersUseCase` | `{ userId, query }` | `PublicUser[]` | `userRepo.searchByDisplayName(query, limit=20)` ; exclure soi-même ; `toPublicUser`. |

### 01-interface
- `friendship.controller.ts` — `@Controller('friends')`, `@UseGuards(JwtAuthGuard)` sur
  toutes les routes, `@CurrentUser()` pour l'userId (jamais depuis le body). Catch des erreurs
  domain → HTTP (table ci-dessous), comme `auth.controller.ts`.
- `friendship.module.ts` — wiring NestJS : `MongooseModule.forFeature`, provide
  `FRIENDSHIP_REPOSITORY` → `MongoFriendshipRepository`, importer `UserModule` pour réutiliser
  `USER_REPOSITORY`. Enregistrer les use-cases en providers. Ajouter `FriendshipModule` dans
  `app.module.ts`.

#### Endpoints REST
| Méthode | Path | Use-case | Body / param |
|---|---|---|---|
| POST | `/friends/request/:displayName` | Send | param `displayName` |
| POST | `/friends/accept/:friendshipId` | Accept | param `friendshipId` |
| POST | `/friends/refuse/:friendshipId` | Refuse | param `friendshipId` |
| GET | `/friends` | ListFriends | — |
| GET | `/friends/requests/incoming` | ListPendingReceived | — |
| GET | `/friends/requests/outgoing` | ListPendingSent | — |
| DELETE | `/friends/:friendshipId` | RemoveFriend | param `friendshipId` |
| GET | `/users/search?q=` | SearchUsers | `q` query param (in UserController) |

#### Table erreur domain → HTTP
| Erreur domain | HTTP |
|---|---|
| `CannotFriendSelfError` | 400 BadRequest |
| `RecipientNotFoundError` | 404 NotFound |
| `FriendshipNotFoundError` | 404 NotFound |
| `FriendRequestAlreadyExistsError` | 409 Conflict |
| `AlreadyFriendsError` | 409 Conflict |
| `FriendRequestNotPendingError` | 409 Conflict |
| `NotRequestRecipientError` | 403 Forbidden |
| `NotFriendshipParticipantError` | 403 Forbidden |

## Besoin 1 — displayName unique : câblage restant pour l'ouvrier
`RegisterUseCase` (`auth/02-application/register.use-case.ts`) : après le check email,
ajouter le check displayName (pattern identique à l'email) :
```ts
if (await this.userRepo.findByDisplayName(dto.displayName))
  throw new DisplayNameAlreadyTakenError();
```
et mapper `DisplayNameAlreadyTakenError` → `ConflictException` dans `auth.controller.ts`.
L'index Mongo `unique` sur `displayName` est le filet de sécurité DB (course condition) ;
le check application reste la voie normale, cohérente avec l'email.
Écrire d'abord le test RED côté `register.use-case` (in-memory repo avec un displayName déjà pris).
Front : rien (backend only).
