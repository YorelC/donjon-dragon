import type { CharacterChoice } from '../character-choices';
import { BACKGROUNDS } from '../reference/backgrounds';
import { CLASS_ORDERS } from '../reference/class-orders';
import { CLASSES } from '../reference/classes';
import {
  ALL_CONCRETE_TOOLS,
  ARTISAN_TOOLS,
  BACKGROUND_FIXED_TOOLS,
  LEVEL_ONE_INVOCATIONS,
  MUSICAL_INSTRUMENTS,
  RARE_LANGUAGES,
  SPECIAL_FAMILIAR_FORMS,
  STANDARD_LANGUAGES,
} from '../reference/creation-options';
import type { SkillChoice } from '../reference/effect';
import { FIGHTING_STYLE_KEYS } from '../reference/fighting-styles';
import type { ClassKey, OriginFeatKey, SpeciesKey } from '../reference/keys';
import { ORIGIN_FEATS } from '../reference/origin-feats';
import type { Language } from '../reference/proficiencies';
import { SKILLS, type SkillName } from '../reference/skills';
import { SPECIES } from '../reference/species';
import { WEAPONS } from '../reference/weapons';
import {
  InvalidCharacterChoiceError,
  InvalidSkillChoiceError,
  LineageRequiredError,
  UnknownLineageError,
  fail,
  type ChoicesToValidate,
} from './choice-validation';
import { validateSpellChoices } from './validate-spell-choices';

export function validateChoices(input: ChoicesToValidate): void {
  assertLineage(input);
  assertSize(input);
  assertLanguages(input);
  assertSkills(input);
  assertTools(input);
  assertOriginFeats(input);
  assertClassOptions(input);
  validateSpellChoices(input);
}

function assertLineage(input: ChoicesToValidate): void {
  const lineage = SPECIES[input.speciesKey].lineage;
  if (!lineage && input.lineageKey !== null) throw new UnknownLineageError();
  if (!lineage && input.lineageKey === null) return;
  if (input.lineageKey === null) throw new LineageRequiredError();
  const known = lineage?.options.some((option) => option.key === input.lineageKey);
  if (!known) throw new UnknownLineageError();
}

function assertSize(input: ChoicesToValidate): void {
  const species = SPECIES[input.speciesKey];
  const allowed = species.sizeOptions ?? [species.size];
  if (!input.size || !allowed.includes(input.size)) fail('size');
}

function assertLanguages(input: ChoicesToValidate): void {
  const languages = input.standardLanguages ?? [];
  assertExactUnique(languages, 2, STANDARD_LANGUAGES, 'languages');
  const rogue = choicesFrom(input, 'class', 'rogue').flatMap(languageValues);
  const allowed = [...STANDARD_LANGUAGES, ...RARE_LANGUAGES];
  assertExactUnique(rogue, input.classKey === 'rogue' ? 1 : 0, allowed, 'rogue languages');
}

function assertSkills(input: ChoicesToValidate): void {
  const characterClass = CLASSES[input.classKey];
  assertSkillChoice(
    characterClass.skillChoice,
    skillsFrom(input, 'class', input.classKey),
    characterClass.name,
  );
  assertSpeciesSkills(input);
  assertFeatProficiencies(input);
  assertExpertise(input);
  assertNoDuplicateProficiencies(input);
}

function assertSpeciesSkills(input: ChoicesToValidate): void {
  const expected = speciesSkillChoice(input.speciesKey);
  const chosen = skillsFrom(input, 'species', input.speciesKey);
  assertSkillChoice(expected, chosen, SPECIES[input.speciesKey].name);
}

function assertFeatProficiencies(input: ChoicesToValidate): void {
  const counts = featCounts(input);
  const skilledOptions = [...SKILLS, ...ALL_CONCRETE_TOOLS];
  assertFeatChoice(input, 'skilled', counts.get('skilled') ?? 0, skilledOptions);
  assertFeatChoice(input, 'crafter', counts.get('crafter') ?? 0, ARTISAN_TOOLS);
  assertFeatChoice(input, 'musician', counts.get('musician') ?? 0, MUSICAL_INSTRUMENTS);
}

function assertFeatChoice(
  input: ChoicesToValidate,
  feat: OriginFeatKey,
  occurrences: number,
  allowed: readonly string[],
): void {
  const choices = choicesFrom(input, 'feat', feat);
  const values = choices.flatMap(proficienciesOf);
  assertExactUnique(values, occurrences * 3, allowed, feat);
}

