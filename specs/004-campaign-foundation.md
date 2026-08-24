# Spec 004 — Création atomique et isolation d'une campagne

## Références normatives

- `SF-001`, règles 2, 8 et 9 et critères d'acceptation sur l'isolation des campagnes ;
- `DEC-015` — enveloppe transactionnelle des commandes mutantes ;
- `DEC-016` — persistance MongoDB cible sur base propre ;
- Phase 5B — campagnes, adhésions, idempotence, audit, outbox et index.

## Parcours utilisateur

Quand un utilisateur authentifié crée une campagne valide, le système crée la
campagne, le désigne comme propriétaire et comme premier MJ actif, puis renvoie le
résumé à ajouter à sa liste. Un autre utilisateur ne peut ni consulter cette
campagne ni apprendre si son identifiant existe.

## Contrat de création

`POST /api/campaigns` conserve le corps `{ "name": string }` et exige l'en-tête
`Idempotency-Key`, qui contient un UUID. Les cookies d'authentification et la
protection CSRF existants restent inchangés.

La réponse `201` reste un `CampaignSummary` :

```json
{
  "id": "<uuid>",
  "name": "La Malédiction de Strahd",
  "myRole": "gameMaster",
  "gameMasterCount": 1,
  "playerCount": 0
}
```

## Idempotence

- Le principal effectif est toujours l'utilisateur authentifié, jamais une valeur
  reçue du client.
- L'intention canonique emploie le nom après validation et normalisation Zod.
- Même principal, même clé et même intention : le système renvoie le même résultat
  sans nouvelle écriture métier.
- Même principal et même clé avec une intention différente : le système répond
  `409` sans mutation.
- Une erreur d'authentification ou d'autorisation ne crée aucun reçu fonctionnel.

## Persistance atomique

Une création acceptée persiste dans une même transaction MongoDB :

- la racine dans `campaigns` ;
- l'adhésion initiale dans `campaign_memberships` ;
- le reçu dans `command_receipts` ;
- l'audit dans `functional_audit_entries` ;
- le fait interne dans `outbox_messages`.

La campagne porte l'identité, le propriétaire, les réglages bornés et sa révision.
Les adhésions ne sont plus embarquées dans le document campagne. L'adhésion initiale
est active et porte le rôle MJ. Les noms de collections sont explicites et aucun
lecteur ou writer de compatibilité n'est ajouté pour l'ancien document.

## Isolation de lecture

`GET /api/campaigns/:campaignId` répond de manière indistinguable avec `404` lorsque
la campagne est absente ou lorsque l'appelant n'en est pas membre actif. Aucune
donnée de campagne ni identité de membre n'est alors projetée.

## Critères d'acceptation

1. Une création produit exactement une campagne et une adhésion active.
2. Le créateur est propriétaire et premier MJ ; les compteurs renvoyés valent 1 et 0.
3. Un rejeu identique retourne le même identifiant et ne duplique aucune écriture.
4. Un rejeu divergent retourne `409` sans créer de campagne.
5. Une transaction échouée ne laisse aucun document partiel.
6. Une lecture par un autre utilisateur retourne le même `404` qu'un identifiant absent.
7. Les entrées externes restent validées par Zod et les accès Mongo passent par des ports.

## Hors périmètre

- interface et code de `front/` ;
- invitations, transfert de propriété, départ et vote de succession ;
- suppression de campagne ;
- Socket.IO, portraits et règles D&D ;
- migration, double écriture ou lecture des anciens documents ;
- `.env`, seeds, migrations MongoDB et CI ;
- ajout d'une dépendance d'exécution au backend.

## Preuve E2E

La collection Bruno versionnée sous `e2e/bruno/` vérifie le contrat HTTP réel avec
deux sessions, une clé UUID stable pendant le scénario et un MongoDB en replica set.
Elle est exécutée par `pnpm test:e2e:api` avec la CLI officielle du dépôt.
