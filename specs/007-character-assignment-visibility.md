# Spec 007 — Attribution, vivier et visibilité des personnages

## Références normatives

- `PRODUCT.md`, sections Utilisateurs, Personnage et MVP — un personnage au plus par
  joueur et plusieurs personnages administrables par les MJ ;
- `SF-001`, personnages, attribution, visibilité et critères essentiels — attribution
  réservée aux MJ actifs, cible joueur actif de la même campagne, isolation stricte et
  visibilité selon le rôle ;
- `SF-002`, création et validation — état de revue distinct de l'attribution et fiche
  inutilisable en combat avant acceptation ;
- `GAP-ANALYSIS.md`, isolation, visibilité, attribution et priorités P0 ;
- `DEC-002` — contrôle d'un seul personnage, désassignation lors d'une promotion,
  visibilité complète du joueur assigné et des MJ, isolation serveur ;
- `DEC-003` — cycle de validation distinct du contrôle du personnage ;
- `DEC-015`, Phase 5A — projections de sécurité nommées, enveloppes transactionnelles,
  révisions optimistes et coordination par capacités publiques ;
- `DEC-016`, Phase 5B — snapshots révisés, index d'attribution, transactions, reçus,
  audit et outbox ;
- `TECHNICAL-ARCHITECTURE-5A.md`, autorisation relue, projections et transactions ;
- `TECHNICAL-PERSISTENCE-5B.md`, `CharacterDossier`, concurrence, index et frontières ;
- [Specs 004 à 006](004-campaign-foundation.md) — campagne et adhésion actives,
  invitations séparées, rôles immédiats, désassignations coordonnées et enveloppes.

## État actuel audité

Au commit `5f86778`, les Specs 004 à 006 sont présentes. Les adhésions et rôles courants
sont relus depuis `campaigns`; promotion, départ et exclusion savent désassigner un
personnage dans la même transaction que le cycle d'adhésion.

Le périmètre historique de `characters` diverge toutefois de la cible :

- fiche et build contrôlent l'adhésion à la campagne demandée, puis chargent le
  personnage par son seul identifiant sans vérifier son `campaignId` ;
- tout membre actif reçoit actuellement la fiche complète et le build complet ;
- la liste renvoie à tous le même `Character`, avec résumé de build, tirage éventuel,
  créateur et assignataire ;
- l'assignation charge aussi le personnage entrant par identifiant seul, résout le
  pseudo avant d'avoir établi toutes les propriétés de la cible et ne vérifie ni son
  adhésion active ni son rôle joueur ;
- le remplacement historique désassigne l'ancien puis sauvegarde le nouveau dans deux
  écritures indépendantes, sans transaction ni rollback commun ;
- assignation et désattribution n'exigent ni `Idempotency-Key`, ni révision attendue,
  ni reçu, audit ou outbox ;
- les paramètres de route sont des chaînes NestJS brutes ;
- `character_dossiers` porte déjà un index unique partiel sur
  `{ campaignId, assignedTo }`, utile pour défendre l'unicité concurrente ;
- les preuves Mongo et Bruno de la Spec 006 couvrent les désassignations coordonnées,
  pas le cycle complet d'attribution et de visibilité demandé ici.

Les comportements historiques ne constituent pas des décisions.

## Parcours utilisateur

Un membre actif ouvre la liste des personnages de sa campagne. Un MJ actif dispose
d'une projection d'administration. Un joueur voit une projection complète de contrôle
pour son personnage assigné et seulement une projection minimale des autres dossiers,
notamment ceux du vivier. Aucun secret n'est envoyé puis masqué par le client.

Un MJ actif attribue un personnage de la campagne à un joueur actif de cette même
campagne. Les rôles et adhésions sont relus au moment de la commande. Une promotion,
rétrogradation, exclusion ou sortie déjà commise modifie donc immédiatement le résultat.

