import { z } from 'zod';

import { UserSummarySchema } from './user-schema.js';

/**
 * Bornes du nom de personnage, en un seul endroit — même logique que
 * `CAMPAIGN_NAME_RULES` pour le nom de campagne : le back valide avec ce schéma,
 * le formulaire du front réutilise `CharacterNameField`.
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

export const CHARACTER_TRAIT_RULES = {
  min: 2,
  max: 30,
} as const;

const characterTraitField = (label: string) =>
  z
    .string()
    .trim()
    .min(CHARACTER_TRAIT_RULES.min, {
      message: `${label} doit contenir au moins ${CHARACTER_TRAIT_RULES.min} caractères.`,
    })
    .max(CHARACTER_TRAIT_RULES.max, {
      message: `${label} ne peut pas dépasser ${CHARACTER_TRAIT_RULES.max} caractères.`,
    });

export const characterRaceField = () => characterTraitField('La race');
export const characterClassField = () => characterTraitField('La classe');

export const ABILITY_SCORE_RULES = {
  min: 1,
  max: 30,
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

export const CreateCharacterSchema = z.object({
  name: characterNameField(),
  race: characterRaceField(),
  characterClass: characterClassField(),
  abilityScores: AbilityScoresSchema,
});

export const UpdateCharacterSchema = CreateCharacterSchema;

export const AssignCharacterSchema = z.object({
  playerDisplayName: z.string().trim().min(1),
});

/**
 * `assignedTo` est un résumé du joueur, jamais son id — même raison que pour
 * les autres réponses de campagne : le client n'a pas à connaître l'identité
 * système des autres joueurs.
 */
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  name: characterNameField(),
  race: characterRaceField(),
  characterClass: characterClassField(),
  abilityScores: AbilityScoresSchema,
  createdByMe: z.boolean(),
  assignedTo: UserSummarySchema.nullable(),
});

export type AbilityScores = z.infer<typeof AbilityScoresSchema>;
export type CreateCharacterDto = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacterDto = z.infer<typeof UpdateCharacterSchema>;
export type AssignCharacterDto = z.infer<typeof AssignCharacterSchema>;
export type Character = z.infer<typeof CharacterSchema>;
