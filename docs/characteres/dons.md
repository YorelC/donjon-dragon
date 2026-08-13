# Dons D&D 2024 — Spécification

> **Usage :** Enum Zod et TypeScript pour les dons.
> **Source :** [AideDD - Dons D&D 5.5 (2024)](https://www.aidedd.org/feat/fr/)

## Catégories de dons

| Catégorie | Description |
|---|---|
| **Don d'origines** | Acquis via l'historique à la création du personnage. Aucun prérequis de niveau. |
| **Don général** | Acquis aux niveaux 4, 8, 12, 16, 19 (Amélioration de caractéristique). Niveau 4+ requis. |
| **Don de Style de combat** | Pour les classes avec la capacité Style de combat (Guerrier, Paladin, Rôdeur). |
| **Don de faveur épique** | Niveau 19+. Capacités légendaires. |

---

## Dons d'origines (10 dons)

Ces dons sont octroyés par les historiques. Aucun prérequis.

| Don | Effet (résumé) | Historiques associés | Répétable |
|---|---|---|---|
| **Bagarreur de tavernes** | Dégâts à mains nues 1d4, repousser 1,50 m, +1 FOR/CON | Marin | Non |
| **Chanceux** | Points de chance (avantage), relancer désavantage | Marchand, Voyageur | Non |
| **Doué** | Maîtrise de 3 compétences ou outils supplémentaires | Charlatan, Noble, Scribe | **Oui** |
| **Façonneur** | Maîtrise de 3 outils, réduction 20% achat, création rapide | Artisan | Non |
| **Guérisseur** | Relancer dés de soins, kit de soins pour réanimer | Ermite | Non |
| **Initié à la magie** | 2 sorts mineurs + 1 sort niv.1 d'une liste de classe (Clerc/Magicien/Druide) | Acolyte (Clerc), Guide (Druide), Sage (Magicien) | **Oui** |
| **Musicien** | Maîtrise de 3 instruments, inspiration musicale | Artiste | Non |
| **Robuste** | +2 PV par niveau (y compris rétroactif) | Fermier | Non |
| **Sauvagerie martiale** | Relancer dégâts d'attaque (1×/tour), garder meilleur | Soldat | Non |
| **Vigilant** | Bonus d'initiative (+BM), immunité surprise | Criminel, Garde | Non |

> **Note :** Les effets détaillés de chaque don sont à compléter en parcourant les pages individuelles sur [AideDD/feat/fr](https://www.aidedd.org/feat/fr/). Les résumés ci-dessus sont basés sur les noms et la connaissance du PHB 2024.

---

## Type TypeScript

```typescript
type FeatCategory = 'origin' | 'general' | 'fightingStyle' | 'epicBoon';

interface Feat {
  name: FeatName;
  category: FeatCategory;
  repeatable: boolean;
  prerequisites?: {
    minLevel?: number;
    minAbility?: { ability: Ability; value: number };
    requiresSpellcasting?: boolean;
    requiresFightingStyle?: boolean;
    requiresArmorTraining?: 'light' | 'medium' | 'heavy' | 'shield';
  };
}

type FeatName =
  // Origines
  | 'tavernBrawler' | 'lucky' | 'skilled' | 'crafter' | 'healer'
  | 'magicInitiate' | 'musician' | 'tough' | 'savageAttacker' | 'alert'
  // Général (liste partielle)
  | 'abilityScoreImprovement' | 'athlete' | 'chef' | 'crossbowExpert'
  | 'defensiveDuelist' | 'dualWielder' | 'elementalAdept' | 'grappler'
  | 'greatWeaponMaster' | 'heavyArmorMaster' | 'inspiringLeader'
  | 'keenMind' | 'lightlyArmored' | 'mageSlayer' | 'mediumArmorMaster'
  | 'mobile' | 'mountedCombatant' | 'observant' | 'polearmMaster'
  | 'resilient' | 'ritualCaster' | 'sentinel' | 'sharpshooter'
  | 'shieldMaster' | 'skulker' | 'speedster' | 'spellSniper'
  | 'telekinetic' | 'telepathic' | 'warCaster' | 'weaponMaster'
  // Style de combat
  | 'archery' | 'blindFighting' | 'defense' | 'dueling'
  | 'greatWeaponFighting' | 'interception' | 'protection'
  | 'superiorTechnique' | 'thrownWeaponFighting' | 'twoWeaponFighting' | 'unarmedFighting'
  // Faveur épique
  | 'boonOfCombatProwess' | 'boonOfDimensionalTravel' | 'boonOfEnergyResistance'
  | 'boonOfFate' | 'boonOfFortitude' | 'boonOfIrresistibleOffense'
  | 'boonOfRecovery' | 'boonOfSkill' | 'boonOfSpeed'
  | 'boonOfSpellRecall' | 'boonOfTheNightSpirit' | 'boonOfTruesight';
```