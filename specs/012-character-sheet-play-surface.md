# Spec 012 — La fiche de personnage, support de jeu

## Statut

**SPEC — non validée.** Elle fixe l'organisation de l'écran de fiche d'un personnage
actif : ce que chaque zone montre, où chaque information vit une seule fois, et ce que
le joueur pourra y faire quand l'état d'aventure existera. Les règles de jeu restent
celles de B04 et B07 : cette spec ne les redéfinit pas, elle les place à l'écran.
Conformément à `docs/README.md`, l'ordre reste `SPEC → PLAN → CODE → TEST → REVIEW`.

## Références normatives

- `SF-002`, section « État d'aventure » (`docs/REQUIREMENTS.md`) : la fiche persistée
  porte PV actuels, maximaux et temporaires, dés de vie, emplacements utilisés,
  ressources, inspiration, conditions, inventaire, équipement porté et monnaie ;
- `SF-002`, section « Équipement, possessions et objets magiques » : le joueur assigné
  peut organiser, équiper, utiliser et déposer ses possessions ;
- `SF-002`, préparation des sorts (`DEC-011`) : changement après un repos long achevé ;
- `SF-005` et `DEC-005` : tests lancés depuis la fiche, bonus ajouté automatiquement,
  jet fait par le serveur ;
- `B04-CHARACTER-SHEET-AND-ADVENTURE-STATE.md` : valeurs courantes et maxima
  (`B04-FIC-002`), provenance d'un sort (`B04-FIC-006`), recalcul des dérivés
  (`B04-FIC-005`), dés de vie (`B04-VIE-008/009`), inspiration héroïque
  (`B04-RES-006` à `009`). B04 exclut explicitement tout écran (« Limites entre
  blocs ») : c'est l'objet de cette spec ;
- `B07-EQUIPMENT-ITEMS-AND-PROFICIENCIES.md` : catalogue, port, consommables ;
- `DEC-009` : état d'aventure et corrections du MJ.

## Périmètre

La fiche d'un personnage joueur, telle que son joueur assigné et les MJ la lisent hors
combat. Le combat réutilise ces zones mais son écran propre (carte + fiche) relève de
`SF-004` : voir `DR-012-03`.

## Hors périmètre volontaire

- les règles de calcul (B01 à B07) et la persistance de l'état d'aventure ;
- la projection publique d'un allié en combat (`B04-FIC-011`) ;
- la montée de niveau et la respécialisation (B02, B03).

## Principe : une information, une place

Chaque information apparaît à un seul endroit. Un doublon est une dette d'affichage :
la seconde copie finit par diverger ou par brouiller la lecture.

| Information | Place unique |
|---|---|
| Langues | Identité |
| Signalement (taille, poids, âge) | Identité |
| Emplacements de sorts | Grimoire, en tête de chaque cercle |
| Caractéristique, DD et attaque d'une source de sorts | Grimoire, en en-tête de cette source |
| Armure et bouclier portés | Barda, marqués comme portés |
| Ressources de classe | Aptitudes, sur la ligne de la capacité qui les dépense |

## Cible par zone

### Cadre de l'écran

La fiche prend toute la largeur, sans la barre latérale de la campagne : un lien de
retour « Personnages », dans l'en-tête, suffit à s'orienter. Le panneau garde le cadre doré à
équerres des autres écrans.

### En-tête — ce qu'on consulte à chaque tour

- blason, nom, classe ; espèce, niveau, taille, alignement, historique ;
- **jauge de points de vie** : PV actuels / maximaux, barre, PV temporaires, et les
  pas de dégâts et de soin (−5, −1, +1, +5) (`B04-FIC-002`) ;
- CA, initiative, vitesse, bonus de maîtrise ;
- dés de vie disponibles / total et leur type (`B04-VIE-008`) ;
- Inspiration héroïque, binaire (`B04-RES-006`).

Aucune langue, aucun signalement. Un « dernier jet » y prendra place quand les tests
lancés depuis la fiche existeront (`SF-005`).

