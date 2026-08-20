# B06 — Sorts et effets magiques

## Statut

**SPÉCIFICATION VALIDÉE PAR LE PROPRIÉTAIRE LE 20 AOÛT 2026.**

Ce document inventorie le bloc B06 défini dans
[`DND-2024-COMPLIANCE-PLAN.md`](../../DND-2024-COMPLIANCE-PLAN.md). Il décrit la cible
et les écarts observés ; il n'autorise aucune implémentation.

Les 82 règles communes, les 391 profils du
[`registre des sorts`](B06-SPELL-REGISTRY.md) et les décisions `DR-B06-01` à
`DR-B06-05` sont validés. La validation ne modifie ni code, ni tests, ni données de jeu.

## Sources et conventions

### Sources normatives disponibles

- `PHB24` — [`PlayersHandbook2024.pdf`](../../books/PlayersHandbook2024.pdf), source
  primaire locale ; les pages citées sont celles imprimées ;
- `SF-002` à `SF-005` dans [`REQUIREMENTS.md`](../../REQUIREMENTS.md) ;
- [`DEC-003`](../../DECISIONS/003-character-lifecycle.md),
  [`DEC-004`](../../DECISIONS/004-combat-and-realtime.md),
  [`DEC-005`](../../DECISIONS/005-dice-rest-and-loot.md),
  [`DEC-009`](../../DECISIONS/009-adventure-state-and-corrections.md),
  [`DEC-010`](../../DECISIONS/010-common-combat-engine.md) et
  [`DEC-011`](../../DECISIONS/011-spells-and-magical-effects.md) ;
- les matrices validées [`B01`](B01-LEVEL-ONE-CREATION.md),
  [`B02`](B02-LEVELS-TWO-TO-TWENTY.md),
  [`B03`](B03-MULTICLASSING-AND-RESPECIALIZATION.md),
  [`B04`](B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md) et
  [`B05`](B05-COMMON-COMBAT-ENGINE.md).

### Pointage primaire du bloc

| Domaine | Pages `PHB24` contrôlées |
|---|---|
| Listes, préparation et capacités d'incantation des classes | p. 58–174 |
| Dons et exceptions accordant ou modifiant des sorts | p. 199–211 |
| Composantes, focaliseurs et parchemins | p. 223, 232–233 |
| Acquisition, préparation, emplacements et rituels | p. 235–236 |
| Temps d'incantation, portée, composantes et durée | p. 236–237 |
| Cibles, zones, sauvegardes, attaques et cumul | p. 237–238 |
| Descriptions et profils créés par les 391 sorts | p. 239–357 |
| Glossaire : zones, concentration, illusions, magie et téléportation | p. 360–377 |

Les pages 235–239 et les entrées pertinentes du glossaire ont été rendues et contrôlées
visuellement. Les descriptions p. 239–357 ont été contrôlées par leur texte et leur
inventaire ; les extractions JSON restent des constats non normatifs.

### Limites entre blocs

- B01 à B03 déterminent acquisition, progression, multiclassage et reconstruction des
  listes ; B06 fixe leur utilisation et toutes les exceptions de sort.
- B04 persiste emplacements, concentration, PV, conditions et effets ; B06 produit et
  termine les instances magiques correspondantes.
- B05 fournit actions, géométrie, jets, dégâts, Réactions et persistance de combat ;
  B06 paramètre ce moteur par sort.
- B07 définit objets, focaliseurs, composants et parchemins ; B06 dit ce qu'un lancement
  exige et consomme.
- B08 fournit les profils des créatures invoquées ; B06 fixe apparition, contrôle,
  initiative, durée et disparition.
- B09 orchestre repos et temps de campagne ; B06 définit les échéances à faire avancer.
- Aucun schéma, endpoint, interpréteur de règles ou transaction n'est décidé ici.

### État actuel inspecté

- `docs/characteres/spells.seed.json` contient 390 sorts ; `telepathy`, niveau 8 de
  Divination du Magicien, est l'unique identité PHB absente ;
- le runtime TypeScript contient 99 sorts de niveaux 0–1 et interdit les niveaux 2–9 ;
- `spells.effects.json` associe 506 annotations aux 390 clés : 316 `active`, 13
  `reactive` et 177 `informational`, sans moteur d'exécution ;
- plusieurs annotations perdent la sémantique du texte, par exemple une condition
  `invisible` pour *Shining Smite* ou `incapacitated` pour *Find Steed* ;
- la création filtre des listes côté interface, mais le backend ne prouve pas toujours
  liste, quota, niveau et provenance ;
- aucun état courant d'emplacements, concentration exécutable, zone magique, durée,
  composant consommable, invocation ou registre d'effet persistant n'existe.

Les qualifications sont **Conforme**, **Partiel**, **Manquant**, **Ambigu**, **Dette**,
**Obsolète** et **Contraire à la cible**.

