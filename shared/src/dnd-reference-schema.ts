import { z } from 'zod';

/**
 * Le vocabulaire fermé de D&D 2024, côté transport.
 *
 * Ces unions doublent celles du domaine back (`characters/domain/reference/`), et
 * c'est voulu : le domaine ne lit de `@donjon-dragon/shared` que `error-schema`,
 * tout le reste y est du transport. Le test de contrat du back vérifie que les
 * deux listes disent la même chose — c'est là que la duplication se paie, pas
 * dans un import qui traverserait la frontière.
 */

export const AbilitySchema = z.enum([
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]);

export const SkillNameSchema = z.enum([
  'acrobatics',
  'animalHandling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleightOfHand',
  'stealth',
  'survival',
]);

export const SpeciesKeySchema = z.enum([
  'aasimar',
  'dragonborn',
  'dwarf',
  'elf',
  'gnome',
  'goliath',
  'halfling',
  'human',
  'orc',
  'tiefling',
]);

export const ClassKeySchema = z.enum([
  'barbarian',
  'bard',
  'cleric',
  'druid',
  'fighter',
  'monk',
  'paladin',
  'ranger',
  'rogue',
  'sorcerer',
  'warlock',
  'wizard',
]);

export const BackgroundKeySchema = z.enum([
  'acolyte',
  'artisan',
  'charlatan',
  'criminal',
  'entertainer',
  'farmer',
  'guard',
  'guide',
  'hermit',
  'merchant',
  'noble',
  'sage',
  'sailor',
  'scribe',
  'soldier',
  'wayfarer',
]);

export const OriginFeatKeySchema = z.enum([
  'alert',
  'crafter',
  'healer',
  'lucky',
  'magic-initiate',
  'musician',
  'savage-attacker',
  'skilled',
  'tavern-brawler',
  'tough',
]);

export const ArmorTrainingSchema = z.enum(['light', 'medium', 'heavy', 'shields']);

export const DamageTypeSchema = z.enum([
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
]);

/** Les propriétés d'arme du manuel 2024, en vocabulaire fermé. */
export const WeaponPropertySchema = z.enum([
  'ammunition',
  'finesse',
  'heavy',
  'light',
  'loading',
  'reach',
  'thrown',
  'twoHanded',
  'versatile',
]);

/**
 * Les huit maîtrises d'arme de 2024. Chaque arme du manuel en porte exactement
 * une : c'est ce que sait en faire celui qui a été formé à l'arme, et non une
 * propriété de l'arme elle-même comme `versatile` ou `heavy`.
 */
export const WeaponMasterySchema = z.enum([
  'cleave',
  'graze',
  'nick',
  'push',
  'sap',
  'slow',
  'topple',
  'vex',
]);

export const WeaponProficiencySchema = z.enum([
  'simple',
  'martial',
  'martialFinesseOrLight',
  'martialLight',
]);

export const CreatureSizeSchema = z.enum(['Small', 'Medium']);

export const AlignmentSchema = z.enum([
  'lawfulGood',
  'neutralGood',
  'chaoticGood',
  'lawfulNeutral',
  'trueNeutral',
  'chaoticNeutral',
  'lawfulEvil',
  'neutralEvil',
  'chaoticEvil',
]);

export const LanguageSchema = z.enum([
  'common',
  'commonSignLanguage',
  'draconic',
  'dwarvish',
  'elvish',
  'giant',
  'gnomish',
  'goblin',
  'halfling',
  'orc',
  'abyssal',
  'celestial',
  'deepSpeech',
  'infernal',
  'primordial',
  'sylvan',
  'undercommon',
  'druidic',
  'thievesCant',
]);

export const EffectApplicationSchema = z.enum([
  'passive',
  'grant',
  'reactive',
  'active',
  'informational',
]);

export const EffectSourceTypeSchema = z.enum([
  'species',
  'lineage',
  'class',
  'background',
  'feat',
  'spell',
]);

export type Ability = z.infer<typeof AbilitySchema>;
export type SkillName = z.infer<typeof SkillNameSchema>;
export type SpeciesKey = z.infer<typeof SpeciesKeySchema>;
export type ClassKey = z.infer<typeof ClassKeySchema>;
export type BackgroundKey = z.infer<typeof BackgroundKeySchema>;
export type OriginFeatKey = z.infer<typeof OriginFeatKeySchema>;
export type ArmorTraining = z.infer<typeof ArmorTrainingSchema>;
export type WeaponProficiency = z.infer<typeof WeaponProficiencySchema>;
export type DamageType = z.infer<typeof DamageTypeSchema>;
export type WeaponProperty = z.infer<typeof WeaponPropertySchema>;
export type WeaponMastery = z.infer<typeof WeaponMasterySchema>;
export type CreatureSize = z.infer<typeof CreatureSizeSchema>;
export type Alignment = z.infer<typeof AlignmentSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type EffectApplication = z.infer<typeof EffectApplicationSchema>;
export type EffectSourceType = z.infer<typeof EffectSourceTypeSchema>;
