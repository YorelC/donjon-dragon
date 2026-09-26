import { POINT_BUY_BUDGET } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { pointBuySpent, type CharacterComposition } from "../types/character-composition";
import type { AbilitiesStep } from "./abilities-step.view";

interface RollBannerViewProps {
  step: AbilitiesStep;
  composition: CharacterComposition;
}

/** Le compteur seul, comme dans les jeux : ce qui reste, pas la comptabilité. */
export function RollBannerView({ step, composition }: RollBannerViewProps) {
  if (composition.abilityMethod === "pointBuy") {
    const remaining = POINT_BUY_BUDGET - pointBuySpent(composition);

    return (
      <p className="flex items-baseline justify-between px-1 section-label">
        Points restants
        <span className={remaining < 0 ? "text-destructive" : "text-gold-link"}>
          {remaining} / {POINT_BUY_BUDGET}
        </span>
      </p>
    );
  }
  if (composition.abilityMethod !== "roll") return null;

  return (
    <div className="panel-flat flex flex-wrap items-center gap-[9px] px-[13px] py-[11px]">
      <Button type="button" size="sm" onClick={step.onRoll} disabled={step.isRolling}>
        {rollLabel(step)}
      </Button>
      {step.roll ? <RollResults totals={step.roll.totals} /> : null}
    </div>
  );
}

/** Les six totaux du tirage, en jetons : ce qu'il reste à répartir se lit d'un coup d'œil. */
function RollResults({ totals }: { totals: readonly number[] }) {
  return (
    <>
      <span className="sheet-caption">Résultats</span>
      {totals.map((total, rank) => (
        <RollChip key={`${rank}-${total}`} total={total} />
      ))}
    </>
  );
}

function RollChip({ total }: { total: number }) {
  return (
    <span className="flex size-[34px] items-center justify-center border border-gold/40 font-display text-[15px] text-gold-title">
      {total}
    </span>
  );
}

function rollLabel(step: AbilitiesStep): string {
  if (step.isRolling) return "Lancer en cours…";
  return step.roll ? "Relancer" : "Lancer les dés";
}
