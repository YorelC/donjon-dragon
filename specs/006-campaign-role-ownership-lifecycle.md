# Spec 006 — Rôles, propriété et départ atomiques d'une campagne

## Références normatives

- `PRODUCT.md`, sections Utilisateurs, Campagne et MVP — rôles joueur/MJ,
  co-MJ et propriété indépendante ;
- `SF-001`, règles 1 à 9, personnages et attribution, visibilité et critères
  d'acceptation — propriétaire seul responsable des changements de rôle,
  propriétaire actif unique, MJ actif obligatoire, départ atomique et effet immédiat ;
- `DEC-002` — promotion avec désassignation, rétrogradation immédiate et isolation ;
- `DEC-015`, `TD-5A-004`, `TD-5A-005` et `TD-5A-010` — agrégats, enveloppe de
  commande, autorisation relue et coordination inter-module ;
- `DEC-016` et Phase 5B — snapshots révisés, collections, concurrence,
  idempotence, audit, outbox, transactions et index ;
- `TECHNICAL-PERSISTENCE-5B`, frontières transactionnelles — promotion orchestrée
  en aval de `campaigns` par `characters`, sans accès transversal aux repositories ;
- [Spec 004](004-campaign-foundation.md) — création, adhésion active initiale,
  enveloppe atomique et isolation en `404` ;
- [Spec 005](005-campaign-invitation-lifecycle.md) — invitations distinctes,
  adhésion joueur active à l'acceptation et commandes idempotentes.

## État actuel audité

Au commit `9ba9c7a`, la création et le cycle d'invitation sont verticalisés. Les
collections `campaigns`, `campaign_memberships` et `campaign_invitations` sont
séparées ; l'agrégat `Campaign` est réhydraté depuis la racine et les adhésions
actives. La création et les invitations disposent déjà de reçus durables, d'audit,
d'outbox, de transactions MongoDB et de conflits de révision.

Le code historique expose aussi promotion, rétrogradation, changement de rôle du
propriétaire, transfert, exclusion, départ et suppression de campagne. Il décrit
seulement l'état actuel et présente les écarts suivants avec la cible :

- les mutations de rôle, propriété et départ n'exigent pas `Idempotency-Key` et
  appellent un `save` sans reçu, audit ni outbox ;
- promotion et rétrogradation autorisent actuellement tout MJ, alors que SF-001
  attribue ces changements au propriétaire ;
- un transfert accepte aujourd'hui tout membre actif, y compris un joueur ;
- le départ retire l'adhésion sans décision sur le personnage assigné ;
- la promotion ne désassigne aucun personnage ; `characters` sait rechercher et
  désassigner un dossier, mais seulement dans une commande séparée ;
- aucune orchestration publique de `characters` ne réunit encore rôle et dossier
  dans une même transaction ;
- le repository Mongo remplace toutes les adhésions lors d'une sauvegarde et ne
  reçoit aucune révision attendue du contrat HTTP ;
- Bruno ne couvre actuellement que les incréments 004 et 005.

Les routes et tests historiques non soutenus par une décision ne sont pas des
précédents contractuels. La suppression de campagne et l'exclusion d'un membre ne
sont pas intégrées silencieusement à cet incrément.

## Parcours utilisateur

Le propriétaire consulte une campagne et peut faire passer un joueur actif au rôle
MJ. La commande désassigne dans le même commit son éventuel personnage, qui reste
dans le vivier de la campagne. Le nouveau rôle et les permissions associées prennent
effet dès le commit.

Le propriétaire peut faire repasser un co-MJ actif au rôle joueur, y compris se
viser lui-même. La propriété ne change pas. La commande est refusée si elle
supprimerait le dernier MJ actif. Le joueur rétrogradé perd immédiatement ses
privilèges et entre dans le parcours « joueur sans personnage ».

Le propriétaire peut transférer la propriété à un autre MJ actif sans changer le
rôle de l'un ou l'autre. Tout membre actif peut quitter volontairement. Si le
partant est propriétaire, il désigne dans la commande un autre MJ actif : transfert
et suppression de son adhésion sont un seul commit. Aucun état validé ne contient
zéro ou plusieurs propriétaires actifs, ni zéro MJ actif.

