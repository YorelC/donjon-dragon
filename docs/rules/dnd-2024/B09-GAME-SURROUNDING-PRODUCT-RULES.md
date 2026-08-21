# B09 — Règles produit autour de la partie

## Statut

**SPÉCIFICATION VALIDÉE PAR LE PROPRIÉTAIRE LE 20 AOÛT 2026.**

Ce document inventorie le bloc B09 défini dans
[`DND-2024-COMPLIANCE-PLAN.md`](../../DND-2024-COMPLIANCE-PLAN.md). Il décrit la
cible et les écarts observés ; il n'autorise aucune implémentation.

Les 90 règles ci-dessous relient validation de fiche, jets libres, repos collectif,
butin, investigation privée, réserve MJ, corrections compensatoires et audit
fonctionnel. Les décisions `DR-B09-01` à `DR-B09-07` ont été arbitrées par le
propriétaire le 20 août 2026 et sont intégrées dans la matrice. La validation explicite
du propriétaire porte sur l'ensemble des 90 règles et clôt le bloc B09.

## Sources et conventions

### Sources normatives disponibles

- `PHB24` — [`PlayersHandbook2024.pdf`](../../books/PlayersHandbook2024.pdf), source
  primaire locale ; les pages citées sont celles imprimées ;
- `DMG24` — [`DungeonMasterGuide2024.pdf.pdf`](../../books/DungeonMasterGuide2024.pdf.pdf),
  source primaire locale ; les pages citées sont celles imprimées ;
- `SF-001`, `SF-002`, `SF-003`, `SF-005` et `SF-006` dans
  [`REQUIREMENTS.md`](../../REQUIREMENTS.md) ;
- [`DEC-002`](../../DECISIONS/002-roles-and-visibility.md),
  [`DEC-003`](../../DECISIONS/003-character-lifecycle.md),
  [`DEC-004`](../../DECISIONS/004-combat-and-realtime.md),
  [`DEC-005`](../../DECISIONS/005-dice-rest-and-loot.md),
  [`DEC-009`](../../DECISIONS/009-adventure-state-and-corrections.md),
  [`DEC-010`](../../DECISIONS/010-common-combat-engine.md),
  [`DEC-011`](../../DECISIONS/011-spells-and-magical-effects.md),
  [`DEC-012`](../../DECISIONS/012-equipment-items-and-possessions.md) et
  [`DEC-013`](../../DECISIONS/013-monsters-npcs-and-summoned-creatures.md), ainsi que
  [`DEC-014`](../../DECISIONS/014-game-surrounding-product-rules.md) ;
- les matrices [`B01`](B01-LEVEL-ONE-CREATION.md),
  [`B02`](B02-LEVELS-TWO-TO-TWENTY.md),
  [`B03`](B03-MULTICLASSING-AND-RESPECIALIZATION.md),
  [`B04`](B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md),
  [`B05`](B05-COMMON-COMBAT-ENGINE.md),
  [`B06`](B06-SPELLS-AND-MAGICAL-EFFECTS.md),
  [`B07`](B07-EQUIPMENT-ITEMS-AND-PROFICIENCIES.md) et le brouillon
  [`B08`](B08-MONSTERS-NPCS-AND-SUMMONED-CREATURES.md).

### Pointage primaire contrôlé

| Domaine | Pages contrôlées |
|---|---|
| Tests d20, tests de caractéristique, DD et Avantage/Désavantage | `PHB24` p. 10–13 ; `DMG24` p. 27–31 |
| Compétences, actions Recherche et Étude | `PHB24` p. 14–15 et 372–373 |
| Perception, Investigation et objets cachés | `DMG24` p. 35–36 |
| Repos long, repos court et interruptions | `PHB24` p. 370–373 |
| Trésor individuel, trésors accumulés et préférences | `DMG24` p. 120–121 |
| Formes de trésor et thèmes | `DMG24` p. 213–218 |
| Attribution des objets magiques | `DMG24` p. 218–220 |

Les pages ci-dessus ont été extraites en entier. Les pages structurantes `PHB24`
p. 10, 15, 370–371 et 373 ainsi que `DMG24` p. 27, 35, 120–121, 213 et 218 ont aussi
été rendues et contrôlées visuellement. Les tables du DMG sont des outils laissés au
MJ, pas une obligation de distribuer une quantité automatique de trésor.

### Limites entre blocs

- B01 définit la construction de niveau 1 ; B09 orchestre sa soumission, sa revue et
  l'historique de validation.
- B04 définit les bénéfices individuels d'un repos et les invariants d'état ; B09
  définit proposition, participants, choix, interruption et validation collective.
- B05/B06 déterminent les jets et effets ayant une conséquence mécanique ; B09 fournit
  les jets hors combat et leurs projections sans dupliquer le moteur.
- B07 définit possession, exemplaires, piles, capacité et transfert ; B09 déplace ces
  exemplaires entre contenant de butin, personnage et réserve.
- B08 fournit créature, cadavre, équipement récupérable, FP et préférence de trésor ;
  B09 génère et ferme les contenants. B08 emploie la référence XMM versionnée désignée
  par le propriétaire et l'errata officiel prioritaire.
- Les transactions MongoDB, commandes Socket.IO, accusés, clés d'idempotence et
  représentation des événements appartiennent à la Phase 5.

### État actuel inspecté

- un personnage complet est immédiatement persisté avec l'unique statut
  `waiting_adventure` ; aucune soumission, acceptation, décision motivée ou version à
  examiner n'existe ;
- les routes permettent création, réédition, suppression, attribution et lecture de
  fiche, sans workflow de validation MJ ni historique fonctionnel ;
- un port `Dice` et une implémentation `CryptoDice` existent, mais aucun use-case de
  jet libre, aucune commande de jet de partie et aucun historique de résultat ne les
  exposent ; le tirage de caractéristiques reste soumis par le client ;
- la fiche calculée expose bonus de compétences, sauvegardes, ressources informatives
  et inventaire simple, sans état courant d'aventure ;
- aucun module, schéma partagé, route ou page ne représente repos, butin,
  investigation, réserve de campagne, correction compensatoire ou audit fonctionnel ;
