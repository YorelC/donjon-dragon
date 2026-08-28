# Phase 5B — modèle de données MongoDB cible et stratégie de persistance

## Statut et limite du document

- **Statut :** validée par le propriétaire le 21 août 2026.
- **Prérequis validés :** exigences SF-001 à SF-006, matrices B01 à B09, DEC-001 à
  DEC-015 et Phase 5A.
- **Périmètre :** documents et collections MongoDB, propriété des données, versions,
  références, concurrence, idempotence, audit, outbox, transactions, index, rétention,
  migrations et projections persistées.
- **Hors périmètre :** DTO Zod, endpoints HTTP, commandes ou événements Socket.IO
  détaillés, dépendances, code Mongoose/NestJS, scripts de migration, seeds, CI,
  stockage binaire des images et déploiement MongoDB.
- **Décision associée :** [DEC-016](DECISIONS/016-target-mongodb-persistence.md).

Ce document précise la représentation de la cible validée en Phase 5A. Il ne déplace
aucun invariant entre modules et n'autorise aucune implémentation.

## Prémisse normative — conception sur base propre

Les collections et documents actuellement présents sont des reliquats et ne
contraignent ni les noms, ni les frontières, ni la compatibilité de la cible. En
particulier, `characters`, `items` et `monsters` ne sont pas des sources à convertir :
leur mélange d'identité, de mécanique et d'état courant illustre seulement ce que le
nouveau modèle doit éviter.

La cible est conçue comme une base vide alimentée par les spécifications et datasets
validés. Aucun lecteur de compatibilité, double writer, release `LEGACY_IMPORT` ou
transformation des documents existants n'est requis. Cette décision accepte de perdre
les données de démonstration actuelles afin de ne pas introduire leur ambiguïté dans le
nouveau domaine.

## Décision fonctionnelle préalable — aucune coexistence de changement de build

Le propriétaire a décidé le 21 août 2026 qu'un personnage ne peut jamais cumuler un
niveau déverrouillé et une respécialisation déverrouillée.

- Un niveau ne peut pas être déverrouillé tant qu'une respécialisation est ouverte,
  y compris pendant sa reconstruction, sa revue ou une correction après refus.
- Une respécialisation ne peut pas être déverrouillée tant qu'un niveau est en attente
  ou commencé.
- Une montée finalisée active une nouvelle version de build et verrouille son
  `BuildChange` dans la même transaction ; la respécialisation devient ensuite
  déverrouillable.
- Une révocation de niveau encore autorisée par SF-002 ferme le changement : le niveau
  n'est alors plus déverrouillé et ne bloque plus une future respécialisation.
- L'action groupée de progression signale un personnage en respécialisation comme
  inéligible sans bloquer les autres personnages.

Cette exclusion est portée par un seul emplacement ouvert de `BuildChange` par
personnage. Elle n'est pas déduite de deux indicateurs indépendants susceptibles de
diverger.

Une respécialisation déverrouillée, commencée, soumise ou refusée peut être abandonnée.
L'abandon ferme le `BuildChange` avec l'état terminal `ABANDONED`, libère l'emplacement
unique et conserve le build actif, l'état d'aventure et l'inventaire sans mutation. Le
candidat et ses versions restent immuables et auditables, mais ne peuvent plus être
activés. Un niveau peut ensuite être déverrouillé.

Le joueur assigné et tout MJ actif peuvent déclencher l'abandon. L'acteur effectif est
persisté dans le reçu d'idempotence et dans l'audit fonctionnel.

## Principes de représentation

### Identité et enveloppes de document

Les identifiants métier sont des chaînes opaques, stables et générées par
l'application. Elles sont stockées directement dans `_id` afin d'éviter un second champ
`id` et un index unique redondant. Les références inter-agrégats utilisent ces mêmes
valeurs sans exposer leur format comme contrat fonctionnel.

Tout document porte, en plus de `_id` :

- `schemaVersion`, entier positif décrivant sa représentation persistée ;
- `createdAt`, et `updatedAt` lorsqu'il est mutable, sous forme de dates BSON UTC ;
- `campaignId` pour toute donnée appartenant à une campagne, même si cette portée
  pourrait être retrouvée par une autre référence.

Une racine mutable porte en plus une `revision` entière, monotone, démarrant à `0` et
incrémentée exactement une fois par commande qui la modifie. Elle n'utilise pas `__v`
comme révision métier.

Une version immuable porte plutôt un numéro ou une clé de version métier, un
`contentHash` calculé sur sa forme canonique, ses références de provenance et son
auteur. Elle n'a pas de `revision` mutable.

### Dates, nombres et hasard

L'application fournit un seul instant à chaque commande. MongoDB ne décide pas de
l'heure métier. Toute date cible est un type BSON UTC ; aucune chaîne de date issue des
collections reliques n'est convertie ou importée.

Les résultats de dés et de génération sont des valeurs persistées, jamais recalculées
au chargement. Leur expression, leurs faces, leurs modificateurs, leur audience et les
versions de règles employées restent référencés par le reçu et la trace de calcul.

### Portée campagne et références

MongoDB ne fournit pas de clés étrangères. Toute référence inter-agrégats contient un
identifiant métier et, lorsqu'elle est liée à une campagne, la commande vérifie aussi
le `campaignId` de chaque ressource chargée. Aucun `populate` Mongoose ne devient un
mécanisme d'autorisation ou une dépendance entre repositories.

Une référence vers une racine mutable n'en copie pas silencieusement les données. Une
frontière historique ou mécanique référence une version immuable et peut embarquer le
minimum nécessaire à sa reprise exacte.

### Suppression logique

Un compte ou une campagne supprimé reste présent avec `deletedAt`, l'auteur effectif et
le motif disponible. Ses données dépendantes restent référencées et ne sont pas
supprimées en cascade. Les parcours normaux excluent ces racines et refusent toute
nouvelle mutation métier, tandis que les lectures opérationnelles autorisées peuvent
encore expliquer l'historique.

Une suppression physique n'est permise qu'après une demande explicite de l'utilisateur
adressée au responsable de la plateforme. Elle relève d'un processus administratif
explicite, jamais d'un TTL ou d'une cascade Mongoose.

La demande est authentifiée, confirmée par l'adresse vérifiée et validée manuellement.
Elle produit un manifeste de purge réexécutable qui couvre :

1. compte, profil, sessions, jetons, médias, événements de sécurité et amitiés ;
2. suppression de chaque adhésion aux campagnes conservées et désassignation atomique
   de son personnage, qui reste disponible aux MJ ;
3. transfert préalable, par vote, de chaque campagne possédée qui conserve au moins un
   autre membre actif ;
4. purge de toute campagne possédée sans autre membre actif, avec ses personnages,
   contenus personnalisés, jeux, versions exclusives, audits et projections ;
5. anonymisation irréversible de l'acteur dans les faits partagés d'une campagne
   conservée, sans table de correspondance ;
6. création d'une sauvegarde post-purge vérifiée, puis destruction de toute sauvegarde
   antérieure susceptible de réintroduire les données ;
7. conservation d'une preuve non identifiante : identifiant de procédure, dates,
   résultat et compteurs par catégorie.