## Contrats HTTP

Les points suivants sont acquis quel que soit le contrat retenu :

- routes authentifiées, protection CSRF globale et identité issue de
  `@CurrentUser()` ;
- `Idempotency-Key` UUID obligatoire sur chaque mutation ;
- validation Zod de toute entrée, y compris identifiant de campagne, pseudo et
  éventuelle révision fournie par le client ;
- cible exprimée sans exposer d'identifiant interne d'utilisateur ;
- campagne absente, supprimée ou invisible masquée par la même réponse `404` ;
- cible absente de la campagne masquée en `404` après contrôle de l'autorité ;
- conflit d'intention ou de révision en `409`, sans mutation ;
- le rejeu identique restitue le résultat autoritaire durable de la première
  acceptation.

**DÉCISION DR-006-01 — validée le 24 août 2026.** Les mutations restent des
commandes dédiées et répondent `200` avec un `CampaignCommandResult` durable :

| Intention | Route | Corps |
|---|---|---|
| promouvoir | `POST /api/campaigns/:campaignId/members/:displayName/promote` | `{ "expectedRevision": number }` |
| rétrograder | `POST /api/campaigns/:campaignId/members/:displayName/demote` | `{ "expectedRevision": number }` |
| exclure | `DELETE /api/campaigns/:campaignId/members/:displayName` | `{ "expectedRevision": number }` |
| transférer | `POST /api/campaigns/:campaignId/owner` | `{ "displayName": string, "expectedRevision": number }` |
| quitter | `POST /api/campaigns/:campaignId/leave` | `{ "successorDisplayName"?: string, "expectedRevision": number }` |

Le résultat contient `campaignId`, la nouvelle `revision`, l'état autoritaire de
l'acteur (`membership`, `role`, `isOwner`) et, lorsqu'elle existe, celui de la cible
nommée (`displayName`, `membership`, `role`, `isOwner`). Une adhésion quittée porte
`membership: 'left'`, `role: null` et `isOwner: false`. Le reçu conserve exactement
ce résultat ; un rejeu ne relit ni campagne ni annuaire.

Le détail `GET /api/campaigns/:campaignId` expose aussi la `revision` courante. Il
est le point de lecture autoritaire permettant au client de former la première
commande optimiste, puis chaque résultat de commande fournit la suivante.

## Invariants de rôle, propriété et adhésion

1. Une adhésion persistée dans `campaign_memberships` est toujours active et porte
   exactement un rôle `player` ou `gameMaster`.
2. Une campagne active référence exactement un `ownerUserId`, qui correspond à une
   adhésion active de cette campagne.
3. Une campagne active possède en permanence au moins une adhésion `gameMaster`.
4. La propriété et le rôle sont indépendants ; transférer la propriété ne change
   aucun rôle et changer un rôle ne transfère pas la propriété.
5. Une promotion vise uniquement un joueur actif et produit un MJ actif.
6. La promotion désassigne atomiquement l'éventuel personnage de la cible et le
   conserve dans le vivier de la campagne.
7. Une rétrogradation vise uniquement un MJ actif et produit un joueur actif sans
   personnage assigné ; elle est refusée si la cible est le dernier MJ actif.
8. Le propriétaire peut être promu ou rétrogradé comme tout autre membre sous les
   mêmes invariants de rôle ; sa propriété reste inchangée.
9. Un transfert vise un autre MJ actif. Un joueur, un non-membre, un membre d'une
   autre campagne et le propriétaire lui-même sont refusés.
10. Un départ supprime l'unique adhésion active du partant ; aucune adhésion inactive
    ni invitation n'est créée dans `campaign_memberships`.
11. Le propriétaire ne quitte jamais sans transférer, dans le même commit, vers un
    autre MJ actif.
12. Toute permission est relue depuis l'adhésion et la propriété courantes ; aucun
    rôle de campagne n'est tiré du JWT ou d'un cache d'autorité.
