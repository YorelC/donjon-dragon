# Exigences fonctionnelles cibles

## Statut du document

Ce document consolide les comportements validés pendant les phases de compréhension,
d'analyse des écarts et de spécification fonctionnelle. Il décrit la **cible produit** :
il ne prétend pas que le code actuel implémente déjà ces exigences.

Les écarts avec l'existant sont recensés dans [GAP-ANALYSIS.md](GAP-ANALYSIS.md).

## Principes transverses

- Le système de règles initial est exclusivement D&D 5e 2024, sur le périmètre des
  trois livres de base 2024 fournis par le propriétaire du produit.
- La création, la progression et le combat doivent respecter toutes les règles de ce
  périmètre, y compris leurs exceptions de classe, don, sort, capacité ou effet.
- Les distances sont calculées et affichées en mètres, jamais en pieds.
- L'interface ne donne pas de cours de règles : elle doit être autosuffisante.
- Les actions disponibles sont immédiatement visibles. Une action impossible est
  masquée ou désactivée avec une raison courte et contextuelle.
- Le détail d'un calcul est consultable sans ralentir l'action principale.
- Le serveur est la source d'autorité pour les règles, permissions et jets ayant une
  conséquence sur la partie.
- Le mode distanciel sur ordinateur est prioritaire. Les modes présentiel et hybride
  sur téléphone appartiennent à une évolution ultérieure.

## SF-001 — Campagnes, rôles et permissions

### Objectif

Permettre à plusieurs utilisateurs de participer à une campagne sans exposer les
données privées ni confondre propriété, maîtrise du jeu et contrôle d'un personnage.

### Acteurs

- utilisateur de la plateforme ;
- joueur d'une campagne ;
- maître du jeu (MJ) ou co-MJ ;
- propriétaire de la campagne ;
- administrateur de la plateforme.

### Règles métier

1. Les rôles joueur et MJ sont propres à chaque campagne.
2. Le créateur d'une campagne en devient le propriétaire et le premier MJ.
3. Une campagne possède exactement un propriétaire actif et au moins un MJ actif.
4. Une campagne peut posséder plusieurs co-MJ.
5. Le propriétaire peut nommer un joueur MJ ou faire repasser un co-MJ joueur.
6. Le propriétaire est une responsabilité distincte du rôle actif : il peut jouer,
   mais la campagne doit conserver au moins un MJ.
7. Un propriétaire qui quitte volontairement doit d'abord transférer la propriété à
   un MJ actif ; transfert et départ forment une opération indivisible. La purge
   définitive d'un compte suit le vote de succession décrit plus bas.
8. Un utilisateur non invité ne peut ni découvrir ni consulter une campagne.
9. Toutes les autorisations sont vérifiées côté serveur et toutes les ressources
   chargées doivent appartenir à la campagne présente dans la requête.

### Personnages et attribution

- Un joueur possède au maximum un personnage assigné dans une campagne.
- Un MJ peut créer plusieurs personnages et les attribuer aux joueurs actifs de la
  même campagne.
- Un joueur ne peut pas céder directement son personnage ; seul un MJ peut modifier
  une attribution.
- Lorsqu'un joueur devient MJ, son personnage est automatiquement désassigné et reste
  disponible dans le vivier de la campagne.
- Lorsqu'un MJ redevient joueur, ses privilèges sont retirés immédiatement. Il entre
  dans l'état transitoire « joueur sans personnage » et doit choisir un personnage
  disponible ou en créer un avant d'accéder au reste de la campagne.
- Seul un MJ peut supprimer définitivement un personnage. Lorsqu'une suppression
  ferait perdre un historique utile, l'archivage est privilégié.

### Visibilité

- Un joueur consulte la fiche complète et le détail de construction de son seul
  personnage assigné.
- Il ne consulte pas la fiche complète des autres joueurs.
- Tous les MJ consultent toutes les fiches de la campagne.
- En combat, les participants peuvent voir pour un allié : nom, portrait, classe,
  niveau, PV actuels et PV maximaux.
- L'administrateur de plateforme n'obtient pas automatiquement accès au contenu des
  campagnes dans le MVP.

### Critères d'acceptation essentiels

- Une ressource d'une campagne A est inaccessible par un membre de la campagne B,
  même si son identifiant est connu.
- Une attribution vers un utilisateur extérieur à la campagne est rejetée.
- Le départ du propriétaire sans transfert valide est rejeté.
- Il est impossible de retirer le dernier MJ actif.
- Les changements de rôle prennent effet immédiatement sur les API déjà ouvertes.
- Deux demandes d'amitié inverses ne produisent jamais deux relations ; la première
  acceptation clôt les deux intentions.
- Une purge de compte désassigne ses personnages dans les campagnes conservées sans les
  supprimer.
- Une campagne possédée sans autre membre est entièrement purgée avec ses personnages.
- Une campagne possédée avec d'autres membres ne perd pas son propriétaire avant un
  résultat de vote valide.

### Suppression et conservation

- La suppression ordinaire d'un compte ou d'une campagne est toujours logique : la
  donnée est marquée supprimée et devient inaccessible aux parcours normaux, sans
  effacer son historique ni rompre ses références.
- Les données métier durables et l'historique fonctionnel hors étapes détaillées d'un
  combat ne sont jamais effacés automatiquement. Les données de reprise d'un combat
  suivent leur clôture métier définie en SF-003 et SF-005.
- Une suppression physique définitive n'est permise qu'après une demande explicite de
  l'utilisateur adressée au responsable de la plateforme.
- Cette responsabilité opérationnelle n'accorde pas automatiquement l'accès au contenu
  des campagnes et ne crée pas un rôle durable dans les jetons d'authentification.
