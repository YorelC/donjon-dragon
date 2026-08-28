// Les identifiants stables des données de référence, isolés dans un module sans
// dépendance : les catalogues (species, classes, backgrounds, origin-feats)
// importent le modèle d'effet, qui a lui-même besoin de ces clés. Les réunir ici
// est ce qui évite le cycle.
//
// Convention : kebab-case, alignée sur les seeds de docs/characteres/.

export const SPECIES_KEYS = [
  'aasimar',
  'dragonborn',
  'dwarf',
  'elf',
  'gnome',
  'goliath',
  'halfling',
  'human',
  'orc',
  'tiefling',
] as const;

export type SpeciesKey = (typeof SPECIES_KEYS)[number];

export const CLASS_KEYS = [
  'barbarian',
  'bard',
  'cleric',
  'druid',
  'fighter',
  'monk',
  'paladin',
  'ranger',
  'rogue',
  'sorcerer',
  'warlock',
  'wizard',
] as const;

export type ClassKey = (typeof CLASS_KEYS)[number];

export const BACKGROUND_KEYS = [
  'acolyte',
  'artisan',
  'charlatan',
  'criminal',
  'entertainer',
  'farmer',
  'guard',
  'guide',
  'hermit',
  'merchant',
  'noble',
  'sage',
  'sailor',
  'scribe',
  'soldier',
  'wayfarer',
] as const;

export type BackgroundKey = (typeof BACKGROUND_KEYS)[number];

/**
 * Les 10 dons d'Origines, les seuls accessibles à la création. Les dons
 * généraux, de style de combat et de faveur épique arrivent au niveau 4 et plus.
 */
export const ORIGIN_FEAT_KEYS = [
  'alert',
  'crafter',
  'healer',
  'lucky',
  'magic-initiate',
  'musician',
  'savage-attacker',
  'skilled',
  'tavern-brawler',
  'tough',
] as const;

export type OriginFeatKey = (typeof ORIGIN_FEAT_KEYS)[number];

export type SpellKey = string;

/** Le lignage d'une espèce : drow, infernal, argenté… Vide pour les espèces sans. */
export type LineageKey = string;
