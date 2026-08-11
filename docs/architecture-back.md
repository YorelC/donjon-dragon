# Architecture du back

Document de référence, écrit pour un humain. Il n'est chargé dans aucune session :
les règles opérationnelles vivent dans `.claude/rules/`, courtes et à chemin. Ici on
explique **pourquoi**, avec la place de le faire.

---

## 1. La carte

```
back/src/
├── main.ts                    bootstrap : helmet, cookie-parser, CORS, préfixe /api
├── app.module.ts              composition root global : APP_GUARD, APP_FILTER
├── typed-express.d.ts         augmente Express.User avec l'acteur authentifié
│
├── modules/
│   ├── auth/          presentation · application · domain · infrastructure · testing
│   ├── user/          application · domain · infrastructure · testing
│   └── friendship/    presentation · application · domain · infrastructure · testing
│
├── kernel/            socle partagé, lui-même en couches
│   ├── application/   clock.port.ts
│   ├── domain/        domain.error.ts, user-id.ts, actor-id.ts, uuid.ts
│   ├── infrastructure/ clock.module.ts, database.module.ts, system-clock.ts
│   └── testing/       fixed-clock.ts
│
├── common/            plomberie NestJS, sans aucune connaissance du métier
│   ├── decorators/    current-user, public, zod-validated
│   ├── filters/       domain-exception.filter.ts
│   ├── guards/        jwt-auth.guard.ts, csrf.guard.ts
│   ├── pipes/         zod-validation.pipe.ts
│   └── security/      csrf-token.service.ts
│
├── config/            env.validation.ts (Zod), configuration.ts (namespaces)
└── scripts/           seed-users.script.ts
```

**Aucun dossier numéroté.** Les noms `01-interface/` à `04-infrastructure/` viennent
d'une organisation antérieure et n'existent plus nulle part.

**`user` n'a pas de `presentation/`, et c'est voulu.** Le module `user` n'expose
aucune route : il est piloté par `auth`, qui appelle ses use-cases. Sa surface
publique, ce sont donc les use-cases exportés par son `user.module.ts`, pas des URL.

Un cinquième dossier, `testing/`, existe par module. Il n'est pas une couche : il
contient les doubles (in-memory, stubs, fixtures) que les tests substituent aux
adapters. Deux règles de dependency-cruiser l'empêchent de fuir en production.

---

## 2. Le flux de bout en bout : `POST /api/auth/register`

Le parcours traverse les quatre couches et les deux modules. C'est le meilleur
exemple pour comprendre qui décide de quoi.

### presentation — traduire du HTTP

```ts
// auth/presentation/auth.controller.ts
@Public()
@Throttle(AUTH_THROTTLE)          // 10/min : route devinable, sujet à l'énumération
@Post('register')
async register(@ZodBody(RegisterSchema) dto: RegisterDto): Promise<PublicUser> {
  return this.registerUseCase.execute(dto);
}
```

Le controller valide la forme avec le schéma **partagé avec le front**, puis délègue.
Il n'attrape rien : si le use-case lève `EmailAlreadyInUseError`, c'est
`DomainExceptionFilter` qui en fera un 409.

### application (auth) — orchestrer la recette

```ts
// auth/application/use-cases/register.use-case.ts
async execute(dto: RegisterDto): Promise<PublicUser> {
  const user = await this.registerUser.execute({          // ← use-case du module user
    email: dto.email,
    displayName: dto.displayName,
    passwordHash: await this.passwordHasher.hash(dto.password),
  });
  await this.sendVerificationLink(user, dto.appOrigin);
  return user;
}
```

Le point important est dans le commentaire du fichier : **`auth` n'a pas accès au
repository de `user`**. Le hashage est une préoccupation d'authentification, la
création du compte et ses invariants d'unicité appartiennent à `user`. `auth` appelle
donc un use-case, jamais un port du voisin.

### application (user) — garantir les invariants

```ts
// user/application/use-cases/register-user.use-case.ts
async execute(command: RegisterUserCommand): Promise<PublicUser> {
  const email = Email.create(command.email);
  const displayName = DisplayName.create(command.displayName);
  await this.assertUnique(email, displayName);
  const user = User.register({ email, displayName, passwordHash: command.passwordHash,
                               now: this.clock.now() });
  await this.userRepo.save(user);
  return toPublicUser(user);
}
```

C'est le **seul** point d'entrée pour créer un compte. Un appelant qui aurait
`USER_REPOSITORY` en main contournerait `assertUnique` : c'est précisément pourquoi ce
token n'est pas exporté.

