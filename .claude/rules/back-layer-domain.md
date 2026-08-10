---
paths:
  - "back/src/modules/*/domain/**/*.ts"
  - "back/src/kernel/domain/**/*.ts"
---

# Couche domain

- Aucun décorateur, aucun import de `@nestjs/*`, de `mongoose` ou d'`express`. Le
  domaine doit rester vrai si on jette le framework.
- Aucune I/O, aucune source non déterministe. Le temps arrive par le port `CLOCK`
  (`kernel/application/clock.port.ts`), jamais par `new Date()` ni `Date.now()`.
  Seule exception assumée : `crypto.randomUUID`, parce que l'agrégat génère son id.
- Nommage : l'agrégat porte le nom nu (`user.ts`, `friendship.ts`), **pas de suffixe
  `.entity.ts`**. Les modes d'échec vivent dans `*.errors.ts`.
- Une erreur hérite d'une des 5 natures de `kernel/domain/domain.error.ts`
  (`Invalid`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`) et ne déclare
  JAMAIS un code HTTP. Le champ `code` est optionnel : ne l'ajoute que si un client
  doit brancher dessus, sinon tu fabriques un contrat que personne ne lit.
- Ce qui traverse une frontière est un value object (`UserId`, `Email`,
  `DisplayName`, `FriendshipId`), jamais un `string` nu dans une signature.
- Les invariants vivent ici, y compris l'autorisation d'appartenance : l'agrégat
  expose `accept(by, now)` ou `assertInvolves(userId)` et lève un
  `ForbiddenDomainError`. Un objet qui n'a que des getters est un anemic model, la
  règle a fui dans le use-case : ramène-la.
- Un agrégat expose `snapshot()` et `static restore(snapshot)` : c'est la seule
  frontière par laquelle la persistance et le HTTP le lisent. `restore` réhydrate
  sans rejouer aucun invariant.
- De `@donjon-dragon/shared`, seul `error-schema` est du vocabulaire neutre, le
  reste est du transport. Dette connue et commentée sur place :
  `auth/domain/token/access-token-payload.ts`.
