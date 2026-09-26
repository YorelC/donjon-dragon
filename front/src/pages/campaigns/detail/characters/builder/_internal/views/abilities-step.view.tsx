import type { AbilityRoll, CatalogBackground } from "@donjon-dragon/shared";
import { POINT_BUY_BUDGET } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Separator } from "@/shared/components/atoms/separator";
import {
  availableScores,
  pointBuySpent,
  type CharacterComposition,
} from "../types/character-composition";
import { GAME_MASTER_ABILITY_METHODS, PLAYER_ABILITY_METHODS } from "../types/ability-methods";
import { AbilityGridView, type BonusPlan } from "./ability-grid.view";
import { ChoiceButtonView } from "./choice-button.view";

function rollLabel(step: AbilitiesStep): string {
  if (step.isRolling) return "Lancer en cours…";
  return step.roll ? "Relancer" : "Lancer les dés";
}

const PLANS: { key: BonusPlan; label: string }[] = [
  { key: "focused", label: "+2 et +1" },
  { key: "spread", label: "+1 partout" },
];

export interface AbilitiesStep {
  roll: AbilityRoll | null;
  onRoll: () => void;
  isRolling: boolean;
  background: CatalogBackground | null;
  canSetManually: boolean;
}

interface AbilitiesStepViewProps {
  step: AbilitiesStep;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

export function AbilitiesStepView(props: AbilitiesStepViewProps) {
  const { step, composition, onChange } = props;
  const plan = currentPlan(composition);

  return (
    <div className="grid gap-4">
      <MethodPicker {...props} />
      <RollBanner {...props} />
      <Separator />
      <BonusPlanPicker {...props} plan={plan} />
      <AbilityGridView
        grid={{
          control: {
            method: composition.abilityMethod,
            available: availableScores(composition),
            spent: pointBuySpent(composition),
            composition,
            onChange,
          },
          background: step.background,
          plan,
        }}
      />
    </div>
  );
}

function MethodPicker({ step, composition, onChange }: AbilitiesStepViewProps) {
  const methods = step.canSetManually ? GAME_MASTER_ABILITY_METHODS : PLAYER_ABILITY_METHODS;
  const current = methods.find((method) => method.key === composition.abilityMethod);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {methods.map((method) => (
          <ChoiceButtonView
            key={method.key}
            label={method.label}
            selected={composition.abilityMethod === method.key}
            onSelect={() => onChange({ abilityMethod: method.key, assignment: {} })}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{current?.hint}</p>
    </div>
  );
}

/** Le compteur seul, comme dans les jeux : ce qui reste, pas la comptabilité. */
function RollBanner({ step, composition }: AbilitiesStepViewProps) {
  if (composition.abilityMethod === "pointBuy") {
    const remaining = POINT_BUY_BUDGET - pointBuySpent(composition);

    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        Points restants
        <Badge variant={remaining < 0 ? "destructive" : "outline"}>
          {remaining} / {POINT_BUY_BUDGET}
        </Badge>
      </p>
    );
  }
  if (composition.abilityMethod !== "roll") return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={step.onRoll} disabled={step.isRolling}>
        {rollLabel(step)}
      </Button>
      {step.roll ? (
        <span className="text-sm text-muted-foreground">
          Tirage : {step.roll.totals.join(" · ")}
        </span>
      ) : null}
    </div>
  );
}

interface BonusPlanPickerProps extends AbilitiesStepViewProps {
  plan: BonusPlan;
}

function BonusPlanPicker({ step, plan, onChange }: BonusPlanPickerProps) {
  if (!step.background) return null;

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">Bonus de {step.background.name}</h3>
      <div className="flex flex-wrap gap-2">
        {PLANS.map((option) => (
          <ChoiceButtonView
            key={option.key}
            label={option.label}
            selected={plan === option.key}
            onSelect={() =>
              onChange({ backgroundBonuses: startPlan(step.background, option.key) })
            }
          />
        ))}
      </div>
    </div>
  );
}

function currentPlan(composition: CharacterComposition): BonusPlan {
  const bonuses = Object.values(composition.backgroundBonuses).filter(Boolean);

  return bonuses.length === 3 && bonuses.every((bonus) => bonus === 1)
    ? "spread"
    : "focused";
}

/** « +1 partout » ne laisse rien à choisir ; « +2 et +1 » repart d'une ardoise vide. */
function startPlan(background: CatalogBackground | null, plan: BonusPlan) {
  if (plan === "focused" || !background) return {};

  return Object.fromEntries(background.abilityBonuses.map((ability) => [ability, 1]));
}