13. Une exclusion vise un joueur ou un MJ actif non propriétaire. Elle retire
    directement son adhésion, sans rétrogradation préalable, mais reste refusée si
    elle retirerait le dernier MJ actif.
14. L'exclusion désassigne atomiquement l'éventuel personnage de la cible et le
    conserve dans le vivier de la campagne.

**DÉCISION DR-006-02 — validée le 24 août 2026.** Tout départ volontaire
désassigne atomiquement l'éventuel personnage du partant et le conserve dans le
vivier de la campagne. Le départ ordinaire et le transfert avec départ sont donc
orchestrés en aval par `characters`, selon la même frontière que la promotion.

## Matrice d'autorisation

| Intention | Acteur requis | Cible admissible | Contrôle avant annuaire |
|---|---|---|---|
| promouvoir | propriétaire actif | joueur actif, propriétaire inclus | propriété puis cible |
| rétrograder | propriétaire actif | MJ actif, propriétaire inclus, hors dernier MJ | propriété puis cible |
| exclure | propriétaire actif | joueur ou MJ actif non propriétaire, hors dernier MJ | propriété puis cible |
| transférer la propriété | propriétaire actif | autre MJ actif | propriété puis cible |
| quitter | membre actif lui-même | acteur ; successeur seulement si propriétaire | adhésion puis successeur |
| lire après transition | membre actif | projection selon rôle courant | sans objet |

Un acteur sans droit obtient le même résultat avant toute résolution d'un pseudo
existant ou inconnu. La connaissance d'un identifiant de campagne, d'un pseudo ou
d'une ancienne réponse ne confère aucun droit.

**DÉCISION DR-006-03 — validée le 25 août 2026.** Seul le propriétaire actif peut
exclure. La cible peut être un joueur ou un MJ actif, sans rétrogradation préalable,
mais jamais le propriétaire ni le dernier MJ actif. Son éventuel personnage est
désassigné atomiquement et conservé dans le vivier. La route historique `DELETE`
devient une commande optimiste et idempotente conforme à DR-006-01.

## Idempotence

Le principal effectif est l'utilisateur authentifié. L'intention canonique contient
le type de commande, `campaignId`, la cible validée et normalisée, le successeur
éventuel et toute révision attendue définie par DR-006-01.

Même principal, même clé et même hash relisent le reçu accepté et rendent exactement
le résultat autoritaire initial, sans nouvel effet métier, audit, outbox ou accès à
l'annuaire. Cette règle permet notamment de rejouer un départ après la suppression de
l'adhésion du principal. Même principal et même clé avec un autre hash répond `409`
sans mutation. Une erreur d'authentification ou d'autorisation ne crée aucun reçu
fonctionnel.

## Frontières transactionnelles

Toutes les transactions acceptées incluent `command_receipts`,
`functional_audit_entries` et `outbox_messages` en plus des écritures métier.

| Intention | Écritures métier atomiques | Coordinateur logique |
|---|---|---|
| promotion sans personnage assigné | campagne et adhésion cible | `characters`, en aval de `campaigns` |
| promotion avec personnage assigné | campagne, adhésion cible et `CharacterDossier` désassigné | `characters`, en aval de `campaigns` |
| rétrogradation | campagne et adhésion cible | `campaigns` |
| changement de rôle du propriétaire | campagne et adhésion du propriétaire | selon la transition de rôle |
| transfert seul | campagne | `campaigns` |
| exclusion | campagne, adhésion cible et éventuel dossier désassigné | `characters`, en aval de `campaigns` |
| départ d'un non-propriétaire | campagne, adhésion et éventuel dossier désassigné | `characters`, en aval de `campaigns` |
| transfert avec départ | campagne, propriété, adhésion et éventuel dossier désassigné | `characters`, en aval de `campaigns` |

Une opération indivisible utilise une transaction MongoDB courte. Aucun use-case
n'accède à un modèle Mongoose. Aucun module ne reçoit le repository privé d'un autre
module. Il n'existe ni transaction distribuée artisanale, ni compensation présentée
comme atomique.

## Coordination avec `characters`