function assertExpertise(input: ChoicesToValidate): void {
  const choices = choicesFrom(input, 'class', input.classKey);
  const expertise = choices.flatMap((choice) => choice.expertise ?? []);
  const proficient = [
    ...BACKGROUNDS[input.backgroundKey].skillProficiencies,
    ...input.choices.all.flatMap((choice) => choice.skills ?? []),
  ];
  const expected = input.classKey === 'rogue' ? 2 : 0;
  assertExactUnique(expertise, expected, proficient, 'expertise');
}

function assertNoDuplicateProficiencies(input: ChoicesToValidate): void {
  const skills = [
    ...BACKGROUNDS[input.backgroundKey].skillProficiencies,
    ...input.choices.all.flatMap((choice) => choice.skills ?? []),
  ];
  const fixedTool = BACKGROUND_FIXED_TOOLS[input.backgroundKey];
  const tools = [
    ...CLASSES[input.classKey].toolProficiencies,
    ...(fixedTool ? [fixedTool] : []),
    ...input.choices.all.flatMap((choice) => choice.tools ?? []),
  ];
  if (new Set(skills).size !== skills.length) fail('skills');
  if (new Set(tools).size !== tools.length) fail('tools');
}

function assertTools(input: ChoicesToValidate): void {
  const characterClass = CLASSES[input.classKey];
  const chosen = choicesFrom(input, 'class', input.classKey).flatMap(toolValues);
  const expected = characterClass.toolChoice?.count ?? 0;
  assertExactUnique(chosen, expected, classToolOptions(input.classKey), characterClass.name);
  assertBackgroundTool(input);
}

function assertBackgroundTool(input: ChoicesToValidate): void {
  const background = BACKGROUNDS[input.backgroundKey];
  const chosen = choicesFrom(input, 'background', input.backgroundKey).flatMap(toolValues);
  const selectable = background.toolProficiency.includes('choix');
  const allowed = background.toolProficiency.includes('artisan')
    ? ARTISAN_TOOLS
    : ALL_CONCRETE_TOOLS;
  assertExactUnique(chosen, selectable ? 1 : 0, allowed, background.name);
}

function assertOriginFeats(input: ChoicesToValidate): void {
  const backgroundFeat = BACKGROUNDS[input.backgroundKey].originFeat;
  const speciesChoices = choicesFrom(input, 'species', input.speciesKey);
  const selected = speciesChoices.flatMap(originFeatOf);
  const count = input.speciesKey === 'human' ? 1 : 0;
  assertExactUnique(selected, count, Object.keys(ORIGIN_FEATS), 'origin feat');
  const feats = [backgroundFeat, ...selected];
  const duplicate = new Set(feats).size !== feats.length;
  if (duplicate && !ORIGIN_FEATS[backgroundFeat].repeatable) fail('origin feat');
}

function assertClassOptions(input: ChoicesToValidate): void {
  const choices = choicesFrom(input, 'class', input.classKey);
  const orderOptions = CLASS_ORDERS[input.classKey]?.options.map((option) => option.key) ?? [];
  assertSingleOption(choices, 'classOrder', orderOptions, 'class order');
  const styles = input.classKey === 'fighter' ? FIGHTING_STYLE_KEYS : [];
  assertSingleOption(choices, 'fightingStyle', styles, 'fighting style');
  assertWeaponMasteries(input, choices);
  assertInvocation(input, choices);
}

function assertWeaponMasteries(
  input: ChoicesToValidate,
  choices: readonly CharacterChoice[],
): void {
  const chosen = choices.flatMap((choice) => choice.weaponMasteries ?? []);
  const allowed = Object.values(WEAPONS)
    .filter((weapon) => weaponIsProficient(input.classKey, weapon))
    .map((weapon) => weapon.key);
  assertExactUnique(chosen, masteryCount(input.classKey), allowed, 'weapon masteries');
}

function assertInvocation(input: ChoicesToValidate, choices: readonly CharacterChoice[]): void {
  const invocations = choices.flatMap(invocationOf);
  const count = input.classKey === 'warlock' ? 1 : 0;
  assertExactUnique(invocations, count, LEVEL_ONE_INVOCATIONS, 'invocation');
  const details = choices.find((choice) => choice.invocation !== undefined);
  if (details) assertInvocationDetails(details);
}

function assertInvocationDetails(choice: CharacterChoice): void {
  const key = choice.invocation;
  if (key === 'pact-of-the-chain') {
    assertExactlyOne(choice.familiarForm, SPECIAL_FAMILIAR_FORMS, key);
    return;
  }
  if (key === 'pact-of-the-blade') return assertPactWeapon(choice, key);
  if (key === 'pact-of-the-tome') return;
  const hasDetails = choice.familiarForm || choice.pactWeaponKey || choice.invocationSpells?.length;
  if (hasDetails) fail(key ?? 'invocation');
}

