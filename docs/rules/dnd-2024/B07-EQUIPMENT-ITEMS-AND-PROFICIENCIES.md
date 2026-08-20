# B07 — Équipement, objets, maîtrises et bottes d'armes

## Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 116 règles
communes, les 10 constats d'implémentation et la couverture du catalogue magique A–Z
sont inventoriés. Les décisions `DR-B07-01` à `DR-B07-05` sont résolues. Aucun
passage à la planification ou au code n'est inclus dans cette validation.

Ce document inventorie le bloc B07 défini dans
[`DND-2024-COMPLIANCE-PLAN.md`](../../DND-2024-COMPLIANCE-PLAN.md). Il décrit la cible
et les écarts observés ; il n'autorise aucune implémentation.

Le catalogue général du *Player's Handbook 2024*, les règles communes du *Dungeon
Master's Guide 2024* et son catalogue magique A–Z sont pointés. Les décisions
`DR-B07-01` à `DR-B07-05` ont été validées par le propriétaire le 20 août 2026. Aucun
code, test ou choix de représentation technique n'est inclus dans ce livrable.

## Sources et conventions

### Sources normatives disponibles

- `PHB24` — [`PlayersHandbook2024.pdf`](../../books/PlayersHandbook2024.pdf), source
  primaire locale ; les pages citées sont celles imprimées ;
- `DMG24` — [`DungeonMasterGuide2024.pdf.pdf`](../../books/DungeonMasterGuide2024.pdf.pdf),
  source primaire locale ; les pages citées sont celles imprimées ;
- `SF-002` à `SF-006` dans [`REQUIREMENTS.md`](../../REQUIREMENTS.md) ;
- [`DEC-003`](../../DECISIONS/003-character-lifecycle.md),
  [`DEC-005`](../../DECISIONS/005-dice-rest-and-loot.md),
  [`DEC-006`](../../DECISIONS/006-custom-content-and-infrastructure.md),
  [`DEC-008`](../../DECISIONS/008-level-one-character-details.md),
  [`DEC-009`](../../DECISIONS/009-adventure-state-and-corrections.md),
  [`DEC-010`](../../DECISIONS/010-common-combat-engine.md) et
  [`DEC-011`](../../DECISIONS/011-spells-and-magical-effects.md), ainsi que
  [`DEC-012`](../../DECISIONS/012-equipment-items-and-possessions.md) ;
- les matrices validées [`B01`](B01-LEVEL-ONE-CREATION.md),
  [`B02`](B02-LEVELS-TWO-TO-TWENTY.md),
  [`B03`](B03-MULTICLASSING-AND-RESPECIALIZATION.md),
  [`B04`](B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md),
  [`B05`](B05-COMMON-COMBAT-ENGINE.md) et
  [`B06`](B06-SPELLS-AND-MAGICAL-EFFECTS.md).

### Pointage primaire du bloc

| Domaine | Pages contrôlées |
|---|---|
| Maîtrise, exploration, objets, port et interactions limitées | p. 13–20 |
| Équipement de création, classes, historiques et dons | p. 36, 50–211 |
| Monnaie, vente, armes, autres propriétés et bottes d'armes | p. 213–215 |
| Armures, bouclier, entraînement et taille optionnelle | p. 218–219 |
| Vingt-cinq outils, variantes, actions et fabrication | p. 220–221 |
| Matériel d'aventurier, paquetages et contenants | p. 222–229 |
| Objets magiques, identification, harmonisation et fabrication | p. 232–233 |
| Glossaire : armure, Attaque, objets, charge, armes improvisées et Utilisation | p. 361–377 |
| Catégories, rareté, valeur, attribution et activation magiques | `DMG24` p. 216–218 |
| Charges, prochaine aube, malédictions, résilience et fabrication | `DMG24` p. 218–220 |
| Particularités, artefacts et objets magiques conscients | `DMG24` p. 219–227 |
| Catalogue individuel des objets magiques A–Z | `DMG24` p. 227–325 |
| Tables aléatoires de butin magique | `DMG24` p. 326–331 |

Les pages PHB 213–233 et les entrées pertinentes du glossaire ont été extraites en
entier. Les pages structurantes PHB 213, 215, 219, 220, 222 et 233 ont aussi été
rendues et contrôlées visuellement. Les pages DMG 216–331 ont été extraites et le
chapitre magique rendu puis contrôlé visuellement par planches de contact. Les JSON
locaux restent des constats non normatifs.

### Limites entre blocs

- B01 fixe l'équipement de départ, l'or et la babiole ; B07 définit les objets obtenus
  et leur cycle de vie après la création.
- B02/B03 déterminent les maîtrises acquises ou recalculées et les types d'armes dont
  la botte est déverrouillée ; B07 applique chaque effet à l'objet effectivement utilisé.
- B04 porte l'inventaire, la monnaie et l'harmonisation ; B07 définit les commandes et
  invariants propres aux objets.
- B05 fournit actions, mains, attaques, dégâts, positions et objets de scène ; B07
  paramètre ces mécanismes par équipement.
- B06 fixe composants, focaliseurs et parchemins du point de vue du lancement ; B07
  prouve possession, accessibilité, consommation et état de l'exemplaire.
- B08 fournit profils et contrôle des montures ; B09 orchestre repos, butin et réserve.
- Commerce, services, montures, véhicules et fabrication n'ont aucun workflow MVP ;
  B07 conserve leurs paramètres d'objet et B08/B09 leurs arbitrages manuels utiles.
- Aucun schéma, endpoint, transaction ou protocole temps réel n'est décidé ici.

### État actuel inspecté

- `items.seed.json` contient 159 définitions : 38 armes, 13 armures ou bouclier,
  25 outils, 7 paquetages et 76 autres objets ; le grimoire, extérieur à la table du
  matériel d'aventurier p. 223, explique l'entrée supplémentaire par rapport aux 158
  lignes principales du chapitre 6 ;
- les 38 armes portent catégorie, dégâts, portée, propriétés et une des huit bottes,
  mais le type de munition et les exceptions comme la lance montée ne sont pas
  structurés ;
- les 13 armures/bouclier portent CA, Dextérité, Force, Discrétion et entraînement,
  mais le moteur courant n'exploite que CA et Discrétion ;
- les 25 outils existent, mais caractéristique, actions `Utilisation`, DD, fabrications
  et variantes restent fusionnés dans du texte ; boîte de jeux et instrument de musique
  ne matérialisent pas leurs variantes distinctes ;
- les objets d'aventure et paquetages ont prix, poids, description et parfois contenu,
  mais leurs attaques, sauvegardes, zones, capacités, carburant, usages et contenance ne
  sont pas exécutables ;
- l'inventaire d'un personnage est une liste `{itemKey, quantity}` intégrée au build,
  avec une armure, un booléen bouclier et un entier d'or ;
- possession, exemplaire, version, provenance, mains, emplacement, conteneur, charge,
  état consommé, harmonisation et visibilité privée sont absents ;
- le module `items` sait lire le référentiel et reconnaître une portée de campagne,
  mais n'offre pas le parcours de création/versionnement/archivage de `SF-006` ;
- une définition de campagne peut actuellement masquer silencieusement une définition
  officielle de même clé ; cette collision ne constitue pas un versionnement métier ;
- aucune commande de jeu ne permet d'équiper, ranger, transférer, consommer, activer,
  identifier, harmoniser, fabriquer ou endommager un objet.

Les qualifications sont **Conforme**, **Partiel**, **Manquant**, **Ambigu**, **Dette**,
**Obsolète** et **Contraire à la cible**.

