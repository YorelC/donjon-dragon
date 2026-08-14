import { useState } from "react";
import type { DndCatalog } from "@donjon-dragon/shared";
import { EMPTY_DRAFT, type WizardDraft } from "../types/wizard-draft";
import { featQuotaOf, stepValidity, type StepValidity } from "./use-step-validity";

export const WIZARD_STEPS = [
  "species",
  "class",
  "background",
  "feats",
  "abilities",
  "spells",
  "equipment",
  "summary",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export const STEP_LABELS: Record<WizardStep, string> = {
  species: "Espèce",
  class: "Classe",
  background: "Historique",
  feats: "Dons",
  abilities: "Caractéristiques",
  spells: "Sorts",
  equipment: "Équipement",
  summary: "Récapitulatif",
};

export interface WizardState {
  step: WizardStep;
  steps: readonly WizardStep[];
  draft: WizardDraft;
  validity: StepValidity;
  canGoNext: boolean;
  isReachable: (step: WizardStep) => boolean;
  update: (patch: Partial<WizardDraft>) => void;
  goTo: (step: WizardStep) => void;
  next: () => void;
  previous: () => void;
}

/**
 * L'état du wizard : le brouillon en cours, l'étape affichée, et ce qui autorise
 * à avancer.
 *
 * Le parcours est imposé — on n'atteint une étape qu'après avoir validé les
 * précédentes — mais le retour en arrière reste libre : un joueur qui s'est
 * trompé d'espèce ne recommence pas son personnage.
 */
export function useCharacterWizard(catalog: DndCatalog | undefined): WizardState {
  const [draft, setDraft] = useState<WizardDraft>(() => EMPTY_DRAFT);
  const [step, setStep] = useState<WizardStep>("species");
  const steps = visibleSteps(catalog, draft);
  const validity = catalog ? stepValidity(catalog, draft) : NOTHING_VALID;
  const isReachable = (target: WizardStep) => reaches(steps, validity, target);

  return {
    step,
    steps,
    draft,
    validity,
    canGoNext: validity[step],
    isReachable,
    update: (patch) => setDraft((current) => ({ ...current, ...patch })),
    goTo: (target) => isReachable(target) && setStep(target),
    next: () => validity[step] && setStep(neighbour(steps, step, 1)),
    previous: () => setStep(neighbour(steps, step, -1)),
  };
}

const NOTHING_VALID = Object.fromEntries(
  WIZARD_STEPS.map((step) => [step, false]),
) as StepValidity;

/**
 * L'étape des sorts disparaît pour une classe qui n'en lance pas — sauf si un
 * don en accorde : un barbare acolyte porte Initié à la magie, et doit bien
 * choisir ses deux sorts mineurs quelque part.
 */
function visibleSteps(
  catalog: DndCatalog | undefined,
  draft: WizardDraft,
): readonly WizardStep[] {
  if (needsSpellStep(catalog, draft)) return WIZARD_STEPS;

  return WIZARD_STEPS.filter((step) => step !== "spells");
}

function needsSpellStep(catalog: DndCatalog | undefined, draft: WizardDraft): boolean {
  if (!catalog) return false;
  const chosen = catalog.classes.find((entry) => entry.key === draft.classKey);
  if (chosen?.spellcasting) return true;

  return featQuotaOf(catalog, draft) > 0;
}

/** Une étape est atteignable si toutes celles qui la précèdent sont valides. */
function reaches(
  steps: readonly WizardStep[],
  validity: StepValidity,
  target: WizardStep,
): boolean {
  const index = steps.indexOf(target);
  if (index <= 0) return true;

  return steps.slice(0, index).every((step) => validity[step]);
}

function neighbour(
  steps: readonly WizardStep[],
  current: WizardStep,
  offset: number,
): WizardStep {
  const index = steps.indexOf(current);
  const target = Math.min(Math.max(index + offset, 0), steps.length - 1);

  return steps[target] ?? current;
}