## Matrice — catalogue, identité et provenance

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B06-CAT-001 | PHB24 p. 239–357 | Le catalogue couvre exactement 391 sorts : 34/64/63/52/41/48/34/21/18/16 aux niveaux 0 à 9. | 390 ; `telepathy` manque. **Manquant**. | Système ; identité et niveau. | Aucune identité absente, dupliquée ou hors PHB ; total et dix sous-totaux exacts. | [Registre B06](B06-SPELL-REGISTRY.md), B01/B02. |
| B06-CAT-002 | PHB24 p. 235–357 | Chaque sort conserve clé stable, nom, niveau, école, listes, temps, portée, V/S/M, durée, Rituel, Concentration et texte source. | Runtime limité et champs surtout textuels. **Partiel**. | Système, MJ ; référentiel. | Chaque valeur est pointable au PHB et toute errata est versionnée. | Phase 5 pour le modèle. |
| B06-CAT-003 | PHB24 p. 236 | Les huit écoles décrivent le sort sans créer seules une conséquence ; une règle qui cite une école peut la filtrer. | École présente. **Conforme comme donnée, non exploitée**. | Système ; école et filtre. | Aucun effet n'est déduit de l'école seule ; les restrictions d'école sont validées. | B02. |
| B06-CAT-004 | PHB24 p. 236, B01–B03 | Liste de classe et source réellement acquise sont distinctes. Chaque occurrence préparée garde classe, don, espèce, sous-classe, invocation, objet ou profil qui l'accorde. | Sources niveau 1 partiellement agrégées. **Partiel**. | Système ; occurrence et provenance. | Le même sort acquis deux fois reste résoluble avec chaque caractéristique et permission. | B03-INC. |
| B06-CAT-005 | PHB24 p. 235 | Un sort toujours préparé n'occupe jamais le quota modifiable, mais reste soumis à ses autres conditions de lancement. | Sources insuffisamment structurées. **Manquant / partiel**. | Système ; octroi et quota. | Ajouter/retirer la source ajuste la disponibilité sans altérer les choix ordinaires. | B02-SOR. |
| B06-CAT-006 | PHB24 p. 235–357 | Chaque description possède un profil fonctionnel exhaustif : paramètres, préconditions, coûts, cibles, jets, échéances, conséquences, fins et arbitrage éventuel. | Notes partielles et parfois fausses. **Manquant**. | Système, MJ ; profil par sort. | Toute phrase mécanique a au moins un cas nominal, une borne ou un refus testable ; aucun `informational` ne clôt la couverture. | `DR-B06-01`. |
| B06-CAT-007 | DEC-006 | Aucun sort personnalisé n'est créé dans le MVP ; seuls les sorts des sources autorisées sont lançables. | Clés libres dans plusieurs contrats. **Contraire à la cible**. | Système ; catalogue autorisé. | Une clé arbitraire est refusée ; aucune note ou payload client ne crée un sort. | DEC-006. |
| B06-CAT-008 | PHB24 p. 235–357 | Une incohérence de profil bloque le lancement concerné sans inventer de valeur ; elle est signalée comme donnée requise. | Le texte peut masquer une annotation incomplète. **Dette**. | Système, MJ ; version du profil. | Aucun défaut ne devient dégâts, durée, cible ou coût implicite ; les autres sorts restent disponibles. | Gouvernance. |

## Matrice — préparation, accès et emplacements

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B06-PRE-001 | PHB24 p. 235 | Barde, Ensorceleur et Occultiste changent un sort préparé lors d'un niveau ; Clerc, Druide et Magicien changent tout après repos long ; Paladin et Rôdeur en changent un après repos long. | Parcours niveau 1 seulement. **Manquant**. | Joueur, système ; source, moment et différence. | Chaque classe accepte exactement son moment et son quota ; aucun changement croisé entre sources. | `DR-B06-04`. |
| B06-PRE-002 | DEC-005, SF-002 | Un repos long achevé ouvre la fenêtre de préparation jusqu'au prochain combat ; plusieurs sauvegardes sont permises, mais la différence nette respecte B06-PRE-001. | Fenêtre absente. **Manquant**. | Joueur, MJ, système ; repos et version de liste. | Une sauvegarde intermédiaire ne réinitialise pas le quota ; lancement du combat ferme la fenêtre. | `DR-B06-04`. |
| B06-PRE-003 | PHB24 p. 235, B02 | Les sorts toujours préparés, de domaine, serment, cercle ou autre source n'occupent pas le quota ordinaire et ne deviennent pas remplaçables par lui. | Provenance incomplète. **Manquant / partiel**. | Système ; octroi et seuil. | Avant/après le seuil de classe, liste et quota divergent exactement. | B02-SOR-003/007. |
| B06-PRE-004 | PHB24 p. 164–166 | Le Magicien prépare depuis son grimoire. *Ritual Adept* lui permet de lancer comme Rituel un sort du grimoire portant le tag sans le préparer. | Grimoire absent. **Manquant**. | Joueur ; grimoire, préparation et Rituel. | Un sort absent du grimoire est refusé ; l'exception rituelle ne prépare pas le sort. | B01/B02. |
| B06-PRE-005 | PHB24 p. 235, 373 | Hors exception explicite, lancer un Rituel exige que le sort soit préparé ; il ajoute 10 minutes et ne dépense aucun emplacement. | Marqueur présent, résolution absente. **Partiel / manquant**. | Lanceur ; mode normal/rituel. | Le mode est choisi avant confirmation ; aucun surclassement ni emplacement n'est consommé par le Rituel. | B06-INC. |
| B06-PRE-006 | PHB24 p. 235 | Un sort mineur se lance sans emplacement ; sa disponibilité provient toujours d'une source valide. | Niveau 0 présent au runtime. **Partiel**. | Lanceur ; occurrence de sort. | Aucun emplacement n'est proposé ou dépensé ; perdre la source retire l'accès. | B01–B03. |
| B06-PRE-007 | PHB24 p. 235 | Une capacité ou un objet peut lancer un sort sans emplacement selon fréquence, cible, composantes et caractéristique explicitement accordées. | Quelques octrois descriptifs. **Partiel / non exécutable**. | Lanceur ; capacité, utilisations et sort. | La fréquence est dépensée une fois ; aucune permission omise n'est déduite. | B07/B08. |
| B06-PRE-008 | PHB24 p. 235, B04 | Un repos long restaure les emplacements d'Incantation dépensés ; chaque autre pool suit son texte, notamment Magie de pacte. | Aucun compteur courant. **Manquant**. | Système ; maxima et dépenses par pool. | La récupération touche seulement les pools dont le déclencheur correspond. | B03/B04. |
| B06-PRE-009 | PHB24 p. 44–45 | En multiclassage, préparation et niveau accessible restent séparés par classe ; emplacements communs et Magie de pacte interopèrent selon B03. | Modèle mono-classe niveau 1. **Manquant**. | Système ; classe source et pool choisi. | Un emplacement supérieur ne déverrouille pas un sort supérieur ; le pool dépensé est explicite. | B03-INC. |
| B06-PRE-010 | B03-RSP | Une respécialisation remplace les listes et pools selon le nouveau build, tout en conservant l'effet déjà actif et sa concentration jusqu'à sa fin normale. | Workflow absent. **Manquant**. | Système ; ancien/nouveau build et effet. | Un ancien sort ne peut plus être relancé, mais son instance conservée reste résoluble. | DEC-003. |

