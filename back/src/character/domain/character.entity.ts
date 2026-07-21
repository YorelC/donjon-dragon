import { z } from 'zod';

// Stats schema
export const StatsSchema = z.object({
  strength: z.number().int().min(3).max(20),
  dexterity: z.number().int().min(3).max(20),
  constitution: z.number().int().min(3).max(20),
  intelligence: z.number().int().min(3).max(20),
  wisdom: z.number().int().min(3).max(20),
  charisma: z.number().int().min(3).max(20),
});

export type Stats = z.infer<typeof StatsSchema>;

// Hit die per class
const HIT_DIE: Record<string, { die: number; average: number }> = {
  Barbarian: { die: 12, average: 7 },
  Bard: { die: 8, average: 5 },
  Cleric: { die: 8, average: 5 },
  Druid: { die: 8, average: 5 },
  Fighter: { die: 10, average: 6 },
  Monk: { die: 8, average: 5 },
  Paladin: { die: 10, average: 6 },
  Ranger: { die: 8, average: 5 },
  Rogue: { die: 8, average: 5 },
  Sorcerer: { die: 6, average: 4 },
  Warlock: { die: 8, average: 5 },
  Wizard: { die: 6, average: 4 },
};

// Types
export type CreateCharacterParams = {
  name: string;
  race: string;
  class: string;
  level: number;
  stats: Stats;
  userId: string;
};

export type Character = {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  stats: Stats;
  hitPoints: { max: number; current: number };
  armorClass: number;
  proficiencyBonus: number;
  equipment: string[];
  spells: string[];
  userId: string;
  createdAt: string;
};

// Pure calculation functions
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function calculateHitPoints(
  characterClass: string,
  constitution: number,
  level: number,
): number {
  const classInfo = HIT_DIE[characterClass];
  if (!classInfo) {
    throw new Error(`Unknown class: ${characterClass}`);
  }

  const conMod = calculateModifier(constitution);

  if (level === 1) {
    return classInfo.die + conMod;
  }

  const level1Hp = classInfo.die + conMod;
  const perLevelHp = classInfo.average + conMod;

  return level1Hp + (level - 1) * perLevelHp;
}

export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(1 + level / 4);
}

export function calculateArmorClass(dexterity: number): number {
  return 10 + calculateModifier(dexterity);
}

export function createCharacter(params: CreateCharacterParams): Character {
  const conMod = calculateModifier(params.stats.constitution);

  return {
    id: crypto.randomUUID(),
    name: params.name,
    race: params.race,
    class: params.class,
    level: params.level,
    stats: params.stats,
    hitPoints: {
      max: calculateHitPoints(params.class, params.stats.constitution, params.level),
      current: calculateHitPoints(params.class, params.stats.constitution, params.level),
    },
    armorClass: calculateArmorClass(params.stats.dexterity),
    proficiencyBonus: calculateProficiencyBonus(params.level),
    equipment: [],
    spells: [],
    userId: params.userId,
    createdAt: new Date().toISOString(),
  };
}
