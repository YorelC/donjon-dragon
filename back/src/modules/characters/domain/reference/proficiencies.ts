// Les familles de maîtrises et les vocabulaires fermés qui les accompagnent.
// Les fichiers sources de docs/characteres/ décrivent ces valeurs tantôt en clés
// anglaises, tantôt en prose française ; ici il n'existe qu'une forme.

export const ARMOR_TRAININGS = ['light', 'medium', 'heavy', 'shields'] as const;

export type ArmorTraining = (typeof ARMOR_TRAININGS)[number];

export const WEAPON_PROFICIENCIES = [
  'simple',
  'martial',
  'martialFinesseOrLight',
  'martialLight',
] as const;

export type WeaponProficiency = (typeof WEAPON_PROFICIENCIES)[number];

export const DAMAGE_TYPES = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
] as const;

export type DamageType = (typeof DAMAGE_TYPES)[number];

export const CREATURE_SIZES = ['Small', 'Medium'] as const;

export type CreatureSize = (typeof CREATURE_SIZES)[number];

export const ARMOR_TRAINING_LABELS: Record<ArmorTraining, string> = {
  light: 'Armures légères',
  medium: 'Armures intermédiaires',
  heavy: 'Armures lourdes',
  shields: 'Boucliers',
};

export const WEAPON_PROFICIENCY_LABELS: Record<WeaponProficiency, string> = {
  simple: 'Armes courantes',
  martial: 'Armes de guerre',
  martialFinesseOrLight: 'Armes de guerre dotées de la propriété Finesse ou Légère',
  martialLight: 'Armes de guerre dotées de la propriété Légère',
};

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  acid: 'acide',
  bludgeoning: 'contondant',
  cold: 'froid',
  fire: 'feu',
  force: 'force',
  lightning: 'foudre',
  necrotic: 'nécrotique',
  piercing: 'perforant',
  poison: 'poison',
  psychic: 'psychique',
  radiant: 'radiant',
  slashing: 'tranchant',
  thunder: 'tonnerre',
};

/** Le Commun est connu de tout personnage : il n'est jamais un choix. */
export const DEFAULT_LANGUAGE = 'common';

export const LANGUAGES = [
  'common',
  'commonSignLanguage',
  'draconic',
  'dwarvish',
  'elvish',
  'giant',
  'gnomish',
  'goblin',
  'halfling',
  'orc',
  'abyssal',
  'celestial',
  'deepSpeech',
  'infernal',
  'primordial',
  'sylvan',
  'undercommon',
  'druidic',
  'thievesCant',
] as const;

export type Language = (typeof LANGUAGES)[number];
