import { useState } from "react";
import type { DndCatalog } from "@donjon-dragon/shared";
import { EMPTY_DRAFT, type WizardDraft } from "../types/wizard-draft";

export const WIZARD_STEPS = [
  "species",
  "class",
  "background",
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
  abilities: "Caractéristiques",
  spells: "Sorts",
  equipment: "Équipement",
  summary: "Récapitulatif",
};

export interface WizardState {
  step: WizardStep;
  steps: readonly WizardStep[];
  draft: WizardDraft;
  update: (patch: Partial<WizardDraft>) => void;
  goTo: (step: WizardStep) => void;
  next: () => void;
  previous: () => void;
}

/**
 * L'état du wizard : le brouillon en cours et l'étape affichée.
 *
 * L'étape des sorts disparaît pour une classe qui n'en lance pas — un barbare
 * n'a pas à traverser un écran vide pour arriver à son équipement.
 */
export function useCharacterWizard(catalog: DndCatalog | undefined): WizardState {
  const [draft, setDraft] = useState<WizardDraft>(() => EMPTY_DRAFT);
  const [step, setStep] = useState<WizardStep>("species");
  const steps = visibleSteps(catalog, draft);

  return {
    step,
    steps,
    draft,
    update: (patch) => setDraft((current) => ({ ...current, ...patch })),
    goTo: setStep,
    next: () => setStep(neighbour(steps, step, 1)),
    previous: () => setStep(neighbour(steps, step, -1)),
  };
}

function visibleSteps(
  catalog: DndCatalog | undefined,
  draft: WizardDraft,
): readonly WizardStep[] {
  if (castsSpells(catalog, draft)) return WIZARD_STEPS;

  return WIZARD_STEPS.filter((step) => step !== "spells");
}

function castsSpells(catalog: DndCatalog | undefined, draft: WizardDraft): boolean {
  const chosen = catalog?.classes.find((entry) => entry.key === draft.classKey);

  return chosen !== undefined && chosen.spellcasting !== null;
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