### domain — les règles, sans I/O

`Email`, `DisplayName` et `UserId` sont des value objects qui refusent une valeur
invalide à la construction. `User.register(...)` produit un agrégat ; le temps lui est
**donné** (`now`), il ne le lit pas.

### infrastructure — parler à Mongo

```ts
// user/infrastructure/persistence/user.schema.ts
export const USER_MODEL = 'User';
export const UserSchema = new Schema<UserSnapshot>({
  id:          { type: String, required: true, unique: true },
  email:       { type: String, required: true, unique: true },
  displayName: { type: String, required: true, unique: true },
  passwordHash:{ type: String, required: true },
  emailVerified:{ type: Boolean, required: true, default: false },
  createdAt:   { type: String, required: true },
}, { versionKey: false });
```

Le schéma type le **snapshot**, pas l'agrégat : `user.mapper.ts` fait la traduction
dans les deux sens. L'`_id` de Mongo existe toujours mais ne porte pas l'identité
métier, c'est le champ `id` qui la porte.

### Et le câblage

```ts
// user/user.module.ts
providers: [{ provide: USER_REPOSITORY, useClass: MongoUserRepository }, …],
exports:   [RegisterUserUseCase, GetUserCredentialsUseCase, GetUserProfileUseCase,
            MarkEmailVerifiedUseCase],   // USER_REPOSITORY volontairement absent
```

C'est ici, et nulle part ailleurs, que `UserRepositoryPort` devient
`MongoUserRepository`. En test, on injecte `InMemoryUserRepository` sans changer une
ligne du use-case.

---

## 3. Qui importe qui

```
presentation ──appelle──▶ application ──dépend du TYPE──▶ domain
                              │                             ▲
                              │ (ignore infrastructure)      │ implements
                              ▼                              │
                          (rien)                     infrastructure
```

Le sens des flèches est sacré ; les cloisons entre dossiers ne le sont pas : un
`application/` peut dépendre de n'importe quel `domain/` du même contexte.

### Les 20 fitness functions

`back/.dependency-cruiser.cjs`, exécuté par `pnpm --filter back lint`. Chacune répond
à une question précise.

| Règle | La question à laquelle elle répond |
|---|---|
| `no-infra-from-core` | Le cœur peut-il voir un détail technique ? Non, y compris `kernel/infrastructure` : sinon un use-case injecterait `SystemClock` au lieu du port `CLOCK`. |
| `no-framework-in-domain` | Le domaine survit-il si on jette NestJS et Mongoose ? L'exemption porte sur le chemin résolu (`node_modules/zod/`), anticipée pour le jour où un value object parsera. |
| `no-framework-in-kernel-domain` | Même pureté pour le socle partagé, que la règle précédente ne visait pas. |
| `no-node-builtins-in-domain` | Un builtin sort en `['core']`, pas `['npm']` : neuf fichiers importaient `crypto` sans qu'aucune règle ne bronche. L'exemption `crypto` est un choix écrit, pas un angle mort. |
| `domain-knows-only-neutral-shared` *(warn)* | Le domaine peut-il lire le contrat HTTP ? Seulement les codes d'erreur. Unique dette assumée, § 6. |
| `no-infra-from-presentation` | Un controller peut-il court-circuiter la couche application ? |
| `no-application-from-domain` | Le domaine connaît-il les ports, use-cases et controllers ? Non, y compris entre modules. |
| `no-presentation-from-application` | Un use-case reste-t-il appelable depuis un script ? Oui : il n'importe aucun DTO de controller. |
| `no-infra-from-testing` | Un double s'appuie-t-il sur l'adapter qu'il remplace ? Sinon le test valide ce qu'il prétend simuler. |
| `scripts-are-not-a-backdoor` | `scripts/` traversait tout librement. Il garde le droit d'assembler des adapters, pas d'appeler un controller. |
| `no-cross-module-presentation` | L'entrée HTTP d'un module est-elle une API interne ? Non. |
| `no-cross-module-infrastructure` | Le `x.module.ts` d'un module peut-il enregistrer l'adapter d'un autre ? C'était le dernier chemin non gardé. |
| `ports-are-module-private` | Un module voisin peut-il prendre un port plutôt qu'un use-case ? Non : il contournerait les invariants. |
| `ports-are-not-reachable-from-outside` | Même cloison depuis `common/`, `kernel/` et `scripts/`, que la règle précédente ne pouvait pas viser. |
| `friendship-is-downstream` | `user` ou `auth` peuvent-ils dépendre de `friendship` ? Non : réaction inverse = event. |
| `campaigns-is-downstream` | Même question un cran plus bas : `campaigns` connaît `user` et `friendship`, jamais l'inverse. |
| `no-testing-doubles-in-production-code` | Une `FixedClock` peut-elle fuir en production et geler le temps ? |
| `common-and-kernel-know-no-business` | Le filtre d'exception peut-il mapper par classe métier ? Non, d'où le mapping par nature. |
| `no-circular` | Un cycle se contourne-t-il avec `forwardRef()` ? Non, il se corrige. |
| `no-orphans` | Ce fichier est-il encore importé par quelqu'un ? |

