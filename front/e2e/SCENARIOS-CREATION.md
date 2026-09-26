# Scénarios de création de personnage

Catalogue des parcours qui protègent la création niveau 1 contre les régressions.
✅ écrit et vert · 🚫 bloqué par un manque produit · ⏸️ en attente d'un autre chantier ·
⬜ à écrire.

Fichiers : `character-creation`, `character-proficiencies`, `character-spells`,
`character-classes` et `character-rules.spec.ts`.

## Deux étages, pas un

| Étage | Ce qu'il prouve | Coût | Où |
|---|---|---|---|
| **Combinatoire** (vitest, domaine back) | Chaque combinaison de référence est *acceptée* par le moteur de règles. | ~1 ms par cas | `back/.../level-one-combinations.test.ts` |
| **Parcours** (Playwright) | Un joueur *arrive au bout* à l'écran, et le serveur accepte ce que le wizard émet. | ~5 s par cas | `front/e2e/character-*.spec.ts` |

Tester toutes les combinaisons espèce × classe × historique dans le navigateur, soit
10 × 12 × 16 = 1 920 parcours, prendrait près de 3 heures par passage. La combinatoire
va donc au domaine, où elle coûte quelques secondes. Playwright garde une sélection de
parcours choisis pour les **mécanismes** qu'ils traversent, pas pour leur variété.

### Combinatoire (domaine)

- ✅ 120 combinaisons espèce × classe, historique Fermier fixe.
- ✅ **192 combinaisons historique × classe**, Nain fixe : les trois Initiés à liste
  imposée (Acolyte, Guide, Sage), les dons Doué, Musicien et Façonneur, et les outils
  d'historique face aux outils de classe. Elles ont révélé le refus des outils reçus
  deux fois d'office (Roublard Criminel, Druide Ermite), corrigé.
- ✅ **Humain + Initié à la magie** face à l'Acolyte, au Guide et au Sage, pour chaque
  classe : deux occurrences distinctes, aucun sort commun.

La création valide générique vit dans `back/.../testing/level-one-choices.fixture.ts`.

## Parcours standards — un par classe

Chaque ligne associe une classe à une espèce et un historique choisis pour ce qu'ils
ajoutent au parcours.

| # | Classe | Espèce | Historique | Mécanismes traversés | État |
|---|---|---|---|---|---|
| 1 | Barbare | Goliath (ascendance) | Soldat | Ascendance sans sort, 2 maîtrises d'armes, aucune étape de sorts | ✅ |
| 2 | Barde | Nain | Soldat | Instruments de classe (3), 2 mineurs + 4 sorts | ✅ |
| 2b | Barde | Nain | Artiste | Instrument d'historique exclu des instruments de classe, don Musicien | 🚫 B01-ORI-006 |
| 3 | Clerc | Nain | Fermier | Ordre divin, 3 mineurs + 4 sorts, cycle MJ complet | ✅ |
| 4 | Clerc | Nain | Acolyte | Ordre Thaumaturge (+1 mineur), Initié à la liste de Clerc cochée d'office | ✅ |
| 5 | Druide | Elfe des bois | Guide | Compétence d'espèce, Druidisme accordé exclu de la classe et d'Initié | ✅ |
| 6 | Guerrier | Humain | Soldat | Compétence d'espèce, don Doué, Style de combat, 3 maîtrises d'armes | ✅ |
| 7 | Moine | Orc | Ermite | Un outil de classe, aucune étape de sorts | ✅ |
| 7b | Moine | Orc | Artisan | Outil d'artisan de classe face à celui d'historique | 🚫 B01-ORI-006 |
| 8 | Paladin | Drakéide | Noble | Ascendance draconique, Doué d'historique, sorts préparés sans mineur | ✅ |
| 9 | Rôdeur | Gnome des forêts | Guide | Marque du chasseur et Communication avec les animaux accordés, donc jamais proposés | ✅ |
| 10 | Roublard | Nain | Voyageur | Expertise sur une compétence d'historique, langue de classe, objet concret | ✅ |
| 11 | Ensorceleur | Tieffelin abyssal | Charlatan | Bouffée de poison d'héritage exclue des mineurs de classe | ✅ |
| 12 | Occultiste | Humain + Initié | Sage | Deux Initiés, Pacte du grimoire : un mineur du grimoire exclu partout ailleurs | ✅ |
| 13 | Magicien | Nain | Sage | Grimoire seul (DR-B01-05), liste imposée cochée d'office | ✅ |