- La purge supprime physiquement le compte, ses justificatifs d'authentification, ses
  sessions, ses médias, ses amitiés et toute donnée qui ne concerne que lui.
- Dans une campagne qu'il ne possède pas, son adhésion est supprimée et son personnage
  est désassigné, mais ce personnage reste dans le vivier disponible aux MJ.
- Dans une campagne qu'il possède et qui conserve d'autres membres, la propriété est
  transférée à un membre actif désigné par un vote avant la purge. Le nouveau
  propriétaire devient MJ si cela est nécessaire pour préserver au moins un MJ actif.
- Si aucun autre membre actif ne reste dans une campagne possédée, la campagne et
  toutes ses données propres, notamment personnages, contenus personnalisés, combats,
  butins et historiques, sont définitivement supprimées.
- Les faits partagés nécessaires à une campagne conservée ne gardent aucun lien vers
  le compte effacé : l'auteur devient un acteur anonyme irréversible. Aucun registre
  ne permet de retrouver l'identité supprimée.
- Les sauvegardes contenant les données purgées sont détruites après création et
  vérification d'une sauvegarde post-purge ; elles ne peuvent pas réintroduire le
  compte lors d'une restauration.
- La demande exige une session authentifiée, une confirmation par l'adresse vérifiée
  et une validation manuelle du responsable de plateforme. La preuve finale ne
  conserve qu'un identifiant de procédure, sa date, son résultat et des compteurs non
  identifiants.

> **DÉCISION REQUISE — vote de succession.** Il reste à fixer les électeurs, les
> candidats admissibles, le quorum, la règle de majorité, le traitement des égalités
> et l'issue d'un vote sans résultat. La purge ne peut pas retirer le propriétaire
> tant que ce vote n'a pas produit un successeur valide.

### Amitiés

- Une paire non ordonnée d'utilisateurs ne possède qu'une seule relation d'amitié.
- Deux demandes envoyées en sens inverse restent rattachées à cette même relation.
- La première acceptation valide rend les deux utilisateurs amis et clôt toute demande
  inverse encore ouverte ; aucune seconde amitié ni demande résiduelle n'est créée.

## SF-002 — Création, validation et évolution d'un personnage

### Objectif

Permettre de créer n'importe quel personnage de niveau 1 valide dans D&D 5e 2024,
puis de le faire évoluer sans masquer les implications des choix du joueur.

### Création de niveau 1

La création couvre au minimum :

- nom ;
- alignement ;
- espèce et lignée lorsque les règles l'exigent ;
- catégorie de taille lorsque l'espèce laisse un choix ;
- classe ;
- historique ;
- deux langues standards, en plus du commun et des langues accordées par les règles ;
- méthode de caractéristiques, valeurs de base et bonus ;
- compétences, maîtrises et choix ;
- dons et capacités qui demandent une sélection ;
- équipement ;
- sorts connus ou préparés ;
- âge, taille et poids, tous obligatoires ;
- description physique, facultative ;
- portrait téléversé, facultatif.

Le détail normatif de ces choix, catalogues, quotas et dérivés est inventorié dans
[`B01-LEVEL-ONE-CREATION.md`](rules/dnd-2024/B01-LEVEL-ONE-CREATION.md), pointé sur le
*Player's Handbook 2024*. Une création de niveau 1 commence à 0 PX avec un bonus de
maîtrise de +2. Les décisions produit documentées ci-dessous prévalent lorsqu'elles
dérogent explicitement au livre.

L'alignement est obligatoire. Après validation par le MJ, il ne peut plus être
modifié.

L'âge est un entier positif. Le système n'impose pas automatiquement de longévité
maximale par espèce ; le MJ contrôle la cohérence. La taille physique est exprimée en
centimètres et le poids en kilogrammes. La catégorie de taille D&D est une donnée
distincte, limitée aux options autorisées par l'espèce.

Le joueur peut sélectionner une babiole facultative et gratuite parmi les cent entrées
du *Player's Handbook 2024*. Sa sélection ajoute la babiole au personnage sans modifier
l'or de départ. Aucun magasin, catalogue ni autre achat d'équipement n'est proposé
pendant la création.

Sans portrait téléversé, l'application emploie un portrait générique : fond blanc et
silhouette de tête grise. Le même portrait est utilisé sur la fiche et en combat.

Toutes les combinaisons valides de classes et d'espèces doivent être possibles. Les
choix invalides sont empêchés et leur indisponibilité est brièvement justifiée.

### Validation

La revue d'une fiche distingue `BROUILLON`, `SOUMISE`, `REFUSÉE` et `ACCEPTÉE`, sans
confondre cet état avec l'attribution du personnage ou son état d'aventure. La
soumission fige une version à examiner ; elle ne peut plus être modifiée silencieusement
pendant la revue.

1. Le joueur soumet sa fiche au MJ.
2. La fiche reste inutilisable en combat tant qu'elle n'est pas acceptée.
3. Tout MJ actif de la campagne peut accepter ou refuser seul une fiche.
4. Un refus comporte un motif visible du créateur.
5. Le créateur corrige la fiche refusée puis la resoumet. La nouvelle soumission
   remplace la version à examiner ; le dernier motif et l'historique des décisions de
   validation restent conservés.
6. Une fiche créée directement par un MJ peut être validée immédiatement, y compris
   par son créateur.
7. Il n'existe pas de période de modification libre jusqu'au premier combat : la
   validation du MJ engage le joueur sur ses choix.
8. Aucune sauvegarde automatique de brouillon supplémentaire n'est exigée ; le
   processus actuel de création complète est acceptable.

