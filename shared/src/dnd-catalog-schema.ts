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

/**
 * Une option de paquetage de départ : « A, B ou C, ou bien l'or ».
 *
 * `label` est la phrase du manuel, affichée telle quelle. `entries` est ce qui
 * atterrit vraiment dans l'inventaire. Les deux ne se recouvrent pas toujours :
 * quand le manuel dit « outils d'artisan », il désigne une catégorie et non un
 * objet, et c'est l'étape des maîtrises d'outils qui tranche — la ligne reste
 * donc dans le libellé sans entrer dans l'inventaire.
 *
 * L'option « or seul » n'a rien de particulier : elle a simplement `entries` vide.
 */
export const CatalogEquipmentEntrySchema = z.object({
  itemKey: z.string(),
  quantity: z.number().int().positive(),
});

export const CatalogEquipmentOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  entries: z.array(CatalogEquipmentEntrySchema),
  gold: z.number().int().nonnegative(),
});

export const CatalogStartingEquipmentSchema = z.object({
  options: z.array(CatalogEquipmentOptionSchema).min(1),
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

/**
 * Un choix que la classe impose au niveau 1 : le Style de combat du guerrier,
 * l'Ordre divin du clerc, l'Ordre primitif du druide. Le wizard en fait une
 * étape à part entière.
 */
export const CatalogClassChoiceSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  options: z.array(CatalogFeatureSchema),
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
  startingEquipment: CatalogStartingEquipmentSchema,
  spellcasting: CatalogSpellcastingSchema.nullable(),
  level1Features: z.array(CatalogFeatureSchema),
  /** Combien de compétences voient leur bonus de maîtrise doublé. Roublard : 2. */
  expertiseCount: z.number().int().nonnegative(),
  /** Style de combat, Ordre divin, Ordre primitif — vide pour la plupart. */
  level1Choices: z.array(CatalogClassChoiceSchema),
});

/** Initié à la magie laisse choisir sa liste et sa caractéristique d'incantation. */
export const CatalogSpellcastingChoiceSchema = z.object({
  abilityOptions: z.array(AbilitySchema),
  spellListOptions: z.array(ClassKeySchema),
  cantripsKnown: z.number().int().nonnegative(),
  spellsPrepared: z.number().int().nonnegative(),
});

export const CatalogOriginFeatSchema = z.object({
  key: OriginFeatKeySchema,
  name: z.string(),
  description: z.string(),
  repeatable: z.boolean(),
  /** Non nul quand le don demande une liste de sorts et une caractéristique. */
  spellcastingChoice: CatalogSpellcastingChoiceSchema.nullable(),
  /** Doué en demande trois, entre compétences et outils. */
  skillOrToolChoiceCount: z.number().int().nonnegative(),
  /** Façonneur et Musicien font choisir des outils ou des instruments. */
  toolChoiceCount: z.number().int().nonnegative(),
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
  equipment: CatalogStartingEquipmentSchema,
});

export const DndCatalogSchema = z.object({
  species: z.array(CatalogSpeciesSchema),
  classes: z.array(CatalogClassSchema),
  backgrounds: z.array(CatalogBackgroundSchema),
  originFeats: z.array(CatalogOriginFeatSchema),
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
export type CatalogEquipmentEntry = z.infer<typeof CatalogEquipmentEntrySchema>;
export type CatalogEquipmentOption = z.infer<typeof CatalogEquipmentOptionSchema>;
export type CatalogStartingEquipment = z.infer<typeof CatalogStartingEquipmentSchema>;
export type CatalogLineage = z.infer<typeof CatalogLineageSchema>;
export type CatalogLineageChoice = z.infer<typeof CatalogLineageChoiceSchema>;
export type CatalogSpecies = z.infer<typeof CatalogSpeciesSchema>;
export type CatalogClassChoice = z.infer<typeof CatalogClassChoiceSchema>;
export type CatalogClass = z.infer<typeof CatalogClassSchema>;
export type CatalogSpellcastingChoice = z.infer<typeof CatalogSpellcastingChoiceSchema>;
export type CatalogOriginFeat = z.infer<typeof CatalogOriginFeatSchema>;
export type CatalogBackground = z.infer<typeof CatalogBackgroundSchema>;
export type DndCatalog = z.infer<typeof DndCatalogSchema>;
export type CatalogSpell = z.infer<typeof CatalogSpellSchema>;
export type CatalogSpellList = z.infer<typeof CatalogSpellListSchema>;