## Matrice — catalogue, identité et provenance

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B07-CAT-001 | PHB24 p. 213–233 ; DMG24 p. 227–325 | Le référentiel couvre les 38 armes, 12 armures, le bouclier, 25 familles d'outils, 82 entrées de matériel/paquetage, le grimoire et chaque entrée ou variante du catalogue magique A–Z, sans identité absente ni ajout présenté comme officiel. | 159 identités PHB présentes ; catalogue DMG absent. **Partiel**. | Système, MJ ; identité et source. | Totaux PHB exacts ; chaque titre et variante DMG possède une identité officielle unique et une page source. | B01 ; B07-MAG. |
| B07-CAT-002 | PHB24 p. 214–215 | Chaque arme conserve catégorie, corps à corps/distance, coût, poids, dégâts, type, portée, munition, autres propriétés, botte et exception propre. | Structure avancée, munition et exceptions incomplètes. **Partiel**. | Système ; profil d'arme. | Chaque cellule de la table et chaque clause associée est restituable et testable. | B05-ATQ, B07-ARM. |
| B07-CAT-003 | PHB24 p. 219 | Chaque armure et le bouclier conservent catégorie, temps de port/retrait, CA, Dextérité, Force, Discrétion, poids, coût et entraînement. | Temps absents ; autres champs présents mais partiellement exploités. **Partiel**. | Système ; profil défensif. | Les 13 profils reproduisent toutes les colonnes et la catégorie exacte. | B07-DEF. |
| B07-CAT-004 | PHB24 p. 220–221 | Chaque outil conserve catégorie, caractéristique, poids, coût, actions `Utilisation` avec DD, fabrications et variantes. | Ces données sont du texte libre. **Partiel / non exécutable**. | Système ; profil d'outil. | Chaque action et objet fabriquable peut être interrogé sans analyser une description. | B07-OUT. |
| B07-CAT-005 | PHB24 p. 221–226 | Les 4 boîtes de jeux, 10 instruments, 5 focaliseurs arcaniques, 3 druidiques, 3 symboles sacrés et 5 munitions sont des choix concrets avec prix, poids et contraintes propres. | Familles génériques seulement. **Manquant**. | Joueur, système ; famille et variante. | Un paquetage générique aboutit à la variante choisie ; prix, poids, maîtrise et usage ne sont jamais perdus. | B01-EQP-003, B06-INC. |
| B07-CAT-006 | PHB24 p. 222–229 | Chaque matériel d'aventurier conserve coût, poids, paramètres, action, cibles, DD, durée, capacité, consommation et fin éventuelle. | Descriptions textuelles sans profil actif. **Partiel / non exécutable**. | Système, MJ ; profil d'objet. | Toute phrase mécanique possède un cas nominal, une borne et un refus testable. | B05/B06. |
| B07-CAT-007 | PHB24 p. 213–233 | Définition de catalogue et exemplaire détenu sont distincts ; l'exemplaire conserve la version exacte de ses règles et son état mutable. | Une clé et une quantité seulement. **Manquant**. | Système ; définition, version et exemplaire. | Modifier le catalogue ne réécrit jamais implicitement l'état ou les règles d'un ancien exemplaire. | SF-006, B04-INV. |
| B07-CAT-008 | SF-006, DEC-006 | Une identité officielle ne peut pas être masquée par une création de campagne de même clé ; provenance et nom affiché ne sont jamais ambigus. | La définition de campagne de même clé l'emporte. **Contraire à la cible de traçabilité**. | MJ, système ; portée et identité. | Officiel et personnalisé restent distinguables ; aucune collision ne change les possessions sans migration. | B07-CUS. |
| B07-CAT-009 | Gouvernance | Chaque correction de donnée ou errata produit une version de référentiel avec source et date ; une donnée manquante bloque seulement l'usage concerné. | Aucun versionnement fonctionnel. **Manquant**. | Système, MJ ; version de définition. | Rejouer un événement historique emploie le profil qui l'a produit ; aucune valeur n'est inventée. | Phase 5 pour stockage. |
| B07-CAT-010 | Principes produit, DEC-012 | Poids, distances, volumes et capacités sont présentés en métrique ; le poids emploie `1 lb = 0,5 kg` tout en conservant la valeur PHB source. | Poids convertis généralement par demi-kilogramme, sans contrat transversal. **Partiel**. | Système, clients ; valeur source et affichée. | Même entrée et même somme sur tous les clients ; aucun arrondi successif ne modifie une limite. | `DR-B07-01` résolue. |

## Matrice — possession, exemplaires et mutations

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B07-INV-001 | B04-INV-001, DEC-003 | L'inventaire actif est indépendant du build et conserve propriétaire, campagne, définition/version, provenance et emplacement courant. | Inventaire intégré au build. **Partiel / couplage obsolète**. | Système ; possession active. | Niveau et respécialisation ne réoctroient, ne perdent ni ne remplacent aucun objet. | B03-RSP-009. |
| B07-INV-002 | SF-006, B04-INV-003 | Une ligne empilable regroupe seulement des exemplaires de même définition/version et de même état mécanique, secret et de conservation. | Toute clé peut porter une quantité. **Partiel / trop permissif**. | Système ; pile et état. | Charges, harmonisation, inscription, poison, propriétaire secret ou usure différents interdisent la fusion. | B07-MAG/CUS. |
| B07-INV-003 | B04-INV-003 | Une quantité est un entier positif ; transfert, dépense ou destruction ne dépasse jamais le détenu et zéro clôt la ligne active. | Positivité validée à l'entrée. **Partiel**. | Système ; avant/après et événement. | Aucune quantité négative ; une commande rejouée ne retire pas deux fois. | DEC-004/009. |
| B07-INV-004 | SF-001/005/006 | Création, paquetage, butin, réserve, attribution MJ, transfert, fabrication, consommation, destruction et correction sont des provenances distinctes et auditables. | Seule l'option de départ est partiellement gardée. **Manquant**. | Joueur, MJ, système ; événement source. | Toute variation se rattache à une commande autorisée et à une version précédente. | B01/B09. |
| B07-INV-005 | SF-001, DEC-009/012 | Le joueur assigné organise, équipe, utilise et dépose ses possessions ; un transfert exige le consentement du joueur assigné au destinataire. Tout MJ actif peut attribuer ou corriger, avec motif pour une correction. | Édition générale de build. **Contraire à la cible**. | Joueurs, MJ ; commande, proposition et consentement. | Un autre joueur, un destinataire inactif et un acteur d'une autre campagne sont refusés sans révéler le contenu ; refus/expiration ne déplace rien. | `DR-B07-05` résolue. |
| B07-INV-006 | PHB24 p. 20, 361, 377 | Prendre, poser, ranger, dégainer, équiper, déséquiper et utiliser sont des actions distinctes dont le coût dépend du contexte et de la règle de l'objet. | Aucun emplacement ni coût d'action. **Manquant**. | Contrôleur, système ; objet, main et économie. | Hors combat l'action reste explicite ; en combat B05 valide l'interaction gratuite, Attaque, Bonus ou Utilisation exacte. | B05-ACT. |
| B07-INV-007 | PHB24 p. 20, B05 | Un objet posé ou lâché quitte l'inventaire porté et devient un objet de scène à une position ; le ramasser effectue l'inverse sans duplication. | Objets de scène absents. **Manquant**. | Contrôleur, MJ ; exemplaire et position. | Reconnexion restitue propriétaire éventuel, position et visibilité ; deux prises concurrentes ont un seul gagnant. | B05/B09. |
| B07-INV-008 | B04-CON-017 | Devenir `Inconscient` fait lâcher chaque objet tenu, sans retirer armure, vêtements, sac ni autre objet porté. | Mains et objets de scène absents. **Manquant**. | Système ; état tenu/porté. | Seules les bonnes mains sont libérées ; les objets apparaissent à la position de la créature. | B04/B05. |
| B07-INV-009 | SF-006 | Consommer ou activer vérifie possession, accessibilité, cible, coût d'action, usages et préconditions avant toute dépense. | Descriptions seulement. **Manquant**. | Contrôleur, système ; exemplaire et commande. | Une précondition invalide ne consomme rien ; un effet valide normalement raté conserve son coût. | B05/B06. |
| B07-INV-010 | DEC-004/009 | Toute mutation d'inventaire est atomique, idempotente, versionnée et persistée avant diffusion. | Aucun moteur de mutation. **Manquant**. | Système ; commande, version et événement. | Rejouer l'identifiant retourne le même résultat ; aucun état intermédiaire visible. | Phase 5 pour concurrence. |
| B07-INV-011 | SF-001/006 | Le joueur assigné et les MJ voient l'inventaire autorisé ; texte privé, malédiction, objet caché et réserve ne sont jamais envoyés aux autres. | Fiche trop largement visible. **Contraire à la cible, critique**. | Système ; projections publique/privée/MJ. | Réponse, événement et reconnexion filtrent les mêmes champs ; une absence ne révèle pas le secret. | B04-INV-013, B09. |
| B07-INV-012 | DEC-009 | Une correction respecte identité, quantité, campagne, emplacement, contenance, harmonisation et dépendances ; elle compense sans effacer. | Correcteur absent. **Manquant**. | MJ, système ; intention et conséquences. | Corriger le propriétaire déplace l'exemplaire une fois et recalcule charge, mains et effets dans la même opération. | B04-COR. |

