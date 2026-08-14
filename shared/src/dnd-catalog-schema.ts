import { z } from 'zod';

import {
  AbilitySchema,
  ArmorTrainingSchema,
  BackgroundKeySchema,
  ClassKeySchema,
  CreatureSizeSchema,
  OriginFeatKeySchema,
  SkillNameSchema,
  SpeciesKeySchema,
  WeaponProficiencySchema,
} from './dnd-reference-schema.js';

/**
 * Le catalogue que le wizard de création affiche.
 *
 * Les données de référence vivent au back, dans le domaine du module characters.
 * Elles ne changent qu'à une errata du PHB, donc ce catalogue se charge une fois
 * et se garde : le front ne les recalcule ni ne les redemande à chaque étape.
 *
 * Les sorts n'y sont pas : leurs descriptions pèsent trop pour être envoyées à
 * un joueur qui crée un barbare. Ils ont leur propre route, par classe.
 */

export const SKILL_CHOICE_ANY = 'any';

export const CatalogSkillChoiceSchema = z.object({
  count: z.number().int().nonnegative(),
  /** `'any'` quand le choix porte sur les 18 compétences. */
  options: z.union([z.array(SkillNameSchema), z.literal(SKILL_CHOICE_ANY)]),
});

export const CatalogFeatureSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
});

export const CatalogLineageSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  traits: z.array(CatalogFeatureSchema),
});

export const CatalogLineageChoiceSchema = z.object({
  label: z.string(),
  spellcastingAbilityOptions: z.array(AbilitySchema),
  options: z.array(CatalogLineageSchema),
});

export const CatalogSpeciesSchema = z.object({
  key: SpeciesKeySchema,
  name: z.string(),
  size: CreatureSizeSchema,
  sizeOptions: z.array(CreatureSizeSchema),
  speed: z.number(),
  darkvision: z.number(),
  traits: z.array(CatalogFeatureSchema),
  skillChoice: CatalogSkillChoiceSchema.nullable(),
  /** L'espèce impose-t-elle un don d'Origines au choix ? L'humain, et lui seul. */
  grantsOriginFeatChoice: z.boolean(),
  lineage: CatalogLineageChoiceSchema.nullable(),
});

export const CatalogSpellcastingSchema = z.object({
  ability: AbilitySchema,
  cantripsKnown: z.number().int().nonnegative(),
  spellsPrepared: z.number().int().nonnegative(),
  level1Slots: z.number().int().nonnegative(),
  focus: z.string(),
});

export const CatalogClassSchema = z.object({
  key: ClassKeySchema,
  name: z.string(),
  primaryAbilities: z.array(AbilitySchema),
  hitDie: z.number().int(),
  savingThrows: z.array(AbilitySchema),
  skillChoice: CatalogSkillChoiceSchema,
  toolProficiencies: z.array(z.string()),
  armorTraining: z.array(ArmorTrainingSchema),
  weaponProficiencies: z.array(WeaponProficiencySchema),
  startingEquipment: z.object({
    description: z.string(),
    goldAlternative: z.number().int(),
  }),
  spellcasting: CatalogSpellcastingSchema.nullable(),
  level1Features: z.array(CatalogFeatureSchema),
  /** Combien de compétences voient leur bonus de maîtrise doublé. Roublard : 2. */
  expertiseCount: z.number().int().nonnegative(),
});

export const CatalogOriginFeatSchema = z.object({
  key: OriginFeatKeySchema,
  name: z.string(),
  description: z.string(),
  repeatable: z.boolean(),
});

export const CatalogBackgroundSchema = z.object({
  key: BackgroundKeySchema,
  name: z.string(),
  description: z.string(),
  abilityBonuses: z.array(AbilitySchema),
  originFeat: OriginFeatKeySchema,
  originFeatSpellList: ClassKeySchema.nullable(),
  skillProficiencies: z.array(SkillNameSchema),
  toolProficiency: z.string(),
  equipment: z.object({
    description: z.string(),
    goldAlternative: z.number().int(),
  }),
});

export const CatalogArmorSchema = z.object({
  key: z.string(),
  name: z.string(),
  training: ArmorTrainingSchema,
  baseArmorClass: z.number().int(),
  dexterityAllowance: z.enum(['full', 'capped', 'none']),
  strengthRequirement: z.number().int().nullable(),
  stealthDisadvantage: z.boolean(),
});

export const DndCatalogSchema = z.object({
  species: z.array(CatalogSpeciesSchema),
  classes: z.array(CatalogClassSchema),
  backgrounds: z.array(CatalogBackgroundSchema),
  originFeats: z.array(CatalogOriginFeatSchema),
  armors: z.array(CatalogArmorSchema),
  shieldArmorClassBonus: z.number().int(),
  /** Les libellés français des 18 compétences, pour que le front n'en tienne pas la table. */
  skillLabels: z.record(SkillNameSchema, z.string()),
});

export const CatalogSpellSchema = z.object({
  key: z.string(),
  name: z.string(),
  level: z.union([z.literal(0), z.literal(1)]),
  school: z.string(),
  castingTime: z.string(),
  range: z.string(),
  duration: z.string(),
  concentration: z.boolean(),
  ritual: z.boolean(),
  description: z.string(),
});

export const CatalogSpellListSchema = z.object({
  classKey: ClassKeySchema,
  cantrips: z.array(CatalogSpellSchema),
  level1: z.array(CatalogSpellSchema),
});

export type CatalogSkillChoice = z.infer<typeof CatalogSkillChoiceSchema>;
export type CatalogFeature = z.infer<typeof CatalogFeatureSchema>;
export type CatalogLineage = z.infer<typeof CatalogLineageSchema>;
export type CatalogLineageChoice = z.infer<typeof CatalogLineageChoiceSchema>;
export type CatalogSpecies = z.infer<typeof CatalogSpeciesSchema>;
export type CatalogClass = z.infer<typeof CatalogClassSchema>;
export type CatalogOriginFeat = z.infer<typeof CatalogOriginFeatSchema>;
export type CatalogBackground = z.infer<typeof CatalogBackgroundSchema>;
export type CatalogArmor = z.infer<typeof CatalogArmorSchema>;
export type DndCatalog = z.infer<typeof DndCatalogSchema>;
export type CatalogSpell = z.infer<typeof CatalogSpellSchema>;
export type CatalogSpellList = z.infer<typeof CatalogSpellListSchema>;
