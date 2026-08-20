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
| B07 | Équipement, objets, maîtrises et bottes d'armes | Armes, armures, outils, propriétés, charges et objets personnalisés sont couverts |
| B08 | Monstres, PNJ et créatures invoquées | Profils, actions, ressources, renforts et contrôle sont couverts |
| B09 | Règles produit autour de la partie | Validation MJ, repos collectif, butin, investigation et corrections sont reliés aux règles D&D |

Les blocs sont fonctionnels. Les choix de schéma MongoDB, API, Socket.IO ou stockage
appartiennent à la Phase 5 et ne doivent pas être décidés ici.

## B01 — Création complète niveau 1

### Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 85 règles et les
écarts d'implémentation sont inventoriés dans le livrable B01. Aucun passage à la
planification ou au code n'est inclus dans cette validation.

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
- le dataset contient 390 sorts ; le contrôle du PHB p. 331 identifie Télépathie
  (`telepathy`) comme seule entrée absente ;
- la sélection des deux langues standards manque ;
- le choix de catégorie de taille de l'Aasimar, de l'Humain et du Tieffelin n'est pas
  persisté ; les données fixent notamment à tort l'Humain et le Tieffelin à M ;
- certaines données d'espèce sont incorrectes ou non structurées : durée de création
  de l'appareil du Gnome des roches et traits du Halfelin ; l'écart initialement
  attribué à Forte carrure du Goliath est annulé par l'errata officiel, qui impose un
  test de caractéristique ;
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
- les cent babioles du PHB sont gratuites ; leur sélection ne modifie pas l'or de
  départ ;
- aucun catalogue d'achat d'équipement n'est proposé pendant la création ;
- aucun autre achat d'équipement n'est permis pendant la création.

### Livrable validé

Le bloc validé est écrit dans :

`docs/rules/dnd-2024/B01-LEVEL-ONE-CREATION.md`

Les exigences transverses restent dans `REQUIREMENTS.md` et sont liées, pas dupliquées.

## B02 — Progression niveaux 2 à 20

### Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 82 règles et les
écarts d'implémentation sont inventoriés dans le livrable B02. Aucun passage à la
planification ou au code n'est inclus dans cette validation.

### Périmètre

Le bloc couvre la progression mono-classe de chaque classe, les 48 sous-classes, les
dons, les améliorations de caractéristiques, les sorts, les ressources, le remplacement
des choix, le déverrouillage individuel ou groupé par le MJ et l'absence de repos ou de
soin implicite. Le multiclassage et la respécialisation sont couverts par B03.

### Livrable validé

Le bloc validé est écrit dans :

`docs/rules/dnd-2024/B02-LEVELS-TWO-TO-TWENTY.md`

Les exigences transverses restent dans `REQUIREMENTS.md` et sont liées, pas dupliquées.

## B03 — Multiclassage et respécialisation

### Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 79 règles et les
écarts d'implémentation sont inventoriés dans le livrable B03. Les décisions
`DR-B03-01` à `DR-B03-05` sont résolues. Aucun passage à la planification ou au code
n'est inclus dans cette validation.

### Périmètre

Le bloc couvre les prérequis des douze classes, le niveau total et les niveaux de
classe, les PV et dés de vie, les traits reçus à l'entrée, les capacités non cumulables,
les emplacements multiclasses, Magie de pacte et la reconstruction complète. Il fixe
aussi le déverrouillage MJ, la conservation de l'ancienne fiche jusqu'à acceptation,
l'absence de nouveau tirage et la transformation exhaustive de l'état d'aventure.

### Livrable validé

Le bloc validé est écrit dans :

`docs/rules/dnd-2024/B03-MULTICLASSING-AND-RESPECIALIZATION.md`

Les exigences transverses restent dans `REQUIREMENTS.md` et sont liées, pas dupliquées.

## B04 — Fiche et état d'aventure

### Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 91 règles et les
écarts d'implémentation sont inventoriés dans le livrable B04. Les décisions
`DR-B04-01` à `DR-B04-03` sont résolues. Aucun passage à la planification ou au code
n'est inclus dans cette validation.

### Périmètre

Le bloc couvre les valeurs dérivées et courantes de la fiche, les PV, PV temporaires,
dés de vie, repos, mort, ressources, inspiration, concentration, quinze conditions,
épuisement, inventaire actif, cinq monnaies, harmonisation et corrections du MJ. Il
fixe la provenance, les transitions et les invariants de chaque état sans décider de
leur représentation technique.

### Livrable validé

Le bloc validé est écrit dans :

`docs/rules/dnd-2024/B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md`

Les exigences transverses restent dans `REQUIREMENTS.md` et sont liées, pas dupliquées.

## B05 — Moteur de combat commun

### Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 114 règles et les
écarts d'implémentation sont inventoriés dans le livrable B05. Les décisions
`DR-B05-01` à `DR-B05-07` sont résolues. Aucun passage à la planification ou au code
n'est inclus dans cette validation.

