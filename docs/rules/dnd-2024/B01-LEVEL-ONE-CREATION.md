# B01 — Création complète d'un personnage niveau 1

## Statut

**VALIDÉE PAR LE PROPRIÉTAIRE — 20 août 2026.**

Ce document inventorie les règles fonctionnelles du bloc B01 défini dans
[`DND-2024-COMPLIANCE-PLAN.md`](../../DND-2024-COMPLIANCE-PLAN.md). Il décrit la
cible et les écarts observés ; il n'autorise aucune implémentation.

Le propriétaire a demandé le 19 août 2026 que les références manquantes soient
recherchées sur internet, puis a fourni le 20 août 2026 le *Player's Handbook 2024*.
Les 387 pages du PDF ont été indexées ; les passages utiles au bloc ont été extraits et
contrôlés visuellement. Toutes les règles B01 disposent désormais d'une source primaire
ou d'une décision produit explicite. Toutes les décisions du bloc sont résolues et le
propriétaire a validé explicitement la matrice le 20 août 2026.

## Sources et conventions

### Sources normatives disponibles

- `PHB24` — [`PlayersHandbook2024.pdf`](../../books/PlayersHandbook2024.pdf), source
  primaire locale. Les numéros cités sont ceux imprimés dans le livre, pas l'index
  interne du PDF ;
- `SF-001` et `SF-002` dans [`REQUIREMENTS.md`](../../REQUIREMENTS.md) ;
- [`DEC-002`](../../DECISIONS/002-roles-and-visibility.md),
  [`DEC-003`](../../DECISIONS/003-character-lifecycle.md) et
  [`DEC-008`](../../DECISIONS/008-level-one-character-details.md) ;
- le présent plan de conformité.

### Pointage primaire du bloc

| Domaine | Pages `PHB24` contrôlées |
|---|---|
| Création, origine, langues, caractéristiques et fiche initiale | p. 33–41 |
| Babioles | p. 46–47 |
| Classes et choix du niveau 1 | p. 50–52, 58–60, 68–70, 78–80, 90–92, 100–102, 108–110, 118–120, 128–130, 138–140, 152–156 et 164–166 |
| Historiques et espèces | p. 177–196 |
| Dons d'Origine et Styles de combat | p. 200–202 et 208–210 |
| Armes, armures, outils et matériel | p. 213–233 |
| Télépathie | p. 331 |

### Corpus internet complémentaire vérifié