## Matrice — lancement, économie et composantes

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B06-INC-001 | PHB24 p. 235–236 | Le lanceur possède une occurrence accessible, choisit sa source et satisfait toutes ses préconditions avant que le serveur accepte le lancement. | Backend permissif sur plusieurs choix. **Partiel**. | Lanceur, système ; source et état. | Une occurrence inconnue, non préparée ou issue d'une autre fiche est refusée sans coût. | B06-CAT/PRE. |
| B06-INC-002 | PHB24 p. 235 | Porter une armure sans formation interdit tout sort, quelle que soit sa composante. | Formation calculée, interdiction absente. **Partiel / manquant**. | Système ; armure portée et formation. | Retirer l'armure ou acquérir la formation requalifie immédiatement les actions. | B07. |
| B06-INC-003 | PHB24 p. 236 | Sur un même tour, une créature ne dépense qu'un emplacement pour lancer un sort, toutes actions et tous pools confondus. | Tour et dépenses absents. **Manquant**. | Système ; tour et lancements. | Action puis Bonus avec emplacement est refusé ; sort mineur ou lancement sans emplacement reste possible si valide. | B05. |
| B06-INC-004 | PHB24 p. 235–236 | Un sort niveau 1+ dépense un emplacement de son niveau ou supérieur ; le niveau choisi devient le niveau du lancement. | `level1Slots` seulement. **Manquant**. | Lanceur ; pool et niveau. | Un emplacement trop bas est refusé ; un niveau supérieur valide est persisté. | B03/B04. |
| B06-INC-005 | PHB24 p. 236 | Le surclassement modifie uniquement les clauses « emplacement de niveau supérieur » du sort ; sans clause, seul le niveau du lancement change. | Texte libre `higherLevel`. **Partiel / non exécutable**. | Système ; niveau de base/choisi. | Chaque palier et quantité sont exacts ; aucun bonus générique n'est inventé. | B06-RES. |
| B06-INC-006 | PHB24 p. 236, 371 | Action, action Bonus, Réaction et temps longs consomment exactement l'économie indiquée ; un déclencheur obligatoire est revalidé. | Chaînes descriptives. **Manquant**. | Système, contrôleur ; coût et déclencheur. | Une Réaction sans événement ou une action déjà dépensée est refusée. | B05-ACT/REA. |
| B06-INC-007 | PHB24 p. 236, 371 | Un temps de 1 minute ou plus exige l'action Magie à chaque tour et la Concentration pendant toute l'incantation. | Chronologie absente. **Manquant**. | Lanceur ; progression et interruption. | Concentration rompue fait échouer sans dépenser l'emplacement ; recommencer repart de zéro. | B06-DUR. |
| B06-INC-008 | PHB24 p. 372–373 | Préparer un sort par l'action *Ready* le lance et dépense ses ressources immédiatement, puis exige Concentration jusqu'au déclencheur avant le prochain tour. | Action préparée absente. **Manquant**. | Lanceur ; sort, déclencheur et énergie retenue. | Déclencheur absent ou concentration rompue perd l'effet sans remboursement. | B05-ACT/REA. |
| B06-INC-009 | PHB24 p. 236 | Une composante verbale exige une voix normale ; silence, bâillon ou incapacité de parler interdit le lancement. | V booléen présent, états non appliqués. **Partiel / manquant**. | Système ; composante et parole. | Un sort sans V reste éligible ; aucun contournement client n'est accepté. | B04-CON. |
| B06-INC-010 | PHB24 p. 236–237 | Une composante somatique exige au moins une main disponible ; une même main peut aussi accéder au matériel. | S booléen présent, mains absentes. **Partiel / manquant**. | Système ; mains, port et composantes. | Deux mains indisponibles refusent S ; libérer une main requalifie l'action. | B07. |
| B06-INC-011 | PHB24 p. 237, DEC-011 | Sacoche ou focaliseur autorisé remplace seulement un matériel générique, gratuit et non consommé ; il doit être accessible ou tenu comme prévu. | Texte matériel non structuré. **Manquant**. | Lanceur ; objet, source et main. | Un coût, une consommation ou un objet précis refuse le remplacement. | `DR-B06-03`, B07. |
| B06-INC-012 | PHB24 p. 237, DEC-011 | Matériel tarifé, consommé ou précis doit être détenu. Après validation, le lancement le consomme seulement si le texte le dit, même si l'effet échoue normalement. | Inventaire de création sans composants actifs. **Manquant**. | Système ; exemplaire, valeur et quantité. | Précondition invalide ne consomme rien ; cible résistante ou jet raté ne rembourse rien. | `DR-B06-03`, B07. |