### Modifications après validation

Sont immuables :

- nom ;
- alignement ;
- espèce, lignée ou héritage ;
- historique ;
- taille ou catégorie de taille.

Restent modifiables :

- portrait ;
- description physique ;
- âge ;
- poids.

### Respécialisation

La classe et les caractéristiques peuvent changer uniquement par une
respécialisation complète :

1. un MJ actif déverrouille la respécialisation d'un personnage accepté et assigné ;
   ce déverrouillage est refusé tant qu'un niveau est en attente ou commencé ;
2. seul le joueur assigné reconstruit et soumet le candidat ;
3. la reconstruction recommence au niveau total 1 et rejoue exactement tous les
   niveaux jusqu'au niveau total actuel, qui est conservé ;
4. classe initiale, ordre des classes, sous-classes, dons, sorts, améliorations et choix
   de progression peuvent changer ; le multiclassage est permis ;
5. la méthode et les six valeurs de caractéristiques de base d'origine sont conservées
   et réassignables ; bonus et améliorations sont rejoués, sans nouveau tirage ;
6. nom, alignement, espèce, lignée ou héritage, historique, taille physique et catégorie
   de taille restent immuables ;
7. le MJ peut déverrouiller dans tout état de jeu si aucun niveau n'est en attente ou
   commencé, mais le joueur ne peut commencer, reprendre ou soumettre pendant
   `EN_COURS`, `EN_PAUSE` ou `BUTIN` ; le candidat ne peut alors être accepté ni
   activé ;
8. l'ancienne fiche acceptée reste active pendant la reconstruction et la revue ; un
   refus motivé laisse le candidat corrigeable et resoumissible ;
9. un MJ actif peut accepter seul le candidat ; son activation et la transformation
   d'état forment une seule opération fonctionnelle ;
10. aucun équipement ni or de départ n'est rejoué ; objets, monnaie, port, conteneurs
    et harmonisations sont conservés ;
11. toutes les maîtrises sont recalculées : une arme ou armure conservée peut devenir
    non maîtrisée, avec toutes les conséquences prévues par les règles ;
12. conditions, épuisement, PV temporaires, inspiration, concentration et état relatif
    à la mort sont conservés ;
13. les anciens dés de vie, emplacements et ressources de classe disparaissent ; les
    pools du nouveau build commencent pleins ;
14. les PV actuels deviennent `min(anciens PV actuels, nouveaux PV maximaux)` : une
    hausse du maximum ne soigne pas le personnage.

Une respécialisation déverrouillée, en reconstruction, soumise ou refusée interdit le
déverrouillage d'un niveau. Elle doit être acceptée, activée et verrouillée avant que
le MJ puisse déverrouiller le niveau suivant. Elle peut aussi être abandonnée :
l'ancien build actif, l'état d'aventure et l'inventaire restent inchangés, le candidat
n'est jamais activé et le workflow fermé ne bloque plus un niveau. L'abandon est
audité et ne supprime ni le candidat ni ses versions. Le joueur assigné et tout MJ
actif peuvent l'abandonner.

Le détail normatif et les transformations avant/après sont inventoriés dans
[`B03-MULTICLASSING-AND-RESPECIALIZATION.md`](rules/dnd-2024/B03-MULTICLASSING-AND-RESPECIALIZATION.md).

### Progression

Le détail normatif des niveaux 2 à 20, des douze classes, de leurs sous-classes, des
dons, des sorts et des traits progressifs est inventorié dans
[`B02-LEVELS-TWO-TO-TWENTY.md`](rules/dnd-2024/B02-LEVELS-TWO-TO-TWENTY.md). B02 couvre
la progression dans la classe courante. L'ajout d'une nouvelle classe, ses prérequis,
maîtrises, cumuls et emplacements sont inventoriés dans la
[`matrice B03`](rules/dnd-2024/B03-MULTICLASSING-AND-RESPECIALIZATION.md).

- L'expérience n'est pas gérée.
- Un MJ actif de la campagne déverrouille explicitement le niveau suivant d'un
  personnage accepté et assigné à un joueur, à condition qu'aucune respécialisation
  ne soit déverrouillée pour ce personnage.
- L'action groupée cible automatiquement tous les personnages acceptés et assignés aux
  joueurs de la campagne. Chaque personnage éligible reçoit exactement un niveau en
  attente ; un niveau 20 ou un niveau déjà en attente est signalé sans bloquer les
  autres.
- L'action individuelle reste disponible pour un personnage précis.
- Un déverrouillage porte uniquement sur le niveau suivant, ne se cumule pas et ne
  dépasse jamais le niveau 20.
- Seul le joueur assigné complète et finalise la progression ; aucun second accord du
  MJ n'est requis.
- Le MJ peut déverrouiller dans tout état de jeu si aucune respécialisation n'est
  ouverte. Le joueur ne peut ni commencer ni finaliser pendant `EN_COURS`, `EN_PAUSE`
  ou `BUTIN` ; il le peut hors combat et pendant la préparation du combat.
- Le MJ peut révoquer un niveau en attente uniquement avant le premier choix ou jet de
  PV persisté. Une progression commencée ne peut plus être révoquée.
- La montée de niveau n'entraîne ni soin, ni repos, ni récupération implicite d'une
  ressource dépensée.
- Le niveau total est la somme des niveaux de classe et pilote le bonus de maîtrise et
  les effets qui le citent ; chaque capacité de classe emploie son niveau de classe.
- Entrer dans une nouvelle classe exige 13 dans ses caractéristiques principales et
  celles de toutes les classes déjà présentes. Le Guerrier accepte Force ou Dextérité ;
  le Moine, le Paladin et le Rôdeur exigent leurs deux caractéristiques.
