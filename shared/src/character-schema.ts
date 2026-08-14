import { z } from 'zod';

import {
  AbilitySchema,
  BackgroundKeySchema,
  ClassKeySchema,
  EffectSourceTypeSchema,
  LanguageSchema,
  OriginFeatKeySchema,
  SkillNameSchema,
  SpeciesKeySchema,
} from './dnd-reference-schema.js';
import { UserSummarySchema } from './user-schema.js';

/**
 * Bornes du nom de personnage, en un seul endroit — même logique que
 * `CAMPAIGN_NAME_RULES` : le back valide avec ce schéma, le formulaire du front
 * réutilise `characterNameField`.
 */
export const CHARACTER_NAME_RULES = {
  min: 2,
  max: 50,
} as const;

export const characterNameField = () =>
  z
    .string()
    .trim()
    .min(CHARACTER_NAME_RULES.min, {
      message: `Le nom du personnage doit contenir au moins ${CHARACTER_NAME_RULES.min} caractères.`,
    })
    .max(CHARACTER_NAME_RULES.max, {
      message: `Le nom du personnage ne peut pas dépasser ${CHARACTER_NAME_RULES.max} caractères.`,
    });

// ---------------------------------------------------------------------------
// Caractéristiques
// ---------------------------------------------------------------------------

/**
 * Un score issu de 4d6 dont on garde les trois meilleurs tient forcément entre
 * 3 et 18. Les bonus d'historique s'appliquent après, côté serveur.
 */
export const ABILITY_SCORE_RULES = {
  min: 3,
  max: 18,
} as const;

const abilityScoreField = () =>
  z.number().int().min(ABILITY_SCORE_RULES.min).max(ABILITY_SCORE_RULES.max);

export const AbilityScoresSchema = z.object({
  strength: abilityScoreField(),
  dexterity: abilityScoreField(),
  constitution: abilityScoreField(),
  intelligence: abilityScoreField(),
  wisdom: abilityScoreField(),
  charisma: abilityScoreField(),
});

/** L'historique donne +2 et +1, ou +1 sur chacune de ses trois caractéristiques. */
const backgroundBonusField = () => z.union([z.literal(1), z.literal(2)]).optional();

export const BackgroundAbilityBonusesSchema = z.object({
  strength: backgroundBonusField(),
  dexterity: backgroundBonusField(),
  constitution: backgroundBonusField(),
  intelligence: backgroundBonusField(),
  wisdom: backgroundBonusField(),
  charisma: backgroundBonusField(),
});

/**
 * Les trois façons de fixer ses caractéristiques. Le serveur vérifie chacune à
 * sa manière : permutation du tirage persisté, permutation du tableau standard,
 * ou bornes et budget pour l'achat de points.
 */
export const AbilityMethodSchema = z.enum(['roll', 'standardArray', 'pointBuy']);

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const POINT_BUY_COSTS: Readonly<Record<number, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_BOUNDS = { min: 8, max: 15 } as const;

export const DICE_PER_ABILITY_ROLL = 4;
export const ABILITY_ROLL_COUNT = 6;

/**
 * Le résultat d'un tirage, tel que le serveur le renvoie : les dés bruts en plus
 * des totaux, pour que le front puisse les animer et que le joueur puisse
 * refaire le calcul.
 */
export const AbilityRollSchema = z.object({
  dice: z
    .array(z.array(z.number().int().min(1).max(6)).length(DICE_PER_ABILITY_ROLL))
    .length(ABILITY_ROLL_COUNT),
  totals: z
    .array(z.number().int().min(ABILITY_SCORE_RULES.min).max(ABILITY_SCORE_RULES.max))
    .length(ABILITY_ROLL_COUNT),
});

// ---------------------------------------------------------------------------
// Choix de création
// ---------------------------------------------------------------------------

export const ChoiceSourceSchema = z.object({
  type: EffectSourceTypeSchema,
  key: z.string().min(1),
});

/**
 * Un choix fait à la création, avec sa provenance. Tous les champs sont
 * optionnels : une source en remplit rarement plus d'un ou deux.
 */
