import type {
  JourneyStepData,
  JourneyStepState,
} from "@/shared/components/molecules/journey-step";
import type { BuilderState } from "../hooks/use-character-builder";
import type { StepContext } from "./builder-lookups";
import { stepSummaryOf } from "./builder-step-summaries";
import { stepLabel, type BuilderStep } from "./builder-steps";

const FULL_PERCENT = 100;

export interface JourneyEntry {
  step: BuilderStep;
  data: JourneyStepData;
  state: JourneyStepState;
}

export interface JourneyProgress {
  valid: number;
  total: number;
  percent: number;
}

export interface Journey {
  entries: JourneyEntry[];
  progress: JourneyProgress;
}

/** Le rail : chaque étape, son état, et la part du parcours déjà franchie. */
export function journeyOf(builder: BuilderState, context: StepContext): Journey {
  const valid = builder.steps.filter(builder.isValid).length;
  const total = builder.steps.length;

  return {
    entries: builder.steps.map((step, index) => entryOf(builder, context, { step, index })),
    progress: { valid, total, percent: total ? Math.round((valid * FULL_PERCENT) / total) : 0 },
  };
}

function entryOf(
  builder: BuilderState,
  context: StepContext,
  { step, index }: { step: BuilderStep; index: number },
): JourneyEntry {
  return {
    step,
    data: { index: index + 1, label: stepLabel(step), value: stepSummaryOf(step, context) },
    state: {
      progress: builder.isValid(step) ? "done" : "todo",
      position: step === builder.step ? "current" : "other",
      access: builder.isReachable(step) ? "open" : "locked",
    },
  };
}