## Matrice — portée, ciblage et géométrie

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B06-CIB-001 | PHB24 p. 236 | La portée limite l'origine de l'effet au lancement ; un effet mobile n'y reste pas limité sauf texte contraire. | Portée textuelle. **Partiel / non exécutable**. | Système ; lanceur, origine et instance. | Origine hors portée refusée ; déplacement ultérieur suit exclusivement le sort. | B05-VIS. |
| B06-CIB-002 | PHB24 p. 236, DEC-010 | Toutes les distances emploient `1 pied = 0,3 m`, y compris portée, rayon, longueur, largeur, hauteur et déplacement d'effet. | Chaînes métriques présentes, sans géométrie. **Partiel**. | Système, clients ; mesures. | Prévisualisation et validation produisent la même borne, altitude comprise. | B05. |
| B06-CIB-003 | PHB24 p. 236–238 | `Touch`, `Self`, distance et catégories de cibles sont distincts. `Self` peut produire une zone sans rendre le lanceur cible si la forme l'exclut. | Ciblage absent. **Manquant**. | Lanceur ; mode, cible et origine. | Chaque sort n'accepte que créature, objet, point ou autre entité prévue. | B05. |
| B06-CIB-004 | PHB24 p. 238 | Un choix de créature peut viser le lanceur sauf cible hostile ou « autre créature » ; consentement, alliance et hostilité restent des contraintes séparées. | Relations non exécutées. **Manquant**. | Contrôleurs ; cible et attitude. | Les cas soi/allié/hostile/non consentant divergent exactement. | B05/B08. |
| B06-CIB-005 | PHB24 p. 238 | Cibler exige un chemin clair ; Couverture totale bloque, même si la cible est visible. Visibilité n'est exigée que par le texte. | Obstacles absents. **Manquant**. | Système ; ligne d'effet, visibilité et couverture. | Voir derrière une vitre/obstacle total ne suffit pas ; un sort sans « voir » peut viser autrement si le chemin est clair. | B05-VIS. |
| B06-CIB-006 | PHB24 p. 238, DEC-011 | Une cible invalide n'est pas affectée et l'emplacement reste dépensé. Si réussite signifierait aucun effet, elle paraît avoir réussi ; sinon seule l'absence d'effet est perçue. | Secret et résolution absents. **Manquant**. | Système, MJ ; validité privée et projection. | Le joueur ne reçoit jamais type, immunité ou raison cachée ; le MJ voit le résultat réel. | `DR-B06-01`, SF-001. |
| B06-CIB-007 | PHB24 p. 238, 361–374 | Cône, cube, cylindre, émanation, ligne et sphère suivent leur origine, inclusion et dimensions exactes. | Formes absentes. **Manquant**. | Lanceur ; forme, origine, direction et dimensions. | Chaque forme passe des cas de frontière ; aucune approximation carrée cachée. | B05-VIS. |
| B06-CIB-008 | PHB24 p. 361 | Une ligne depuis l'origine vers une position bloquée par Couverture totale exclut cette position ; placer l'origine sur une surface peut mettre l'origine du côté proche. | Calcul absent. **Manquant**. | Système ; zone et obstacles. | Deux points séparés par un obstacle divergent ; les aperçus n'exposent pas une zone impossible. | B05. |
| B06-CIB-009 | PHB24 p. 239–357 | Choix de cibles, point, direction, forme, exclusions et paramètres sont fournis avant confirmation et prévisualisés sans révéler d'entité cachée. | Interface d'action absente. **Manquant**. | Joueur/MJ ; paramètres du sort. | Quota exact, doublons refusés, choix obligatoires complets et secrets filtrés. | B05-ACT/VIS. |
| B06-CIB-010 | DEC-004, B05 | Le serveur revalide géométrie, cibles et état à la confirmation et après chaque interruption ; les cibles devenues invalides suivent le texte sans doubler le coût. | Commande absente. **Manquant**. | Système ; version et action suspendue. | Une mutation concurrente ne produit ni double lancement, ni conséquence partielle incohérente. | Phase 5 pour concurrence. |