Le joueur assigné et les MJ actifs peuvent ensuite ouvrir la fiche et le détail de
construction. Les autres membres obtiennent le même masquage que pour un personnage
absent ou extérieur.

## Contrats HTTP acquis

Les routes restent sous `/api/campaigns/:campaignId/characters` :

| Intention | Route | Réponse cible |
|---|---|---|
| lister | `GET /` | projection de liste déterminée côté serveur selon le lecteur |
| lire la fiche | `GET /:characterId/sheet` | fiche complète réservée au joueur assigné et aux MJ actifs |
| lire le build | `GET /:characterId/build` | détail complet réservé au joueur assigné et aux MJ actifs |
| attribuer | `POST /:characterId/assign` | résultat autoritaire durable de commande |
| désattribuer | `POST /:characterId/unassign` | résultat autoritaire durable de commande |

Toutes les routes sont authentifiées. `campaignId`, `characterId`, corps et
`Idempotency-Key` des mutations sont validés par des schémas Zod partagés. Une ressource
absente, extérieure, supprimée ou invisible est masquée en `404`. Les erreurs de
révision et d'intention répondent `409` sans mutation.

### DÉCISION DR-007-01 — validée le 25 août 2026

Cette décision ne concerne ni une migration, ni la reprise de données historiques : la
base cible est vierge et alimentée par des seeds conformes. Elle concerne exclusivement
le cas nominal futur où un joueur contrôle déjà A et où un MJ lui attribue B.

Le remplacement de A par B est atomique. Le corps est
`{ "playerDisplayName": string, "expectedRevision": number }`, où la révision est
celle de B. Le serveur découvre A sous la transaction, conserve sa révision lue comme
précondition optimiste et filtre les deux écritures sur leurs révisions respectives.
Le client n'a donc pas à connaître l'identifiant ni la révision de A. Le résultat
autoritaire contient B après attribution et, lorsqu'un remplacement a eu lieu, un
résumé de A après désattribution.

### DÉCISION DR-007-02 — validée le 25 août 2026

Un personnage peut être attribué avant son acceptation par un MJ. Attribution et
validation restent deux états indépendants. Le contrôle permet au joueur de construire
et modifier son personnage ; les parcours d'aventure restent interdits jusqu'à
l'acceptation, qui verrouille les choix selon `DEC-003`.

## Projections de lecture

| Lecteur | Liste | Fiche complète | Build complet |
|---|---|---|---|
| MJ actif | projection MJ de tous les personnages | tous les personnages de la campagne | tous les personnages de la campagne |
| joueur assigné | projection contrôlée de son personnage | son personnage uniquement | son personnage uniquement |
| joueur actif sans contrôle sur le dossier | projection minimale | `404` | `404` |
| invité, parti, exclu ou extérieur | aucune donnée, campagne masquée | `404` | `404` |

La projection de combat publique (nom, portrait, classe, niveau et PV) dépend de
SF-003/SF-004 et reste hors périmètre.

### DÉCISION DR-007-03 — validée le 25 août 2026

Le vivier utilise une projection enrichie contenant : identifiant public du dossier,
nom, portrait lorsqu'il existe, statut de validation, classe, espèce/lignée, niveau et
état assigné/non assigné. Elle ne contient jamais donnée mécanique détaillée,
équipement, sorts, caractéristiques, tirage, identité système, identité du créateur ni
information privée de l'assignataire. La projection MJ est nommée explicitement plutôt
que de réutiliser l'agrégat ou le DTO historique.

## Invariants d'appartenance, d'attribution et de visibilité

1. Un personnage appartient exactement à une campagne et toute lecture ou mutation le
   charge par `{ campaignId, characterId }`.
2. Un joueur actif possède au maximum un personnage assigné dans une campagne.
3. Un personnage est assigné à zéro ou un joueur actif de sa campagne.
4. Un personnage n'est jamais assigné à un MJ, invité, membre parti ou exclu.
5. Seul un MJ actif attribue ou désattribue un personnage existant ; l'unique exception
   est l'auto-attribution atomique au joueur lors de sa propre création.