## Matrice — charge, contenants, mains et port

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B07-POR-001 | PHB24 p. 20, 362–363 ; DEC-012 | Lorsque le réglage de campagne est actif, la capacité de port dépend de Force et taille ; tirer, soulever ou pousser possède sa limite distincte et réduit la vitesse à 1,5 m si la charge dépasse le port. | Poids présents, capacité absente. **Manquant**. | Système, MJ ; taille, Force et poids. | Limites Minuscule à Gigantesque exactes ; changement de taille ou Force requalifie immédiatement. | `DR-B07-01/02` résolues. |
| B07-POR-002 | PHB24 p. 20, DEC-012 | La capacité de port est désactivée par défaut et configurable par campagne. Active, elle avertit avant la limite puis bloque un dépassement ; son activation sur un inventaire déjà trop lourd avertit sans mutation destructrice. | Aucun réglage. **Manquant**. | MJ, système ; réglage et charge. | Désactivée, le poids reste informatif ; active, une mutation exacte à la limite passe et une mutation supérieure échoue sans dépense. | `DR-B07-02` résolue. |
| B07-POR-003 | PHB24 p. 213, B04-INV-005, DEC-012 | Chaque pièce contribue au poids au ratio de cinquante pièces par livre, soit 0,01 kg par pièce, indépendamment de sa dénomination. | Or seul sans poids. **Manquant**. | Système ; cinq quantités. | Une conversion monétaire explicite peut changer le nombre et donc le poids ; la valeur reste correcte. | DEC-009, `DR-B07-01` résolue. |
| B07-POR-004 | PHB24 p. 222–229 | Sac, sacoche, carquois, étui, tonneau, panier, coffre, fiole et autres contenants respectent masse, volume, type et quantité autorisés. | Contenances dans le texte. **Partiel / non exécutable**. | Contrôleur, système ; conteneur et contenu. | Dépasser poids, volume ou type est refusé ; une borne exacte est acceptée. | B07-CAT-006. |
| B07-POR-005 | B04-INV-002 | Un exemplaire possède un seul emplacement : tenu, porté, dans un conteneur, au sol, dans la réserve ou autre lieu autorisé. | Armure et bouclier seuls sont séparés. **Manquant**. | Système ; lien de localisation. | Aucun exemplaire dans deux mains, personnages ou conteneurs à la fois ; cycle de conteneurs refusé. | B07-INV. |
| B07-POR-006 | PHB24 p. 224–228 | Un paquetage est un ensemble commercial qui produit ses composants et le contenant annoncé ; il ne crée pas un poids supplémentaire en plus de ceux-ci. | `pack.contents` structuré et poids nul. **Conforme sur le principe**, mutations absentes. | Système ; paquetage et composants. | Acquisition crée chaque quantité exacte une fois ; paquetage et sac à dos ne sont jamais doublés. | B01-EQP. |
| B07-POR-007 | B04-INV-002 | Déplacer, perdre ou détruire un contenant ne détruit pas silencieusement son contenu ; chaque contenu est déplacé, renversé, rendu inaccessible ou détruit par une règle explicite. | Conteneurs actifs absents. **Manquant**. | Système, MJ ; arbre avant/après. | Aucun objet orphelin ; une correction ou destruction explique chaque nouvel emplacement. | DEC-009. |
| B07-POR-008 | PHB24 p. 361, B06-INC | Chaque main distingue libre, tenue et occupée par un objet à une ou deux mains ; une même main peut accéder au matériel somatique selon B06. | Mains absentes. **Manquant**. | Système ; deux mains et objets. | Arme à deux mains vérifiée à l'attaque ; bouclier tenu et composantes requalifient les actions. | B05/B06. |
| B07-POR-009 | PHB24 p. 361 | Chaque attaque de l'action Attaque permet d'équiper ou déséquiper une arme avant ou après cette attaque ; dégainer, ramasser, rengainer, ranger ou lâcher suivent cette permission. | Aucun état tenu. **Manquant**. | Contrôleur, système ; attaque et transition. | Attaques multiples autorisent une transition par attaque, jamais une transition gratuite étrangère à l'action. | B05-ACT/ATQ. |
| B07-POR-010 | PHB24 p. 219, 233 | Les emplacements portés empêchent une armure ou un bouclier multiple et les conflits de pieds, mains, bras, tête et cape ; un objet en paire exige la paire complète. | Armure/bouclier seulement. **Partiel**. | Système, MJ ; emplacement et paire. | Le bénéfice cesse si une moitié manque ; exception MJ explicite, visible et auditée seulement. | B07-MAG. |

## Matrice — armes, propriétés et bottes

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B07-ARM-001 | PHB24 p. 213–215 | Toute créature peut manier une arme ; seule la maîtrise de l'arme ajoute le bonus de maîtrise au jet d'attaque. | Maîtrises calculées, attaques absentes. **Partiel**. | Système ; arme, source de maîtrise et jet. | Arme non maîtrisée utilisable sans bonus ; aucune maîtrise de catégorie inventée. | B05-ATQ-006. |
| B07-ARM-002 | PHB24 p. 213–215 | `Munitions` exige le bon type, en dépense une par attaque, requiert une main libre pour charger une arme à une main et permet de récupérer après combat la moitié utilisée, arrondie à l'inférieur, en 1 minute. | Type et consommation absents. **Manquant**. | Contrôleur, système ; pile, combat et récupération. | Sans munition refus avant jet ; 5 utilisées en rendent 2 ; le reste est perdu et audité. | B05/B09. |
| B07-ARM-003 | PHB24 p. 213 | `Finesse` laisse choisir Force ou Dextérité pour attaque et dégâts, avec le même choix pour les deux. | Propriété présente, résolution absente. **Partiel**. | Contrôleur ; choix par attaque. | Aucun choix automatique de la meilleure valeur ; incohérence attaque/dégâts refusée. | B05-ATQ-005/DMG. |
| B07-ARM-004 | PHB24 p. 213 | `Lourde` impose Désavantage si Force < 13 en mêlée ou Dextérité < 13 à distance. | Propriété présente, effet absent. **Partiel**. | Système ; type d'arme et score. | Seuil 12/13 exact ; l'annulation Avantage/Désavantage reste celle de B05. | B05-ATQ. |
| B07-ARM-005 | PHB24 p. 213–214 | `Légère` crée une attaque supplémentaire par action Bonus avec une autre arme légère, sans modificateur positif aux dégâts ; `Nick` la déplace dans l'action Attaque, une fois par tour. | Marqueurs présents, effet absent. **Partiel**. | Contrôleur, système ; deux armes et tour. | Même arme refusée ; modificateur négatif conservé ; ni Bonus ni Nick ne duplique l'attaque. | B05-ACT/TOU. |
| B07-ARM-006 | PHB24 p. 214 | `Chargement` limite à une munition par action, action Bonus ou Réaction, quel que soit le nombre d'attaques. | Marqueur présent, effet absent. **Partiel**. | Système ; source d'action. | Attaque supplémentaire de la même action refusée ; une autre action autorisée suit sa propre limite. | B05-ACT. |
| B07-ARM-007 | PHB24 p. 214 | Portée normale/longue inclut ses bornes ; au-delà de la normale le jet a Désavantage, au-delà de la longue l'attaque est impossible. | Portées métriques présentes. **Partiel / non exécuté**. | Système ; distance entre empreintes. | Limites exactes, altitude comprise ; prévisualisation et validation identiques. | B05-ATQ-009, DEC-010. |
| B07-ARM-008 | PHB24 p. 214 | `Allonge` ajoute 1,5 m aux attaques et opportunités ; `Lancer` autorise l'attaque à distance, le dégainé intégré et la caractéristique de mêlée ; `Deux mains` exige deux mains seulement lors de l'attaque. | Marqueurs présents, mains et effets absents. **Partiel**. | Système ; arme, mains et attaque. | Chaque propriété s'applique séparément ; une arme lancée quitte la main et rejoint la scène ou la cible prévue. | B05/B07-POR. |
| B07-ARM-009 | PHB24 p. 214–215 | `Polyvalente` emploie le dé entre parenthèses seulement pour une attaque de mêlée à deux mains ; la lance n'exige pas deux mains lorsqu'elle est montée. | Dé polyvalent présent ; exception de lance non structurée. **Partiel**. | Contrôleur, système ; prise et état monté. | Une main emploie le dé normal ; lancer n'emploie jamais le dé polyvalent ; monté/non monté diverge. | B05/B08. |
| B07-ARM-010 | PHB24 p. 52, 91, 110, 120, 129 et 214, B01/B02 | La maîtrise d'une arme et sa botte sont distinctes. Une botte n'est utilisable que si la capacité Bottes d'arme l'a déverrouillée pour ce type d'arme précis ; posséder ou maîtriser l'arme ne suffit pas. | Botte portée par le profil d'arme, sélection de personnage incomplète. **Partiel**. | Système ; type d'arme, maîtrise et déverrouillage provenant du build. | Une arme maîtrisée ajoute le bonus d'attaque sans rendre sa botte utilisable ; changer un choix de botte requalifie les attaques sans changer l'objet. | B01-CLA-002, B02-MAI. |
| B07-ARM-011 | PHB24 p. 214 | Les huit bottes `Cleave`, `Graze`, `Nick`, `Push`, `Sap`, `Slow`, `Topple` et `Vex` se greffent à l'attaque qui remplit leur déclencheur ; elles ne constituent pas des Actions autonomes. Elles appliquent exactement cible, fréquence, DD, durée et cumul du PHB. | Huit valeurs présentes, aucun effet actif. **Partiel / non exécutable**. | Contrôleur, système ; attaque et état. | Chaque botte passe cas nominal, limite de tour, mauvaise cible et cumul ; aucune ne se déclenche sans déverrouillage ; aucun coût d'action supplémentaire n'est inventé. | B05-ATQ/DMG/TOU. |
| B07-ARM-012 | PHB24 p. 214, 369 | Une arme improvisée n'ajoute pas la maîtrise, inflige `1d4` du type décidé par le MJ et se lance à 6/18 m ; le MJ peut lui donner toutes les règles d'une arme équivalente. | Aucun parcours d'équivalence. **Manquant**. | MJ, système ; objet, type et équivalence. | L'équivalence est choisie avant le jet, auditée et n'altère pas la définition de l'objet. | B05-ATQ-006. |

