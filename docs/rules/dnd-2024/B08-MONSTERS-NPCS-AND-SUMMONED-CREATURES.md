# B08 — Monstres, PNJ et créatures invoquées

## Statut

**SPÉCIFICATION VALIDÉE PAR LE PROPRIÉTAIRE LE 20 AOÛT 2026.**

Les décisions `DR-B08-01` à `DR-B08-05` ont été validées par le propriétaire le
20 août 2026. Le même jour, le propriétaire a désigné 5e.tools comme référence
versionnée de contrôle et de reprise des données XMM. Ces décisions sont intégrées
ci-dessous.

Ce document inventorie le bloc B08 défini dans
[`DND-2024-COMPLIANCE-PLAN.md`](../../DND-2024-COMPLIANCE-PLAN.md). Il décrit la
cible et les écarts observés ; il n'autorise aucune implémentation.

Le bloc couvre 91 règles fonctionnelles, 10 constats d'implémentation, 503 profils XMM
et 15 profils PHB paramétrés. Le référentiel local reste incomplet ou non exécutable :
89 profils ont au moins une description d'action ou de trait vide ou réduite à son
titre, deux divergent de XMM et cinq profils XMM manquent.

## Sources et conventions

### Sources normatives disponibles

- `PHB24` — [`PlayersHandbook2024.pdf`](../../books/PlayersHandbook2024.pdf), source
  primaire locale ; les pages citées sont celles imprimées ;
- `DMG24` — [`DungeonMasterGuide2024.pdf.pdf`](../../books/DungeonMasterGuide2024.pdf.pdf),
  source primaire locale ;