## Matrice — durée, concentration et cumul

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B06-DUR-001 | PHB24 p. 237 | Une durée est instantanée, Concentration ou période ; chaque instance conserve début, maximum, échéance et causes de fin. | Marqueurs sans instance. **Partiel / manquant**. | Système ; instance et chronologie. | Reconnexion restitue durée restante et mêmes déclencheurs. | B04/DEC-004. |
| B06-DUR-002 | PHB24 p. 237 | Un lanceur non incapable peut dissiper sans action un sort à durée fixe qu'il a lancé, sauf texte contraire. | Commande absente. **Manquant**. | Lanceur ; instance active. | Autrui et lanceur incapable sont refusés ; toutes conséquences de fin s'appliquent. | B04. |
| B06-DUR-003 | PHB24 p. 363 | Une créature maintient une seule Concentration. Commencer un autre effet la termine immédiatement. | Champ descriptif seulement. **Manquant**. | Contrôleur ; ancienne/nouvelle instance. | Jamais deux instances ordinaires ; la fin de l'ancienne précède les effets de la nouvelle. | B04-RES. |
| B06-DUR-004 | SF-004, DEC-011 | Remplacer volontairement une Concentration demande confirmation et expose l'effet abandonné. | Fonctionnalité absente. **Manquant**. | Contrôleur ; choix explicite. | Refuser conserve l'ancienne et ne dépense rien ; confirmer applique une transition unique. | `DR-B06-01`. |
| B06-DUR-005 | PHB24 p. 363 | Chaque instance de dégâts impose une sauvegarde Constitution DD `max(10, floor(dégâts/2))`, maximum 30. | Aucun test actif. **Manquant**. | Système ; dégâts et lanceur. | 21 donne 10, 22 donne 11, 80 donne 30 ; chaque instance distincte teste. | B05-DMG. |
| B06-DUR-006 | PHB24 p. 363 | Incapacité ou mort termine Concentration ; chaque autre cause explicite s'applique sans test supplémentaire. | Conditions non actives. **Manquant**. | Système ; état vital et condition. | La bonne instance se termine immédiatement et nettoie tous ses effets dépendants. | B04-CON/VIE. |
| B06-DUR-007 | PHB24 p. 236, 371 | Une incantation longue emploie Concentration sans coexister avec une autre ; interruption fait échouer avant dépense d'emplacement. | Chronologie absente. **Manquant**. | Lanceur ; progression de lancement. | Commencer termine l'ancienne concentration après confirmation ; échec n'applique aucun effet final. | B06-INC. |
| B06-DUR-008 | PHB24 p. 238 | Les effets de sorts différents se cumulent. Ceux du même sort ne se cumulent pas : le plus puissant s'applique, ou le plus récent à puissance égale. | Priorités absentes. **Manquant**. | Système ; identité, puissance et périodes. | Deux *Bless* n'ajoutent qu'un dé mais la durée continue jusqu'à la dernière fin applicable. | B04-RES. |
| B06-DUR-009 | PHB24 p. 239–357 | Une clause propre peut rendre permanent, durer jusqu'à dissipation, finir sur distance, dégâts, action, décès ou autre événement ; elle prévaut sur le défaut. | Texte non exécutable. **Manquant**. | Système ; causes de fin par profil. | Chaque cause est testée aux bornes ; une cause étrangère ne termine pas l'effet. | B06-CAT-006. |
| B06-DUR-010 | PHB24 p. 238 | Identifier un sort non instantané par ses effets observables exige l'action Étudier et un test Intelligence (Arcanes) DD 15. | Action et confidentialité absentes. **Manquant**. | Observateur, système ; visibilité et jet. | Sans effet observable, aucune tentative ; succès révèle le sort, pas les secrets non prévus. | B05-ACT/VIS. |