## Matrice — armures et boucliers

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B07-DEF-001 | PHB24 p. 219 | Armure légère, intermédiaire et lourde calculent la CA par leur formule ; une seule formule de base s'applique, puis les bonus compatibles. | CA calculée pour l'armure portée. **Conforme sur le socle**. | Système ; armure, Dextérité et effets. | Chaque profil donne la valeur exacte et une source lisible ; aucune défense sans armure ne se cumule. | B04-FIC, B05. |
| B07-DEF-002 | PHB24 p. 219 | Sans entraînement léger/intermédiaire/lourd, le porteur a Désavantage à tout test d20 impliquant Force ou Dextérité et ne peut lancer aucun sort. | Entraînement non appliqué. **Manquant**. | Système ; catégorie et maîtrises du build. | Retirer l'armure ou acquérir l'entraînement requalifie immédiatement tests et sorts. | B06-INC-002. |
| B07-DEF-003 | PHB24 p. 219 | Un bouclier n'accorde son +2 CA que si son porteur possède l'entraînement bouclier ; l'absence d'entraînement n'ajoute pas les pénalités d'une armure. | +2 appliqué sans vérifier l'entraînement. **Contraire à la règle**. | Système ; bouclier et entraînement. | Non entraîné : objet tenu mais +0 ; entraîné : +2, sauf exception explicite. | B04/B05. |
| B07-DEF-004 | PHB24 p. 219 | Une armure lourde réduit la vitesse de 3 m si la Force est inférieure au seuil indiqué. | Seuil stocké, non exploité. **Partiel**. | Système ; Force, seuil et vitesse. | Cotte 12/13 et harnois 14/15 divergent exactement ; retirer l'armure restaure la vitesse. | B04-FIC, B05-MOV. |
| B07-DEF-005 | PHB24 p. 219 | Les armures marquées imposent Désavantage aux tests Dextérité (Discrétion), indépendamment de l'entraînement. | Marqueur affiché, résolution des tests absente. **Partiel**. | Système ; armure portée. | La source apparaît dans le détail ; retirer l'armure supprime seulement cette source. | B05-ATQ pour tests d20. |
| B07-DEF-006 | PHB24 p. 219 | Porter/retirer demande 1 minute pour légère, 5/1 pour intermédiaire et 10/5 pour lourde ; le bouclier suit son port effectif. | Temps et chronologie absents. **Manquant**. | Contrôleur, système ; progression et interruption. | Aucun bénéfice avant achèvement ; interruption conserve l'état précédent, sauf règle contraire. | B09 pour temps fictionnel. |
| B07-DEF-007 | PHB24 p. 219 | Une créature porte au plus une armure et manie au plus un bouclier. | Une clé et un booléen imposent ce maximum. **Conforme structurellement**, possession incomplète. | Système ; emplacements. | Armure ou bouclier non possédé refusé ; remplacement ne cumule jamais les CA. | B01-EQP-006, B07-POR. |
| B07-DEF-008 | PHB24 p. 219, DEC-012 | La variante de taille d'équipement et son coût `1d4 × 10 %` ne sont pas automatisés au MVP ; le MJ arbitre et corrige explicitement si elle est utilisée. | Taille d'objet absente. **Conforme au périmètre manuel, correction absente**. | MJ, système ; taille, ajustement et coût. | Aucun port n'est bloqué ni facturé silencieusement ; toute correction indique l'arbitre et le motif. | `DR-B07-03` résolue. |
| B07-DEF-009 | PHB24 p. 229 | Une barding reprend toute armure, coûte quatre fois son prix et pèse deux fois son poids ; la créature et son entraînement restent ceux de B08. | Barding absente. **Manquant**. | MJ, système ; armure source et monture. | Prix/poids dérivés une fois ; l'objet demeure distinct de l'armure humanoïde. | `DR-B07-04`, B08. |
| B07-DEF-010 | SF-006 | Une armure ou un bouclier personnalisé emploie les mêmes invariants et conséquences que le catalogue officiel ; un effet manuel n'autorise pas une CA arbitraire fournie par le client. | Statistiques personnalisées modélisées, création absente. **Partiel**. | MJ, système ; profil versionné. | Seule une définition de campagne autorisée produit la CA ; ancienne version conservée sur exemplaire. | B07-CUS. |

