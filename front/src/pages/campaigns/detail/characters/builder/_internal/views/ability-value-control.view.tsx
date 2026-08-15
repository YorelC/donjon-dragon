import type { Ability, AbilityMethod } from "@donjon-dragon/shared";
import { POINT_BUY_BOUNDS, POINT_BUY_BUDGET, POINT_BUY_COSTS } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/atoms/select";
import { ABILITIES, ABILITY_LABELS, type CharacterComposition } from "../types/character-composition";

/** Radix refuse une valeur vide : il faut une sentinelle pour « aucune ». */
const NO_SCORE = "none";

export interface ValueControl {
  method: AbilityMethod;
  available: readonly number[];
  spent: number;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

interface AbilityValueControlProps {
  ability: Ability;
  control: ValueControl;
}

export function AbilityValueControlView({ ability, control }: AbilityValueControlProps) {
  if (control.method === "pointBuy") {
    return <PointBuyStepper ability={ability} control={control} />;
  }

  return <ScoreSelect ability={ability} control={control} />;
}

/**
 * Un menu plutôt que six boutons par caractéristique : à trente-six boutons
 * empilés, on ne trouvait plus quelle valeur allait où.
 *
 * Choisir une valeur déjà posée ailleurs **échange** les deux caractéristiques,
 * et l'option vide la libère — la version précédente ne savait rien annuler.
 */
function ScoreSelect({ ability, control }: AbilityValueControlProps) {
  const { composition, available } = control;
  const slot = composition.assignment[ability];

  return (
    <Select
      value={slot === undefined ? NO_SCORE : String(slot)}
      onValueChange={(value) =>
        control.onChange({ assignment: place(composition, ability, value) })
      }
    >
      <SelectTrigger className="w-24">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_SCORE}>—</SelectItem>
        {available.map((score, index) => (
          <ScoreOption
            key={`${score}-${index}`}
            index={index}
            score={score}
            holder={holderOf(composition, ability, index)}
          />
        ))}
      </SelectContent>
    </Select>
  );
}

function ScoreOption({ index, score, holder }: { index: number; score: number; holder?: Ability }) {
  const label = holder ? `${score} - ${ABILITY_LABELS[holder]}` : String(score);

  return <SelectItem value={String(index)}>{label}</SelectItem>;
}

function PointBuyStepper({ ability, control }: AbilityValueControlProps) {
  const { composition } = control;
  const score = composition.pointBuyScores[ability];

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={score <= POINT_BUY_BOUNDS.min}
        onClick={() => control.onChange({ pointBuyScores: shift(composition, ability, -1) })}
      >
        −
      </Button>
      <span className="w-8 text-center tabular-nums">{score}</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canIncrease(score, control.spent)}
        onClick={() => control.onChange({ pointBuyScores: shift(composition, ability, 1) })}
      >
        +
      </Button>
    </div>
  );
}

/** La table est cumulative : le pas suivant coûte la différence, pas son total. */
function canIncrease(score: number, spent: number): boolean {
  if (score >= POINT_BUY_BOUNDS.max) return false;
  const step = (POINT_BUY_COSTS[score + 1] ?? 0) - (POINT_BUY_COSTS[score] ?? 0);

  return spent + step <= POINT_BUY_BUDGET;
}

function shift(
  composition: CharacterComposition,
  ability: Ability,
  offset: number,
): CharacterComposition["pointBuyScores"] {
  return {
    ...composition.pointBuyScores,
    [ability]: composition.pointBuyScores[ability] + offset,
  };
}

function holderOf(
  composition: CharacterComposition,
  ability: Ability,
  slot: number,
): Ability | undefined {
  return ABILITIES.find(
    (other) => other !== ability && composition.assignment[other] === slot,
  );
}

function place(
  composition: CharacterComposition,
  ability: Ability,
  value: string,
): CharacterComposition["assignment"] {
  if (value === NO_SCORE) return without(composition.assignment, ability);
  const slot = Number(value);
  const holder = ABILITIES.find((other) => composition.assignment[other] === slot);
  const freed = holder ? without(composition.assignment, holder) : composition.assignment;
  const swapped =
    holder && composition.assignment[ability] !== undefined
      ? { ...freed, [holder]: composition.assignment[ability] }
      : freed;

  return { ...swapped, [ability]: slot };
}

function without(
  assignment: CharacterComposition["assignment"],
  ability: Ability,
): CharacterComposition["assignment"] {
  const { [ability]: _removed, ...rest } = assignment;

  return rest;
}
