---
paths:
  - "back/src/modules/friendship/domain/**/*.ts"
  - "back/src/modules/friendship/infrastructure/acl/*.ts"
  - "back/src/modules/friendship/application/ports/*.port.ts"
  - "back/src/modules/friendship/friendship.module.ts"
---

# Module friendship

- Sens de dépendance assumé : `friendship` connaît `user`, jamais l'inverse. Si
  `user` ou `auth` doit réagir à une amitié, ce sera par un event, pas par un import.
  La règle `friendship-is-downstream` de dependency-cruiser le tient.
- Le domaine de `friendship` manipule des `UserId`, jamais l'entité `User`. Un seul
  document par paire ; la direction requester vers recipient ne compte que tant que
  le statut est `pending`.
- L'accès au module voisin passe par l'anti-corruption layer : le port
  `FriendDirectoryPort` et son adapter `infrastructure/acl/user-friend-directory.ts`,
  qui appelle les use-cases de `user`. N'injecte jamais `USER_REPOSITORY` ici.
- Toutes les transitions passent par les méthodes de l'agrégat : aucun appelant ne
  pose un statut directement. `accept` et `refuse` vérifient d'abord que l'acteur est
  bien le destinataire d'une demande encore `pending`.
- Les schémas de `shared/friendship-schema.ts` portent des annotations `INV-NNN` et
  `UA-NNN`. Un cas ajouté reste traçable : complète la matrice en fin de fichier.