## Matrice — outils, Utilisation et fabrication

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B07-OUT-001 | PHB24 p. 220 | Utiliser un outil emploie la caractéristique de son profil ; la maîtrise ajoute le bonus de maîtrise au test. | Maîtrises collectées, profils textuels. **Partiel**. | Système ; outil, caractéristique et maîtrise. | Sans maîtrise le test reste possible si l'action le permet, sans bonus ; total serveur. | B05. |
| B07-OUT-002 | PHB24 p. 220 | Si la créature maîtrise aussi une compétence réellement utilisée par le même test d'outil, elle obtient Avantage. | Interaction absente. **Manquant**. | Système, MJ ; outil, compétence et contexte. | Une compétence sans rapport n'accorde rien ; plusieurs compétences ne cumulent pas l'Avantage. | B05-ATQ-002. |
| B07-OUT-003 | PHB24 p. 220–221 | L'action `Utilisation` propose exactement les usages et DD du profil ; chaque action choisit un seul usage. | Texte libre. **Partiel / non exécutable**. | Contrôleur ; outil, usage et cible. | Usage inconnu ou outil inaccessible refusé avant jet ; résultat et conséquence persistés. | B05-ACT-011. |
| B07-OUT-004 | PHB24 p. 220–221 | Chacune des 17 familles d'outils d'artisan et 8 autres outils exige une maîtrise distincte ; chaque variante de jeu/instrument exige aussi sa propre maîtrise. | Familles génériques pour jeux/instruments. **Partiel / incorrect**. | Build, système ; maîtrise précise. | Maîtriser la flûte ne maîtrise ni luth ni tous les instruments ; idem pour chaque jeu. | B01-HIS/CLA. |
| B07-OUT-005 | PHB24 p. 220–221, 233 ; DEC-012 | Les paramètres de fabrication conservent outil, maîtrise, matériaux, temps et assistants requis, mais aucun workflow ne les exécute au MVP ; le MJ arbitre puis attribue le résultat avec provenance `fabrication`. | Listes textuelles, attribution/correction absente. **Manquant, workflow hors périmètre**. | MJ, artisans ; recette et acquisition. | Aucun joueur ne crée automatiquement un objet ; une attribution MJ peut documenter outil, participants, dépense et durée sans contourner l'usage ultérieur. | `DR-B07-04` résolue. |
| B07-OUT-006 | PHB24 p. 233 ; DEC-012 | Pour l'arbitrage MJ d'un objet non magique, matériaux valent la moitié du prix arrondie à l'inférieur et les jours de 8 h le prix en PO divisé par 10 arrondi au supérieur ; assistants compatibles divisent le temps. | Aucun workflow ni correcteur. **Manquant, calcul de référence**. | MJ, artisans ; coût, jours et participants. | Le récapitulatif donne 750 PO et 150 jours seul pour un harnois ; il n'octroie ni ne dépense automatiquement. | `DR-B07-04` résolue. |
| B07-OUT-007 | PHB24 p. 233 ; DEC-012 | Pour l'arbitrage MJ, une potion de guérison exige maîtrise du nécessaire d'herboriste, 25 PO et un jour de 8 h ; un parchemin conserve prérequis, temps, coût et composantes par niveau. L'attribution fige sort, DD et attaque du scribe. | Objets présents, fabrication/inscription absente. **Manquant, calcul de référence**. | MJ, lanceur/artisan ; recette et sort. | L'absence de workflow ne crée ni potion ni parchemin ; l'exemplaire attribué possède tous ses paramètres d'usage B06/B07. | B06, `DR-B07-04` résolue. |
| B07-OUT-008 | DEC-011 | Une utilisation ou fabrication subjective ouvre seulement l'arbitrage nécessaire ; coûts, jets, durées et effets déterministes restent automatiques et auditables. | Aucun arbitrage d'objet. **Manquant**. | MJ, contrôleur ; étape et décision. | Une note manuelle ne remplace jamais une consommation, un DD ou une durée déterministe. | DEC-011, B07-CUS. |

## Matrice — matériel, consommables et objets de scène

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B07-EQP-001 | PHB24 p. 222–229 | Acide, feu grégeois, eau bénite et filet remplacent une attaque de l'action Attaque, avec cible, portée, DD et conséquence exacts. | Descriptions présentes, aucune action. **Partiel / non exécutable**. | Contrôleur, système ; attaque et objet. | Nombre d'attaques décrémenté, objet consommé au bon moment, cible invalide sans coût avant validation. | B05-ACT/ATQ. |
| B07-EQP-002 | PHB24 p. 224, 226–227 | Billes, chausse-trappes, piège, huile et autres zones créent une instance positionnée avec surface, durée, récupération et déclencheurs. | Zones et objets de scène absents. **Manquant**. | Contrôleur, système ; objet et géométrie. | Frontières métriques exactes ; première entrée/tour et récupération ne se déclenchent qu'au rythme prévu. | B05-VIS/TOU. |
| B07-EQP-003 | PHB24 p. 225–228 | Chaîne, corde, menottes et filet conservent cible, partie liée, DD d'application/évasion/rupture, condition et cause de fin. | Texte libre. **Manquant**. | Contrôleurs, système ; instance de lien. | Mauvaise taille/condition refuse ; destruction libère la bonne cible seulement. | B04-CON, B05. |
| B07-EQP-004 | PHB24 p. 225, 228 | Trousse de soins possède dix usages et en dépense un pour stabiliser ; potion, antidote, poison et autres consommables décrémentent quantité/usages selon leur texte. | Quantité seulement ; « charges » dans le texte. **Partiel / non exécutable**. | Contrôleur, système ; usages et quantité. | Dix stabilisations maximum par trousse ; zéro usage ne laisse pas une trousse utilisable. | B04-VIE, B07-INV. |
| B07-EQP-005 | PHB24 p. 227 | Poison standard enduit une arme ou jusqu'à trois munitions, dure 1 minute ou jusqu'aux dégâts, et n'affecte que dégâts perforants/tranchants. | État appliqué absent. **Manquant**. | Contrôleur, système ; source, cibles et échéance. | Quantité exacte, bonne attaque et expiration ; pile de munitions divisée si nécessaire. | B05-DMG, B09 temps. |
| B07-EQP-006 | PHB24 p. 224, 226–229 | Bougie, lampe, lanternes, huile et torche conservent combustible, durée, lumière vive/faible, forme et commandes d'allumage/extinction. | Texte libre, lumière absente. **Manquant**. | Contrôleur, système ; source lumineuse et carburant. | Durée non consécutive de l'huile conservée ; extinction ne restaure pas le carburant. | B05-VIS, B09. |
| B07-EQP-007 | PHB24 p. 228, B06 | Parchemin niveau 0/1 vérifie liste de classe, emploie temps normal, ignore composantes matérielles, fixe DD 13/attaque +5 et se désintègre après lancement achevé. | Identités présentes, sort précis non porté. **Partiel / non exécutable**. | Lanceur, système ; parchemin et sort inscrit. | Mauvaise liste refuse sans détruire ; lancement achevé détruit l'exemplaire une fois. | B06-PRE/INC. |
| B07-EQP-008 | PHB24 p. 223–226, B06 | Focaliseur et sacoche à composantes doivent être possédés, accessibles et autorisés pour la source magique ; symbole sacré respecte tenu/porté/apposé. | Familles génériques, mains absentes. **Partiel**. | Lanceur, système ; source et emplacement. | Un focaliseur d'une autre classe n'autorise rien ; un composant précis/tarifé/consommé n'est jamais remplacé. | DEC-011, B06-INC. |
| B07-EQP-009 | PHB24 p. 224–228 | Livre, carte, loupe, costume, parfum, bélier, pied-de-biche et autres bonus situationnels s'appliquent seulement au test et contexte décrits. | Descriptions non actives. **Partiel / non exécutable**. | Contrôleur, MJ, système ; contexte et bonus. | Bonus, Avantage et aide ne se propagent pas à un autre test ; source visible dans le détail. | B05. |
| B07-EQP-010 | PHB24 p. 229 | Une torche attaquée est une arme courante de mêlée infligeant 1 Feu ; toute autre utilisation martiale d'objet suit l'arme improvisée ou l'équivalence MJ. | Torche non structurée comme attaque. **Manquant**. | Contrôleur, MJ ; mode d'usage. | Torche ne gagne pas automatiquement dégâts/maîtrise d'une autre arme ; équivalence séparée. | B07-ARM-012. |
| B07-EQP-011 | PHB24 p. 20, 362 | Un objet fragile non magique peut être détruit automatiquement par action ; autrement CA, PV, immunités, vulnérabilités, seuil et sections s'appliquent. | Profils d'objet de scène absents. **Manquant**. | MJ, système ; matériau, taille et robustesse. | Objet ordinaire immunisé Poison/Psychique ; sans caractéristiques il échoue ses sauvegardes. | B05-DMG-011. |
| B07-EQP-012 | PHB24 p. 213 ; DMG24 p. 217 ; DEC-012 | Les valeurs de revente restent disponibles pour arbitrage, mais le MVP n'offre aucune boutique ni commande de vente ; le MJ applique dépense, gain ou acquisition par correction auditée. | Vente et correction absentes. **Manquant, workflow explicitement hors périmètre**. | MJ, système ; objet, valeur et correction. | Aucun joueur ne vend automatiquement ; un objet magique conserve sa valeur DMG sans créer de marché garanti. | `DR-B07-04` résolue. |
| B07-EQP-013 | PHB24 p. 229–232, DEC-012 | Montures, harnachement, véhicules et services n'ont aucun workflow MVP ; leurs profils utiles restent distincts et leur acquisition/dépense relève du MJ. | Absents du catalogue. **Conforme au périmètre manuel, profils B08/B09 manquants**. | MJ, système ; service, créature ou véhicule. | Aucun profil de créature ou véhicule n'est réduit à `{itemKey, quantity}` ; toute dépense manuelle est auditée. | `DR-B07-04` résolue, B08/B09. |
| B07-EQP-014 | DEC-004/011 | Toute durée d'objet avance par tours/rounds en combat et par temps fictionnel MJ hors combat, jamais par horloge murale. | Aucun effet actif. **Manquant**. | Système, MJ ; échéance et pause. | Reconnexion ne saute ni ne répète carburant, poison, lumière, zone ou recharge. | B06-PER, B09. |
| B07-EQP-015 | PHB24 p. 222–229 | Un objet dont la règle nécessite une décision narrative exécute d'abord tous paramètres déterministes puis ouvre une résolution privée MJ si nécessaire. | Descriptions seulement. **Manquant**. | Contrôleur, MJ ; intention et résolution. | Coût et jet ne sont ni retardés ni remboursés par une réponse narrative défavorable. | DEC-011. |