- `OFF-ERR-PHB` — [errata officiel du *Player's Handbook 2024*](https://media.dndbeyond.com/compendium-images/errata/PHB-24/PHB-2024_v1.pdf),
  version 1.0 ;
- `OFF-ERR-DMG` — [errata officiel du *Dungeon Master's Guide 2024*](https://media.dndbeyond.com/compendium-images/errata/DMG-24/DMG-24_v1.pdf),
  version 1.0 ;
- `OFF-ERR-MM` — [errata officiel du *Monster Manual 2025*](https://media.dndbeyond.com/compendium-images/errata/MM-25/MM-2025_v1.pdf),
  version 1.0 ;
- `DATA-XMM` — [*Monster Manual 2025* dans 5e.tools](https://5e.tools/book.html#xmm,1),
  référence tierce désignée par le propriétaire, figée sur la
  [release `v2.33.3`](https://github.com/5etools-mirror-3/5etools-src/releases/tag/v2.33.3) ;
- `DATA-XMM-PROFILES` — [503 profils XMM versionnés](https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/v2.33.3/data/bestiary/bestiary-xmm.json),
  SHA-256 `f798d3294092ea9bd7b1e081b68e3c1d514c12f14d1b6817a1d9f6f9dd591b47` ;
- `DATA-XMM-FLUFF` — [588 entrées descriptives et références d'illustrations](https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/v2.33.3/data/bestiary/fluff-bestiary-xmm.json) ;
- `DATA-XMM-LEGENDARY` — [groupes légendaires versionnés](https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/v2.33.3/data/bestiary/legendarygroups.json),
  dont 23 groupes XMM ;
- `SF-001`, `SF-003`, `SF-004` et `SF-005` dans
  [`REQUIREMENTS.md`](../../REQUIREMENTS.md) ;
- [`DEC-002`](../../DECISIONS/002-roles-and-visibility.md),
  [`DEC-004`](../../DECISIONS/004-combat-and-realtime.md),
  [`DEC-005`](../../DECISIONS/005-dice-rest-and-loot.md),
  [`DEC-009`](../../DECISIONS/009-adventure-state-and-corrections.md),
  [`DEC-010`](../../DECISIONS/010-common-combat-engine.md),
  [`DEC-011`](../../DECISIONS/011-spells-and-magical-effects.md) et
  [`DEC-012`](../../DECISIONS/012-equipment-items-and-possessions.md), ainsi que
  [`DEC-013`](../../DECISIONS/013-monsters-npcs-and-summoned-creatures.md) ;
- les matrices validées [`B01`](B01-LEVEL-ONE-CREATION.md),
  [`B02`](B02-LEVELS-TWO-TO-TWENTY.md),
  [`B03`](B03-MULTICLASSING-AND-RESPECIALIZATION.md),
  [`B04`](B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md),
  [`B05`](B05-COMMON-COMBAT-ENGINE.md),
  [`B06`](B06-SPELLS-AND-MAGICAL-EFFECTS.md) et
  [`B07`](B07-EQUIPMENT-ITEMS-AND-PROFICIENCIES.md).

### Source de bestiaire désignée

`MM25` désigne le *Monster Manual 2025*, souvent appelé « Monster Manual 2024 » dans
les données et le code. Le PDF n'est pas présent localement. Le propriétaire a donc
désigné `DATA-XMM` comme référence complète et versionnée pour l'inventaire, les pages,
les profils, habitats, trésors, recharges, usages, groupes légendaires, repaires et
effets régionaux.

5e.tools n'est pas une publication officielle de Wizards of the Coast. La hiérarchie
applicable est : décisions produit, règles PHB/DMG locales, errata officiels, puis
`DATA-XMM`. Une contradiction avec `OFF-ERR-MM` est toujours résolue en faveur de
l'errata. Toute mise à jour de 5e.tools exige une nouvelle release figée, un nouveau
SHA-256 et une comparaison explicite du registre.

Le [registre individuel B08](B08-CREATURE-PROFILE-REGISTRY.md) couvre les 503 profils
XMM et les 15 profils PHB paramétrés. Il conserve identité, page, FP, état local et
application de l'errata sans recopier les textes protégés.

### Pointage primaire contrôlé

| Domaine | Pages contrôlées |
|---|---|
| Combat monté et montures | `PHB24` p. 26–27 et 229–230 |
| Compagnons de classe et familiers | `PHB24` p. 81, 123–124 et 154–157 |
| *Animate Objects*, *Find Familiar*, *Find Steed* et *Giant Insect* | `PHB24` p. 242, 269–273 et 278–279 |
| Neuf profils d'esprits de convocation | `PHB24` p. 322–328 |
| Profils de créatures de l'annexe B | `PHB24` p. 346–359, rendus obsolètes par `OFF-ERR-PHB` |
| Lecture d'un profil et notations | `PHB24` p. 374–375 |
| Création et altérations mineures d'une créature | `DMG24` p. 56–57 |
| Gestion facultative des groupes nombreux | `DMG24` p. 82–83 |
| PNJ détaillés, récurrents et membres du groupe | `DMG24` p. 84–89 |
| Difficulté et budget d'une rencontre | `DMG24` p. 114–116 |
| Comportement, renforts et rythme | `DMG24` p. 116–119 |
| Récompenses et préférences de trésor | `DMG24` p. 120–121 |

Les pages DMG 56–57, 82–89 et 114–121 ainsi que PHB 322–328 et 346–359 ont été
extraites en entier. Les pages structurantes ont aussi été contrôlées visuellement dans
les PDF locaux. Les JSON et pages brutes locales restent des constats non normatifs.

### Limites entre blocs

- B04 persiste PV, ressources, conditions, concentration et mort ; B08 définit les
  valeurs initiales et ressources propres aux profils non joueurs.
- B05 fournit cycle, initiative, tours, actions communes, géométrie, jets, dégâts,
  réactions, renforts et projections ; B08 paramètre ce moteur par profil et contrôleur.
- B06 fixe apparition, contrôle, initiative, durée et disparition d'une invocation ;
  B08 fournit son profil exécutable et son état d'instance.
- B07 définit possession, équipement, montures et objets ; B08 définit la créature qui
  porte, manie ou transporte et les équipements récupérables de son profil.
- B09 orchestre temps fictionnel, butin, investigation et réserve ; B08 fournit FP,
  valeur en PX et préférences nécessaires à la préparation et aux récompenses.
- Les monstres, sorts, capacités, classes et espèces personnalisés restent hors du MVP
  selon `SF-006`. B08 n'ouvre pas leur parcours de création.
- Aucun schéma MongoDB, endpoint, transaction, événement temps réel ni interpréteur de
  règles n'est décidé ici.

## État actuel inspecté

- `docs/characteres/bestiary/monsters.seed.json` contient 513 clés uniques : 498
  profils étiquetés *Monster Manual 2024* et 15 profils PHB créés par classe ou magie ;
- `DATA-XMM` contient 503 profils XMM uniques : 496 possèdent une empreinte scalaire
  locale concordante, `Blink Dog` et `Faerie Dragon Adult` divergent, et les cinq
  Modrons sont absents localement ;
- les 15 profils sans FP sont trois Bêtes du Maître des bêtes, neuf esprits de
  convocation, Insecte géant, Monture d'Outremonde et Objet animé ;
- le seed valide le schéma Zod et chaque clé est unique, mais cette validation contrôle
  surtout la forme : 267 descriptions sont vides, 66 répètent seulement leur titre et
  89 profils sont touchés par au moins l'un de ces défauts ;
- au moins `aarakocre-aeromancien` contient des actions manifestement tronquées ;
  plusieurs profils complexes comme `empyreen`, `kraken`, `solar` et `dracoliche`
  perdent une partie de leurs règles ;
- huit corrections contrôlées sur huit concordent avec `OFF-ERR-MM`, mais le seed ne
  conserve ni page, ni version d'errata, ni URL source ;
- `MonsterSchema` conserve de nombreux mécanismes en chaînes libres : vitesses,
  compétences, résistances, sens, langues, attaques, DD, sorts, recharges et usages ;
- les profils évolutifs réduisent notamment une CA ou des PV formulaires à une valeur
  de base ; ils ne permettent pas de recalculer fidèlement toutes les variantes ;
- le champ `origin: srd` qualifie comme SRD les 513 profils alors que le seed mélange
  contenu MM et PHB ; la provenance fonctionnelle est donc ambiguë ;
- le repository sait lister et lire le référentiel. Une route authentifiée expose le
  bestiaire complet, sans projection MJ dédiée ni interface front ;
- une définition de campagne de même clé peut masquer un profil officiel dans le
  repository, alors que le contenu personnalisé de monstre est hors MVP et que la
  collision rendrait la provenance ambiguë ;
- aucune instance de créature, préparation de rencontre, action exécutable, ressource,
  recharge, contrôleur, PNJ, invocation, récompense ou écran de bestiaire n'existe.

Les qualifications sont **Conforme**, **Partiel**, **Manquant**, **Ambigu**, **Dette**,
**Obsolète** et **Contraire à la cible**.

## Matrice — catalogue, identité et provenance

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B08-CAT-001 | PRODUCT, PHB24 p. 346–359, DATA-XMM | Le catalogue autorisé couvre chaque profil des trois livres de base, y compris profils génériques, animaux, PNJ et créatures créées par classe, sort ou objet. | 503 identités XMM contrôlées ; cinq Modrons absents du seed. **Donnée locale partielle**. | Système, MJ ; identité officielle. | Chaque identité attendue existe une fois ; une identité absente bloque seulement sa sélection et signale la source manquante. | Registre B08. |
| B08-CAT-002 | PHB24 p. 374–375 | Un profil conserve clé stable, nom affiché, ouvrage, page, version et errata appliqué. Nom traduit, nom anglais et alias ne constituent pas l'identité. | Clé et noms présents ; page/version absentes. **Partiel**. | Système ; provenance. | Renommer l'affichage ne recrée pas le profil ; toute valeur est retraçable à une édition précise. | Gouvernance. |
| B08-CAT-003 | OFF-ERR-PHB, DATA-XMM | Les profils PHB de l'annexe B emploient leurs versions MM25 corrigées, tout en conservant la provenance PHB lorsqu'une capacité les référence. | Référence XMM versionnée ; seed sans preuve de version. **Partiel**. | Système ; identité et version. | Ape, Badger et chaque autre profil commun ne divergent pas silencieusement entre deux écrans. | Registre B08. |
| B08-CAT-004 | OFF-ERR-MM | Chaque correction officielle produit une nouvelle version de profil datée ; une instance historique reste relisible avec la version qui l'a créée. | Plusieurs corrections scalaires présentes, aucun versionnement. **Partiel / dette**. | Système, MJ ; version et instance. | Une correction ne réécrit ni ancien combat ni historique ; une nouvelle préparation propose la version courante. | Phase 5 pour stockage. |
| B08-CAT-005 | SF-006 | Un profil officiel ne peut pas être masqué par une identité de campagne de même clé. Les monstres personnalisés n'ont aucun parcours MVP. | Le repository préfère silencieusement le profil de campagne. **Contraire à la cible**. | MJ, système ; portée et identité. | Référence officielle et éventuel futur personnalisé restent distinguables ; aucune collision ne change une rencontre existante. | SF-006, B07-CAT-008. |
| B08-CAT-006 | Gouvernance, registre B08 | Une donnée absente, tronquée ou non vérifiée est explicitement inutilisable mécaniquement ; elle n'est jamais complétée par supposition ni exécutée comme texte fiable. | 89 profils mécaniquement incomplets restent servis et sont qualifiés individuellement. **Contraire à la cible**. | Système, MJ ; statut de qualité. | Sélection d'un profil incomplet avertit ou refuse avant lancement ; aucun coût ou jet n'est inventé en combat. | Registre B08. |
| B08-CAT-007 | PHB24 p. 374–375 | Type, éventuels tags et catégorie de taille sont des valeurs mécaniques distinctes ; le texte traduit ne sert pas de parseur à l'exécution. | Chaînes libres, une taille invalide `TG ou inferieur`. **Partiel / dette**. | Système ; type, tags, taille. | Chaque taille produit l'empreinte B05 exacte ; un tag ne change pas le type principal. | B05-MOV. |
| B08-CAT-008 | B07, DEC-012 | Équipement récupérable, possessions intégrées au profil et simple apparence d'attaque sont distingués. | Champ `Gear` absent. **Manquant**. | MJ, système ; profils et exemplaires. | Une épée listée comme équipement peut rejoindre le butin ; une attaque nommée « Épée » sans équipement ne crée rien. | B07/B09. |
| B08-CAT-009 | PHB24, DMG24, DATA-XMM | Un registre individuel relie chaque profil à ses sources, variantes, état de donnée et familles de règles B08. | 503 profils XMM et 15 profils PHB inventoriés. **Conforme pour la spécification**. | Système, propriétaire ; 518 lignes. | Le total par source et la liste des anomalies sont reproductibles ; chaque profil XMM possède sa page et son état local. | Registre B08 validé. |

## Matrice — contenu exécutable d'un profil

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B08-PRO-001 | PHB24 p. 374–375 | Un profil représente séparément taille, type/tags, alignement suggéré, CA, initiative, PV, dés de vie, vitesses, caractéristiques, sauvegardes, compétences, résistances, vulnérabilités, immunités, équipement, sens, langues, FP, PX, BM et sections d'actions. | Présence partielle, plusieurs champs fusionnés. **Partiel**. | Système, MJ ; définition versionnée. | Chaque élément du profil est restituable et interrogeable sans analyser sa mise en page. | `MM25` requis. |
| B08-PRO-002 | PHB24 p. 374 | L'alignement d'un profil est une suggestion ; le MJ peut fixer l'alignement d'une instance sans modifier la définition. | Alignement de profil présent, instance absente. **Partiel**. | MJ ; alignement effectif. | Deux instances du même profil peuvent diverger ; la divergence ne modifie ni type ni règles. | DMG24 p. 84–86. |
| B08-PRO-003 | PHB24 p. 374 | CA fixe, formule, source défensive et exceptions sont conservées ; une valeur dépendante du niveau de sort ou de l'invocateur n'est pas réduite à sa base. | Entier seulement. **Contraire pour profils évolutifs**. | Système ; formule et paramètres. | *Aberrant Spirit* lancé niveau 4 puis 6 obtient deux CA correctes sans dupliquer le profil. | B08-SUM. |
| B08-PRO-004 | PHB24 p. 374, SF-003 | PV moyens, formule de dés, éventuelle formule magique et maximum effectif sont distincts. Le MJ choisit moyenne ou jet serveur par instance. | Moyenne/dés partiels ; onze PV et douze dés absents. **Partiel**. | MJ, système ; mode et résultat. | Le jet est effectué une fois, persisté et borné par la formule ; reconnexion ne le relance pas. | B05-CYC-004. |
| B08-PRO-005 | PHB24 p. 374 | Initiative conserve modificateur, score fixe et modificateurs situationnels ; un profil magique peut explicitement ne pas en avoir. | Modificateur seul, seize valeurs nulles. **Partiel**. | Système ; initiative de profil. | Le score affiché reste explicable ; une créature partageant un compte ne reçoit aucun jet inventé. | B05-INI. |
| B08-PRO-006 | PHB24 p. 374 | Marche, creusement, escalade, vol, vol stationnaire et nage sont des vitesses structurées en mètres. | Une chaîne française. **Partiel / non exécutable**. | Système ; modes et distances. | Changer de vitesse suit B05 ; `vol 0` et absence de vol restent distincts. | B05-MOV. |
| B08-PRO-007 | PHB24 p. 374 | Les six scores, modificateurs et sauvegardes imprimés sont conservés numériquement et contrôlés sans recalculer une exception de profil. | Valeurs présentes comme nombres et chaînes. **Partiel**. | Système ; caractéristiques. | Un signe, une maîtrise ou une exception ne dépend pas d'un parseur de texte ; le détail du jet cite sa valeur. | B05-ATQ. |
| B08-PRO-008 | PHB24 p. 374 | Chaque compétence conserve bonus total et degré de maîtrise éventuel ; absence et bonus nul sont distincts. | Chaîne libre, 182 absences normales ou ambiguës. **Partiel**. | Système ; compétence et bonus. | Perception passive et Expertise restent cohérentes sans supposer leur formule. | B05-VIS. |
| B08-PRO-009 | PHB24 p. 374 | Résistances, vulnérabilités et immunités de dégâts sont des ensembles typés avec conditions et exceptions propres ; immunités d'état sont séparées. | Quatre chaînes libres, deux valeurs vides. **Partiel / non exécutable**. | Système ; type, exception, source. | Une attaque applique exactement l'ordre B05 ; une résistance conditionnelle n'est pas traitée comme absolue. | B05-DMG. |
| B08-PRO-010 | PHB24 p. 374 | Vision aveugle, vision dans le noir, perception des vibrations, vision lucide et Perception passive conservent type, portée et limites. | Chaîne libre. **Partiel / non exécutable**. | Système ; sens. | Chaque sens répond séparément à visibilité, cachette et illusion ; aucune portée n'est perdue. | B05-VIS, B06. |
| B08-PRO-011 | PHB24 p. 374 | Langues comprises, parlées, incapacité à parler et télépathie avec portée sont structurées. | Chaîne libre. **Partiel / non exécutable**. | Système ; communication. | « Comprend mais ne parle pas » et aucune langue divergent ; télépathie ne devient pas parole. | B08-CTL. |
| B08-PRO-012 | PHB24 p. 374, DMG24 p. 114–116 | FP, PX et BM sont distincts ; `FP aucun`, `PX 0` et `FP 0` ne sont pas interchangeables. | Chaînes et nulls. **Partiel**. | Système ; difficulté et progression du profil. | Une invocation sans FP n'entre pas au budget ; une créature FP 0 conserve sa valeur exacte. | B08-ENC. |
| B08-PRO-013 | PHB24 p. 374–375 | Attaque, sauvegarde, dégâts, cible, portée/allonge, zone, réussite/échec et effets secondaires sont des paramètres exécutables. | Descriptions libres et parfois tronquées. **Manquant**. | Système ; primitive d'action. | Le client ne fournit ni bonus, ni DD, ni dégâts ; moyenne et dés produisent la même règle. | B05-ATQ/DMG. |
| B08-PRO-014 | PHB24 p. 374 | Traits, Actions, Actions Bonus et Réactions sont des sections distinctes ; leur absence est explicite. | Sections présentes mais descriptions non fiables. **Partiel**. | Système ; entrée et coût. | Une Réaction n'apparaît jamais comme Action ; un trait permanent ne consomme aucune action. | B05-ACT/REA. |
| B08-PRO-015 | DATA-XMM, OFF-ERR-MM | Actions légendaires, ressources associées, habitats, groupes et préférences de trésor conservent toutes leurs règles et projections. | Source versionnée disponible ; seed limité aux actions textuelles. **Donnée locale partielle**. | MJ, système ; profil étendu. | Chaque déclencheur, coût, récupération et secret possède un cas testable ; aucune donnée de lore privée ne fuit. | 23 groupes XMM contrôlés. |
| B08-PRO-016 | PHB24 p. 322–328 | Toute valeur dépendante conserve sa formule et ses paramètres : niveau du sort, BM, attaque/DD du lanceur, option choisie et nombre d'attaques. | Bases scalaires et descriptions libres. **Contraire à la cible**. | Système ; profil paramétré. | Recalculer après surclassement modifie seulement les champs prévus et fige le résultat de l'instance. | B06-SPE-004. |
| B08-PRO-017 | PHB24 p. 374, B06 | L'incantation d'un profil structure caractéristique, DD, attaque magique, composantes, sorts, fréquence et niveau de lancement. | Tout reste dans une description d'action. **Manquant**. | Système ; source magique. | `1/jour` et `1/jour chacun` divergent ; un sort sans composante matérielle n'en consomme pas. | OFF-ERR-MM, B06. |

## Matrice — instances, état et cycle de vie

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B08-INS-001 | SF-003, B05-CYC-004 | Chaque participant non joueur est une instance unique qui fixe profil/version, campagne, combat, nom éventuel, camp, contrôleur et état courant. | Aucune instance. **Manquant**. | MJ, système ; identité d'instance. | Deux gobelins ont PV, position, effets et historique indépendants ; supprimer l'un ne touche pas l'autre. | B05. |
| B08-INS-002 | DMG24 p. 84–88 | Une instance de PNJ peut ajouter nom, apparence, personnalité, secret, attitude et altérations autorisées sans transformer ces détails en nouveau profil officiel. | Données absentes. **Manquant**. | MJ ; détails publics/privés. | Le secret est visible des seuls MJ ; changer l'apparence ne modifie aucune statistique. | SF-001. |
| B08-INS-003 | DMG24 p. 56–57 | Taille/type, capacités mentales, langues, maîtrises, sens, sorts équivalents, types de dégâts et traits peuvent être altérés selon le DMG ; toute altération mécanique est explicite et figée sur l'instance. | Aucun parcours. **Manquant**. | MJ, système ; différence au profil. | L'aperçu montre avant/après ; une altération interdite ou incomplète ne lance pas le combat. | Création personnalisée complète hors MVP. |
| B08-INS-004 | B04/B05 | L'instance conserve PV maximum/courants/temporaires, conditions, épuisement, concentration, effets, position, altitude, mouvement et ressources d'action. | État d'aventure et combat absents. **Manquant**. | Système ; état courant. | Chaque conséquence s'applique une fois et survit à la reconnexion ; le profil de catalogue reste immuable. | B04/B05. |
| B08-INS-005 | PHB24 p. 374, B07 | L'instance conserve possessions, mains, armure, bouclier, équipement de profil récupérable et objets de scène abandonnés. | `Gear` et inventaire de créature absents. **Manquant**. | MJ, système ; exemplaires. | Lâcher, désarmer, mourir et piller déplacent le même exemplaire sans duplication. | B07/B09. |
| B08-INS-006 | MM25, PHB24 p. 345 | Usages, charges, recharges, formes, auras, cibles marquées, liens et autres états propres au profil sont portés par l'instance. | Aucun état de profil. **Manquant**. | Système ; ressources typées. | Une utilisation sur un gobelin ne dépense pas celle d'un autre ; la reprise restaure le compteur exact. | B08-ACT. |
| B08-INS-007 | B05-CYC-008 | Profil/version et paramètres calculés sont instantanés au lancement ; une errata ou correction de catalogue ne change jamais un combat en cours. | Aucun instantané. **Manquant**. | Système ; version résolue. | Redémarrage produit les mêmes actions et valeurs ; une future rencontre prend explicitement la nouvelle version. | Phase 5. |
| B08-INS-008 | DEC-010, B05-DMG | Un monstre atteint 0 PV et meurt immédiatement par défaut ; l'exception de règles de personnage suit exactement la décision privée déjà validée. | Aucun combat. **Manquant**. | MJ, système ; politique de mort par instance. | Le choix avant combat ou la courte exception à 0 PV est audité ; sans réponse la mort s'applique. | B05-DR-03. |
| B08-INS-009 | PHB24 p. 369 | Une attaque de mêlée qui réduirait une créature à 0 PV peut l'assommer à 1 PV, Inconsciente et en Repos court, indépendamment de la politique de jets de mort. | Fonctionnalité absente. **Manquant**. | Contrôleur de l'attaque ; intention avant dégâts. | Le choix est fait avant révélation finale ; attaque à distance ou effet non qualifié ne propose rien. | B05-DMG. |
| B08-INS-010 | B06, PHB24 p. 322–328 | Une créature magique qui disparaît à 0 PV ou à la fin de sa source ne produit ni cadavre, ni équipement, ni butin sauf clause explicite. | Invocation absente. **Manquant**. | Système ; cause de fin. | Disparition retire pion et actions une fois ; le journal conserve cause, source et état final. | B08-SUM. |
| B08-INS-011 | DMG24 p. 88 | Un PNJ récurrent conserve son identité lorsque son profil change ; la transition de profil ne réécrit ni relations, ni histoire, ni possessions sans règle explicite. | PNJ absent. **Manquant**. | MJ, système ; identité et versions successives. | Mage apprenti puis Mage reste le même PNJ ; anciens combats gardent l'ancien profil. | B08-CTL. |
| B08-INS-012 | DEC-009 | Toute correction de profil résolu, état, contrôleur ou visibilité est compensatoire, motivée et conserve avant/après. | Correction absente. **Manquant**. | MJ, système ; audit. | Une correction n'efface jamais une action ni ne révèle un secret à un lecteur non autorisé. | B04-COR, B05-CYC-011. |

## Matrice — actions, ressources et recharges

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B08-ACT-001 | PHB24 p. 374–375, B05 | Une créature dispose des actions communes B05 et des seules options supplémentaires de son profil et de son état courant. | Profils textuels, moteur absent. **Partiel / manquant**. | Contrôleur, système ; options disponibles. | Une option indisponible est masquée ou désactivée avec raison ; le serveur revalide avant coût. | B05-ACT. |
| B08-ACT-002 | DATA-XMM | `Attaques multiples` fixe nombre, combinaison, ordre éventuel et remplacements autorisés ; elle n'autorise aucune attaque absente du profil. | Source complète disponible ; seed avec descriptions tronquées. **Partiel / non exécutable**. | Contrôleur ; séquence d'attaques. | Chaque composition permise est acceptée, une attaque en trop ou mauvaise combinaison est refusée avant jet. | Registre B08. |
| B08-ACT-003 | PHB24 p. 375 | Une attaque structure mode mêlée/distance, bonus, allonge/portée, cible, moyenne, dés, types et conséquences sur touché. | Texte libre. **Manquant**. | Système ; attaque. | Le serveur choisit cible et calcule jet/dégâts depuis le profil figé ; aucune valeur client n'est autoritaire. | B05-ATQ/DMG. |
| B08-ACT-004 | PHB24 p. 375 | Un effet de sauvegarde structure caractéristique, DD, cibles, échec, réussite et éventuels effets répétés ou fins. | Texte libre. **Manquant**. | Système ; sauvegarde. | Réussite partielle et immunité future ne sont jamais perdues ; chaque cible lance une fois au rythme prévu. | B05-ATQ. |
| B08-ACT-005 | PHB24 p. 375 | Lorsqu'un profil donne moyenne et expression de dégâts, la campagne fixe un mode par défaut et le MJ peut choisir l'autre avant chaque résolution ; elles ne se cumulent jamais. | Deux formes dans le texte. **Partiel**. | MJ, système ; défaut de campagne et choix de résolution. | Moyenne n'effectue aucun jet ; dés sont lancés au serveur ; un même paquet de dégâts emploie un seul mode. | `DR-B08-01` résolue. |
| B08-ACT-006 | PHB24 p. 345, MM25 | `Recharge X–Y` lance le dé prévu au début du tour après dépense ; réussite rend l'action disponible, échec conserve l'état dépensé. | Libellé dans le nom ou texte, aucun compteur. **Manquant**. | Système ; disponibilité et jet. | Aucun jet avant dépense ; un seul jet au bon déclencheur ; résultat secret selon projection MJ. | `MM25` requis. |
| B08-ACT-007 | PHB24 p. 372–373, MM25 | `N/jour` et `N/jour chacun` sont des compteurs distincts récupérés seulement au moment prévu ; un repos interrompu ne recharge rien. | Libellés textuels. **Manquant**. | Système ; compteur et recharge. | Dépenser un sort de `N/jour chacun` ne dépense pas les autres ; errata `1/jour`/`1/jour chacun` est appliquée. | OFF-ERR-MM, B04-RES. |
| B08-ACT-008 | PHB24 p. 374, B05 | Une Action Bonus consomme la ressource Bonus du tour et suit toutes ses préconditions ; un trait au début de tour n'est pas une Action Bonus. | Section textuelle, moteur absent. **Partiel / manquant**. | Contrôleur, système ; économie. | Deux Actions Bonus ordinaires sont refusées ; une capacité sans cible valide ne consomme rien. | B05-TOU. |
| B08-ACT-009 | PHB24 p. 374, B05-REA | Chaque Réaction conserve déclencheur, réponse, portée, cible et limite ; elle ouvre la fenêtre B05 seulement lorsqu'elle est réellement optionnelle et valide. | 61 réactions textuelles, aucune exécution. **Partiel / manquant**. | Contrôleur, MJ ; fenêtre et réponse. | Déclencheur absent, réaction dépensée ou cible invalide n'ouvre aucune fenêtre ; refus ne consomme rien. | B05-REA. |
| B08-ACT-010 | PHB24 p. 374, MM25 | Un trait permanent, une aura et un déclencheur de début/fin de tour s'appliquent au rythme exact sans action cachée. | 525 traits textuels, 199 profils sans trait. **Partiel / non exécutable**. | Système ; source, zone et échéance. | Entrée, début de tour et fin de tour ne sont pas confondus ; désactivation ou mort termine seulement les effets prévus. | B05-TOU/VIS. |
| B08-ACT-011 | MM25 | Une créature légendaire conserve son nombre d'utilisations, coûts, moment de récupération et options ; plusieurs instances ne partagent aucune ressource. | 146 entrées textuelles sur 43 profils. **Partiel / non exécutable**. | MJ, système ; pool légendaire. | Coût 2 retire deux usages ; zéro usage masque l'option ; nouveau round/turn recharge exactement selon la source. | `MM25` requis. |
| B08-ACT-012 | B06, PHB24 p. 374 | Incantation et pouvoirs magiques utilisent le moteur B06 avec les dérogations explicites du profil, notamment composantes absentes et fréquence propre. | Descriptions non structurées. **Manquant**. | Contrôleur, système ; sort et source. | Connaissance, emplacement et composantes de personnage ne sont pas inventés pour un profil qui les remplace. | B06. |
| B08-ACT-013 | B07 | Une attaque utilisant un équipement réel vérifie possession, mains, munition et état ; une attaque naturelle ou une manifestation de profil n'invente aucun objet. | Équipement et actions non reliés. **Manquant**. | Contrôleur, système ; mode d'attaque. | Désarmement retire seulement les options dépendantes ; griffe et souffle restent disponibles. | B07. |
| B08-ACT-014 | MM25, B06/B07 | Métamorphose, forme alternative, phase et profil de remplacement conservent identité, paramètres, équipement, PV et fins exactement selon leur clause. | Variantes dans le texte. **Manquant**. | Système, contrôleur ; forme active. | Revenir à la forme précédente restaure seulement ce que la règle dit ; reconnexion garde la bonne forme. | `MM25` requis. |

## Matrice — contrôle, PNJ et permissions

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B08-CTL-001 | PRODUCT, DEC-002 | Tout monstre et PNJ est contrôlé par un MJ actif par défaut ; un joueur ne reçoit jamais ce droit par appartenance seule à la campagne. | Aucune instance ni commande. **Manquant**. | MJ, joueur ; contrôleur effectif. | Commande d'un joueur sur une créature MJ refusée sans données privées ; co-MJ autorisé selon état de campagne. | SF-001. |
| B08-CTL-002 | B06, PHB24 p. 322–328 | Une source peut attribuer au joueur le contrôle fonctionnel d'une créature alliée ; ce droit porte sur l'instance et cesse avec la source. | Invocation absente. **Manquant**. | Invocateur, système ; source de contrôle. | Le joueur choisit les options autorisées, jamais le profil ou les règles ; expiration retire immédiatement le droit. | B08-SUM. |
| B08-CTL-003 | PHB24 p. 322–328 | Une commande verbale qui ne coûte aucune action ne consomme ni Action ni Action Bonus ; une capacité exigeant une Action Bonus la consomme exactement. | Commandes absentes. **Manquant**. | Contrôleur ; ordre et coût. | Une créature sans ordre suit sa clause de défaut ; coût erroné refuse avant mutation. | B06-SPE-004. |
| B08-CTL-004 | PHB24 p. 322–328 | Si une invocation n'a reçu aucun ordre, elle Esquive et emploie son mouvement pour éviter le danger lorsque sa source le dit ; aucune IA plus ambitieuse n'est inventée. | Fonctionnalité absente. **Manquant**. | Système ; ordre du tour. | Absence, refus et déconnexion produisent le même défaut déterministe ; le MJ peut arbitrer seulement une ambiguïté réelle. | DEC-011. |
| B08-CTL-005 | DMG24 p. 88 | Au MVP, un PNJ membre du groupe reste exclusivement sous contrôle MJ ; aucune délégation à un joueur n'est proposée. | PNJ absent. **Manquant**. | MJ ; contrôle de l'instance. | Toute commande joueur est refusée sans révéler le secret du PNJ ; le contrôle explicite d'une invocation reste régi par sa source. | `DR-B08-02` résolue. |
| B08-CTL-006 | SF-004 | Le MJ peut répondre à une Réaction ou agir au nom d'une créature qu'il contrôle et d'un joueur déconnecté, sans changer durablement le contrôleur sauf commande explicite. | Combat absent. **Manquant**. | MJ ; substitution ponctuelle. | L'audit distingue acteur humain et contrôleur fonctionnel ; reconnexion ne crée pas deux commandes. | B05-REA. |
| B08-CTL-007 | DMG24 p. 116 | Camp, attitude `Amicale/Indifférente/Hostile`, alliance, consentement et contrôleur sont des dimensions distinctes. | Seul le concept de portée de campagne existe. **Manquant**. | MJ, système ; relations. | Une créature hostile contrôlée par le MJ peut devenir alliée sans transférer son contrôle ; les ciblages sont requalifiés. | B05/B06. |
| B08-CTL-008 | B06, PHB24 | Charmé, domination, contrôle magique et ordre verbal appliquent uniquement les permissions de leur effet ; aucune condition seule ne transfère automatiquement tout le contrôle. | Effets actifs absents. **Manquant**. | Système, contrôleurs ; effet et portée. | Fin de l'effet restaure le contrôleur prévu ; action interdite par le sort est refusée. | B04-CON, B06. |
| B08-CTL-009 | DEC-002, DEC-011 | Nom, profil, PV exacts, ressources, actions cachées, secret et intentions sont projetés selon rôle et visibilité ; le serveur ne les envoie pas à un client non autorisé. | Route de bestiaire authentifiée mais non limitée aux MJ ; aucune projection de combat. **Contraire à la cible de secret**. | MJ, joueurs ; projection. | Un joueur ne peut lister le bestiaire de préparation ni déduire une recharge secrète ; les MJ voient la fiche complète. | SF-001, B05-INI/VIS. |
| B08-CTL-010 | DMG24 p. 88–89 | Un PNJ récurrent et ses motivations restent pilotés par le MJ ; la règle optionnelle de Loyauté n'est ni calculée ni persistée au MVP. | Fonctionnalité absente. **Conforme au périmètre manuel**. | MJ ; arbitrage narratif. | Aucun score 0–20 n'est affiché ou déduit ; fidélité, départ et trahison exigent une décision MJ explicite. | `DR-B08-03` résolue. |

## Matrice — invocations, compagnons et montures

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B08-SUM-001 | B06-SPE-004 | Toute créature créée ou appelée référence l'instance de sa source, son invocateur, son profil/version, ses paramètres, sa durée et sa cause de fin. | Profils descriptifs seulement. **Manquant**. | Système ; lien source-instance. | Terminer la bonne source retire seulement ses créatures ; aucune instance orpheline ne subsiste. | B06. |
| B08-SUM-002 | PHB24 p. 322–328 | Les neuf esprits de convocation matérialisent chaque option autorisée et ses formules de CA, PV, attaques, dégâts, BM, DD, vitesses, traits et immunités. | Neuf profils présents, formules non exécutables. **Partiel / contraire**. | Lanceur, système ; niveau et option. | Chaque forme et surclassement produit les valeurs exactes ; option impossible refusée avant dépense. | B06-SP-333 à 341. |
| B08-SUM-003 | PHB24 p. 322–328 | Chaque esprit apparaît dans un espace inoccupé visible à portée, est allié, partage le compte d'initiative du lanceur et agit immédiatement après lui. | Instance/carte absente. **Manquant**. | Lanceur, système ; position et ordre. | Espace occupé refuse avant dépense ; l'esprit n'obtient jamais un second compte ni un tour rétroactif. | B05-INI-009. |
| B08-SUM-004 | PHB24 p. 322–328 | L'esprit obéit aux ordres verbaux sans coût ; sans ordre il Esquive et évite le danger. | Fonctionnalité absente. **Manquant**. | Lanceur ; ordre. | Ordre impossible ne crée pas une autre action ; déconnexion applique le défaut sans pause. | B08-CTL. |
| B08-SUM-005 | PHB24 p. 322–328 | Un esprit disparaît à 0 PV ou à la fin de la Concentration/durée ; ses effets de disparition, comme une explosion, se résolvent avant retrait. | Fonctionnalité absente. **Manquant**. | Système ; cause et déclencheurs. | Une fin n'est appliquée qu'une fois ; le pion et toutes ses options deviennent indisponibles après résolution. | B06-DUR. |
| B08-SUM-006 | PHB24 p. 123–124 | Les Bêtes des terres, mers et cieux du Maître des bêtes emploient le niveau de Rôdeur, le BM et le modificateur de Sagesse prévus ; remplacement, ordre et restauration suivent la capacité. | Trois profils scalaires, compagnon actif absent. **Partiel / non exécutable**. | Rôdeur, système ; compagnon persistant. | Changer de forme ou de compagnon ne conserve aucun état interdit ; progression recalcule les seules valeurs dérivées. | B02-Ranger. |
| B08-SUM-007 | PHB24 p. 81 et 269–272 | Familier de *Find Familiar* ou *Wild Companion* conserve forme autorisée, sens partagés, poche dimensionnelle, portée, actions interdites et durée propres à sa source. | Profils animaux présents, aucun familier. **Partiel / manquant**. | Lanceur, système ; forme et lien. | Deux sources de familier ne se cumulent pas si la règle l'interdit ; attaque interdite est masquée même si le profil en possède une. | B06 registre. |
| B08-SUM-008 | PHB24 p. 272–273 | *Find Steed* crée une Monture d'Outremonde paramétrée, liée au lanceur et compatible avec les règles de combat monté. | Profil scalaire, instance absente. **Partiel / manquant**. | Paladin, système ; monture et lien. | CA/PV/DD suivent le niveau de sort ; descendre de selle ne rompt pas l'invocation. | B07, B05-MOV. |
| B08-SUM-009 | PHB24 p. 278–279, OFF-ERR-PHB | *Giant Insect* emploie son profil paramétré corrigé, notamment `10 PV par niveau au-dessus de 4`, et ses options de forme. | Profil non exécutable, version non prouvée. **Partiel / ambigu**. | Lanceur, système ; niveau et forme. | Niveau 4 n'ajoute aucun palier ; chaque niveau supérieur ajoute exactement 10 PV. | OFF-ERR-PHB, B06. |
| B08-SUM-010 | PHB24 p. 242 | *Animate Objects* crée des objets animés distincts dont taille, nombre, CA, PV, attaque et dégâts suivent le sort ; ce ne sont ni des objets d'inventaire ordinaires ni des monstres à butin. | Un profil scalaire unique. **Partiel / non exécutable**. | Lanceur, système ; objets sources et instances. | Chaque objet a PV/position propres ; fin du sort restitue l'objet sans dupliquer sa possession. | B06/B07. |
| B08-SUM-011 | PHB24 p. 26–27 | Une monture consentante qualifiée peut être montée ; monter/descendre coûte la moitié de la Vitesse et la chute suit les sauvegardes prévues. | Montures et carte absentes. **Manquant**. | Cavalier, MJ, système ; relation et position. | Mauvaise taille ou portée refuse ; chute déplace les bons pions et applique À terre seulement selon le jet. | B05-MOV, B07. |
| B08-SUM-012 | PHB24 p. 26–27 | Une monture contrôlée agit au même compte que le cavalier et se limite à Esquive, Foncer ou Désengagement ; une monture indépendante garde sa place et toutes ses options. | Contrôle de monture absent. **Manquant**. | Cavalier/MJ ; mode contrôlé. | Changer de mode ne crée aucun tour supplémentaire ; une monture intelligente reste indépendante selon la règle. | B05-INI/TOU. |
| B08-SUM-013 | B07-DEF-009 | Barde et équipement de monture modifient l'instance équipée sans altérer son profil ni lui accorder une maîtrise inventée. | Barde et inventaire actif absents. **Manquant**. | MJ, contrôleur ; monture et objet. | Prix/poids restent ceux de B07 ; CA ne se cumule pas avec une défense incompatible. | B07. |
| B08-SUM-014 | B06 | Les autres créations, appels, transformations et copies de créatures emploient le profil et le cycle exacts de leur sort : choix du MJ, autonomie, loyauté, hostilité, durée ou permanence ne sont pas normalisés abusivement. | Profils et effets actifs absents. **Manquant**. | Lanceur, MJ, système ; clause du sort. | *Planar Ally*, *Simulacrum* et *True Polymorph* ne reçoivent pas par défaut les règles des neuf esprits. | B06-SPE. |
| B08-SUM-015 | DEC-004 | Une invocation arrivée après le lancement suit sa source pour initiative et premier tour ; elle n'emprunte pas la règle générique des renforts MJ si la source dit autrement. | Fonctionnalité absente. **Manquant**. | Système ; arrivée et ordre. | Le journal cite la source ; aucun jet d'initiative n'est lancé pour un compte partagé. | B05-INI-008/009. |

## Matrice — préparation, renforts, visibilité et récompenses

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B08-ENC-001 | SF-003 | En préparation, le MJ sélectionne profil/version, quantité, nom éventuel, camp, attitude, contrôleur, position, visibilité, PV et paramètres par instance. | Aucun parcours. **Manquant**. | MJ ; préparation privée. | Chaque instance est valide et distincte ; un profil incomplet ou étranger est refusé avant lancement. | B05-CYC. |
| B08-ENC-002 | SF-003, PHB24 p. 374 | Les PV moyens sont le défaut ; le MJ peut demander un jet serveur par instance à partir des dés exacts. | Données partielles, instance absente. **Partiel / manquant**. | MJ, système ; mode PV. | Une quantité de cinq peut mêler moyenne et jets explicites ; chaque résultat est figé. | B08-PRO-004. |
| B08-ENC-003 | PHB24 p. 23, B05 | Des créatures identiques contrôlées par le MJ peuvent partager compte et jet d'initiative tout en conservant tours et états distincts. | Fonctionnalité absente. **Manquant**. | MJ, système ; groupe d'initiative. | Deux profils ou contrôleurs différents ne sont pas groupés implicitement ; retirer un membre ne supprime pas le groupe. | B05-INI-003. |
| B08-ENC-004 | DEC-004 | PNJ, patrouille ou renfort reçoit profil/version, instance, position valide et initiative ; son insertion ne change pas l'ordre relatif existant. | Fonctionnalité absente. **Manquant**. | MJ, système ; arrivée. | Place déjà passée reporte le premier tour ; arrivée future permet ce round ; tout est historisé. | B05-INI-008. |
| B08-ENC-005 | SF-003, DEC-002 | Créature cachée, profil, vraie identité, position, initiative, PV exacts, ressources et actions non révélées sont filtrés côté serveur. | Bestiaire lisible par tout utilisateur authentifié, combat absent. **Contraire à la cible**. | MJ, joueurs ; projections. | Un joueur ne découvre pas un renfort préparé ni la raison interne d'une cible invalide. | B05-VIS, DEC-011. |
| B08-ENC-006 | DMG24 p. 114–115 | La préparation calcule un budget de difficulté faible, modérée ou élevée par niveau et personnage, puis additionne les PX des créatures participantes sans dépasser silencieusement le budget visé. | PX textuels, aucun calcul. **Manquant**. | MJ, système ; groupe, niveaux, difficulté et PX. | Les vingt lignes de budget et les exemples DMG sont reproduits ; ajouter/retirer une créature recalcule immédiatement. | `DR-B08-04` résolue. |
| B08-ENC-007 | PRODUCT, DMG24 p. 114–115 | Les PX des profils servent à l'estimation de rencontre seulement ; aucun PX n'est attribué, persisté ou cumulé sur les personnages. | Personnages commencent à 0 PX, aucun moteur. **Conforme à l'intention / manquant pour budget**. | MJ, système ; valeur consultative. | Terminer un combat ne modifie jamais la progression ; seul le déverrouillage MJ de B02 fait gagner un niveau. | Décision produit existante. |
| B08-ENC-008 | DMG24 p. 115–116, DATA-XMM | Le système avertit, sans bloquer l'arbitrage MJ, au-delà de deux créatures par personnage, lorsqu'un FP dépasse le niveau du groupe ou lorsqu'un trait pose un risque inhabituel. | Source des traits disponible ; aucun diagnostic. **Manquant**. | MJ ; avertissements. | Un avertissement ne change ni profil ni budget ; le MJ peut confirmer avec trace. | Registre B08. |
| B08-ENC-009 | DMG24 p. 114–116 | Difficulté, budget et avertissements sont recalculés lorsque personnages, niveaux, créatures, quantités ou renforts préparés changent. | Fonctionnalité absente. **Manquant**. | Système ; projection de préparation. | Une absence de joueur peut être simulée sans muter sa fiche ; l'aperçu indique les hypothèses. | SF-003. |
| B08-ENC-010 | DMG24 p. 82–83 | Les règles facultatives de groupes nombreux — résultats moyens des tests d20 et estimation des cibles d'une zone — sont hors MVP ; chaque instance emploie les jets et positions exacts du moteur B05. | Fonctionnalité absente. **Conforme au périmètre**. | MJ, système ; instances exactes. | Aucun résultat moyen ni nombre de cibles estimé n'est proposé ; l'initiative groupée ne fusionne ni états ni jets d'action. | `DR-B08-05` résolue. |
| B08-ENC-011 | DMG24 p. 120–121, DATA-XMM, SF-005 | FP et préférence de trésor du profil alimentent les tables de trésor individuel ou de trésor accumulé ; résultat, objets garantis et ajouts de campagne restent distincts. | Préférences disponibles dans la source, absentes du seed ; butin absent. **Partiel / manquant**. | MJ, système ; profil et table. | Un profil `Individuel` ne génère pas de trésor accumulé ; un thème n'invente aucun objet hors table. | Registre B08, B09. |
| B08-ENC-012 | DMG24 p. 121, OFF-ERR-DMG | La troisième ligne du trésor accumulé emploie `8d8 × 1 000 po`, corrigé de `8d8 × 10 000 po`. | Aucune table de récompense. **Manquant**. | Système ; table versionnée. | Le contrôle statistique donne la moyenne corrigée ; aucune ancienne valeur n'est utilisée dans une nouvelle génération. | Errata DMG v1, B09. |
| B08-ENC-013 | SF-005, DEC-005 | Le butin d'une instance vaincue est généré une fois puis rattaché à campagne, combat et créature ; reconnexion et consultation concurrente ne le régénèrent pas. | Fonctionnalité absente. **Manquant**. | Système, joueurs, MJ ; conteneur de butin. | Deux ouvertures montrent le même résultat ; une invocation disparue sans clause ne produit aucun conteneur. | B09 pour orchestration. |
| B08-ENC-014 | PRODUCT, SF-003 | Les vagues automatisées sont hors MVP ; chaque renfort reste ajouté explicitement par un MJ ou par une source de règle déterministe. | Fonctionnalité absente. **Conforme au périmètre**. | MJ, système ; arrivée. | Aucun minuteur ou seuil de PV ne crée une vague non autorisée ; les invocations automatiques de traits restent des règles, pas des vagues produit. | DEC-004. |

## Matrice — synthèse de l'état actuel

| ID | Constat actuel | Qualification | Cible vérifiable | Trace |
|---|---|---|---|---|
| B08-ETA-001 | 513 clés uniques valident le schéma de transport ; `DATA-XMM` établit 503 profils XMM attendus. | **Partiel** | Inventaire sourcé, versionné et contrôlé ; cinq profils locaux manquent. | B08-CAT, registre. |
| B08-ETA-002 | 498 profils se déclarent MM, sans livre ni page locale ; 496 concordent par empreinte et deux divergent. | **Partiel / obsolète** | Chaque profil est relié à `DATA-XMM` et à l'errata. | Registre B08. |
| B08-ETA-003 | 89 profils ont une règle vide ou réduite à son titre. | **Contraire à la cible** | Aucun profil incomplet n'est exécutable. | B08-CAT-006. |
| B08-ETA-004 | Les 15 profils sans FP existent, mais leurs formules ne sont pas représentées. | **Partiel / non exécutable** | Paramètres et variantes exacts PHB. | B08-SUM. |
| B08-ETA-005 | Actions, DD, attaques, sorts, usages et recharges sont des chaînes. | **Partiel / non exécutable** | Primitives structurées B05/B06. | B08-PRO/ACT. |
| B08-ETA-006 | L'API authentifiée expose le bestiaire de référence à tout utilisateur. | **Contraire à la cible de secret** | Consultation complète MJ ; projections minimales joueurs. | B08-CTL-009. |
| B08-ETA-007 | Aucune interface front ne lit le bestiaire. | **Manquant** | Préparation et consultation selon rôle. | B08-ENC. |
| B08-ETA-008 | Aucune instance, PNJ, invocation, monture ni contrôleur n'existe. | **Manquant** | Cycle de vie et permissions complets. | B08-INS/CTL/SUM. |
| B08-ETA-009 | Le repository permet à une clé de campagne de masquer l'officielle. | **Contraire à la cible** | Identités et provenances non ambiguës. | SF-006, B08-CAT-005. |
| B08-ETA-010 | Aucun budget de difficulté ni récompense n'est calculé. | **Manquant** | Budget consultatif sans progression par PX ; butin B09. | B08-ENC. |

## Décisions et données requises

### DONNÉE-B08-01 — Source versionnée du bestiaire

**Résolue le 20 août 2026 :** le propriétaire désigne le
[*Monster Manual 2025* de 5e.tools](https://5e.tools/book.html#xmm,1) comme référence
de contrôle et de reprise. La spécification fige la release `v2.33.3`, ses trois jeux
de données XMM et l'empreinte SHA-256 du fichier de profils. `OFF-ERR-MM` reste
prioritaire. Le registre qualifie les 503 profils, les cinq absences, les deux
divergences et les 89 profils locaux tronqués.

### DR-B08-01 — Moyenne ou dés pour les dégâts des monstres

**Résolue le 20 août 2026 :** la campagne possède un mode de dégâts par défaut. Un MJ
peut choisir la valeur statique ou les dés avant chaque résolution. La valeur statique
ne lance aucun dé ; le mode dés emploie un jet serveur. Les deux ne se cumulent jamais.

### DR-B08-02 — Délégation d'un PNJ membre du groupe

**Résolue le 20 août 2026 :** au MVP, seuls les MJ contrôlent les PNJ membres du
groupe. La délégation à un joueur est différée. Cette limite ne retire pas au joueur le
contrôle fonctionnel d'une invocation ou d'un compagnon lorsque sa source le lui
accorde explicitement.

### DR-B08-03 — Règle optionnelle de Loyauté

**Résolue le 20 août 2026 :** la règle optionnelle de Loyauté n'est pas automatisée au
MVP. Le MJ arbitre motivations, fidélité, départ et trahison ; aucun score secret 0–20
n'est persisté ni calculé.

### DR-B08-04 — Budget de difficulté malgré l'absence de progression par PX

**Résolue le 20 août 2026 :** la préparation calcule le budget et le niveau de
difficulté selon le DMG. Les PX des profils sont uniquement une unité d'estimation :
ils ne sont jamais attribués, persistés ni cumulés sur un personnage. La progression
reste exclusivement déverrouillée par le MJ selon B02.

### DR-B08-05 — Abstraction des groupes nombreux

**Résolue le 20 août 2026 :** les résultats moyens et estimations de zone du DMG sont
hors MVP. Chaque créature conserve position, état, jet et résolution exacts. Seule
l'initiative groupée de créatures identiques prévue par B05 reste disponible.

## Validation du bloc

Le propriétaire valide B08 le 20 août 2026 avec les éléments suivants :

- `DONNÉE-B08-01` est résolue par `DATA-XMM` figée sur `v2.33.3` ;
- le registre individuel couvre 503 profils XMM et 15 profils PHB paramétrés ;
- les 89 profils tronqués, les deux divergences et les cinq absences sont qualifiés
  sans modifier le seed ;
- les 91 règles, 10 constats, décisions et critères d'acceptation sont explicites ;
- les documents transverses relient cette validation sans autoriser l'implémentation ;
- aucun code, test, dépendance, seed, migration ou CI n'est modifié par B08.
