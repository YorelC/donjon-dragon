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
  const chosenElsewhere = allChosenSpells(source.composition).filter((key) => !own.includes(key));
  return [...source.grantedSpells, ...chosenElsewhere];
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
    ...composition.classCantrips,
    ...composition.classSpells,
    ...composition.spellbook,
    ...composition.invocationSpells,
    ...composition.featCantrips,
    ...composition.featSpells,
    ...composition.magicInitiateChoices.flatMap((choice) => [...choice.cantrips, ...choice.spells]),
  ];
}
