import type { CatalogOriginFeat } from "@donjon-dragon/shared";
import type { WizardDraft } from "./wizard-draft";
import { featsOf, speciesOf, type StepContext } from "./wizard-lookups";

/**
 * Les prédicats de validité qui tiennent en plus d'une ligne. Les triviaux
 * restent dans la table des étapes, à côté de ce qu'ils décrivent.
 */
export function areFeatsDone(context: StepContext): boolean {
  if (speciesOf(context)?.grantsOriginFeatChoice && !context.draft.speciesFeat) return false;

  return featsOf(context).every((feat) => isFeatConfigured(feat, context.draft));
}

function isFeatConfigured(feat: CatalogOriginFeat, draft: WizardDraft): boolean {
  if (feat.spellcastingChoice && (!draft.spellList || !draft.spellcastingAbility)) {
    return false;
  }

  return draft.featSkills.length + draft.featTools.length >= feat.skillOrToolChoiceCount;
}

/** Les bonus doivent valoir +2/+1 ou +1/+1/+1, comme le back l'exige. */
export function areBonusesDone(draft: WizardDraft): boolean {
  const bonuses = Object.values(draft.backgroundBonuses).filter(Boolean);
  const focused = bonuses.length === 2 && bonuses.includes(2) && bonuses.includes(1);

  return focused || (bonuses.length === 3 && bonuses.every((bonus) => bonus === 1));
}

export function chosenCantrips(draft: WizardDraft): number {
  return draft.classCantrips.length + draft.featCantrips.length;
}

export function chosenSpells(draft: WizardDraft): number {
  return draft.classSpells.length + draft.featSpells.length;
}
