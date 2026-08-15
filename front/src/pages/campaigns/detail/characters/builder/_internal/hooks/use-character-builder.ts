import { useEffect, useRef, useState } from "react";
import type { DndCatalog } from "@donjon-dragon/shared";
import { EMPTY_COMPOSITION, type CharacterComposition } from "../types/character-composition";
import type { StepContext } from "../types/builder-lookups";
import {
  isStepValid,
  stepProgress,
  visibleSteps,
  type StepProgress,
  type BuilderStep,
} from "../types/builder-steps";

export interface BuilderState {
  step: BuilderStep;
  steps: readonly BuilderStep[];
  composition: CharacterComposition;
  isValid: (step: BuilderStep) => boolean;
  isReachable: (step: BuilderStep) => boolean;
  progressOf: (step: BuilderStep) => StepProgress | null;
  canGoNext: boolean;
  isLastStep: boolean;
  update: (patch: Partial<CharacterComposition>) => void;
  goTo: (step: BuilderStep) => void;
  next: () => void;
  previous: () => void;
}

/**
 * L'état du builder : la composition en cours, l'étape affichée, et ce qui
 * autorise à avancer.
 *
 * La liste des étapes est dérivée de la composition à chaque rendu — un elfe
 * fait apparaître son lignage, un guerrier son Style de combat. Le parcours est
 * imposé vers l'avant et libre vers l'arrière : on n'atteint une étape qu'après
 * avoir validé les précédentes, mais on revient corriger quand on veut.
 *
 * `initial` pré-remplit le wizard en édition, une seule fois : un refetch
 * ultérieur (invalidation de cache) n'écrase jamais ce que l'utilisateur a
 * déjà modifié depuis l'hydratation.
 */
export function useCharacterBuilder(
  catalog: DndCatalog | undefined,
  initial: CharacterComposition | null = null,
): BuilderState {
  const [composition, setComposition] = useState<CharacterComposition>(() => EMPTY_COMPOSITION);
  const [step, setStep] = useState<BuilderStep>("species");
  const hydrated = useRef(false);

  useEffect(() => {
    if (!initial || hydrated.current) return;
    hydrated.current = true;
    setComposition(initial);
  }, [initial]);

  const update = (patch: Partial<CharacterComposition>) =>
    setComposition((current) => ({ ...current, ...patch }));

  if (!catalog) return idleState(composition, update);

  return activeState({ context: { catalog, composition }, step, setStep, update });
}

interface ActiveStateInput {
  context: StepContext;
  step: BuilderStep;
  setStep: (step: BuilderStep) => void;
  update: (patch: Partial<CharacterComposition>) => void;
}

function activeState({ context, step, setStep, update }: ActiveStateInput): BuilderState {
  const steps = visibleSteps(context);
  const isValid = (target: BuilderStep) => isStepValid(target, context);
  const isReachable = (target: BuilderStep) => reaches(steps, isValid, target);

  return {
    step,
    steps,
    composition: context.composition,
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
  composition: CharacterComposition,
  update: (patch: Partial<CharacterComposition>) => void,
): BuilderState {
  return {
    step: "species",
    steps: ["species"],
    composition,
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
  steps: readonly BuilderStep[],
  isValid: (step: BuilderStep) => boolean,
  target: BuilderStep,
): boolean {
  const index = steps.indexOf(target);
  if (index <= 0) return true;

  return steps.slice(0, index).every(isValid);
}

function neighbour(
  steps: readonly BuilderStep[],
  current: BuilderStep,
  offset: number,
): BuilderStep {
  const index = steps.indexOf(current);
  const target = Math.min(Math.max(index + offset, 0), steps.length - 1);

  return steps[target] ?? current;
}
