Voici un exemple concret et complet, tracé sur le flux d'inscription (`register`) que j'ai construit cette session — parfait pour illustrer, puisqu'il passe par les 4 couches.

`config/index.ts` supprimé et confirmé (typecheck toujours propre). Voici la chaîne, tracée sur l'inscription (`POST /api/auth/register`) — le flux réel qui s'exécute quand une requête arrive.

## 1. `interface/` — reçoit la requête HTTP

```ts
// auth/interface/auth.controller.ts
@Post('register')
async register(@Body() dto: RegisterDto) {
  return await this.registerUseCase.execute(dto);   // ← délègue tout de suite
}
```
Le controller ne fait AUCUNE logique métier. Il traduit HTTP → appel de méthode, et l'erreur métier (`EmailAlreadyInUseError`) → code HTTP (409). C'est tout.

## 2. `application/` — orchestre

```ts
// auth/application/register.use-case.ts
export class RegisterUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,       // ← une INTERFACE, pas une classe concrète
    private readonly passwordHasher: PasswordHasherPort,
    // ...
  ) {}

  async execute(dto: RegisterDto): Promise<PublicUser> {
    const existing = await this.userRepo.findByEmail(dto.email);   // délègue à l'infra via le port
    if (existing) throw new EmailAlreadyInUseError();

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = createUser({ email: dto.email, displayName: dto.displayName, passwordHash }); // ← domain, fonction pure
    await this.userRepo.save(user);                                 // délègue à l'infra via le port
    // ...
  }
}
```
Le use-case orchestre la recette (vérifier email → hasher password → créer l'entité → sauvegarder → envoyer l'email), mais **ne sait pas** ce qu'est "sauvegarder" concrètement — il appelle juste une méthode d'une interface.

## 3. `domain/` — le contrat + la logique pure

```ts
// user/domain/user.repository.port.ts — le CONTRAT, juste une interface
export interface UserRepositoryPort {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
```
```ts
// user/domain/user.entity.ts — la LOGIQUE, fonction pure, zéro I/O
export function createUser(params): User {
  return { id: crypto.randomUUID(), ...params, emailVerified: false, createdAt: new Date().toISOString() };
}
```
`domain/` ne fait ni requête HTTP ni requête Mongo. Il définit *ce qu'il faut pouvoir faire* (`UserRepositoryPort`) et *les règles pures* (`createUser`).

## 4. `infrastructure/` — l'implémentation concrète du contrat

```ts
// user/infrastructure/mongo-user.repository.ts
export class MongoUserRepository implements UserRepositoryPort {   // ← tient la promesse du contrat
  constructor(private readonly model: Model<User>) {}

  async save(user: User): Promise<User> {
    await this.model.findOneAndUpdate({ id: user.id }, user, { upsert: true });  // ← ICI on parle vraiment à Mongo
    return user;
  }
  // findById, findByEmail...
}
```
C'est la SEULE couche qui importe Mongoose et sait que la base de données existe.

## Le point qui débloque tout : qui importe qui

C'est là que ça devient "hexagonal" plutôt que "juste rangé dans des dossiers" :

```
interface/auth.controller.ts
        │ appelle
        ▼
application/register.use-case.ts  ──imports le TYPE──▶  domain/user.repository.port.ts
        │                                                        ▲
        │ (ignore tout de infrastructure/)                       │ implements
        ▼                                                        │
   (rien — pas de lien direct)              infrastructure/mongo-user.repository.ts
```

`register.use-case.ts` importe `UserRepositoryPort` (le type) depuis `domain/` — **jamais** `MongoUserRepository` depuis `infrastructure/`. Les deux ne se connaissent pas.

Alors qui décide que `UserRepositoryPort` = `MongoUserRepository` concrètement ? **Seul `interface/user.module.ts`**, au moment du câblage NestJS :

```ts
// user/interface/user.module.ts
providers: [
  {
    provide: USER_REPOSITORY,                                    // le nom du "port"
    useFactory: (model) => new MongoUserRepository(model),        // l'implémentation concrète choisie ICI
    inject: [getModelToken(USER_MODEL)],
  },
],
```

**Pourquoi c'est utile concrètement** : dans les tests de `register.use-case.test.ts`, on injecte `InMemoryUserRepository` (une Map en mémoire, `back/src/user/infrastructure/in-memory-user.repository.ts`) à la place de `MongoUserRepository` — **sans changer une seule ligne** de `register.use-case.ts`. Le use-case ne sait même pas que Mongo existe, donc le remplacer par un fake pour les tests est trivial. C'est exactement ce qui a permis le cycle RED→GREEN qu'on a fait pour toute l'auth cette session : tests écrits contre le port, implémentation Mongo branchée après, sans rien casser.