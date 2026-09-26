import { useId } from "react";
import { cn } from "@/shared/utils/utils";

const CHECK_MARK = "✓";

/**
 * Le pastilleur d'étape est le seul cercle du système (charte § 4). Deux axes
 * indépendants : la pastille dit si l'étape est franchie, le liseré dit si
 * c'est l'étape ouverte. Une étape franchie peut être l'étape ouverte.
 */
const PROGRESS_TONES = {
  done: "border-gold/70 text-gold-value",
  todo: "border-gold/25 text-ink-faint",
} as const;

const POSITION_TONES = {
  current: {
    row: "border-gold/85 bg-gold/9",
    label: "text-gold-selected",
    value: "text-gold-dim",
  },
  other: {
    row: "border-transparent hover:bg-gold/7",
    label: "text-ink-lede",
    value: "text-ink-faint",
  },
} as const;

interface JourneyStepData {
  index: number;
  label: string;
  value: string;
}

interface JourneyStepState {
  progress: keyof typeof PROGRESS_TONES;
  position: keyof typeof POSITION_TONES;
  /** Une étape verrouillée attend que les précédentes soient franchies. */
  access: "open" | "locked";
}

interface JourneyStepProps {
  step: JourneyStepData;
  state: JourneyStepState;
  onSelect?: () => void;
}

/** Le nom accessible est le libellé seul : la valeur le décrit, sans le renommer. */
function JourneyStep({ step, state, onSelect }: JourneyStepProps) {
  const ids = { label: useId(), value: useId() };

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={state.access === "locked"}
      aria-current={state.position === "current" ? "step" : undefined}
      aria-labelledby={ids.label}
      aria-describedby={ids.value}
      className={cn(
        "grid w-full grid-cols-[30px_1fr] items-start gap-[11px] border-l-2 px-2 py-[9px] text-left transition-[background-color] duration-[.18s] disabled:cursor-not-allowed disabled:opacity-50",
        POSITION_TONES[state.position].row
      )}
    >
      <StepMarker index={step.index} state={state} />
      <StepIdentity step={step} state={state} ids={ids} />
    </button>
  );
}

function StepMarker({ index, state }: { index: number; state: JourneyStepState }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-px flex size-[26px] items-center justify-center rounded-full border text-xs",
        PROGRESS_TONES[state.progress]
      )}
    >
      {state.progress === "done" ? CHECK_MARK : index}
    </span>
  );
}

interface StepIdentityProps {
  step: JourneyStepData;
  state: JourneyStepState;
  ids: { label: string; value: string };
}

function StepIdentity({ step, state, ids }: StepIdentityProps) {
  const tone = POSITION_TONES[state.position];

  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span id={ids.label} className={cn("font-display text-[13px] tracking-meta", tone.label)}>
        {step.label}
      </span>
      <span id={ids.value} className={cn("truncate text-note", tone.value)}>
        {step.value}
      </span>
    </span>
  );
}

export { JourneyStep };
export type { JourneyStepData, JourneyStepState };