## Matrice — résolution et conséquences communes

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B06-RES-001 | PHB24 p. 238, DEC-005 | DD et attaque magique utilisent caractéristique et maîtrise de la source choisie ; tous les jets conséquents sont serveur. | Dérivés niveau 1 présents, résolution absente. **Partiel**. | Système ; source, DD et bonus. | Aucun total client accepté ; multiclassage et octroi utilisent la bonne caractéristique. | B03/B04/B05. |
| B06-RES-002 | PHB24 p. 238 | Chaque sauvegarde, attaque, réussite, échec et effet partiel suit exactement le sort ; l'échec volontaire reste permis sauf exception. | Annotations partielles. **Manquant**. | Cible, système ; jet et branche. | Les branches aucun/moitié/autre sont distinctes et le choix d'échouer ne lance aucun dé. | B05-ATQ. |
| B06-RES-003 | PHB24 p. 239–357, B05 | Dégâts, critiques, types, résistances, immunités et vulnérabilités utilisent le moteur B05 avec les exceptions du sort. | Dégâts partiellement annotés. **Partiel / non exécutable**. | Système ; instances et types. | Dés, fixes, ordre, arrondis et type choisi sont explicables. | B05-DMG. |
| B06-RES-004 | PHB24 p. 239–357, B04 | Soins, PV temporaires, maximums et résurrections transforment l'état B04 sans dépasser ses invariants. | Quelques soins annotés, état absent. **Partiel / manquant**. | Système ; état avant/après. | Surplus, 0 PV, refus de PV temporaires et mort suivent B04 puis le sort. | B04-VIE. |
| B06-RES-005 | PHB24 p. 239–357, B04 | Toute condition porte source, bénéficiaire, durée, immunité, sauvegardes répétées et cause de fin. | Conditions parfois mal extraites. **Partiel / incorrect**. | Système ; instance de condition. | Appliquer, renouveler et terminer affecte seulement l'instance prévue. | B04-CON. |
| B06-RES-006 | PHB24 p. 239–357, B05 | Déplacement, poussée, traction, chute, vol et vitesse suivent B05 ; téléportation suit B06-SPE-006. | Mouvement absent. **Manquant**. | Système ; source, trajet/destination. | Mouvement forcé ne dépense rien ni ne provoque une opportunité sauf texte contraire. | B05-MOV. |
| B06-RES-007 | PHB24 p. 239–357 | Une zone persistante traite apparition, entrée, déplacement dans la zone, début/fin de tour et première fois par tour comme des déclencheurs distincts. | Zones absentes. **Manquant**. | Système ; zone, créatures et round. | Un même déclencheur ne s'applique qu'au rythme prévu ; déplacer la zone requalifie les cibles. | B05-VIS/TOU. |
| B06-RES-008 | PHB24 p. 239–357, B05 | Objets et structures créés ou visés portent CA, PV, immunités, vulnérabilités, seuils et sections lorsque le sort les définit. | Objets de scène absents. **Manquant**. | Système, MJ ; objet et profil. | Détruire une section termine seulement ce que le texte relie à cette section. | B05-DMG, B07. |
| B06-RES-009 | PHB24 p. 239–357 | Tous les choix du sort — type, forme, cible, option, ordre, commande, apparence ou autre — sont figés au moment indiqué et auditables. | Sous-choix non structurés. **Manquant**. | Contrôleur ; paramètres et moment. | Choix obligatoire absent refusé ; un choix tardif n'est accepté que si le sort le permet. | B06-CAT-006. |
| B06-RES-010 | PHB24 p. 239–357 | L'amélioration d'un sort mineur suit le niveau total aux seuils 5/11/17, sauf texte contraire ; ce n'est jamais un surclassement. | Niveau 1 et annotations ambiguës. **Manquant**. | Système ; niveau total et formule. | Seuils juste avant/après exacts ; aucun emplacement proposé. | B02/B03. |
| B06-RES-011 | PHB24 p. 239–357 | Le surclassement applique séparément chaque quantité, cible, durée ou profil que la description augmente. | `higherLevel` textuel. **Partiel / non exécutable**. | Système ; écart de niveau. | Niveau de base produit zéro incrément ; chaque niveau supplémentaire produit exactement la clause. | B06-INC-005. |
| B06-RES-012 | PHB24 p. 239–357 | Les actions ou attaques réutilisables créées par un sort restent rattachées à son instance, consomment leur économie et disparaissent avec elle. | Effets secondaires absents. **Manquant**. | Contrôleur ; instance et option. | Aucun usage après fin, hors portée ou sans action ; la cible peut changer seulement si permis. | B05-ACT. |
| B06-RES-013 | PHB24 p. 374, B05 | Les effets simultanés suivent le choix du contrôleur du tour, puis chaque résultat requalifie les suivants ; un jet de dégâts commun reste commun. | Ordonnancement absent. **Manquant**. | Contrôleur actif, système ; file d'effets. | L'ordre est persisté ; reconnexion ne relance ni ne réordonne. | B05-INI/ATQ. |
| B06-RES-014 | DEC-004, DEC-005 | Une commande de sort validée produit coût, jets, instances, historique et projections en une opération fonctionnelle idempotente. | Commande absente. **Manquant**. | Système ; commande et version. | Rejouer la commande retourne le même résultat sans seconde dépense ni second effet. | Phase 5 pour technique. |

