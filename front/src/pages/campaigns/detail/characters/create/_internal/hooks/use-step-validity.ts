import type { DndCatalog } from "@donjon-dragon/shared";
import type { WizardStep } from "./use-character-wizard";
import { isFullyAssigned, type WizardDraft } from "../types/wizard-draft";

export type StepValidity = Record<WizardStep, boolean>;

/**
 * Ce qui autorise à passer à l'étape suivante.
 *
 * On ne bloque que sur ce qui rendrait la fiche fausse ou ferait échouer la
 * finalisation côté serveur : espèce et lignage, comptes de compétences, six
 * caractéristiques. Le reste — outils, langues — reste libre tant que le back
 * ne le vérifie pas non plus.
 */
export function stepValidity(catalog: DndCatalog, draft: WizardDraft): StepValidity {
  return {
    species: isSpeciesDone(catalog, draft),
    class: isClassDone(catalog, draft),
    background: isBackgroundDone(draft),
    feats: areFeatsDone(catalog, draft),
    abilities: isFullyAssigned(draft),
    spells: areSpellsDone(catalog, draft),
    equipment: true,
    summary: true,
  };
}

function isSpeciesDone(catalog: DndCatalog, draft: WizardDraft): boolean {
  const species = catalog.species.find((entry) => entry.key === draft.speciesKey);
  if (!species) return false;
  if (species.lineage && draft.lineageKey === null) return false;

  return draft.speciesSkills.length === (species.skillChoice?.count ?? 0);
}

function isClassDone(catalog: DndCatalog, draft: WizardDraft): boolean {
  const characterClass = catalog.classes.find((entry) => entry.key === draft.classKey);
  if (!characterClass) return false;
  if (draft.classSkills.length !== characterClass.skillChoice.count) return false;

  return draft.expertise.length === characterClass.expertiseCount;
}

/** Les bonus doivent valoir +2/+1 ou +1/+1/+1, comme le back l'exige. */
function isBackgroundDone(draft: WizardDraft): boolean {
  if (!draft.backgroundKey) return false;
  const bonuses = Object.values(draft.backgroundBonuses).filter(Boolean);
  const focused = bonuses.length === 2 && bonuses.includes(2) && bonuses.includes(1);
  const spread = bonuses.length === 3 && bonuses.every((bonus) => bonus === 1);

  return focused || spread;
}

function areFeatsDone(catalog: DndCatalog, draft: WizardDraft): boolean {
  const species = catalog.species.find((entry) => entry.key === draft.speciesKey);
  if (species?.grantsOriginFeatChoice && !draft.speciesFeat) return false;

  return featsOf(catalog, draft).every((feat) => isFeatConfigured(feat, draft));
}

export function featsOf(catalog: DndCatalog, draft: WizardDraft) {
  const background = catalog.backgrounds.find((entry) => entry.key === draft.backgroundKey);
  const keys = [background?.originFeat, draft.speciesFeat].filter(Boolean);

  return catalog.originFeats.filter((feat) => keys.includes(feat.key));
}

function isFeatConfigured(
  feat: ReturnType<typeof featsOf>[number],
  draft: WizardDraft,
): boolean {
  if (feat.spellcastingChoice && (!draft.spellList || !draft.spellcastingAbility)) {
    return false;
  }
  const chosenProficiencies = draft.featSkills.length + draft.featTools.length;

  return chosenProficiencies >= feat.skillOrToolChoiceCount;
}

/** Les sorts de classe et ceux d'Initié à la magie se comptent séparément. */
function areSpellsDone(catalog: DndCatalog, draft: WizardDraft): boolean {
  const spellcasting = catalog.classes.find(
    (entry) => entry.key === draft.classKey,
  )?.spellcasting;
  const classQuota = (spellcasting?.cantripsKnown ?? 0) + (spellcasting?.spellsPrepared ?? 0);
  const featQuota = featQuotaOf(catalog, draft);

  return draft.classSpells.length >= classQuota && draft.featSpells.length >= featQuota;
}

export function featQuotaOf(catalog: DndCatalog, draft: WizardDraft): number {
  const choice = featsOf(catalog, draft).find((feat) => feat.spellcastingChoice)
    ?.spellcastingChoice;

  return choice ? choice.cantripsKnown + choice.spellsPrepared : 0;
}
