import { STEP_DESCRIPTORS } from "./builder-step-descriptors";
import type { StepContext } from "./builder-lookups";

export const BUILDER_STEPS = [
  "species",
  "lineage",
  "class",
  "classSkills",
  "expertise",
  "fightingStyle",
  "classOrder",
  "background",
  "feats",
  "abilities",
  "cantrips",
  "spells",
  "equipment",
  "name",
] as const;

export type BuilderStep = (typeof BUILDER_STEPS)[number];

export interface StepProgress {
  chosen: number;
  total: number;
}

export function visibleSteps(context: StepContext): BuilderStep[] {
  return STEP_DESCRIPTORS.filter((step) => step.isVisible(context)).map((step) => step.key);
}

export function stepLabel(step: BuilderStep): string {
  return STEP_DESCRIPTORS.find((entry) => entry.key === step)?.label ?? step;
}

export function isStepValid(step: BuilderStep, context: StepContext): boolean {
  return STEP_DESCRIPTORS.find((entry) => entry.key === step)?.isValid(context) ?? true;
}

export function stepProgress(step: BuilderStep, context: StepContext): StepProgress | null {
  const progress = STEP_DESCRIPTORS.find((entry) => entry.key === step)?.progress;

  return progress ? progress(context) : null;
}
