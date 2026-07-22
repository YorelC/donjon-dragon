import { Schema } from 'mongoose';
import type { Character } from '@donjon-dragon/shared/character-schema';

export const CHARACTER_MODEL = 'Character';

export const CharacterSchema = new Schema<Character>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    race: { type: String, required: true },
    class: { type: String, required: true },
    level: { type: Number, required: true },
    stats: {
      strength: { type: Number, required: true },
      dexterity: { type: Number, required: true },
      constitution: { type: Number, required: true },
      intelligence: { type: Number, required: true },
      wisdom: { type: Number, required: true },
      charisma: { type: Number, required: true },
    },
    hitPoints: { type: Number, required: true },
    armorClass: { type: Number, required: true },
    proficiencyBonus: { type: Number, required: true },
    equipment: { type: [String], required: true },
    spells: { type: [String], required: true },
    userId: { type: String, required: true, index: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);
