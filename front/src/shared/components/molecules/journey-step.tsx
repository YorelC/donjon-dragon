import { cn } from "@/shared/utils/utils";

const CHECK_MARK = "✓";

/**
 * Le pastilleur d'étape est le seul cercle du système. Trois états, trois jeux
 * de valeurs : franchi, en cours, à venir (charte § 4).
 */
const STEP_STATES = {
  done: {
    row: "border-l-2 border-gold/85 bg-gold/9",
    marker: "border-gold/70 text-gold-value",
    label: "text-gold-selected",
    value: "text-gold-dim",
  },
  current: {
    row: "border-l-2 border-gold/85 bg-gold/9",
    marker: "border-gold/70 text-gold-value",
    label: "text-gold-selected",
    value: "text-gold-dim",
  },
  upcoming: {
    row: "border-l-2 border-transparent hover:bg-gold/7",
    marker: "border-gold/25 text-ink-faint",
    label: "text-ink-lede",
    value: "text-ink-faint",
  },
} as const;

interface JourneyStepData {
  index: number;
  label: string;
  value: string;
}

interface JourneyStepProps {
  step: JourneyStepData;
  state?: keyof typeof STEP_STATES;
  onSelect?: () => void;
}

function JourneyStep({ step, state = "upcoming", onSelect }: JourneyStepProps) {
  const tone = STEP_STATES[state];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={state === "current" ? "step" : undefined}
      className={cn(
        "grid w-full grid-cols-[30px_1fr] items-start gap-[11px] px-2 py-[9px] text-left transition-[background-color] duration-[.18s]",
        tone.row
      )}
    >
      <StepMarker index={step.index} state={state} />
      <StepIdentity step={step} state={state} />
    </button>
  );
}

function StepMarker({
  index,
  state,
}: {
  index: number;
  state: keyof typeof STEP_STATES;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-[26px] items-center justify-center rounded-full border text-xs",
        STEP_STATES[state].marker
      )}
    >
      {state === "done" ? CHECK_MARK : index}
    </span>
  );
}

function StepIdentity({
  step,
  state,
}: {
  step: JourneyStepData;
  state: keyof typeof STEP_STATES;
}) {
  const tone = STEP_STATES[state];

  return (
    <span className="flex flex-col gap-0.5">
      <span className={cn("font-display text-[13px] tracking-meta", tone.label)}>
        {step.label}
      </span>
      <span className={cn("text-note", tone.value)}>{step.value}</span>
    </span>
  );
}

export { JourneyStep };
export type { JourneyStepData };
