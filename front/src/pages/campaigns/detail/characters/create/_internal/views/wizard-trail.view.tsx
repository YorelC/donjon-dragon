import { Badge } from "@/shared/components/atoms/badge";
import { cn } from "@/shared/utils/utils";
import type { WizardState } from "../hooks/use-character-wizard";
import { stepLabel, type WizardStep } from "../types/wizard-steps";

interface WizardTrailViewProps {
  wizard: WizardState;
}

/**
 * Le fil conducteur. Il s'allonge selon les choix — un elfe fait apparaître son
 * lignage, un guerrier son Style de combat — et dit d'un coup d'œil où l'on en
 * est : compteur quand l'étape en a un, coche quand elle est faite.
 */
export function WizardTrailView({ wizard }: WizardTrailViewProps) {
  return (
    <nav className="grid content-start gap-1">
      {wizard.steps.map((step) => (
        <TrailEntry key={step} step={step} wizard={wizard} />
      ))}
    </nav>
  );
}

interface TrailEntryProps {
  step: WizardStep;
  wizard: WizardState;
}

function TrailEntry({ step, wizard }: TrailEntryProps) {
  const reachable = wizard.isReachable(step);
  const current = step === wizard.step;

  return (
    <button
      type="button"
      disabled={!reachable}
      onClick={() => wizard.goTo(step)}
      className={cn(
        "flex items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm transition-colors",
        current && "bg-primary/10 font-medium text-primary",
        !current && reachable && "hover:bg-muted",
        !reachable && "cursor-not-allowed text-muted-foreground/50",
      )}
    >
      <span className="flex items-center gap-2">
        <StepMark step={step} wizard={wizard} />
        {stepLabel(step)}
      </span>
      <StepCounter step={step} wizard={wizard} />
    </button>
  );
}

function StepMark({ step, wizard }: TrailEntryProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 rounded-full",
        wizard.isValid(step) ? "bg-primary" : "bg-muted-foreground/30",
      )}
    />
  );
}

function StepCounter({ step, wizard }: TrailEntryProps) {
  const progress = wizard.progressOf(step);
  if (!progress || progress.total === 0) return null;

  return (
    <Badge variant="outline" className="tabular-nums">
      {progress.chosen}/{progress.total}
    </Badge>
  );
}
