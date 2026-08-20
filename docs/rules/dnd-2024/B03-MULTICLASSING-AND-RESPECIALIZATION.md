# B03 — Multiclassage et respécialisation

## Statut

**SPÉCIFICATION VALIDÉE PAR LE PROPRIÉTAIRE LE 20 AOÛT 2026.**

Ce document inventorie les règles fonctionnelles du bloc B03 défini dans
[`DND-2024-COMPLIANCE-PLAN.md`](../../DND-2024-COMPLIANCE-PLAN.md). Il décrit la
cible et les écarts observés ; il n'autorise aucune implémentation.

Les 79 règles et les décisions `DR-B03-01` à `DR-B03-05` sont validées. Cette
validation clôt la spécification fonctionnelle B03 ; elle ne modifie ni le code, ni les
tests, ni les données de jeu.

## Sources et conventions

### Sources normatives disponibles

- `PHB24` — [`PlayersHandbook2024.pdf`](../../books/PlayersHandbook2024.pdf), source
  primaire locale. Les numéros cités sont ceux imprimés dans le livre ;
- `OFF-ERR` — [errata officiel du *Player's Handbook 2024*](https://www.dndbeyond.com/sources/dnd/sae/players-handbook) ; aucune correction publiée ne modifie les règles de multiclassage de ce bloc ;
- `OFF-SAC` — [Sage Advice Compendium officiel](https://www.dndbeyond.com/sources/dnd/sae/sage-advice-compendium), utilisé seulement pour les précisions explicites sur les prérequis et les maîtrises ;
- `SF-001`, `SF-002` et `SF-005` dans [`REQUIREMENTS.md`](../../REQUIREMENTS.md) ;
- [`DEC-001`](../../DECISIONS/001-product-scope.md),
  [`DEC-003`](../../DECISIONS/003-character-lifecycle.md) et
  [`DEC-005`](../../DECISIONS/005-dice-rest-and-loot.md) ;
- le présent plan de conformité, la
  [`matrice B01`](B01-LEVEL-ONE-CREATION.md) et la
  [`matrice B02`](B02-LEVELS-TWO-TO-TWENTY.md).

### Pointage primaire du bloc

| Domaine | Pages `PHB24` contrôlées |
|---|---|
| Niveau total, niveau de classe, PV, dés de vie et bonus de maîtrise | p. 41–45 |
| Multiclassage, prérequis et interactions de capacités | p. 44–45 |
| Barbare et Barde multiclassés | p. 50–59 |
| Clerc et Druide multiclassés | p. 68–79 |
| Guerrier et Moine multiclassés | p. 90–101 |
| Paladin et Rôdeur multiclassés | p. 108–119 |
| Roublard et Ensorceleur multiclassés | p. 128–139 |
| Occultiste et Magicien multiclassés | p. 152–165 |

Les pages 44–45, leur table d'emplacements et les encadrés de multiclassage des
douze classes ont été extraits. Les pages 44–45 ont aussi été contrôlées
visuellement afin de préserver la structure du tableau et les renvois entre colonnes.

### Limites entre blocs

- B03 choisit la classe de chaque niveau et combine les gains définis dans B01/B02 ;
  il ne réécrit pas les 48 progressions de sous-classe.
- B03 fixe le calcul des emplacements multiclasses et la provenance des sorts. Le
  cycle complet d'incantation et les exceptions de chaque sort relèvent de B06.
- B03 fixe les transformations d'état provoquées par une respécialisation. Le cycle
  de vie courant de chaque état d'aventure relève de B04.
- Les interactions de combat d'Attaque supplémentaire et de CA sont spécifiées ici ;
  leur exécution pendant un tour relève de B05.
- Les PX restent hors cible. La règle du livre qui exprime un coût en PX est remplacée
  par le déverrouillage de niveau validé dans B02.
- Aucun choix de schéma, transaction MongoDB, endpoint ou écran n'appartient à B03.

### État actuel inspecté

- contrats : `shared/src/character-schema.ts`, `character-sheet-schema.ts` et
  `dnd-catalog-schema.ts` ;
- domaine : `back/src/modules/characters/domain/character.ts`,
  `reference/classes.ts` et `resolution/` ;
- persistance :
  `back/src/modules/characters/infrastructure/persistence/character.schema.ts` ;
- parcours : `front/src/pages/campaigns/detail/characters/builder/_internal/` et
  `front/src/shared/components/character/`.

Les qualifications sont celles de B01/B02 : **Conforme**, **Partiel**,
**Manquant**, **Ambigu**, **Dette** et **Obsolète**. Une trace B04, B05 ou B06
indique une frontière fonctionnelle, pas un ticket d'implémentation.

## Matrice — structure et progression multiclassées

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B03-MUL-001 | PHB24 p. 44, B02-PRG-004 | À chaque niveau déverrouillé, le joueur choisit soit une classe déjà présente, soit une nouvelle classe éligible. | Le build porte une seule `classKey` et reste forcé au niveau 1. **Manquant**. | Joueur, système ; niveau en attente, classe choisie. | Une classe existante suit B02 ; une nouvelle classe déclenche toutes les validations B03 avant finalisation. | SF-002. |
| B03-MUL-002 | PHB24 p. 41–44 | Le niveau total est la somme des niveaux des classes, reste entre 1 et 20 et ne dépend pas de l'ordre d'affichage. L'ordre chronologique des niveaux est conservé. | Aucun niveau de classe ni historique. **Manquant**. | Système ; niveaux par classe et journal. | La somme vaut exactement le niveau total ; aucun niveau de classe négatif, nul dans le build final ou supérieur au total. | SF-002. |
| B03-MUL-003 | SF-002, DEC-003 | Aucun PX n'est saisi, calculé ou persisté. Le déverrouillage individuel ou groupé de B02 reste l'unique autorisation d'ajouter un niveau. | Aucun workflow de progression. **Manquant**. | MJ, joueur ; niveau en attente. | Un build multiclassé ne peut contourner ni créer un déverrouillage. | B02-PRG-001/003. |
| B03-MUL-004 | PHB24 p. 44, OFF-SAC | Pour entrer dans une nouvelle classe, les scores de base applicables de cette classe et de toutes les classes déjà présentes satisfont 13. Un bonus temporaire ne qualifie jamais. | Métadonnées de prérequis non consommées ; le Guerrier est représenté à tort par Force **et** Dextérité au lieu de Force **ou** Dextérité. **Partiel / donnée incorrecte dormante**. | Joueur, système ; scores permanents au moment du niveau. | Chaque nouvelle entrée teste la nouvelle classe et toutes les classes courantes ; un effet temporaire est ignoré ; le refus nomme chaque score insuffisant. | Table B03-PRQ. |
| B03-MUL-005 | PHB24 p. 44 | La classe initiale n'exige pas 13 dans sa caractéristique principale tant que le personnage reste monoclassé. Dès qu'il entre dans une autre classe, elle fait partie des classes courantes à contrôler. | Aucun validateur d'entrée. **Manquant**. | Joueur, système ; classe initiale. | Un Guerrier initial avec Force 12 et Dextérité 12 est valide au niveau 1, mais ne peut entrer dans aucune nouvelle classe tant que Force ou Dextérité n'atteint pas 13. | SF-002. |
| B03-MUL-006 | PHB24 p. 44 et tables de classe | Les capacités d'une classe dépendent exclusivement du niveau dans cette classe, sauf texte qui vise explicitement le niveau total ou le bonus de maîtrise. | Résolution limitée aux capacités de niveau 1 d'une classe unique. **Manquant**. | Système ; niveau par classe, capacités. | Un Guerrier 2/Magicien 3 reçoit les gains Guerrier 1–2 et Magicien 1–3, jamais ceux d'un Guerrier 5 ou Magicien 5. | B02. |
| B03-MUL-007 | PHB24 p. 41–45 | Le bonus de maîtrise, les seuils de sort mineur et les traits qui disent « niveau du personnage » utilisent le niveau total. | La formule de bonus existe ; le niveau est forcé à 1. **Partiel**. | Système ; niveau total. | Les seuils 5/11/17 s'appliquent au même total quelle que soit la répartition des classes. | B02-GEN-001/003/011. |
| B03-MUL-008 | PHB24 p. 44 | Le bonus de maîtrise n'est jamais additionné entre classes ; une seule valeur issue du niveau total alimente tous les dérivés. | Une seule formule générique existe. **Conforme en formule, non exploitable au-delà du niveau 1**. | Système ; niveau total, dérivés. | Un Guerrier 3/Roublard 2 a exactement +3, pas +2 +2. | SF-002. |
| B03-MUL-009 | PHB24 p. 42 et 44 | Un niveau pris dans une nouvelle classe après le niveau total 1 donne les PV d'un niveau ultérieur : valeur fixe ou dé de cette classe plus Constitution, minimum 1. Il ne redonne jamais le maximum du dé de niveau 1. | PV résolus au niveau 1 seulement. **Manquant**. | Joueur, système ; classe du niveau, méthode et jet serveur. | Un premier niveau de Barbare pris au niveau total 6 utilise `7 + CON` ou `1d12 + CON`, jamais `12 + CON`. | B02-PRG-005/006. |
| B03-MUL-010 | PHB24 p. 44 | Chaque niveau ajoute un dé de vie du type de sa classe. Les dés de même type forment un pool commun ; les types différents restent séparés avec leur état dépensé. | Aucun pool ni état de dés de vie. **Manquant**. | Système ; type, maximum et dépenses par pool. | Guerrier 5/Paladin 5 produit dix d10 ; Clerc 5/Paladin 5 produit cinq d8 et cinq d10 ; les dés déjà dépensés ne réapparaissent pas à la montée. | B04. |
| B03-MUL-011 | PHB24 p. 44 et descriptions de classe | La classe initiale fournit tous ses traits de départ. Chaque nouvelle classe fournit seulement les traits listés « personnage multiclassé », puis toutes ses capacités de niveau 1. L'identité de la classe initiale est donc persistée. | Le build ne distingue pas classe initiale et classe courante ; les maîtrises de départ complètes sont toujours appliquées. **Manquant / contraire à la cible future**. | Système ; classe initiale, séquence, provenance. | Deux répartitions identiques avec une classe initiale différente peuvent légitimement produire des sauvegardes et maîtrises différentes ; chaque valeur explique sa source. | Tables B03-ENT. |
| B03-MUL-012 | PHB24 p. 44 et descriptions de classe | Entrer dans une nouvelle classe n'accorde aucun équipement de départ, aucun or et aucune nouvelle option de paquetage. | Le seul parcours existant lie une classe unique à un équipement de départ. **Manquant**. | Système ; inventaire et provenance. | Ajouter une classe ne change ni possessions ni monnaie ; un paquetage forgé par le client est refusé. | B01-EQP ; B07. |

## Matrice — prérequis de caractéristiques

Le mot **et** impose tous les scores ; **ou** accepte l'une des deux branches. Les
valeurs sont testées sur les scores permanents résolus au moment de l'entrée.

| ID | Classe nouvelle ou déjà présente | Prérequis à 13 | Source | État actuel / qualification | Critère d'acceptation |
|---|---|---|---|---|---|
| B03-PRQ-BAR | Barbare | Force | PHB24 p. 50 et 44 | Métadonnée présente, inutilisée. **Partiel**. | Force 13 passe ; 12 refuse. |
| B03-PRQ-BARD | Barde | Charisme | PHB24 p. 58 et 44 | Métadonnée présente, inutilisée. **Partiel**. | Charisme 13 passe ; 12 refuse. |
| B03-PRQ-CLR | Clerc | Sagesse | PHB24 p. 68 et 44 | Métadonnée présente, inutilisée. **Partiel**. | Sagesse 13 passe ; 12 refuse. |
| B03-PRQ-DRU | Druide | Sagesse | PHB24 p. 78 et 44 | Métadonnée présente, inutilisée. **Partiel**. | Sagesse 13 passe ; 12 refuse. |
| B03-PRQ-FTR | Guerrier | Force **ou** Dextérité | PHB24 p. 90 et 44 | Deux exigences cumulatives sont stockées. **Donnée incorrecte dormante**. | `FOR 13/DEX 8` et `FOR 8/DEX 13` passent ; `12/12` refuse. |
| B03-PRQ-MNK | Moine | Dextérité **et** Sagesse | PHB24 p. 100 et 44 | Métadonnées présentes, inutilisées. **Partiel**. | Les deux scores valent au moins 13. |
| B03-PRQ-PAL | Paladin | Force **et** Charisme | PHB24 p. 108 et 44 | Métadonnées présentes, inutilisées. **Partiel**. | Les deux scores valent au moins 13. |
| B03-PRQ-RGR | Rôdeur | Dextérité **et** Sagesse | PHB24 p. 118 et 44 | Métadonnées présentes, inutilisées. **Partiel**. | Les deux scores valent au moins 13. |
| B03-PRQ-ROG | Roublard | Dextérité | PHB24 p. 128 et 44 | Métadonnée présente, inutilisée. **Partiel**. | Dextérité 13 passe ; 12 refuse. |
| B03-PRQ-SOR | Ensorceleur | Charisme | PHB24 p. 138 et 44 | Métadonnée présente, inutilisée. **Partiel**. | Charisme 13 passe ; 12 refuse. |
| B03-PRQ-WLK | Occultiste | Charisme | PHB24 p. 152 et 44 | Métadonnée présente, inutilisée. **Partiel**. | Charisme 13 passe ; 12 refuse. |
| B03-PRQ-WIZ | Magicien | Intelligence | PHB24 p. 164 et 44 | Métadonnée présente, inutilisée. **Partiel**. | Intelligence 13 passe ; 12 refuse. |

## Matrice — traits reçus en entrant dans une nouvelle classe

Chaque ligne s'ajoute aux capacités de niveau 1 de la classe. Les maîtrises de jets de
sauvegarde et l'équipement de départ ne sont jamais accordés par cette entrée. Une
capacité de classe qui accorde ensuite une maîtrise reste applicable normalement.

| ID | Nouvelle classe | Traits de départ reçus | Source | État actuel / qualification | Critères d'acceptation |
|---|---|---|---|---|---|
| B03-ENT-BAR | Barbare | Dé de vie, armes de guerre, boucliers | PHB24 p. 50–51 | Aucun profil d'entrée distinct. **Manquant**. | Ni sauvegardes ni armure légère/intermédiaire de la table initiale ne sont ajoutées par le profil d'entrée. |
| B03-ENT-BARD | Barde | Dé de vie, une compétence au choix, un instrument au choix, armures légères | PHB24 p. 58–59 | Instruments et profil d'entrée absents. **Manquant**. | Choix concrets, sans doublon consommant silencieusement le gain. |
| B03-ENT-CLR | Clerc | Dé de vie, armures légères et intermédiaires, boucliers | PHB24 p. 68–69 | Aucun profil d'entrée distinct. **Manquant**. | L'Ordre divin de niveau 1 s'applique ensuite séparément. |
| B03-ENT-DRU | Druide | Dé de vie, armures légères, boucliers | PHB24 p. 78–79 | Aucun profil d'entrée distinct. **Manquant**. | L'Ordre primitif de niveau 1 s'applique ensuite séparément. |
| B03-ENT-FTR | Guerrier | Dé de vie, armes de guerre, armures légères et intermédiaires, boucliers | PHB24 p. 90–91 | Aucun profil d'entrée distinct. **Manquant**. | L'armure lourde et les sauvegardes initiales ne sont pas accordées. |
| B03-ENT-MNK | Moine | Dé de vie uniquement | PHB24 p. 100–101 | Aucun profil d'entrée distinct. **Manquant**. | Arts martiaux et Défense sans armure viennent ensuite des capacités N1, pas des traits de départ. |
| B03-ENT-PAL | Paladin | Dé de vie, armes de guerre, armures légères et intermédiaires, boucliers | PHB24 p. 108–109 | Aucun profil d'entrée distinct. **Manquant**. | L'armure lourde et les sauvegardes initiales ne sont pas accordées. |
| B03-ENT-RGR | Rôdeur | Dé de vie, armes de guerre, une compétence de la liste du Rôdeur, armures légères et intermédiaires, boucliers | PHB24 p. 118–119 | Aucun profil d'entrée distinct. **Manquant**. | La compétence respecte la liste et ajoute réellement une maîtrise. |
| B03-ENT-ROG | Roublard | Dé de vie, une compétence de la liste du Roublard, outils de voleur, armures légères | PHB24 p. 128–129 | Aucun profil d'entrée distinct. **Manquant**. | Expertise N1 ne cible ensuite que des compétences effectivement maîtrisées. |
| B03-ENT-SOR | Ensorceleur | Dé de vie uniquement | PHB24 p. 138–139 | Aucun profil d'entrée distinct. **Manquant**. | Aucune sauvegarde ou maîtrise initiale supplémentaire. |
| B03-ENT-WLK | Occultiste | Dé de vie, armures légères | PHB24 p. 152–153 | Aucun profil d'entrée distinct. **Manquant**. | Pacte magique et Manifestation viennent des capacités N1. |
| B03-ENT-WIZ | Magicien | Dé de vie uniquement | PHB24 p. 164–165 | Aucun profil d'entrée distinct. **Manquant**. | Aucune sauvegarde ou maîtrise initiale supplémentaire. |

## Matrice — cumuls et interactions de capacités

| ID | Source | Cible | État actuel / qualification | Critères d'acceptation | Trace |
|---|---|---|---|---|---|
| B03-CUM-001 | PHB24 p. 44 | Plusieurs formules de CA alternatives ne s'additionnent pas. Le personnage choisit une seule formule applicable à la fois, puis les bonus compatibles s'appliquent selon leur texte. | Le moteur sait arbitrer certaines formules de CA d'un build niveau 1, pas plusieurs classes. **Partiel**. | Moine/Ensorceleur choisit Défense sans armure ou Résilience draconique ; aucune somme des deux bases. | B05. |
| B03-CUM-002 | PHB24 p. 44 | Plusieurs capacités Attaque supplémentaire ne se cumulent pas. Le personnage attaque deux fois, sauf capacité explicite accordant davantage, notamment les seuils propres du Guerrier. | Une seule classe niveau 1, aucune Attaque supplémentaire. **Manquant**. | Guerrier 5/Barbare 5 attaque deux fois, pas trois ; les capacités Guerrier 11/20 produisent leur nombre explicite. | B05. |
| B03-CUM-003 | PHB24 p. 44 et 156 | L'Attaque supplémentaire de Lame assoiffée ne s'ajoute pas à une autre Attaque supplémentaire ; Lame dévorante modifie seulement le nombre prévu par son propre texte. | Manifestations non structurées au-delà du niveau 1. **Manquant**. | Occultiste 5/Guerrier 5 n'obtient aucune attaque additionnelle par simple cumul des deux sources. | B02-CHO-011 ; B05. |
| B03-CUM-004 | PHB24 p. 44, OFF-SAC, B01-CLA-001 | Une même maîtrise ne double jamais le bonus. Les choix d'entrée destinés à accorder une compétence ou un outil doivent produire un choix éligible non déjà acquis ; les maîtrises fixes en doublon restent une seule maîtrise sans remplacement inventé. | Le backend refuse certains doublons au niveau 1, sans provenance multiclassée. **Partiel**. | Aucun doublon ne produit deux fois le bonus ni ne consomme silencieusement un choix obligatoire. | B01 ; B03-ENT. |
| B03-CUM-005 | PHB24 p. 44 et descriptions de classe | Toutes les capacités de niveau 1 de la nouvelle classe sont acquises, y compris leurs choix. Les quotas et prérequis restent calculés sur le niveau de cette classe ; les choix identiques issus de plusieurs sources conservent leur provenance et n'ajoutent aucun effet au-delà de leur texte. | Une seule source de classe et des quotas niveau 1 seulement. **Manquant**. | Chaque choix est expliqué par sa source ; supprimer une classe lors d'une respécialisation supprime exactement ses octrois. | B02/B05/B06/B07. |
| B03-CUM-006 | PHB24 p. 44 et descriptions de classe | Les capacités qui accordent une ressource homonyme dans plusieurs classes restent rattachées à leur classe, à son niveau, à son maximum et à sa récupération. Aucune addition n'est déduite du seul nom partagé. | Les ressources calculées n'ont ni état courant ni provenance multiclassée complète. **Manquant**. | Chaque dépense désigne la capacité source ; un maximum ne dépend que de la table ou du texte qui le définit. | B04/B05. |

## Matrice — incantation multiclassée

| ID | Source | Cible | État actuel / qualification | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|
| B03-INC-001 | PHB24 p. 44 | Un personnage multiclassé qui ne possède Incantation que dans une classe suit entièrement la table de cette classe ; la table multiclassée ne s'applique qu'à partir de deux classes dotées d'Incantation. | Modèle limité aux sorts de niveau 0–1 d'une classe. **Manquant**. | Une classe martiale sans Incantation n'altère jamais les emplacements de l'unique classe lanceuse. | B06. |
| B03-INC-002 | PHB24 p. 44 | Les sorts préparés, sorts mineurs, listes, quotas et niveaux accessibles sont déterminés séparément pour chaque classe, comme si le personnage était monoclassé à ce niveau de classe. | Les sources niveau 1 peuvent être agrégées, sans niveaux de classe. **Manquant / partiel**. | Rôdeur 4/Ensorceleur 3 prépare les quotas de Rôdeur 4 et d'Ensorceleur 3 ; ses emplacements supérieurs ne déverrouillent aucun sort supérieur prématuré. | B02-SOR ; B06. |
| B03-INC-003 | PHB24 p. 44 | Chaque sort conserve sa classe source et emploie la caractéristique, le DD, le bonus d'attaque et le focaliseur permis par cette source. | Le schéma expose une origine, mais ne représente qu'une classe principale. **Partiel**. | Un même sort acquis de deux classes reste distinguable ; sa résolution utilise la source choisie. | B06. |
| B03-INC-004 | PHB24 p. 44 | Les sorts mineurs de toutes les classes sont conservés. Leur éventuelle augmentation de puissance suit le niveau total, sauf texte contraire. | Sorts mineurs niveau 1 seulement. **Manquant**. | Les seuils 5/11/17 ne sont appliqués ni par classe ni plusieurs fois. | B02-GEN-011 ; B06. |
| B03-INC-005 | PHB24 p. 45, DR-B03-05 | Le niveau effectif d'emplacements additionne les niveaux complets de Barde/Clerc/Druide/Ensorceleur/Magicien, `ceil(Paladin/2)`, `ceil(Rôdeur/2)`, `floor(Chevalier occulte/3)` et `floor(Arnaqueur arcanique/3)`. Chaque classe fractionnaire est arrondie séparément avant l'addition. | Aucune table ni sous-classe active ; seul `level1Slots` existe. **Manquant**. | Le résultat entier entre 1 et 20 pointe exactement la table B03-INC-TAB ; une classe non listée contribue 0. | `DR-B03-05` résolue ; B06. |
| B03-INC-006 | PHB24 p. 45 | Les emplacements de niveau 1 à 9 sont ceux de la ligne correspondant au niveau effectif, sans somme des tables individuelles. | Contrats et runtime limités au niveau 1. **Manquant**. | Les vingt lignes sont vérifiées ; aucun emplacement d'une table individuelle ne s'ajoute au résultat. | Table B03-INC-TAB ; B06. |
| B03-INC-007 | PHB24 p. 45 | Un emplacement d'un niveau supérieur aux sorts préparables peut seulement lancer, éventuellement en surclassement, un sort effectivement préparé de niveau inférieur. | Aucun sort supérieur ni surclassement. **Manquant**. | Posséder un emplacement niveau 3 ne rend jamais préparables les sorts niveau 3 d'une classe encore limitée au niveau 2. | B06. |
| B03-INC-008 | PHB24 p. 45 | Magie de pacte reste un pool séparé selon le niveau d'Occultiste. Ses emplacements peuvent lancer les sorts préparés d'Incantation et réciproquement, si l'emplacement a un niveau approprié. | Un emplacement de pacte niveau 1 est modélisé, sans interaction multiclassée ni état. **Partiel / manquant**. | Les pools, niveaux et récupérations restent distincts ; un lancement désigne le pool dépensé. | B02-SOR-006 ; B04/B06. |
| B03-INC-009 | SF-002, B02-PRG-008 | Ajouter un niveau ne restaure aucun emplacement déjà dépensé. Une hausse de maximum augmente seulement la capacité maximale ; les pools de pacte et d'Incantation gardent chacun leurs dépenses. | Aucun état d'emplacement. **Manquant**. | Comparaison avant/après sans récupération implicite, y compris quand le niveau effectif change. | B04/B06. |
| B03-INC-010 | PHB24 p. 45, DR-B03-05 | Les contributions fractionnaires sont arrondies classe par classe, jamais après regroupement par catégorie. | Aucun calcul. **Manquant ; ambiguïté documentaire résolue**. | Paladin 1/Rôdeur 1 contribue 2 ; Guerrier Chevalier occulte 4/Roublard Arnaqueur arcanique 5 contribue 2. | `DR-B03-05` résolue. |

### Table B03-INC-TAB — emplacements par niveau effectif

| Niveau effectif | N1 | N2 | N3 | N4 | N5 | N6 | N7 | N8 | N9 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 2 | — | — | — | — | — | — | — | — |
| 2 | 3 | — | — | — | — | — | — | — | — |
| 3 | 4 | 2 | — | — | — | — | — | — | — |
| 4 | 4 | 3 | — | — | — | — | — | — | — |
| 5 | 4 | 3 | 2 | — | — | — | — | — | — |
| 6 | 4 | 3 | 3 | — | — | — | — | — | — |
| 7 | 4 | 3 | 3 | 1 | — | — | — | — | — |
| 8 | 4 | 3 | 3 | 2 | — | — | — | — | — |
| 9 | 4 | 3 | 3 | 3 | 1 | — | — | — | — |
| 10 | 4 | 3 | 3 | 3 | 2 | — | — | — | — |
| 11 | 4 | 3 | 3 | 3 | 2 | 1 | — | — | — |
| 12 | 4 | 3 | 3 | 3 | 2 | 1 | — | — | — |
| 13 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | — | — |
| 14 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | — | — |
| 15 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | — |
| 16 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | — |
| 17 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | 1 |
| 18 | 4 | 3 | 3 | 3 | 3 | 1 | 1 | 1 | 1 |
| 19 | 4 | 3 | 3 | 3 | 3 | 2 | 1 | 1 | 1 |
| 20 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 1 | 1 |

## Matrice — reconstruction par respécialisation

La respécialisation est une règle produit de `SF-002` et `DEC-003`, pas une option
décrite par le PHB. Le PHB redevient normatif pour valider chaque niveau rejoué.

| ID | Source | Cible | État actuel / qualification | Acteurs et données | Critères d'acceptation | Décision / trace |
|---|---|---|---|---|---|---|
| B03-RSP-001 | SF-002, DEC-003, DR-B03-01 | Un MJ actif déverrouille la respécialisation d'un personnage accepté et assigné. Seul le joueur assigné reconstruit et soumet le candidat ; le workflow reste distinct d'une montée et d'une édition ordinaire. | L'édition actuelle remplace librement la classe unique sans workflow. **Contraire à la cible**. | MJ, joueur ; autorisation et candidat. | Refus d'un joueur, d'un MJ extérieur, d'une fiche non acceptée ou non assignée ; aucune requête d'édition générale ne change classe ou caractéristiques. | `DR-B03-01` résolue. |
| B03-RSP-002 | SF-002, DEC-003, DR-B03-02 | Le MJ peut déverrouiller à tout moment. Le joueur ne peut commencer, reprendre ou soumettre pendant `EN_COURS`, `EN_PAUSE` ou `BUTIN`; le candidat ne peut alors être accepté ni activé. Ces actions sont permises hors combat et en `PRÉPARATION`. | Aucun combat ni verrou. **Manquant**. | Joueur, MJ ; état de campagne/combat. | Le déverrouillage reste possible dans chaque état ; les trois actions du joueur et l'acceptation/activation sont refusées dans les états interdits et autorisées dans les autres. | `DR-B03-02` résolue. |
| B03-RSP-003 | SF-002, DEC-003 | La reconstruction repart du niveau total 1 et rejoue exactement le nombre de niveaux total actuel. Le total final ne peut ni augmenter ni diminuer. | Aucun historique de niveaux. **Manquant**. | Joueur, système ; séquence complète. | Un personnage N12 soumet exactement douze niveaux valides ; aucune respécialisation ne consomme ou ne crée un déverrouillage. | SF-002. |
| B03-RSP-004 | SF-002, DEC-003, DEC-008 | Nom, alignement, espèce, lignée/héritage, historique, taille physique et catégorie de taille restent immuables. Portrait, description, âge et poids ne font pas partie du build rejoué et suivent leur édition ordinaire. | Plusieurs champs sont encore absents ; édition non verrouillée par validation. **Manquant / partiel**. | Joueur, système ; identité et origine. | La charge utile de respécialisation ne peut remplacer aucun champ immuable, même par un client modifié. | B01 ; SF-002. |
| B03-RSP-005 | SF-002, DEC-003 | La classe initiale, la répartition et l'ordre des classes, sous-classes, dons de progression, améliorations de caractéristiques, sorts et tous les choix de classe des niveaux rejoués peuvent changer, sous réserve des règles B01/B02/B03. | Ces choix au-delà du niveau 1 n'existent pas. **Manquant**. | Joueur, système ; nouveau build complet. | Une ancienne option n'est conservée que si elle est rechoisie ou accordée par une source immuable. | B01/B02. |
| B03-RSP-006 | PHB24 p. 44, SF-002 | La nouvelle classe initiale reçoit les traits initiaux complets ; toutes les autres utilisent B03-ENT. L'ordre rejoué peut donc modifier sauvegardes et maîtrises à répartition finale identique. | Classe initiale non distinguée. **Manquant**. | Système ; séquence de classes. | Le résultat est déterminé par la séquence persistée, jamais par un tri des classes. | B03-MUL-011. |
| B03-RSP-007 | PHB24 p. 44, SF-002 | Chaque entrée dans une nouvelle classe est validée au niveau rejoué correspondant, avec les scores permanents déjà acquis à ce point. Une amélioration antérieure peut rendre une classe éligible ; une amélioration ultérieure ne peut pas la justifier rétroactivement. | Aucun validateur séquentiel. **Manquant**. | Système ; chronologie des scores et classes. | Inverser deux niveaux peut rendre un build valide ou invalide ; le journal explique le premier niveau fautif. | B03-PRQ. |
| B03-RSP-008 | SF-002, DEC-003, DR-B03-03 | La méthode et les six valeurs de base d'origine sont conservées. Le joueur peut réassigner ces six valeurs, rejouer les bonus de l'historique immuable et tous les gains de caractéristiques des niveaux ; aucun nouveau tirage n'est permis. | Les trois méthodes niveau 1 existent ; le tirage actuel est client et éditable. **Partiel / contraire à l'autorité cible pour le tirage**. | Joueur, système ; méthode, valeurs et affectations. | Les six valeurs forment exactement le même multiensemble avant/après ; aucun dé n'est relancé ; bonus et améliorations restent valides à chaque niveau rejoué. | `DR-B03-03` résolue ; B01-CAR. |
| B03-RSP-009 | SF-002, DEC-003, DR-B03-04 | Aucun équipement ni or de départ n'est rejoué. Objets, quantités, monnaie, équipement porté, contenu des conteneurs et harmonisations sont conservés exactement. | Inventaire, or et équipement porté niveau 1 existent ; état d'aventure incomplet. **Partiel**. | Système ; possessions et équipement. | Aucun objet, pièce, port ou harmonisation n'apparaît, ne disparaît ou ne change à cause du nouveau build. | `DR-B03-04` résolue ; B04/B07. |
| B03-RSP-010 | SF-002, DEC-003 | Toutes les maîtrises sont recalculées. Un objet conservé peut rester porté tout en devenant non maîtrisé ; le système applique alors les conséquences des règles et ne détruit ni ne remplace l'objet. | Maîtrises recalculées pour un build niveau 1 ; absence d'état d'aventure. **Partiel**. | Système ; maîtrises, port et objets. | Retirer une formation d'armure retire la maîtrise, pas l'armure ; fiche et actions exposent la conséquence. | B04/B05/B07. |
| B03-RSP-011 | SF-002, DEC-003 | Capacités, sorts, DD, CA, PV max, bonus de maîtrise et tous les dérivés de construction sont recalculés depuis le nouveau build, sans conserver un dérivé de l'ancien. | Fiche niveau 1 recalculable, sans versions ni multiclassage. **Partiel**. | Système ; ancien et nouveau build. | Deux recalculs du même build donnent le même résultat et la provenance de chaque valeur. | B04/B05/B06. |
| B03-RSP-012 | SF-002, DEC-003, DR-B03-04 | Les anciens dés de vie, emplacements d'Incantation, emplacements de pacte et ressources de classe disparaissent avec l'ancien build. Les pools du nouveau build commencent tous pleins ; aucune ressource absente du nouveau build ne survit sous une clé homonyme. | Ressources sans valeur courante ; aucune respécialisation. **Manquant**. | Système ; ressources avant/après et provenance. | Une ressource retirée devient inaccessible ; chaque pool du nouveau build vaut exactement son maximum, malgré les dépenses de l'ancien build. | `DR-B03-04` résolue ; B04/B06. |
| B03-RSP-013 | SF-002, DEC-003 | Les nouveaux PV actuels valent `min(anciens PV actuels, nouveaux PV maximaux)`. Une hausse du maximum ne soigne pas ; une baisse écrête seulement l'excédent. | Seuls les PV max niveau 1 existent. **Manquant**. | Système ; PV actuels et maximum avant/après. | `20/30 → max 40` reste à 20 ; `30/30 → max 18` devient 18. | B04. |
| B03-RSP-014 | SF-002, DEC-003 | Les conditions et niveaux d'épuisement persistants sont conservés sans les réappliquer ni les guérir. | Catalogue de conditions informatif, aucun état. **Manquant**. | Système ; conditions, épuisement et sources. | Avant/après conserve chaque état et sa valeur exacte. | B04. |
| B03-RSP-015 | SF-002, DR-B03-04 | PV temporaires, inspiration, concentration et état relatif à la mort sont conservés exactement. Dés de vie, emplacements et ressources de classe suivent le remplacement plein de B03-RSP-012 ; harmonisation et port suivent B03-RSP-009. | Ces états sont absents ou incomplets. **Manquant**. | Système ; état d'aventure complet. | Chaque champ possède une valeur avant/après explicite ; une concentration ou un état de mort ne disparaît pas du seul fait de la respécialisation. | `DR-B03-04` résolue ; B04/B06. |
| B03-RSP-016 | SF-002, DEC-003, DR-B03-02 | L'ancienne fiche acceptée reste l'unique fiche active pendant la reconstruction, la revue et les corrections après refus. Le candidat ne devient actif qu'à son acceptation atomique. | Aucun brouillon, version ou acceptation. **Manquant**. | Joueur, MJ ; build actif et candidat. | Toute lecture ou action de jeu utilise l'ancien build jusqu'à l'acceptation ; aucun brouillon ou candidat refusé n'alimente la fiche. | `DR-B03-02` résolue. |
| B03-RSP-017 | SF-002, DEC-003, DR-B03-02 | Le candidat complet est soumis à un MJ actif, qui l'accepte ou le refuse avec les mêmes garanties de motif et d'audit que la validation initiale. Un refus conserve l'ancienne fiche active et laisse le candidat corrigeable ; aucun second MJ n'est exigé. | Workflow de validation absent. **Manquant**. | Joueur, MJ ; soumission, motif et décision. | Un joueur ne s'auto-accepte pas ; un MJ actif peut décider seul ; après refus, le joueur corrige et resoumet sans perdre l'ancien build actif. | B01-VAL ; `DR-B03-02` résolue. |
| B03-RSP-018 | SF-002 | L'activation acceptée remplace fonctionnellement le build en une seule opération avec la transformation d'état. Un échec ne laisse ni niveaux, ni ressources, ni PV partiellement remplacés. | Aucun agrégat de respécialisation. **Manquant**. | Système ; build, état et version. | Toute validation échoue sans mutation ou réussit avec un avant/après complet. | Choix transactionnel technique reporté à la Phase 5. |
| B03-RSP-019 | SF-002, DEC-003 | L'historique conserve ancien et nouveau build, initiateur, auteur de soumission, décisionnaire, dates, motifs, transformation de chaque état et version active. | Le build courant remplace l'ancien ; aucun historique. **Manquant**. | Système, joueur, MJ ; audit. | La fiche active et chaque respécialisation passée sont explicables sans reconstituer une version écrasée. | Phase 5 pour le modèle. |

## Matrice — synthèse de l'état actuel

| ID | Constat inspecté | Qualification | Critère de sortie futur | Trace |
|---|---|---|---|---|
| B03-ETA-001 | `CharacterBuildSnapshot` et la persistance portent une seule `classKey`, sans niveau de classe, classe initiale ni journal. | **Manquant**. | Séquence et niveaux par classe expliquent le total. | B03-MUL. |
| B03-ETA-002 | `Character.build` injecte toujours `LEVEL_ONE`. | **Manquant**. | Niveau total et niveaux de classe proviennent du build persisté. | B02/B03. |
| B03-ETA-003 | `multiclassPrerequisites` existe dans le référentiel mais n'est consommé par aucun validateur ; le Guerrier encode un faux ET Force/Dextérité. | **Partiel / donnée incorrecte dormante**. | Prérequis structurés avec opérateurs ET/OU et validation séquentielle. | B03-PRQ. |
| B03-ETA-004 | Les classes ne distinguent pas les traits initiaux complets des traits reçus en multiclassage. | **Manquant**. | Douze profils d'entrée contrôlés contre le PHB. | B03-ENT. |
| B03-ETA-005 | Sorts et emplacements sont limités aux niveaux 0–1 et à `level1Slots`; aucune table multiclassée ou provenance multi-classe complète. | **Manquant**. | Quotas par classe, niveau effectif, table 1–20 et Magie de pacte séparée. | B03-INC/B06. |
| B03-ETA-006 | PV actuels, dés de vie, ressources dépensées, conditions, concentration et autres états d'aventure ne sont pas persistés. | **Manquant**. | Transformation avant/après vérifiable pour montée et respécialisation. | B04. |
| B03-ETA-007 | L'édition actuelle réutilise le schéma de finalisation et peut remplacer la classe et les caractéristiques sans respécialisation ni nouvelle validation. | **Contraire à la cible**. | Édition ordinaire, progression et respécialisation sont trois commandes fonctionnelles distinctes. | SF-002/DEC-003. |
| B03-ETA-008 | L'équipement de départ est lié au build courant ; aucune provenance d'aventure ne permet encore de prouver sa conservation sans nouvel octroi. | **Partiel**. | Inventaire actif indépendant des options de départ historiques. | B03-RSP/B04/B07. |

## Décisions du bloc

### DR-B03-01 — Initiation d'une respécialisation

**Résolue le 20 août 2026 :** un MJ actif déverrouille la respécialisation d'un
personnage accepté et assigné. Seul le joueur assigné construit et soumet le candidat ;
seul un MJ actif l'accepte ou le refuse.

### DR-B03-02 — Fenêtre et fiche active pendant la reconstruction

**Résolue le 20 août 2026 :** le MJ peut déverrouiller à tout moment. Le joueur ne peut
commencer, reprendre ou soumettre le candidat pendant `EN_COURS`, `EN_PAUSE` ou
`BUTIN`; le candidat ne peut alors être accepté ni activé. Ces actions sont permises
hors combat et en `PRÉPARATION`. L'ancienne fiche acceptée reste active jusqu'à
l'acceptation atomique. Un refus conserve cette fiche et laisse le candidat corrigeable
puis resoumissible.

### DR-B03-03 — Caractéristiques et nouveaux tirages

**Résolue le 20 août 2026 :** la méthode et les six valeurs de base d'origine sont
conservées. Le joueur peut réassigner ces valeurs et rejouer les bonus d'historique et
les améliorations de caractéristiques, mais aucun nouveau tirage n'est permis.

### DR-B03-04 — Conservation exhaustive de l'état d'aventure

**Résolue le 20 août 2026 :** possessions, monnaie, objets portés, conteneurs,
harmonisation, PV temporaires, inspiration, concentration, conditions, épuisement et
état relatif à la mort sont conservés. Dés de vie, emplacements d'Incantation,
emplacements de pacte et ressources de classe sont remplacés par les pools du nouveau
build, qui commencent pleins. Les PV actuels suivent séparément B03-RSP-013.

### DR-B03-05 — Ordre des arrondis du niveau effectif d'incantation

**Résolue le 20 août 2026 :** chaque classe fractionnaire est arrondie séparément avant
l'addition : `ceil(Paladin/2) + ceil(Rôdeur/2) + floor(Chevalier occulte/3) +
floor(Arnaqueur arcanique/3)`. Aucun regroupement préalable par catégorie n'est permis.
Les cas discriminants retenus sont Paladin 1/Rôdeur 1 et Chevalier occulte 4/Arnaqueur
arcanique 5.

## Vérification du bloc

Le bloc est validé le 20 août 2026 :

- les 79 règles ont une source, une cible, un état actuel et des critères
  d'acceptation ;
- les cinq décisions du bloc sont résolues et intégrées ;
- le propriétaire a validé explicitement les recommandations `DR-B03-01` à
  `DR-B03-05` ;
- `REQUIREMENTS.md`, `DEC-003`, `GAP-ANALYSIS.md`, `TRACEABILITY.md` et le plan de
  conformité sont synchronisés ;
- aucun code, test, seed, migration, dépendance ou CI n'a été modifié.

Cette validation clôt la spécification B03. Elle ne signifie pas que les écarts
répertoriés sont implémentés ou vérifiés par des tests.
