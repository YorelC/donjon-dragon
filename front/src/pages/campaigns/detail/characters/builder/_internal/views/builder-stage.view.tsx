import { DiamondRule } from "@/shared/components/molecules/gold-rule";
import { OrnateCorners } from "@/shared/components/molecules/ornate-corners";
import { stepDetailOf } from "../types/step-detail";
import type { DetailSource } from "../types/step-detail-parts";
import { STEP_HINTS } from "../types/builder-step-texts";
import { stepLabel, type BuilderStep } from "../types/builder-steps";
import type { CharacterRecap } from "../types/character-recap";
import { BuilderFooterView } from "./builder-footer.view";
import type { BuilderScreen } from "./character-builder.view";
import { LeaveBuilderDialogView } from "./leave-builder-dialog.view";
import { RecapDrawerView } from "./recap-drawer.view";
import { StepContentView } from "./step-content.view";
import { StepDetailView } from "./step-detail.view";

/** Le nom de la zone de choix : le parcours e2e la cible par lui. */
export const STEP_REGION_LABEL = "Choix de l'étape";

interface BuilderStageViewProps {
  screen: BuilderScreen;
  backTo: string;
  recap: CharacterRecap;
}

/** La scène : l'étape ouverte, ses choix à gauche, sa fiche détaillée à droite. */
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
        <StepSplit screen={screen} />
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

/** Quitter la liste rend la fiche à ce qui est retenu : le survol ne fait que prêter. */
function StepSplit({ screen }: { screen: BuilderScreen }) {
  return (
    <div className="builder-split">
      <section
        aria-label={STEP_REGION_LABEL}
        className="builder-selection"
        onMouseLeave={screen.focus.clear}
      >
        <StepContentView screen={screen} />
      </section>
      <div className="flex flex-col lg:min-h-0">
        <StepDetailView detail={stepDetailOf(screen.builder.step, detailSourceOf(screen))} />
        <BuilderFooterView screen={screen} />
      </div>
    </div>
  );
}

function detailSourceOf(screen: BuilderScreen): DetailSource {
  return {
    context: screen.context,
    focusKey: screen.focus.key,
    spells: screen.spells,
    preview: screen.preview,
    items: screen.items,
  };
}