- La classe initiale accorde tous ses traits de départ. Une classe ajoutée accorde
  seulement son profil multiclassé et ses capacités de niveau 1, jamais son équipement,
  son or ou ses maîtrises de sauvegarde initiales.
- Les formules alternatives de CA et les capacités Attaque supplémentaire ne se
  cumulent pas. Les sorts sont préparés séparément par classe et conservent leur source.
- Le niveau effectif d'emplacements arrondit séparément chaque classe fractionnaire :
  `ceil(Paladin/2) + ceil(Rôdeur/2) + floor(Chevalier occulte/3) +
  floor(Arnaqueur arcanique/3)`, en plus des niveaux complets. Magie de pacte reste un
  pool séparé mais interopérable pour lancer les sorts préparés.

### Sorts préparés

Un personnage ne peut modifier ses sorts préparés qu'après un repos long achevé et
tant qu'aucun combat n'a commencé depuis ce repos. Plusieurs modifications sont
possibles dans cette fenêtre. Les exceptions explicites des classes, dons et autres
règles prévalent. Montée de niveau et respécialisation suivent leurs propres règles.

La différence nette de la liste dans cette fenêtre respecte le *Player's Handbook
2024* : Clerc, Druide et Magicien peuvent remplacer tout leur quota ; Paladin et
Rôdeur un seul sort. Les sauvegardes successives de l'interface ne réinitialisent pas
ce quota. Barde, Ensorceleur et Occultiste changent au plus un sort au gain de niveau,
sauf exception explicite.

Le catalogue, la préparation, le lancement et les exceptions des 391 sorts sont
inventoriés dans
[`B06-SPELLS-AND-MAGICAL-EFFECTS.md`](rules/dnd-2024/B06-SPELLS-AND-MAGICAL-EFFECTS.md).

### État d'aventure

Le détail normatif des valeurs courantes, de leur provenance et de leur cycle de vie est
inventorié dans
[`B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md`](rules/dnd-2024/B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md).

La fiche persistée porte notamment :

- PV actuels, maximaux et temporaires ;
- dés de vie ;
- emplacements de sorts utilisés ;
- ressources de classe et capacités ;
- inspiration ;
- conditions, épuisement et concentration ;
- inventaire, équipement porté, monnaie et harmonisation ;
- état relatif à la mort.

Le serveur calcule les valeurs dérivées et peut exposer leurs sources. Toute correction
manuelle d'un MJ conserve l'ancienne valeur, la nouvelle, l'auteur, la date et le motif.

Les pièces de cuivre, d'argent, d'électrum, d'or et de platine sont conservées dans
leurs dénominations respectives, sans conversion automatique. Une valeur totale peut
être dérivée ; convertir des pièces reste une action explicite.

Tout MJ actif peut corriger l'état à tout moment, y compris pendant un combat, avec un
motif obligatoire. La correction respecte les invariants, ne supprime aucun événement
et applique automatiquement les mêmes transitions que toute autre mutation. Corriger
l'intention et ses conséquences dépendantes forme une seule opération fonctionnelle.

### Équipement, possessions et objets magiques

Le catalogue, les exemplaires, le port, les armes, armures, outils, consommables et
objets magiques sont inventoriés dans
[`B07-EQUIPMENT-ITEMS-AND-PROFICIENCIES.md`](rules/dnd-2024/B07-EQUIPMENT-ITEMS-AND-PROFICIENCIES.md).

- Une définition officielle ou personnalisée et chaque exemplaire détenu sont
  distincts ; l'exemplaire conserve sa version, sa provenance, son emplacement et son
  état mutable.
- Le poids emploie `1 lb = 0,5 kg` en conservant la valeur PHB source. La capacité de
  port est désactivée par défaut et configurable par campagne ; active, elle avertit
  puis bloque un dépassement sans altérer un état déjà excédentaire.
- La variante de taille d'équipement et son coût ne sont pas automatisés au MVP ; le
  MJ les arbitre par correction auditée.
- Le joueur assigné peut organiser, équiper, utiliser et déposer ses possessions. Un
  transfert à un autre personnage actif exige le consentement de son joueur assigné.
- Le MVP ne comporte ni boutique ni workflow de commerce, fabrication, service,
  monture ou véhicule. Le MJ arbitre acquisitions et dépenses ; les conséquences
  déterministes d'un objet effectivement détenu restent automatisées.
- La maîtrise d'une arme ajoute le bonus de maîtrise au jet d'attaque. Une botte
  d'arme est un déverrouillage distinct pour un type d'arme ; elle se greffe à une
  attaque selon son déclencheur et ne constitue pas une Action autonome.
- Les objets magiques respectent catégorie, rareté, identification, harmonisation,
  charges, prochaine aube, malédiction, résilience, activation, artefacts, conscience
  et chaque profil individuel du catalogue A–Z du DMG.
- Apparence, propriétés découvertes, compteur autorisé, malédiction et texte MJ sont
  des projections distinctes ; aucune réponse ou diffusion ne révèle un secret.

### Critères d'acceptation essentiels

- Chaque combinaison valide de niveau 1 des trois livres de base peut être soumise.
- Une fiche sans alignement, âge, taille physique ou poids ne peut pas être soumise.
- Après validation, l'alignement ne peut plus être modifié.
- Une fiche non validée ne peut pas participer à un combat.
- Un changement d'âge ne déverrouille pas les champs immuables.
- Une respécialisation conserve l'inventaire mais recalcule les maîtrises.
- Un niveau déverrouillé et une respécialisation déverrouillée ne coexistent jamais :
  chacun interdit le déverrouillage de l'autre jusqu'à sa fermeture valide.
