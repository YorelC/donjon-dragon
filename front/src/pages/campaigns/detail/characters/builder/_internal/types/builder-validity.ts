import type { CatalogOriginFeat } from "@donjon-dragon/shared";
import type { CharacterComposition } from "./character-composition";
import { featsOf, speciesOf, type StepContext } from "./builder-lookups";

/**
 * Les prédicats de validité qui tiennent en plus d'une ligne. Les triviaux
 * restent dans la table des étapes, à côté de ce qu'ils décrivent.
 */
export function areFeatsDone(context: StepContext): boolean {
  if (speciesOf(context)?.grantsOriginFeatChoice && !context.composition.speciesFeat) {
    return false;
  }

  return featsOf(context).every((feat) => isFeatConfigured(feat, context.composition));
}

function isFeatConfigured(feat: CatalogOriginFeat, composition: CharacterComposition): boolean {
  if (feat.spellcastingChoice && (!composition.spellList || !composition.spellcastingAbility)) {
    return false;
  }

  return composition.featSkills.length + composition.featTools.length >= feat.skillOrToolChoiceCount;
}

/** Les bonus doivent valoir +2/+1 ou +1/+1/+1, comme le back l'exige. */
export function areBonusesDone(composition: CharacterComposition): boolean {
  const bonuses = Object.values(composition.backgroundBonuses).filter(Boolean);
  const focused = bonuses.length === 2 && bonuses.includes(2) && bonuses.includes(1);

  return focused || (bonuses.length === 3 && bonuses.every((bonus) => bonus === 1));
}

export function chosenCantrips(composition: CharacterComposition): number {
  return composition.classCantrips.length + composition.featCantrips.length;
}

export function chosenSpells(composition: CharacterComposition): number {
  return composition.classSpells.length + composition.featSpells.length;
}
