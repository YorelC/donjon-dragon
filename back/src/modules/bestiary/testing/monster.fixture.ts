import { Monster, type MonsterAbilitiesSnapshot, type MonsterSnapshot } from '../domain/monster';

const GOBLIN_ABILITIES: MonsterAbilitiesSnapshot = {
  str: 8,
  dex: 15,
  con: 10,
  int: 10,
  wis: 8,
  cha: 8,
  strMod: '-1',
  dexMod: '+2',
  conMod: '+0',
  intMod: '+0',
  wisMod: '-1',
  chaMod: '-1',
  strSave: '-1',
  dexSave: '+4',
  conSave: '+0',
  intSave: '+0',
  wisSave: '-1',
  chaSave: '-1',
};

const DEFAULT_MONSTER: MonsterSnapshot = {
  key: 'gobelin',
  name: 'Gobelin',
  type: 'Humanoïde',
  size: 'P',
  alignment: 'Neutre mauvais',

  armorClass: 15,
  hitPoints: 7,
  hitDice: '2d6',
  initiativeBonus: 2,
  speed: '9 m',

  skills: 'Discrétion +6',
  damageImmunities: null,
  damageResistances: null,
  damageVulnerabilities: null,
  conditionImmunities: null,
  senses: 'Vision dans le noir 18 m, Perception passive 9',
  languages: 'commun, gobelin',

  challengeRating: '1/4',
  xp: '50',
  proficiencyBonus: '+2',

  abilities: GOBLIN_ABILITIES,
  traits: [],
  actions: [{ name: 'Cimeterre', description: 'Corps à corps : +4. Touché : 5 (1d6 + 2).' }],
  bonusActions: [],
  reactions: [],
  legendaryActions: [],
  mythicActions: [],

  source: 'Monster Manual 2024',
  nameEN: 'Goblin',
  nameES: 'Trasgo',

  origin: 'srd',
  campaignId: null,
};

export function aMonsterSnapshot(overrides: Partial<MonsterSnapshot> = {}): MonsterSnapshot {
  return { ...DEFAULT_MONSTER, ...overrides };
}

export function aMonster(overrides: Partial<MonsterSnapshot> = {}): Monster {
  return Monster.create(aMonsterSnapshot(overrides));
}

/** Le gobelin qu'un MJ a redéfini chez lui : même clé, autre portée. */
export function aHomebrewMonster(campaignId: string, overrides: Partial<MonsterSnapshot> = {}) {
  return Monster.create(aMonsterSnapshot({ origin: 'campaign', campaignId, ...overrides }));
}
