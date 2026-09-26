import { DiamondRule } from "@/shared/components/molecules/gold-rule";
import { OrnateCorners } from "@/shared/components/molecules/ornate-corners";
import { STEP_HINTS } from "../types/builder-step-texts";
import { stepLabel, type BuilderStep } from "../types/builder-steps";
import type { CharacterRecap } from "../types/character-recap";
import { BuilderFooterView } from "./builder-footer.view";
import type { BuilderScreen } from "./character-builder.view";
import { LeaveBuilderDialogView } from "./leave-builder-dialog.view";
import { RecapDrawerView } from "./recap-drawer.view";
import { StepContentView } from "./step-content.view";

/** Le nom de la zone de choix : le parcours e2e la cible par lui. */
export const STEP_REGION_LABEL = "Choix de l'étape";

interface BuilderStageViewProps {
  screen: BuilderScreen;
  backTo: string;
  recap: CharacterRecap;
}

/** La scène : l'étape ouverte, ses choix, et de quoi avancer ou reculer. */
export function BuilderStageView({ screen, backTo, recap }: BuilderStageViewProps) {
  return (
    <main className="panel-surface builder-stage">
      <OrnateCorners />
      <div className="builder-stage-body">
        <div className="flex items-center justify-between gap-4 pb-3.5">
          <LeaveBuilderDialogView backTo={backTo} />
          <RecapDrawerView recap={recap} />
        </div>
        <StepHeading step={screen.builder.step} />
        <section aria-label={STEP_REGION_LABEL} className="builder-selection lg:flex-1">
          <StepContentView screen={screen} />
        </section>
        <BuilderFooterView screen={screen} />
      </div>
    </main>
  );
}

function StepHeading({ step }: { step: BuilderStep }) {
  return (
    <header className="flex flex-col items-center gap-1.5 pb-[18px]">
      <h1 className="hero-title text-center">{stepLabel(step)}</h1>
      <div className="w-full max-w-[520px]">
        <DiamondRule />
      </div>
      <p className="max-w-[620px] text-center text-body text-pretty text-ink-help">
        {STEP_HINTS[step]}
      </p>
    </header>
  );
}