export const CharacterChoiceSchema = z.object({
  source: ChoiceSourceSchema,
  skills: z.array(SkillNameSchema).optional(),
  expertise: z.array(SkillNameSchema).optional(),
  tools: z.array(z.string()).optional(),
  languages: z.array(LanguageSchema).optional(),
  spells: z.array(z.string()).optional(),
  originFeat: OriginFeatKeySchema.optional(),
  spellcastingAbility: AbilitySchema.optional(),
  spellList: ClassKeySchema.optional(),
  feature: z.string().optional(),
});

export const CharacterEquipmentSchema = z.object({
  armorKey: z.string().nullable(),
  shield: z.boolean(),
  items: z.array(z.string()),
  gold: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Requêtes
// ---------------------------------------------------------------------------

/** Créer un personnage, c'est ouvrir un brouillon : un nom, et rien d'autre. */
export const StartCharacterSchema = z.object({
  name: characterNameField(),
});

/**
 * Renommer ne touche à rien d'autre. Même forme que l'ouverture d'un brouillon,
 * mais pas la même intention : `PUT` rejoue tous les choix, `PATCH` ne bouge que
 * le nom — un joueur corrige une faute de frappe sans repasser par le wizard.
 */
export const RenameCharacterSchema = z.object({
  name: characterNameField(),
});

/**
 * Le wizard rend sa copie. `base` doit être une permutation exacte du tirage
 * persisté — c'est le serveur qui le vérifie, pas le client.
 */
export const FinalizeCharacterSchema = z.object({
  name: characterNameField(),
  speciesKey: SpeciesKeySchema,
  lineageKey: z.string().nullable(),
  classKey: ClassKeySchema,
  backgroundKey: BackgroundKeySchema,
  abilityMethod: AbilityMethodSchema,
  base: AbilityScoresSchema,
  backgroundBonuses: BackgroundAbilityBonusesSchema,
  choices: z.array(CharacterChoiceSchema),
  equipment: CharacterEquipmentSchema,
});

/** L'aperçu du wizard : les mêmes choix, mais rien n'est persisté ni vérifié. */
export const PreviewCharacterSheetSchema = FinalizeCharacterSchema.omit({ name: true });

export const AssignCharacterSchema = z.object({
  playerDisplayName: z.string().trim().min(1),
});

// ---------------------------------------------------------------------------
// Réponses
// ---------------------------------------------------------------------------

/**
 * Ce que la liste affiche d'un personnage terminé. `null` tant qu'il est un
 * brouillon : les noms viennent des données de référence du back, le front ne
 * les recalcule pas.
 */
export const CharacterBuildSummarySchema = z.object({
  speciesKey: SpeciesKeySchema,
  speciesName: z.string(),
  lineageName: z.string().nullable(),
  classKey: ClassKeySchema,
  className: z.string(),
  backgroundKey: BackgroundKeySchema,
  backgroundName: z.string(),
});

/**
 * `assignedTo` est un résumé du joueur, jamais son id — le client n'a pas à
 * connaître l'identité système des autres joueurs.
 */
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  name: characterNameField(),
  status: z.enum(['draft', 'ready']),
  build: CharacterBuildSummarySchema.nullable(),
  abilityRoll: AbilityRollSchema.nullable(),
  createdByMe: z.boolean(),
  assignedTo: UserSummarySchema.nullable(),
});

export type AbilityScores = z.infer<typeof AbilityScoresSchema>;
export type BackgroundAbilityBonuses = z.infer<typeof BackgroundAbilityBonusesSchema>;
export type AbilityMethod = z.infer<typeof AbilityMethodSchema>;
export type AbilityRoll = z.infer<typeof AbilityRollSchema>;
export type ChoiceSource = z.infer<typeof ChoiceSourceSchema>;
export type CharacterChoice = z.infer<typeof CharacterChoiceSchema>;
export type CharacterEquipment = z.infer<typeof CharacterEquipmentSchema>;
export type StartCharacterDto = z.infer<typeof StartCharacterSchema>;
export type RenameCharacterDto = z.infer<typeof RenameCharacterSchema>;
export type FinalizeCharacterDto = z.infer<typeof FinalizeCharacterSchema>;
export type PreviewCharacterSheetDto = z.infer<typeof PreviewCharacterSheetSchema>;
export type AssignCharacterDto = z.infer<typeof AssignCharacterSchema>;
export type CharacterBuildSummary = z.infer<typeof CharacterBuildSummarySchema>;
export type Character = z.infer<typeof CharacterSchema>;