Tant que l'état d'aventure n'est pas persisté, l'en-tête s'affiche en lecture
seule : PV actuels égaux au maximum, aucun PV temporaire, tous les dés de vie
disponibles, inspiration éteinte. Les contrôles sont visibles et désactivés.

### Bloc des jets

Un seul bloc, assez large pour se lire sans serrer :

- les six caractéristiques en cartes, deux par ligne : nom en entier et score à
  gauche, modificateur en grand, sauvegarde et sa maîtrise dans une case à part ;
- dessous, les 18 compétences sur deux colonnes de neuf, lues de haut en bas dans
  l'ordre alphabétique français.

Chaque caractéristique, sauvegarde et compétence deviendra la cible d'un test lancé
depuis la fiche (`SF-005`).

### Hauteur et défilement

Sur un écran d'ordinateur, la fiche tient dans la hauteur de la fenêtre : la page ne
défile pas. Seul le contenu des onglets défile, et quand liste et détail sont côte à
côte, chacun défile de son côté : la fiche d'un sort reste sous les yeux pendant qu'on
parcourt la liste. Le lien de retour vit dans l'en-tête pour économiser une ligne. Sur
un écran étroit, les blocs s'empilent et la page défile normalement.

### Armes

- toutes les armes équipées, avec attaque, dégâts, portée et botte ;
- **la Frappe à mains nues, toujours présente, en tête** : maîtrisée, attaque au
  modificateur de Force, dégâts `1 + Force` contondants. Un effet qui la remplace
  (Arts martiaux du Moine, style Combat à mains nues, don Bagarreur) fixe le dé, et
  Arts martiaux autorise la Dextérité : la meilleure des deux est retenue.

Équiper ou déséquiper une arme dans le Barda recalcule cette liste (`B04-FIC-005`).

### Aptitudes

- les capacités de classe, d'espèce, d'historique et de dons ; au survol, le panneau
  de droite dit **ce que fait la capacité** (texte de règle), son mode (Action,
  Réaction, Passif…) et, si elle s'épuise, combien de fois et quel repos la recharge ;
- une capacité qui s'épuise ne s'affiche **qu'une fois** : sa propre ligne porte son
  emblème, ses pastilles disponibles / max et le repos qui la recharge (B04-RES).
  Pas de bandeau séparé qui répéterait la ligne. Les ressources propres à une
  sous-classe (manœuvres du Maître de guerre, par exemple) suivront la même règle.

Icônes, choisies par clé de ressource :

| Ressource | Icône |
|---|---|
| Inspiration bardique (`bardicInspiration`) | lyre verte |
| Second souffle et ressources du Guerrier (`secondWind`, manœuvres) | épée jaune |
| Rage (`rageUses`) | hache rouge |
| toute autre ressource | losange de la charte |

### Grimoire

- une section par **source** de sorts (classe, don, espèce, invocation). Chaque
  en-tête porte sa caractéristique d'incantation, son DD et son bonus d'attaque. Deux
  sources à la même caractéristique restent deux sections : la provenance est une
  règle (`B04-FIC-006`), pas un détail ;
- sous chaque source, les cercles de sorts, repliables, avec leurs emplacements ;
- la colonne de droite montre la **fiche complète d'un sort** : niveau, école, temps
  d'incantation, portée, composantes (V, S, M et matériel), durée, concentration,
  rituel, description ;
- le survol d'un sort l'affiche ; un clic l'épingle. Le sort épinglé reste affiché
  quand la souris quitte la liste ; survoler un autre sort l'affiche à sa place le
  temps du survol ;
- avec l'état d'aventure : emplacements cochables, et préparation des sorts ouverte
  après un repos long achevé (`DEC-011`).

### Barda

- **une liste unique**, groupée par catégorie d'objet : Armes, Armures, Outils,
  Matériel ;
- losange plein ◆ : l'objet est équipé ou porté ; losange vide ◇ : il est seulement
  transporté. Un objet n'apparaît qu'une fois ;