- l'inventaire est une liste de quantités par clé et un entier d'or : exemplaire,
  provenance, cinq monnaies, visibilité, contenant et acquisition concurrente sont
  absents ;
- campagnes, membres et rôles fournissent un socle de permission partiel, mais aucune
  projection privée propre aux opérations de B09 n'existe.

Les qualifications sont **Conforme**, **Partiel**, **Manquant**, **Ambigu**, **Dette**,
**Obsolète** et **Contraire à la cible**.

## Matrice — soumission et validation de fiche

| ID | Source | Cible | État actuel | Acteurs et données | Critères d'acceptation | Décision / traçabilité |
|---|---|---|---|---|---|---|
| B09-VAL-001 | SF-002, DEC-003, B01 | Une fiche complète possède les états de revue `BROUILLON`, `SOUMISE`, `REFUSÉE` et `ACCEPTÉE`, distincts de son attribution et de son état d'aventure. | Seul `waiting_adventure`. **Manquant**. | Créateur, MJ, système ; état et version candidate. | Une attribution ne vaut jamais acceptation ; une fiche refusée ne participe pas au combat. | B01-SUB. |
| B09-VAL-002 | SF-002, B01 | Seul le créateur autorisé soumet son candidat complet ; le serveur revalide toutes les règles avant de créer la version à examiner. | Finalisation persiste directement. **Contraire à la cible**. | Joueur assigné ou MJ créateur ; build complet. | Toute erreur retourne un motif localisé et ne change ni version examinée ni fiche active. | B01-VAL. |
| B09-VAL-003 | DEC-003 | Une soumission fige la version examinée ; les modifications ultérieures passent par un refus puis une nouvelle soumission. | Réédition directe possible. **Contraire à la cible**. | Créateur ; instantané candidat. | Deux MJ lisent exactement la même version ; aucun changement silencieux pendant la revue. | Cycle de validation. |
| B09-VAL-004 | SF-002, DEC-003 | Tout MJ actif de la campagne peut accepter ou refuser seul ; le serveur revalide rôle, campagne et version au moment de décider. | Routes de décision absentes. **Manquant**. | MJ ; version attendue et décision. | Un ancien MJ, un joueur ou un MJ d'une autre campagne est refusé sans mutation. | SF-001. |
| B09-VAL-005 | DEC-003 | Un refus exige un motif non vide visible du créateur et conserve la version refusée. | Motif et historique absents. **Manquant**. | MJ, créateur ; motif et version. | Refus vide rejeté ; le créateur relit le motif exact après reconnexion. | Audit B09. |
| B09-VAL-006 | DEC-003 | La resoumission remplace la seule version à examiner, mais ne supprime ni le dernier motif ni les décisions antérieures. | Aucun versionnement. **Manquant**. | Créateur, MJ ; nouvelle version et lignée. | Le MJ voit le candidat courant et peut relire chaque décision dans l'ordre. | Audit B09. |
| B09-VAL-007 | DEC-003 | Une fiche créée par un MJ peut être soumise et acceptée immédiatement par ce même MJ, sans contourner la validation mécanique. | Création MJ possible, acceptation absente. **Partiel**. | MJ créateur ; candidat valide. | L'acceptation échoue si le build ne respecte pas B01 ; l'auto-validation est auditée. | Décision validée. |
| B09-VAL-008 | SF-002, B03 | L'acceptation initiale ou de respécialisation active exactement la version examinée dans une opération fonctionnellement indivisible. | Activation absente. **Manquant**. | MJ, système ; version attendue et état transformé. | Échec de transformation conserve intégralement l'ancienne fiche ; aucun état hybride. | Phase 5 pour transaction. |
| B09-VAL-009 | SF-002 | L'acceptation initiale rend la fiche utilisable hors combat et éligible à une préparation, jamais participante rétroactivement à un combat lancé. | Aucun cycle de combat. **Manquant**. | Système ; date d'acceptation et préparation. | Une préparation relue peut ajouter le personnage ; un instantané déjà lancé ne change pas. | B05-CYC. |
| B09-VAL-010 | DEC-002/003 | Le créateur voit son candidat, motifs et décisions ; tous les MJ voient le dossier complet ; les autres joueurs n'en reçoivent aucune donnée privée. | Lecture de fiche trop large. **Contraire à la cible**. | Créateur, MJ ; projections de revue. | Une réponse destinée à un autre joueur ne contient ni build, ni motif, ni auteur de décision. | SF-001. |

## Matrice — jets libres hors combat

