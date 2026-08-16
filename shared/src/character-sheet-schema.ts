import { z } from 'zod';

import {
  AbilitySchema,
  ArmorTrainingSchema,
  CreatureSizeSchema,
  EffectApplicationSchema,
  EffectSourceTypeSchema,
  SkillNameSchema,
  WeaponProficiencySchema,
} from './dnd-reference-schema.js';

/**
 * La fiche calculée, telle que l'API la renvoie.
 *
 * Elle n'est jamais persistée : le back la reconstruit à chaque lecture depuis
 * les choix du joueur et les données de référence. Le front l'affiche, il ne la
 * recalcule pas — c'est ce qui garantit qu'un seul endroit connaît les règles.
 */

/**
 * Chaque valeur dérivée porte ses origines. Une CA de 16 sans « Cotte de
 * mailles » à côté est un nombre que le joueur ne peut pas vérifier.
 */
export const ResolvedValueSchema = z.object({
  value: z.number(),
  sources: z.array(z.string()),
});

export const ResolvedAbilitySchema = z.object({
  score: z.number().int(),
  modifier: z.number().int(),
});

export const ResolvedSkillSchema = z.object({
  skill: SkillNameSchema,
  ability: AbilitySchema,
  modifier: z.number().int(),
  proficient: z.boolean(),
  expert: z.boolean(),
});

export const ResolvedSavingThrowSchema = z.object({
  ability: AbilitySchema,
  modifier: z.number().int(),
  proficient: z.boolean(),
});

export const ResolvedProficienciesSchema = z.object({
  skills: z.array(SkillNameSchema),
  expertise: z.array(SkillNameSchema),
  tools: z.array(z.string()),
  languages: z.array(z.string()),
  armorTraining: z.array(ArmorTrainingSchema),
  weapons: z.array(WeaponProficiencySchema),
  savingThrows: z.array(AbilitySchema),
});

export const ResolvedSpellcastingSchema = z.object({
  origin: z.string(),
  ability: AbilitySchema,
  saveDc: z.number().int(),
  attackBonus: z.number().int(),
  cantripsKnown: z.array(z.string()),
  spellsPrepared: z.array(z.string()),
  level1Slots: z.number().int().nonnegative(),
  slotsRecoverOnShortRest: z.boolean(),
});

export const ResolvedFeatureSchema = z.object({
  name: z.string(),
  source: z.string(),
  sourceType: EffectSourceTypeSchema,
  /** Une capacité porte souvent plusieurs modes : Vigilant est passif ET informatif. */
  applications: z.array(EffectApplicationSchema),
  notes: z.array(z.string()),
});

export const ResolvedResourceSchema = z.object({
  key: z.string(),
  feature: z.string(),
  max: z.number().int(),
  recovery: z.string(),
});

const abilityRecord = <T extends z.ZodTypeAny>(value: T) =>
  z.object({
    strength: value,
    dexterity: value,
    constitution: value,
    intelligence: value,
    wisdom: value,
    charisma: value,
  });

/**
 * L'inventaire, résolu en noms. Il ne sort pas du moteur de résolution : celui-ci
 * est pur et synchrone, alors que nommer un objet demande de lire une collection.
 * C'est la couche application qui le remplit, juste avant l'envoi.
 */
export const ResolvedItemSchema = z.object({
  itemKey: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
});

export const ResolvedEquipmentSchema = z.object({
  items: z.array(ResolvedItemSchema),
  gold: z.number().int().nonnegative(),
  /** Ce qui est porté, déjà nommé — la CA en dit la conséquence, pas la cause. */
  armorName: z.string().nullable(),
  shield: z.boolean(),
  /** L'armure portée impose-t-elle le désavantage aux tests de Discrétion ? */
  stealthDisadvantage: z.boolean(),
});

export const ComputedCharacterSchema = z.object({
  equipment: ResolvedEquipmentSchema,
  level: z.number().int().min(1).max(20),
  proficiencyBonus: z.number().int(),
  speciesName: z.string(),
  lineageName: z.string().nullable(),
  className: z.string(),
  backgroundName: z.string(),
  size: CreatureSizeSchema,
  darkvision: z.number().nonnegative(),

  abilityMethod: z.enum(['roll', 'standardArray', 'pointBuy']),
  abilities: abilityRecord(ResolvedAbilitySchema),
  maxHitPoints: ResolvedValueSchema,
  armorClass: ResolvedValueSchema,
  initiative: ResolvedValueSchema,
  speed: ResolvedValueSchema,
  passivePerception: z.number().int(),
  unarmedDamage: z.string(),

  savingThrows: abilityRecord(ResolvedSavingThrowSchema),
  skills: z.array(ResolvedSkillSchema),
  proficiencies: ResolvedProficienciesSchema,
  spellcasting: z.array(ResolvedSpellcastingSchema),
  features: z.array(ResolvedFeatureSchema),
  resources: z.array(ResolvedResourceSchema),
});

export type ResolvedValue = z.infer<typeof ResolvedValueSchema>;
export type ResolvedAbility = z.infer<typeof ResolvedAbilitySchema>;
export type ResolvedSkill = z.infer<typeof ResolvedSkillSchema>;
export type ResolvedSavingThrow = z.infer<typeof ResolvedSavingThrowSchema>;
export type ResolvedProficiencies = z.infer<typeof ResolvedProficienciesSchema>;
export type ResolvedSpellcasting = z.infer<typeof ResolvedSpellcastingSchema>;
export type ResolvedFeature = z.infer<typeof ResolvedFeatureSchema>;
export type ResolvedResource = z.infer<typeof ResolvedResourceSchema>;
export type ResolvedItem = z.infer<typeof ResolvedItemSchema>;
export type ResolvedEquipment = z.infer<typeof ResolvedEquipmentSchema>;
export type ComputedCharacter = z.infer<typeof ComputedCharacterSchema>;
