import { describe, expect, it } from 'vitest';

import { CharacterChoices, type CharacterChoice } from '../character-choices';
import { CLASS_ORDERS } from '../reference/class-orders';
import { CLASSES } from '../reference/classes';
import { ARTISAN_TOOLS, MUSICAL_INSTRUMENTS } from '../reference/creation-options';
import { CLASS_KEYS, SPECIES_KEYS, type ClassKey, type SpeciesKey } from '../reference/keys';
import { SKILLS, type SkillName } from '../reference/skills';
import { SPECIES } from '../reference/species';
import { SPELLS } from '../reference/spells';
import { WEAPONS, type Weapon } from '../reference/weapons';
import { validateChoices } from './validate-choices';

const FARMER_SKILLS: readonly SkillName[] = ['animalHandling', 'nature'];

describe('120 combinaisons espèce-classe du niveau 1', () => {
  SPECIES_KEYS.forEach((speciesKey) => {
    CLASS_KEYS.forEach((classKey) => {
      it(`${speciesKey} / ${classKey}`, () => {
        expect(() => validateChoices(validInput(speciesKey, classKey))).not.toThrow();
      });
    });
  });
});

function validInput(speciesKey: SpeciesKey, classKey: ClassKey) {
  const species = SPECIES[speciesKey];
  const lineage = species.lineage?.options[0] ?? null;
  const speciesChoices = choicesForSpecies(speciesKey, lineage?.key ?? null);
  const choices = [...speciesChoices, classChoice(classKey, speciesChoices)];
  return {
    speciesKey, lineageKey: lineage?.key ?? null,
    standardLanguages: ['elvish', 'dwarvish'] as const,
    classKey, backgroundKey: 'farmer' as const,
    choices: CharacterChoices.create(choices),
  };
}

function choicesForSpecies(speciesKey: SpeciesKey, lineageKey: string | null): CharacterChoice[] {
  const species = SPECIES[speciesKey];
  const skillChoice = species.traits.flatMap((trait) => trait.effects)
    .find((effect) => effect.grants?.skillChoice)?.grants?.skillChoice;
  const skills = skillChoice ? firstSkills(skillChoice.options, skillChoice.count, []) : [];
  const speciesChoice = speciesKey === 'human'
    ? [{ source: { type: 'species' as const, key: speciesKey }, skills, originFeat: 'alert' as const }]
    : skills.length > 0 ? [{ source: { type: 'species' as const, key: speciesKey }, skills }] : [];
  const ability = species.lineage?.spellcastingAbilityOptions?.[0];
  const lineageChoice = lineageKey && ability
    ? [{ source: { type: 'lineage' as const, key: lineageKey }, spellcastingAbility: ability }]
    : [];
  return [...speciesChoice, ...lineageChoice];
}

function classChoice(classKey: ClassKey, speciesChoices: CharacterChoice[]): CharacterChoice {
  const characterClass = CLASSES[classKey];
  const excluded = [...FARMER_SKILLS, ...speciesChoices.flatMap((choice) => choice.skills ?? [])];
  const skills = firstSkills(characterClass.skillChoice.options, characterClass.skillChoice.count, excluded);
  const choice: CharacterChoice = { source: { type: 'class', key: classKey }, skills };
  addTools(choice, classKey);
  addClassOptions(choice, classKey);
  addSpells(choice, classKey);
  if (classKey === 'rogue') addRogueChoices(choice, [...FARMER_SKILLS, ...skills]);
  return choice;
}

function addTools(choice: CharacterChoice, classKey: ClassKey): void {
  if (classKey === 'bard') choice.tools = MUSICAL_INSTRUMENTS.slice(0, 3);
  if (classKey === 'monk') choice.tools = ARTISAN_TOOLS.slice(0, 1);
}

function addClassOptions(choice: CharacterChoice, classKey: ClassKey): void {
  const order = CLASS_ORDERS[classKey]?.options[0];
  if (order) choice.classOrder = order.key;
  if (classKey === 'fighter') choice.fightingStyle = 'archery';
  const masteryCount = CLASSES[classKey].level1Features.flatMap((feature) => feature.effects)
    .reduce((count, effect) => count + (effect.grants?.weaponMasteryCount ?? 0), 0);
  if (masteryCount > 0) choice.weaponMasteries = eligibleWeapons(classKey).slice(0, masteryCount);
  if (classKey === 'warlock') choice.invocation = 'armor-of-shadows';
}

function addSpells(choice: CharacterChoice, classKey: ClassKey): void {
  const spellcasting = CLASSES[classKey].spellcasting;
  if (!spellcasting) return;
  const order = CLASS_ORDERS[classKey]?.options[0];
  const extra = order?.effects.reduce(
    (count, effect) => count + (effect.grants?.extraCantrips ?? 0), 0,
  ) ?? 0;
  const available = Object.values(SPELLS).filter((spell) => spell.classLists.includes(classKey));
  const cantrips = available.filter((spell) => spell.level === 0)
    .slice(0, spellcasting.cantripsKnown + extra).map((spell) => spell.key);
  const levelOne = available.filter((spell) => spell.level === 1);
  if (classKey === 'wizard') choice.spellbook = levelOne.slice(0, 6).map((spell) => spell.key);
  const prepared = classKey === 'wizard' ? choice.spellbook!.slice(0, 4) : levelOne
    .slice(0, spellcasting.spellsPrepared).map((spell) => spell.key);
  choice.spells = [...cantrips, ...prepared];
}

function addRogueChoices(choice: CharacterChoice, proficient: readonly SkillName[]): void {
  choice.expertise = proficient.slice(0, 2);
  choice.languages = ['gnomish'];
}

function firstSkills(
  options: readonly SkillName[] | 'any',
  count: number,
  excluded: readonly SkillName[],
): SkillName[] {
  const available = options === 'any' ? SKILLS : options;
  return available.filter((skill) => !excluded.includes(skill)).slice(0, count);
}

function eligibleWeapons(classKey: ClassKey): string[] {
  return Object.values(WEAPONS).filter((weapon) => proficientWith(classKey, weapon))
    .map((weapon) => weapon.key);
}

function proficientWith(classKey: ClassKey, weapon: Weapon): boolean {
  const proficiencies = CLASSES[classKey].weaponProficiencies;
  if (proficiencies.includes(weapon.category)) return true;
  const eligible = weapon.properties.some((property) => property === 'finesse' || property === 'light');
  return proficiencies.includes('martialFinesseOrLight') && weapon.category === 'martial' && eligible;
}
