# Métadonnées d'amis : ce qui manque côté serveur

## Pourquoi ce document

La maquette du menu utilisateur (`docs/ui-design/Page-menu-utilisateur-avec-profil.zip`,
écran « Amis ») affiche sous chaque pseudo une ligne de méta : « Rôdeur niveau 7 ·
dernière séance il y a 3 jours », « Demande reçue il y a 2 jours · 3 amis en commun ».

Le serveur ne connaît aujourd'hui que le **pseudo** d'un autre joueur — `UserSummary` se
réduit à `{ displayName }` — et, pour les demandes, `createdAt` / `updatedAt`. Le front
rend donc ces champs **comme manquants** (`—`, constante `MISSING_META` de
`front/src/pages/profile/friends/_internal/utils/friend-meta.ts`) au lieu d'inventer une
valeur. Ce document liste ce qu'il faudrait ouvrir côté back pour les remplir.

## État actuel, panneau par panneau

| Panneau | Rendu aujourd'hui | Réel | Manquant |
|---|---|---|---|
| Amis | `Classe — · Niveau — · Dernière séance —` | rien | 3 champs |
| Reçues | `Demande reçue hier · Amis en commun —` | date | 1 champ |
| Envoyées | `Invitation envoyée il y a 5 jours` | date | aucun |
| Chercher | `Classe — · Niveau —` | rien | 2 champs |

## Champs à ouvrir

### 1. Classe et niveau du personnage de référence

- **Concerne** : `GET /api/friends`, `GET /api/friends/search`.
- **Forme visée** : étendre `UserSummarySchema` (`shared/src/user-schema.ts`) d'un
  `character` **optionnel** — un joueur peut n'avoir aucun personnage :
  `character?: { className: string; level: number }`.
- **DÉCISION REQUISE** : « le » personnage d'un joueur n'existe pas dans le modèle.
  `docs/PRODUCT.md` pose qu'un joueur a « au maximum un personnage attribué **par
  campagne** ». Il faut donc trancher entre : (a) le personnage le plus récemment joué,
  toutes campagnes confondues ; (b) un personnage marqué principal par le joueur ;
  (c) ne rien afficher hors contexte de campagne, et retirer ces deux champs de la
  maquette. L'option (c) est la seule qui ne demande aucun nouveau concept métier.
- **Confidentialité** : exposer la classe et le niveau d'un joueur à un inconnu via la
  recherche élargit la surface d'information. À arbitrer avec le paramètre de
  confidentialité que la maquette prévoit dans l'écran Paramètres.

### 2. Dernière séance / présence

- **Concerne** : `GET /api/friends`.
- **Forme visée** : `lastSeenAt?: string` (datetime ISO) sur `UserSummary`, le front s'en
  charge de la date relative (`toRelativeDate`).
- **DÉCISION REQUISE** : la maquette affiche « en ligne ». Une présence temps réel
  suppose un transport que le projet n'a pas (websocket ou heartbeat) et un stockage de
  la dernière activité par utilisateur. « Dernière séance » à la granularité du jour se
  contente d'un champ mis à jour au login, bien moins coûteux. Recommandation : s'en
  tenir à `lastSeenAt`, et abandonner « en ligne ».

### 3. Amis en commun

- **Concerne** : `GET /api/friends/requests/incoming`.
- **Forme visée** : `mutualFriendCount: number` sur `PendingReceivedFriendship`.
- **Calcul** : intersection des amitiés `accepted` des deux utilisateurs. Faisable en une
  agrégation sur `pairKey`, mais à borner : c'est une lecture par demande affichée.
- **Priorité basse** : c'est un ornement de confiance, pas une donnée d'action.

### 4. Annuler une invitation envoyée

Ce n'est pas une méta mais le même écart maquette/serveur. La maquette montre un bouton
**Annuler** sur chaque invitation envoyée. Aucun endpoint ne le permet :
`DELETE /api/friends/:friendshipId` (`RemoveFriendUseCase`) supprime une amitié
**acceptée**, et `refuse` est réservé au destinataire (`assertPendingRecipientAction`).
Le bouton n'a donc pas été implémenté.

- **À ouvrir** : une transition `cancel(by: UserId)` sur l'agrégat `Friendship`, miroir de
  `refuse` mais réservée au **demandeur**, exposée en `DELETE /api/friends/requests/:id`.
- La suppression physique du document est cohérente avec le remplacement atomique déjà
  en place après un refus (`specs/008-account-auth-friendship-foundation.md`).

## Point de branchement recommandé

`ListFriendsUseCase`, `ListPendingReceivedUseCase` et `ListPendingSentUseCase` font
aujourd'hui un `directory.findById` **par élément** dans une boucle `await` — le N+1 que
`docs/adr/001-friends-count-endpoint.md` signalait déjà. `UserRepositoryPort.findManyByIds`
existe précisément pour ça. Enrichir la `UserSummary` sans corriger ce N+1 multiplierait
le coût par le nombre de champs ajoutés : la correction doit précéder l'enrichissement.

## Ce que le front fera le jour où ces champs arrivent

Un seul fichier change : `front/src/pages/profile/friends/_internal/utils/friend-meta.ts`.
Les quatre fabriques (`toFriendMeta`, `toReceivedRequestMeta`, `toSentRequestMeta`,
`toSearchResultMeta`) prendront les champs réels en paramètre à la place de
`MISSING_META`. Les views n'ont pas à bouger : elles reçoivent déjà une chaîne `meta`
opaque.
