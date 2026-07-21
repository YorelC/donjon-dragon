import { z } from 'zod';

export const RaceEnum = z.enum([
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn',
  'Gnome', 'HalfElf', 'HalfOrc', 'Tiefling',
]);

export const ClassEnum = z.enum([
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer',
  'Warlock', 'Wizard',
]);

export const StatsSchema = z.object({
  strength: z.number().int().min(3).max(20),
  dexterity: z.number().int().min(3).max(20),
  constitution: z.number().int().min(3).max(20),
  intelligence: z.number().int().min(3).max(20),
  wisdom: z.number().int().min(3).max(20),
  charisma: z.number().int().min(3).max(20),
});

export const CreateCharacterSchema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-zA-ZÀ-ÿ '-]{2,50}$/),
  race: RaceEnum,
  class: ClassEnum,
  level: z.number().int().min(1).max(20).default(1),
  stats: StatsSchema,
});

export const CharacterSchema = CreateCharacterSchema.extend({
  id: z.string().uuid(),
  hitPoints: z.number().int().positive(),
  armorClass: z.number().int().min(10),
  proficiencyBonus: z.number().int().min(2).max(6),
  equipment: z.array(z.string()),
  spells: z.array(z.string()),
  userId: z.string(),
  createdAt: z.string().datetime(),
});

export type CreateCharacterDto = z.infer<typeof CreateCharacterSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Race = z.infer<typeof RaceEnum>;
export type Class = z.infer<typeof ClassEnum>;
export type Stats = z.infer<typeof StatsSchema>;