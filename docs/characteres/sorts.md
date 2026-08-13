# Sorts D&D 2024 — Spécification

> **Usage :** Référence pour le système de sorts du modèle Character.
> **Source :** [AideDD - Sorts D&D 2024](https://www.aidedd.org/regles-24/sorts/)

## Mécanique d'incantation par classe

| Classe | Caractéristique | Type | Sorts mineurs niv.1 | Sorts préparés niv.1 | Emplacements niv.1 |
|---|---|---|---|---|---|
| Barde | Charisme | Complet | 2 | 4 | 2 |
| Clerc | Sagesse | Complet | 3 | 4 | 2 |
| Druide | Sagesse | Complet | 2 | 4 | 2 |
| Ensorceleur | Charisme | Complet | 4 | 2 | 2 |
| Magicien | Intelligence | Complet | 3 | 4 | 2 |
| Occultiste | Charisme | Pacte | 2 | 2 | 1 |
| Paladin | Charisme | Demi | — | 2 | — (niv.2) |
| Rôdeur | Sagesse | Demi | — | 2 | — (niv.2) |

**Notes :**
- **Lanceur complet** (Barde, Clerc, Druide, Ensorceleur, Magicien) : emplacements niveaux 1-9
- **Demi-lanceur** (Paladin, Rôdeur) : obtient les sorts au niveau 2, emplacements 1-5
- **Magie de pacte** (Occultiste) : 1 emplacement récupéré au repos court, niveau max 5. Arcanum mystique pour 6-9
- **1/3 lanceur** (Chevalier occulte, Arnaqueur arcanique) : non détaillé ici
- **Non-lanceur** : Barbare, Guerrier (sauf Chevalier occulte), Moine, Roublard (sauf Arnaqueur arcanique)

## Listes de sorts

Les sorts de niveau 1 sont spécifiques à chaque classe. La liste complète est disponible sur :
- [AideDD - Liste des sorts D&D 2024](https://www.aidedd.org/regles-24/sorts/)
- [AideDD - Outil de recherche de sorts](https://www.aidedd.org/spells/fr/)

### Sorts mineurs (cantrips) communs de niveau 1

Selon la classe, 2 à 4 sorts mineurs au niveau 1 parmi :
- *Liste à compléter depuis aidedd.org/spells/fr/ avec filtre "sort mineur"*

### Sorts de niveau 1

Selon la classe, 2 à 4 sorts préparés au niveau 1 parmi :
- *Liste à compléter depuis aidedd.org/spells/fr/ avec filtre "niveau 1"*

## Modèle de sorts dans le Character

```typescript
interface Spellcasting {
  ability: 'intelligence' | 'wisdom' | 'charisma';
  spellSaveDC: number;       // 8 + mod.caractéristique + bonus maîtrise
  spellAttackBonus: number;  // mod.caractéristique + bonus maîtrise
  cantripsKnown: string[];   // noms des sorts mineurs
  spellsPrepared: string[];  // noms des sorts préparés
  spellSlots: {              // emplacements par niveau
    [level: number]: {
      total: number;
      used: number;
    };
  };
}
```

## Progression des emplacements — Lanceur complet

| Niv. classe | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
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
| ... | | | | | | | | | |
| 20 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 1 | 1 |

## Progression Magie de pacte (Occultiste)

| Niv. classe | Emplacements | Niveau emplacement | Sorts connus | Invocations |
|---|---|---|---|---|---|
| 1 | 1 | 1 | 2 | — |
| 2 | 2 | 1 | 3 | 2 |
| 3 | 2 | 2 | 4 | 2 |
| 4 | 2 | 2 | 5 | 2 |
| 5 | 2 | 3 | 6 | 3 |
| 6 | 2 | 3 | 7 | 3 |
| 7 | 2 | 4 | 8 | 4 |
| 8 | 2 | 4 | 9 | 4 |
| 9 | 2 | 5 | 10 | 5 |
| 10 | 2 | 5 | 10 | 5 |
| 11 | 3 | 5 | 11 | 5 (Arcanum 6) |
| 13 | 3 | 5 | 12 (Arcanum 7) | 6 |
| 15 | 3 | 5 | 13 (Arcanum 8) | 7 |
| 17 | 4 | 5 | 14 (Arcanum 9) | 7 |
| ... | | | | |
| 20 | 4 | 5 | 15 | 8 |

> **Note importante :** La liste exhaustive des sorts (noms, niveaux, écoles, classes) devra faire l'objet d'un document séparé car elle représente plusieurs centaines d'entrées. Pour l'implémentation initiale, les noms de sorts peuvent être stockés comme `string` et validés contre une liste statique chargée depuis un fichier JSON.