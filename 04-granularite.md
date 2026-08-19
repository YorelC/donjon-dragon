# Doctrine de granularité — la chaîne de traçabilité

Objectif : découper le travail assez finement pour que chaque étape soit explicite,
testable et exécutable sans interprétation implicite.

## 1. La chaîne

```text
Décision produit
  ↓
Exigence atomique : un comportement observable
  ↓
Invariant de contrat : schéma Zod ou port du domaine
  ↓
Étape du plan : un fichier et une action
  ↓
Tâche d'implémentation
  ↓
Test portant le comportement attendu
  ↓
Commit : type(scope): sujet
```

Le revieweur vérifie la chaîne par son contenu : toute exigence doit être couverte par
un test pertinent et toute modification de code doit répondre à une exigence ou à une
correction explicitement demandée.

Les anciens identifiants de tickets et d'unités atomiques peuvent subsister dans
l'historique. Ils ne sont plus exigés et ne doivent pas être ajoutés aux nouveaux
documents, tests ou commits.

## 2. L'exigence atomique

Une exigence est correctement découpée si elle respecte ces cinq critères :

1. **Un seul comportement observable** — si la phrase contient plusieurs résultats
   indépendants, elle est découpée.
2. **Formulation mesurable** — « Quand <déclencheur>, si <condition>, le système doit
   <réponse mesurable> ».
3. **Valeurs explicites** — les entrées, sorties et erreurs attendues sont précisées.
4. **Testable sans interprétation** — le test peut être écrit sans décision produit
   supplémentaire.
5. **Dépendances déclarées** — les prérequis entre exigences sont écrits en toutes
   lettres.

Exemple :

```markdown
### Rejet d'un jet à zéro dé

Quand un joueur soumet un jet dont le nombre de dés est inférieur à 1, le système doit
rejeter la commande avec l'erreur `DICE_COUNT_INVALID` sans émettre d'événement.

| Entrée | Sortie |
|---|---|
| `0d6` | erreur `DICE_COUNT_INVALID` |
| `-1d6` | erreur `DICE_COUNT_INVALID` |
| `1d6` | jet accepté |
```

## 3. Limites de découpage

| Objet | Limite | Si dépassée |
|---|---|---|
| Spécification | Une capacité utilisateur cohérente | Scinder en plusieurs documents reliés |
| Exigence | Un comportement observable | Découper les résultats indépendants |
| Tâche de code | Petit ensemble cohérent, diff attendu d'environ 80 lignes, une seule couche hexagonale | Redécouper la tâche |
| Tâche de test | Comportements d'une seule tâche de code | Redécouper la tâche |
| Étape de plan | Un fichier et une action | Redécouper le plan |

Un agent bloque une tâche ambiguë, trop large ou couvrant plusieurs couches avec le
motif `dependency: tâche à redécouper — <motif>`. Refuser une tâche mal découpée est un
résultat valide.

## 4. Le filet d'intégration

Chaque fonctionnalité se termine par une tâche d'intégration qui vérifie les parcours
de bout en bout à travers les couches concernées. La revue finale dépend de cette
validation afin d'éviter que des composants corrects isolément produisent un ensemble
incorrect.

## 5. Coût assumé de la granularité

Un découpage fin augmente le nombre de passages et de transmissions, mais réduit les
erreurs d'interprétation. Les calculs D&D non triviaux, les problèmes de concurrence et
les protocoles temps réel restent confiés aux agents capables de traiter ces risques.
Si une fonctionnalité exige trop de tâches, elle doit être scindée en plusieurs
fonctionnalités cohérentes.
