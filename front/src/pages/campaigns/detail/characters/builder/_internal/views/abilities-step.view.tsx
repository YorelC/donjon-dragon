import type { AbilityRoll, CatalogBackground } from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import {
  availableScores,
  pointBuySpent,
  type CharacterComposition,
} from "../types/character-composition";
import { GAME_MASTER_ABILITY_METHODS, PLAYER_ABILITY_METHODS } from "../types/ability-methods";
import { AbilityGridView, type BonusPlan } from "./ability-grid.view";
import { ChoiceButtonView } from "./choice-button.view";
import { RollBannerView } from "./roll-banner.view";

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
    <div className="flex flex-col gap-4">
      <MethodPicker {...props} />
      <RollBannerView step={step} composition={composition} />
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
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {methods.map((method) => (
          <ChoiceButtonView
            key={method.key}
            label={method.label}
            selected={composition.abilityMethod === method.key}
            actions={{ select: () => onChange({ abilityMethod: method.key, assignment: {} }) }}
          />
        ))}
      </div>
      <p className="fine-print">{current?.hint}</p>
    </div>
  );
}

interface BonusPlanPickerProps extends AbilitiesStepViewProps {
  plan: BonusPlan;
}

function BonusPlanPicker({ step, plan, onChange }: BonusPlanPickerProps) {
  if (!step.background) return null;

  return (
    <div className="flex flex-col gap-3">
      <SectionHeading label={`Bonus de ${step.background.name}`} />
      <div className="flex flex-wrap gap-2">
        {PLANS.map((option) => (
          <ChoiceButtonView
            key={option.key}
            label={option.label}
            selected={plan === option.key}
            actions={{
              select: () => onChange({ backgroundBonuses: startPlan(step.background, option.key) }),
            }}
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