---

## 4. Les tokens et leur portée

Convention : le token est un `Symbol` exporté **depuis le fichier `.port.ts`**, à côté
de l'interface qu'il désigne. Ni classe abstraite, ni token string.

| Token | Module | Exporté ? |
|---|---|---|
| `USER_REPOSITORY` | user | **non**, délibérément |
| `FRIENDSHIP_REPOSITORY` | friendship | non |
| `FRIEND_DIRECTORY` | friendship | non (anti-corruption layer vers `user`) |
| `PASSWORD_HASHER` | auth | non (`useFactory` : reçoit `security.bcryptRounds`) |
| `TOKEN_SERVICE` | auth | non |
| `EMAIL_SENDER` | auth | non |
| `REFRESH_TOKEN_REPOSITORY` | auth | non |
| `EMAIL_VERIFICATION_TOKEN_REPOSITORY` | auth | non |
| `CLOCK` | kernel | **oui**, via `ClockModule` |

Aucun module n'exporte de token de port. `auth` et `friendship` n'exportent rien du
tout : ils ne sont consommés que par leurs routes HTTP. Seul `user` exporte, et il
n'exporte que des use-cases.

`ClockModule` n'est volontairement **pas** `@Global()` : chaque module qui a besoin du
temps l'importe explicitement, ce qui rend la dépendance visible dans son en-tête au
lieu d'être ambiante.

---

## 5. La chaîne globale, et pourquoi son ordre compte

```ts
// app.module.ts
{ provide: APP_GUARD,  useClass: JwtAuthGuard },   // 1
{ provide: APP_GUARD,  useClass: CsrfGuard },      // 2
{ provide: APP_GUARD,  useClass: ThrottlerGuard }, // 3
{ provide: APP_FILTER, useClass: DomainExceptionFilter },
```

**`JwtAuthGuard` d'abord.** Il protège toutes les routes, y compris celles qu'on
ajoutera demain sans y penser. Seul `@Public()` ouvre une exception, lue au niveau du
handler ET de la classe. L'oubli ferme une route, il ne l'ouvre pas.

**`CsrfGuard` ensuite, et c'est obligatoire dans cet ordre** : la vérification a
besoin de `request.user` pour confirmer que le jeton CSRF appartient bien à cette
session. Inversés, le garde ne verrait qu'un `undefined`.

**`DomainExceptionFilter`** traduit une `DomainError` en statut par sa `kind` :

| `DomainErrorKind` | HTTP |
|---|---|
| `invalid` | 400 |
| `unauthorized` | 401 |
| `forbidden` | 403 |
| `not-found` | 404 |
| `conflict` | 409 |

Le mapping porte sur la **nature**, jamais sur la classe concrète. C'est ce qui permet
à `common/` de ne connaître aucun module métier, et à une erreur métier nouvelle
d'être correctement traduite sans qu'on touche au filtre.

---

## 6. La dette assumée

Une seule, et elle est en `warn` plutôt qu'en `error` :

`domain-knows-only-neutral-shared` — `auth/domain/token/access-token-payload.ts`
importe `@donjon-dragon/shared` au-delà de `error-schema`. Le domaine ne devrait
connaître du contrat partagé que le vocabulaire neutre, le reste étant du transport.

Le chemin échappait d'ailleurs aux règles `npm` : `@donjon-dragon/shared` n'est pas un
paquet installé mais un alias tsconfig vers `../shared/src`.

Elle passera en `error` le jour où le payload d'access token sera défini côté domaine
et projeté vers le contrat partagé plutôt que l'inverse. En attendant, la violation
est visible à chaque lint et commentée sur place, ce qui vaut mieux qu'une exemption
silencieuse.

---

## 7. Le modèle d'autorisation