La promotion appartient au parcours de campagne mais touche l'agrégat
`CharacterDossier`. Conformément à Phase 5B, `characters`, module en aval, orchestre
la commande en appelant un use-case public de `campaigns` et ses propres capacités
publiques sous une unité de travail MongoDB commune. `campaigns` ne dépend pas de
l'infrastructure, des schémas ou des repositories de `characters`.

Le coordinateur recherche au plus un dossier assigné à `{ campaignId, targetUserId }`,
vérifie sa portée et sa révision, applique la désassignation et le changement de rôle,
puis écrit l'enveloppe dans le même commit. Une défaillance avant commit ne laisse ni
rôle promu, ni dossier désassigné, ni reçu, audit ou outbox partiel.

Le départ et l'exclusion suivent la même frontière : le coordinateur recherche le
dossier du membre retiré, le désassigne s'il existe et applique adhésion, transfert
éventuel et enveloppe dans le même commit.

## Concurrence et révisions

- chaque commande nouvelle charge la campagne et toutes les racines touchées avec
  leur révision courante puis écrit sous filtre des révisions attendues ;
- aucune commande ne remplace ou ne fusionne silencieusement un état concurrent ;
- une seule transition gagne lorsqu'une promotion, rétrogradation, exclusion,
  propriété ou adhésion concurrente touche la même campagne ;
- une promotion vérifie aussi la révision du dossier assigné lorsqu'il existe ;
- un conflit sur une racine annule toute la transaction et répond `409` ;
- le reçu d'un rejeu accepté est prioritaire sur la réévaluation d'une révision
  devenue obsolète ; une nouvelle clé portant cette révision obsolète est refusée ;
- la révision de campagne est incrémentée exactement une fois par commande acceptée,
  même lorsqu'elle modifie à la fois propriété et adhésion.

La provenance client ou serveur de la révision de campagne reste liée à DR-006-01.

## Notifications et outbox

Chaque transition acceptée doit produire au moins un fait interne d'outbox, dans la
même transaction, avec identité stable, causalité, révisions et politique d'audience.
Une notification utilisateur n'est jamais émise avant commit et aucun payload
universel ne contient les données de toutes les audiences.

**DÉCISION DR-006-04 — validée le 24 août 2026.** Cet incrément produit seulement
les faits internes `campaign.member-promoted`, `campaign.member-demoted`,
`campaign.ownership-transferred`, `campaign.member-left` et
`campaign.member-excluded`, avec l'audience technique `campaign-members`. Il ne crée
aucune notification utilisateur. Leur livraison et une politique de notification
explicite restent hors périmètre.

## Scénarios Given/When/Then

1. **Promotion nominale** — Étant donné un propriétaire actif et un joueur actif
   sans personnage, quand le propriétaire le promeut, alors il devient MJ dans un
   commit enveloppé et sa permission MJ est utilisable immédiatement.
2. **Promotion avec personnage** — Étant donné un personnage assigné au joueur,
   quand la promotion est acceptée, alors rôle et dossier sont modifiés atomiquement
   et le personnage rejoint le vivier.
3. **Échec de coordination** — Étant donné une désassignation qui échoue, quand la
   promotion est tentée, alors aucun rôle, dossier, reçu, audit ni outbox n'est écrit.
4. **Rétrogradation** — Étant donné deux MJ actifs, quand le propriétaire rétrograde
   un co-MJ, alors son adhésion reste active comme joueur et ses privilèges cessent
   sur la requête suivante.
5. **Dernier MJ** — Étant donné un seul MJ actif, quand sa rétrogradation ou son départ
   est demandé, alors `409` est rendu sans mutation.
6. **Propriété indépendante** — Étant donné un propriétaire MJ et un autre MJ actif,
   quand le propriétaire se rétrograde, alors il reste propriétaire actif et devient
   joueur.
7. **Transfert nominal** — Étant donné un autre MJ actif, quand le propriétaire lui
   transfère la propriété, alors l'unique propriétaire change sans modifier les rôles.
8. **Cibles de transfert invalides** — Étant donné un joueur, un non-membre ou le
   propriétaire lui-même, quand un transfert le vise, alors il est refusé sans mutation.