La purge est bornée par lots et reprise depuis son manifeste ; elle ne cherche pas à
tenir toute la base dans une transaction de longue durée. Chaque lot est atomique, la
racine concernée reste gelée pendant la procédure et la purge n'est déclarée terminée
qu'après validation de toutes les catégories et sauvegardes.

| Portée | Action de purge |
|---|---|
| `users`, authentification, médias | suppression physique de tous les documents et blobs du compte |
| `friendships` | suppression de toute paire contenant le compte |
| campagnes conservées | suppression de l'adhésion, désassignation du dossier et conservation du personnage dans le vivier MJ |
| campagnes possédées avec membres | vote puis transfert atomique de propriété avant suppression de l'adhésion |
| campagnes possédées sans autre membre | suppression de toutes les données portant leur `campaignId`, y compris versions exclusivement privées |
| reçus, outbox et sécurité propres au compte | suppression après extinction des traitements en cours |
| audits partagés d'une campagne conservée | remplacement irréversible de l'acteur par `ERASED_ACTOR`, sans identifiant corrélable |
| sauvegardes | nouvelle sauvegarde post-purge vérifiée, puis destruction de toutes les générations antérieures |

> **DÉCISION REQUISE — vote de succession.** La persistance peut représenter votes et
> résultat, mais les électeurs, candidats, quorum, majorité, égalités et absence de
> résultat doivent être décidés fonctionnellement avant les contrats.

### Arbitrage de la purge

**Problème.** Une cascade globale peut dépasser la durée d'une transaction, tandis
qu'une suppression partielle laisserait des données personnelles ou une campagne sans
propriétaire.

**Options.** (1) rester en soft delete ; (2) lancer une cascade unique et immédiate ;
(3) geler le périmètre, résoudre les successions, puis exécuter un manifeste par lots
idempotents avec vérification finale.

**Choix.** L'option 3 est retenue. Elle est la seule à concilier suppression complète,
reprise après panne et invariants des campagnes sans transaction longue.

**Conséquences et risques.** La purge peut prendre du temps et reste visible comme
`PENDING` jusqu'à sa preuve finale. Un vote sans résultat bloque la suppression du
propriétaire. Détruire les sauvegardes antérieures réduit volontairement la profondeur
de restauration de toute la plateforme ; une sauvegarde post-purge testée est donc un
prérequis obligatoire.

## TD-5B-001 — séparer snapshots mutables et versions immuables

### Problème

La cible doit distinguer identité stable, contenu mécanique immuable et état courant
sans créer de document géant, de tableau à croissance illimitée ou de seconde source
de vérité. Les collections reliques ne participent pas à ce choix.

### Options considérées

1. Conserver un document monolithique et copier l'ancien document à chaque mutation.
2. Employer un journal complet et reconstruire l'état par event sourcing.
3. Garder un snapshot courant par agrégat et isoler les versions mécaniques immuables.

### Choix

L'option 3 est retenue. Chaque agrégat mutable possède un snapshot courant. Les builds,
releases et profils mécaniques acceptés sont des documents immuables séparés. L'audit
explique les transitions mais ne reconstruit pas les agrégats.

### Conséquences et risques

- Une lecture courante reste directe et une ancienne partie reste explicable.
- Corriger un candidat ou une définition mécanique crée une nouvelle version.
- Les versions référencées ne peuvent jamais être supprimées par un TTL.
- La multiplication des documents augmente le nombre de références et impose des
  transactions aux activations.
- Un document mutable ou une transaction qui approcherait les limites MongoDB échoue
  avant mutation ; aucune troncature n'est admise.

### Limites BSON et choix de découpage

MongoDB limite chaque document BSON à **16 Mio** et sa profondeur à **100 niveaux**.
Une transaction dure moins d'une minute par défaut ; sa taille totale n'est plus
limitée à 16 Mio, mais chaque document et entrée d'oplog le reste, et une transaction
trop volumineuse pour le cache WiredTiger est annulée. Les transactions coûtent aussi
plus cher que les écritures mono-document et ne remplacent pas un schéma adapté.

Sources normatives MongoDB :