| ID | Source | Cible | État actuel | Acteurs et données | Critères d'acceptation | Décision / traçabilité |
|---|---|---|---|---|---|---|
| B09-DIC-001 | PHB24 p. 10, DMG24 p. 27 | Un joueur décrit d'abord l'intention de son personnage ; le MJ décide si un test d20 est justifié. Un jet sans contexte ne produit aucune conséquence automatique. | Aucun parcours. **Manquant**. | Joueur, MJ ; intention et contexte. | Tâche certaine ou impossible peut être résolue sans jet ; aucun résultat client spontané ne mute l'état. | Règle D&D. |
| B09-DIC-002 | PHB24 p. 10–12 | Un jet libre exécutable distingue test de caractéristique, sauvegarde et attaque ; l'intitulé ne transforme pas arbitrairement une catégorie en une autre. | Port de dé générique seulement. **Manquant**. | MJ, joueur ; type de test. | Une menace subie utilise une sauvegarde ; frapper une cible utilise une attaque si le MJ demande un jet. | B05 pour combat. |
| B09-DIC-003 | PHB24 p. 10–15 | Pour un test de caractéristique, le MJ choisit la caractéristique et la compétence ou l'outil éventuellement applicable d'après l'action décrite. | Bonus calculés, aucune commande. **Partiel**. | MJ ; caractéristique, maîtrise et justification. | Une compétence différente peut être associée à la caractéristique si le MJ le décide ; le bonus reste explicable. | Règle D&D. |
| B09-DIC-004 | PHB24 p. 10–13 | Le serveur calcule modificateur, maîtrise, Expertise et bonus ou pénalités structurés depuis la fiche active et son état courant. | Calcul de fiche partiel, état courant absent. **Partiel / manquant**. | Système ; version de fiche et effets. | Le client ne fournit jamais le total autoritaire ; le détail cite chaque source appliquée. | B04/B06. |
| B09-DIC-005 | PHB24 p. 10–13 | Normal, Avantage et Désavantage suivent la règle commune : deux d20 au plus, meilleur ou pire conservé, et annulation mutuelle quel que soit le nombre de sources. | Aucun jet de partie. **Manquant**. | Système ; sources circonstancielles. | Deux Avantages ne lancent que deux dés ; un Avantage et trois Désavantages donnent un d20. | B05-ATQ. |
| B09-DIC-006 | DMG24 p. 27–31 | Le MJ fixe le DD ou la défense et les conséquences avant la résolution lorsqu'ils doivent rester secrets ; le joueur ne fournit pas le seuil autoritaire. | Aucun DD de partie. **Manquant**. | MJ ; seuil, conséquence et visibilité. | Modifier un DD après résultat exige une correction auditée ; un seuil secret ne fuit pas. | Audit B09. |
| B09-DIC-007 | DEC-005 | Chaque dé ayant une conséquence est généré au backend ; animation et son représentent le résultat persisté sans pouvoir le modifier. | `CryptoDice` existe, sans use-case ni persistance. **Partiel**. | Système ; dés bruts et résultat. | Reconnexion restitue les mêmes faces ; rejouer l'animation ne relance rien. | DEC-005. |
| B09-DIC-008 | PHB24 p. 10, DEC-005 | Le résultat conserve faces, dé retenu, modificateurs, total, type, acteur, personnage ou créature, contexte et verdict connu. | Historique absent. **Manquant**. | Système ; entrée d'audit. | Le détail permet de refaire l'addition ; un DD secret reste masqué à l'audience non autorisée. | Audit B09. |
| B09-DIC-009 | DEC-005 | Un joueur lance seulement pour son personnage assigné et accepté ; un MJ peut lancer pour toute créature ou tout personnage de sa campagne. | Attribution partielle, jet absent. **Manquant**. | Joueur, MJ ; contrôleur effectif. | Désassignation ou promotion MJ retire immédiatement l'ancien droit joueur. | SF-001/B08. |
| B09-DIC-010 | DEC-005/011/014 | La visibilité est fixée avant le tirage et ne dépend jamais du résultat. Le jet d'un joueur est public par défaut, mais il peut le rendre privé entre lui et les MJ ; le MJ choisit public ou secret, secret par défaut. Une source plus restrictive prévaut toujours. | Aucune projection de jet. **Manquant**. | Lanceur, MJ ; audience figée. | Un échec privé ne devient pas public par accident ; un événement non autorisé ne contient aucune face. | `DR-B09-01` résolue. |
| B09-DIC-011 | DEC-005 | Une relance, un remplacement ou une Inspiration héroïque crée une résolution liée au jet d'origine selon sa règle ; l'ancien résultat reste relisible. | Aucun historique de jet. **Manquant**. | Contrôleur, système ; lien et coût. | Une relance ne réécrit pas les faces initiales et consomme sa ressource une seule fois. | B04-RES/B05. |
| B09-DIC-012 | Gouvernance | Un jet décoratif sans conséquence peut être animé localement seulement s'il est clairement qualifié comme tel et ne rejoint jamais l'audit fonctionnel. | Aucun parcours. **Manquant**. | Utilisateur ; jet décoratif. | Aucune API métier n'accepte son résultat ; l'interface ne le présente pas comme arbitré. | Front hors moteur. |

## Matrice — repos collectif

