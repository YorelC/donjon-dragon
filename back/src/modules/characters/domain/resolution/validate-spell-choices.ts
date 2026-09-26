import type { CharacterChoice } from '../character-choices';
import type { Ability } from '../reference/abilities';
import { BACKGROUNDS } from '../reference/backgrounds';
import { CLASS_ORDERS } from '../reference/class-orders';
import { CLASSES, type ClassSpellcasting } from '../reference/classes';
import type { ClassKey, SpellKey } from '../reference/keys';
import { SPELLS, type Spell } from '../reference/spells';
import { fail, type ChoicesToValidate } from './choice-validation';
import { collectEffects } from './collect-effects';

const MAGIC_INITIATE_LISTS = ['cleric', 'druid', 'wizard'] as const;
const MAGIC_INITIATE_ABILITIES: readonly Ability[] = ['intelligence', 'wisdom', 'charisma'];

export function validateSpellChoices(input: ChoicesToValidate): void {
  assertClassSpells(input);
  assertMagicInitiate(input);
  assertSpellbook(input);
  assertPactTome(input);
  assertNoSpellChosenTwice(input);
}

/**
 * B01-SOR-006 : un sort choisi par une source n'est plus disponible pour une
 * autre, ni un sort que l'espèce, la lignée ou la classe accorde déjà.
 */
function assertNoSpellChosenTwice(input: ChoicesToValidate): void {
  const chosen = input.choices.all.flatMap((choice) => [
    ...spellsOf(choice),
    ...(choice.spellbook ?? []),
    ...(choice.invocationSpells ?? []),
  ]);
  const granted = grantedSpells(input);
  if (new Set(chosen).size !== chosen.length) fail('spell chosen twice');
  if (chosen.some((key) => granted.includes(key))) fail('granted spell chosen');
}

function grantedSpells(input: ChoicesToValidate): SpellKey[] {
  return collectEffects(input)
    .flatMap((collected) => collected.effect.grants?.spells ?? [])
    .map((spell) => spell.spellKey);
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
    levelOneChosenAtCreation(spellcasting),
  );
}

/** Un lanceur à grimoire prépare ses sorts sur sa fiche, pas à la création. */
function levelOneChosenAtCreation(spellcasting: ClassSpellcasting): number {
  return spellcasting.spellbookSize ? 0 : spellcasting.spellsPrepared;
}

function assertMagicInitiate(input: ChoicesToValidate): void {
  const choices = input.choices.from({ type: 'feat', key: 'magic-initiate' });
  if (choices.length !== magicInitiateCount(input)) fail('magic-initiate');
  choices.forEach(assertMagicInitiateChoice);
  assertFixedBackgroundList(input, choices);
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
  choices: readonly CharacterChoice[],
): void {
  const fixed = BACKGROUNDS[input.backgroundKey].originFeatSpellList;
  if (!fixed) return;
  const backgroundChoice = choiceGrantedByBackground(input, choices);
  if (backgroundChoice?.spellList !== fixed) fail('magic-initiate background list');
}

function choiceGrantedByBackground(
  input: ChoicesToValidate,
  choices: readonly CharacterChoice[],
): CharacterChoice | undefined {
  if (choices.length === 1) return choices[0];
  return choices.find((choice) =>
    choice.source.grantedBy?.type === 'background'
    && choice.source.grantedBy.key === input.backgroundKey,
  );
}

function assertSpellbook(input: ChoicesToValidate): void {
  const size = CLASSES[input.classKey].spellcasting?.spellbookSize ?? 0;
  const spellbook = classChoices(input).flatMap((choice) => choice.spellbook ?? []);
  if (size === 0) return assertEmpty(spellbook, 'spellbook');
  assertKnownUnique(spellbook, size, input.classKey, 1, 'spellbook');
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
  const prepared = input.choices.all.flatMap(spellsOf)
    .filter((key) => SPELLS[key]?.level === 1);
  if (rituals.some((key) => prepared.includes(key))) fail('pact-of-the-tome');
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
