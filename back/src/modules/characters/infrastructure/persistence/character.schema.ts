import { Schema } from 'mongoose';

import type { AbilityScoresSnapshot } from '../../domain/ability-scores';
import type { CharacterSnapshot } from '../../domain/character';

export const CHARACTER_MODEL = 'Character';

const AbilityScoresSubSchema = new Schema<AbilityScoresSnapshot>(
  {
    strength: { type: Number, required: true },
    dexterity: { type: Number, required: true },
    constitution: { type: Number, required: true },
    intelligence: { type: Number, required: true },
    wisdom: { type: Number, required: true },
    charisma: { type: Number, required: true },
  },
  { _id: false, versionKey: false },
);

export const CharacterSchema = new Schema<CharacterSnapshot>(
  {
    id: { type: String, required: true, unique: true },
    campaignId: { type: String, required: true },
    name: { type: String, required: true },
    race: { type: String, required: true },
    characterClass: { type: String, required: true },
    abilityScores: { type: AbilityScoresSubSchema, required: true },
    createdBy: { type: String, required: true },
    assignedTo: { type: String, default: null },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { versionKey: false },
);

/** Les deux lectures du module : toute la campagne, et « qui a ce joueur ». */
CharacterSchema.index({ campaignId: 1 });
CharacterSchema.index({ campaignId: 1, assignedTo: 1 });
