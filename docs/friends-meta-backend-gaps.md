# Écarts entre la maquette « Amis » et le serveur

## Pourquoi ce document

La maquette du menu utilisateur (`docs/ui-design/Page-menu-utilisateur-avec-profil.zip`,
écran « Amis ») affiche sous chaque pseudo une ligne de méta : « Rôdeur niveau 7 ·
dernière séance il y a 3 jours », « Demande reçue il y a 2 jours · 3 amis en commun ».

Le serveur ne connaît d'un autre joueur que son **pseudo** — `UserSummary` se réduit à
`{ displayName }` — et, pour les demandes, `createdAt` / `updatedAt`. Ce document
consigne ce qui a été écarté, et ce qui reste ouvert.

## Décision : pas de classe, pas de niveau, pas de présence

**Un ami est un compte, pas un personnage.** La classe et le niveau appartiennent à un
personnage, or `docs/PRODUCT.md` pose qu'un joueur a « au maximum un personnage attribué
**par campagne** » : « le » personnage d'un joueur n'existe pas dans le modèle. Afficher
une classe hors contexte de campagne aurait demandé d'inventer un concept — personnage
principal, ou dernier joué — pour un ornement.

Ces trois champs de la maquette sont donc **abandonnés**, pas différés :

| Champ maquette | Sort |
|---|---|
| Classe | abandonné — appartient au personnage, pas au compte |
| Niveau | abandonné — idem |
| « en ligne » / dernière séance | abandonné — demanderait un heartbeat ou un websocket que le projet n'a pas |

Conséquence à l'écran : la liste d'amis et les résultats de recherche affichent le
**pseudo seul**, sur une ligne. Aucune seconde ligne, aucun tiret de remplissage.

## Ce qui reste réel

| Panneau | Méta affichée | Source |
|---|---|---|
| Amis | aucune | — |
| Reçues | `Demande reçue hier` | `createdAt` |
| Envoyées | `Invitation envoyée il y a 5 jours` | `createdAt` |
| Chercher | aucune | — |

Les deux dates sont mises en forme par `toRelativeDate` dans
`front/src/pages/profile/friends/_internal/utils/friend-meta.ts` (`Intl.RelativeTimeFormat`,
aucune dépendance).

## Ce qui reste ouvert

### 1. Annuler une invitation envoyée — le seul manque bloquant

La maquette montre un bouton **Annuler** sur chaque invitation envoyée. Aucun endpoint ne
le permet : `DELETE /api/friends/:friendshipId` (`RemoveFriendUseCase`) porte sur une
amitié **acceptée**, et `refuse` est réservé au destinataire
(`assertPendingRecipientAction`). Le bouton n'est donc pas implémenté : un joueur ne peut
pas revenir sur une demande partie.

- **À ouvrir** : une transition `cancel(by: UserId)` sur l'agrégat `Friendship`, miroir de
  `refuse` mais réservée au **demandeur**, exposée en `DELETE /api/friends/requests/:id`.
- La suppression physique du document est cohérente avec le remplacement atomique déjà en
  place après un refus (`specs/008-account-auth-friendship-foundation.md`).

### 2. Amis en commun — ornement, priorité basse

La maquette l'affiche sur les demandes reçues. Il faudrait un `mutualFriendCount: number`
sur `PendingReceivedFriendship`, calculé par intersection des amitiés `accepted` des deux
utilisateurs — une agrégation sur `pairKey`, à borner puisque c'est une lecture par
demande affichée. C'est une donnée de confiance, pas une donnée d'action : rien ne dépend
d'elle.

## Dette à solder avant tout enrichissement

`ListFriendsUseCase`, `ListPendingReceivedUseCase` et `ListPendingSentUseCase` font un
`directory.findById` **par élément** dans une boucle `await` — le N+1 que
`docs/adr/001-friends-count-endpoint.md` signalait déjà.
`UserRepositoryPort.findManyByIds` existe précisément pour ça. Enrichir la `UserSummary`
sans corriger ce N+1 multiplierait le coût par le nombre de champs ajoutés.

## Ce que le front changera si un champ arrive

Un seul fichier : `friend-meta.ts`. Les deux fabriques restantes
(`toReceivedRequestMeta`, `toSentRequestMeta`) prendraient le champ en paramètre. Les
views ne bougent pas : `FriendRow` reçoit une prop `meta` **facultative** et n'affiche la
seconde ligne que si elle est fournie.