| ID | Source | Cible | État actuel | Acteurs et données | Critères d'acceptation | Décision / traçabilité |
|---|---|---|---|---|---|---|
| B09-REP-001 | SF-005, DEC-005 | Un MJ actif propose un repos court ou long seulement hors `EN_COURS`, `EN_PAUSE` et `BUTIN`. | Repos et combat absents. **Manquant**. | MJ ; type et instant fictionnel. | Proposition pendant un état interdit est refusée sans changer aucune ressource. | SF-003. |
| B09-REP-002 | SF-005 | Tous les personnages acceptés, vivants, joués et assignés sont inclus par défaut ; le MJ voit les inéligibles et leur raison. | État/validation absents. **Manquant**. | MJ, système ; participants. | Personnage mort, non accepté ou sans joueur n'entre pas silencieusement dans la liste. | B04-VIE. |
| B09-REP-003 | SF-005 | La proposition fige type, participants pressentis, état de départ pertinent et version ; une seconde proposition concurrente dans la campagne est refusée. | Aucun agrégat. **Manquant**. | Système ; proposition active. | Deux MJ ne créent pas deux repos applicables ; la proposition courante est restituée après reconnexion. | Phase 5 pour concurrence. |
| B09-REP-004 | DEC-005/014 | Chaque joueur peut confirmer sa préparation et effectuer ses choix. Un MJ peut aussi répondre à la place de tout joueur inclus, connecté ou non, en choisissant explicitement pour son personnage ; cette substitution est visible et auditée. | Aucun parcours. **Manquant**. | Joueur assigné ou MJ mandataire ; préparation, choix et auteur effectif. | Un joueur ne répond pas pour un autre personnage ; le MJ peut le faire sans usurper son auteur ; une réponse obsolète est refusée. | `DR-B09-02` résolue. |
| B09-REP-005 | SF-005, DEC-014 | Un joueur déconnecté ne bloque pas le groupe : le MJ peut répondre à sa place ou l'exclure explicitement ; l'exclusion conserve le personnage strictement inchangé. | Connexion et repos absents. **Manquant**. | MJ ; inclusion, exclusion ou substitution auditée. | Aucune absence ne bloque indéfiniment la résolution ; le détail distingue choix du joueur et choix du MJ. | DEC-005. |
| B09-REP-006 | SF-005 | Modifier type ou participants invalide les préparations devenues ambiguës et exige une nouvelle confirmation des joueurs concernés. | Aucun parcours. **Manquant**. | MJ, joueurs ; révision de proposition. | Un joueur ne reste pas prêt pour un autre type de repos ou après son exclusion/réinclusion. | Audit B09. |
| B09-REP-007 | PHB24 p. 373, B04 | Pendant un repos court, le joueur ou le MJ qui répond à sa place choisit séquentiellement les dés de vie à dépenser et voit le soin serveur après chaque dé avant d'en choisir un autre. | Dés de vie courants absents. **Manquant**. | Joueur, MJ mandataire, système ; pool, CON et PV. | Aucun dé n'est consommé avant validation finale ; chaque choix conserve son auteur ; le résultat préparé est figé et appliqué une fois. | B04-VIE-009. |
| B09-REP-008 | PHB24 p. 232–233, B07, DEC-014 | Un repos court peut aussi servir à identifier, harmoniser ou rompre une harmonisation selon les règles ; le joueur ou le MJ mandataire fait ces choix et les incompatibilités sont refusées. | Harmonisation absente. **Manquant**. | Joueur ou MJ mandataire ; objet détenu et activité. | Identifier et harmoniser le même objet ne se font pas pendant le même repos ; interruption annule le choix ; l'auteur reste visible. | B04-INV/B07. |
| B09-REP-009 | PHB24 p. 370–371, B04 | Le repos long contrôle 8 heures, sommeil, activité légère, au moins 1 PV et délai de 16 heures avant un nouveau repos long. | Horloge d'aventure absente. **Manquant**. | Système, MJ ; temps fictionnel et état vital. | Toute condition invalide est signalée avant confirmation ; aucune récompense partielle non prévue. | B04-VIE-011. |
| B09-REP-010 | PHB24 p. 370–373 | Initiative, sort autre qu'un sort mineur, dégâts et autres interruptions prévues terminent le repos au moment fictionnel exact. | Déclencheurs absents. **Manquant**. | Système, MJ ; cause et durée écoulée. | Repos court interrompu : aucun bénéfice ; repos long interrompu avant 1 heure : aucun bénéfice. | B04-VIE-010/013. |
| B09-REP-011 | PHB24 p. 370–371, DEC-014 | Un repos long interrompu après au moins 1 heure devient une étape de repos court à finaliser : les joueurs ou le MJ mandataire effectuent les choix admissibles, puis le MJ valide. La reprise du repos long reste distincte et exige 1 heure supplémentaire par interruption. | Aucun parcours. **Manquant**. | MJ, joueurs ; conversion, choix et reprise. | Aucun bénéfice court n'est inventé ; validation puis reprise ne doublent aucun gain. | `DR-B09-03` résolue. |
| B09-REP-012 | SF-005, B04 | Le MJ valide finalement le repos ; tous les effets des seuls participants inclus sont calculés puis persistés comme une seule opération fonctionnelle. | Fonctionnalité absente. **Manquant**. | MJ, système ; avant/après de chaque participant. | Un échec sur un participant ne repose personne ; répétition de commande n'applique pas deux fois. | Phase 5 pour transaction/idempotence. |
| B09-REP-013 | B04/B06/B07 | La fin validée déclenche exactement les récupérations, soins, dés de vie, épuisement, PV temporaires, harmonisations et échéances correspondant au type de repos. | Effets descriptifs seulement. **Manquant**. | Système ; registre des déclencheurs. | Une ressource `repos long` ne revient pas sur repos court ; un repos interrompu ne déclenche rien. | B04-RES. |
| B09-REP-014 | SF-002, DEC-011 | Un repos long achevé ouvre la fenêtre de préparation des sorts jusqu'au prochain combat ; il ne modifie aucun sort automatiquement. | Fenêtre et sorts courants absents. **Manquant**. | Joueur ; quota et source de préparation. | Plusieurs sauvegardes respectent le changement net autorisé ; le lancement d'un combat ferme la fenêtre. | B06-PRP. |
| B09-REP-015 | DEC-009/011 | Repos, interruption, exclusion, choix, validation et effets automatiques sont audités avec leurs projections ; aucune horloge réelle ne remplace le temps fictionnel. | Audit et temps absents. **Manquant**. | MJ, joueurs ; chronologie. | Redémarrage conserve la proposition exacte ; seul un MJ avance ou arbitre le temps hors combat. | B09-AUD. |

## Matrice — génération et récupération du butin