**Il n'y a ni rôles ni permissions ni tenants.** Un `grep` sur `back/src` ne trouve ni
`@Roles`, ni `RolesGuard`, ni `tenantId`. C'est une décision, pas un manque : le
commentaire de `shared/src/auth-schema.ts` l'explique. Être maître du jeu est une
propriété d'une **campagne**, pas d'un compte — le même joueur est MJ d'une table et
joueur d'une autre, et une adhésion retirée doit prendre effet immédiatement, pas à
l'expiration d'un token vieux de quinze minutes. Ce contrôle vivra donc sur l'agrégat
d'adhésion, comme `Friendship.assertInvolves` le fait déjà.

L'autorisation est donc de l'**ownership**, et elle repose sur trois appuis.

### Fermé par défaut

`JwtAuthGuard` en `APP_GUARD`. Une route s'ouvre par `@Public()` et uniquement ainsi.
Chaque controller porte un bloc de test qui assert l'**absence** de ce décorateur :

```ts
it.each(ROUTES)('ne déclare pas @Public() sur %s', (route) => {
  expect(Reflect.getMetadata(IS_PUBLIC_KEY, FriendshipController.prototype[route]))
    .toBeUndefined();
});
```

La protection ne s'assert plus par la présence d'un `@UseGuards` : c'est l'absence de
`@Public()` qui est devenue l'invariant.

### L'identité de l'appelant ne vient jamais du client

C'est le point qui, mal tenu, ouvre un IDOR. Le controller passe toujours
`@CurrentUser()`, jamais un `@Param` :

```ts
@Post('accept/:friendshipId')
async acceptFriendRequest(
  @CurrentUser() user: AuthenticatedActor,     // ← l'acteur, prouvé par le token
  @Param('friendshipId') friendshipId: string, // ← la cible, fournie par le client
) {
  return this.acceptFriendRequestUseCase.execute({
    friendshipId, actingUserId: user.userId,
  });
}
```

Cette règle était, jusqu'à récemment, uniquement affaire de vigilance :
`AcceptFriendRequestDto.actingUserId` était un `string`, et brancher un id client à
cette place compilait, passait le lint et passait les tests. Elle est désormais tenue
par le typage — voir `kernel/domain/actor-id.ts` :

```ts
declare const actorBrand: unique symbol;
export type ActorId = string & { readonly [actorBrand]: 'ActorId' };
export interface AuthenticatedActor { readonly userId: ActorId }

/** Seul point d'entrée légitime : la stratégie JWT, signature déjà vérifiée. */
export function actorFromVerifiedToken(rawUserId: string): ActorId { … }
```

Le brand n'existe qu'à la compilation, donc rien ne change à l'exécution. Mais un
`string` venant d'un `@Param` n'est plus assignable à un slot d'appelant : l'IDOR est
devenu une erreur de `tsc`. Un test de conformité interdit par ailleurs `as ActorId`
et tout appel à `actorFromVerifiedToken` hors de la stratégie JWT et des doubles de
test.

C'est le même raisonnement que `UserId`, qui porte déjà un
`declare private readonly brand` pour qu'« un identifiant ne se substitue pas
silencieusement à un autre ». `ActorId` applique l'idée un cran plus haut : `UserId`
peut désigner n'importe qui, `ActorId` ne peut désigner que celui qui a présenté un
token valide.

### La vérification vit dans l'agrégat

Pas dans un guard, qui ne voit pas l'état de la ressource :

```ts
// friendship/domain/friendship.ts
private assertPendingRecipientAction(by: UserId): void {
  if (this.currentStatus !== FRIENDSHIP_STATUS.pending) throw new FriendRequestNotPendingError();
  if (!this.recipientId.equals(by)) throw new NotRequestRecipientError();
}
```

Corollaire pratique : **on charge puis on vérifie**. Filtrer l'autorisation dans la
requête Mongo (`find({ id, userId })`) répondrait « pas trouvé » là où l'intention est
« pas à toi », et la règle deviendrait invisible et non testable.

---

## 8. Ce qui n'est adossé à aucun outil

`depcruise` tient les frontières, ESLint tient la taille des fonctions et le `any`,
`tsc` tient désormais l'identité de l'appelant. Le reste ne tient qu'à la revue :

- un use-case = une seule méthode publique `execute()` ;
- les conventions de nommage (`mongo-*.repository.ts`, `*.use-case.ts`, agrégat au nom
  nu sans `.entity.ts`) ;
- `.lean()` sur les lectures pures ;
- un seul `clock.now()` par opération ;
- un adapter sans règle métier ;
- la discipline doc-first sur les API NestJS.

Ce sont ces points-là qu'il faut regarder en revue, puisque rien ne les bloquera.