## Matrice — familles d'exceptions propres aux sorts

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B06-SPE-001 | PHB24 p. 241, 263, 269 | *Antimagic Field*, *Counterspell* et *Dispel Magic* distinguent suppression, interruption et fin selon niveau, test, cible et exceptions propres. | Notes informatives. **Manquant**. | Lanceurs, système ; effet magique et niveau. | Chaque sort affectable/non affectable diverge ; aucun mot « magique » n'est déduit sans source. | B05-REA. |
| B06-SPE-002 | PHB24 p. 259, 292 et descriptions | Lumière et Ténèbres magiques interagissent seulement lorsque leurs textes et niveaux le permettent ; sens spéciaux gardent leurs exceptions. | Vision et zones absentes. **Manquant**. | Système ; zone, niveau et vision. | Recouvrements, dissipation et vision du diable sont testés aux frontières. | B05-VIS/B08. |
| B06-SPE-003 | PHB24 p. 288–299, 369 | Une illusion structure sens trompé, substance, interaction, test ou sauvegarde de révélation et projection individuelle. | Notes libres. **Manquant**. | Lanceur, observateurs, MJ ; illusion et connaissance. | Deux observateurs peuvent connaître des vérités différentes sans fuite réseau. | `DR-B06-01`, SF-001. |
| B06-SPE-004 | PHB24 p. 239–357, DEC-004 | Invocation ou création de créature fixe profil B08, quantité, espace, contrôle, initiative, commandes, durée et disparition. | Profils et combat d'invocation absents. **Manquant**. | Lanceur/MJ ; instances invoquées. | Chaque créature a identité et PV propres ; manque d'espace, 0 PV, fin ou nouveau lancement suivent le sort. | B08 ; `DR-B06-01`. |
| B06-SPE-005 | PHB24 p. 239–357, 373 | Transformation et changement de forme définissent statistiques remplacées/conservées, équipement, PV temporaires, actions, parole, sorts, concentration et retour. | Profils alternatifs absents. **Manquant**. | Cible, système ; forme avant/après. | Chaque champ a une règle explicite ; fin restaure sans perdre les effets conservés. | B04/B08. |
| B06-SPE-006 | PHB24 p. 239–357, 376 | Téléportation ne parcourt pas l'espace, ne dépense pas de mouvement et ne provoque pas d'opportunité ; destination, occupants, vision, équipement et passagers suivent le sort. | Destination et positions absentes. **Manquant**. | Contrôleur ; départ, destination et voyageurs. | Destination occupée applique le défaut du glossaire ou l'exception ; aucun chemin n'est calculé. | B05-MOV. |
| B06-SPE-007 | PHB24 p. 239–357 | Voyage planaire, bannissement, portails et espaces extradimensionnels suivent plan, ancrage, retour, fermeture et interactions dangereuses propres. | Plans et lieux absents. **Manquant**. | MJ, système ; plan et liens. | Une destination non qualifiée est refusée ou arbitrée, jamais inventée par le client. | `DR-B06-01`. |
| B06-SPE-008 | PHB24 p. 239–357, B04 | Réanimation et résurrection vérifient délai, corps, consentement, type, cause de mort, composant, PV et états restaurés propres à chaque sort. | Mort et résurrection absentes. **Manquant**. | Cible/esprit, lanceur, MJ ; décès et composant. | Cas à la limite temporelle, mort par vieillesse, corps absent et Mort-vivant divergent exactement. | B04-VIE. |
| B06-SPE-009 | PHB24 p. 239–357, 376 | Divination, télépathie et détection fixent question, portée, sens, connaissance, vérité, hasard et destinataire ; la réponse MJ reste privée lorsque prévu. | `telepathy` absent, effets informatifs. **Manquant**. | Lanceur, MJ ; demande et réponse. | Seuls acteurs autorisés reçoivent question/réponse ; lancer de nouveau applique risques cumulatifs prévus. | `DR-B06-01`, SF-001. |
| B06-SPE-010 | PHB24 p. 239–357, DEC-011 | *Wish* et toute clause ouverte automatisent coûts et bornes déterministes puis font arbitrer le résultat libre par le MJ, sans exécuter de code ni contourner les invariants. | Aucun parcours d'arbitrage. **Manquant**. | Lanceur, MJ ; intention et résolution. | Ressources dépensées avant réponse ; refus ou conséquence restent motivés, privés et auditables. | `DR-B06-01`. |

## Matrice — temps, persistance, secret et arbitrage

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B06-PER-001 | DEC-011 | Toute partie déterministe est automatique ; seule la clause réellement subjective attend une résolution MJ. | Notes `informational` sans distinction fiable. **Manquant**. | Système, MJ ; étapes automatiques/manuelles. | Un arbitrage ne remplace jamais dégâts, jets, coûts ou durée déterministes. | `DR-B06-01`. |
| B06-PER-002 | DEC-011 | Une étape MJ est créée après validation et dépense normales, avec intention, contexte, visibilité, auteur, décision et conséquences. | Workflow absent. **Manquant**. | Lanceur, MJ ; demande en attente. | Rafraîchir ne redépense rien ; seuls MJ actifs répondent ; réponse unique. | `DR-B06-01`. |
| B06-PER-003 | DEC-011 | En combat, tours et rounds font avancer automatiquement les durées et déclencheurs ; une pause fige ce temps mécanique. | Combat absent. **Manquant**. | Système, MJ ; horloge de combat. | Reprise continue à l'échéance exacte sans sauter ni répéter un déclencheur. | `DR-B06-02`, B05. |
| B06-PER-004 | DEC-011 | Hors combat, le MJ avance explicitement le temps fictionnel ; jamais l'horloge murale, la déconnexion ou le redémarrage. | Horloge d'aventure absente. **Manquant**. | MJ, système ; instant fictionnel. | Avancer franchit chaque échéance une fois ; attendre réellement ne change rien. | `DR-B06-02`, B09. |
| B06-PER-005 | DEC-011 | Tout effet dépassant une scène rejoint un registre de campagne, rattaché à une créature, un objet ou un lieu nommé. | Registre absent. **Manquant**. | MJ, système ; instance et rattachement. | Changer de combat ne supprime rien ; une cible archivée garde une trace cohérente. | `DR-B06-05`. |
| B06-PER-006 | DEC-011 | Glyphe, cercle, mur, clone, sanctuaire ou autre effet localisé n'exige pas de carte mondiale : le MJ nomme le lieu et précise les paramètres mécaniques obligatoires. | Lieux d'aventure absents. **Manquant**. | MJ/lanceur ; lieu et géométrie locale. | L'effet est retrouvable, déplaçable seulement si permis et supprimable par ses causes exactes. | `DR-B06-05`. |
| B06-PER-007 | PHB24 p. 238, DEC-002/011 | Projection publique, privée du lanceur et complète MJ sont dérivées du même résultat sans révéler cible invalide, illusion, réponse ou entité cachée. | Projection magique absente. **Manquant / risque critique**. | Système ; résultat et permissions. | Inspecter événements ou reconnexion ne révèle aucun champ privé. | `DR-B06-01`, SF-001. |
| B06-PER-008 | DEC-004/009/011 | Effets, arbitrages et temps survivent aux reconnexions ; une correction MJ motivée passe par les mêmes transitions et ne réécrit pas l'historique. | Aucun état correspondant. **Manquant**. | MJ, système ; versions et audit. | Correction ferme/requalifie proprement fenêtres, concentration, invocation et échéances dépendantes. | DEC-009. |