| ID | Source | Cible | État actuel | Acteurs et données | Critères d'acceptation | Décision / traçabilité |
|---|---|---|---|---|---|---|
| B09-BUT-001 | SF-003/005, DEC-004 | Le MJ termine explicitement le combat avant d'ouvrir `BUTIN` ; aucun adversaire à 0 PV ne déclenche seul cette transition. | Combat absent. **Manquant**. | MJ ; combat et état attendu. | Une commande sur un combat déjà terminé ou une version obsolète n'ouvre aucun contenant. | B05-CYC. |
| B09-BUT-002 | SF-005, DEC-014 | Chaque source distingue les objets obligatoirement placés par le MJ sur la créature, ses possessions réellement récupérables, la monnaie, les tables aléatoires et les objets cachés. Les éléments obligatoires et possessions sont figés avec l'instance au lancement et rejoignent toujours le même contenant que les résultats générés. | Inventaire simple, aucune source. **Manquant**. | MJ ; définition préparée, instance de créature et scène. | Une attaque nommée comme une arme ne crée rien ; un objet effectivement imposé ou porté est présent même si les tables aléatoires ne produisent aucun résultat. | B07/B08. |
| B09-BUT-003 | DMG24 p. 120–121 | Trésor individuel, trésor accumulé, récompense de quête et préférence de créature sont des outils du MJ ; le produit n'impose ni fréquence ni quantité du DMG. | Aucune génération. **Manquant**. | MJ ; FP, préférence et choix de table. | Le MJ peut ne rien attribuer ou imposer un contenu ; aucune table n'accorde de PX personnage. | B08-ENC. |
| B09-BUT-004 | DMG24 p. 120–121, 213–218, DEC-014 | Pendant la préparation, le MJ fixe table, paramètres, visibilité et mode moyenne ou dés sans résoudre l'aléatoire. Les objets obligatoires et possessions récupérables restent indépendants de ce mode. | Données et historique absents. **Manquant**. | MJ, système ; paramètres de génération serveur. | Mode moyenne ne lance aucun dé ; mode dés ne cumule jamais moyenne et résultat ; aucun réglage aléatoire ne retire un objet imposé. | `DR-B09-04` résolue. |
| B09-BUT-005 | DEC-005/014 | À la première ouverture autorisée du contenant, le serveur y réunit les éléments obligatoires figés et résout une seule fois toutes les sources aléatoires préparées, visibles ou cachées. Le résultat complet est persisté avant projection ; l'investigation lit ce même contenu et ne génère jamais une seconde fois. | Aucun contenant. **Manquant**. | Système ; clé de génération, éléments figés et résultat. | Deux premières ouvertures concurrentes produisent les mêmes identifiants et quantités ; reconnexion, réouverture et investigation ne relancent aucune table. | `DR-B09-04` résolue. |
| B09-BUT-006 | B05/B08, DEC-014 | Seules les créatures vaincues laissant un cadavre ou une source explicitement récupérable ouvrent un contenant ; une invocation disparue ne produit rien par défaut. Les objets imposés par le MJ ne survivent que si leur instance ou leur règle prévoit une récupération. | Créatures et butin absents. **Manquant**. | Système, MJ ; état final, objets figés et exception. | Disparition, fuite ou créature non vaincue n'inventent ni cadavre ni équipement ; un objet récupérable imposé n'est pas perdu par la génération. | B08-INS-010. |
| B09-BUT-007 | SF-005, DEC-005 | Un participant ouvre le contenant visible d'une créature vaincue depuis son portrait. Le premier accès validé acquiert un bail exclusif persistant ; les autres voient qui fouille et ne peuvent ni ouvrir ni prendre tant que le bail reste valide. | UI et temps réel absents. **Manquant**. | Joueurs participants, MJ ; contenant, détenteur et échéance du bail. | Un non-participant est refusé ; deux accès concurrents n'obtiennent jamais le bail ; fermeture ou inactivité le libère sans verrou permanent. | Phase 5B. |
| B09-BUT-008 | DEC-004/005 | La persistance précède la diffusion ; un événement de prise indique le nouvel état sans devenir la source de vérité. | Aucun canal de jeu. **Manquant**. | Système ; version de contenant. | Client déconnecté recharge le même état ; événement perdu ne perd aucune acquisition. | Phase 5 temps réel. |
| B09-BUT-009 | SF-005, B07 | Une prise déplace le même exemplaire ou la quantité choisie du contenant vers le personnage, sans duplication ni recréation de provenance. | Exemplaires absents. **Manquant**. | Joueur assigné ; objet, quantité et destination. | Quantité nulle ou supérieure refusée ; une pile partielle laisse le reliquat exact. | B07-POS. |
| B09-BUT-010 | SF-005 | Seul le détenteur du bail de fouille peut acquérir. Chaque prise vérifie ensemble bail, révision du contenant, quantité et inventaire destination ; toute concurrence obsolète échoue proprement. | Concurrence absente. **Manquant**. | Système ; bail, versions et quantité. | Deux prises du dernier exemplaire produisent un seul propriétaire et aucune quantité négative ; un ancien détenteur ne peut plus prendre après expiration. | Phase 5B. |
| B09-BUT-011 | B07, DEC-012 | Permission, capacité de port activée, conteneur et autres invariants sont validés avant le déplacement ; un refus ne réserve ni ne consomme l'objet. | Charge et exemplaires absents. **Manquant**. | Système ; inventaire destination. | Dépassement bloqué laisse le butin disponible aux autres ; aucun état transitoire caché. | B07-ENC. |
| B09-BUT-012 | SF-005, B04, DEC-014 | La monnaie conserve ses cinq dénominations et sa provenance. Chaque dénomination forme une pile récupérable partiellement comme un objet ; la première prise serveur valide gagne. Aucune bourse de groupe, conversion ou répartition automatique n'est créée. | Un entier d'or seulement. **Contraire à la cible**. | Joueurs, MJ ; CP/SP/EP/GP/PP et quantité choisie. | Chaque quantité reste entière et non négative ; deux prises concurrentes du reliquat n'attribuent qu'une fois ; aucune pièce n'est convertie. | `DR-B09-05` résolue. |
| B09-BUT-013 | DMG24 p. 213–218, B07 | Gemmes, objets d'art, lingots et marchandises sont des exemplaires valorisés, pas de la monnaie automatiquement convertie. | Catalogues absents. **Manquant**. | MJ, joueurs ; objet, poids et valeur indicative. | Prendre une gemme déplace l'objet ; le solde monétaire ne change pas sans action explicite. | B07-CAT. |
| B09-BUT-014 | DMG24 p. 218–220 | Le MJ choisit les objets magiques ; les tables, quotas indicatifs et souhaits joueurs l'assistent sans garantir une récompense ni corriger automatiquement un écart. | Catalogue magique absent. **Manquant**. | MJ ; rareté, thème et historique d'attribution. | Dépasser un repère affiche une information, jamais un refus mécanique. | B07-MAG. |
| B09-BUT-015 | SF-005, DEC-005 | Aucun mécanisme de besoin/cupidité, enchère ou vote n'est introduit au MVP. Le bail de fouille réserve temporairement l'accès au contenant, jamais la propriété d'un objet : seule une prise persistée attribue le bien. | Aucun workflow. **Manquant**. | Participants ; bail et commande de prise. | Un bail expiré n'accorde aucun droit futur ; les joueurs voient la libération puis toute disparition validée. | Phase 5B. |
| B09-BUT-016 | DEC-009 | Le MJ peut corriger un contenu ou une attribution avec motif sans supprimer la génération initiale ; la correction respecte possession et provenance. | Correction absente. **Manquant**. | MJ ; avant/après et cause. | Rendre un objet au contenant ou le réattribuer crée une compensation lisible et jamais un doublon. | B09-COR. |
| B09-BUT-017 | DEC-004/005 | La phase reste persistante jusqu'à fermeture explicite par un MJ ; aucun délai réel, déconnexion ou contenant vide ne la ferme. | Combat absent. **Manquant**. | MJ ; état `BUTIN`. | Fermer deux fois est sans effet supplémentaire ; un dernier objet pris ne clôt pas automatiquement. | B09-RES. |

