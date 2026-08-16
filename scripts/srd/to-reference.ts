import type { Ability, ArmorTraining, SkillName } from '@donjon-dragon/shared/dnd-reference-schema';

import type { SrdRef } from './srd-equipment.ts';
import type { SrdChoice, SrdClass, SrdSpecies } from './srd-reference.ts';
import { toMeters } from './units.ts';

/**
 * Le vocabulaire du SRD traduit dans celui du projet.
 *
 * Le SRD range tout dans une seule liste `proficiencies` non typée, où
 * `light-armor`, `simple-weapons` et `saving-throw-wis` cohabitent. Le projet
 * les sépare en `armorTraining`, `weaponProficiencies` et `savingThrows`. C'est
 * ici que la liste plate est redécoupée.
 */

const ABILITY_BY_SRD_INDEX: Record<string, Ability> = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma',
};

export function toAbilities(references: SrdRef[]): Ability[] {
  return references.map((reference) => {
    const ability = ABILITY_BY_SRD_INDEX[reference.index];
    if (!ability) throw new Error(`Caractéristique inconnue dans le SRD : ${reference.index}`);
    return ability;
  });
}

/**
 * Le guerrier n'a pas une caractéristique principale mais un choix entre deux, et
 * le SRD change alors de champ : `ability_score_options` au lieu de
 * `ability_scores`.
 */
export function toPrimaryAbilities(srdClass: SrdClass): Ability[] {
  const primary = srdClass.primary_ability;
  if (!primary) return [];
  const offered = (primary.ability_score_options?.from.options ?? [])
    .map((option) => option.item)
    .filter((item): item is SrdRef => Boolean(item));
  return toAbilities([...(primary.ability_scores ?? []), ...offered]);
}

const ALL_ARMOR_PROFICIENCY = 'all-armor';
const ALL_ARMOR_TRAINING: ArmorTraining[] = ['light', 'medium', 'heavy'];

const ARMOR_TRAINING_BY_PROFICIENCY: Record<string, ArmorTraining> = {
  'light-armor': 'light',
  'medium-armor': 'medium',
  'heavy-armor': 'heavy',
  shields: 'shields',
};

/** `all-armor` est un raccourci du SRD ; le projet énumère les trois entraînements. */
export function toArmorTraining(srdClass: SrdClass): ArmorTraining[] {
  const named = pick(srdClass.proficiencies, ARMOR_TRAINING_BY_PROFICIENCY);
  if (!hasProficiency(srdClass, ALL_ARMOR_PROFICIENCY)) return named;
  return [...new Set([...ALL_ARMOR_TRAINING, ...named])];
}

function hasProficiency(srdClass: SrdClass, index: string): boolean {
  return srdClass.proficiencies.some((proficiency) => proficiency.index === index);
}

const WEAPON_PROFICIENCY_BY_PROFICIENCY: Record<string, string> = {
  'simple-weapons': 'simple',
  'martial-weapons': 'martial',
};

export function toWeaponProficiencies(srdClass: SrdClass): string[] {
  return pick(srdClass.proficiencies, WEAPON_PROFICIENCY_BY_PROFICIENCY);
}

const SKILL_PREFIX = 'skill-';
const SKILL_CHOICE_TYPE = 'proficiencies';

/** `skill-animal-handling` côté SRD, `animalHandling` côté projet. */
export function toSkillName(index: string): SkillName {
  return index.slice(SKILL_PREFIX.length).replace(/-(.)/g, (_, letter: string) =>
    letter.toUpperCase(),
  ) as SkillName;
}

export function toSkillChoice(srdClass: SrdClass): { count: number; options: SkillName[] } | null {
  const choice = (srdClass.proficiency_choices ?? []).find(isSkillChoice);
  if (!choice) return null;
  return { count: choice.choose, options: skillOptionsOf(choice) };
}

function isSkillChoice(choice: SrdChoice): boolean {
  return choice.type === SKILL_CHOICE_TYPE && skillOptionsOf(choice).length > 0;
}

function skillOptionsOf(choice: SrdChoice): SkillName[] {
  return (choice.from.options ?? [])
    .map((option) => option.item?.index)
    .filter((index): index is string => Boolean(index?.startsWith(SKILL_PREFIX)))
    .map(toSkillName);
}

const DARKVISION_PREFIX = 'darkvision-';
const NO_DARKVISION = 0;

/** Le SRD encode la portée dans la clé du trait : `darkvision-60`. */
export function toDarkvisionMeters(species: SrdSpecies): number {
  const trait = (species.traits ?? []).find((entry) => entry.index.startsWith(DARKVISION_PREFIX));
  if (!trait) return NO_DARKVISION;
  return toMeters(Number(trait.index.slice(DARKVISION_PREFIX.length)));
}

/**
 * Les sous-espèces du SRD portent le nom de leur lignée en préfixe
 * (`elven-lineage-drow`), le projet non (`drow`). On compare donc les suffixes.
 */
export function toLineageKeys(species: SrdSpecies): string[] {
  return (species.subspecies ?? []).map((entry) => entry.index);
}

function pick<T>(references: SrdRef[], table: Record<string, T>): T[] {
  return references.map((reference) => table[reference.index]).filter((value) => value !== undefined);
}
