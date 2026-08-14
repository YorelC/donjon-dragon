import { useState } from "react";
import type { DndCatalog } from "@donjon-dragon/shared";
import { EMPTY_DRAFT, type WizardDraft } from "../types/wizard-draft";
import type { StepContext } from "../types/wizard-lookups";
import {
  isStepValid,
  stepProgress,
  visibleSteps,
  type StepProgress,
  type WizardStep,
} from "../types/wizard-steps";

export interface WizardState {
  step: WizardStep;
  steps: readonly WizardStep[];
  draft: WizardDraft;
  isValid: (step: WizardStep) => boolean;
  isReachable: (step: WizardStep) => boolean;
  progressOf: (step: WizardStep) => StepProgress | null;
  canGoNext: boolean;
  isLastStep: boolean;
  update: (patch: Partial<WizardDraft>) => void;
  goTo: (step: WizardStep) => void;
  next: () => void;
  previous: () => void;
}

/**
 * L'état du wizard : le brouillon, l'étape affichée, et ce qui autorise à
 * avancer.
 *
 * La liste des étapes est dérivée du brouillon à chaque rendu — un elfe fait
 * apparaître son lignage, un guerrier son Style de combat. Le parcours est
 * imposé vers l'avant et libre vers l'arrière : on n'atteint une étape qu'après
 * avoir validé les précédentes, mais on revient corriger quand on veut.
 */
export function useCharacterWizard(catalog: DndCatalog | undefined): WizardState {
  const [draft, setDraft] = useState<WizardDraft>(() => EMPTY_DRAFT);
  const [step, setStep] = useState<WizardStep>("species");

  const update = (patch: Partial<WizardDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  if (!catalog) return idleState(draft, update);

  return activeState({ context: { catalog, draft }, step, setStep, update });
}

interface ActiveStateInput {
  context: StepContext;
  step: WizardStep;
  setStep: (step: WizardStep) => void;
  update: (patch: Partial<WizardDraft>) => void;
}

function activeState({ context, step, setStep, update }: ActiveStateInput): WizardState {
  const steps = visibleSteps(context);
  const isValid = (target: WizardStep) => isStepValid(target, context);
  const isReachable = (target: WizardStep) => reaches(steps, isValid, target);

  return {
    step,
    steps,
    draft: context.draft,
    isValid,
    isReachable,
    progressOf: (target) => stepProgress(target, context),
    canGoNext: isValid(step),
    isLastStep: steps.at(-1) === step,
    update,
    goTo: (target) => isReachable(target) && setStep(target),
    next: () => isValid(step) && setStep(neighbour(steps, step, 1)),
    previous: () => setStep(neighbour(steps, step, -1)),
  };
}

/** Tant que le catalogue n'est pas là, rien n'est franchissable ni mesurable. */
function idleState(
  draft: WizardDraft,
  update: (patch: Partial<WizardDraft>) => void,
): WizardState {
  return {
    step: "species",
    steps: ["species"],
    draft,
    isValid: () => false,
    isReachable: () => false,
    progressOf: () => null,
    canGoNext: false,
    isLastStep: false,
    update,
    goTo: () => undefined,
    next: () => undefined,
    previous: () => undefined,
  };
}

/** Une étape est atteignable si toutes celles qui la précèdent sont valides. */
function reaches(
  steps: readonly WizardStep[],
  isValid: (step: WizardStep) => boolean,
  target: WizardStep,
): boolean {
  const index = steps.indexOf(target);
  if (index <= 0) return true;

  return steps.slice(0, index).every(isValid);
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
