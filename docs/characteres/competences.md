# Compétences D&D 2024

> **Usage :** Enum Zod et TypeScript pour les compétences de personnage.
> **Source :** [AideDD - Règles 2024](https://www.aidedd.org/regles-24/)

## Liste exhaustive (18 compétences)

Chaque compétence est associée à une caractéristique.

| Compétence (FR) | Compétence (EN key) | Caractéristique |
|---|---|---|
| Acrobaties | acrobatics | Dextérité |
| Arcanes | arcana | Intelligence |
| Athlétisme | athletics | Force |
| Discrétion | stealth | Dextérité |
| Dressage | animalHandling | Sagesse |
| Escamotage | sleightOfHand | Dextérité |
| Histoire | history | Intelligence |
| Intimidation | intimidation | Charisme |
| Intuition | insight | Sagesse |
| Investigation | investigation | Intelligence |
| Médecine | medicine | Sagesse |
| Nature | nature | Intelligence |
| Perception | perception | Sagesse |
| Persuasion | persuasion | Charisme |
| Religion | religion | Intelligence |
| Représentation | performance | Charisme |
| Survie | survival | Sagesse |
| Tromperie | deception | Charisme |

## Répartition par caractéristique

| Caractéristique | Compétences |
|---|---|
| **Force** | Athlétisme |
| **Dextérité** | Acrobaties, Discrétion, Escamotage |
| **Constitution** | *(aucune)* |
| **Intelligence** | Arcanes, Histoire, Investigation, Nature, Religion |
| **Sagesse** | Dressage, Intuition, Médecine, Perception, Survie |
| **Charisme** | Intimidation, Persuasion, Représentation, Tromperie |

## Type TypeScript

```typescript
type SkillName =
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleightOfHand'
  | 'stealth' | 'survival';

type Ability = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

const skillAbility: Record<SkillName, Ability> = {
  acrobatics: 'dexterity',
  animalHandling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
};
```

## Jets de sauvegarde

| JS | Caractéristique associée |
|---|---|
| Force | Strength |
| Dextérité | Dexterity |
| Constitution | Constitution |
| Intelligence | Intelligence |
| Sagesse | Wisdom |
| Charisme | Charisma |