- [limites BSON et index](https://www.mongodb.com/docs/manual/reference/limits/) ;
- [transactions et conception de schéma](https://www.mongodb.com/docs/manual/core/transactions/) ;
- [durée et volume des transactions](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/) ;
- [limites des index multikey](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-multikey/).

Le choix cible est donc structurel, pas un plafond arbitraire de jeu :

- budget de conception de **1 Mio maximum** pour une racine mutable ordinaire ;
- aucune écriture autorisée au-delà de **8 Mio** pour conserver une marge de sécurité
  sur les enveloppes, index et évolutions de schéma ;
- tout ensemble dont la cardinalité peut croître avec les utilisateurs ou la partie
  devient une collection enfant paginable ;
- seuls les petits ensembles fermés par une règle, par exemple six caractéristiques ou
  vingt niveaux, peuvent être embarqués ;
- aucun tableau non borné n'est indexé dans une racine ; un index composé ne porte pas
  deux champs tableaux, conformément aux contraintes multikey ;
- une commande collective planifie des lots bornés avant d'ouvrir une transaction et
  ne maintient jamais une transaction pendant une interaction humaine.

Ces seuils sont des garde-fous techniques et ne limitent pas le nombre fonctionnel de
membres, participants, obstacles, possessions ou interactions : ces volumes s'étendent
en nombre de documents.

## Correspondance agrégats, documents et collections

Les noms ci-dessous sont les noms physiques cibles explicites. Aucun nom ne dépendra
de la pluralisation implicite de Mongoose.

| Module propriétaire | Agrégat ou donnée | Collection cible | Documents et cardinalité |
|---|---|---|---|
| `user` | `User` | `users` | Un snapshot mutable par compte, conservé après soft delete. |
| `auth` | jeton de renouvellement | `refresh_tokens` | Un document par jeton, avec expiration et révocation. |
| `auth` | jeton de vérification | `email_verification_tokens` | Un document expirant par jeton. |
| `user` | demande de purge | `account_erasure_requests` | Un manifeste administratif par demande explicite, supprimé après preuve non identifiante. |
| `user` | preuve de purge | `data_erasure_proofs` | Un résultat non identifiant par procédure terminée. |
| `friendship` | `Friendship` | `friendships` | Un snapshot mutable par paire canonique non ordonnée, demandes incluses. |
| `campaigns` | `Campaign` | `campaigns` | Un snapshot par campagne, conservé après soft delete ; identité, propriétaire et réglages bornés seulement. |
| `campaigns` | `CampaignMembership` | `campaign_memberships` | Un document par utilisateur et campagne ; rôle, état et dates. |
| `campaigns` | `CampaignInvitation` | `campaign_invitations` | Un document par cycle d'invitation. |
| `campaigns` | vote de succession | `campaign_ownership_votes` | Une consultation par campagne propriétaire en purge. |
| `campaigns` | bulletin de succession | `campaign_ownership_ballots` | Un document enfant par électeur et consultation. |
| `rules` | `RulesetRelease` | `ruleset_releases` | Un manifeste immuable par release validée. |
| `rules` | entrée de manifeste | `ruleset_release_entries` | Une référence immuable par profil admis dans une release. |
| `rules` | profil de règle versionné | `rule_profile_versions` | Un document immuable par type, clé stable et version. |
| `items` | `ItemDefinition` | `item_definitions` | Une identité mutable par objet officiel ou de campagne. |
| `items` | version mécanique d'objet | `item_definition_versions` | Un document immuable par version de définition. |
| `bestiary` | `CreatureProfile` | `creature_profiles` | Une identité mutable et son état éditorial. |
| `bestiary` | version mécanique de créature | `creature_profile_versions` | Un document immuable par version exécutable. |
| `characters` | `CharacterDossier` | `character_dossiers` | Un snapshot par personnage. |
| `characters` | `BuildChange` | `character_build_changes` | Un document par création, niveau ou respécialisation ; au plus un ouvert par personnage. |
| `characters` | `BuildVersion` | `character_build_versions` | Une version immuable à chaque soumission ou activation. |
| `characters` | `CharacterAdventureState` | `character_adventure_states` | Un snapshot par personnage accepté. |
| `characters` | `CharacterInventory` | `character_inventories` | Une racine et sa révision par personnage. |
| `characters` | exemplaire possédé | `character_inventory_entries` | Un document enfant par exemplaire ou pile, modifiable seulement via l'inventaire. |
| `gameplay` | `CampaignPlayState` | `campaign_play_states` | Un snapshot unique par campagne. |
| `gameplay` | `EncounterPreparation` | `encounter_preparations` | Une petite racine par préparation conservée. |
| `gameplay` | participant préparé | `encounter_participants` | Un document par personnage, PNJ ou créature préparée et version référencée. |
| `gameplay` | élément de scène préparé | `encounter_features` | Un document par obstacle, zone, piège ou source de butin. |
| `gameplay` | `Combat` | `combats` | Une racine révisée : cycle, round, tour, ordre et état de nettoyage. |
| `gameplay` | état de participant | `combat_participant_states` | Un document enfant par instance ; référence immuable et seules variables de combat. |
| `gameplay` | élément de scène actif | `combat_scene_states` | Un document enfant par obstacle, zone ou objet mutable de scène. |
| `gameplay` | interaction de combat | `combat_interactions` | Une transition immuable par interaction acceptée, conservée jusqu'à la clôture du butin. |
| `gameplay` | `RestProposal` | `rest_proposals` | Une petite racine, dont une seule ouverte par campagne. |
| `gameplay` | choix de repos | `rest_participant_choices` | Un document enfant par participant et proposition. |
| `gameplay` | `LootContainer` | `loot_containers` | Une racine révisée par source récupérable, génération et bail de fouille. |
| `gameplay` | contenu de butin | `loot_entries` | Un document enfant par exemplaire ou pile, visibilité et provenance. |
| `gameplay` | connaissance de butin | `loot_discoveries` | Un document par personnage, contenant et élément découvert. |
| `gameplay` | `CampaignReserve` | `campaign_reserves` | Une racine et sa révision par campagne. |
| `gameplay` | entrée de réserve | `campaign_reserve_entries` | Un document enfant par exemplaire ou pile et provenance. |
| `gameplay` | `PersistentEffect` | `persistent_effects` | Un document par effet et cible durable. |
| `kernel` | reçu d'idempotence | `command_receipts` | Un document par clé de commande et principal. |
| `kernel` | exécution groupée | `bulk_command_runs` | Une petite racine par action groupée. |
| `kernel` | cible groupée | `bulk_command_items` | Un résultat idempotent par cible de l'action groupée. |
| `game-history` | audit fonctionnel | `functional_audit_entries` | Une entrée append-only par fait accepté ou refus utile. |
| `game-history` | trace de calcul | `calculation_traces` | Une racine immuable par résolution persistée. |
| `game-history` | étape de calcul | `calculation_trace_steps` | Un document immuable par cible ou étape explicable. |
| `kernel` | fait à diffuser | `outbox_messages` | Un document par fait interne et politique d'audience. |
| `kernel/security` | événement de sécurité | `security_events` | Une entrée technique minimisée et expirante par événement pertinent. |

`game-history` est une capacité de support, pas un nouveau contexte qui décide des
actions. Le module métier indiqué dans chaque entrée reste propriétaire de sa
sémantique ; `game-history` possède seulement le stockage append-only et les lectures
autorisées. `kernel` possède les mécanismes transactionnels communs, jamais les règles
métier contenues dans un reçu ou un fait d'outbox.

## Contenu des snapshots et versions

### Campagnes

`Campaign` porte identité, propriétaire, réglages et révision. Les adhésions vivent dans
`campaign_memberships` pour ne jamais faire croître un tableau de campagne. Les
transitions qui garantissent exactement un propriétaire et au moins un MJ vérifient la
racine et les adhésions concernées dans la même transaction.

`CampaignInvitation` reste séparée : son cycle, ses tentatives de notification et sa
cadence ne doivent pas verrouiller la campagne. Un `CampaignOwnershipVote` est créé
uniquement pour une succession liée à une purge ; sa racine et ses bulletins restent
privés à la campagne jusqu'au résultat.

### Amitiés

Chaque relation stocke `participantLowId` et `participantHighId`, obtenus par tri
canonique des deux identifiants. Un index unique sur cette paire garantit qu'une
demande inverse ne crée jamais un second document.

Le snapshot porte l'état de relation et, lorsqu'elle est en attente, les intentions de
demande par direction. La première acceptation valide passe la relation à `ACCEPTED`
et ferme toutes les intentions encore ouvertes dans la même écriture. L'audit conserve
les auteurs ; aucune collection de demandes concurrentes n'est nécessaire.

### Dossier, changement et build

`CharacterDossier` porte l'identité, l'attribution, l'état de revue, les pointeurs vers
la version active, la version examinée et l'unique `BuildChange` ouvert, ainsi que sa
révision. Il ne contient ni l'état d'aventure ni l'inventaire.

`BuildChange` porte notamment :

- le personnage et la campagne ;
- l'intention `INITIAL_CREATION`, `LEVEL_UP` ou `RESPECIALIZATION` ;
- la version active de base, absente pour une création initiale ;
- l'état du workflow, son indicateur ouvert et ses auteurs effectifs ;
- le brouillon courant, le niveau cible et la dernière version soumise ;
- les décisions de revue utiles au workflow courant.

Un index unique partiel sur le personnage lorsque le changement est ouvert impose la
non-coexistence. Les états terminaux restent consultables mais ne prennent plus
l'emplacement. Une montée n'est considérée finalisée que lorsque le nouveau build est
actif et le changement verrouillé dans la même transaction.

L'ouverture et la fermeture modifient aussi le pointeur du `CharacterDossier` et sa
révision. L'index unique protège la contrainte en base ; le pointeur permet de vérifier
la version de dossier lue et interdit qu'une activation concurrente crée un changement
sur une ancienne version active.

L'abandon d'une respécialisation ferme le changement avec `ABANDONED`, efface le
pointeur ouvert du dossier et incrémente les deux révisions dans la même transaction.
Il ne supprime aucune version et ne modifie aucun pointeur de build actif.

`BuildVersion` conserve la séquence complète des niveaux, les choix, les valeurs de
base, les versions de profils et de release, les dérivés acceptés et les références de
trace. Une correction après refus crée une autre version ; aucune version examinée
n'est réécrite.

### État d'aventure et inventaire

`CharacterAdventureState` cite la `BuildVersion` active qui fixe ses maxima. Une
activation de build met à jour ce lien et transforme l'état dans la même transaction.

`CharacterInventory` est la racine de concurrence. Les exemplaires et piles vivent
dans `character_inventory_entries` afin d'éviter un tableau BSON non borné. Chaque
mutation vérifie et incrémente la révision de la racine ; un enfant n'est jamais
modifié par un repository autonome. Une entrée référence une version immuable d'objet,
sa provenance, son conteneur éventuel, son port, ses charges, son identification et ses
secrets autorisés.

### Releases et profils de contenu

`RulesetRelease` est un manifeste immuable qui référence les versions de profils de
règles, d'objets et de créatures admises. Sa racine contient identité, version et hash ;
chaque référence vit dans `ruleset_release_entries` afin que le nombre de profils ne
fasse pas croître un document unique. Un profil reste dans la collection de son module
propriétaire ; la release ne copie pas son contenu intégral.

`ItemDefinition` et `CreatureProfile` portent l'identité stable, la portée, l'archive
et les pointeurs éditoriaux. Le contenu mécanique est exclusivement dans leurs
versions immuables. Une archive ne supprime aucune version ni aucun exemplaire.

### Jeu

`CampaignPlayState` porte l'activité bloquante courante, le temps fictionnel et la
release active pour les nouvelles validations.

Une préparation est une racine révisée ; participants, obstacles, zones, pièges et
sources de butin sont des enfants. Chaque participant référence explicitement les
versions de profils sélectionnées.

Le lancement crée la racine `Combat`, copie les seules données de scène propres à cette
instance et fige les références vers builds, profils de créatures, objets, règles et
paramètres. `combat_participant_states` conserve position, ressources de tour, état
vital des créatures non joueuses et autres variables de reprise. Pour un personnage,
les conséquences durables sont écrites simultanément dans `CharacterAdventureState` ;
le document de combat ne remplace jamais cet agrégat.

Chaque interaction acceptée :

1. vérifie la révision de la racine `Combat` et des agrégats durables lus ;
2. met à jour le snapshot courant minimal et les enfants touchés ;
3. insère une `combat_interactions` immuable avec révisions avant/après, intention,
   jets, delta structuré, références de calcul et audience ;
4. persiste reçu, audit et outbox dans la même transaction.

Le snapshot courant permet une reprise rapide ; les interactions fournissent
l'historique complet demandé sans recopier à chaque étape les profils qui ne bougent
pas. Elles ne constituent pas un event sourcing général : le snapshot reste la source
d'autorité courante et aucun autre agrégat n'est reconstruit depuis ce journal.

Le résultat complet d'un `LootContainer`, y compris les éléments cachés et les jets,
est persisté lors de sa première ouverture autorisée dans `loot_entries`. Les
connaissances par investigateur sont dans `loot_discoveries` ; aucune réouverture ne
relance une table.

Le contenant porte un bail de fouille exclusif avec détenteur, personnage, acquisition,
dernière activité, échéance et jeton opaque. L'acquisition filtre sur une absence de
bail valide et sur la révision attendue. Le bail est renouvelé par activité et libéré à
la fermeture ; son expiration permet la reprise après déconnexion. Il ne réserve aucun
objet et n'est jamais implémenté par une transaction MongoDB maintenue ouverte.

`CampaignReserve` suit le même modèle racine-enfants que l'inventaire. Chaque entrée
conserve combat, contenant, source et version d'objet ou dénomination monétaire.

`PersistentEffect` référence sa source versionnée, sa cible qualifiée, son audience,
son échéance en temps de jeu et les causes explicites de suspension ou de fin.

Après fermeture complète du butin, la transaction finale marque le combat
`cleanupPending` après avoir transféré tous les reliquats et conséquences durables. Un
nettoyage relançable supprime ensuite `combat_interactions`, les états de participants
et de scène, les calculs exclusivement nécessaires à la reprise, les audits propres aux
étapes et les contenants clos. La racine `Combat` devient un résumé terminal minimal
avec références de provenance ; aucune donnée de reprise détaillée ne subsiste.

## TD-5B-002 — références versionnées plutôt que copies vivantes

### Problème

Une référence vers la définition courante rendrait un ancien combat ou exemplaire
dépendant d'une errata ultérieure. Copier toutes les données partout créerait plusieurs
sources de vérité.

### Options considérées

1. Référencer uniquement l'identité mutable et toujours lire sa version courante.
2. Copier chaque profil complet dans tous les agrégats consommateurs.
3. Référencer une version immuable et embarquer seulement le minimum de reprise.

### Choix

L'option 3 est retenue. Les références historiques pointent vers des identifiants de
versions immuables. Les snapshots de combat embarquent uniquement les valeurs de scène
qui évoluent pendant le combat et les paramètres nécessaires à une reprise directe.
Chaque interaction conserve un delta de ces variables et référence les mêmes versions
figées ; elle ne recopie ni build complet, ni profil de créature, ni définition d'objet.

### Conséquences et risques

- Une errata n'altère aucun historique.
- Les lectures composées peuvent nécessiter plusieurs chargements explicites.
- Les versions référencées doivent être conservées et sauvegardées avec les agrégats.
- Une version absente constitue une corruption bloquante ; aucun fallback vers la
  version courante n'est autorisé.
- La fermeture du butin supprime l'historique opérationnel détaillé du combat ; les
  versions restent conservées seulement si un autre agrégat durable les référence.

### Arbitrage propre aux sauvegardes de combat

**Options.** (1) copier une fiche et un profil complets à chaque interaction ; (2) ne
garder que le snapshot courant ; (3) figer les versions, conserver un snapshot courant
minimal et une transition immuable par interaction jusqu'à la clôture du butin.

**Choix.** L'option 3 est retenue. L'option 1 gaspille espace et bande passante ;
l'option 2 reprend le combat mais ne fournit pas l'historique complet demandé.

**Conséquences et risques.** Une interaction écrit davantage de petits documents mais
ne duplique pas les mécaniques immuables. Le nettoyage terminal doit être idempotent :
s'il échoue, le combat reste terminé et reprenable par l'opérateur, jamais rouvert aux
joueurs. La suppression n'est autorisée qu'après transfert durable du butin.

## TD-5B-003 — concurrence optimiste explicite

### Problème

Deux commandes peuvent lire le même état puis tenter des mutations incompatibles. Sans
condition explicite sur la version lue, la dernière écriture peut masquer la première.

### Options considérées

1. Verrouiller les agrégats en mémoire dans l'unique instance serveur.
2. Employer implicitement `__v` et les comportements par défaut de Mongoose.
3. Porter une révision métier explicite sur chaque racine mutable.

### Choix

L'option 3 est retenue. Une écriture filtre simultanément par identifiant, portée de
campagne et révision attendue, puis incrémente la révision dans la transaction. Le
nombre de documents racines effectivement modifiés doit correspondre au plan de
transition ; sinon toute la transaction échoue.

Pour les agrégats racine-enfants, la révision de la racine sérialise les changements de
ses enfants. Une version immuable est insérée une seule fois et n'est jamais mise à
jour.

Le butin ajoute un bail fonctionnel, pas un verrou de base de données longue durée. Une
commande atomique acquiert le bail seulement si aucun bail valide n'existe à la
révision attendue. Un concurrent reçoit le détenteur autorisé à être affiché et
l'échéance ; il ne patiente pas dans une transaction. Toute prise vérifie encore le
jeton du bail, la révision du contenant et celle de l'inventaire destination.

Pour la fouille, les options étaient : (1) laisser tous les joueurs entrer et arbitrer
seulement chaque prise ; (2) maintenir une transaction ou un verrou MongoDB pendant
l'ouverture de l'interface ; (3) employer un bail persistant expirant. L'option 3 est
retenue. Elle traduit l'exclusion voulue sans bloquer une connexion de base ni laisser
un verrou éternel après déconnexion. Son risque principal est une reprise légèrement
retardée jusqu'à l'expiration ; la durée exacte reste un choix de contrat temps réel.

### Conséquences et risques

- Deux prises de butin, corrections ou actions concurrentes ne s'écrasent pas.
- Un conflit ne fusionne aucun tableau et ne relance aucun dé.
- Les commandes multi-agrégats vérifient toutes les révisions lues.
- La contention peut augmenter sur un combat, un inventaire ou une réserve très actifs ;
  le pilote privilégie la cohérence et mesurera avant tout découpage supplémentaire.

## TD-5B-004 — enveloppe de commande partagée

### Problème

Une mutation peut être commise puis rediffusée deux fois, ou être diffusée sans audit
ni résultat de hasard durable si ces écritures sont indépendantes.

### Options considérées

1. Laisser chaque module persister séparément état, audit et notifications.
2. Utiliser des collections techniques communes hors transaction.
3. Persister racines, reçu, audit, traces et outbox dans la même transaction.

### Choix

L'option 3, déjà imposée par DEC-015, est détaillée ainsi.

#### Reçu d'idempotence

Un reçu contient au minimum le principal effectif, la clé fournie, le module et le type
d'intention, un hash canonique de cette intention, son état, le résultat autoritaire ou
sa référence, les références d'agrégats, les résultats de hasard et les dates utiles.

L'unicité porte sur le couple principal-clé. La même clé et le même hash relisent le
résultat ; la même clé avec un autre hash produit un conflit. Les refus d'authentification
ou d'autorisation ne sont pas des faits fonctionnels et restent dans le journal de
sécurité séparé.

#### Audit fonctionnel

Une entrée append-only conserve module, campagne lorsqu'elle existe, commande, acteur, rôle effectif,
action, agrégats, révisions avant/après, motifs, sources, causalité et audiences. Elle
enregistre un changement structuré ou des références de versions, pas une copie
indifférenciée de tous les secrets.

Une correction référence l'entrée compensée. L'entrée d'origine n'est jamais modifiée.
Les refus de règle et conflits utiles aux MJ sont distingués des mutations acceptées
afin d'appliquer une rétention différente.

La purge définitive constitue l'unique exception à l'immuabilité d'auteur : une entrée
partagée nécessaire à une campagne conservée remplace toute identité, adresse ou
principal du compte par le marqueur non corrélable `ERASED_ACTOR`. Les entrées qui ne
concernent que le compte ou une campagne elle-même purgée sont supprimées.

#### Traces de calcul

Une trace est isolée dans `calculation_traces` et référencée par l'audit et le reçu. Sa
racine porte versions d'entrée, résultat et politique d'audience ; ses contributions
ou cibles vivent dans `calculation_trace_steps` pour éviter un document volumineux.
L'ensemble est immuable, mais n'est ni une projection publique ni une source de
reconstruction.

#### Outbox

Un message d'outbox contient un identifiant unique, le module propriétaire, la
campagne seulement lorsque le fait lui appartient, la causalité, les agrégats et
révisions concernés, le fait interne, son canal, sa politique d'audience, sa
disponibilité et ses métadonnées de livraison. Il ne contient pas un
payload universel réunissant les secrets de toutes les audiences.

Le périmètre métier et l'audience sont deux dimensions distinctes. Une invitation peut
appartenir à une campagne tout en visant un utilisateur qui n'en est pas encore membre.
Une amitié ne porte aucun `campaignId`. Le vocabulaire d'audience est fermé dans le
kernel backend ; le détail du contrat et de sa résolution est fixé par la phase 5D.

Après commit, un diffuseur revendique le message par un bail atomique, construit les
projections autorisées puis marque les livraisons. Une livraison est au moins une fois ;
ses consommateurs doivent donc employer l'identité stable du message.

#### Journal de sécurité

`security_events` est distinct de l'audit fonctionnel. Il reçoit seulement les faits
utiles à la détection et à l'enquête : catégorie, résultat, instant, identifiant de
corrélation, principal éventuel, ressource qualifiée, adresse réseau pseudonymisée par
HMAC et famille de client. Mot de passe, jeton, corps de requête, fiche, secret de
campagne et payload métier sont interdits.

L'accès appartient au responsable de plateforme par un parcours opérationnel séparé ;
aucun rôle de campagne ne peut lire cette collection. Les événements sont append-only,
conservés **12 mois**, puis supprimés par TTL. Une purge définitive de compte les
supprime immédiatement lorsqu'ils restent rattachables à ce compte.

Le stockage MongoDB, son volume et ses sauvegardes doivent être chiffrés au repos, et
les connexions protégées en transit. Les clés restent hors du repository et de la base,
avec rotation annuelle ou immédiate après incident. Le chiffrement applicatif champ par
champ est écarté au MVP : la minimisation, le hashage des justificatifs et le contrôle
d'accès répondent au risque sans rendre les index et rotations disproportionnés.

Les options étaient : (1) mêler sécurité et audit fonctionnel sans expiration ; (2) ne
garder aucun journal ; (3) isoler un journal minimisé à rétention bornée. L'option 3 est
retenue. Elle permet l'enquête sans exposer le contenu des campagnes ni conserver
indéfiniment des données réseau. Le risque restant est qu'un incident découvert après
douze mois dispose de moins de traces ; cette durée devra être réévaluée si une
obligation réglementaire ou une menace mesurée l'exige.

### Conséquences et risques

- Un commit ne peut perdre ni son résultat, ni son audit, ni son fait à diffuser.
- Une panne après commit retarde la diffusion mais n'annule pas l'état.
- Les collections communes exigent des index par module, campagne et date pour éviter
  qu'un module ne parcoure les données d'un autre.
- Le contenu exact des commandes, résultats transportés et événements reste hors de
  cette phase.

## Frontières transactionnelles

Toute ligne ci-dessous inclut le reçu, l'audit accepté, les traces éventuelles et
l'outbox. Une lecture de version immuable n'implique pas sa réécriture.

| Opération fonctionnelle | Racines ou documents écrits dans une transaction | Coordinateur logique |
|---|---|---|
| inscription et vérification | compte, jeton concerné et notification | `auth`, en appelant `user` |
| demande de purge | manifeste de purge, gel du compte et notification de confirmation | `user`, avec capacité opérationnelle |
| demande ou acceptation d'amitié | unique `Friendship` de la paire canonique | `friendship` |
| invitation de campagne | `CampaignInvitation` et outbox de courriel | `campaigns` |
| acceptation d'invitation | `CampaignInvitation` et `Campaign` | `campaigns` |
| transfert de propriété puis départ | `Campaign` | `campaigns` |
| vote de succession | vote, bulletin unique et, au résultat, campagne et adhésion du successeur | `campaigns` |
| promotion d'un joueur en MJ | `Campaign` et `CharacterDossier` désassigné | orchestration en aval de `campaigns` par `characters` |
| attribution ou réattribution | dossiers concernés et contrôle de l'adhésion `Campaign` | `characters` |
| soumission ou revue initiale | `CharacterDossier`, `BuildChange`, nouvelle `BuildVersion` | `characters` |
| déverrouillage de niveau ou respécialisation | `CharacterDossier` avec pointeur ouvert et révision, puis insertion du seul `BuildChange` ouvert | `characters` |
| déverrouillage groupé | `BulkCommandRun`, puis une transaction indépendante par `BulkCommandItem` et personnage éligible | `characters` |
| finalisation d'un niveau | `BuildChange`, nouvelle `BuildVersion`, `CharacterDossier`, `CharacterAdventureState` | `characters` |
| acceptation d'une respécialisation | `BuildChange`, `BuildVersion`, `CharacterDossier`, `CharacterAdventureState` | `characters` |
| abandon d'une respécialisation | `BuildChange` fermé et pointeur ouvert du `CharacterDossier` retiré | `characters` |
| transfert d'une possession | deux racines `CharacterInventory` et leurs entrées | `characters` |
| nouvelle version d'objet | `ItemDefinition` et `ItemDefinitionVersion` | `items` |
| migration mécanique choisie | définition/version et inventaires, réserves ou contenants explicitement sélectionnés | contexte le plus en aval des exemplaires |
| lancement d'un combat | `CampaignPlayState`, préparation, racine `Combat`, états enfants et références participantes figées | `gameplay` |
| résolution d'une interaction | `Combat`, enfants touchés, `CombatInteraction` et états, inventaires ou effets durablement touchés | `gameplay` |
| ajout d'un renfort | `Combat` et éventuels effets ou états créés | `gameplay` |
| création ou réponse de repos | `RestProposal` et, si nécessaire, `CampaignPlayState` | `gameplay` |
| validation d'un repos | `RestProposal`, `CampaignPlayState`, états, inventaires et effets de tous les participants | `gameplay` |
| première ouverture d'un butin | `LootContainer` avec génération et connaissances initiales | `gameplay` |
| acquisition ou libération du bail de fouille | `LootContainer` à révision attendue | `gameplay` |
| prise ou attribution de butin | `LootContainer` ou `CampaignReserve`, inventaire destination et entrées concernées | `gameplay` |
| fermeture du butin | `Combat` marqué `cleanupPending`, contenants, réserve, entrées et `CampaignPlayState` | `gameplay` |
| nettoyage d'un combat terminal | suppression relançable des enfants de reprise, puis résumé `Combat` marqué nettoyé | `gameplay` |
| correction MJ | toutes les racines dont les invariants ou conséquences sont touchés | contexte propriétaire de l'intention, ou `gameplay` si multi-module |
| purge définitive | lots atomiques guidés par manifeste, après succession ; jamais une transaction globale | `user` avec chaque module propriétaire |

Une opération métier qui doit être indivisible n'est jamais découpée pour contourner
une limite MongoDB. Une action groupée explicitement tolérante aux échecs, un nettoyage
terminal ou une purge administrative utilise au contraire un manifeste et des lots
idempotents : chaque cible est atomique, mais la série n'est pas présentée comme un
commit unique.

### Risques transactionnels

- MongoDB doit être déployé dans une topologie acceptant les transactions. DEC-015 a
  validé le principe ; le déploiement détaillé reste une phase d'infrastructure.
- Les opérations réellement indivisibles doivent rester courtes ; une transaction dure
  moins d'une minute par défaut et peut être annulée sous pression de cache.
- La base cible n'assure aucune compatibilité descendante avec l'ancien code ou les
  collections reliques.

## Contraintes d'unicité et index

Les index uniques complètent les invariants du domaine ; ils ne remplacent ni les
contrôles d'autorisation ni les révisions.

| Collection | Contrainte ou index cible | But |
|---|---|---|
| toutes les collections | `_id` natif unique | identité métier stable sans index redondant |
| `users` | `email` unique, `displayName` unique ; `deletedAt` | conserver les contraintes et filtrer les comptes supprimés |
| `refresh_tokens` | `tokenHash` unique ; `userId`, `familyId`, `expiresAt` | rotation, révocation et TTL |
| `email_verification_tokens` | `tokenHash` unique ; `userId`, `expiresAt` | recherche et TTL |
| `account_erasure_requests` | `{ userId, status }` unique lorsque ouverte ; `{ status, updatedAt }` | une purge active et reprise du manifeste |
| `data_erasure_proofs` | `procedureId` unique ; `completedAt` | preuve sans identifiant de compte |
| `friendships` | `{ participantLowId, participantHighId }` unique ; `{ participantLowId, status }`, `{ participantHighId, status }` | une relation par paire non ordonnée et recherches des deux côtés |
| `campaigns` | `ownerUserId`, `deletedAt` | propriété et exclusion des campagnes supprimées |
| `campaign_memberships` | `{ campaignId, userId }` unique ; `{ userId, status }`, `{ campaignId, role, status }` | une adhésion par paire et contrôle des rôles actifs |
| `campaign_invitations` | `{ campaignId, targetUserId }` unique lorsque ouverte | un seul cycle actif pour la même cible |
| `campaign_ownership_votes` | `{ campaignId }` unique lorsque ouvert ; `{ campaignId, status }` | une succession active par campagne |
| `campaign_ownership_ballots` | `{ voteId, voterUserId }` unique ; `{ voteId, candidateUserId }` | un bulletin par électeur et dépouillement |
| `character_dossiers` | `{ campaignId, assignedTo }` unique lorsque `assignedTo` est une chaîne | au plus un personnage par joueur dans une campagne |
| `character_dossiers` | `{ campaignId, reviewState }`, `{ campaignId, activeBuildVersionId }` | vivier et revue |
| `character_build_changes` | `{ characterId }` unique lorsque `open: true` | exclusion création/progression/respécialisation |
| `character_build_changes` | `{ campaignId, kind, status, updatedAt }` | listes de travail autorisées |
| `character_build_versions` | `{ characterId, ordinal }` unique ; `contentHash` non unique | ordre historique sans dédupliquer deux décisions |
| `character_adventure_states` | `characterId` unique ; `{ campaignId, deathState }` | un état par personnage |
| `character_inventories` | `characterId` unique | une racine par personnage |
| `character_inventory_entries` | `instanceId` unique ; `{ inventoryId, containerInstanceId }` | exemplaires et contenu |
| `ruleset_releases` | `{ releaseKey, version }` unique ; `contentHash` | adressage immuable |
| `ruleset_release_entries` | `{ releaseId, profileType, stableKey }` unique ; `{ releaseId, versionRef }` | manifeste extensible sans tableau BSON |
| `rule_profile_versions` | `{ profileType, stableKey, version }` unique | version de règle déterministe |
| `item_definitions` | `{ scopeKey, stableKey }` unique | aucune collision officielle/campagne |
| `item_definition_versions` | `{ definitionId, version }` unique | versions mécaniques |
| `creature_profiles` | `{ scopeKey, stableKey }` unique | identité et portée explicites |
| `creature_profile_versions` | `{ profileId, version }` unique | versions mécaniques |
| `campaign_play_states` | `campaignId` unique | un état de jeu par campagne |
| `encounter_preparations` | `{ campaignId, updatedAt }` | liste privée des préparations |
| `encounter_participants` | `{ preparationId, participantKey }` unique ; `sourceVersionId` | une instance préparée et sa version |
| `encounter_features` | `{ preparationId, featureKey }` unique ; `{ preparationId, kind }` | éléments de scène paginables |
| `combats` | `{ campaignId }` unique lorsque l'activité est bloquante | défense contre deux combats actifs |
| `combat_participant_states` | `{ combatId, participantId }` unique ; `{ combatId, initiativeOrder }` | état courant et ordre sans tableau croissant |
| `combat_scene_states` | `{ combatId, sceneElementId }` unique ; `{ combatId, kind }` | état courant de scène |
| `combat_interactions` | `{ combatId, sequence }` unique ; `{ combatId, occurredAt }` | une transition ordonnée par interaction |
| `rest_proposals` | `{ campaignId }` unique lorsque ouverte | une proposition active |
| `rest_participant_choices` | `{ restProposalId, characterId }` unique | un choix courant par participant |
| `loot_containers` | `{ combatId, sourceKey }` unique ; `{ campaignId, status }`, `leaseExpiresAt` | une génération et un bail par source |
| `loot_entries` | `{ containerId, entryId }` unique ; `{ containerId, status }` | contenu paginable et prise atomique |
| `loot_discoveries` | `{ containerId, characterId, entryId }` unique | connaissance privée sans doublon |
| `campaign_reserves` | `campaignId` unique | une réserve par campagne |
| `campaign_reserve_entries` | `{ reserveId, sourceCombatId }` ; `instanceId` unique | consultation et transfert |
| `persistent_effects` | `{ campaignId, targetType, targetId, status }`, `{ status, dueAt }` | effets actifs et échéances |
| `command_receipts` | `{ principalKey, idempotencyKey }` unique ; `{ campaignId, createdAt }` lorsque la campagne existe ; `{ ownerModule, createdAt }` | déduplication et support |
| `bulk_command_runs` | `{ principalKey, idempotencyKey }` unique ; `{ campaignId, status }` | reprise d'une action groupée par cible |
| `bulk_command_items` | `{ runId, targetId }` unique ; `{ runId, status }` | un résultat stable par cible sans tableau croissant |
| `functional_audit_entries` | `{ campaignId, occurredAt, id }` lorsque la campagne existe ; `{ ownerModule, occurredAt, id }`, références d'agrégat, `commandReceiptId` | chronologie durable |
| `calculation_traces` | `commandReceiptId`, `{ campaignId, createdAt }` | explication autorisée |
| `calculation_trace_steps` | `{ traceId, sequence }` unique ; `{ traceId, targetId }` | détail paginable et ordonné |
| `outbox_messages` | `{ status, availableAt, leaseUntil }`, `{ ownerModule, aggregateId, createdAt }` | publication et diagnostic |
| `security_events` | `{ occurredAt: 1 }` TTL 12 mois ; `{ category, occurredAt }`, `correlationId` | enquête bornée et purge automatique |

`scopeKey` vaut une portée non ambiguë telle que l'officiel ou une campagne précise ;
elle évite qu'une valeur nulle participe à une unicité de manière implicite. La forme
exacte de cette clé interne n'est pas un contrat public.

Une acceptation d'amitié filtre sur la paire canonique et la révision attendue. La
première acceptation ferme les deux directions éventuelles ; une seconde commande relit
la même relation `ACCEPTED` et ne crée aucun doublon.

### Arbitrage de l'unicité d'amitié

**Options.** (1) un document par demande dirigée puis une amitié séparée ; (2) deux
relations possibles selon l'ordre des utilisateurs ; (3) une seule relation par paire
canonique portant les intentions dirigées.

**Choix.** L'option 3 est retenue avec l'index unique
`{ participantLowId, participantHighId }`.

**Conséquences et risques.** Deux demandes simultanées convergent sur le même agrégat ;
la première acceptation clôt l'autre sans doublon. Toutes les recherches doivent
interroger les deux colonnes participantes, d'où deux index de lecture. La purge de
l'un des comptes supprime physiquement la relation entière.

## TD-5B-005 — politiques de rétention

### Problème

Un TTL trop court peut permettre le rejeu d'une ancienne commande ou supprimer la
preuve d'une décision. Une conservation illimitée augmente le volume et les données
personnelles détenues.

### Options considérées

1. Appliquer un TTL uniforme à toutes les données historiques.
2. Tout conserver sans distinction.
3. Distinguer autorité durable, diagnostic temporaire et données reconstructibles.

### Choix

L'option 3 est retenue : les données métier durables et l'histoire fonctionnelle hors
étapes de combat sont conservées et supprimées logiquement. Les artefacts techniques
éphémères expirent ; les données de reprise d'un combat sont supprimées par sa clôture
métier, jamais par une durée arbitraire.

| Catégorie | Politique cible |
|---|---|
| snapshots métier actifs, terminaux ou supprimés | aucun TTL ; soft delete uniquement |
| versions immuables | aucun TTL, qu'elles soient actives, abandonnées ou archivées |
| reçus de commandes acceptées | aucun TTL ; la garantie d'idempotence ne possède pas de date d'expiration implicite |
| reçus de conflits ou refus sans mutation | aucun TTL |
| audit des mutations et arbitrages acceptés | aucun TTL automatique |
| audit des conflits et refus de règle utiles | aucun TTL automatique |
| traces de calcul fonctionnelles | aucun TTL automatique |
| interactions et états détaillés d'un combat ouvert | conservation jusqu'à fermeture complète du butin |
| interactions, états, audits d'étape et calculs de reprise d'un combat terminal | suppression par nettoyage métier relançable, sans TTL |
| outbox non livrée ou en échec | aucune expiration automatique |
| outbox entièrement livrée | suppression 30 jours après dernier acquittement interne |
| jetons d'authentification et de vérification | TTL à leur expiration fonctionnelle |
| événements de sécurité | TTL 12 mois, sauf purge immédiate du compte rattaché |
| preuves de purge non identifiantes | aucun TTL automatique |
| projections persistées reconstructibles | suppression libre puis reconstruction |
| données d'un compte ou d'une campagne sous purge définitive | suppression physique par manifeste validé |

La purge d'un jeton expiré, d'une outbox déjà livrée ou d'une projection reconstruite
ne supprime aucune donnée métier : le fait autoritaire, son reçu et son audit durable
restent conservés. Ces artefacts techniques ne sont pas le dossier de l'utilisateur ou
de la campagne.

Les documents à TTL portent un `expiresAt` seulement lorsqu'ils sont réellement
éphémères. Aucun TTL ne s'applique à une donnée métier, à un audit fonctionnel ou à un
champ nul supposé signifier « pour toujours ».

Un TTL MongoDB est un nettoyage asynchrone de fond sur un index de date à champ unique :
il ne garantit pas une suppression à la seconde exacte et ne coordonne aucune cascade.
Il convient donc aux jetons, événements de sécurité et outbox livrées, mais pas à la
clôture d'un combat ni à une purge de compte, qui exigent un processus métier vérifié.

### Conséquences et risques

- Une ancienne commande acceptée ne peut redevenir exécutable par simple expiration.
- L'audit fonctionnel, y compris les refus, reste disponible.
- Le volume durable croît avec l'activité ; il doit être mesuré et sauvegardé.
- La suppression ordinaire d'un compte ou d'une campagne change sa disponibilité, pas
  son existence physique.
- Une purge définitive ne peut être déclenchée ni par maintenance automatique, ni par
  expiration, ni par une suppression de campagne ordinaire ; elle remplace néanmoins
  ces politiques pour tout document inclus dans son manifeste.
- Les détails de combat volumineux disparaissent après le butin, conformément à leur
  cycle métier, sans faire disparaître les conséquences durables.

## TD-5B-006 — initialisation propre sans compatibilité avec les reliquats

### Problème

Convertir les collections actuelles obligerait la cible à interpréter des documents
qui ne représentent ni les agrégats ni les invariants validés. Cette compatibilité
ajouterait du code temporaire, des états `LEGACY` et des arbitrages sans valeur produit.

### Options considérées

1. Convertir en place `characters`, `items`, `monsters` et les autres collections.
2. Maintenir des lecteurs et doubles écritures compatibles avec les deux modèles.
3. Initialiser une base cible vide et n'y charger que les données conformes aux
   spécifications validées.

### Choix

L'option 3 est retenue. L'état actuel de MongoDB est un reliquat jetable, pas une donnée
à migrer. La cible ne contient ni import historique, ni release synthétique, ni champ
de compatibilité, ni fallback vers une collection ancienne.

### Séquence obligatoire future

1. Créer une base ou un namespace cible distinct sur une topologie compatible avec les
   transactions.
2. Créer explicitement collections, validateurs de schéma et index de la cible ; aucun
   nom ne dépend de la pluralisation Mongoose.
3. Charger les releases et profils officiels depuis les datasets normatifs qualifiés
   par B01 à B09, avec leurs versions et hashes.
4. Vérifier l'absence de références orphelines, doublons, documents hors budget et
   index manquants sur cette base neuve.
5. Créer les données fonctionnelles du pilote par les nouveaux parcours uniquement ;
   aucun compte, campagne, personnage, objet ou monstre n'est copié depuis l'ancienne
   base.
6. Basculer l'application vers la base cible et exécuter les tests d'acceptation.
7. Détruire la base relique après confirmation opérateur ; elle n'est jamais conservée
   comme source de secours ou de lecture métier.

### Compatibilité future des schémas cibles

L'absence de compatibilité avec les reliquats n'enlève pas le versionnement futur :

- les writers écrivent seulement le dernier `schemaVersion` ;
- une évolution compatible possède un upcaster de lecture explicitement testé ;
- une transformation destructive crée de nouveaux documents ou une migration dédiée ;
- le hash sémantique d'une version immuable ne change jamais à cause d'une enveloppe
  technique ;
- aucune version inconnue n'est devinée ou lue partiellement.

### Conséquences et risques

- Le modèle et le code futurs restent plus simples et conformes aux spécifications.
- Les données actuelles sont volontairement perdues ; elles ne doivent contenir aucune
  information à conserver avant la destruction opérateur.
- Il n'existe aucun rollback vers l'ancien code après création de données cibles ; le
  retour arrière consiste à restaurer une sauvegarde de la nouvelle base.
- Les scripts futurs d'initialisation des données normatives sont distincts des seeds
  de démonstration, mais leur conception reste hors de cette phase documentaire.

## TD-5B-007 — aucune projection persistée obligatoire pour le pilote

### Problème

La fiche et les vues de combat composent plusieurs agrégats. Une projection persistée
accélère la lecture mais peut devenir obsolète ou conserver des secrets après un
changement de rôle.

### Options considérées

1. Lire directement une projection persistée comme source de vérité.
2. Ne créer aucune projection, quelles que soient les mesures.
3. Composer les lectures autorisées au départ et n'ajouter que des read models
   reconstructibles lorsque des mesures le justifient.

### Choix

L'option 3 est retenue. Aucune projection persistée n'est requise pour le pilote. Les
premières lectures composent les snapshots propriétaires et appliquent les projecteurs
de sécurité de Phase 5A.

Des collections telles que `character_sheet_views`, `campaign_roster_views` ou
`combat_audience_views` pourront être ajoutées sans changer les commandes si une mesure
le justifie. Elles devront alors porter :

- l'audience ou le destinataire exact ;
- les révisions sources et la version du projecteur ;
- une date de reconstruction ;
- aucun champ interdit à cette audience ;
- une clé permettant suppression et reconstruction complètes.

Aucune commande ne lit une projection pour décider d'une permission, d'un coût, d'une
conséquence ou d'une révision. Un changement de rôle ou d'attribution invalide les
projections concernées ; la lecture autoritaire vérifie encore les droits courants.

### Conséquences et risques

- La cible initiale évite une seconde vérité et réduit le risque de fuite persistante.
- Les lectures composées peuvent coûter plus de requêtes ; ce coût doit être mesuré.
- Une projection future est alimentée après commit par l'outbox et accepte une
  cohérence éventuelle explicitement visible par ses révisions sources.

## Décisions encore requises avant les phases concernées

Les sujets suivants restent volontairement non résolus :

1. règles fonctionnelles du vote de succession d'une campagne ;
2. stockage, formats et limites des portraits et images d'objets ;
3. déploiement MongoDB, sauvegarde, restauration et observabilité ;
4. contrats Zod, HTTP, Socket.IO, durée du bail de fouille et stratégie de reconnexion.

Ces décisions ne changent pas le découpage des collections proposé, mais certaines
peuvent ajouter des champs, index ou politiques de purge. Elles doivent être résolues
avant leur implémentation respective.

## Validation enregistrée

Le propriétaire a validé le 21 août 2026 :

1. la séparation snapshots, racines et versions immuables ;
2. la propriété de chaque collection ;
3. les références inter-agrégats et la concurrence optimiste ;
4. les collections communes de reçu, audit, trace et outbox ;
5. les frontières transactionnelles ;
6. les index, la rétention et l'initialisation sur base propre ;
7. l'absence de projection persistée obligatoire pour le pilote.

Il a également validé l'abandon d'une respécialisation par le joueur assigné ou tout MJ
actif et le soft delete ordinaire des comptes et campagnes. Hors purge explicite et
nettoyage des données de reprise d'un combat terminal, aucune donnée métier durable
n'est supprimée automatiquement. Les décisions encore requises ci-dessus n'empêchent
pas la validation du modèle 5B ; elles précèdent les contrats ou processus concernés.

Le 21 août 2026, il a précisé que la base actuelle est entièrement jetable, validé la
purge complète sur demande explicite, la succession par vote, l'unicité canonique des
amitiés, le bail exclusif de fouille, les sauvegardes par interaction de combat puis
leur suppression après clôture du butin, ainsi que la politique de journal de sécurité.
