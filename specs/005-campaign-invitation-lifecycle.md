# Spec 005 — Cycle atomique des invitations de campagne

## Références normatives

- `PRODUCT.md`, parcours Campagne : un utilisateur invite un ami inscrit, qui reçoit
  une notification dans l'application et un courriel ;
- `SF-001`, règles 8 et 9, isolation des campagnes et amitiés ;
- `SF-006`, cycle `EN_ATTENTE → ACCEPTÉE | REFUSÉE | ANNULÉE`, autorité de
  l'invitation applicative et idempotence ;
- `DEC-002` — rôles propres à la campagne et autorisation côté serveur ;
- `DEC-006` — l'échec du courriel n'annule pas l'invitation ;
- `DEC-015`, `TD-5A-004` et `TD-5A-005` — agrégat `CampaignInvitation` et enveloppe
  transactionnelle ;
- `DEC-016` et Phase 5B — snapshots révisés, collections cibles, concurrence,
  enveloppe de commande et index ;
- [Spec 004](004-campaign-foundation.md) — campagne, adhésions actives et isolation
  de lecture déjà établies.

## Parcours utilisateur

Un MJ actif invite, par son pseudo, un ami qui n'est pas membre de la campagne. Le
destinataire voit l'invitation ouverte et son compteur augmenter. Il peut l'accepter,
ce qui crée son unique adhésion active, ou la refuser. Tant qu'elle est ouverte, tout
MJ actif peut l'annuler. Un cycle terminal reste conservé et permet un nouveau cycle.

L'invitation applicative est la source d'autorité. La notification dans l'application
et la demande de courriel sont des faits d'outbox créés atomiquement ; leur livraison
n'appartient pas à cet incrément.

## Contrats HTTP

Toutes les routes restent authentifiées et protégées par CSRF selon les gardes globaux
existants. Les quatre mutations exigent `Idempotency-Key`, validé comme UUID par
`IdempotencyKeySchema`, et répondent `204` sans corps.

| Intention | Route | Corps |
|---|---|---|
| inviter | `POST /api/campaigns/:campaignId/invitations` | `{ "displayName": string }` |
| accepter | `POST /api/campaigns/:campaignId/invitations/accept` | aucun |
| refuser | `POST /api/campaigns/:campaignId/invitations/refuse` | aucun |
| annuler | `DELETE /api/campaigns/:campaignId/invitations/:displayName` | aucun |

Les lectures existantes sont conservées :

- `GET /api/campaigns/invitations` renvoie les invitations ouvertes ciblant
  l'appelant sous la forme `{ campaignId, name, invitedBy: { displayName } }[]` ;
- `GET /api/campaigns/invitations/count` renvoie `{ count }` pour ces mêmes cycles ;
- `GET /api/campaigns/:campaignId` projette dans `pendingInvitees` les cibles des
  invitations ouvertes seulement ;
- `GET /api/campaigns` ne lit que les adhésions actives.

Une campagne absente ou non visible reste masquée en `404`. Une réponse à une
invitation absente, terminale ou ciblant un autre utilisateur répond `404` sans
révéler le cycle. Une cible inconnue répond `404`. Une cible non amie répond `403`.
Une cible déjà membre ou déjà invitée répond `409`.

## Agrégat et invariants

`CampaignInvitation` est un agrégat distinct de `Campaign` et de
`CampaignMembership`. Son snapshot contient :

- une identité métier UUID stable dans `_id` ;
- `schemaVersion`, `campaignId`, `targetUserId` et `invitedByUserId` ;
- un statut `pending`, `accepted`, `refused` ou `cancelled` ;
- une `revision` monotone commençant à `0` ;
- `createdAt`, `updatedAt` et `closedAt`, ce dernier étant nul uniquement en attente.

Invariants :

1. une invitation restaurée conserve exactement son identité, son état et sa révision ;
2. seule une invitation `pending` accepte une transition terminale ;
3. accepter ou refuser exige que l'acteur soit la cible ;
4. annuler exige un MJ actif de la campagne ;
5. chaque transition terminale incrémente la révision exactement une fois et fixe
   `updatedAt` et `closedAt` au seul instant de la commande ;
6. un document terminal n'est jamais supprimé ni rouvert ;
7. au plus un document `pending` existe pour `{ campaignId, targetUserId }` ;
8. un nouveau document et une nouvelle identité sont permis après un cycle terminal ;
9. `campaign_memberships` ne contient que des adhésions actives ; une invitation
   refusée ou annulée n'y crée rien ;
10. une acceptation crée exactement une adhésion active de rôle joueur et incrémente
    la révision de la campagne concernée.

## Règles d'autorisation

- Tout MJ actif de la campagne peut inviter ou annuler une invitation ouverte.
- Le contrôle MJ précède toute résolution du pseudo, pour ne pas transformer la route
  en oracle d'annuaire.
- Seul `targetUserId`, comparé à l'identité authentifiée, peut accepter ou refuser.
- La connaissance de `campaignId`, du pseudo ciblé ou de l'identité d'une invitation
  n'accorde aucun droit.
- Les listes et compteurs filtrent par cible authentifiée et statut ouvert.
- `pendingInvitees` n'est projeté qu'à un membre actif autorisé à lire la campagne.