- Un déverrouillage groupé accorde un niveau en attente à chaque personnage joueur
  éligible sans exiger d'action individuelle du MJ.
- Un autre joueur ou un MJ ne peut pas finaliser la progression à la place du joueur
  assigné.
- Une progression ne peut être commencée ou finalisée pendant `EN_COURS`, `EN_PAUSE`
  ou `BUTIN`, et un niveau commencé ne peut plus être révoqué.
- Une montée de niveau ne modifie pas implicitement les PV actuels ni les ressources
  dépensées, sauf règle explicite du choix de niveau.
- Un transfert refusé, expiré ou non consenti ne déplace aucun objet et ne révèle aucun
  contenu privé.

## SF-003 — Préparation, lancement et reprise d'un combat

### Objectif

Permettre au MJ de préparer à l'avance un affrontement, de le lancer rapidement et de
le reprendre exactement après une fermeture de navigateur ou un redémarrage serveur.

Le cycle, l'autorité, la persistance, l'initiative, les renforts et les critères
détaillés sont inventoriés dans la
[`matrice B05`](rules/dnd-2024/B05-COMMON-COMBAT-ENGINE.md).
Le catalogue, les profils, instances, contrôleurs, PNJ, invocations et budgets de
rencontre sont inventoriés dans la
[`matrice B08`](rules/dnd-2024/B08-MONSTERS-NPCS-AND-SUMMONED-CREATURES.md) et son
[`registre de profils`](rules/dnd-2024/B08-CREATURE-PROFILE-REGISTRY.md).

### Cycle de vie

`PRÉPARATION → EN_COURS ↔ EN_PAUSE → BUTIN → TERMINÉ`

- Une campagne peut conserver plusieurs combats en préparation.
- Elle ne peut posséder qu'un combat en cours ou en phase de butin à la fois.
- Un combat terminé ne redémarre pas ; le MJ peut le dupliquer en nouvelle préparation.
- Le MJ décide explicitement de la fin du combat puis, séparément, de la fermeture du
  butin. La défaite apparente de tous les adversaires ne clôt pas automatiquement le
  combat.

### Préparation

Seuls les MJ voient et modifient une préparation. Ils définissent :

- nom du combat ;
- dimensions de la carte en mètres, par préréglage ou valeurs personnalisées ;
- participants et camps ;
- créatures du bestiaire ou personnages complets ;
- positions initiales ;
- obstacles ;
- créatures, pièges et zones cachés ;
- tables et objets de butin.

La carte est une surface blanche en vue du dessus, sans fond obligatoire. Elle utilise
un positionnement continu sur un plan horizontal.

Les personnages proposés sont par défaut les personnages actifs, assignés et validés.
Le MJ peut les exclure. Une préparation valide contient au moins un personnage joueur
et un adversaire. Les monstres utilisent leurs PV moyens par défaut ; le MJ peut
demander un jet serveur propre à chaque instance.

Chaque créature préparée fixe profil et version, paramètres, contrôleur, camp,
attitude, visibilité et ressources propres. Le système calcule le budget et la
difficulté de rencontre selon le DMG, avertit les compositions inhabituelles sans
retirer l'arbitrage du MJ et n'attribue jamais les PX aux personnages. Les profils
incomplets ou absents sont refusés avant lancement.

Un monstre meurt immédiatement à 0 PV par défaut. Le MJ peut marquer une instance à la
préparation pour lui appliquer les règles des personnages. Si une instance non marquée
atteint 0 PV, une courte décision privée permet encore au MJ de choisir cette exception
avant révélation ; sans réponse, la mort immédiate s'applique.

### Lancement et persistance

- Aucun bouton « prêt » des joueurs n'est requis ; le MJ lance le combat.
- Le lancement crée un instantané de l'affrontement, tout en reliant l'état courant des
  personnages aux conséquences persistantes.
- Cet instantané fixe les versions immuables des personnages, PNJ, créatures, objets,
  règles et paramètres sélectionnés à l'instant du lancement. Il ne copie pas à chaque
  interaction les données mécaniques qui ne changent pas.
- Chaque action validée est persistée avant la diffusion de son résultat.
- Chaque interaction acceptée conserve sa transition, ses jets et les variables
  modifiées. Tant que le combat ou sa phase de butin reste ouvert, le snapshot courant
  et ces interactions permettent une reprise exacte et un historique complet.
- Une reconnexion ou un redémarrage serveur restaure exactement l'ordre, le tour,
  positions, PV, ressources, effets, concentration, visibilité et historique utiles.
- La fermeture du navigateur d'un participant ne met pas automatiquement en pause.
- Une pause décidée par le MJ bloque les nouvelles actions mécaniques.

### Arrivées après le lancement

- Une invocation suit les règles de l'effet qui fixe son contrôle, son initiative et
  sa durée.
- Le MJ peut faire entrer un PNJ, une patrouille ou un renfort dans le combat courant.
- Le renfort reçoit une position valide et lance son initiative.
- Il est inséré sans modifier l'ordre relatif des participants existants.
- Si sa place d'initiative est déjà passée, il agit au round suivant.
- L'arrivée et son initiative sont consignées dans l'historique.
- Les vagues entièrement automatisées sont reportées après le MVP.

## SF-004 — Carte, tours et résolution des actions

Le moteur commun de combat, ses règles D&D 2024, ses critères et ses limites avec les
sorts, objets et monstres sont inventoriés dans la
[`matrice B05`](rules/dnd-2024/B05-COMMON-COMBAT-ENGINE.md).
Les options propres aux créatures, leur contrôle et leurs recharges sont détaillés
dans la [`matrice B08`](rules/dnd-2024/B08-MONSTERS-NPCS-AND-SUMMONED-CREATURES.md).

