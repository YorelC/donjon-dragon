import { Button } from "@/shared/components/atoms/button";
import type { BuilderScreen } from "./character-builder.view";

/** Précédent, puis Suivant — ou la création elle-même à la dernière étape. */
export function BuilderFooterView({ screen }: { screen: BuilderScreen }) {
  const { builder } = screen;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4">
      <Button type="button" variant="outline" onClick={builder.previous}>
        Précédent
      </Button>
      {builder.isLastStep ? <FinishButton screen={screen} /> : (
        <Button type="button" disabled={!builder.canGoNext} onClick={builder.next}>
          Suivant
        </Button>
      )}
    </div>
  );
}

function FinishButton({ screen }: { screen: BuilderScreen }) {
  return (
    <Button
      type="button"
      disabled={!screen.canFinish || screen.isFinishing}
      onClick={screen.onFinish}
    >
      {screen.isFinishing ? "Enregistrement..." : screen.finishLabel}
    </Button>
  );
}