6. L'autorité de l'acteur est établie avant toute résolution du pseudo cible.
7. Un personnage déjà assigné à un autre joueur n'est jamais transféré implicitement.
8. Les changements de rôle et d'adhésion prennent effet à la requête suivante.
9. Une mutation concurrente ne fusionne aucun état et ne laisse aucun doublon.
10. Un échec de remplacement ne laisse ni les deux personnages assignés, ni les deux
    désassignés.
11. Seul le joueur assigné et les MJ actifs lisent fiche et build complets.
12. Les projections sont filtrées avant sérialisation côté serveur.

## Matrice d'autorisation

| Action | Acteur | Cible ou ressource | Résultat interdit |
|---|---|---|---|
| lister | membre actif | campagne visible | `404` pour campagne invisible |
| lire fiche/build | MJ actif ou joueur assigné | personnage de la campagne | `404` indistinguable |
| attribuer un personnage existant | MJ actif | joueur actif non-MJ de la campagne | refus sans résolution prématurée ni mutation |
| désattribuer | MJ actif | personnage assigné de la campagne | refus sans mutation |
| créer son personnage | joueur actif sans personnage | nouveau personnage de la campagne | création et auto-attribution atomiques |
| sélectionner dans le vivier | personne dans cet incrément | sans objet | route absente |

### DÉCISION DR-007-04 — validée le 25 août 2026

Un joueur actif sans personnage peut créer son propre personnage. La création lui
attribue automatiquement ce nouveau personnage dans la même transaction et doit
préserver l'invariant d'unicité. Un joueur ne peut ni choisir ni s'attribuer un
personnage existant du vivier. Seul un MJ actif peut associer un personnage existant à
un joueur.

### DÉCISION DR-007-05 — validée le 25 août 2026

Attribuer un personnage déjà contrôlé par un autre joueur est explicitement rejeté,
sans transfert implicite. Seul un MJ actif peut retirer ce personnage à son joueur,
même lorsque ce dernier l'a créé. Le créateur joueur en conserve le contrôle et peut le
modifier jusqu'à son acceptation — le « verrouillage » par le MJ — selon `DEC-003`.

## Vivier

Le vivier est l'ensemble des personnages non assignés de la campagne. Une promotion,
un départ, une exclusion et une désattribution acceptés y remettent immédiatement le
dossier. Il ne constitue pas une collection séparée ni une source d'autorité. Son
Un dossier non accepté reste éligible à l'attribution. Sa représentation suit
DR-007-03.

## Idempotence, révisions et concurrence

Le principal est l'utilisateur authentifié. L'intention canonique comprend le type de
commande, `campaignId`, `characterId`, pseudo cible normalisé pour l'attribution, et
toutes les révisions attendues validées par DR-007-01.

Même principal, même clé et même intention relisent le résultat durable initial sans
nouvel accès annuaire, effet métier, audit ou outbox. Même clé avec intention différente
répond `409`. Le rejeu accepté prime sur des révisions désormais obsolètes.

Chaque nouvelle commande filtre les écritures sur toutes les révisions lues. L'index
unique partiel `{ campaignId, assignedTo }` défend l'unicité contre les courses, sans
remplacer les règles métier. Une erreur d'unicité ou de révision devient un conflit
contrôlé et annule toute la transaction.

## Frontières transactionnelles et coordination avec `campaigns`

`characters`, en aval de `campaigns`, orchestre l'attribution. Il appelle une capacité
publique de `campaigns` pour relire acteur et cible sous la même unité de travail, sans
accéder à ses modèles ou repositories. `campaigns` n'accède jamais à Mongoose dans
`characters`.

