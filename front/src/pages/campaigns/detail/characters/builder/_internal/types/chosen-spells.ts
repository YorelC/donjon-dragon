import type { CatalogFeature } from "@donjon-dragon/shared";
import type { CharacterComposition } from "./character-composition";
import { classOf, orderChoiceOf, speciesOf, type StepContext } from "./builder-lookups";

/** Ce qui rend un sort indisponible : les choix des autres groupes, et les octrois. */
export interface SpellSource {
  composition: CharacterComposition;
  grantedSpells: readonly string[];
}

/**
 * B01-SOR-006 : un sort ne se choisit qu'une fois, toutes sources confondues, et
 * jamais quand l'espèce, la lignée ou la classe l'accorde déjà. Ce qu'un groupe a
 * déjà coché reste à lui ; le reste lui est indisponible.
 */
export function spellsTakenElsewhere(source: SpellSource, own: readonly string[]): string[] {
  return [...source.grantedSpells, ...withoutOwn(allChosenSpells(source.composition), own)];
}

/**
 * Un sort coché dans `keys` et connu ailleurs : doublon entre deux sources, ou
 * sort déjà accordé. Le serveur le refuse ; l'étape ne doit pas paraître finie.
 */
export function hasSpellConflict(context: StepContext, keys: readonly string[]): boolean {
  const source = { composition: context.composition, grantedSpells: grantedSpellsOf(context) };
  const taken = spellsTakenElsewhere(source, keys);
  const repeated = new Set(keys).size !== keys.length;
  return repeated || keys.some((key) => taken.includes(key));
}

export function cantripKeysOf(composition: CharacterComposition): string[] {
  return [
    ...composition.classCantrips,
    ...composition.featCantrips,
    ...composition.magicInitiateChoices.flatMap((choice) => choice.cantrips),
  ];
}

export function levelOneKeysOf(composition: CharacterComposition): string[] {
  return [
    ...composition.classSpells,
    ...composition.spellbook,
    ...composition.featSpells,
    ...composition.magicInitiateChoices.flatMap((choice) => choice.spells),
  ];
}

/** Les sorts accordés sans choix par l'espèce, sa lignée, la classe et son ordre. */
export function grantedSpellsOf(context: StepContext): string[] {
  return grantingFeatures(context).flatMap((feature) => feature.grantedSpells);
}

function grantingFeatures(context: StepContext): CatalogFeature[] {
  const species = speciesOf(context);
  const lineage = species?.lineage?.options
    .find((option) => option.key === context.composition.lineageKey);
  const order = orderChoiceOf(context)?.options
    .find((option) => option.key === context.composition.classOrder);
  return [
    ...(species?.traits ?? []),
    ...(lineage?.traits ?? []),
    ...(classOf(context)?.level1Features ?? []),
    ...(order ? [order] : []),
  ];
}

function allChosenSpells(composition: CharacterComposition): string[] {
  return [
    ...cantripKeysOf(composition),
    ...levelOneKeysOf(composition),
    ...composition.invocationSpells,
  ];
}

/**
 * Retire UNE occurrence de chaque sort du groupe : pris deux fois, par ce groupe
 * et par un autre, il reste connu ailleurs.
 */
function withoutOwn(chosen: readonly string[], own: readonly string[]): string[] {
  return own.reduce((rest, key) => {
    const index = rest.indexOf(key);
    return index < 0 ? rest : [...rest.slice(0, index), ...rest.slice(index + 1)];
  }, [...chosen]);
}