- l'armure portée garde la mention de son désavantage de Discrétion ;
- la colonne de droite montre la **fiche de l'objet** telle que le catalogue la
  décrit : poids, prix, dégâts, portée, propriétés et botte d'une arme, classe
  d'armure, Force requise et Discrétion d'une armure, texte d'usage. Survol et
  épinglage comme au Grimoire. Un objet choisi à la création hors catalogue
  (colifichet, outil) le dit ;
- avec l'état d'aventure : cliquer le losange équipe ou déséquipe, la CA et les armes
  se recalculent ; « −1 » consomme un consommable ; la bourse suit les cinq
  dénominations (`DR-B04-01`).

### Identité

Apparence, signalement, langues et maîtrises, sens, historique, puis traits de
personnalité, idéal, lien et défaut quand l'API les exposera.

## Les décisions requises

Les `RECOMMANDATION` sont des propositions : elles ne valent pas décision.

### DR-012-01 — Reconnaître un consommable

`ITEM_TYPES` (`shared/src/item-schema.ts`) vaut `weapon`, `armor`, `gear`, `pack`,
`tool` : rien ne distingue une potion d'une corde, alors que le Barda doit offrir
« −1 » sur les seuls consommables.

**Options.**

1. **Nouveau type `consumable`.** Simple à filtrer. En contrepartie, un objet ne peut
   être que d'un type : une munition est-elle `weapon` ou `consumable` ? Le catalogue
   existant doit être migré.
2. **Drapeau `consumable` sur l'objet.** Orthogonal au type, sans ambiguïté pour les
   munitions. Demande une migration du catalogue et une saisie pour les objets
   personnalisés.
3. **Dériver de B07** (charges, usage unique). Aucune saisie, mais la règle doit être
   écrite pour chaque famille d'objet.

**RECOMMANDATION.** Option 2.

### DR-012-02 — Modèle du port d'armes

Aujourd'hui seuls l'armure et le bouclier sont « portés » ; toutes les armes
possédées sont listées comme attaques.

**Options.**

1. **Drapeau `équipé` par exemplaire.** Simple, suffit à filtrer l'onglet Armes. Ne
   contrôle pas qu'on tienne trois armes à deux mains.
2. **Mains et emplacements** (main principale, main secondaire, deux mains). Contrôle
   la cohérence avec le bouclier et les armes à deux mains. Plus d'écran et plus de
   règles, et le coût d'action pour dégainer relève de B05.

**RECOMMANDATION.** Option 1 au MVP, l'option 2 attendant B05.

### DR-012-03 — La fiche pendant un combat

La carte de combat occupe l'écran. La fiche doit rester accessible pour jouer.

**Options.**

1. **Fiche réduite en panneau latéral** : zone vitale, armes, emplacements et
   ressources ; le reste à la demande.
2. **Onglet ou tiroir plein écran** au-dessus de la carte.

À trancher avec l'écran de `SF-004`.

### DR-012-04 — Ordre de livraison de l'état d'aventure

Chaque tranche implique la persistance, et donc une possible transaction MongoDB, qui
est une décision de Charly.

**RECOMMANDATION.** PV actuels et temporaires, dés de vie, inspiration ; puis
emplacements et repos ; puis équiper / déséquiper ; puis consommables et bourse ;
puis ressources de classe ; puis tests lancés depuis la fiche.

## Critères d'acceptation

- aucune information du tableau « une information, une place » n'apparaît deux fois ;
- chaque section du grimoire nomme sa source et porte sa caractéristique, son DD et
  son attaque ;
- un sort survolé s'affiche en fiche complète ; un sort cliqué reste affiché après le
  départ de la souris ;
- l'armure portée apparaît une seule fois dans le Barda, marquée ◆ ;
- la Frappe à mains nues figure dans l'onglet Armes de tout personnage ; celle d'un
  Moine utilise la meilleure de Force et Dextérité et le dé d'Arts martiaux ;
- les ressources d'un Barde, d'un Guerrier et d'un Barbare portent leur icône, sur la
  ligne de leur capacité, sans doublon ;
- toute capacité survolée affiche son texte de règle ;
- avant l'état d'aventure, tout contrôle de jeu est visible et désactivé.