## Matrice — investigation privée et objets cachés

| ID | Source | Cible | État actuel | Acteurs et données | Critères d'acceptation | Décision / traçabilité |
|---|---|---|---|---|---|---|
| B09-INV-001 | PHB24 p. 14–15, 372 ; DMG24 p. 35 ; DEC-014 | Par décision produit dérogatoire, la recherche ciblée d'un butin sur une dépouille utilise Intelligence (Investigation). Cette exception ne remplace pas Recherche avec Sagesse (Perception) pour repérer en général une créature ou un objet dissimulé, ni Étude pour les autres déductions. | Compétences calculées, aucun parcours. **Manquant**. | Joueur, MJ ; dépouille ciblée et compétence. | Une fouille de dépouille utilise Investigation ; une recherche générique hors butin conserve la distinction PHB/DMG. | `DR-B09-06` résolue. |
| B09-INV-002 | SF-005 | Chaque personnage participant dispose d'une tentative par cadavre, indépendamment des tentatives des autres personnages. | Aucun compteur. **Manquant**. | Joueur assigné ; personnage et source. | Reconnexion ou changement de client ne rend pas la tentative ; deux cadavres ont deux compteurs. | Décision validée. |
| B09-INV-003 | SF-005, DMG24 p. 27–31 | Le MJ fixe avant le jet le DD, la compétence applicable, les éléments découvrables et les conséquences ; ces données restent privées. | Préparation absente. **Manquant**. | MJ ; défi secret versionné. | Un contenant sans règle complète ne demande aucun jet inventé ; modifier après coup exige correction. | B09-DIC. |
| B09-INV-004 | DEC-005 | Le serveur lance le test avec la fiche et l'état courants ; tentative, faces, total et résolution sont persistés ensemble. | Jet et tentative absents. **Manquant**. | Système ; version de personnage et effets. | Répéter une commande ne consomme pas une seconde tentative et ne relance pas. | Phase 5 idempotence. |
| B09-INV-005 | SF-005 | Jet, échec, DD et découverte ne sont visibles que de l'investigateur et des MJ ; les autres ne reçoivent même pas l'existence d'un secret. | Projection privée absente. **Manquant**. | Investigateur, MJ ; audience. | Événement partagé ne contient ni clé d'objet, ni seuil, ni booléen de réussite. | DEC-002/011. |
| B09-INV-006 | SF-005 | Une réussite accorde au personnage une connaissance privée du contenu caché, pas sa possession automatique. | Connaissance et visibilité absentes. **Manquant**. | Investigateur ; ensemble découvert. | L'objet reste dans le contenant jusqu'à prise valide ; capacité de port n'affecte pas la découverte. | B07/B09-BUT. |
| B09-INV-007 | SF-005 | Plusieurs personnages peuvent découvrir indépendamment le même exemplaire tant qu'il n'est pas récupéré. | Aucun parcours. **Manquant**. | Système ; audiences par exemplaire. | La réussite de B n'est pas révélée à A ; tous deux voient l'objet seulement dans leur projection autorisée. | Décision validée. |
| B09-INV-008 | SF-005 | La première prise valide retire l'exemplaire de toutes les projections autorisées ; les connaisseurs peuvent apprendre qu'il n'est plus disponible sans connaître le preneur si leur projection ne l'autorise pas. | Aucun parcours. **Manquant**. | Système ; exemplaire et audiences. | Aucun client ne peut encore prendre l'identifiant obsolète ; aucune information excessive n'est diffusée. | SF-001. |
| B09-INV-009 | SF-005 | Un MJ peut réinitialiser la tentative d'un personnage pour un cadavre précis ; la remise à zéro est explicite, motivée et auditée. | Compteur et correction absents. **Manquant**. | MJ ; personnage, source et motif. | Réinitialiser A ne rend aucune tentative à B et ne masque pas l'ancien échec. | B09-COR/AUD. |
| B09-INV-010 | DMG24 p. 35–36 | Un contenu essentiel à la poursuite de l'aventure ne repose pas sur une unique découverte aléatoire automatisée ; le MJ conserve l'arbitrage narratif. | Aucun parcours. **Manquant**. | MJ ; qualification narrative. | Le produit avertit le MJ lors de la préparation, sans révéler l'essentiel aux joueurs ni interdire son choix. | Conseil DMG, non blocage. |

## Matrice — fermeture et réserve MJ