9. **Départ ordinaire** — Étant donné un membre non propriétaire, quand il quitte,
   alors son adhésion disparaît et son éventuel personnage est désassigné atomiquement.
10. **Propriétaire sans successeur** — Étant donné le propriétaire, quand il quitte
    sans successeur valide, alors la commande est refusée sans mutation.
11. **Transfert et départ** — Étant donné un successeur MJ actif, quand le propriétaire
    quitte en le désignant, alors propriété et adhésion changent dans un seul commit.
12. **Conflit de révision** — Étant donné une révision lue puis dépassée, quand une
    nouvelle clé tente une mutation, alors `409` est rendu sans effet partiel.
13. **Rejeu** — Étant donné une commande acceptée, quand la même clé et la même
    intention sont rejouées, alors le résultat initial est relu sans doublon.
14. **Conflit d'intention** — Étant donné une clé reçue, quand une autre intention la
    réutilise, alors `409` est rendu sans mutation.
15. **Autorisation avant annuaire** — Étant donné un acteur non autorisé, quand il vise
    un pseudo existant ou inconnu, alors les deux commandes échouent avant l'annuaire.
16. **Isolation** — Étant donné un partant ou un tiers, quand il relit la campagne,
    alors la campagne réelle et un identifiant absent produisent le même `404`.
17. **Exclusion d'un joueur** — Étant donné un propriétaire et un joueur actifs,
    quand le propriétaire l'exclut, alors son adhésion disparaît et son éventuel
    personnage est désassigné dans le même commit.
18. **Exclusion d'un MJ** — Étant donné plusieurs MJ actifs, quand le propriétaire
    exclut un co-MJ, alors son adhésion disparaît sans rétrogradation préalable.
19. **Gardes d'exclusion** — Étant donné le propriétaire, le dernier MJ ou un acteur
    non propriétaire, quand une exclusion interdite est tentée, alors elle est
    refusée sans annuaire ni mutation partielle.
20. **Persistance** — Étant donné toute transition acceptée, alors les mappers,
    schémas, reçus, audits et outbox préservent les révisions et aucune adhésion
    inactive ou invitation n'est écrite dans `campaign_memberships`.

## Hors périmètre

- vote de succession lié à une purge, purge définitive de compte et anonymisation ;
- suppression logique ou physique de campagne ;
- invitation, sauf non-régression des invariants acquis ;
- front, Socket.IO, livraison des notifications et courriels ;
- règles D&D, personnages hors désassignation strictement coordonnée ;
- `.env`, seeds, migrations, CI et dépendances supplémentaires ;
- compatibilité avec les anciennes collections et refactors sans rapport.

## Preuves unitaires, MongoDB et Bruno

Les tests de domaine et de use-cases emploient des doubles en mémoire. Ils couvrent
les transitions nominales, propriétaire/role indépendants, dernier MJ, autorités,
ordre des contrôles, isolation, idempotence, intention divergente, révisions et
absence de mutation partielle. Les tests de schémas et mappers couvrent les contrats
Zod, documents d'adhésion active, reçus, audit et outbox.

Une preuve MongoDB sur replica set couvre les frontières que les doubles ne peuvent
pas établir : atomicité campagne–adhésion–dossier–enveloppe, rollback sur échec de
coordination, filtres de révision et unicité des adhésions/propriétaire actifs.

Bruno étend la collection publique existante dans une nouvelle base E2E isolée. Le
scénario crée une campagne, fait accepter deux invitations et prouve
promotion/désassignation/permission, exclusion joueur et MJ avec désassignation,
rétrogradation sans retrait, dernier MJ, transfert, départ atomique, invariants finaux,
isolation `404`, rejeu sans doublon et conflit d'intention `409`. Aucun accès direct à
MongoDB ne remplace une assertion observable par les API ; les preuves de collection
non observables restent dans les tests d'intégration MongoDB.

## Décisions

DR-006-01, DR-006-02 et DR-006-04 ont été validées le 24 août 2026. DR-006-03 a
été validée le 25 août 2026 ; aucune décision fonctionnelle de cette spécification
ne reste ouverte.