Une attribution simple écrit le dossier entrant et l'enveloppe. Un remplacement écrit
l'ancien dossier, le dossier entrant et l'enveloppe dans une transaction MongoDB unique.
Une désattribution écrit le dossier et l'enveloppe. Tout échec annule l'ensemble.

## Reçus, audit et outbox

Chaque mutation acceptée persiste dans la même transaction : résultat autoritaire,
reçu durable, audit fonctionnel et faits d'outbox. Le reçu conserve les identifiants et
révisions nécessaires au rejeu, sans sérialiser un agrégat interne complet.

### DÉCISION DR-007-06 — validée le 25 août 2026

L'incrément produit uniquement les faits internes `character.assigned` et
`character.unassigned`, avec l'audience technique `campaign-members`, sans livraison de
notification. Un remplacement produit les deux faits élémentaires sous la même
causalité ; aucun troisième type dédié n'est créé.

## Scénarios Given/When/Then

1. Un MJ actif attribue un personnage de la campagne à un joueur actif : le contrôle
   est visible après commit avec une seule attribution finale.
2. Un joueur, ou un MJ rétrogradé juste avant la requête, ne peut attribuer.
3. Une cible extérieure, invitée, MJ, exclue ou partie est refusée.
4. L'autorisation invalide de l'acteur échoue avant la résolution d'un pseudo connu ou
   inconnu.
5. Un identifiant connu d'une autre campagne produit le même `404` qu'un absent.
6. Une désattribution nominale remet immédiatement le personnage dans le vivier.
7. Un personnage déjà attribué à un autre joueur suit DR-007-05 sans transfert caché.
8. Un remplacement suit DR-007-01 et reste atomique si la seconde écriture échoue.
9. Deux attributions concurrentes ne donnent jamais deux personnages au joueur.
10. Une révision obsolète répond `409` sans effet partiel.
11. Un rejeu identique rend le résultat initial sans nouvel audit ni fait d'outbox ;
    une intention divergente sous la même clé répond `409`.
12. Un MJ voit les projections complètes de la campagne.
13. Un joueur lit la fiche et le build de son personnage assigné uniquement.
14. La liste d'un joueur ne contient aucun champ privé d'un autre personnage ou du
    vivier.
15. Reçu, audit, outbox et toutes les racines modifiées sont commis ou annulés ensemble.
16. Un joueur actif sans personnage crée un personnage : il lui est attribué dans le
    commit de création ; un joueur déjà assigné ne peut pas créer un second contrôle.

## Hors périmètre

- cycle complet de soumission et validation, correction et resoumission ;
- création D&D complète au-delà de l'auto-attribution décidée ici, progression,
  multiclassage et état d'aventure ;
- combat et projection publique de combat ;
- suppression ou archivage définitif ;
- sélection ou demande par un joueur d'un personnage existant du vivier ;
- livraison des notifications, front, Socket.IO ;
- `.env`, seeds, migrations, CI, dépendances et refactors sans rapport.

## Preuves unitaires, MongoDB et Bruno

Les doubles en mémoire couvrent le domaine,
les use-cases, l'ordre d'autorisation, les projections, l'isolation, les mappers, les
schémas, l'idempotence, les révisions, les reçus, l'audit et l'outbox.

Une preuve MongoDB replica set couvre l'atomicité du remplacement à deux dossiers,
l'index unique d'attribution, les conflits de révision, l'enveloppe dans la même
transaction et le rollback sans mutation partielle.

Bruno utilise une nouvelle base E2E et les seules API publiques. Il crée une campagne,
deux joueurs et plusieurs personnages, prouve les projections MJ/joueur/vivier,
l'attribution, la désattribution ou le remplacement décidé, les refus de cible,
l'isolation inter-campagnes, la perte immédiate du droit MJ, le rejeu, le conflit
d'intention et les invariants finaux.

## Décisions

DR-007-01 à DR-007-06 ont été validées le 25 août 2026. Aucune décision fonctionnelle
de cette spécification ne reste ouverte.
