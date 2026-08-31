import type { CatalogOriginFeat } from "@donjon-dragon/shared";
import { CHARACTER_NAME_RULES } from "@donjon-dragon/shared";
import type { CharacterComposition } from "./character-composition";
import { featsOf, speciesOf, type StepContext } from "./builder-lookups";

/** Le Commun est accordé d'office : les deux emplacements sont des choix. */
export const STANDARD_LANGUAGE_QUOTA = 2;

/**
 * Les langues du joueur, dédoublonnées et bornées à ce que le catalogue offre :
 * ni un doublon, ni une langue rare, ni le Commun ne remplit un emplacement.
 */
export function chosenLanguages({ catalog, composition }: StepContext): string[] {
  const offered = catalog.languages.standard.map((entry) => entry.key);

  return [...new Set(composition.standardLanguages)].filter((language) =>
    offered.includes(language),
  );
}

export function hasValidName(name: string): boolean {
  const trimmed = name.trim().length;

  return trimmed >= CHARACTER_NAME_RULES.min && trimmed <= CHARACTER_NAME_RULES.max;
}

/**
 * Les prédicats de validité qui tiennent en plus d'une ligne. Les triviaux
 * restent dans la table des étapes, à côté de ce qu'ils décrivent.
 */
/**
 * L'étape du lignage porte deux choix quand l'espèce est de celles qui lancent
 * un sort mineur : la lignée, et la caractéristique qui l'incante.
 */
export function hasChosenLineage(context: StepContext): boolean {
  if (context.composition.lineageKey === null) return false;
  if (!speciesOf(context)?.lineage?.spellcastingAbilityOptions?.length) return true;

  return context.composition.lineageSpellcastingAbility !== null;
}

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
