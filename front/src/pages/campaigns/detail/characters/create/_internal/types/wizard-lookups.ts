import type { CatalogClass, CatalogOriginFeat, DndCatalog } from "@donjon-dragon/shared";
import type { WizardDraft } from "./wizard-draft";

export interface StepContext {
  catalog: DndCatalog;
  draft: WizardDraft;
}

export function speciesOf({ catalog, draft }: StepContext) {
  return catalog.species.find((entry) => entry.key === draft.speciesKey);
}

export function classOf({ catalog, draft }: StepContext): CatalogClass | undefined {
  return catalog.classes.find((entry) => entry.key === draft.classKey);
}

export function backgroundOf({ catalog, draft }: StepContext) {
  return catalog.backgrounds.find((entry) => entry.key === draft.backgroundKey);
}

const FIGHTING_STYLE_KEY = "fightingStyle";

export function fightingStyleChoiceOf(context: StepContext) {
  return classOf(context)?.level1Choices.find((choice) => choice.key === FIGHTING_STYLE_KEY);
}

/** L'Ordre divin du clerc ou l'Ordre primitif du druide, s'il y en a un. */
export function orderChoiceOf(context: StepContext) {
  return classOf(context)?.level1Choices.find((choice) => choice.key !== FIGHTING_STYLE_KEY);
}

/** Les dons du personnage : celui de l'historique, et celui que l'espèce accorde. */
export function featsOf(context: StepContext): CatalogOriginFeat[] {
  const keys = [backgroundOf(context)?.originFeat, context.draft.speciesFeat].filter(Boolean);

  return context.catalog.originFeats.filter((feat) => keys.includes(feat.key));
}

export function featSpellcastingOf(context: StepContext) {
  return featsOf(context).find((feat) => feat.spellcastingChoice)?.spellcastingChoice;
}

/**
 * Les deux moitiés mystiques des Ordres accordent un sort mineur de plus. Le
 * back reste l'autorité — il applique `grants.extraCantrips` ; le front n'a
 * besoin de ce compte que pour dimensionner le sélecteur.
 */
const MYSTIC_ORDER_OPTIONS = ["thaumaturge", "magician"];

function extraCantripsOf({ draft }: StepContext): number {
  return draft.classOrder && MYSTIC_ORDER_OPTIONS.includes(draft.classOrder) ? 1 : 0;
}

/** Les sorts de la classe et ceux d'un don s'additionnent, sans se confondre. */
export function cantripQuotaOf(context: StepContext): number {
  const fromClass = classOf(context)?.spellcasting?.cantripsKnown ?? 0;
  const fromFeat = featSpellcastingOf(context)?.cantripsKnown ?? 0;

  return fromClass + fromFeat + (fromClass > 0 ? extraCantripsOf(context) : 0);
}

export function spellQuotaOf(context: StepContext): number {
  const fromClass = classOf(context)?.spellcasting?.spellsPrepared ?? 0;

  return fromClass + (featSpellcastingOf(context)?.spellsPrepared ?? 0);
}