| ID | Source | Cible | État actuel | Acteurs et données | Critères d'acceptation | Décision / traçabilité |
|---|---|---|---|---|---|---|
| B09-RES-001 | SF-005, DEC-005 | Un MJ actif ferme explicitement la phase de butin après confirmation de la version courante. | Phase absente. **Manquant**. | MJ ; combat et version. | Un joueur ou ancien MJ ne ferme rien ; une version obsolète demande relecture. | SF-001. |
| B09-RES-002 | SF-005 | La fermeture transfère ensemble tous les objets et monnaies non récupérés vers la réserve de campagne. | Réserve absente. **Manquant**. | Système ; reliquats visibles et cachés. | Aucun secret non découvert n'est perdu ; échec d'un transfert laisse `BUTIN` intact. | Phase 5 transaction. |
| B09-RES-003 | SF-005 | Chaque entrée de réserve conserve campagne, combat, créature ou scène, génération, objet ou dénomination, quantité et visibilité d'origine. | Provenance absente. **Manquant**. | MJ ; entrée de réserve. | Deux objets de même clé issus de combats différents restent retraçables et ne fusionnent pas leur historique. | B07-PRO. |
| B09-RES-004 | SF-005, DEC-004 | Le combat passe à `TERMINÉ` seulement après le transfert complet ; le butin clos n'est jamais rouvert. Cette transition rend supprimables les sauvegardes détaillées d'interactions et l'état de reprise du combat. | Combat absent. **Manquant**. | Système ; transition finale et nettoyage relançable. | Répéter la fermeture ne retransfère rien ; le nettoyage ne retire aucune conséquence durable ni provenance ; dupliquer crée une nouvelle préparation. | Phase 5B. |
| B09-RES-005 | DEC-002/005 | Seuls les MJ actifs voient la réserve complète et ses secrets ; aucun joueur ne peut la lister ou en déduire le volume. | Projection absente. **Manquant**. | MJ ; catalogue privé. | Réponse joueur ne contient ni total, ni provenance, ni identifiant d'entrée. | SF-001. |
| B09-RES-006 | SF-005, DEC-012 | Un MJ actif peut attribuer tout ou partie d'une entrée à n'importe quel personnage actif de la campagne, sans consentement joueur supplémentaire. | Attribution directe absente. **Manquant**. | MJ ; entrée, quantité et personnage. | Destination extérieure, morte/archivée ou quantité excessive refusée ; le reste demeure en réserve. | Décisions existantes. |
| B09-RES-007 | B07, DEC-012 | L'attribution valide capacité, conteneur et invariants avant déplacement ; un refus conserve intégralement la réserve. | Invariants absents. **Manquant**. | Système ; destination. | Une charge dépassée n'efface ni ne réserve l'objet ; le MJ peut corriger ou choisir une autre destination. | B07. |
| B09-RES-008 | DEC-009 | La réserve n'autorise ni suppression silencieuse ni édition de provenance ; dépense, retrait narratif ou correction sont des événements motivés conservant avant/après. | Audit absent. **Manquant**. | MJ ; motif et transition. | Une entrée ramenée à zéro reste relisible dans l'historique sans apparaître comme disponible. | B09-COR/AUD. |

## Matrice — corrections compensatoires

| ID | Source | Cible | État actuel | Acteurs et données | Critères d'acceptation | Décision / traçabilité |
|---|---|---|---|---|---|---|
| B09-COR-001 | DEC-009 | Tout MJ actif peut corriger l'état d'aventure à tout moment, y compris en combat, avec motif obligatoire. | Correction absente. **Manquant**. | MJ ; intention corrigée et motif. | Acteur non MJ, motif vide ou ressource étrangère sont refusés sans mutation. | B04-COR. |
| B09-COR-002 | DEC-009 | Une correction compense un événement ; elle ne le supprime, ne le modifie et ne réécrit jamais l'historique. | Historique absent. **Manquant**. | Système ; événement source et compensation. | L'état courant change mais l'ancien événement reste relisible avec le lien correctif. | Décision validée. |
| B09-COR-003 | DEC-009 | Le MJ corrige l'intention ; le même moteur de transition recalcule toutes les conséquences dépendantes. | Moteur courant absent. **Manquant**. | MJ, système ; commande métier. | Passer les PV au-dessus de 0 termine les jets de mort applicables ; aucune combinaison invalide ne persiste. | B04-COR. |
| B09-COR-004 | DEC-009 | Une correction respecte permissions, campagne, bornes, non-négativité, maxima, identité d'exemplaire et invariants de cycle. | Contrôles locaux partiels seulement. **Partiel / manquant**. | Système ; état avant/après. | Aucun motif ne permet quantité négative, doublon d'objet ou référence intercampagne. | SF-001/B07. |
| B09-COR-005 | DEC-009 | Une correction multi-champs est fonctionnellement indivisible et versionnée. | Aucune correction. **Manquant**. | Système ; version attendue. | Conflit concurrent refuse tout le lot ; aucune moitié de correction n'est visible. | Phase 5 transaction. |
| B09-COR-006 | DEC-009 | Le journal conserve ancienne valeur, nouvelle valeur, auteur, rôle effectif, date, version, motif, source citée et conséquences automatiques. | `createdAt/updatedAt` seulement. **Manquant**. | MJ, système ; entrée d'audit. | Chaque valeur publique ou privée reste projetée selon son audience, jamais supprimée. | B09-AUD. |
| B09-COR-007 | DEC-009 | Une exception D&D non automatisée peut justifier une correction si l'état final reste structurellement valide et la source est citée. | Aucun parcours. **Manquant**. | MJ ; référence de règle et arbitrage. | Le texte libre n'exécute aucun code et ne contourne aucune limite structurelle. | DEC-006/009. |
| B09-COR-008 | DEC-002/009 | Le joueur assigné voit les corrections de son personnage ; tous les MJ voient le détail ; les autres ne voient que le nouvel état normalement public. | Visibilité actuelle trop large, audit absent. **Contraire à la cible**. | Joueur, MJ ; projections. | Un motif secret ou ancien inventaire n'est jamais envoyé à un autre joueur. | SF-001. |
| B09-COR-009 | B05/B09 | Validation, jet, repos, butin, tentative et réserve utilisent des corrections spécialisées plutôt qu'une édition générique de document. | Réédition de build directe seulement. **Manquant**. | MJ ; type de correction. | Corriger un DD, une prise ou une inclusion conserve le vocabulaire et les invariants de l'opération d'origine. | Phase 5 pour commandes. |

## Matrice — audit fonctionnel et reprise