Les étapes qu'un parcours ne vise pas sont franchies par `pages/builder-autopilot.ts`,
qui prend les premières options libres. Initié à la magie, le don de l'Humain et la
Manifestation occulte ne sont jamais laissés au pilote.

Chaque parcours va jusqu'à la fiche persistée. Les PV affichés prouvent que le serveur
a validé la composition.

## Logique métier à conserver

Des règles transverses, dont chacune a déjà cassé ou risque de casser en silence.

### Sorts

- ✅ Le Magicien ne remplit que son grimoire ; Suivant se débloque à 6 sorts, pas avant.
- ✅ Un sort mineur pris par la classe devient indisponible pour Initié à la magie, et inversement.
- ✅ Un sort inscrit au grimoire devient indisponible pour le sort de niveau 1 d'Initié.
- ✅ Un sort accordé par l'espèce (Lumière de l'Aasimar) n'est proposé nulle part.
- ✅ Deux Initiés à la magie (Humain Clerc Acolyte, même liste) : aucun sort mineur commun.
- ✅ Un mineur pris par le Pacte du grimoire est exclu de la classe et d'Initié (parcours Occultiste).
- 🚫 La fiche affiche chaque sort accordé avec **sa** caractéristique : Lumière de
  l'Aasimar sort en Intelligence au lieu du Charisme. Bug connu, tâche séparée ; le test
  s'écrira avec le correctif.

### Transitions (changer d'avis en cours de route)

- ✅ Changer de classe efface les sorts de classe et garde ceux d'Initié à la magie.
- ✅ Passer de Sage à Guide remplace la liste imposée et vide les sorts d'Initié.
- ✅ Passer d'Aasimar à Nain rend Lumière de nouveau disponible.
- ✅ Une compétence d'historique ne se reprend pas en compétence de classe.

### Caractéristiques

- ✅ Bonus d'historique limités à ses trois caractéristiques.
- ⏸️ Achat de points (27 points, bornes 8 à 15), tirage 4d6, plafond final de 20 et
  saisie manuelle MJ (B01-CAR-005) : en attente du commit du chantier « saisie
  manuelle », qui modifie justement cette étape.

### Persistance et cycle de vie

- ✅ Réouverture d'un brouillon : langues et état civil conservés.
- ✅ Réouverture d'un Magicien Sage : grimoire, sorts d'Initié et liste imposée conservés.
- ✅ Taille Petite déduite de la stature, gabarit jamais demandé.
- ✅ Soumission, refus motivé, correction, acceptation.

## Bloqué : B01-ORI-006

Le serveur exige les trois outils du don Façonneur (Artisan) et les trois instruments
du don Musicien (Artiste), mais aucune étape du wizard ne les fait choisir. **Aucun
Artisan ni Artiste ne peut être créé.** Les parcours marqués 🚫 attendent ce choix ; le
test `désactive l instrument de l Artiste…` est en `test.fixme`.

## Dette réglée

Les trois tests qui échouaient étaient périmés, sans régression produit :
bouton « Enregistrer les modifications » en réouverture, bonus du Voyageur hors de ses
trois caractéristiques, stature hors des bornes du Nain, alignement « Neutre » ambigu.

Plus grave : la fin des parcours attendait un titre au nom du personnage, que l'aperçu
affiche **avant** tout enregistrement. Un parcours pouvait donc passer alors que le
serveur refusait la création : c'était le cas du Roublard Voyageur (outils de voleur
reçus deux fois d'office, corrigé au back). `finishCreation()` attend désormais la
redirection vers la fiche, et `saveChanges()` le retour à la liste.
