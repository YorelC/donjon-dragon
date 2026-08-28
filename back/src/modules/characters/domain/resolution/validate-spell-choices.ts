import type { CharacterChoice } from '../character-choices';
import type { Ability } from '../reference/abilities';
import { BACKGROUNDS } from '../reference/backgrounds';
import { CLASS_ORDERS } from '../reference/class-orders';
import { CLASSES } from '../reference/classes';
import type { ClassKey, SpellKey } from '../reference/keys';
import { SPELLS, type Spell } from '../reference/spells';
import { InvalidCharacterChoiceError, type ChoicesToValidate } from './validate-choices';

const MAGIC_INITIATE_LISTS = ['cleric', 'druid', 'wizard'] as const;
const MAGIC_INITIATE_ABILITIES: readonly Ability[] = ['intelligence', 'wisdom', 'charisma'];

export function validateSpellChoices(input: ChoicesToValidate): void {
  assertClassSpells(input);
  assertMagicInitiate(input);
  assertWizardSpellbook(input);
  assertPactTome(input);
}

function assertClassSpells(input: ChoicesToValidate): void {
  const spellcasting = CLASSES[input.classKey].spellcasting;
  const chosen = classChoices(input).flatMap(spellsOf);
  const extra = extraCantrips(input);
  if (!spellcasting) return assertSpellSet(chosen, input.classKey, 0, 0);
  assertSpellSet(
    chosen,
    input.classKey,
    spellcasting.cantripsKnown + extra,
    spellcasting.spellsPrepared,
  );
}

function assertMagicInitiate(input: ChoicesToValidate): void {
  const choices = input.choices.from({ type: 'feat', key: 'magic-initiate' });
  if (choices.length !== magicInitiateCount(input)) fail('magic-initiate');
  choices.forEach(assertMagicInitiateChoice);
  assertFixedBackgroundList(input, choices.map((choice) => choice.spellList));
}

function assertMagicInitiateChoice(choice: CharacterChoice): void {
  const list = choice.spellList;
  const ability = choice.spellcastingAbility;
  if (!list || !MAGIC_INITIATE_LISTS.some((candidate) => candidate === list)) {
    fail('magic-initiate');
  }
  if (!ability || !MAGIC_INITIATE_ABILITIES.includes(ability)) fail('magic-initiate');
  assertSpellSet(choice.spells ?? [], list, 2, 1);
}

function assertFixedBackgroundList(
  input: ChoicesToValidate,
  lists: readonly (ClassKey | undefined)[],
): void {
  const fixed = BACKGROUNDS[input.backgroundKey].originFeatSpellList;
  if (fixed && !lists.includes(fixed)) fail('magic-initiate background list');
}

function assertWizardSpellbook(input: ChoicesToValidate): void {
  const spellbook = classChoices(input).flatMap((choice) => choice.spellbook ?? []);
  const expected = input.classKey === 'wizard' ? 6 : 0;
  assertKnownUnique(spellbook, expected, 'wizard', 1, 'spellbook');
}

function assertPactTome(input: ChoicesToValidate): void {
  const choice = classChoices(input)
    .find((candidate) => candidate.invocation === 'pact-of-the-tome');
  const spells = choice?.invocationSpells ?? [];
  if (!choice) return assertEmpty(spells, 'pact-of-the-tome');
  const cantrips = spells.filter((key) => SPELLS[key]?.level === 0);
  const rituals = spells.filter(isLevelOneRitual);
  if (spells.length !== 5 || cantrips.length !== 3 || rituals.length !== 2) {
    fail('pact-of-the-tome');
  }
  assertKnownUnique(spells, 5, undefined, undefined, 'pact-of-the-tome');
}

function assertSpellSet(
  keys: readonly SpellKey[],
  list: ClassKey,
  cantripCount: number,
  levelOneCount: number,
): void {
  const cantrips = keys.filter((key) => SPELLS[key]?.level === 0);
  const levelOne = keys.filter((key) => SPELLS[key]?.level === 1);
  if (keys.length !== cantripCount + levelOneCount) fail('spells');
  assertKnownUnique(cantrips, cantripCount, list, 0, 'cantrips');
  assertKnownUnique(levelOne, levelOneCount, list, 1, 'level-one spells');
}

function assertKnownUnique(
  keys: readonly SpellKey[],
  count: number,
  list: ClassKey | undefined,
  level: 0 | 1 | undefined,
  origin: string,
): void {
  const spells = keys.map((key) => SPELLS[key]);
  if (keys.length !== count || new Set(keys).size !== count) fail(origin);
  if (!spells.every((spell) => spellIsAllowed(spell, list, level))) fail(origin);
}

function spellIsAllowed(
  spell: Spell | undefined,
  list: ClassKey | undefined,
  level: 0 | 1 | undefined,
): boolean {
  if (!spell || level !== undefined && spell.level !== level) return false;
  return !list || spell.classLists.includes(list);
}

function extraCantrips(input: ChoicesToValidate): number {
  const order = CLASS_ORDERS[input.classKey];
  const selected = classChoices(input)[0]?.classOrder;
  const effects = order?.options.find((option) => option.key === selected)?.effects ?? [];
  return effects.reduce((sum, effect) => sum + (effect.grants?.extraCantrips ?? 0), 0);
}

function magicInitiateCount(input: ChoicesToValidate): number {
  const background = BACKGROUNDS[input.backgroundKey].originFeat === 'magic-initiate' ? 1 : 0;
  const human = input.choices.from({ type: 'species', key: input.speciesKey })
    .filter((choice) => choice.originFeat === 'magic-initiate').length;
  return background + human;
}

function classChoices(input: ChoicesToValidate): readonly CharacterChoice[] {
  return input.choices.from({ type: 'class', key: input.classKey });
}

function spellsOf(choice: CharacterChoice): readonly SpellKey[] {
  return choice.spells ?? [];
}

function isLevelOneRitual(key: SpellKey): boolean {
  return SPELLS[key]?.level === 1 && SPELLS[key]?.ritual === true;
}

function assertEmpty(values: readonly unknown[], origin: string): void {
  if (values.length > 0) fail(origin);
}

function fail(origin: string): never {
  throw new InvalidCharacterChoiceError(origin);
}