| ID | Source | Cible | État actuel | Acteurs et données | Critères d'acceptation | Décision / traçabilité |
|---|---|---|---|---|---|---|
| B09-AUD-001 | DEC-003/004/005/009/011 | Toute décision ou mutation fonctionnelle acceptée de B09 produit une entrée ordonnée et persistante avant diffusion. | Horodatages d'agrégats seulement. **Manquant**. | Système ; acteur, commande et résultat. | Redémarrage restitue le même ordre ; une animation ou notification n'existe pas sans état persisté. | Phase 5 représentation. |
| B09-AUD-002 | DEC-009 | Une entrée nomme campagne, agrégat, acteur, rôle effectif, date fictionnelle si pertinente, date système, action, version avant/après et corrélation causale. | Aucun journal. **Manquant**. | Système ; métadonnées fonctionnelles. | Promotion ultérieure ne réécrit pas le rôle au moment de l'action. | Gouvernance. |
| B09-AUD-003 | DEC-005/011 | Données secrètes et données publiques appartiennent à des projections distinctes d'une même action ; le secret n'est jamais envoyé puis masqué par le client. | Projections absentes. **Manquant**. | Système ; audience par champ ou événement. | Joueur non autorisé ne reçoit ni valeur redigée réversible ni identifiant révélateur. | SF-001. |
| B09-AUD-004 | DEC-003/009 | Refus de validation, annulation de repos, remise à zéro d'investigation, fermeture de butin et corrections sont toujours conservés avec leur motif. | Aucun historique. **Manquant**. | MJ ; décision et motif. | Une action annulée reste distincte d'une action jamais commencée. | Cible existante. |
| B09-AUD-005 | Gouvernance, DEC-014/016 | Les conflits et refus de règle utiles restent dans l'audit fonctionnel. Les étapes détaillées d'un combat sont conservées jusqu'à la clôture du butin puis supprimées avec les données de reprise ; les autres audits n'ont aucun TTL. Les traces de sécurité restent dans un journal technique séparé, minimisé et conservé douze mois. | Aucun journal. **Manquant**. | Système, MJ, plateforme ; refus, audience et catégorie. | Un refus ne contient pas de secret inaccessible ; la clôture conserve les conséquences et la provenance sans les étapes ; aucun MJ n'accède au journal de sécurité. | Phase 5B. |
| B09-AUD-006 | DEC-002/003/009 | Un joueur consulte l'historique fonctionnel de son personnage et ses décisions privées ; les MJ consultent tout l'historique de campagne ; les autres n'ont aucun accès. | Historique absent. **Manquant**. | Joueur, MJ ; filtres autorisés. | Un joueur ne peut rechercher l'historique d'un autre identifiant même connu. | SF-001. |
| B09-AUD-007 | DEC-004 | L'audit et l'état courant sont rechargeables indépendamment du canal temps réel ; une reconnexion part de la version persistée puis reçoit les nouveautés autorisées. | Temps réel absent. **Manquant**. | Système ; curseur ou version à définir. | Perte d'événement ne crée aucune divergence durable ; aucun état mémoire seul n'est autoritaire. | Phase 5 protocole. |
| B09-AUD-008 | DEC-009 | Aucune interface MVP ne supprime ou modifie une entrée fonctionnelle ; archivage de campagne et politique de rétention ne doivent pas rendre l'état courant inexplicable. | Suppression de campagne existe, audit absent. **Ambigu**. | Propriétaire, système ; cycle de conservation. | Avant politique technique, aucune purge partielle n'est inventée dans B09. | Décision technique future. |
| B09-AUD-009 | Gouvernance | Un export ou une preuve externe de l'audit n'est pas requis au MVP ; la consultation interne doit néanmoins restituer calculs, motifs et provenance de façon lisible. | Aucun écran. **Manquant**. | Joueur, MJ ; vue chronologique. | Le détail d'un jet refait l'addition et celui d'une correction montre avant/après sans accès base de données. | Exigence produit. |

## Décisions validées le 20 août 2026

- `DR-B09-01` — les jets des joueurs sont publics par défaut avec option privée
  préalable ; le MJ choisit public ou secret, secret par défaut ; une règle plus
  restrictive prévaut.
- `DR-B09-02` — un MJ peut répondre à la place d'un joueur inclus dans un repos,
  connecté ou non. Chaque choix conserve son auteur effectif dans l'audit.
- `DR-B09-03` — un repos long interrompu après au moins 1 heure devient une étape de
  repos court à finaliser avant une éventuelle reprise distincte du repos long.
- `DR-B09-04` — les objets imposés et possessions récupérables sont figés avec la
  créature ; les sources aléatoires préparées sont résolues une fois à la première
  ouverture, puis réunies dans le même contenant visible ou investigable.
- `DR-B09-05` — chaque dénomination monétaire est une pile récupérable partiellement ;
  seul le détenteur du bail de fouille peut prendre, la première prise serveur valide
  gagne et aucune bourse de groupe n'est créée.
- `DR-B09-06` — la fouille ciblée d'une dépouille emploie Intelligence
  (Investigation), comme dérogation produit limitée à ce parcours.
- `DR-B09-07` — les conflits et refus de règle utiles aux MJ restent dans l'audit
  fonctionnel hors nettoyage terminal du combat ; refus d'autorisation et traces de
  sécurité restent séparés et sont conservés douze mois.

## Synthèse des écarts

| Domaine | Qualification dominante | Risque principal |
|---|---|---|
| Validation de fiche | **Manquant / contraire** | Une fiche devient directement éditable et utilisable sans décision MJ versionnée |
| Jets libres | **Manquant**, socle de dé partiel | Résultat non autoritaire, bonus faux ou secret divulgué |
| Repos collectif | **Manquant** | Récupérations partielles, doublées ou appliquées à un personnage exclu |
| Butin concurrent | **Manquant** | Duplication d'exemplaires, quantité négative ou régénération après reconnexion |
| Investigation privée | **Manquant**, dérogation produit documentée | Dérogation appliquée hors périmètre ou fuite d'un objet caché |
| Réserve MJ | **Manquant** | Perte de provenance ou exposition du contenu secret |
| Corrections | **Manquant** | Édition destructive et état incohérent |
| Audit fonctionnel | **Manquant** | Impossible d'expliquer une décision, un calcul ou une compensation |

## Validation du bloc

Les sept décisions ont été répondues, intégrées dans la matrice et consolidées dans
`DEC-014`. Les exigences, écarts, traçabilité, statuts documentaires et plan de
conformité sont synchronisés. Aucun code, test, dépendance, seed, migration ou CI n'a
été modifié.

Le propriétaire a explicitement validé l'ensemble des 90 règles de ce document le
20 août 2026. Le bloc B09 est terminé au sens du plan de conformité.
