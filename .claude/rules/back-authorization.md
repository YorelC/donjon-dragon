---
paths:
  - "back/src/modules/*/presentation/*.controller.ts"
  - "back/src/modules/*/application/use-cases/*.use-case.ts"
---

# Autorisation

Il n'y a **ni rôles ni tenants** dans ce projet. L'autorisation, ici, c'est
« cette ressource est-elle la sienne ». Un besoin qui semble réclamer des rôles est
un changement de modèle : arrête-toi et pose la question à Charly.

- Tout est fermé par défaut. Une route ne s'ouvre que par `@Public()`, et l'oubli
  ferme au lieu d'ouvrir. Justifie chaque `@Public()` en commentaire.
- **L'identité de l'appelant vient de `@CurrentUser()`, jamais d'un `@Param`, d'un
  `@Body` ou d'une `@Query`.** Un id reçu du client désigne une CIBLE, jamais
  l'appelant. C'est la seule règle qui, violée, ouvre un IDOR silencieux.
- Le typage l'impose : `@CurrentUser()` rend un `AuthenticatedActor` dont le
  `userId` est un `ActorId` (`kernel/domain/actor-id.ts`), et les DTO de use-cases
  appelés depuis un controller typent leur appelant `ActorId`. Un `string` venant
  d'un `@Param` n'y est pas assignable : la faute ne compile pas.
- N'écris jamais `as ActorId` et n'appelle jamais `actorFromVerifiedToken` ailleurs
  que dans la stratégie JWT. Un test de conformité échoue si tu le fais.
- Le contrôle d'appartenance vit dans l'agrégat (`assertInvolves`, `accept(by, …)`),
  pas dans un guard : un guard ne voit pas l'état de la ressource.
- Charge puis vérifie. Ne filtre pas l'autorisation dans la requête Mongo : un
  `find({ id, userId })` répond « pas trouvé » là où l'intention était « pas à toi »,
  et la règle devient invisible, non testable et impossible à corriger une fois.
- Tout nouveau controller apporte son bloc de test « protection des routes », qui
  assert l'absence de `@Public()` sur la classe et sur chaque handler via
  `Reflect.getMetadata(IS_PUBLIC_KEY, …)`. Modèle : `friendship.controller.test.ts`.
