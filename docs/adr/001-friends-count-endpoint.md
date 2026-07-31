# ADR 001 — Endpoint de comptage léger pour le badge de demandes reçues

**Date** : 2026-07-31
**Statut** : Accepté
**Ticket** : t_749170f0
**Spec** : 003-friends-list-modal-badge

## Contexte

La spec 003 introduit un badge affichant le nombre de demandes d'ami reçues
(UA-006, UA-007, UA-008, UA-010). Ce badge doit être alimenté dès le montage
de la page « Amis », indépendamment de l'onglet actif (UA-008).

Deux options pour obtenir ce nombre :

1. **Réutiliser `GET /api/friends/requests/incoming`** existant (liste complète
   avec données utilisateur) et dériver le count côté front (`data.length`).
2. **Créer un endpoint dédié `GET /api/friends/requests/incoming/count`**
   retournant uniquement `{ count: number }`.

## Décision

**On crée un endpoint dédié `GET /api/friends/requests/incoming/count`.**

## Justification

### Poids des réponses

| Approche | Taille réponse (3 demandes) | Requêtes MongoDB |
|---|---|---|
| Liste complète | ~800 B à ~2 KB (selon displayNames) | 1 × `find` + 3 × `findById` (N+1) |
| Count seul | ~20 B (`{"count":3}`) | 1 × `countDocuments` (index-only) |

Le count est un `countDocuments` sur l'index `{ recipientId: 1, status: 1 }`,
sans fetch de documents utilisateur. La requête complète nécessite un `find` +
autant de `findById` user que de demandes (pattern N+1 actuel).

### Fréquence d'appel

UA-008 spécifie que la requête est exécutée à chaque montage de page, avant
toute interaction. Sur une session typique (navigation, retour sur la page),
cet appel peut se produire plusieurs fois. La liste complète serait gaspillée
pour un simple entier.

### Séparation des responsabilités

La liste des demandes reçues (`listPendingReceived`) sert à afficher le contenu
de l'onglet « Reçues » : elle a besoin des données utilisateur du demandeur.
Le badge n'a besoin que d'un entier. Forcer le même endpoint pour les deux usages
couple la latence d'affichage du badge à celle du chargement des profils
utilisateur — deux préoccupations distinctes.

### Cache et invalidation TanStack Query

Avec deux endpoints distincts, le front peut :
- Invalider `["friends", "received", "count"]` indépendamment de
  `["friends", "received"]` (la liste des demandes).
- Utiliser un `staleTime` plus court sur le count (30s) pour le badge sans
  refetch inutile de la liste complète.

## Contre-indications écartées

- **Duplication de logique** : le repository partage le même filtre
  `{ status: 'pending', recipientId: userId }` entre `listPendingReceived` et
  `countPendingReceived`. La duplication est limitée à l'appel Mongo
  (`find` vs `countDocuments`), pas à la logique métier.
- **YAGNI** : le besoin est spécifié (UA-008), pas spéculatif. La spec exclut
  le temps réel WebSocket (R-007 hors périmètre), donc le count par HTTP est
  la solution canonique.

## Conséquences

### Fichiers créés ou modifiés

| Fichier | Action |
|---|---|
| `shared/src/friendship-schema.ts` | + `PendingReceivedCountSchema`, `DeleteFriendParamsSchema` |
| `back/src/friendship/03-domain/friendship.repository.port.ts` | + `countPendingReceived()` |
| `back/src/friendship/02-application/count-pending-received.use-case.ts` | Nouveau use case |
| `back/src/friendship/04-infrastructure/mongo-friendship.repository.ts` | + implémentation `countPendingReceived` |
| `back/src/friendship/04-infrastructure/in-memory-friendship.repository.ts` | + implémentation `countPendingReceived` |
| `back/src/friendship/01-interface/friendship.controller.ts` | + `GET .../count` |
| `back/src/friendship/01-interface/friendship.module.ts` | + enregistrement use case |
| `front/src/shared/constants/api-routes.ts` | + `friends.incomingCount` |
| `front/src/pages/profile/friends/_internal/queries/use-received-count.ts` | Nouveau hook |

### Index MongoDB justifié

Index composite existant `{ requesterId: 1, recipientId: 1 }` couvre déjà
les requêtes par `recipientId`. Un index supplémentaire
`{ recipientId: 1, status: 1 }` est recommandé pour optimiser
`countPendingReceived`, mais n'est pas bloquant pour le MVP — le volume
de documents friendship est faible au lancement.

## Invariants couverts

- **INV-001** [UA-008] : `countPendingReceived(userId)` retourne le nombre
  exact de Friendship avec `status === 'pending'` et `recipientId === userId`.
- **INV-002** [UA-003] : `DeleteFriendParamsSchema` valide que `friendshipId`
  est un UUID valide avant d'atteindre le use case.