## Matrice — objets magiques, identification, charges et harmonisation

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B07-MAG-001 | PHB24 p. 232 ; DMG24 p. 227–325 ; PRODUCT | Le catalogue magique couvre chaque titre et variante du catalogue A–Z avec identité, catégorie, rareté, valeur disponible, harmonisation, prérequis, charges, activation, effets et secrets. Une entrée paramétrée (`+1/+2/+3`, type d'arme, sort, force de géant, figurine, instrument, etc.) produit des variantes explicites sans dupliquer sa règle commune. | Potions/parchemins PHB seulement, sans profil magique ; aucun catalogue DMG. **Manquant**. | Système, MJ ; définition, paramètres et profil magique. | Chaque titre A–Z et chaque combinaison autorisée possède une page source ; combinaison impossible refusée ; toutes les exceptions du profil sont testables. | Catalogue DMG contrôlé. |
| B07-MAG-002 | PHB24 p. 232 | Manipuler révèle qu'un objet est extraordinaire, pas ses propriétés ; *Identification* ou un repos court en contact révèle propriétés et usage, jamais une malédiction. | Connaissance d'objet absente. **Manquant**. | Joueur, MJ, système ; connaissance par acteur. | Deux joueurs peuvent connaître des informations différentes ; aucune projection ne révèle une malédiction. | B06, SF-001. |
| B07-MAG-003 | PHB24 p. 232 | Goûter une potion suffit à en connaître l'effet ; expérimentation et indices transmettent seulement les informations décidées par la règle ou le MJ. | Aucun workflow. **Manquant**. | Contrôleur, MJ ; observation et révélation. | Goûter ne consomme pas la dose sauf règle contraire ; révélation reste auditée et privée. | DEC-011. |
| B07-MAG-004 | PHB24 p. 232 | Quand un objet exige l'harmonisation, seuls ses bénéfices non magiques s'appliquent avant celle-ci, sauf texte contraire. | Harmonisation absente. **Manquant**. | Système ; exemplaire et porteur. | Bouclier magique non harmonisé reste un bouclier ordinaire compatible, sans bonus magique. | B04-INV-006. |
| B07-MAG-005 | PHB24 p. 232 | S'harmoniser exige un repos court entier, contact et concentration sur ce seul objet ; ce repos ne peut pas être celui qui sert à apprendre ses propriétés et une interruption fait échouer. | Repos/harmonisation absents. **Manquant**. | Joueur, système ; choix de repos. | Un objet par personnage et par repos ; perte du contact ou interruption ne modifie rien. | B04-INV-007, B09. |
| B07-MAG-006 | PHB24 p. 232, 361 | Au plus trois harmonisations, jamais deux exemplaires de la même identité ; chaque prérequis est revalidé. | État absent. **Manquant**. | Système ; identités et prérequis. | Quatrième ou doublon refusé ; exception explicite de profil seulement. | B04-INV-008/009. |
| B07-MAG-007 | PHB24 p. 232 | Harmonisation finit sur prérequis perdu, distance > 30 m pendant 24 h continues, mort, harmonisation par autrui ou repos court volontaire, sauf malédiction. | État/distance absents. **Manquant**. | Système, joueur ; causes et échéance. | Retour à portée avant 24 h réinitialise ; mort clôt avant résurrection ; malédiction bloque seulement la fin prévue. | B04-INV-010 à 012. |
| B07-MAG-008 | PHB24 p. 233 | Objet magique porté/manié doit occuper son emplacement prévu ; vêtements s'ajustent généralement à la taille, paire complète exigée et conflits de même type refusés sauf MJ. | Emplacements magiques absents. **Manquant**. | Système, MJ ; port et exception. | Une chaussure de chaque paire n'accorde aucun bénéfice ; exception MJ ne modifie pas le catalogue. | B07-POR-010. |
| B07-MAG-009 | DMG24 p. 218 et profils p. 227–325 | Chaque pool de charges conserve maximum, courant, coût par activation, récupération, moment du jet, risque à zéro et destruction éventuelle propres à l'objet. | Aucun champ de charge générique. **Manquant**. | Système ; exemplaire et pool. | Activation insuffisamment chargée refusée ; récupération et destruction se produisent une fois à leur échéance. | B07-MAG-017/018. |
| B07-MAG-010 | DMG24 p. 218 et profils p. 227–325, DEC-004 | L'activation suit action, cible, commande éventuelle, emplacement, harmonisation, charges et exceptions du profil ; la commande est atomique et idempotente. | Aucun moteur. **Manquant**. | Contrôleur, système ; activation. | Aucun double coût ou effet après retransmission ; une cible devenue invalide suit le profil exact. | B05/B06. |
| B07-MAG-011 | SF-001/006 | Nom public, apparence, propriétés connues, texte privé, malédiction et état MJ sont des projections distinctes du même exemplaire. | Une description commune seulement. **Manquant / risque de fuite**. | Système ; connaissances et permissions. | Sérialisation et événements n'envoient jamais une propriété non découverte ou privée. | B07-INV-011. |
| B07-MAG-012 | DEC-003/009 | Progression/respécialisation conserve l'exemplaire et revalide ses prérequis ; correction, transfert, mort et archivage appliquent toutes les fins et effets dépendants. | Aucun état magique. **Manquant**. | Système, MJ ; transition globale. | Aucun bonus orphelin après perte d'harmonisation ; historique explique avant/après. | B03/B04. |
| B07-MAG-013 | DMG24 p. 216–217 | Chaque objet appartient à une des neuf catégories `Armure`, `Potion`, `Anneau`, `Sceptre`, `Parchemin`, `Bâton`, `Baguette`, `Arme` ou `Objet merveilleux` et hérite de ses règles : port, consommation, lecture, focaliseur, arme de base, munition magique ou ajustement anatomique. | Catégories magiques absentes. **Manquant**. | Système, MJ ; catégorie et objet de base. | La catégorie ne remplace jamais le texte individuel ; potion utilisée disparaît, parchemin lu s'efface, bâton/baguette/sceptre ne sert de focaliseur que selon sa règle. | PHB24 p. 232–233. |
| B07-MAG-014 | DMG24 p. 217 | Rareté vaut `Commun`, `Peu commun`, `Rare`, `Très rare`, `Légendaire` ou `Artefact` ; la valeur de référence est respectivement 100, 400, 4 000, 40 000, 200 000 PO ou inestimable, divisée par deux pour un consommable hors parchemin de sort et augmentée du coût de l'objet de base. | Rareté/valeur magiques absentes. **Manquant**. | Système, MJ ; rareté, consommation, base et valeur. | Une armure de plates rare vaut 5 500 PO ; la valeur reste informative au MVP et ne crée aucune boutique. | DEC-012, B07-EQP-012. |
| B07-MAG-015 | DMG24 p. 218 | Activer un objet prend normalement une action Magie, sauf catégorie ou profil contraire ; mot de commande parlé ou signé, consommation et portée suivent exactement le profil. | Activation absente. **Manquant**. | Contrôleur, système ; action et commande. | Une potion se boit ou s'administre par action Bonus ; un mot parlé échoue si aucun son audible n'est possible ; aucun coût générique ne remplace l'exception. | B05-ACT. |
| B07-MAG-016 | DMG24 p. 218 | Un sort lancé depuis un objet emploie le plus bas niveau et niveau de lanceur possibles, ne dépense pas d'emplacement, n'exige pas de composante sauf exception, conserve temps/portée/durée/concentration et emploie la caractéristique précisée ou celle choisie par l'utilisateur ; sans caractéristique d'incantation, son modificateur vaut `+0` et le bonus de maîtrise s'applique. | Lancement depuis objet absent. **Manquant**. | Lanceur, système ; source, sort et caractéristique. | L'objet, et non la classe, paie charges/usages ; la concentration reste personnelle ; chaque exception individuelle prévaut. | B06. |
| B07-MAG-017 | DMG24 p. 218 | *Identification* révèle les charges restantes ; un porteur harmonisé connaît le courant et la récupération, sans recevoir les secrets que la règle exclut. | Charges et connaissance absentes. **Manquant**. | Joueur, MJ, système ; connaissance par acteur. | Deux porteurs non harmonisés n'obtiennent pas le compteur par simple possession ; aucune malédiction n'est révélée par ce canal. | B07-MAG-002/011. |
| B07-MAG-018 | DMG24 p. 218 | « À la prochaine aube » désigne l'événement fictionnel du monde ou du plan ; s'il n'y survient pas, le MJ fixe explicitement l'échéance. Une recharge n'est ni un repos long ni vingt-quatre heures par défaut. | Horloge d'aventure absente. **Manquant**. | MJ, système ; monde, échéance et événement. | Pause/reconnexion ne recharge rien ; une seule recharge se produit à l'aube qualifiante ; un plan sans aube ouvre une décision MJ. | B09 temps fictionnel. |
| B07-MAG-019 | DMG24 p. 218 et profils p. 227–325 | Une malédiction est révélée seulement par son profil ou par découverte en jeu ; les moyens ordinaires d'identification l'ignorent et une harmonisation maudite ne prend pas fin volontairement avant rupture de la malédiction. | Malédictions absentes. **Manquant / risque de fuite**. | MJ, porteur, système ; secret et fin. | Réponse, événement et historique joueur ne nomment pas la malédiction ; *Délivrance des malédictions* ou règle équivalente réautorise seulement la transition prévue. | B07-MAG-002/007/011. |
| B07-MAG-020 | DMG24 p. 218 | Un objet magique est au moins aussi durable que son équivalent non magique ; hors potions et parchemins, la plupart ont Résistance à tous les dégâts. Un artefact est invulnérable sauf méthode spéciale. | Résilience magique absente. **Manquant**. | MJ, système ; profil d'objet et dégâts. | La Résistance est appliquée une fois ; potion/parchemin n'en hérite pas ; aucune attaque ordinaire ne détruit un artefact. | B05-DMG-011. |
| B07-MAG-021 | DMG24 p. 216 | Boire ou administrer une potion prend une action Bonus ; appliquer une huile suit son profil. Mélanger des potions déclenche une résolution secrète de miscibilité pour chaque ajout après le premier, dont le MJ ne révèle que les conséquences devenues perceptibles. | Potion seulement cataloguée, aucun usage ou mélange. **Manquant**. | Contrôleur, MJ, système ; doses, ordre et résultat. | Chaque potion est engagée une fois ; l'ajout d'une troisième produit un nouveau jet ; un résultat caché ne fuit pas avant son effet. | B05-ACT, DEC-011. |
| B07-MAG-022 | DMG24 p. 217–218 | L'attribution d'objets magiques relève du MJ ; les paliers, raretés et tables thématiques servent à générer ou contrôler le butin sans rendre les objets nécessaires à l'équilibrage d'un personnage. | Génération de butin absente. **Manquant**. | MJ, système ; palier, rareté, table et provenance. | Même graine/commande ne génère qu'une fois ; le MJ peut choisir plutôt que tirer ; aucun rattrapage automatique n'octroie un objet. | SF-005, B09. |
| B07-MAG-023 | DMG24 p. 218–220, DEC-012 | Fabriquer hors potion de soins/parchemin exige maîtrise d'Arcanes, maîtrise et usage de l'outil de catégorie, sorts éventuellement préparés, matières, temps et coût par rareté ; assistants compatibles divisent le temps. Au MVP, le système conserve ces paramètres mais la dépense et la résolution restent arbitrées/corrigées par le MJ, sans workflow dédié. | Profils et workflow absents. **Manquant, usage manuel décidé**. | MJ, artisans ; recette et résultat. | Aucun objet n'est créé automatiquement ; le MJ peut enregistrer une acquisition `fabrication` conforme ; l'absence de workflow ne rend pas l'objet inutilisable ensuite. | DR-B07-04. |
| B07-MAG-024 | DMG24 p. 219–223 | Créateur, histoire, propriété mineure et bizarrerie sont des particularités facultatives d'un exemplaire ; elles peuvent ajouter une mécanique structurée ou une clause manuelle sans changer l'identité officielle. | Particularités absentes. **Manquant**. | MJ, système ; exemplaire et traits. | Deux exemplaires officiels peuvent diverger par particularité ; le catalogue de base reste inchangé ; un tirage incohérent peut être relancé ou choisi par le MJ. | B07-CUS pour primitives. |
| B07-MAG-025 | DMG24 p. 224–225 et profils A–Z | Un artefact est unique, attribué comme élément narratif et peut recevoir jusqu'à quatre propriétés bénéfiques mineures, deux majeures, quatre préjudiciables mineures et deux majeures ; sa destruction suit seulement sa méthode propre. | Artefacts absents. **Manquant**. | MJ, système ; identité unique et propriétés. | Second exemplaire officiel refusé ; propriété secrète filtrée ; destruction ordinaire impossible ; chaque apparition peut recevoir un ensemble différent. | B07-MAG-019/020/024. |
| B07-MAG-026 | DMG24 p. 226–227 et profils A–Z | Un objet conscient conserve Intelligence, Sagesse, Charisme, alignement, communication, sens, but et relation ; il est contrôlé par le MJ, peut refuser ses propriétés, rompre l'harmonisation ou tenter de charmer son porteur lors d'un conflit. Potion et parchemin ne sont jamais conscients. | Objets conscients absents. **Manquant**. | MJ, porteur, système ; persona, relation et demandes. | Sauvegarde de conflit vaut `12 + modificateur de Charisme de l'objet` ; contrôle dure au plus `1d12` heures, autorise de nouvelles sauvegardes sur dégâts et ne se retente pas avant la prochaine aube. | B08 pour présentation de persona, B07-MAG-018. |
| B07-MAG-027 | DMG24 p. 227–325 | Chaque profil A–Z compose les primitives B04–B08 et conserve sans généralisation abusive tous ses déclencheurs, cibles, DD, jets, charges, durées, recharges, formes, invocations, tables, secrets et fins. Une clause narrative devient une étape MJ explicite après les coûts déterministes. | Aucun profil A–Z implémenté. **Manquant**. | Contrôleur, MJ, système ; profil paramétré et état. | Pour chaque titre/variante : cas nominal, prérequis invalide, borne, recharge, fin, secret et retransmission sont testables ; aucun profil ne se réduit à une description. | DEC-011, B05/B06/B08. |

## Matrice — objets personnalisés et versionnement

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B07-CUS-001 | SF-006, DEC-006 | Seul un MJ actif crée un objet pour sa campagne ; aucune définition ou possession ne traverse les campagnes. | Portée de campagne dans le domaine, création absente. **Partiel**. | MJ, système ; campagne et créateur. | Joueur et MJ extérieur refusés ; identifiant connu ne révèle rien. | SF-001. |
| B07-CUS-002 | SF-006 | La définition porte au minimum nom, description, catégorie, poids, empilabilité, quantité, valeur, rareté, image, harmonisation, charges, récupération, effets, texte privé, créateur et origine. | Nom/type/poids/coût/description/source seulement. **Partiel**. | MJ ; définition versionnée. | Soumission incomplète ou contradictoire refusée ; image par défaut si absente. | DEC-006. |
| B07-CUS-003 | SF-006 | Les catégories couvrent armes, armures, boucliers, objets généraux, outils, consommables, contenants, paquetages et objets magiques. | Cinq types seulement ; bouclier assimilé à armure. **Partiel**. | Système ; catégorie et profil. | Chaque catégorie accepte seulement les champs compatibles et garde les comportements communs B07. | Phase 5 pour schéma. |
| B07-CUS-004 | DEC-006/011 | Un effet structuré emploie seulement des primitives prises en charge ; une clause libre est marquée manuelle et n'exécute jamais de code. | Dégâts/CA d'arme structurés, autres effets absents. **Partiel**. | MJ, système ; étapes automatiques/manuelles. | Charge utile, description ou image ne peut injecter une règle ou contourner un invariant. | DEC-006. |
| B07-CUS-005 | SF-006 | Une modification descriptive peut se propager aux exemplaires existants sans changer leurs mécaniques ni secrets découverts. | Sauvegarde par clé, aucun versionnement. **Manquant**. | MJ ; champs descriptifs et portée. | Avant confirmation, l'aperçu liste les exemplaires affectés ; aucun chiffre mécanique ne change. | DEC-006. |
| B07-CUS-006 | SF-006 | Toute modification mécanique crée une nouvelle version ; anciens exemplaires gardent leur version jusqu'à migration explicite du MJ. | Même clé écrasable par upsert. **Contraire à la cible**. | MJ, système ; ancienne/nouvelle version. | Les deux versions restent résolubles ; aucune possession ne migre par simple sauvegarde. | DEC-006. |
| B07-CUS-007 | SF-006, DEC-009 | Une migration explicite énumère les exemplaires, valide leur état et transforme charges, port, contenance, harmonisation et effets sans perte silencieuse. | Migration absente. **Manquant**. | MJ, système ; plan avant/après. | Échec d'un invariant ne laisse aucun exemplaire partiellement migré ; motif et résultat auditables. | Phase 5 pour technique. |
| B07-CUS-008 | SF-006 | Archiver interdit les nouveaux octrois mais conserve définition, image, version et usage de chaque exemplaire existant ; suppression interdite tant qu'une référence existe. | Prune réservé aux références officielles ; aucun archivage campagne. **Manquant**. | MJ, système ; statut et références. | Inventaire, historique, butin ou réserve existant reste lisible et utilisable. | DEC-006. |
| B07-CUS-009 | SF-006 | Le MJ attribue une quantité valide à un personnage actif de la campagne ou à la réserve ; l'acquisition affiche une carte sans texte privé. | Attribution/réserve absentes. **Manquant**. | MJ, destinataire ; exemplaires et projection. | Destinataire externe/inactif refusé ; exemplaires créés une fois avec provenance. | B09. |
| B07-CUS-010 | SF-006 | Empilabilité est cohérente avec l'état : un objet à charges individuelles, harmonisé, inscrit, maudit ou mécaniquement individualisé n'est pas fusionné par quantité. | Quantité libre par clé. **Contraire à la cible d'instance**. | Système ; définition et exemplaires. | Changer un état scinde automatiquement la pile concernée sans dupliquer le total. | B07-INV-002. |
| B07-CUS-011 | SF-001/006 | Texte privé et définition complète sont réservés aux MJ ; le possesseur voit seulement les propriétés qu'il a découvertes et les effets publics. | Aucune projection dédiée. **Manquant / risque critique**. | Système ; champs et connaissances. | Liste, détail, événement, recherche et reconnexion appliquent le même filtrage. | B07-MAG-011. |
| B07-CUS-012 | DEC-004/009 | Création, version, propagation, migration, attribution et archivage sont des commandes idempotentes et auditées ; aucune ne modifie directement un autre agrégat sans événement expliqué. | Lecture seule du catalogue. **Manquant**. | MJ, système ; commande et journal. | Rejeu sans doublon ; auteur, date, campagne, motif utile et versions avant/après conservés. | Phase 5 pour technique. |

## Matrice — synthèse de l'état actuel

| ID | Constat inspecté | Qualification | Critère de sortie futur | Trace |
|---|---|---|---|---|
| B07-ETA-001 | Les 38 armes, 13 armures/bouclier et 25 outils sont présents. | **Conforme en identités, partiel en profils**. | Toutes colonnes et exceptions PHB structurées et testées. | B07-CAT/ARM/DEF/OUT. |
| B07-ETA-002 | Variantes de jeux, instruments, focaliseurs et munitions sont fusionnées. | **Manquant**. | Chaque choix concret conserve prix, poids, maîtrise et contraintes. | B07-CAT-005. |
| B07-ETA-003 | Les huit bottes et neuf autres marqueurs de propriétés d'armes existent sans moteur. | **Partiel / non exploitable**. | Chaque déclencheur, limite, cible et cumul s'exécute via B05. | B07-ARM. |
| B07-ETA-004 | CA et Discrétion de l'armure sont exploitées ; entraînement, Force et temps ne le sont pas. | **Partiel, bouclier incorrect**. | Toutes conséquences se requalifient sur port et build. | B07-DEF. |
| B07-ETA-005 | Outils, matériel et consommables portent surtout une description. | **Partiel / non exécutable**. | Actions, DD, zones, usages, durées et recettes sont des profils actifs. | B07-OUT/EQP. |
| B07-ETA-006 | L'inventaire est `{itemKey, quantity}`, armure, bouclier et or, dans le build. | **Partiel / couplage obsolète**. | Exemplaires/version/provenance/emplacement indépendants du build. | B07-INV/POR. |
| B07-ETA-007 | Mains, objets de scène, conteneurs, charge et poids monétaire sont absents. | **Manquant**. | Chaque transition spatiale et limite est persistée et testable. | B07-POR, B05. |
| B07-ETA-008 | Catalogue A–Z, harmonisation, identification, charges, malédictions et projections secrètes sont absents. | **Manquant**. | Règles communes PHB/DMG et chaque titre ou variante A–Z deviennent des profils actifs. | B07-MAG. |
| B07-ETA-009 | Une définition de campagne peut remplacer une officielle de même clé ; aucun versionnement ni archivage. | **Contraire à la cible**. | Identités séparées, versions immuables, migrations et archivage explicites. | B07-CAT/CUS. |
| B07-ETA-010 | Le module objet expose seulement la lecture du catalogue. | **Manquant**. | Création, attribution et commandes d'usage autorisées et auditables. | B07-INV/CUS. |

## Décisions du bloc

### DR-B07-01 — Conversion fonctionnelle du poids

**DÉCISION VALIDÉE.** Le produit emploie `1 lb = 0,5 kg`. La quantité PHB en livres
reste la valeur source afin que conversions, limites et corrections soient
reproductibles ; l'écart volontaire avec le SI est assumé.

### DR-B07-02 — Automatisation de la capacité de port

**DÉCISION VALIDÉE.** La capacité de port est un réglage de campagne désactivé par
défaut. Lorsqu'il est actif, l'interface avertit avant la limite puis le serveur bloque
toute mutation qui la dépasserait ; activer le réglage sur un état déjà excédentaire
le signale sans supprimer ni déplacer silencieusement de possession.

### DR-B07-03 — Variante de taille d'équipement

**DÉCISION VALIDÉE.** La variante de taille, son ajustement et son coût
`1d4 × 10 %` ne sont pas automatisés au MVP. Le MJ arbitre et, si nécessaire, applique
une correction auditée ; aucune incompatibilité de taille n'est inventée par défaut.

### DR-B07-04 — Commerce, fabrication, services, montures et véhicules

**DÉCISION VALIDÉE.** Le MVP n'offre ni boutique ni workflow dédié de commerce,
fabrication, service, monture ou véhicule. Le MJ arbitre et corrige acquisition,
dépense, vente et fabrication. Dès qu'un objet est détenu, toutes ses conséquences
mécaniques déterministes restent automatisées ; montures et véhicules conservent leur
profil propre dans B08/B09 et ne deviennent pas de simples lignes d'inventaire.

### DR-B07-05 — Autorité du joueur sur ses possessions

**DÉCISION VALIDÉE.** Le joueur assigné peut organiser, équiper, utiliser et déposer
ses possessions. Il peut proposer un transfert à un autre personnage actif de la même
campagne ; le transfert ne devient effectif qu'après consentement de son joueur
assigné. Un MJ peut attribuer ou corriger directement sous son autorité habituelle.

## Vérification du bloc validé

Le bloc validé établit :

- 116 règles communes et 10 constats `B07-ETA-*` avec cible, qualification et
  critères ;
- la couverture du chapitre 6 PHB, des interactions d'objet, du glossaire pertinent,
  des règles communes DMG et de chaque entrée ou variante magique A–Z ;
- cinq décisions produit validées et deux sources primaires locales contrôlées ;
- les limites avec B01 à B06, B08 et B09 ;
- aucun changement de code, test, seed, migration, dépendance ou CI.

Le propriétaire a validé explicitement le bloc le 20 août 2026. Cette validation porte
sur la cible fonctionnelle et les écarts documentés, sans autoriser d'implémentation ni
commencer B08.