### Périmètre

Le bloc couvre préparation, initiative, tours, douze actions communes, économie
d'actions, mouvement continu, empreintes circulaires, altitude numérique, obstacles,
visibilité, couverture, zones, ciblage, attaques, sauvegardes, dégâts, dangers,
Réactions, renforts et persistance. Il fixe aussi la conversion métrique, la mort des
monstres, les fenêtres de Réaction et l'information qualitative des PV ennemis.

### Livrable validé

Le bloc validé est écrit dans :

`docs/rules/dnd-2024/B05-COMMON-COMBAT-ENGINE.md`

Les exigences transverses restent dans `REQUIREMENTS.md` et sont liées, pas dupliquées.

## B06 — Sorts et effets magiques

### Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 82 règles communes,
les 391 profils et les écarts d'implémentation sont inventoriés dans le livrable B06.
Les décisions `DR-B06-01` à `DR-B06-05` sont résolues. Aucun passage à la planification
ou au code n'est inclus dans cette validation.

### Périmètre

Le bloc couvre les 391 sorts, leurs listes et provenances, préparation, emplacements,
rituels, surclassement, économie d'action, composantes, portée, zones, ciblage,
concentration, durées, cumul, dégâts, soins, conditions, invocations, transformations,
téléportations, résurrections, illusions, divinations et effets durables. Il fixe aussi
l'automatisation hybride, le temps fictionnel, les composants matériels et le registre
persistant des effets.

### Livrable validé

Le bloc validé est écrit dans :

`docs/rules/dnd-2024/B06-SPELLS-AND-MAGICAL-EFFECTS.md`

Le registre individuel associé est écrit dans :

`docs/rules/dnd-2024/B06-SPELL-REGISTRY.md`

Les exigences transverses restent dans `REQUIREMENTS.md` et sont liées, pas dupliquées.

## B07 — Équipement, objets, maîtrises et bottes d'armes

### Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 116 règles
communes, les 10 constats d'implémentation et le catalogue magique A–Z sont couverts
par le livrable B07. Les décisions `DR-B07-01` à `DR-B07-05` sont résolues. Aucun
passage à la planification ou au code n'est inclus dans cette validation.

### Périmètre

Le bloc couvre catalogue et exemplaires, possession et transferts consentis, charge
optionnelle, contenants, mains, port, armes, propriétés, maîtrise et bottes d'armes,
armures, boucliers, outils, matériel, consommables, objets de scène, identification,
harmonisation, charges, malédictions, artefacts, objets conscients, profils magiques
A–Z et objets personnalisés versionnés. Il fixe aussi la conversion du poids, les
variantes laissées au MJ et l'absence de boutique ou de fabrication automatisée au
MVP.

### Livrable validé

Le bloc validé est écrit dans :

`docs/rules/dnd-2024/B07-EQUIPMENT-ITEMS-AND-PROFICIENCIES.md`

Les exigences transverses restent dans `REQUIREMENTS.md` et sont liées, pas dupliquées.

## B08 — Monstres, PNJ et créatures invoquées

### Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 91 règles, les 10
constats d'implémentation, 503 profils XMM et 15 profils PHB paramétrés sont couverts.
Les décisions `DR-B08-01` à `DR-B08-05` et `DONNÉE-B08-01` sont résolues dans
`DEC-013`. Aucun passage à la planification ou au code n'est inclus dans cette
validation.

### Périmètre

Le bloc couvre catalogue et provenance, contenu exécutable, instances, cycle de vie,
actions, ressources, recharges, contrôle, PNJ, invocations, compagnons, montures,
préparation, renforts, visibilité, budget de difficulté et préférences de trésor. La
référence XMM est 5e.tools `v2.33.3`, avec priorité aux errata officiels.

### Livrable validé

Le bloc validé est écrit dans :

`docs/rules/dnd-2024/B08-MONSTERS-NPCS-AND-SUMMONED-CREATURES.md`

Le registre individuel associé est écrit dans :

`docs/rules/dnd-2024/B08-CREATURE-PROFILE-REGISTRY.md`

Les exigences transverses restent dans `REQUIREMENTS.md` et sont liées, pas dupliquées.

## B09 — Règles produit autour de la partie

### Statut

**Spécification validée par le propriétaire le 20 août 2026.** Les 90 règles couvrent
validation de fiche, jets libres, repos collectif, butin concurrent, investigation
privée, réserve MJ, corrections compensatoires et audit fonctionnel. Les décisions
`DR-B09-01` à `DR-B09-07` sont résolues dans `DEC-014`. Aucun passage à la
planification ou au code n'est inclus dans cette validation.

### Livrable validé

Le bloc validé est écrit dans :

`docs/rules/dnd-2024/B09-GAME-SURROUNDING-PRODUCT-RULES.md`

Les exigences transverses restent dans `REQUIREMENTS.md` et sont liées, pas dupliquées.

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
