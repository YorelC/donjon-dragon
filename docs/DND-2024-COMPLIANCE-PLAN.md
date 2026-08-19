# Plan de conformité fonctionnelle D&D 2024

## Statut et objectif

Ce document organise la suite de la Phase 4 : transformer l'exigence « respecter
toutes les règles D&D 5e 2024 de création, progression et combat » en exigences
atomiques, vérifiables et traçables.

Il sert de point d'entrée aux tâches Codex ou Claude Code consacrées à la
spécification des règles. Il ne constitue ni un plan d'implémentation ni une
autorisation de modifier le code.

## Pourquoi travailler dans des tâches séparées

La matrice complète couvre plusieurs centaines de règles, exceptions et contenus. Une
tâche distincte par bloc permet de :

- limiter le contexte chargé par l'agent ;
- approfondir un domaine sans mélanger création, progression et combat ;
- faire valider chaque bloc avant de passer au suivant ;
- conserver des critères d'acceptation suffisamment précis pour les futurs tests ;
- éviter qu'une décision prise dans un bloc modifie silencieusement un autre bloc.

Une tâche ne traite qu'un bloc. Un nouveau bloc ne commence que lorsque le précédent
est validé ou que ses décisions restantes sont explicitement différées.

## Sources et hiérarchie

Chaque tâche lit dans cet ordre :

1. [`README.md`](README.md), [`PRODUCT.md`](PRODUCT.md) et
   [`REQUIREMENTS.md`](REQUIREMENTS.md) ;
2. les décisions applicables dans [`DECISIONS/`](DECISIONS/) ;
3. le présent plan et les matrices déjà validées ;
4. les trois livres de base 2024 et données fournis par le propriétaire ;
5. [`CURRENT-STATE.md`](CURRENT-STATE.md), le code et les tests, uniquement pour
   décrire l'état actuel ;
6. les transcripts de [`HISTORY/`](HISTORY/) seulement pour vérifier la provenance ou
   résoudre une contradiction documentaire.

Le code, les tests, les JSON extraits et le SRD ne deviennent jamais la cible du seul
fait qu'ils existent. Une donnée absente ou contradictoire est signalée ; elle n'est
pas reconstituée par supposition.

## Méthode commune à chaque bloc

Pour chaque règle ou famille indissociable, la matrice contient :

| Champ | Contenu attendu |
|---|---|
| ID | Identifiant stable propre au bloc |
| Source | Livre, section, donnée fournie ou décision produit |
| Cible | Comportement normatif attendu |
| État actuel | Comportement vérifié dans le repository |
| Qualification | Conforme, partiel, manquant, ambigu, dette ou obsolète |
| Acteurs et permissions | Joueur, MJ, propriétaire ou système |
| Données | Entrées, état produit et informations persistées |
| Critères d'acceptation | Cas nominal, refus, limites et exceptions testables |
| Décisions | Décision validée ou `DÉCISION REQUISE` |
| Traçabilité | Futurs tickets, code et tests associés |

La tâche suit ensuite cette séquence :

1. inventorier les règles du bloc ;
2. comparer l'intention, la cible documentée et le code existant ;
3. présenter les écarts et décisions au propriétaire ;
4. intégrer les réponses dans la matrice ;
5. faire valider le bloc ;
6. mettre à jour les exigences, décisions, écarts et la traçabilité concernés ;
7. s'arrêter avant toute planification ou implémentation.

## Découpage des blocs

| Bloc | Sujet | Résultat attendu |
|---|---|---|
| B01 | Création complète d'un personnage niveau 1 | Chaque combinaison et choix de création est représentable et validable |
| B02 | Progression niveaux 2 à 20 | Chaque gain de niveau, sous-classe, don et choix de classe est spécifié |
| B03 | Multiclassage et respécialisation | Prérequis, cumuls, remplacements et conservation d'état sont déterministes |
| B04 | Fiche et état d'aventure | Valeurs dérivées et états mutables ont une source et un cycle de vie précis |
| B05 | Moteur de combat commun | Initiative, tours, actions, mouvement, réactions, dégâts, mort et états sont couverts |
| B06 | Sorts et effets magiques | Chaque sort et exception exploitable possède une représentation testable |
| B07 | Équipement, objets et maîtrises | Armes, armures, outils, propriétés, charges et objets personnalisés sont couverts |
| B08 | Monstres, PNJ et créatures invoquées | Profils, actions, ressources, renforts et contrôle sont couverts |
| B09 | Règles produit autour de la partie | Validation MJ, repos collectif, butin, investigation et corrections sont reliés aux règles D&D |

Les blocs sont fonctionnels. Les choix de schéma MongoDB, API, Socket.IO ou stockage
appartiennent à la Phase 5 et ne doivent pas être décidés ici.

## B01 — Création complète niveau 1

### Périmètre

Le bloc couvre :

- identité, alignement et données physiques ;
- dix espèces du Player's Handbook 2024, lignées et choix de taille ;
- douze classes et tous leurs choix de niveau 1 ;
- seize historiques ;
- caractéristiques et bonus d'historique ;
- compétences, expertise, langues, outils et maîtrises d'armes ;
- dons d'origine et dons de Style de combat accessibles au niveau 1 ;
- Manifestation occulte de l'Occultiste ;
- sorts mineurs, sorts préparés, sorts connus et grimoire du Magicien ;
- paquetages, or, équipement porté et babiole facultative ;
- portrait, soumission et validation par le MJ ;
- calcul de la fiche initiale et justification des valeurs dérivées.