## Idempotence

Le principal effectif est l'utilisateur authentifié. L'intention canonique contient :

- invitation : type, `campaignId` et pseudo validé/normalisé ;
- acceptation ou refus : type et `campaignId` ;
- annulation : type, `campaignId` et pseudo validé/normalisé.

Même principal, même clé et même hash : le reçu accepté est relu et la mutation répond
à nouveau `204`, sans nouvelle écriture métier, audit ni outbox. Même principal et
même clé avec un autre hash : `409` sans mutation. Une erreur d'authentification ou
d'autorisation ne crée aucun reçu fonctionnel.

Une concurrence entre deux clés d'invitation pour la même cible est arbitrée par
l'index ouvert : une seule transaction gagne, l'autre répond `409`. Une écriture sur
une révision périmée répond `409` et ne fusionne aucun état.

## Transactions et collections

Les documents vivent explicitement dans :

- `campaign_invitations` pour tous les cycles ouverts et terminaux ;
- `campaign_memberships` pour les seules adhésions actives ;
- `campaigns` pour la racine et sa révision ;
- `command_receipts`, `functional_audit_entries` et `outbox_messages` pour
  l'enveloppe partagée.

Chaque transaction inclut le reçu, l'audit et l'outbox :

| Intention | Écritures métier atomiques |
|---|---|
| invitation | nouvelle `CampaignInvitation` ; faits d'outbox de notification applicative et de courriel demandé |
| acceptation | invitation terminale, adhésion active unique, campagne à révision attendue |
| refus | invitation terminale |
| annulation | invitation terminale |

L'index unique partiel `{ campaignId, targetUserId }` avec filtre
`{ status: 'pending' }` défend l'unicité du cycle ouvert. L'index
`{ targetUserId, status }` sert la liste et le compteur. Les mises à jour d'invitation
filtrent `_id`, `campaignId`, `status` et `revision` attendue.

## Scénarios Given/When/Then

1. **Création et restauration** — Étant donné un MJ actif et un ami non membre, quand
   le MJ invite, alors un cycle ouvert réhydratable est conservé avec révision `0`.
2. **Acceptation** — Étant donné une invitation ouverte ciblant l'acteur, quand il
   accepte, alors elle devient acceptée et une seule adhésion active joueur existe.
3. **Refus** — Étant donné une invitation ouverte ciblant l'acteur, quand il refuse,
   alors elle devient refusée et aucune adhésion n'est créée.
4. **Annulation** — Étant donné une invitation ouverte, quand un MJ actif l'annule,
   alors elle devient annulée et aucune adhésion n'est créée.
5. **Cycle terminal** — Étant donné un cycle terminal, quand une nouvelle réponse est
   tentée, alors elle est refusée sans mutation.
6. **Mauvaise cible** — Étant donné une invitation destinée à un autre utilisateur,
   quand l'acteur tente de répondre, alors le système répond comme si elle était absente.
7. **Autorisation avant annuaire** — Étant donné un non-MJ, quand il invite un pseudo
   existant ou inconnu, alors les deux requêtes sont refusées avant tout accès annuaire.
8. **Cible invalide** — Une cible inconnue, non amie, déjà membre ou déjà invitée est
   rejetée avec le statut contractuel et sans écriture.
9. **Réinvitation** — Étant donné un cycle terminal, quand un MJ réinvite la même cible,
   alors un nouveau cycle ouvert à identité distincte est créé.
10. **Rejeu** — Étant donné une mutation acceptée, quand la même clé et la même
    intention sont rejouées, alors `204` est rendu sans doublon.
11. **Conflit d'intention** — Étant donné une clé déjà reçue, quand une autre intention
    la réutilise, alors `409` est rendu sans mutation.
12. **Concurrence** — Étant donné deux créations concurrentes du même cycle ou une
    révision périmée, alors une seule transition gagne et l'autre répond `409`.
13. **Lectures** — Étant donné des cycles ouverts et terminaux, alors liste, compteur
    et `pendingInvitees` ne projettent que les ouverts ; les campagnes actives ne
    projettent que les adhésions actives.

## Hors périmètre

- tout `front/` ;
- envoi réel du courriel, fournisseur ou worker ;
- promotions, rétrogradations, transfert de propriété et départ ;
- suppression de campagne, personnages, règles D&D et Socket.IO ;
- migration ou compatibilité avec les anciennes collections ;
- `.env`, seeds, CI et dépendances supplémentaires ;
- refactors sans rapport.

## Preuves unitaires et Bruno

Les tests unitaires couvrent l'agrégat, les use-cases avec doubles en mémoire, les
mappers, schémas, collections, index, contrôleurs et projections. Ils prouvent les
transitions, autorités, cas invalides, idempotence, révisions et concurrence décrits
ci-dessus.

La collection Bruno ouvre trois sessions, établit l'amitié par les API publiques,
crée la campagne, prouve invitation/rejeu/conflit, isolation d'un tiers, liste et
compteur, puis trois cycles successifs accepté, refusé et annulé. Elle emploie des
UUID distincts par intention et s'exécute contre un backend réel et une base MongoDB
E2E isolée en replica set.
