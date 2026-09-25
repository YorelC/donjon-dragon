import type {
  Ability,
  ArmorTraining,
  CreatureSize,
  DamageType,
  EffectApplication,
  Language,
  ResolvedSpellcasting,
  WeaponProficiency,
} from "@donjon-dragon/shared";

export const ABILITIES: readonly Ability[] = [
  "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
];

export const ABILITY_SHORT_LABELS: Record<Ability, string> = {
  strength: "For",
  dexterity: "Dex",
  constitution: "Con",
  intelligence: "Int",
  wisdom: "Sag",
  charisma: "Cha",
};

export const ABILITY_LABELS: Record<Ability, string> = {
  strength: "Force",
  dexterity: "Dextérité",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Sagesse",
  charisma: "Charisme",
};

export const SIZE_LABELS: Record<CreatureSize, string> = { Small: "P", Medium: "M" };

export const ARMOR_TRAINING_LABELS: Record<ArmorTraining, string> = {
  light: "légères",
  medium: "intermédiaires",
  heavy: "lourdes",
  shields: "boucliers",
};

export const WEAPON_PROFICIENCY_LABELS: Record<WeaponProficiency, string> = {
  simple: "simples",
  martial: "de guerre",
  martialFinesseOrLight: "de guerre finesse ou légères",
  martialLight: "de guerre légères",
};

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  acid: "acide",
  bludgeoning: "contondant",
  cold: "froid",
  fire: "feu",
  force: "force",
  lightning: "foudre",
  necrotic: "nécrotique",
  piercing: "perforant",
  poison: "poison",
  psychic: "psychique",
  radiant: "radiant",
  slashing: "tranchant",
  thunder: "tonnerre",
};

/** Le catalogue ne liste que les langues à choisir : le Commun et les jargons sont accordés d'office. */
export const GRANTED_LANGUAGE_LABELS: Partial<Record<Language, string>> = {
  common: "Commun",
  druidic: "Druidique",
  thievesCant: "Jargon des voleurs",
};

export const ACTIVE_APPLICATIONS: readonly EffectApplication[] = ["active", "reactive"];

export const APPLICATION_LABELS: Record<EffectApplication, string> = {
  passive: "Passif",
  grant: "Octroi",
  reactive: "Réaction",
  active: "Action",
  informational: "Rappel",
};

export const RECOVERY_LABELS: Record<string, string> = {
  longRest: "repos long",
  shortRest: "repos court",
};

export type CastableSpell = ResolvedSpellcasting["cantripsKnown"][number];

export const FREE_CAST_LABELS: Record<
  NonNullable<CastableSpell["freeCastFrequency"]>,
  string
> = {
  atWill: "À volonté",
  oncePerLongRest: "1 / repos long",
  proficiencyBonusPerLongRest: "Maîtrise / repos long",
};

export const SPELL_STATUS = {
  alwaysPrepared: "Toujours préparé",
  ritualOnly: "Rituel",
  cantrip: "Connu",
  prepared: "Préparé",
} as const;

export const PACT_OF_THE_BLADE_LABEL = "Pacte de la Lame";

export const SHEET_TABS = {
  weapons: { value: "armes", label: "Armes" },
  features: { value: "aptitudes", label: "Aptitudes" },
  grimoire: { value: "grimoire", label: "Grimoire" },
  gear: { value: "barda", label: "Barda" },
  identity: { value: "identite", label: "Identité" },
} as const;

export const COMING_SOON = "Bientôt disponible";
