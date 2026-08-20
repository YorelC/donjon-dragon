# B04 — Fiche et état d'aventure

## Statut

**SPÉCIFICATION VALIDÉE PAR LE PROPRIÉTAIRE LE 20 AOÛT 2026.**

Ce document inventorie les règles fonctionnelles du bloc B04 défini dans
[`DND-2024-COMPLIANCE-PLAN.md`](../../DND-2024-COMPLIANCE-PLAN.md). Il décrit la
cible et les écarts observés ; il n'autorise aucune implémentation.

Les 91 règles et les décisions `DR-B04-01` à `DR-B04-03` sont validées. Cette
validation clôt la spécification fonctionnelle B04 ; elle ne modifie ni le code, ni les
tests, ni les données de jeu.

## Sources et conventions

### Sources normatives disponibles

- `PHB24` — [`PlayersHandbook2024.pdf`](../../books/PlayersHandbook2024.pdf), source
  primaire locale. Les numéros cités sont ceux imprimés dans le livre ;
- `OFF-ERR` — [errata officiel du *Player's Handbook 2024*](https://www.dndbeyond.com/sources/dnd/sae/players-handbook) ; les corrections de PV temporaires propres à certains sorts sont portées par leur source et relèvent de B06 ;
- `OFF-SAC` — [Sage Advice Compendium officiel](https://www.dndbeyond.com/sources/dnd/sae/sage-advice-compendium), utilisé pour les précisions explicites sur la concentration et les PV temporaires ;
- `SF-001`, `SF-002`, `SF-004` et `SF-005` dans
  [`REQUIREMENTS.md`](../../REQUIREMENTS.md) ;
- [`DEC-001`](../../DECISIONS/001-product-scope.md),
  [`DEC-002`](../../DECISIONS/002-roles-and-visibility.md),
  [`DEC-003`](../../DECISIONS/003-character-lifecycle.md),
  [`DEC-004`](../../DECISIONS/004-combat-and-realtime.md) et
  [`DEC-005`](../../DECISIONS/005-dice-rest-and-loot.md), ainsi que
  [`DEC-009`](../../DECISIONS/009-adventure-state-and-corrections.md) ;
- le présent plan de conformité et les matrices validées
  [`B01`](B01-LEVEL-ONE-CREATION.md),
  [`B02`](B02-LEVELS-TWO-TO-TWENTY.md) et
  [`B03`](B03-MULTICLASSING-AND-RESPECIALIZATION.md).

### Pointage primaire du bloc

| Domaine | Pages `PHB24` contrôlées |
|---|---|
| Inspiration héroïque et relances | p. 13 |
| PV, soins, 0 PV, mort, stabilisation, PV temporaires et conditions | p. 27–29 |
| Fiche initiale, dérivés, dés de vie et emplacements | p. 40–41 |
| Monnaies | p. 213 |
| Objets magiques et harmonisation | p. 232–233 |
| Incantation et concentration | p. 235–237 |
| Glossaire : fiche, concentration et conditions | p. 361–377 |
| Glossaire : repos long et court | p. 370–373 |

Les pages 28–29, 41, 361, 363, 369–370, 373–374 ont aussi été contrôlées
visuellement afin de préserver les encadrés, listes et transitions entre pages.

### Limites entre blocs

- B04 définit les valeurs visibles sur la fiche, la provenance et le cycle de vie de
  l'état courant. B01 à B03 restent normatifs pour construire les maxima et les choix.
- B04 conserve les conséquences d'une action. B05 définit l'économie d'actions,
  l'ordre de résolution des dégâts et les déclencheurs de tour en combat.
- B04 conserve la concentration, les emplacements et effets actifs. B06 définit le
  lancement, les durées et les exceptions de chaque sort.
- B04 conserve possession, port, contenance, monnaie et harmonisation. B07 définit les
  catalogues, propriétés, capacités de charge et règles détaillées d'utilisation.
- B04 applique les bénéfices individuels d'un repos validé. B09 orchestre la proposition
  collective, les participants, la préparation et la validation finale par le MJ.
- Aucun choix de schéma, transaction MongoDB, endpoint, événement temps réel ou écran
  n'appartient à B04.

### État actuel inspecté

- contrats : `shared/src/character-schema.ts`, `character-sheet-schema.ts` et
  `item-schema.ts` ;
- domaine : `back/src/modules/characters/domain/character.ts`,
  `character-equipment.ts`, `reference/conditions.ts` et `resolution/` ;
- persistance :
  `back/src/modules/characters/infrastructure/persistence/character.schema.ts` ;
- lecture et affichage : `GetCharacterSheetUseCase` et
  `front/src/shared/components/character/`.

Les qualifications sont : **Conforme**, **Partiel**, **Manquant**, **Ambigu**,
**Dette**, **Obsolète** et **Contraire à la cible**.

## Matrice — fiche active, valeurs et provenance

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B04-FIC-001 | PHB24 p. 40–41, SF-002 | La fiche active réunit le build accepté, les valeurs dérivées recalculées et l'état d'aventure courant persisté. Un brouillon, une progression inachevée ou un candidat de respécialisation n'alimente jamais la fiche active. | Une seule composition niveau 1 est immédiatement lisible ; aucune validation ni version active/candidate. **Partiel / contraire à la cible de cycle de vie**. | Joueur, MJ, système ; build actif, version, état. | Toute lecture désigne une version active unique ; le candidat reste isolé jusqu'à son activation selon B03. | B01-VAL, B03-RSP. |
| B04-FIC-002 | PHB24 p. 40–41, SF-002 | Les valeurs de construction et leurs maxima sont distingués des valeurs courantes : PV max/actuels/temporaires, ressources max/disponibles ou dépensées, dés de vie totaux/disponibles et emplacements totaux/dépensés. | Seuls les maxima de PV et de ressources sont calculés ; aucune valeur courante. **Manquant**. | Système ; maxima et compteurs courants. | Une dépense ne modifie jamais le maximum ; un recalcul de maximum ne réinitialise pas la valeur courante sans règle explicite. | B02-PRG-006/008, B03-RSP-012/013. |
| B04-FIC-003 | PHB24 p. 40–41, SF-002 | Le serveur est l'unique autorité des scores, modificateurs, bonus de maîtrise, sauvegardes, compétences, perception passive, PV max, CA, initiative, vitesses, attaques, DD et bonus d'attaque magique. | Le moteur serveur recalcule déjà une partie importante de ces dérivés. **Partiel** : niveau 1 seulement, attaques d'armes absentes et entrées incomplètement validées. | Système ; build, équipement et effets. | Aucun dérivé envoyé par un client n'est accepté ; deux calculs de la même version donnent le même résultat. | B01-FIC, B02/B03. |
| B04-FIC-004 | SF-002 | Chaque valeur calculée expose des contributions ordonnées et lisibles permettant de recomposer exactement le résultat, y compris les modificateurs temporaires applicables. | `ResolvedValue.sources` couvre PV max, CA, initiative et vitesse, pas toute la fiche ni l'état temporaire. **Partiel**. | Joueur, MJ ; valeur, formule et sources. | Le détail explique base, bonus, remplacement, état temporaire et arrondi sans dépendre du code client. | B01-FIC-003. |
| B04-FIC-005 | PHB24 p. 41–42, B02/B03 | Tout changement de niveau, caractéristique, bonus de maîtrise, équipement, maîtrise ou effet recalcule les dérivés qui en dépendent, sans toucher aux autres états. | Recalcul à la lecture pour un build niveau 1 ; pas de progression ni d'effets actifs. **Partiel**. | Système ; avant/après du build et de l'état. | Une hausse de Constitution recalcule le maximum selon B02 sans soigner ; retirer une armure recalcule la CA sans modifier les PV. | B02-PRG-007, B03-RSP-010/011. |
| B04-FIC-006 | PHB24 p. 40, B03-INC | Un sort conserve sa source. Son DD, son bonus d'attaque, son quota et son pool d'emplacements utilisent la caractéristique et les règles de cette source. | Une origine existe mais le runtime ne représente qu'une classe principale et les niveaux 0–1. **Partiel**. | Système ; sort, source, caractéristique, pool. | Un même sort acquis de deux sources affiche deux provenances résolubles ; aucune caractéristique n'est choisie implicitement. | B03-INC-003, B06. |
| B04-FIC-007 | PHB24 p. 40 et 361 | Une seule formule de base de CA est choisie parmi les formules disponibles ; bouclier, bonus et effets compatibles s'appliquent ensuite. La fiche explique la formule active et les alternatives inactives. | La CA niveau 1 et l'équipement porté sont calculés ; les formules multiclassées et états actifs sont absents. **Partiel**. | Système ; formule, équipement, effets. | Deux formules de base ne s'additionnent jamais ; ôter la condition d'une formule provoque un recalcul déterministe. | B03-CUM, B05/B07. |
| B04-FIC-008 | PHB24 p. 40 et 368–370 | La fiche distingue le modificateur d'initiative utilisé au jet de l'éventuel score d'initiative utilisé par une règle. Avantage et désavantage ne sont pas incorporés silencieusement au modificateur. | Seul le modificateur de Dextérité et ses bonus passifs sont affichés. **Partiel**. | Joueur, MJ ; modificateur, avantages et score éventuel. | Le détail n'ajoute jamais `+5` à un jet ; une règle qui demande un score peut dériver `10 + modificateur`, avec `+5/-5` si elle le prévoit. | B05. |
| B04-FIC-009 | PHB24 p. 40 et 372 | La perception passive vaut `10 + modificateur du test de Sagesse (Perception)`, avec tous les modificateurs applicables ; Avantage vaut `+5` et Désavantage `-5` pour ce score. | La formule de base existe ; les états et avantages temporaires ne sont pas intégrés. **Partiel**. | Système ; compétence et effets courants. | Les bonus de maîtrise/expertise ne comptent qu'une fois ; Avantage et Désavantage simultanés s'annulent avant la conversion. | B05 pour les sources temporaires. |
| B04-FIC-010 | PHB24 p. 367 | L'état `Sanglant` est dérivé quand les PV actuels sont inférieurs ou égaux à la moitié des PV max. Il n'est ni persisté ni traité comme une condition autonome. | PV actuels absents. **Manquant**. | Système ; PV actuels et max. | `11/20` n'est pas Sanglant ; `10/20` et `0/20` le sont ; le changement suit immédiatement les PV. | B05 pour les déclencheurs. |
| B04-FIC-011 | SF-001, DEC-002 | Le joueur assigné et les MJ voient la fiche complète. Les autres joueurs n'obtiennent que le résumé explicitement public ; en combat, un allié voit notamment nom, portrait, classes, niveau et PV exacts. | Tout membre actif peut actuellement charger la fiche complète. **Contraire à la cible, écart critique**. | Joueur, MJ ; fiche complète et projection publique. | Connaître l'identifiant ne contourne ni campagne, ni rôle, ni attribution ; la réponse ne contient aucun champ non autorisé. | SF-001 ; B05 pour la projection de combat. |
| B04-FIC-012 | DEC-004, SF-002 | Chaque mutation persistée de l'état porte une version cohérente. Une commande rejouée ne dépense, soigne, transfère ou applique jamais deux fois. | Aucun état d'aventure ni version de commande. **Manquant**. | Système ; version d'état, commande et résultat. | Même commande répétée retourne le même résultat fonctionnel ; une version obsolète ne crée aucune mutation partielle. | Protocole technique reporté à la Phase 5. |

## Matrice — PV, dés de vie, repos et mort

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B04-VIE-001 | PHB24 p. 27 et 368 | Les PV actuels sont un entier compris entre 0 et le maximum courant. Une perte de PV n'altère aucune capacité avant 0, sauf effet qui vise explicitement `Sanglant`. | Seul le maximum est calculé. **Manquant**. | Système ; PV actuels/max. | Toute mutation reste dans l'intervalle ; aucun PV négatif ni excédentaire n'est persisté. | B05 pour dégâts et effets. |
| B04-VIE-002 | PHB24 p. 28 | Un soin ajoute des PV actuels, plafonne au maximum et perd tout excédent. Il ne restaure ni PV temporaires, ni maximum réduit, ni autre ressource sans texte explicite. | Aucun soin ni PV actuels. **Manquant**. | Système ; source, montant et PV avant/après. | `14/20 + 8` donne `20/20` ; l'excédent 2 n'est pas stocké. | B05/B06. |
| B04-VIE-003 | PHB24 p. 29 | Les PV temporaires absorbent les dégâts avant les PV actuels ; seul le reliquat atteint les PV actuels. | Champ absent. **Manquant**. | Système ; dégâts validés, PV temporaires/actuels. | Avec 5 temporaires et 7 dégâts finaux, les temporaires passent à 0 et les PV actuels baissent de 2. | B05 fixe l'ordre complet des modificateurs de dégâts. |
| B04-VIE-004 | PHB24 p. 29 | Plusieurs octrois de PV temporaires ne s'additionnent pas. Le bénéficiaire choisit de garder la valeur courante ou de la remplacer par la nouvelle. | Champ et choix absents. **Manquant**. | Joueur ou contrôleur ; valeur courante et offre. | Avec 10 puis 12, seules 10 ou 12 sont valides ; refuser l'offre conserve aussi sa source et sa durée. | B05/B06 pour l'octroi. |
| B04-VIE-005 | PHB24 p. 29, OFF-ERR | Les PV temporaires durent jusqu'à épuisement ou fin d'un repos long, sauf durée ou fin anticipée explicitement portée par leur source. | Champ absent. **Manquant**. | Système ; valeur, source et échéance. | Un effet terminé retire ses PV temporaires seulement si son texte le prévoit ; sinon le repos long ou les dégâts les retire. | Les exceptions de sorts sont en B06. |
| B04-VIE-006 | PHB24 p. 29 | Les PV temporaires ne sont ni des PV ni un soin : aucun soin ne les restaure, ils peuvent coexister avec des PV pleins et ils ne réveillent pas une créature à 0 PV. | Champ absent. **Manquant**. | Système ; nature de l'octroi. | Recevoir 8 PV temporaires à `0/20` laisse 0 PV, Inconscient et les jets de mort applicables. | B05. |
| B04-VIE-007 | PHB24 p. 28, 370 | Une réduction de PV max porte sa source et sa durée. Les PV actuels sont écrêtés si nécessaire ; atteindre un maximum de 0 tue. Un repos long restaure le maximum normal sauf exception explicite. | Aucune réduction temporaire de maximum. **Manquant**. | Système ; maximum de build, réductions, actuel. | Réduire le max sous l'actuel écrête l'actuel ; retirer une réduction ne soigne pas au-delà de l'ancien actuel. | B05/B06. |
| B04-VIE-008 | PHB24 p. 40–42, B02/B03 | Les dés de vie sont suivis par type de dé et source de classe, avec total, disponibles et dépensés. | Seul le type niveau 1 contribue au maximum de PV ; aucun pool. **Manquant**. | Système ; classe, type et compteurs. | La somme des pools vaut le niveau total ; un personnage multiclassé conserve les types distincts. | B02-PRG-006, B03-MUL-009/010. |
| B04-VIE-009 | PHB24 p. 373, SF-005 | Pendant un repos court, le joueur choisit un dé disponible, le serveur le lance, ajoute le modificateur courant de Constitution et soigne au minimum 1 ; après chaque résultat, le joueur peut en choisir un autre. | Aucun repos ni jet de dés de vie. **Manquant**. | Joueur, système ; dé choisi, jet, CON et PV. | Le choix précède chaque jet ; un dé n'est dépensé qu'une fois ; le soin est plafonné mais le dé reste dépensé. | DEC-005 ; B09 orchestre le repos. |
| B04-VIE-010 | PHB24 p. 373 | Un repos court dure au moins 1 heure, exige au moins 1 PV au départ et n'autorise que l'activité légère prévue. Initiative, sort autre qu'un sort mineur ou dégâts l'interrompent ; il n'accorde alors aucun bénéfice. | Aucun état de repos. **Manquant**. | Joueur, MJ, système ; début, interruptions et choix. | Un personnage à 0 PV n'entre pas dans le repos ; une interruption annule soins, recharges et harmonisation non finalisés. | B09 pour la fenêtre collective. |
| B04-VIE-011 | PHB24 p. 370–371 | Un repos long dure au moins 8 heures, dont au moins 6 de sommeil et au plus 2 d'activité légère ; il exige au moins 1 PV. Après sa fin, 16 heures doivent s'écouler avant d'en commencer un autre. | Aucun état de repos ni horloge d'aventure. **Manquant**. | Joueur, MJ, système ; périodes et dernier repos. | Refus à 0 PV, avant le délai ou si sommeil/activité sont incompatibles ; aucune récompense avant la fin validée. | B09. |
| B04-VIE-012 | PHB24 p. 370 | Un repos long achevé restaure tous les PV perdus, tous les dés de vie dépensés, les maxima de PV et scores réduits, retire 1 niveau d'épuisement et recharge chaque capacité qui le dit. Il retire aussi les PV temporaires restants. | Aucun bénéfice de repos. **Manquant**. | Système ; état avant/après et sources rechargeables. | Chaque bénéfice s'applique une fois ; une ressource sans déclencheur `repos long` reste inchangée. | DEC-005 ; B09. |
| B04-VIE-013 | PHB24 p. 370–371 | Initiative, sort autre qu'un sort mineur, dégâts ou 1 heure de marche/effort interrompent un repos long. Après au moins 1 heure reposée, l'interruption accorde les bénéfices d'un repos court. La reprise ajoute 1 heure par interruption. | Aucun état de repos. **Manquant**. | Système ; chronologie et interruptions. | Avant 1 heure, aucun bénéfice ; après 1 heure, les choix de dés de vie du repos court restent requis avant application collective. | B09 doit articuler ces choix. |
| B04-VIE-014 | SF-005, DEC-005 | Le repos produit est collectif : seuls les personnages finalement inclus reçoivent simultanément leurs bénéfices individuels. Un personnage exclu reste strictement inchangé. | Fonctionnalité absente. **Manquant**. | MJ, joueurs ; proposition, inclusion et état avant/après. | Une validation partielle ou un échec ne repose personne ; un déconnecté explicitement exclu ne reçoit aucun bénéfice. | B09. |
| B04-VIE-015 | PHB24 p. 28 | À 0 PV, un personnage meurt instantanément si son maximum vaut 0 ou si les dégâts restants après l'avoir réduit à 0 atteignent ou dépassent son maximum. Sinon il devient Inconscient et entre dans l'état de jets de mort. | Aucun PV courant ni état de mort. **Manquant**. | Système ; dégâts, maximum et état vital. | Les cas aux bornes `reste = max - 1` et `reste = max` divergent exactement ; aucune étape manuelle n'est requise. | B05 applique les dégâts. |
| B04-VIE-016 | PHB24 p. 28–29, SF-005 | Au début de chacun de ses tours à 0 PV, un personnage non stable et vivant effectue au serveur un jet de mort sans caractéristique. `10+` ajoute un succès, `1–9` un échec. | Aucun combat ni compteur. **Manquant**. | Système ; d20, succès et échecs. | Le jet n'ajoute aucun modificateur ordinaire ; il est enregistré et visible selon les règles des jets joueur. | B05 pour le déclencheur de tour. |
| B04-VIE-017 | PHB24 p. 29 | Trois succès rendent Stable ; trois échecs tuent. Les compteurs sont indépendants et non nécessairement consécutifs ; regagner au moins 1 PV ou devenir Stable remet les deux à 0. | Compteurs absents. **Manquant**. | Système ; succès, échecs et stabilité. | `2 succès/2 échecs` est représentable ; le troisième événement applique la transition et réinitialise les compteurs si requis. | B05. |
| B04-VIE-018 | PHB24 p. 29 | Un 1 naturel au jet de mort ajoute deux échecs. Un 20 naturel rend immédiatement 1 PV, réveille selon les règles et remet les compteurs à 0. | Jet absent. **Manquant**. | Système ; face naturelle et transition. | Les modificateurs éventuels d'une règle n'altèrent jamais la détection du 1 ou du 20 naturel. | B05/B06 pour exceptions. |
| B04-VIE-019 | PHB24 p. 29 | À 0 PV, subir des dégâts ajoute un échec ; un coup critique en ajoute deux ; si les dégâts atteignent ou dépassent le maximum, le personnage meurt. | État absent. **Manquant**. | Système ; dégâts finaux, critique et compteurs. | Les dégâts absorbés intégralement par des PV temporaires comptent quand même comme dégâts subis, sans réduire les PV déjà à 0. | B05 ; OFF-SAC pour la notion de dégâts subis. |
| B04-VIE-020 | PHB24 p. 29 et 374 | Un personnage Stable reste à 0 PV et Inconscient, ne fait plus de jets de mort et perd Stable au premier dégât. Sans soin, il regagne 1 PV après `1d4` heures déterminées par le serveur. | État absent. **Manquant**. | Système ; stabilité, délai et jet d'heures. | Le délai survit aux reconnexions ; un dégât annule le délai et réactive les jets de mort. | B05 pour stabilisation par action. |
| B04-VIE-021 | PHB24 p. 365, SF-005 | Un mort n'a pas de PV et ne peut en regagner avant une résurrection. Mort, auteur, cause et date restent persistés ; inventaire et attribution sont conservés. | Aucun état de mort. **Manquant**. | Système, MJ ; état vital et audit. | Un soin ordinaire échoue ; la fiche reste consultable ; l'objet et le personnage ne disparaissent pas. | DEC-005. |
| B04-VIE-022 | PHB24 p. 365, SF-005 | Une résurrection applique les PV indiqués par son effet. Les conditions, contagions magiques et malédictions dont la durée continue reviennent ; l'épuisement revient avec 1 niveau de moins ; toutes les harmonisations ont pris fin à la mort. | Résurrection et effets persistants absents. **Manquant**. | Système ; effet de résurrection et état au décès. | Aucun état expiré pendant la mort ne réapparaît ; le consentement de l'esprit et les exceptions du sort sont respectés. | B06 pour chaque sort. |
| B04-VIE-023 | SF-005 | Un MJ peut archiver un personnage mort. L'archivage est distinct de la mort et ne détruit ni historique, ni inventaire, ni provenance. | Seule la suppression existe. **Manquant**. | MJ ; personnage mort et archive. | Un vivant ne suit pas ce parcours ; une archive reste auditable et n'est plus jouable. | DEC-005. |
| B04-VIE-024 | SF-002, DEC-003 | Progression et hausse de maximum ne soignent pas. La respécialisation conserve l'état vital et applique `min(anciens PV actuels, nouveaux PV max)` ; ses ressources de build suivent B03. | Parcours absents. **Manquant**. | Système ; avant/après de build. | Tous les cas B02/B03 sont appliqués sans repos implicite ni suppression d'un état de mort. | B02-PRG, B03-RSP. |

## Matrice — ressources, inspiration et concentration

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B04-RES-001 | Tables et capacités de classe, B01/B02 | Chaque ressource possède une clé stable, une source, un maximum calculé, une valeur disponible ou dépensée et ses déclencheurs de récupération. | `ResolvedResource` expose seulement clé, capacité, maximum et texte de récupération. **Partiel**. | Système ; source, max, courant et récupération. | Deux ressources homonymes de sources différentes ne fusionnent pas sans règle explicite ; aucune valeur négative ou supérieure au max. | B02, B06/B07 selon la source. |
| B04-RES-002 | SF-004 | Une ressource n'est consommée qu'après validation de l'action qui l'emploie. Une action refusée ou annulée avant engagement ne la dépense pas. | Capacités informatives, aucune exécution. **Manquant**. | Joueur, système ; commande, coût et version. | Une répétition idempotente ne dépense qu'une fois ; un coût insuffisant refuse toute la commande. | B05/B06. |
| B04-RES-003 | B02-PRG-008, B03-INC-009 | Une hausse de maximum conserve la quantité déjà dépensée : `nouveau disponible = nouveau max - ancien dépensé`, borné au nouveau max. Une baisse écrête l'excès sans créer de récupération. | Aucun courant. **Manquant**. | Système ; max et dépensé avant/après. | `2/3` disponible, max porté à 4, devient `3/4` ; aucune montée ne rend les trois usages. | B02/B03. |
| B04-RES-004 | PHB24 p. 372–373 | Les récupérations `repos court`, `repos long` et `par jour` se déclenchent seulement à la fin du repos correspondant. `Par jour` signifie après un repos long une fois les usages épuisés. | Des libellés de récupération existent, sans déclencheur. **Partiel**. | Système ; type et fin de repos. | Un repos interrompu ne recharge rien ; une ressource non épuisée est ramenée à son maximum seulement si son texte le prévoit. | B09. |
| B04-RES-005 | PHB24 p. 40, B03-INC | Chaque niveau d'emplacement d'Incantation conserve son maximum et ses dépenses. Les emplacements de Magie de pacte forment un pool séparé avec niveau et récupération propres. | Seuls `level1Slots` et un indicateur de repos court sont calculés. **Manquant au-delà du maximum niveau 1**. | Système ; niveaux, pools et dépenses. | Dépenser un emplacement d'un pool n'altère jamais l'autre ; leur interopérabilité de lancement suit B03/B06. | B03-INC, B06. |
| B04-RES-006 | PHB24 p. 13 et 368 | L'Inspiration héroïque est un état binaire : un personnage n'en possède jamais plus d'une. | Des sources informatives existent, aucun état. **Manquant**. | Joueur, MJ, système ; possession et provenance. | Deux octrois ne donnent jamais une valeur 2 ; la fiche montre disponibilité et dernière source. | SF-002. |
| B04-RES-007 | PHB24 p. 13 et 368 | Si un personnage déjà inspiré reçoit une Inspiration héroïque, il peut immédiatement la donner à un autre personnage joueur de son groupe qui n'en possède pas ; sinon le nouvel octroi est perdu. | Aucun état ni transfert. **Manquant**. | Bénéficiaire ; destinataire éligible. | Destinataire extérieur, non joueur ou déjà inspiré refusé ; l'inspiration existante du bénéficiaire n'est jamais consommée par le transfert. | Règle déterministe, sans décision produit. |
| B04-RES-008 | PHB24 p. 13 | Dépenser l'Inspiration héroïque permet de relancer immédiatement n'importe quel dé que le personnage vient de lancer et impose le nouveau résultat. Avec Avantage/Désavantage, un seul des deux dés est relancé. | Aucun jet de partie ni consommation. **Manquant**. | Joueur, système ; jet source et nouveau dé. | Impossible après qu'une conséquence ultérieure est engagée ; impossible sur le dé d'autrui ; le second résultat remplace le premier. | SF-005 ; B05. |
| B04-RES-009 | PHB24 p. 13, traits et dons | Le MJ et toute règle explicite peuvent accorder l'Inspiration héroïque. La provenance et l'éventuel transfert/perte sont enregistrés. | Traits informatifs seulement. **Partiel**. | MJ, système ; source et bénéficiaire. | Le Humain et les autres sources se déclenchent exactement au moment décrit ; aucun repos ne l'accorde par convention implicite. | B01/B02/B09. |
| B04-RES-010 | PHB24 p. 363 | Un personnage ne maintient qu'un effet demandant Concentration. L'état conserve l'effet, la source, le début, la durée maximale et la cause de fin. | Les sorts portent un booléen `concentration`, aucun état actif. **Partiel / manquant**. | Lanceur, système ; effet actif et durée. | Deux concentrations actives ordinaires sont impossibles ; une exception doit venir d'une règle explicite. | B06. |
| B04-RES-011 | PHB24 p. 363, SF-004 | Commencer l'incantation ou activer un nouvel effet de concentration termine immédiatement l'ancien. L'interface demande confirmation avant une commande qui provoquerait ce remplacement. | Aucun lancement ni état. **Manquant**. | Joueur, système ; ancien et nouvel effet. | Refuser la confirmation conserve l'ancien et ne dépense rien ; confirmer termine l'ancien au moment normatif, même si le nouvel effet échoue ensuite selon son texte. | SF-004 ; B06 précise l'engagement. |
| B04-RES-012 | PHB24 p. 363 | Le créateur peut terminer volontairement sa concentration à tout moment sans action. Incapacité d'agir ou mort la termine automatiquement. | État absent. **Manquant**. | Contrôleur, système ; cause de fin. | Un autre joueur ne termine pas la concentration ; la fin retire l'effet et déclenche ses conséquences propres une seule fois. | B05/B06. |
| B04-RES-013 | PHB24 p. 363, OFF-SAC | Pour chaque instance de dégâts subis, maintenir la concentration exige une sauvegarde de Constitution de DD `max(10, floor(dégâts / 2))`, plafonné à 30. Les dégâts absorbés par des PV temporaires comptent ; un effet qui reçoit les dégâts à la place du personnage peut les éviter ou les réduire. | Aucun état ni résolution. **Manquant**. | Système ; instance de dégâts, DD et jet. | 30 dégâts avec 10 absorbés par PV temporaires donnent DD 15 ; 30 absorbés par une protection distincte suivent les dégâts réellement subis par le personnage. | B05/B06. |
| B04-RES-014 | OFF-SAC, PHB24 p. 363 | Hors texte contraire, maintenir une concentration n'exige ni portée ni ligne de vue continues. Une durée expirée ou une condition de fin propre à l'effet la termine. | État absent. **Manquant**. | Système ; durée et conditions de fin. | Sortir de portée ne termine rien par défaut ; chaque exception cite sa source. | B06. |
| B04-RES-015 | DEC-003, B03-RSP | Progression ne recharge aucune ressource. Respécialisation conserve inspiration et concentration, mais remplace les ressources de build et emplacements par les pools pleins du nouveau build. | Parcours et état absents. **Manquant**. | Système ; transformation avant/après. | Une concentration conservée reste attachée à son effet même si le nouveau build ne pourrait plus le lancer ; sa résolution ultérieure suit sa source. | B03-RSP-012/015. |

## Matrice — conditions et épuisement

Chaque instance non cumulative conserve au minimum sa condition, sa source, sa cible,
son début, sa durée ou condition de fin et son état actif. Les effets mécaniques
ci-dessous sont normatifs pour la fiche et le moteur ; B05 décide quand ils sont
consultés pendant une action.

| ID | Source | Cible | État actuel / qualification | Critères d'acceptation | Trace |
|---|---|---|---|---|---|
| B04-CON-001 | PHB24 p. 29 et 363 | Le catalogue fermé contient exactement Aveuglé, Charmé, Assourdi, Épuisement, Effrayé, Agrippé, Incapable d'agir, Invisible, Paralysé, Pétrifié, Empoisonné, À terre, Entravé, Étourdi et Inconscient. | Les quinze clés et libellés existent à titre informatif. **Conforme pour l'inventaire, manquant pour l'état**. | Toute clé libre est refusée ; l'épuisement est la seule condition cumulative. | B05. |
| B04-CON-002 | PHB24 p. 29 et 363 | Plusieurs sources d'une même condition non cumulative ont chacune leur durée. L'effet mécanique ne s'aggrave pas, mais la condition reste tant qu'au moins une instance est active. | Aucune instance. **Manquant**. | Retirer une source sur deux ne retire pas la condition ; l'audit identifie chaque source et fin. | B05/B06. |
| B04-CON-003 | PHB24 p. 361 | **Aveuglé** : impossible de voir, échec automatique aux tests exigeant la vue, attaques du porteur avec Désavantage et attaques contre lui avec Avantage. | Référence seulement. **Manquant**. | Fiche et validation des actions appliquent les trois conséquences, sous réserve d'une capacité permettant effectivement de voir. | B05. |
| B04-CON-004 | PHB24 p. 363 | **Charmé** : impossible d'attaquer le charmeur ou de le viser par une capacité ou un effet magique nuisible ; le charmeur a l'Avantage aux tests sociaux envers la cible. | Référence seulement. **Manquant**. | Chaque instance nomme son charmeur ; être charmé par A n'interdit pas de nuire à B. | B05/B06. |
| B04-CON-005 | PHB24 p. 365 | **Assourdi** : impossible d'entendre et échec automatique aux tests exigeant l'ouïe. | Référence seulement. **Manquant**. | Une action sans exigence auditive n'est pas refusée par cette seule condition. | B05. |
| B04-CON-006 | PHB24 p. 366 | **Épuisement** : niveau entier 1–6 ; chaque niveau impose `-2` aux tests d20 et réduit chaque vitesse de 1,50 m ; le niveau 6 tue. Un repos long achevé retire 1 niveau, sous réserve des restrictions de la source. | Clé présente, aucun niveau. **Manquant**. | N3 donne `-6` et `-4,50 m` ; aucune vitesse ne devient négative ; retirer le dernier niveau termine la condition. | Distances métriques DEC-001 ; dangers détaillés en B05/B09. |
| B04-CON-007 | PHB24 p. 367 | **Effrayé** : Désavantage aux tests de caractéristique et attaques tant que la source est en ligne de vue ; impossible de s'en rapprocher volontairement. | Référence seulement. **Manquant**. | Chaque instance nomme sa source ; masquer A ne neutralise pas une instance causée par B visible. | B05. |
| B04-CON-008 | PHB24 p. 367 et OFF-ERR | **Agrippé** : vitesse 0 ; Désavantage aux attaques contre toute cible autre que le grappler ; déplacement par le grappler avec surcoût, sauf cible Minuscule ou d'au moins deux catégories plus petite. La source et la portée du grappler déterminent la fin. | Référence seulement. **Manquant**. | Chaque instance nomme son grappler ; libération volontaire possible sans action selon l'errata ; perdre la portée termine l'instance. | B05 ; l'errata du don Grappler ne change pas la condition. |
| B04-CON-009 | PHB24 p. 369 | **Incapable d'agir** : aucune action, action Bonus ou Réaction ; concentration rompue ; impossible de parler ; Désavantage à l'initiative si la condition existe au jet. | Référence seulement. **Manquant**. | Une condition qui accorde Incapable d'agir applique aussi toutes ces conséquences sans duplication persistée. | B05/B06. |
| B04-CON-010 | PHB24 p. 370, OFF-ERR | **Invisible** : Avantage à l'initiative ; impossible d'être visé par un effet exigeant d'être vu ; équipement porté ou transporté dissimulé ; attaques du porteur avec Avantage et contre lui avec Désavantage si l'observateur ne le voit pas. | Référence seulement. **Manquant**. | Une créature qui voit effectivement la cible ignore seulement les bénéfices dépendant de la vue ; être caché reste un état distinct précisé par l'errata. | B05. |
| B04-CON-011 | PHB24 p. 371 | **Paralysé** : Incapable d'agir, vitesse 0, échec automatique aux sauvegardes de Force et Dextérité, attaques reçues avec Avantage et coup réussi à 1,50 m automatiquement critique. | Référence seulement. **Manquant**. | Les conditions imbriquées sont calculées sans créer des instances indépendantes impossibles à terminer. | B05. |
| B04-CON-012 | PHB24 p. 372 | **Pétrifié** : transformation avec objets non magiques portés/transportés, poids multiplié par dix, arrêt du vieillissement, Incapable d'agir, vitesse 0, Avantage aux attaques reçues, échec automatique aux sauvegardes Force/Dextérité, Résistance à tous les dégâts et Immunité à Empoisonné. | Référence seulement. **Manquant**. | Fin de la source restaure forme et poids ; l'inventaire n'est ni perdu ni dupliqué. | B05/B07. |
| B04-CON-013 | PHB24 p. 372 | **Empoisonné** : Désavantage aux attaques et tests de caractéristique. | Référence seulement. **Manquant**. | Les sauvegardes ne reçoivent pas ce Désavantage par cette seule condition. | B05. |
| B04-CON-014 | PHB24 p. 372 | **À terre** : seul ramper ou se relever est permis pour se déplacer ; se relever dépense la moitié de la vitesse ; attaques du porteur avec Désavantage ; attaques reçues à 1,50 m avec Avantage, au-delà avec Désavantage. | Référence seulement. **Manquant**. | Avec vitesse 0, impossible de se relever ; la distance de l'attaquant est évaluée au moment de l'attaque. | B05. |
| B04-CON-015 | PHB24 p. 373 | **Entravé** : vitesse 0, attaques du porteur avec Désavantage, attaques contre lui avec Avantage et sauvegardes de Dextérité avec Désavantage. | Référence seulement. **Manquant**. | Les autres sauvegardes ne sont pas altérées par cette seule condition. | B05. |
| B04-CON-016 | PHB24 p. 376 | **Étourdi** : Incapable d'agir, échec automatique aux sauvegardes de Force et Dextérité et attaques reçues avec Avantage. | Référence seulement. **Manquant**. | Aucun coup critique automatique n'est ajouté par cette seule condition. | B05. |
| B04-CON-017 | PHB24 p. 377 | **Inconscient** : Incapable d'agir et À terre, objets tenus lâchés, vitesse 0, attaques reçues avec Avantage, échec automatique aux sauvegardes Force/Dextérité, coup réussi à 1,50 m automatiquement critique et absence de conscience de l'environnement. | Référence seulement. **Manquant**. | La fin d'Inconscient laisse À terre ; les objets lâchés restent dans le monde ou l'inventaire de scène, pas dans la main. | B05/B07. |
| B04-CON-018 | DEC-003, B03-RSP | Conditions et niveau d'épuisement survivent à progression et respécialisation. Une métamorphose conserve par défaut conditions, sorts et malédictions en cours. | Aucun état. **Manquant**. | Aucune reconstruction ne réapplique, ne prolonge ou ne soigne une instance ; chaque échéance d'origine est conservée. | B03-RSP-014, B06. |

## Matrice — inventaire, monnaie et harmonisation

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B04-INV-001 | SF-002, B01/B03 | L'inventaire actif est indépendant des options de départ historiques. Chaque possession conserve objet/version, quantité ou identité d'exemplaire, provenance, propriétaire et emplacement courant. | Lignes `{itemKey, quantity}` incluses dans le build de création. **Partiel / couplage obsolète**. | Système ; objet, version, provenance et état. | Progression/respécialisation ne réoctroie rien ; butin, transfert et correction expliquent chaque variation. | B03-RSP-009, B07/B09. |
| B04-INV-002 | SF-002/SF-006 | Quantité, conteneur, porté, tenu, équipé, harmonisé et consommé sont des états distincts. Un même exemplaire ne se trouve jamais dans deux emplacements incompatibles. | Seuls armure portée et bouclier booléen sont distingués. **Manquant / partiel**. | Joueur, MJ, système ; exemplaire et emplacement. | Déplacer un objet change son état sans le dupliquer ; perdre un conteneur ne détruit pas silencieusement son contenu. | B07. |
| B04-INV-003 | SF-006 | Une quantité est un entier positif pour une ligne existante. Atteindre 0 supprime la ligne active mais conserve la mutation dans l'historique ; un exemplaire non empilable reste individualisé. | Quantité positive validée, sans version, provenance ni historique. **Partiel**. | Système ; ligne et quantité. | Impossible de transférer ou consommer plus que détenu ; aucun objet négatif ou fantôme. | B07/B09. |
| B04-INV-004 | PHB24 p. 213, DEC-009 | La monnaie conserve séparément pièces de cuivre, argent, électrum, or et platine. Les valeurs relatives sont `100 PC = 10 PA = 2 PE = 1 PO = 0,1 PP`. | Un entier `gold` unique. **Manquant / information détruite**. | Système ; cinq quantités entières. | Un butin de 10 PA reste 10 PA tant qu'aucun échange explicite n'a lieu ; la valeur totale peut être dérivée sans modifier les dénominations. | `DR-B04-01` résolue ; DEC-009. |
| B04-INV-005 | PHB24 p. 213 | Cinquante pièces pèsent une livre. Le poids monétaire contribue à la charge si B07 automatise la capacité de transport ; l'affichage reste métrique selon la convention produit. | Monnaie sans poids ; objets en kilogrammes. **Manquant**. | Système ; total de pièces et poids. | Chaque pièce compte indépendamment de sa valeur ; aucun arrondi répété ne fait dériver le total. | Conversion et charge détaillées en B07. |
| B04-INV-006 | PHB24 p. 232 | Un objet magique exigeant harmonisation n'accorde que ses bénéfices non magiques tant que le personnage n'est pas harmonisé, sauf texte contraire. | Aucun objet magique ni harmonisation active. **Manquant**. | Système ; exemplaire, prérequis et porteur. | Porter un bouclier magique non harmonisé donne le bénéfice ordinaire compatible, jamais ses propriétés magiques. | B07. |
| B04-INV-007 | PHB24 p. 232 | S'harmoniser exige un repos court entier concentré sur un seul objet, en contact physique. Ce repos ne peut pas être simultanément celui qui identifie l'objet ; une interruption fait échouer l'harmonisation. | Aucun repos ni harmonisation. **Manquant**. | Joueur, système ; objet et choix de repos. | Un seul objet par personnage et par repos ; aucune harmonisation si l'objet n'est plus détenu au terme. | B09 orchestre les choix du repos. |
| B04-INV-008 | PHB24 p. 232 et 361 | Un personnage possède au plus trois harmonisations, sauf exception explicite. Une tentative vers un quatrième objet échoue tant qu'une harmonisation n'a pas pris fin. | Champ absent. **Manquant**. | Système ; ensemble d'exemplaires harmonisés. | Les doublons ne contournent pas la limite ; toute exception cite sa source. | B07. |
| B04-INV-009 | PHB24 p. 232 | Un personnage ne peut pas être harmonisé avec plusieurs exemplaires du même objet. | Champ absent. **Manquant**. | Système ; identité de règle et exemplaires. | Deux versions mécaniques distinctes suivent leur identité normative ; deux Anneaux de protection sont refusés. | B07 décide l'identité versionnée. |
| B04-INV-010 | PHB24 p. 232 | L'harmonisation prend fin si le prérequis n'est plus satisfait, si l'objet reste à plus de 30 m pendant au moins 24 heures, si le personnage meurt ou si une autre créature s'harmonise avec l'objet. | Champ et distances d'objet absents. **Manquant**. | Système ; prérequis, distance, durée et nouveau porteur. | Une séparation de 23 h 59 ne suffit pas ; revenir à portée réinitialise la durée continue. | B05/B07. |
| B04-INV-011 | PHB24 p. 232 | Le personnage peut volontairement mettre fin à une harmonisation par un repos court centré sur l'objet, sauf objet maudit. | Champ absent. **Manquant**. | Joueur, système ; objet, repos et malédiction. | L'objet maudit refuse la fin ordinaire ; le repos interrompu ne change rien. | B07/B09. |
| B04-INV-012 | PHB24 p. 365, DEC-003 | La mort met fin à toutes les harmonisations. Une progression ou respécialisation les conserve tant que leurs prérequis restent satisfaits ; le recalcul peut ensuite faire cesser celles dont le prérequis n'existe plus. | État absent. **Manquant**. | Système ; transition vitale ou de build. | Mort vide la liste avant une éventuelle résurrection ; respécialisation n'efface aucune harmonisation encore éligible. | B03-RSP-009, B04-VIE-022. |
| B04-INV-013 | SF-001, SF-006 | Le joueur et les MJ autorisés voient l'inventaire complet du personnage. Les autres acteurs ne reçoivent que les objets explicitement publics, découverts ou transférés selon leur visibilité. | La fiche complète est visible à tout membre actif. **Contraire à la cible**. | Joueur, MJ ; projections d'inventaire. | Un objet caché ou texte privé MJ n'apparaît dans aucune réponse non autorisée. | B07/B09. |
| B04-INV-014 | DEC-003 | Une respécialisation conserve exactement objets, quantités, monnaie, port, conteneurs et harmonisations ; aucune option de départ n'est rejouée. | Inventaire intégré au build remplaçable. **Partiel / contraire à la séparation cible**. | Système ; état avant/après. | Diff d'inventaire nul hors fin d'harmonisation causée par un prérequis recalculé. | B03-RSP-009. |

## Matrice — autorité, corrections et audit

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B04-COR-001 | SF-002, DEC-004 | Le joueur agit par commandes de jeu ; il ne remplace jamais librement PV, ressources, conditions, monnaie, inventaire, concentration ou état vital. | L'édition remplace le build et l'équipement, sans état d'aventure. **Contraire à l'autorité cible**. | Joueur, système ; commande métier. | Une charge utile modifiée ne peut définir directement une valeur courante ; le serveur produit la conséquence. | B05/B06/B07/B09. |
| B04-COR-002 | SF-002, SF-004, DEC-009 | Un MJ actif de la campagne peut corriger explicitement un état, y compris pendant un combat, sans effacer l'événement erroné. La correction respecte toujours les invariants structurels. | Aucune correction dédiée ; édition générale permissive. **Manquant / contraire à la cible**. | MJ ; cible, champ, avant/après et motif. | MJ extérieur refusé ; valeur négative, PV supérieurs au max, épuisement hors 0–6 ou référence étrangère refusés. | `DR-B04-02` résolue ; DEC-009. |
| B04-COR-003 | SF-002, SF-004, DEC-009 | Une correction applique les transitions dépendantes du moteur : corriger les PV de 0 à 1 met fin aux jets de mort et à Inconscient causé par 0 PV ; corriger vers 0 applique la transition vitale complète. | Aucun état ni correcteur. **Manquant**. | MJ, système ; correction et effets liés. | Aucun couple incohérent tel que `5 PV + jets de mort actifs` ou `0 PV vivant sans Stable ni jets de mort` n'est persisté. | `DR-B04-03` résolue ; DEC-009. |
| B04-COR-004 | SF-002 | Toute correction conserve ancienne valeur, nouvelle valeur, auteur, date, motif obligatoire, version et conséquences automatiques. | Aucun audit de correction. **Manquant**. | MJ, système ; journal immuable. | Motif vide refusé ; le journal suffit à expliquer l'état sans comparer des sauvegardes externes. | Phase 5 pour la représentation. |
| B04-COR-005 | SF-004, DEC-004 | Une correction est compensatoire : l'historique original reste visible et la projection courante tient compte de la compensation. | Aucun historique de jeu. **Manquant**. | MJ, système ; événement original et compensation. | Corriger deux fois produit deux traces liées ; aucune suppression ou réécriture silencieuse. | B05. |
| B04-COR-006 | SF-001 | Seuls les MJ autorisés et le joueur assigné voient le détail des corrections de sa fiche ; les projections publiques ne révèlent que le nouvel état autorisé. | Visibilité trop large. **Partiel / contraire à la cible**. | Joueur, MJ ; audit et projection. | Un autre joueur ne reçoit ni motif, ni ancienne valeur, ni détail privé d'objet ou condition. | DEC-002. |
| B04-COR-007 | DEC-004 | Une correction multi-champs est fonctionnellement indivisible. Un échec ne laisse ni PV, ni condition, ni ressource, ni inventaire partiellement corrigé. | Aucun agrégat d'état. **Manquant**. | Système ; avant/après complet. | Soit toutes les validations réussissent et une version est produite, soit aucun champ ne change. | Choix transactionnel technique reporté à la Phase 5. |
| B04-COR-008 | DEC-004 | La reconnexion, le redémarrage serveur et la reprise de combat restaurent exactement la version active de la fiche et toutes ses échéances. | Seul le build statique est persisté ; moteur de combat absent. **Manquant**. | Système ; état, versions et échéances. | Aucun compteur, source, durée, choix de PV temporaires ou jet de mort n'est recalculé ou perdu à la reprise. | B05/Phase 5. |

## Matrice — synthèse de l'état actuel

| ID | Constat inspecté | Qualification | Critère de sortie futur | Trace |
|---|---|---|---|---|
| B04-ETA-001 | `ComputedCharacter` est recalculé à la lecture et expose plusieurs sources, mais uniquement pour une composition niveau 1. | **Partiel**. | Build actif versionné, dérivés exhaustifs et état courant assemblés sans ambiguïté. | B04-FIC. |
| B04-ETA-002 | Seul `maxHitPoints` existe ; PV actuels, temporaires, réductions, Sanglant et état vital sont absents. | **Manquant**. | Toutes les transitions B04-VIE sont persistables et explicables. | B04-VIE. |
| B04-ETA-003 | Les ressources calculées n'ont ni valeur courante, ni dépense, ni déclencheur exécutable. | **Partiel / non exploitable**. | Maximum, courant, source et récupération restent cohérents sur action, repos et niveau. | B04-RES. |
| B04-ETA-004 | Les quinze conditions sont un catalogue informatif utilisé par certains effets passifs ; aucune condition active n'est persistée. | **Partiel / non exploitable**. | Instances, sources, durées et épuisement cumulatif suivent B04-CON. | B04-CON. |
| B04-ETA-005 | Les sorts connaissent le marqueur de concentration, mais aucun effet actif ni sauvegarde de maintien n'existe. | **Partiel / non exploitable**. | Une concentration unique survit aux reprises et se termine pour chaque cause normative. | B04-RES-010 à 014. |
| B04-ETA-006 | L'inventaire est une liste de clés/quantités intégrée au build ; seuls armure, bouclier et or sont distingués. | **Partiel / couplage obsolète**. | Possession active indépendante du build, avec provenance, emplacement et version. | B04-INV/B07. |
| B04-ETA-007 | La monnaie est un entier d'or ; argent, cuivre, électrum et platine sont perdus. | **Manquant**. | Les cinq dénominations et leur valeur dérivée sont conservées. | DEC-009. |
| B04-ETA-008 | Harmonisation, mort, stabilité, jets de mort, repos et historique de correction sont absents. | **Manquant**. | Chaque cycle de vie est testable aux bornes et après reconnexion. | B04-VIE/INV/COR. |
| B04-ETA-009 | Tout membre actif de la campagne peut lire la fiche complète. | **Contraire à la cible, critique**. | Projection complète limitée au joueur assigné et aux MJ, projection publique minimale ailleurs. | SF-001, B04-FIC-011. |
| B04-ETA-010 | L'édition générale peut remplacer composition et équipement sans workflow, provenance ou correction compensatoire. | **Contraire à la cible**. | Build, état d'aventure, progression, respécialisation et correction sont des commandes distinctes. | B03, B04-COR. |

## Décisions du bloc

### DR-B04-01 — Représentation fonctionnelle de la monnaie

**Résolue le 20 août 2026 :** PC, PA, PE, PO et PP sont conservées séparément, sans
conversion automatique. Une valeur totale peut être dérivée sans modifier les
dénominations ; tout échange de pièces reste une action explicite.

### DR-B04-02 — Pouvoir de correction du MJ

**Résolue le 20 août 2026 :** tout MJ actif peut corriger l'état à tout moment, combat
compris, avec motif obligatoire. Il peut ajouter, retirer ou remplacer une valeur ou
une instance et citer une règle exceptionnelle non automatisée, sans produire de valeur
structurellement invalide, de référence hors campagne ou d'effacement d'historique.

### DR-B04-03 — Conséquences automatiques d'une correction

**Résolue le 20 août 2026 :** une correction passe par les mêmes transitions que toute
autre mutation. Corriger les PV, un maximum, l'épuisement, une condition ou une
ressource recalcule immédiatement toutes les conséquences dépendantes et journalise le
tout dans une seule opération. Le MJ corrige l'intention, pas chaque champ technique.

## Vérification du bloc

Le bloc est validé le 20 août 2026 :

- les 91 règles ont une source, une cible, un état actuel et des critères
  d'acceptation ;
- les trois décisions du bloc sont résolues et intégrées ;
- le propriétaire a validé explicitement les recommandations `DR-B04-01` à
  `DR-B04-03` ;
- `REQUIREMENTS.md`, `DEC-009`, `GAP-ANALYSIS.md`, `TRACEABILITY.md`, `README.md` et le
  plan de conformité sont synchronisés ;
- aucun code, test, seed, migration, dépendance ou CI n'a été modifié.

Cette validation clôt la spécification B04. Elle ne signifie pas que les écarts
répertoriés sont implémentés ou vérifiés par des tests.