## Matrice — synthèse de l'état actuel

| ID | Constat inspecté | Qualification | Critère de sortie futur | Trace |
|---|---|---|---|---|
| B06-ETA-001 | Le seed contient 390 identités ; `telepathy` manque. | **Manquant**. | 391 identités et sous-totaux exacts. | B06-CAT-001. |
| B06-ETA-002 | Le runtime contient 99 sorts et son type limite le niveau à 0 ou 1. | **Manquant**. | Niveaux 0–9 exploitables. | B06-CAT. |
| B06-ETA-003 | Les 506 annotations couvrent les clés mais 177 sont informatives et plusieurs sont sémantiquement fausses. | **Partiel / non fiable**. | Chaque clause PHB a un profil et des tests. | B06-CAT-006. |
| B06-ETA-004 | Listes, quotas et sources ne sont pas tous validés au backend. | **Contraire à l'autorité cible**. | Accès et provenance vérifiés serveur. | B06-PRE/INC. |
| B06-ETA-005 | Aucun emplacement dépensé, pool multiclassé ou Magie de pacte courant n'est persisté. | **Manquant**. | Maxima, dépenses, récupération et pool choisi cohérents. | B03/B04/B06-PRE. |
| B06-ETA-006 | Concentration, durée, zone, ciblage et effets récurrents ne sont pas exécutables. | **Manquant**. | Instances complètes reprises exactement. | B06-CIB/DUR/RES. |
| B06-ETA-007 | Composantes matérielles sont du texte ; mains, focaliseurs, coût et consommation ne sont pas validés. | **Manquant**. | Chaque lancement prouve et consomme ce qu'il exige. | B06-INC, B07. |
| B06-ETA-008 | Invocations, formes et objets créés n'ont aucun profil actif. | **Manquant**. | Chaque instance possède profil, contrôleur, durée et fin. | B06-SPE, B08. |
| B06-ETA-009 | Aucun temps fictionnel ni registre de campagne ne conserve les effets hors combat. | **Manquant**. | Échéances et rattachements survivent aux scènes. | B06-PER. |
| B06-ETA-010 | Aucun arbitrage privé et audité ne traite les clauses narratives. | **Manquant**. | Automatique et manuel sont séparés sans fuite ni double dépense. | DEC-011, B06-PER. |

## Décisions du bloc

### DR-B06-01 — Frontière entre automatisation et arbitrage

**Résolue le 20 août 2026 :** toute conséquence déterministe est automatique. Une
clause subjective ouvre après validation et dépense une résolution privée, motivée et
auditée du MJ, sans code arbitraire ni contournement d'invariant.

### DR-B06-02 — Écoulement du temps hors combat

**Résolue le 20 août 2026 :** le combat avance par rounds et tours. Hors combat, le MJ
avance explicitement le temps fictionnel ; l'horloge réelle n'a aucun effet.

### DR-B06-03 — Abstraction des composantes matérielles

**Résolue le 20 août 2026 :** focaliseur et sacoche abstraient le matériel générique,
gratuit et non consommé. Tout coût, consommation ou objet précis exige une possession réelle.

### DR-B06-04 — Changements de préparation dans la fenêtre de repos

**Résolue le 20 août 2026 :** plusieurs sauvegardes sont possibles, mais la différence
nette respecte le PHB : tout pour Clerc/Druide/Magicien, un pour Paladin/Rôdeur ; les
changements au niveau et exceptions gardent leurs propres quotas.

### DR-B06-05 — Persistance des effets localisés ou durables

**Résolue le 20 août 2026 :** un registre de campagne rattache l'effet à une créature,
un objet ou un lieu nommé. Aucune carte globale du monde n'est requise.

## Vérification du bloc

Le bloc est validé le 20 août 2026 :

- les 391 lignes du registre héritent du contrat `AC-SP` et les familles communes
  possèdent source, cible, état actuel et critères d'acceptation ;
- les cinq décisions sont résolues et intégrées dans `DEC-011` ;
- l'audit distingue texte source, données extraites, annotations et fonctionnalité
  réellement exécutable ;
- `REQUIREMENTS.md`, `DEC-011`, `GAP-ANALYSIS.md`, `TRACEABILITY.md`, `README.md`,
  `CONTEXT.md` et le plan de conformité sont synchronisés ;
- aucun code, test, seed, migration, dépendance ou CI n'a été modifié.

Cette validation clôt B06. Elle ne signifie pas que les écarts sont implémentés ou
vérifiés par des tests automatisés.
