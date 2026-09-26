# Scénarios de création de personnage

Catalogue des parcours qui protègent la création niveau 1 contre les régressions.
**Proposition à valider** : rien n'est écrit au-delà de ce qui est marqué ✅.

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
- ⬜ **192 combinaisons historique × classe**, espèce fixe : couvre les trois Initiés
  à liste imposée (Acolyte, Guide, Sage), les dons Doué, Musicien et Façonneur, et les
  outils d'historique face aux outils de classe.
- ⬜ **Espèce × historique** sur les dons d'origine qui interagissent : Humain et
  Initié à la magie deux fois, en sources distinctes.

## Parcours standards — un par classe

Chaque ligne associe une classe à une espèce et un historique choisis pour ce qu'ils
ajoutent au parcours.

| # | Classe | Espèce | Historique | Mécanismes traversés | État |
|---|---|---|---|---|---|
| 1 | Barbare | Goliath (lignée) | Soldat | Lignée sans sort, maîtrises d'armes, aucun sort | ⬜ |
| 2 | Barde | Halfelin | Artiste | Instruments de classe (3), don Musicien, 2 mineurs + 4 sorts | ⚠️ existe, échoue |
| 3 | Clerc | Nain | Fermier | Ordre divin, 3 mineurs + 4 sorts, cycle MJ complet | ✅ (cycle ⚠️) |
| 4 | Clerc | Nain | Acolyte | Ordre Thaumaturge (+1 mineur), Initié à la liste de Clerc imposée | ⬜ |
| 5 | Druide | Elfe (lignée drow) | Guide | Sort de lignée + sa caractéristique, Initié à la liste de Druide imposée | ⬜ |
| 6 | Guerrier | Humain | Soldat | Compétence d'espèce, don Doué, Style de combat | ⬜ |
| 7 | Moine | Orc | Artisan | Outil d'artisan de classe face à celui d'historique | ⬜ |
| 8 | Paladin | Drakéide | Noble | Ascendance draconique, maîtrises d'armes, sorts préparés | ⬜ |
| 9 | Rôdeur | Gnome (forêt) | Guide | Marque du chasseur accordée d'office, donc jamais proposée | ⬜ |
| 10 | Roublard | Nain | Voyageur | Expertise sur une compétence d'historique, langue de classe, objet concret | ⚠️ existe, échoue |
| 11 | Ensorceleur | Tieffelin | Charlatan | Sort mineur d'héritage accordé d'office | ⬜ |
| 12 | Occultiste | Humain + Initié | Sage | Pacte du grimoire : 3 mineurs et 2 rituels, sans doublon avec classe ni Initié | ⬜ |
| 13 | Magicien | Nain | Sage | Grimoire seul (DR-B01-05), liste imposée cochée d'office | ✅ |

Chaque parcours va jusqu'à la fiche persistée. Les PV affichés prouvent que le serveur
a validé la composition.

## Logique métier à conserver

Des règles transverses, dont chacune a déjà cassé ou risque de casser en silence.

### Sorts

- ✅ Le Magicien ne remplit que son grimoire ; Suivant se débloque à 6 sorts, pas avant.
- ✅ Un sort mineur pris par la classe devient indisponible pour Initié à la magie, et inversement.
- ✅ Un sort inscrit au grimoire devient indisponible pour le sort de niveau 1 d'Initié.
- ✅ Un sort accordé par l'espèce (Lumière de l'Aasimar) n'est proposé nulle part.
- ⬜ Deux Initiés à la magie (Humain Acolyte) : deux listes, deux caractéristiques,
  aucun sort commun.
- ⬜ Le Pacte du grimoire refuse un rituel déjà préparé et un mineur déjà connu.
- ⬜ La fiche affiche chaque sort accordé avec **sa** caractéristique (Lumière de
  l'Aasimar en Charisme : bug connu, tâche ouverte).

### Transitions (changer d'avis en cours de route)

- ⬜ Changer de classe efface les sorts de classe et garde ceux d'Initié à la magie.
- ⬜ Passer de Sage à Guide remplace la liste imposée et vide les sorts d'Initié.
- ⬜ Passer d'Aasimar à Nain rend Lumière de nouveau disponible.
- ✅ Une compétence d'historique ne se reprend pas en compétence de classe.

### Caractéristiques

- ⬜ Achat de points : 27 points, bornes 8 à 15, Suivant bloqué hors budget.
- ⬜ Tirage 4d6 : les six totaux sont exactement ceux affectés.
- ⬜ Bonus d'historique limités à ses trois caractéristiques, plafond final de 20.
- ⬜ Saisie manuelle : proposée au MJ, absente pour un joueur (chantier en cours, B01-CAR-005).

### Persistance et cycle de vie

- ✅ Réouverture d'un brouillon : langues et état civil conservés.
- ⬜ Réouverture d'un Magicien Sage : grimoire, sorts d'Initié et liste imposée conservés.
- ✅ Taille Petite déduite de la stature, gabarit jamais demandé.
- ⚠️ Soumission, refus motivé, correction, acceptation : le test existe mais échoue.

## Dette constatée avant d'étendre

Trois tests existants échouent, sans lien avec les sorts :

1. `character-creation.spec.ts`, cycle MJ : en édition, le bouton s'appelle
   « Enregistrer les modifications » depuis `bf54dc9` (15 août), et le test attend
   « Créer le personnage ».
2. `character-proficiencies.spec.ts`, roublard : la case « Constitution +1 » ne
   devient jamais cliquable à l'étape Caractéristiques.
3. `character-proficiencies.spec.ts`, barde : l'outil de l'Artisan n'apparaît plus
   parmi les outils de classe du barde.

Les réparer d'abord : une suite qui échoue déjà n'alerte plus sur rien.
