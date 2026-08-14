import { Badge } from "@/shared/components/atoms/badge";
import { cn } from "@/shared/utils/utils";
import type { BuilderState } from "../hooks/use-character-builder";
import { stepLabel, type BuilderStep } from "../types/builder-steps";

interface BuilderStepsViewProps {
  builder: BuilderState;
}

/**
 * Le fil conducteur. Il s'allonge selon les choix — un elfe fait apparaître son
 * lignage, un guerrier son Style de combat — et dit d'un coup d'œil où l'on en
 * est : compteur quand l'étape en a un, coche quand elle est faite.
 */
export function BuilderStepsView({ builder }: BuilderStepsViewProps) {
  return (
    <nav className="grid content-start gap-1">
      {builder.steps.map((step) => (
        <TrailEntry key={step} step={step} builder={builder} />
      ))}
    </nav>
  );
}

interface TrailEntryProps {
  step: BuilderStep;
  builder: BuilderState;
}

function TrailEntry({ step, builder }: TrailEntryProps) {
  const reachable = builder.isReachable(step);
  const current = step === builder.step;

  return (
    <button
      type="button"
      disabled={!reachable}
      onClick={() => builder.goTo(step)}
      className={cn(
        "flex items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm transition-colors",
        current && "bg-primary/10 font-medium text-primary",
        !current && reachable && "hover:bg-muted",
        !reachable && "cursor-not-allowed text-muted-foreground/50",
      )}
    >
      <span className="flex items-center gap-2">
        <StepMark step={step} builder={builder} />
        {stepLabel(step)}
      </span>
      <StepCounter step={step} builder={builder} />
    </button>
  );
}

function StepMark({ step, builder }: TrailEntryProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 rounded-full",
        builder.isValid(step) ? "bg-primary" : "bg-muted-foreground/30",
      )}
    />
  );
}

function StepCounter({ step, builder }: TrailEntryProps) {
  const progress = builder.progressOf(step);
  if (!progress || progress.total === 0) return null;

  return (
    <Badge variant="outline" className="tabular-nums">
      {progress.chosen}/{progress.total}
    </Badge>
  );
}