### Carte et déplacement

- Toutes les distances sont affichées en mètres, avec des décimales lorsque nécessaire
  (par exemple `1,5 m`).
- La conversion fonctionnelle vaut `1 pied = 0,3 m`, sans conversion SI intermédiaire.
- Le positionnement est continu, sans grille, et limité à un plan horizontal.
- Un pion peut porter une altitude métrique visible. Les distances combinent leurs
  composantes horizontale et verticale sans introduire de caméra 2,5D ou 3D.
- Chaque client peut déplacer sa caméra, zoomer et recentrer sans déplacer la caméra
  des autres utilisateurs.
- Un outil de mesure libre est accessible aux participants.
- Un pion porte le portrait, le nom, le camp et la taille de la créature.
- Les pions ont une empreinte circulaire. Leur diamètre fonctionnel vaut `0,75 m` pour
  Minuscule, `1,5 m` pour Petite ou Moyenne, `3 m` pour Grande, `4,5 m` pour Très grande
  et au moins `6 m` pour Gigantesque.
- Occupation, adjacence et distances euclidiennes sont calculées depuis les périmètres
  physiques de ces empreintes, jamais depuis leur centre.
- Un joueur déplace son personnage ; le MJ contrôle ses créatures et peut corriger
  n'importe quel pion.
- Avant confirmation, l'interface montre le chemin, sa distance, son coût, le mouvement
  restant, le terrain et les réactions possibles.
- Le système propose le chemin valide le plus court et accepte des points de passage.
- Le serveur revalide le déplacement confirmé.
- Le mouvement peut être fractionné autour des actions, selon les règles.
- Les espaces occupés, terrains et réactions appliquent les règles exactes.
- Une correction de position par le MJ est journalisée.

### Obstacles, visibilité et exceptions magiques

- Les obstacles peuvent bloquer mouvement, visibilité, ligne d'effet ou couverture.
- La couverture gère au minimum : aucune, partielle, trois-quarts et totale.
- Les entités cachées sont filtrées côté serveur, pas seulement masquées dans le client.
- Le MJ peut effectuer une correction explicite de visibilité ou de couverture.
- Le moteur distingue portée, visibilité, ligne d'effet, couverture, chemin parcouru et
  validité de la destination.
- Un sort ou une capacité peut, lorsque sa règle le prévoit, ignorer un obstacle, la
  couverture ou la ligne de vue.
- Une téléportation ne requiert pas de chemin franchissable entre départ et arrivée,
  mais sa destination doit respecter les contraintes propres à l'effet.

### Initiative et ordre des tours

- Le serveur lance et calcule l'initiative, y compris avantage, désavantage et effets.
- Les résultats des personnages joueurs sont publics ; les jets des créatures du MJ
  sont secrets par défaut.
- En cas d'égalité, seules les créatures à égalité relancent un jet de départage.
- Le résultat le plus élevé fixe leur ordre relatif, sans changer leur position globale
  dans l'ordre d'initiative ; une nouvelle égalité provoque un nouveau départage.
- Le combat conserve le round courant, l'acteur actif et les fenêtres de réaction.

### Tour et ressources d'action

Le système suit au minimum : déplacement, action, action bonus, réaction, nombre
d'attaques et ressources supplémentaires créées par les règles.

- Les effets de début et de fin de tour sont résolus au bon moment.
- Le joueur termine explicitement son tour ; l'interface avertit des ressources
  usuelles encore disponibles.
- Il n'existe pas de limite de temps dure pour un tour.
- Le MJ peut terminer de force un tour ou contrôler le personnage d'un joueur
  déconnecté.

### Résolution d'une action

Le parcours nominal est :

1. sélectionner une arme, un sort, une capacité ou une autre action ;
2. sélectionner variante, niveau ou paramètres utiles ;
3. sélectionner les cibles atteignables et visibles selon l'effet ;
4. afficher une prévisualisation ;
5. confirmer ;
6. faire valider, lancer et résoudre par le serveur ;
7. persister le nouvel état ;
8. diffuser le résultat et jouer les animations.

La commande doit être atomique et idempotente afin qu'une retransmission réseau ne
consomme pas deux fois une ressource ou n'applique pas deux fois les dégâts.

### Attaques, sorts et effets

- Une attaque couvre modificateurs, jet d'attaque, classe d'armure, critique,
  dégâts, résistances, immunités, vulnérabilités et états produits.
- Les attaques multiples, propriétés d'armes, maîtrises d'armes et bottes d'armes sont
  prises en charge comme mécanismes distincts.
- Les sorts contrôlent connaissance ou préparation, emplacement ou ressource, niveau
  choisi, temps d'incantation, concentration, ciblage, zones, sauvegardes, effets et
  surclassement.
- Une créature ne maintient qu'une concentration, sauf exception explicite. Remplacer
  une concentration demande confirmation et applique correctement la transition.
- Les dégâts appliquent dans l'ordre requis les PV temporaires, réductions et PV ; les
  soins et conditions suivent leurs règles et durées.
- Les ressources ne sont consommées qu'après validation de l'action. Elles restent
  dépensées lorsqu'une action valide échoue normalement, par exemple une attaque ratée.

Toute conséquence déterministe d'un sort est automatisée. Une clause subjective ou
narrative ouvre, après validation et dépense normales, une résolution privée et auditée
du MJ. En combat, rounds et tours font avancer les durées ; hors combat, le MJ avance
explicitement le temps fictionnel, jamais l'horloge réelle.