- `OFF-CRE` — [Creating a Character, Free Rules 2024](https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character) : étapes de création, langues, caractéristiques et équipement de départ ;
- `OFF-ORI` — [Character Origins, Free Rules 2024](https://www.dndbeyond.com/sources/dnd/br-2024/character-origins) : structure des historiques et des espèces ;
- `OFF-UPD` — [Updates in the Player's Handbook (2024)](https://www.dndbeyond.com/posts/1810-updates-in-the-players-handbook-2024) : inventaires officiels, dont 10 espèces, 16 historiques et 391 sorts ;
- `OFF-ESP` — [The 10 Species in the 2024 Player's Handbook](https://www.dndbeyond.com/posts/1783-the-10-species-in-the-2024-players-handbook) et [index officiel des espèces](https://www.dndbeyond.com/species) ;
- `OFF-HIS` — [The Backgrounds and Origin Feats in the 2024 Player's Handbook](https://www.dndbeyond.com/posts/1785-the-backgrounds-and-origin-feats-in-the-2024) ;
- `OFF-ERR` — [errata officiel du Player's Handbook 2024](https://www.dndbeyond.com/sources/dnd/sae/players-handbook) ;
- `SEC-AID` — [règles de création 2024](https://www.aidedd.org/regles-24/creation-de-personnage/), [origines](https://www.aidedd.org/regles-24/origines-des-personnages/), [espèces](https://www.aidedd.org/regles-24/origines-des-personnages/description-des-especes/), [classes](https://www.aidedd.org/regles-24/classes/), [dons](https://www.aidedd.org/feat/fr/), [outils](https://www.aidedd.org/regles-24/equipement/outils/), [armes](https://www.aidedd.org/regles-24/equipement/armes/) et [manifestations occultes](https://www.aidedd.org/invocation/fr/) d'AideDD, utilisés lors de la recherche initiale mais plus pour trancher une règle B01 ;
- `SEC-SOR` — [inventaire communautaire de 391 sorts](https://github.com/arshk-dm/D-D-2024-spells-data/blob/main/all_spells_data_finale.csv), comparé par identité au seed local puis recoupé avec [l'index officiel D&D Beyond](https://www.dndbeyond.com/spells).

La hiérarchie est : décisions produit explicites, errata officiel, `PHB24`, autres
sources officielles, puis source secondaire recoupée. Une source secondaire ne peut
pas contredire une source officielle. Le SRD et les Free Rules sont des sous-ensembles
et ne prouvent jamais à eux seuls l'exhaustivité du Player's Handbook.

### Données locales comparées au corpus

- `DATA-ESP` : `docs/characteres/races/*.json` ;
- `DATA-CLA` : `docs/characteres/classes/*.json` ;
- `DATA-HIS` : `docs/characteres/backgrounds.json` ;
- `DATA-DON` : `docs/characteres/feats.seed.json` et `feats.effects.json` ;
- `DATA-INV` : `docs/characteres/invocations.seed.json` et
  `invocations.effects.json` ;
- `DATA-SOR` : `docs/characteres/spells.seed.json` et `spells.effects.json` ;
- `DATA-EQP` : `docs/characteres/equipment/` et `materiel-aventurier.txt`.

Le SRD 5.2 vendoré est uniquement une source de contrôle. Sa provenance documentée
et ses divergences connues interdisent de l'utiliser pour trancher une cible.

### État actuel inspecté

- contrat : `shared/src/character-schema.ts` et `character-sheet-schema.ts` ;
- domaine : `back/src/modules/characters/domain/` ;
- application : `back/src/modules/characters/application/` ;
- persistance :
  `back/src/modules/characters/infrastructure/persistence/character.schema.ts` ;
- parcours :
  `front/src/pages/campaigns/detail/characters/builder/_internal/`.

### Qualifications

- **Conforme** : la cible est représentée et contrôlée par le serveur ;
- **Partiel** : une partie existe, ou le contrôle repose seulement sur le client ;
- **Manquant** : la cible n'est pas représentable ;
- **Ambigu** : les sources disponibles ne permettent pas de trancher ;
- **Dette** : une représentation existante doit être conservée provisoirement ;
- **Obsolète** : une donnée existe mais se trouve hors du périmètre validé.

`Trace` désigne la future traçabilité. Aucun ticket ni test futur n'est inventé dans
ce brouillon ; toutes les lignes renvoient pour l'instant à `SF-002`.

## Matrice — identité et composition générale

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B01-ID-001 | SF-001, SF-002 | Un joueur actif crée au plus son personnage assigné ; un MJ actif peut créer plusieurs personnages dans sa campagne et les attribuer à un joueur actif de cette campagne. | Création et limite joueur présentes ; contrôles de campagne et d'attribution connus comme partiels. **Partiel**. | Joueur, MJ ; campagne, créateur, attribution. | Refus hors campagne, refus d'un second personnage joueur, autorisation de plusieurs créations MJ, refus d'une attribution externe. | DEC-002 ; SF-001, SF-002. |
| B01-ID-002 | PHB24 p. 36 et 41, SF-002 | Le niveau initial est exactement 1, avec 0 PX, et le bonus de maîtrise vaut +2. | Niveau forcé à 1 et bonus calculé ; les PX ne font pas partie de la composition actuelle. **Partiel**. | Système ; niveau, PX. | Toute création produit niveau 1, 0 PX et bonus +2 ; aucune entrée client ne peut les remplacer. | SF-002. |
| B01-ID-003 | SF-002, DEC-003 | Le nom est obligatoire, puis immuable après acceptation du MJ. | Nom requis entre 2 et 50 caractères ; pas d'état d'acceptation permettant l'immuabilité cible. **Partiel**. | Créateur, MJ ; nom. | Refus d'un nom absent/invalide ; modification possible avant nouvelle soumission après refus ; refus après acceptation. | SF-002. |
| B01-ID-004 | PHB24 p. 39–40, SF-002, DEC-008 | L'un des neuf alignements est obligatoire et devient immuable après acceptation. | Champ absent du contrat et de la persistance. **Manquant**. | Créateur, MJ ; alignement. | Refus absent/hors catalogue ; restitution exacte ; refus de modification après acceptation. | DEC-008 ; SF-002. |
| B01-ID-005 | PHB24 p. 177, SF-002, DEC-008 | L'âge est un entier strictement positif ; aucune limite d'espèce n'est automatisée et le MJ arbitre la cohérence avec la durée de vie normale indiquée par le PHB. | Champ absent. **Manquant**. | Créateur, MJ ; âge. | Refus de 0, négatif, décimal ou non numérique ; aucune borne maximale d'espèce côté système ; modification autorisée après acceptation. | Dérogation d'automatisation à la recommandation PHB ; DEC-008 ; SF-002. |
| B01-ID-006 | SF-002, DEC-008 | La taille physique en centimètres et le poids en kilogrammes sont obligatoires et strictement positifs. La taille physique est immuable après acceptation ; le poids reste modifiable. | Champs absents. **Manquant**. | Créateur, MJ ; taille physique, poids. | Refus absent, nul ou négatif ; unités affichées et persistées sans ambiguïté ; permissions après acceptation respectées. | DEC-003, DEC-008 ; SF-002. |
| B01-ID-007 | SF-002, DEC-008 | La description physique est facultative et reste modifiable après acceptation. | Champ absent. **Manquant**. | Créateur ; description. | Une valeur absente est acceptée ; une valeur saisie est restituée ; modification autorisée après acceptation. | DEC-008 ; SF-002. |
| B01-ID-008 | SF-002, DEC-003 | Le portrait est facultatif. À défaut, le système utilise un fond blanc avec silhouette de tête grise ; le même visuel sert sur la fiche et en combat. | Aucun champ ni workflow de portrait. **Manquant**. | Créateur ; portrait ou portrait générique. | Création sans fichier réussie avec le visuel exact ; téléversement visible sur fiche et pion ; remplacement autorisé après acceptation. | Stockage et limites techniques reportés à la Phase 5 ; SF-002. |
| B01-ID-009 | SF-002 | Toute combinaison des dix espèces et douze classes est autorisée si ses choix internes sont valides ; aucune compatibilité espèce-classe artificielle n'est ajoutée. | Neuf espèces seulement ; aucune restriction croisée observée. **Partiel**. | Créateur ; espèce, classe. | Les 120 couples de base peuvent atteindre une soumission valide ; un refus ne peut provenir que d'une règle interne explicitée. | SF-002. |
| B01-ID-010 | SF-002 | Le serveur valide la copie complète ; l'interface masque ou désactive chaque choix impossible avec une raison courte. | Plusieurs règles ne sont contrôlées que par l'interface ; le backend valide surtout lignage et compétences de classe/espèce. **Partiel**. | Système ; composition complète et provenance de chaque choix. | Un client modifié ne peut soumettre aucun quota, catalogue, prérequis ou équipement invalide ; le refus identifie le choix fautif. | SF-002. |

## Matrice — caractéristiques et bonus d'historique

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B01-CAR-001 | PHB24 p. 38 | Trois méthodes sont proposées : tableau standard `15, 14, 13, 12, 10, 8`, achat de points (27 points, scores 8 à 15) ou six tirages de `4d6` en conservant les trois meilleurs. | Trois méthodes représentées ; tableau et achat validés par le backend. **Partiel**. | Créateur ; méthode et six scores de base. | Chaque permutation valide passe ; valeur, budget, nombre de scores ou doublon de position invalide est refusé. | Règle primaire pointée ; SF-002. |
| B01-CAR-002 | SF-005 | Le tirage de création peut provisoirement être réalisé côté client ; ses quatre dés et son total restent consultables. | Tirage client envoyé au serveur ; le domaine recalcule les totaux depuis les dés et vérifie leur affectation, mais certains commentaires affirment encore à tort que le tirage n'est plus vérifié. **Dette documentaire / partiel**. | Créateur, système ; dés bruts, totaux, affectation. | Chaque total affiché égale la somme des trois meilleurs dés ; l'affectation utilise exactement les six totaux. | Exception provisoire validée dans SF-005. |
| B01-CAR-003 | PHB24 p. 38 et 177, DATA-HIS | L'historique désigne trois caractéristiques éligibles. Le joueur applique soit +2/+1 à deux caractéristiques distinctes, soit +1/+1/+1 aux trois. | Représenté et validé contre l'historique par le backend. **Conforme sur les plans de bonus**. | Créateur ; trois caractéristiques et bonus. | Toute autre somme, valeur, répétition ou caractéristique est refusée. | SF-002. |
| B01-CAR-004 | PHB24 p. 38 et 177 | Le score final est la base plus le bonus d'historique ; aucun bonus d'historique ne peut porter un score au-dessus de 20. | Addition résolue ; la limite finale normative n'est pas exprimée comme invariant autonome. **Partiel**. | Système ; scores finaux. | Les six scores et modificateurs sont recalculés côté serveur et justifiés par base et bonus ; toute composition dépassant 20 par ce bonus est refusée. | Règle primaire pointée ; SF-002. |

## Matrice — espèces, lignages et catégorie de taille

Les dix espèces et tous leurs traits ont été pointés dans `PHB24` p. 186–196. Les
numéros de page par entrée sont : Aasimar 186, Drakéide 187, Nain 188, Elfe 189–190,
Gnome 191, Goliath 192, Halfelin 193, Humain 194, Orc 195 et Tieffelin 196.

| ID | Source de travail | Cible au niveau 1 | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B01-ESP-001 | PHB24 p. 36 et 186–196, DATA-ESP | Le catalogue contient exactement les dix espèces PHB 2024 ; chaque espèce accorde sa vitesse, sa vision, ses traits de niveau 1 et ses options, sans bonus de caractéristique d'espèce. | Neuf espèces. **Manquant : Aasimar**. | Créateur, système ; espèce et traits. | Catalogue de dix entrées ; sélection d'une espèce applique exactement ses traits de niveau 1. | Inventaire primaire pointé ; SF-002. |
| B01-ESP-002 | PHB24 p. 186 | Au niveau 1, l'Aasimar choisit P ou M et reçoit Résistance céleste, Vision dans le noir, Mains guérisseuses et Porteur de lumière, sans choix interne de Révélation céleste. Cette dernière n'arrive qu'au niveau 3 et son option est choisie à chaque activation. | Clé absente du contrat, du domaine, des données locales et de l'interface. **Manquant**. | Créateur ; espèce Aasimar, taille. | Un Aasimar niveau 1 valide choisit sa taille et peut être soumis sans choix prématuré de Révélation céleste ; sa fiche justifie ses quatre traits de niveau 1. | Révélation céleste relève de B02 ; SF-002. |
| B01-ESP-003 | PHB24 p. 187, `races/dragonborn.json` | Le Drakéide choisit une ascendance parmi dix ; ce choix détermine au minimum le type de dégâts de son Souffle et sa résistance. | Dix ascendances et traits présents ; choix de lignage validé. **Partiel** sur la validation complète des effets. | Créateur ; ascendance. | Exactement une ascendance connue ; aucune combinaison croisée de traits ; provenance visible. | SF-002. |
| B01-ESP-004 | PHB24 p. 188, `races/dwarf.json` | Le Nain reçoit ses traits de niveau 1 sans choix de lignée. | Présent. **Partiel** sur la validation complète des effets. | Système ; traits nains. | Aucun lignage demandé ; PV, vitesse, vision et traits calculés avec provenance. | SF-002. |
| B01-ESP-005 | PHB24 p. 189–190, `races/elf.json` | L'Elfe choisit Drow, Haut-elfe ou Elfe des bois et la caractéristique d'incantation autorisée pour les sorts de lignée ; Sens aiguisés choisit une compétence autorisée. | Trois lignages, caractéristique et compétence présents ; contrôle serveur partiel au-delà du lignage/compétence. **Partiel**. | Créateur ; lignage, caractéristique, compétence. | Un et un seul choix dans chaque catalogue ; sorts/vision/vitesse proviennent du lignage choisi. | SF-002. |
| B01-ESP-006 | PHB24 p. 191, `races/gnome.json` | Le Gnome choisit Gnome des forêts ou des roches et la caractéristique d'incantation autorisée. | Présent ; les sorts sont accordés, mais la création d'appareil du Gnome des roches est rattachée à tort à un repos court au lieu d'une durée de 10 minutes, et la fréquence de Communication avec les animaux est contradictoire dans la donnée. **Partiel / donnée incorrecte**. | Créateur ; lignage, caractéristique. | Un lignage et une caractéristique autorisée ; seuls ses traits et sorts sont accordés ; les usages et durées correspondent au livre. | Écarts de donnée pointés ; SF-002. |
| B01-ESP-007 | PHB24 p. 192, OFF-ERR, `races/goliath.json` | Le Goliath choisit exactement une ascendance gigante parmi les six proposées. | Six options présentes et lignage validé ; la donnée locale emploie bien des tests de caractéristique pour mettre fin à Agrippé, conformément à l'errata officiel. **Partiel** sur la validation complète des effets. | Créateur ; ascendance. | Une option connue obligatoire ; ressources et trait portent sa provenance ; Forte carrure accorde l'Avantage au test de caractéristique effectué pour mettre fin à Agrippé, sans lui substituer un jet de sauvegarde. | Correction factuelle post-validation selon OFF-ERR ; SF-002. |
| B01-ESP-008 | PHB24 p. 193, `races/halfling.json` | Le Halfelin reçoit ses traits de niveau 1 sans choix de lignée. | Les quatre textes existent, mais sans clés ni effets structurés. **Partiel**. | Système ; traits halfelins. | Aucun lignage demandé ; taille P et traits visibles avec provenance et effets calculables. | SF-002. |
| B01-ESP-009 | PHB24 p. 194, `races/human.json` | L'Humain choisit P ou M, une compétence et un don d'Origine additionnel ; tous les paramétrages du don choisi sont complétés. | Compétence et don proposés ; la donnée locale fixe à tort la taille à M et le choix n'est ni persisté ni validé ; choix du don non validé exhaustivement au backend. **Partiel**. | Créateur ; taille, compétence, don et sous-choix. | Un choix de chaque type ; don limité aux dons d'Origine éligibles ; choix imbriqués exacts. | Écart de donnée explicite sur la taille ; SF-002. |
| B01-ESP-010 | PHB24 p. 195, `races/orc.json` | L'Orc reçoit ses traits de niveau 1 sans choix de lignée. | Présent. **Partiel** sur la validation complète des effets. | Système ; traits orcs. | Aucun lignage demandé ; vitesse, vision, ressources et traits ont leur provenance. | SF-002. |
| B01-ESP-011 | PHB24 p. 196, `races/tiefling.json` | Le Tieffelin choisit P ou M, un héritage fiélon parmi Abyssal, Chthonien ou Infernal et la caractéristique d'incantation autorisée. | Héritages et caractéristique présents ; la donnée locale fixe à tort la taille à M et le choix n'est ni persisté ni validé. **Partiel**. | Créateur ; taille, héritage, caractéristique. | Trois choix valides et indépendants ; résistance et sorts correspondent uniquement à l'héritage. | Écart de donnée explicite sur la taille ; SF-002. |
| B01-ESP-012 | PHB24 p. 186, 194 et 196, SF-002, DEC-008 | La catégorie de taille D&D est persistée séparément de la taille physique et limitée aux options de l'espèce ; Aasimar, Humain et Tieffelin choisissent P ou M. Elle devient immuable après acceptation. | Le moteur utilise toujours la taille par défaut de l'espèce. **Manquant pour les espèces à choix**. | Créateur, système ; catégorie P/M. | Refus d'une taille interdite ; réouverture fidèle ; calculs de fiche et pion utilisent le choix ; refus après acceptation. | DEC-008 ; SF-002. |

## Matrice — historiques, langues, outils et dons d'Origine

Chaque historique octroie deux compétences, une maîtrise d'outil, un don d'Origine et
un choix entre son paquetage A et 50 po. Il rend trois caractéristiques éligibles aux
bonus. Les seize lignes ci-dessous ont été vérifiées dans `PHB24` : Acolyte/Artisan
p. 177, Charlatan/Criminel p. 178, Artiste/Fermier p. 179, Garde/Guide p. 180,
Ermite/Marchand p. 181, Noble/Sage p. 182, Marin/Scribe p. 183 et
Soldat/Voyageur p. 184.

| ID | Historique | Caractéristiques | Compétences | Outil | Don d'Origine | État actuel |
|---|---|---|---|---|---|---|
| B01-HIS-ACOLYTE | Acolyte | INT, SAG, CHA | Intuition, Religion | Matériel de calligraphe | Initié à la magie (Clerc) | Référencé ; sous-choix non validés au backend. **Partiel**. |
| B01-HIS-ARTISAN | Artisan | FOR, DEX, INT | Investigation, Persuasion | Outils d'artisan au choix | Façonneur | Choix d'outil absent. **Partiel**. |
| B01-HIS-CHARLATAN | Charlatan | DEX, CON, CHA | Escamotage, Tromperie | Matériel de contrefaçon | Doué | Sous-choix du don non validés au backend. **Partiel**. |
| B01-HIS-CRIMINAL | Criminel | DEX, CON, INT | Escamotage, Discrétion | Outils de voleur | Vigilant | Référencé et résolu. **Partiel** sur la validation transverse. |
| B01-HIS-ENTERTAINER | Artiste | FOR, DEX, CHA | Acrobaties, Représentation | Instrument au choix | Musicien | Choix d'instrument absent. **Partiel**. |
| B01-HIS-FARMER | Fermier | FOR, CON, SAG | Dressage, Nature | Outils de charpentier | Robuste | Référencé et résolu. **Partiel** sur la validation transverse. |
| B01-HIS-GUARD | Garde | FOR, INT, SAG | Athlétisme, Perception | Boîte de jeux au choix | Vigilant | Choix de jeu absent. **Partiel**. |
| B01-HIS-GUIDE | Guide | DEX, CON, SAG | Discrétion, Survie | Outils de cartographe | Initié à la magie (Druide) | Sous-choix non validés au backend. **Partiel**. |
| B01-HIS-HERMIT | Ermite | CON, SAG, CHA | Médecine, Religion | Matériel d'herboriste | Guérisseur | Référencé et résolu. **Partiel** sur la validation transverse. |
| B01-HIS-MERCHANT | Marchand | CON, INT, CHA | Dressage, Persuasion | Instruments de navigateur | Chanceux | Référencé et résolu. **Partiel** sur la validation transverse. |
| B01-HIS-NOBLE | Noble | FOR, INT, CHA | Histoire, Persuasion | Boîte de jeux au choix | Doué | Choix de jeu et du don incomplets. **Partiel**. |
| B01-HIS-SAGE | Sage | CON, INT, SAG | Arcanes, Histoire | Matériel de calligraphe | Initié à la magie (Magicien) | Sous-choix non validés au backend. **Partiel**. |
| B01-HIS-SAILOR | Marin | FOR, DEX, SAG | Acrobaties, Perception | Instruments de navigateur | Bagarreur de tavernes | Référencé et résolu. **Partiel** sur la validation transverse. |
| B01-HIS-SCRIBE | Scribe | DEX, INT, SAG | Investigation, Perception | Matériel de calligraphe | Doué | Sous-choix du don non validés au backend. **Partiel**. |
| B01-HIS-SOLDIER | Soldat | FOR, DEX, CON | Athlétisme, Intimidation | Boîte de jeux au choix | Sauvagerie martiale | Choix de jeu absent. **Partiel**. |
| B01-HIS-WAYFARER | Voyageur | DEX, SAG, CHA | Discrétion, Intuition | Outils de voleur | Chanceux | Référencé et résolu. **Partiel** sur la validation transverse. |

Pour chacune des seize lignes, le critère commun est : sélectionner l'historique
accorde exactement ses deux compétences, son outil et son don, limite les bonus à ses
trois caractéristiques, puis impose exactement une option d'équipement. Un client ne
peut ni substituer ni cumuler les octrois d'un autre historique. Trace : `SF-002`.

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B01-ORI-001 | PHB24 p. 37, SF-002 | Le personnage connaît le commun et choisit exactement deux langues standards distinctes parmi Langue des signes commune, Draconique, Nain, Elfique, Géant, Gnome, Gobelin, Halfelin et Orc, en plus de toute langue accordée par une règle. | Commun injecté par le moteur ; aucune étape pour les deux langues ; le catalogue ne distingue pas standard et rare. **Manquant**. | Créateur ; langues et provenance. | Deux langues du catalogue standard, distinctes entre elles ; les octrois automatiques restent séparés et ne réduisent pas ce quota. | Catalogue primaire pointé ; SF-002. |
| B01-ORI-002 | PHB24 p. 37, 80 et 128, DATA-CLA | Les langues ou codes de classe, dont le druidique et le jargon des voleurs ainsi que la langue additionnelle du Roublard, s'ajoutent sans remplacer les deux langues standards. | Druidique et jargon seulement informatifs ; choix de langue du Roublard non exposé. **Manquant / partiel**. | Créateur, système ; langues de classe. | Chaque octroi apparaît avec sa provenance ; le choix additionnel respecte son catalogue et son quota. | Catalogues primaires pointés ; SF-002. |
| B01-ORI-003 | PHB24 p. 177–184 et 220–221, DATA-HIS, DATA-CLA, DATA-EQP | Tout choix d'outil, d'instrument ou de boîte de jeux désigne un élément concret du catalogue autorisé. Les maîtrises et les objets de paquetage restent deux données distinctes mais cohérentes. | Des libellés génériques et `toolChoice` existent ; aucune étape générale ni validation serveur. **Manquant / partiel**. | Créateur ; maîtrise d'outil et objet éventuel. | Quota exact, option concrète, aucune valeur libre, cohérence entre le choix de paquetage et l'objet qu'il promet. | Catalogues primaires pointés ; SF-002. |
| B01-ORI-004 | PHB24 p. 177–184 et 200–202, DATA-DON | Les dix dons d'Origine PHB sont Vigilant, Façonneur, Guérisseur, Chanceux, Initié à la magie, Musicien, Sauvagerie martiale, Doué, Bagarreur de tavernes et Robuste. Le don d'historique est imposé ; seuls les octrois qui autorisent un choix en ajoutent un. | Dix dons dans le domaine ; le seed contient aussi huit dons de cadre hors PHB et ne peut servir de filtre brut. **Partiel / données obsolètes hors périmètre**. | Système, créateur ; don et source. | Aucun des huit dons additionnels du seed n'apparaît dans B01 ; le don imposé ne peut être remplacé. | Inventaire primaire pointé ; SF-002. |
| B01-ORI-005 | PHB24 p. 201, DATA-DON | Initié à la magie choisit la liste autorisée, la caractéristique autorisée, exactement deux sorts mineurs et un sort niveau 1 de cette liste ; le sort niveau 1 est toujours préparé et possède son usage gratuit après chaque repos long. | Interface présente ; quotas agrégés avec ceux de classe et backend permissif. **Partiel**. | Créateur ; liste, caractéristique, trois sorts. | Listes, niveaux, quotas, unicité et usage gratuit validés par source, même en présence d'une classe de lanceur. | SF-002. |
| B01-ORI-006 | PHB24 p. 200–202, DATA-DON | Façonneur choisit trois outils d'artisan ; Musicien trois instruments ; Doué trois maîtrises dans toute combinaison compétences/outils. | Modèle d'effets décrit les quotas ; seuls les choix de Doué sont partiellement exposés, sans validation backend. **Partiel**. | Créateur ; choix propres au don. | Chaque don impose son catalogue et son quota exact ; aucun doublon ne crée une seconde maîtrise. | Catalogues primaires pointés ; SF-002. |

## Matrice — classes et choix de niveau 1

Chaque ligne comprend les maîtrises fixes, les sauvegardes, les compétences, les PV,
l'équipement et toutes les capacités du niveau 1, même lorsque seules les sélections
sont résumées ci-dessous.

| ID | Classe | Cible et sélections de niveau 1 | État actuel / qualification | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|
| B01-CLA-BAR | Barbare | 2 compétences autorisées ; Rage, Défense sans armure ; 2 maîtrises d'armes choisies. | Compétences et capacités présentes ; sélection des armes absente. **Partiel**. | Deux compétences et deux armes éligibles exactes ; PV/CA/Rage justifiés. | PHB24 p. 50–52 ; DATA-CLA ; SF-002. |
| B01-CLA-BARD | Barde | 3 compétences au choix ; 3 instruments au choix ; Inspiration bardique ; 2 sorts mineurs, 4 sorts préparés, 2 emplacements niveau 1. | Instruments absents ; sorts seulement filtrés/quotés au front. **Partiel**. | Quotas exacts par liste de Barde ; trois instruments concrets ; ressource d'Inspiration exacte. | PHB24 p. 58–60 ; DATA-CLA ; SF-002. |
| B01-CLA-CLR | Clerc | 2 compétences autorisées ; Ordre divin Protecteur ou Thaumaturge ; 3 sorts mineurs, plus celui éventuel de l'ordre, 4 sorts préparés, 2 emplacements niveau 1. | Ordre et quotas visibles ; ordre et sorts non validés exhaustivement au backend. **Partiel**. | Un ordre exact ; ses maîtrises ou sort supplémentaire appliqués ; liste et quotas exacts. | PHB24 p. 68–70 ; DATA-CLA ; SF-002. |
| B01-CLA-DRU | Druide | 2 compétences autorisées ; Druidique ; Ordre primitif Gardien ou Magicien ; 2 sorts mineurs, plus celui éventuel de l'ordre, 4 sorts préparés, 2 emplacements. | Ordre présent ; Druidique informatif ; validation serveur incomplète. **Partiel**. | Un ordre exact ; langue et effets accordés ; liste et quotas exacts. | PHB24 p. 78–80 ; DATA-CLA ; SF-002. |
| B01-CLA-FTR | Guerrier | 2 compétences autorisées ; un don de Style de combat éligible ; Second souffle ; 3 maîtrises d'armes choisies. | Style visible, capacités présentes ; style non validé au backend et armes non choisies. **Partiel**. | Un style du catalogue niveau 1 et trois armes éligibles ; ressources et effets justifiés. | PHB24 p. 90–92 ; DATA-CLA ; SF-002. |
| B01-CLA-MNK | Moine | 2 compétences autorisées ; un outil d'artisan ou instrument au choix ; Arts martiaux et Défense sans armure. | Capacités présentes ; choix d'outil absent. **Partiel**. | Outil concret du bon catalogue ; CA et attaque à mains nues calculées selon les conditions. | PHB24 p. 100–102 ; DATA-CLA ; SF-002. |
| B01-CLA-PAL | Paladin | 2 compétences autorisées ; Imposition des mains ; 2 maîtrises d'armes choisies ; 2 sorts préparés et 2 emplacements niveau 1. | Capacités et sorts présents ; armes absentes, validation des sorts incomplète. **Partiel**. | Deux armes et deux sorts exacts ; réserve de soins, DD et emplacements justifiés. | PHB24 p. 108–110 ; DATA-CLA ; SF-002. |
| B01-CLA-RGR | Rôdeur | 3 compétences autorisées ; Ennemi juré avec Marque du chasseur ; 2 maîtrises d'armes choisies ; 2 sorts préparés et 2 emplacements. | Capacité et sorts présents ; armes absentes, validation des sorts incomplète. **Partiel**. | Deux armes et deux sorts exacts ; usages gratuits de Marque du chasseur distincts des emplacements. | PHB24 p. 118–120 ; DATA-CLA ; SF-002. |
| B01-CLA-ROG | Roublard | 4 compétences autorisées ; maîtrise des outils de voleur ; Expertise sur deux compétences maîtrisées, y compris celles reçues d'une autre source, mais jamais sur un outil ; Attaque sournoise, jargon des voleurs, une langue additionnelle ; 2 maîtrises d'armes choisies. | L'interface limite l'Expertise aux compétences de classe ; outils, langue et armes absents ; backend ne valide pas l'Expertise. **Partiel**. | Toute compétence déjà maîtrisée est éligible quelle que soit sa source ; un outil est refusé pour l'Expertise ; quotas exacts. | PHB24 p. 128–130 ; DATA-CLA ; SF-002. |
| B01-CLA-SOR | Ensorceleur | 2 compétences autorisées ; Sorcellerie innée ; 4 sorts mineurs, 2 sorts préparés, 2 emplacements. | Présent côté interface/moteur ; validation de liste et quotas au backend incomplète. **Partiel**. | Liste, niveau, unicité et quotas exacts ; deux usages de Sorcellerie innée, DD augmenté et avantage aux attaques magiques justifiés. | PHB24 p. 138–140 ; DATA-CLA ; SF-002. |
| B01-CLA-WLK | Occultiste | 2 compétences autorisées ; exactement 1 Manifestation occulte parmi Armure d'ombres, Esprit occulte, Pacte de la chaîne, Pacte de la lame et Pacte du grimoire, avec tous ses sous-choix ; 2 sorts mineurs, 2 sorts préparés, 1 emplacement de pacte niveau 1. | Capacité informative seulement ; aucune sélection d'invocation ; les prérequis ne sont pas structurés pour la validation. **Manquant / partiel**. | Une des cinq options exactes ; les options niveau 2+ sont refusées ; choix imbriqués validés ; emplacement récupéré au repos court ou long. | PHB24 p. 152–156 ; DATA-CLA ; SF-002. |
| B01-CLA-WIZ | Magicien | 2 compétences autorisées ; 3 sorts mineurs ; grimoire initial de 6 sorts niveau 1 ; 4 sorts préparés choisis parmi le grimoire ; 2 emplacements ; Savoir rituel et Restauration magique. | Le grimoire n'existe pas ; 4 sorts sont traités comme préparés directement. **Manquant / partiel**. | Six sorts uniques de Magicien dans le grimoire, quatre préparés inclus dans ces six ; rituels consultent le grimoire ; quotas exacts. | PHB24 p. 164–166 ; DATA-CLA ; SF-002. |

| ID | Source | Cible transverse | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B01-CLA-001 | PHB24 p. 36 et pages de classe, DATA-CLA | Les compétences choisies respectent le quota et la liste de leur source. Une même maîtrise ne se cumule pas : si un choix de classe ou d'espèce recoupe une maîtrise fixe déjà reçue, le créateur choisit une autre option dans la liste d'origine. La règle 2014 de remplacement ouvert par une maîtrise « du même type » n'est pas reconduite. | Quotas et listes de classe validés ; les doublons globaux sont refusés. **Partiel** sur le guidage et la provenance. | Créateur ; compétences et provenance. | Toute composition termine avec le nombre de maîtrises attendu ; le remplacement reste dans la liste de la capacité concernée ; aucune double maîtrise ne consomme silencieusement un choix. | Lecture stricte du corpus 2024 ; SF-002. |
| B01-CLA-002 | PHB24 p. 50, 90, 108, 118, 128 et 213–216, DATA-CLA, DATA-EQP | Les maîtrises d'armes fixes et les choix de Botte/maîtrise d'arme sont distincts. Chaque choix désigne une arme éligible et ne dépasse pas le quota de classe. | Familles de maîtrises fixes présentes ; aucun choix concret de maîtrise d'arme. **Manquant**. | Créateur ; armes choisies et provenance. | Quota exact pour Barbare 2, Guerrier 3, Paladin 2, Rôdeur 2, Roublard 2 ; arme inconnue/inéligible refusée. | Catalogue primaire pointé ; SF-002. |
| B01-CLA-003 | PHB24 p. 208–210, DATA-CLA | Le Guerrier choisit exactement un des dix dons de Style de combat PHB : Archerie, Arme à deux mains, Arme de lancer, Combat à deux armes, Combat à mains nues, Combat en aveugle, Défense, Duel, Interception ou Protection. | Les dix styles locaux correspondent à l'inventaire ; sélection front, collector permissif. **Partiel**. | Créateur ; style. | Exactement un style de cette liste ; aucune clé libre ; effet attribué avec provenance. | Inventaire primaire pointé ; SF-002. |
| B01-CLA-004 | PHB24 p. 155–156, DATA-INV | Une Manifestation occulte de niveau 1 qui accorde un pacte ou des sorts déclenche tous les sous-choix nécessaires et respecte récursivement leurs règles. | Les 28 invocations et leurs prérequis textuels existent localement, mais aucune règle structurée ne filtre les cinq options de niveau 1 ni ne compose leurs effets. **Manquant**. | Créateur ; invocation et choix imbriqués. | Pacte du grimoire impose trois sorts mineurs et deux rituels de niveau 1 de n'importe quelle classe qui ne sont pas déjà préparés ; Pacte de la chaîne matérialise une forme normale ou l'un des huit familiers spéciaux ; Pacte de la lame matérialise une arme de mêlée simple ou de guerre et ses paramètres. | Sous-ensemble niveau 1 pointé ; SF-002. |

## Matrice — sorts

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B01-SOR-001 | PHB24 p. 331, OFF-UPD, DATA-SOR | L'inventaire PHB 2024 contient 391 sorts, avec niveau, listes de classes et propriétés nécessaires aux choix de création. | Le seed contient 390 sorts. La comparaison des identités, après normalisation des apostrophes, identifie **Télépathie (`telepathy`)** comme seule entrée absente ; le livre confirme un sort de Divination niveau 8 du Magicien, action, portée illimitée, composantes V/S/M et durée 24 heures. **Manquant**. | Système ; catalogue de sorts. | Ajout futur de l'identité `telepathy` puis écart nul avec les 391 identités ; le contenu local est rédigé sans copier le texte protégé. | Écart confirmé dans la source primaire ; le sort n'est pas sélectionnable au niveau 1 ; SF-002. |
| B01-SOR-002 | DATA-SOR, DATA-CLA | Chaque source d'incantation possède ses propres liste, caractéristique, nature de sélection et quotas ; les sorts de classe, de don, d'espèce, d'invocation et du grimoire ne sont jamais agrégés pour satisfaire le quota d'une autre source. | Le front additionne les sorts de classe et de don pour vérifier les quotas ; backend ne valide pas les listes. **Partiel, contraire à la cible**. | Créateur, système ; choix groupés par source. | Chaque source reste valide isolément ; un sort du don ne comble pas une place de classe et inversement. | SF-002. |
| B01-SOR-003 | DATA-SOR | Les quotas sont exacts, les sorts sont uniques lorsque la règle l'exige, le niveau est autorisé et chaque sort appartient à la bonne liste. | Validité front utilise `>=` ; backend accepte des clés arbitraires et classe une clé inconnue comme sort non mineur. **Partiel, incohérence d'autorité**. | Système ; clés de sorts. | Refus d'un choix en trop, en moins, du mauvais niveau, de la mauvaise liste, dupliqué ou inconnu. | SF-002. |
| B01-SOR-004 | DATA-CLA | Les sorts toujours préparés et les lancements gratuits sont ajoutés sans consommer les quotas ordinaires ni créer d'emplacement supplémentaire. | Certains octrois existent dans les effets, mais fréquence et quotas ne sont pas tous représentés distinctement. **Partiel**. | Système ; sorts accordés, usages, emplacements. | Marque du chasseur, Initié à la magie et traits d'espèce conservent leur source, fréquence et relation aux emplacements. | SF-002. |
| B01-SOR-005 | DATA-CLA | Le grimoire du Magicien est un ensemble distinct des sorts préparés et reste la source des rituels. | Aucune donnée de grimoire. **Manquant**. | Créateur, système ; grimoire, préparation. | Les 4 préparés sont inclus dans les 6 du grimoire ; un rituel non préparé mais inscrit reste disponible comme rituel. | SF-002. |

## Matrice — équipement, or, port et babiole

`PHB24` p. 36 autorise normalement la dépense immédiate de l'or de départ et une
babiole sans coût ; la table des cent babioles p. 46–47 ne donne aucun prix. `DEC-008`
conserve la gratuité officielle de la babiole, mais interdit les achats pendant la
création.

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B01-EQP-001 | PHB24 p. 36, 50–166 et 177–184, DATA-CLA, DATA-HIS | Le joueur choisit exactement une option d'équipement de classe et une d'historique ; le Guerrier possède trois options, les autres classes et chaque historique deux. | Options et identifiants présents ; interface exige les deux. Le backend ne prouve pas que l'inventaire correspond aux options. **Partiel**. | Créateur ; deux identifiants d'option. | Options connues et compatibles avec classe/historique ; refus d'une option manquante ou provenant d'une autre source. | Paquetages primaires pointés ; SF-002. |
| B01-EQP-002 | PHB24 p. 36 et 213, DATA-EQP | L'inventaire et l'or sont calculés côté serveur depuis les deux options ; la babiole éventuelle s'ajoute gratuitement. Ces conséquences ne sont jamais acceptées comme données libres envoyées par le client. | Le front calcule et envoie objets/or ; backend vérifie seulement l'existence des objets et un or non négatif. **Partiel, incohérence d'autorité**. | Système ; inventaire, quantités, or. | Toute altération client d'objet, quantité ou or est refusée ou ignorée au profit du recalcul serveur ; une babiole ne modifie jamais l'or. | SF-002. |
| B01-EQP-003 | PHB24 p. 177–184 et 220–233, DATA-EQP | Un choix générique du paquetage (outil, instrument, jeu, focaliseur) est résolu en objet concret lorsque la règle le demande. | Plusieurs entrées génériques sont persistées ; certains objets promis par le libellé sont omis. **Partiel**. | Créateur ; choix d'objet. | L'inventaire final contient l'objet concret choisi, sans objet inventé ni promesse non matérialisée. | Catalogues primaires pointés ; SF-002. |
| B01-EQP-004 | PHB24 p. 36 et 46–47, SF-002, DEC-008 | Une babiole facultative et gratuite peut être choisie parmi les cent entrées du PHB. | Aucun catalogue ni champ. **Manquant**. | Créateur, système ; babiole. | Absence acceptée ; choix connu ajouté une fois ; l'or reste strictement identique avec ou sans babiole. | DR-B01-04 résolue ; DEC-008. |
| B01-EQP-005 | DEC-008 | Aucun magasin, catalogue d'achat ou autre achat n'est possible pendant la création. | L'interface ne propose que les paquetages. **Conforme côté interface**, backend encore permissif sur l'inventaire envoyé. | Créateur, système. | Aucun objet hors paquetage/babiole ne peut être ajouté, même via un client modifié. | DEC-008 ; SF-002. |
| B01-EQP-006 | PHB24 p. 40 et 219, DATA-EQP | Le personnage ne peut déclarer porté qu'une armure ou un bouclier possédé ; la fiche distingue possession, port, entraînement et conséquences. | Interface limite le port aux objets reçus ; backend vérifie qu'une clé est une armure mais pas son appartenance au paquetage, et le booléen bouclier n'est pas relié à l'objet. **Partiel**. | Créateur, système ; objets portés. | Refus d'une armure/bouclier non possédé ; CA et désavantage de Discrétion justifiés ; entraînement affiché séparément. | SF-002. |

## Matrice — fiche initiale et justification

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B01-FIC-001 | PHB24 p. 40–41, SF-002, DATA-CLA | Le serveur calcule au minimum scores/modificateurs, bonus de maîtrise, PV max et actuels initiaux, dé de vie, CA, initiative, vitesse, perception passive, sauvegardes, 18 compétences, maîtrises, langues, attaques, sorts, DD/bonus d'attaque magique, capacités et ressources. | Une fiche calculée couvre une grande partie de cette liste ; PV actuels, attaques d'armes, choix manquants et état validé ne sont pas complets. **Partiel**. | Système ; build validé et équipement. | Aucun dérivé mécanique n'est accepté depuis le client ; toutes les valeurs se recalculent à résultat identique. | Limite exacte avec B04 à confirmer lors de sa rédaction ; SF-002. |
| B01-FIC-002 | PHB24 p. 40–41, DATA-CLA, DATA-ESP, DATA-DON | Les PV max niveau 1 valent le maximum du dé de vie plus le modificateur de Constitution et les bonus applicables ; les PV actuels initiaux valent les PV max. | PV max calculés avec traits/dons ; minimum normatif et PV actuels initiaux non représentés dans B01. **Partiel**. | Système ; classe, CON, effets. | Cas Nain/Robuste/cumul vérifié ; provenance de chaque contribution ; valeur initiale d'état cohérente. | Règle primaire pointée ; SF-002, futur lien B04. |
| B01-FIC-003 | SF-002 | Chaque valeur dérivée expose ses contributions lisibles sans ralentir le parcours principal. | `ResolvedValue.sources` existe pour PV, CA, initiative et vitesse ; couverture incomplète. **Partiel**. | Joueur, MJ ; valeur et sources. | Pour chaque valeur affichée, le détail permet de recomposer exactement le résultat. | SF-002. |
| B01-FIC-004 | SF-002 | La prévisualisation et la fiche persistée utilisent le même moteur serveur et donnent le même résultat pour la même composition. | Même résolveur de domaine utilisé. **Conforme sur le principe**, entrées insuffisamment validées. | Système ; composition. | Égalité champ par champ avant/après création, hors identité technique et statut. | SF-002. |

## Matrice — soumission et validation MJ

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B01-VAL-001 | SF-002, DEC-003 | La création complète est soumise au MJ en un geste ; aucune autosauvegarde supplémentaire de brouillon n'est exigée. | Création complète en un geste. **Conforme sur l'absence de brouillon**, mais elle crée directement un personnage sans soumission distincte. | Créateur ; build complet. | Une composition locale incomplète n'est pas persistée ; une soumission complète crée l'état soumis. | DEC-003 ; SF-002. |
| B01-VAL-002 | SF-002 | Une fiche soumise est inutilisable en combat tant qu'un MJ ne l'a pas acceptée. | Seul statut `waiting_adventure`, sans acceptation/refus. **Manquant**. | MJ, système ; statut. | Toute commande de combat est refusée avant acceptation et permise ensuite selon les autres règles. | SF-002. |
| B01-VAL-003 | SF-002, DEC-003 | Tout MJ actif de la campagne peut accepter ou refuser seul une fiche ; une fiche créée par un MJ peut être acceptée immédiatement par ce même MJ. | Workflow absent. **Manquant**. | MJ ; décision et auteur. | Un MJ inactif ou extérieur est refusé ; acceptation horodatée et appliquée à la bonne version de fiche ; aucune seconde approbation n'est requise. | DR-B01-02 résolue ; SF-002. |
| B01-VAL-004 | SF-002, DEC-003 | Un refus comporte obligatoirement un motif visible du créateur. Le créateur corrige la fiche refusée et la resoumet ; cette soumission remplace la version à examiner sans effacer le dernier motif ni l'historique des décisions. | Workflow, motif et version de soumission absents. **Manquant**. | MJ, créateur ; motif, version et audit. | Refus sans motif rejeté ; seul le créateur modifie puis resoumet ; l'ancienne version n'est plus examinable, mais les décisions restent auditables ; aucune version refusée ne combat. | DR-B01-03 résolue ; SF-002. |
| B01-VAL-005 | SF-002, DEC-003 | Après acceptation, nom, alignement, espèce, lignée/héritage, historique, taille physique et catégorie de taille sont immuables ; classe/caractéristiques exigent une respécialisation. | Aucune frontière d'acceptation. **Manquant**. | Créateur, MJ ; champs verrouillés. | Chaque mutation interdite échoue au serveur ; portrait, description, âge et poids restent modifiables. | DEC-003, DEC-008 ; SF-002. |
| B01-VAL-006 | SF-001 | La fiche complète et le détail de construction ne sont visibles que par son joueur assigné et les MJ de la campagne. | Visibilité actuelle plus large selon l'audit. **Partiel, écart critique**. | Joueur, MJ ; fiche et build. | Un autre joueur reçoit un refus même s'il connaît l'identifiant ; tous les MJ autorisés accèdent à la fiche. | DEC-002 ; SF-001. |

## État des données au moment de la validation

| Donnée | État au 20 août 2026 |
|---|---|
| Références de création 2024 | `PHB24` local indexé ; tous les domaines B01 ont une plage de pages primaire. |
| Aasimar niveau 1 | Confirmé p. 186 : choix P/M, quatre traits fixes, aucun choix de Révélation céleste avant le niveau 3. |
| Inventaire des 391 sorts | Écart confirmé p. 331 : `telepathy` manque au seed local. |
| Langues standards et rares | Catalogues confirmés p. 37 ; deux choix standards en plus du commun. |
| Historiques | Seize lignes et paquetages confirmés p. 177–184 ; aucune divergence de contenu dans la matrice. |
| Espèces | Dix entrées confirmées p. 186–196 ; Aasimar absent, taille P de l'Humain et du Tieffelin non représentable, et écarts structurés pointés pour Gnome et Halfelin. Forte carrure du Goliath est conforme à OFF-ERR. |
| Outils, instruments et boîtes de jeux | Catalogues primaires et choix de création pointés p. 177–184 et 220–221. |
| Armes et maîtrises d'armes niveau 1 | Catalogues et quotas des cinq classes pointés p. 50–166 et 213–216. |
| Dons de Style de combat | Dix dons confirmés p. 208–210 ; ils correspondent aux dix entrées locales. |
| Manifestations occultes | Cinq options sans prérequis de niveau confirmées p. 155–156 ; leurs sous-choix sont spécifiés. |
| Babioles | Cent entrées confirmées p. 46–47 ; le PHB les rend gratuites et ne fournit aucune valeur monétaire. |

## Décisions du bloc

### DR-B01-01 — Source primaire exploitable

**Résolue le 20 août 2026 :** les références initialement dénichées sur internet ont
été recoupées avec le `PHB24` fourni localement. Le livre est désormais la source
primaire du bloc ; l'errata et les pages officielles complètent le contrôle, et AideDD
ne sert plus à trancher une règle B01.

### DR-B01-02 — Autorité de validation avec plusieurs MJ

**Résolue le 19 août 2026 :** tout MJ actif de la campagne peut accepter ou refuser
seul une fiche.

### DR-B01-03 — Cycle après refus

**Résolue le 19 août 2026 :** la recommandation est validée. Le créateur corrige puis
resoumet ; la version à examiner est remplacée, le dernier motif et les décisions de
validation restent auditables.

### DR-B01-04 — Valeur produit des babioles

**Résolue le 20 août 2026 :** les cent babioles conservent leur gratuité officielle.
Leur sélection ne modifie jamais l'or de départ. `DEC-008` est mis à jour en
conséquence.

## Correction factuelle post-validation

Le 20 août 2026, B01-ESP-007 a été corrigée sans rouvrir la validation du bloc :
OFF-ERR remplace le jet de sauvegarde imprimé par un test de caractéristique. La donnée
locale utilisant déjà un test de caractéristique est conforme sur ce point. Le nombre
de règles et les décisions produit ne changent pas.

## Vérification du bloc

Le bloc est validé le 20 août 2026 :

- les 85 règles ont une source, une cible, un état actuel et des critères
  d'acceptation ;
- les quatre décisions du bloc sont résolues ;
- le propriétaire a validé explicitement la matrice ;
- `REQUIREMENTS.md`, `GAP-ANALYSIS.md` et `TRACEABILITY.md` sont synchronisés ;
- aucun code, test, seed, migration, dépendance ou CI n'a été modifié.

Cette validation clôt la spécification B01. Elle ne signifie pas que les écarts
répertoriés sont implémentés ou vérifiés par des tests.