### Écarts déjà identifiés à reprendre

La tâche B01 doit vérifier et intégrer au minimum les constats suivants :

- le référentiel contient neuf espèces et ne contient pas l'Aasimar ;
- le dataset contient 390 sorts alors que l'inventaire PHB en annonce 391 ;
- la sélection des deux langues standards manque ;
- le choix de catégorie de taille n'est pas persisté ;
- plusieurs choix d'outils, de maîtrises d'armes et de dons sont absents ;
- la Manifestation occulte de niveau 1 n'est pas choisie ;
- le grimoire initial du Magicien n'est pas distingué des sorts préparés ;
- l'Expertise du Roublard est limitée à un sous-ensemble de ses maîtrises ;
- plusieurs contraintes visibles dans l'interface ne sont pas validées au backend ;
- le backend ne prouve pas que l'équipement envoyé correspond aux options choisies ;
- l'identité étendue, l'alignement, le portrait et le workflow de validation MJ sont
  absents ou incomplets.

Ces constats sont des points de départ, pas une matrice exhaustive.

### Décisions déjà applicables

- l'alignement est obligatoire et immuable après validation ;
- l'âge est un entier positif sans limite d'espèce automatisée ; le MJ valide sa
  cohérence ;
- la taille physique est saisie en centimètres et le poids en kilogrammes ;
- la catégorie de taille D&D est distincte et limitée aux options de l'espèce ;
- la description physique est facultative ;
- une babiole de départ est facultative ;
- chaque babiole possède une valeur ; sa sélection soustrait automatiquement cette
  valeur à l'or de départ ;
- aucun catalogue d'achat d'équipement n'est proposé pendant la création ;
- aucun autre achat d'équipement n'est permis pendant la création.

### Livrable prévu

Le bloc validé sera écrit dans :

`docs/rules/dnd-2024/B01-LEVEL-ONE-CREATION.md`

Les exigences transverses resteront dans `REQUIREMENTS.md` et seront liées, pas
dupliquées.

## Blocs suivants

### B02 — Progression niveaux 2 à 20

Progression de chaque classe, sous-classes, dons, améliorations de caractéristiques,
sorts, ressources, remplacement des choix, déverrouillage MJ et absence de repos ou de
soin implicite.

### B03 — Multiclassage et respécialisation

Prérequis, niveau total, dés de vie, maîtrises acquises, emplacements multiclasses,
capacités non cumulables, reconstruction complète et règles de conservation de l'état.

### B04 — Fiche et état d'aventure

PV, PV temporaires, dés de vie, ressources, inspiration, conditions, épuisement,
concentration, harmonisation, inventaire, monnaie, mort et corrections du MJ.

### B05 — Moteur de combat commun

Préparation, initiative, tours, économie d'actions, mouvement continu en mètres,
obstacles, visibilité, couverture, ciblage, attaques, sauvegardes, dégâts, soins,
réactions, interruptions, états, renforts et persistance.

### B06 — Sorts et effets magiques

Inventaire des sorts, listes, préparation, composants, portée, zones, concentration,
rituels, surclassement, durée, dissipation, invocations et exceptions de géométrie.

### B07 — Équipement, objets et maîtrises

Armes, armures, boucliers, outils, paquets, propriétés, bottes d'armes, consommables,
charges, harmonisation, port, contenance et objets personnalisés versionnés.

### B08 — Monstres, PNJ et créatures invoquées

Profils, actions, réactions, capacités, ressources, rechargements, contrôle MJ,
invocations, entrée en combat, visibilité cachée et calcul des récompenses.

### B09 — Règles produit autour de la partie

Validation de fiche, jets libres, repos collectif, butin concurrent, investigation
privée, réserve MJ, corrections compensatoires et audit fonctionnel.

## Définition de terminé d'un bloc

Un bloc est terminé lorsque :

- son inventaire de règles est explicite et sa source est identifiable ;
- chaque ligne possède un comportement cible et un critère d'acceptation ;
- chaque écart avec le code est qualifié sans avoir été corrigé ;
- chaque information manquante est marquée `DÉCISION REQUISE` ou donnée requise ;
- les décisions du propriétaire sont intégrées dans les documents normatifs ;
- le propriétaire valide explicitement le bloc ;
- aucun code, test, dépendance, seed, migration ou CI n'a été modifié.

## Brief de démarrage pour la tâche B01

Le message suivant peut être utilisé dans une nouvelle tâche Codex :

> Travaille exclusivement sur le bloc B01 — création complète d'un personnage niveau
> 1 — défini dans `docs/DND-2024-COMPLIANCE-PLAN.md`. Lis d'abord `AGENTS.md`, `MODE`,
> `docs/README.md`, `docs/PRODUCT.md`, `docs/REQUIREMENTS.md`, `docs/DECISIONS/`,
> `docs/CURRENT-STATE.md`, `docs/GAP-ANALYSIS.md` et `docs/TRACEABILITY.md`.
> Construis progressivement la matrice fonctionnelle règle par règle en distinguant
> intention, cible et code existant. Inspecte le repository en lecture seule. Ne
> modifie aucun code et ne passe pas à la Phase 5. Présente les décisions requises au
> propriétaire avant de considérer le bloc comme validé.