Une sacoche à composantes ou un focaliseur autorisé abstrait les composants génériques,
gratuits et non consommés. Un composant tarifé, consommé ou désigné comme objet précis
doit être détenu. Les effets durables sont rattachés dans un registre de campagne à une
créature, un objet ou un lieu nommé, sans exiger une carte mondiale.

### Réactions et interruptions

- Une Réaction optionnelle ouvre une fenêtre de 15 secondes par défaut, configurable
  par campagne entre 5 et 60 secondes. Le MJ peut prolonger ou clore une fenêtre.
- « Réactions désactivées » désactive uniquement le compte à rebours : les Réactions et
  fenêtres subsistent et le MJ les résout manuellement sans expiration automatique.
- L'action déclenchante reste suspendue jusqu'à la réponse, l'expiration ou la décision
  du MJ.
- L'absence de réponse vaut refus.
- Le MJ peut répondre au nom d'une créature ou d'un joueur déconnecté.

### Information présentée

- Les alliés voient les PV actuels et maximaux exacts entre eux.
- Les ennemis affichent sans nombres : `Indemne` au maximum, `Blessé` sous le maximum
  et au-dessus de la moitié, `Sanglant` à la moitié ou moins, puis `À terre` ou `Mort`
  seulement si cet état est visible. Le MJ peut révéler les valeurs exactes.
- Un joueur ne peut annuler une action après révélation du jet ou de ses conséquences.
- Le MJ corrige par une opération compensatoire journalisée, jamais par suppression de
  l'historique.

## SF-005 — Dés, repos, mort et butin

Le détail normatif des parcours de cette section, de leurs permissions et de leur audit
est inventorié dans
[`B09-GAME-SURROUNDING-PRODUCT-RULES.md`](rules/dnd-2024/B09-GAME-SURROUNDING-PRODUCT-RULES.md).
Les états et bénéfices individuels du repos restent définis par B04.

### Jets de dés

- Tout jet ayant une conséquence de partie est produit et enregistré par le serveur.
- Seuls les jets de caractéristiques utilisés pendant la création peuvent rester
  provisoirement non autoritaires côté client.
- Pour un test hors combat, le joueur décrit d'abord son intention ; le MJ décide si
  un test est requis et fixe caractéristique, compétence ou outil et éventuel DD.
- Depuis la fiche, un joueur peut lancer un test de compétence en mode normal, avec
  avantage ou avec désavantage ; le bonus est appliqué automatiquement.
- Un plateau libre permet de combiner d4, d6, d8, d10, d12, d20 et d100.
- Les jets des joueurs sont publics par défaut. Avant le tirage, le joueur peut rendre
  un jet privé entre lui et les MJ.
- Les jets du MJ sont secrets par défaut ; le MJ peut les rendre publics avant le
  tirage. Une règle imposant une audience plus restrictive prévaut toujours.
- L'audience est figée avant le tirage et ne change jamais selon le résultat.
- Animation 3D, son et suspense ne déterminent jamais le résultat : ils représentent
  visuellement un résultat déjà fixé. Fermer l'animation ne relance pas les dés.

### Repos collectif

1. Un MJ propose un repos court ou long hors combat en cours ou en phase de butin.
2. Tous les personnages acceptés, vivants, joués et assignés sont inclus par défaut.
3. Les joueurs indiquent qu'ils sont prêts et effectuent leurs choix. Un MJ peut
   répondre à la place de tout joueur inclus, connecté ou non ; les choix conservent le
   MJ comme auteur effectif dans l'audit.
4. Un joueur déconnecté ne bloque pas indéfiniment le groupe : le MJ peut répondre à sa
   place ou l'exclure explicitement.
5. Le MJ valide finalement le repos ; les effets sont appliqués ensemble et persistés.

Le repos court permet les choix de dés de vie avant application. Le repos long applique
les règles complètes et ouvre la fenêtre de modification des sorts préparés décrite dans
SF-002.

Un repos long interrompu après au moins 1 heure devient une étape de repos court à
finaliser. Les joueurs ou le MJ agissant à leur place effectuent les choix admissibles,
puis le MJ valide ces bénéfices. Une éventuelle reprise du repos long reste une étape
distincte et ajoute l'heure requise par l'interruption.

### Mort

Un personnage mort reste dans la campagne avec son inventaire et son attribution. Il
peut être ressuscité selon les règles ou archivé par un MJ.

### Génération et consultation du butin

- Le FP et la préférence de trésor versionnés du profil sélectionnent les tables
  applicables ; ils n'accordent jamais un objet absent des tables ou de la préparation.
- Les objets que le MJ impose à une créature et ses possessions récupérables sont figés
  avec l'instance au lancement. Ils rejoignent toujours son contenant si la créature
  laisse une source récupérable.
- Tables aléatoires, paramètres, visibilité et mode moyenne ou dés sont préparés sans
  être résolus. À la première ouverture autorisée, le serveur réunit les objets figés
  et résout toutes les sources aléatoires, visibles ou cachées, exactement une fois.
- Le résultat complet est persisté avant projection et ne change pas à la reconnexion,
  à la réouverture ou lors d'une investigation.
- Après la fin du combat, un joueur participant clique sur le portrait d'une créature
  vaincue pour ouvrir son butin, à la manière de Baldur's Gate 3.
- Un seul joueur peut fouiller un même contenant à la fois. Le premier accès validé
  acquiert un verrou fonctionnel temporaire ; les autres joueurs voient qui fouille et
  ne peuvent ni ouvrir ni prendre dans ce contenant tant que le verrou est actif.
