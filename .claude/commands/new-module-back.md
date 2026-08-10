Crée un module back `$ARGUMENTS` sous `back/src/modules/`, en respectant
`.claude/rules/` et `docs/architecture-back.md`.

Arborescence de référence (les globs de `.claude/rules/` la couvrent déjà, il n'y
a AUCUN fichier de règles à dupliquer) :

```
$ARGUMENTS/
  $ARGUMENTS.module.ts
  presentation/      $ARGUMENTS.controller.ts
  application/       ports/   use-cases/
  domain/            $ARGUMENTS.ts   $ARGUMENTS.errors.ts
  infrastructure/    persistence/
  testing/           in-memory-$ARGUMENTS.repository.ts
```

**Ne crée que les fichiers pour lesquels tu as une raison concrète.** Un module
CRUD sans invariant n'a besoin ni de `domain/` ni de mapper ; un module sans route
n'a pas de `presentation/` (c'est le cas de `user`, piloté par `auth`). Demande
avant de générer les cinq dossiers.

Points non négociables si tu génères :

- Le token de port est un `Symbol` exporté depuis le fichier `.port.ts`, à côté de
  son interface. Il n'est PAS exporté par le `.module.ts` : la surface publique
  d'un module, ce sont ses use-cases.
- Un use-case par fichier, une seule méthode publique `execute()`.
- Le controller n'a aucun `@UseGuards` : les guards sont globaux. Il vient avec son
  bloc de test « protection des routes » qui assert l'absence de `@Public()` sur la
  classe et sur chaque handler, sur le modèle de
  `back/src/modules/friendship/presentation/friendship.controller.test.ts`.
- Tout DTO de use-case appelé depuis un controller type son appelant `ActorId`
  (`@kernel/domain/actor-id`), jamais `string`.
- Les erreurs héritent d'une des natures de `@kernel/domain/domain.error` et ne
  déclarent aucun code HTTP.

Si le module doit lire ou écrire dans l'agrégat d'un autre module, n'injecte pas
son repository : appelle son use-case, ou passe par un anti-corruption layer sur
le modèle de `friendship/infrastructure/acl/user-friend-directory.ts`.

Termine par `pnpm --filter back lint:arch`, puis `pnpm typecheck` et `pnpm test`.
