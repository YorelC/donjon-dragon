import type { Ability } from "@donjon-dragon/shared";
import { Input } from "@/shared/components/atoms/input";
import { ABILITY_LABELS } from "../types/character-composition";
import type { ValueControl } from "./ability-value-control.view";

const MANUAL_SCORE_MIN = 3;
const MANUAL_SCORE_MAX = 18;

interface ManualScoreInputProps {
  ability: Ability;
  control: ValueControl;
}

/** La saisie du MJ : une valeur de base libre, bornée aux extrêmes du manuel. */
export function ManualScoreInputView({ ability, control }: ManualScoreInputProps) {
  return (
    <Input
      aria-label={ABILITY_LABELS[ability]}
      className="w-24"
      type="number"
      min={MANUAL_SCORE_MIN}
      max={MANUAL_SCORE_MAX}
      value={control.composition.manualScores[ability]}
      onChange={(event) => updateManualScore(ability, event.currentTarget.value, control)}
    />
  );
}

function updateManualScore(ability: Ability, value: string, control: ValueControl): void {
  const score = Number(value);
  if (!Number.isInteger(score)) return;
  const bounded = Math.min(Math.max(score, MANUAL_SCORE_MIN), MANUAL_SCORE_MAX);
  control.onChange({
    manualScores: { ...control.composition.manualScores, [ability]: bounded },
  });
}