- Le verrou est libéré à la fermeture de la fouille ou après une période d'inactivité,
  afin qu'une déconnexion ne bloque pas définitivement le butin. La durée exacte et
  le signal de renouvellement appartiennent aux futurs contrats temps réel.
- Dans la session de fouille autorisée, la récupération partielle d'une pile est
  possible. Toute prise reste validée atomiquement par le serveur.
- Chaque dénomination monétaire forme une pile récupérable partiellement comme un
  objet. Il n'existe ni bourse de groupe, ni partage égal, ni conversion automatique.
- Seuls les joueurs dont le personnage participait au combat peuvent récupérer le
  butin.

### Investigation et objets cachés

- La recherche ciblée d'un butin sur une dépouille utilise Intelligence
  (Investigation). Cette dérogation produit est limitée à ce parcours et ne remplace
  pas les compétences D&D applicables aux recherches génériques.
- Un personnage dispose d'une tentative d'investigation par cadavre, sauf remise à
  zéro explicite par le MJ.
- Le jet et la découverte sont visibles uniquement par l'investigateur et les MJ.
- Un autre personnage peut découvrir indépendamment le même objet.
- Tant qu'il n'a pas réussi, un joueur n'apprend ni le nom de l'objet caché ni le fait
  qu'un autre joueur l'a récupéré.
- Une fois récupéré, l'objet disparaît pour les utilisateurs autorisés à le connaître.

### Clôture du butin

Le MJ ferme explicitement la phase de butin. Tous les objets et toutes les monnaies non
récupérés sont alors transférés dans une réserve de campagne gérée par les MJ, avec leur
provenance : combat, créature et objet ou dénomination. Le butin clos n'est pas rouvert ;
un MJ peut attribuer ultérieurement tout ou partie d'une entrée de réserve à n'importe
quel personnage actif de la campagne.

Lorsque ce transfert est terminé et que le combat passe à `TERMINÉ`, toutes les
sauvegardes détaillées des interactions et tous les états de reprise propres au combat
sont supprimés. Restent seulement les conséquences durables appliquées aux agrégats
propriétaires, la provenance des butins transférés et un résumé terminal non
identifiant le détail de chaque étape.

### Audit fonctionnel

- Toute décision ou mutation acceptée est persistée avant sa diffusion et conserve
  acteur, rôle effectif, date, action, version et conséquences pertinentes.
- Les conflits et refus de règle utiles à l'arbitrage sont consultables par les MJ ;
  ils n'ont pas de TTL hors étapes détaillées d'un combat nettoyées à sa clôture.
- Les refus d'autorisation et traces de sécurité appartiennent à un journal technique
  distinct, minimisé, réservé au responsable de plateforme et conservé douze mois.
- Les secrets sont filtrés côté serveur selon l'audience de l'action ; ils ne sont
  jamais envoyés puis masqués dans le client.

## SF-006 — Invitations, courriels et contenu personnalisé

### Invitations

- Un utilisateur invite un ami de la plateforme dans sa campagne.
- L'invitation dans l'application est la source d'autorité.
- Un courriel est envoyé en complément ; son échec ne supprime pas l'invitation.
- Le lien du courriel ouvre l'application, exige une authentification et demande une
  confirmation avant acceptation.
- Le cycle couvre `EN_ATTENTE`, `ACCEPTÉE`, `REFUSÉE` et `ANNULÉE`.
- Les commandes sont idempotentes.
- Pour le MVP, les courriels transactionnels sont limités à la vérification du compte
  et aux invitations de campagne.

### Objets personnalisés

Un MJ peut créer pour une campagne un objet qui contient au minimum :

- nom et description ;
- catégorie ;
- poids ;
- empilabilité et quantité ;
- valeur et rareté ;
- image facultative avec représentation par défaut ;
- harmonisation éventuelle ;
- charges et récupération éventuelles ;
- effets structurés ;
- texte privé réservé aux MJ ;
- créateur et campagne d'origine.

Les catégories couvrent au moins armes, armures, boucliers, objets généraux, outils,
consommables, contenants, paquets et objets magiques.

- Les effets structurés peuvent être automatisés.
- Un effet non automatisé est clairement marqué comme manuel.
- Aucun objet personnalisé ne peut exécuter du code arbitraire.
- À l'acquisition, l'objet apparaît sous forme de carte.
- Les joueurs ne voient que les objets qu'ils possèdent, ont découverts ou ont reçus.
- Une modification descriptive peut se propager aux exemplaires existants.
- Une modification mécanique crée une nouvelle version ; les anciens exemplaires
  gardent leur version sauf migration explicite du MJ.
- Un objet n'est pas supprimé s'il existe dans un inventaire : il est archivé et reste
  utilisable dans ses exemplaires existants.
- Le MJ peut l'attribuer directement à un personnage ou à la réserve de campagne.

La création personnalisée de monstres, sorts, capacités, classes et espèces, ainsi que
l'import entre campagnes, est postérieure au périmètre d'octobre.

## Fonctionnalités futures déjà identifiées

- journal de bord des personnages ;
- rédaction et import Markdown de campagne ;
- musique de session ;
- vagues automatisées de combat ;
- contrôleur téléphonique pour parties physiques et hybrides ;
- cartes 2,5D ou 3D et animations enrichies ;
- salon audio avec transformation de voix ;
- maître du jeu assisté ou remplacé par IA ;
- mode combat autonome de type roguelike ;
- autres systèmes de jeu de rôle ;
- autres langues ;
- hébergement public, paiement et consommation IA facturée.

Ces éléments ne doivent pas complexifier l'architecture du MVP tant qu'une spécification
et une priorité explicites ne les font pas entrer dans le périmètre actif.