function assertPactWeapon(choice: CharacterChoice, origin: string): void {
  const weapon = choice.pactWeaponKey ? WEAPONS[choice.pactWeaponKey] : undefined;
  if (!weapon || weapon.kind !== 'melee') fail(origin);
}

function assertSingleOption(
  choices: readonly CharacterChoice[],
  field: 'classOrder' | 'fightingStyle',
  allowed: readonly string[],
  origin: string,
): void {
  const selected = choices.flatMap((choice) => choice[field] ? [choice[field]] : []);
  assertExactUnique(selected, allowed.length > 0 ? 1 : 0, allowed, origin);
}

function assertSkillChoice(
  expected: SkillChoice,
  chosen: readonly SkillName[],
  origin: string,
): void {
  const allowed = expected.options === 'any' ? SKILLS : expected.options;
  assertExactUnique(chosen, expected.count, allowed, origin, InvalidSkillChoiceError);
}

function speciesSkillChoice(speciesKey: SpeciesKey): SkillChoice {
  const choices = SPECIES[speciesKey].traits.flatMap((trait) => trait.effects)
    .flatMap((effect) => effect.grants?.skillChoice ? [effect.grants.skillChoice] : []);
  return choices[0] ?? { count: 0, options: [] };
}

function featCounts(input: ChoicesToValidate): Map<OriginFeatKey, number> {
  const selected = choicesFrom(input, 'species', input.speciesKey).flatMap(originFeatOf);
  const background = BACKGROUNDS[input.backgroundKey].originFeat;
  return countValues([background, ...selected]);
}

function countValues<T>(values: readonly T[]): Map<T, number> {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return counts;
}

function masteryCount(classKey: ClassKey): number {
  return CLASSES[classKey].level1Features.flatMap((feature) => feature.effects)
    .reduce((count, effect) => count + (effect.grants?.weaponMasteryCount ?? 0), 0);
}

function weaponIsProficient(
  classKey: ClassKey,
  weapon: (typeof WEAPONS)[string],
): boolean {
  const proficiencies = CLASSES[classKey].weaponProficiencies;
  return proficiencies.includes(weapon.category)
    || proficiencies.includes('martialFinesseOrLight') && hasFinesseOrLight(weapon);
}

function hasFinesseOrLight(weapon: (typeof WEAPONS)[string]): boolean {
  const eligible = weapon.properties.some((property) => property === 'finesse' || property === 'light');
  return weapon.category === 'martial' && eligible;
}

function classToolOptions(classKey: ClassKey): readonly string[] {
  if (classKey === 'bard') return MUSICAL_INSTRUMENTS;
  if (classKey === 'monk') return [...ARTISAN_TOOLS, ...MUSICAL_INSTRUMENTS];
  return ALL_CONCRETE_TOOLS;
}

function choicesFrom(
  input: ChoicesToValidate,
  type: CharacterChoice['source']['type'],
  key: string,
) {
  return input.choices.from({ type, key });
}

function skillsFrom(
  input: ChoicesToValidate,
  type: 'class' | 'species',
  key: string,
): SkillName[] {
  return choicesFrom(input, type, key).flatMap((choice) => choice.skills ?? []);
}

function proficienciesOf(choice: CharacterChoice): readonly string[] {
  return [...(choice.skills ?? []), ...(choice.tools ?? [])];
}

function originFeatOf(choice: CharacterChoice): readonly OriginFeatKey[] {
  return choice.originFeat ? [choice.originFeat] : [];
}

function invocationOf(choice: CharacterChoice): readonly string[] {
  return choice.invocation ? [choice.invocation] : [];
}

function toolValues(choice: CharacterChoice): readonly string[] {
  return choice.tools ?? [];
}

function languageValues(choice: CharacterChoice): readonly Language[] {
  return choice.languages ?? [];
}

function assertExactlyOne(value: string | undefined, allowed: readonly string[], origin: string): void {
  assertExactUnique(value ? [value] : [], 1, allowed, origin);
}

function assertExactUnique<T>(
  selected: readonly T[],
  count: number,
  allowed: readonly T[],
  origin: string,
  ErrorType: new (origin: string) => InvalidCharacterChoiceError = InvalidCharacterChoiceError,
): void {
  const validCount = selected.length === count && new Set(selected).size === count;
  if (!validCount || !selected.every((value) => allowed.includes(value))) {
    throw new ErrorType(origin);
  }
}
