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
import { ABILITIES, type CharacterDraft } from "../types/character-draft";

/** Radix refuse une valeur vide : il faut une sentinelle pour « aucune ». */
const NO_SCORE = "none";

export interface ValueControl {
  method: AbilityMethod;
  available: readonly number[];
  spent: number;
  draft: CharacterDraft;
  onChange: (patch: Partial<CharacterDraft>) => void;
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
  const { draft, available } = control;
  const slot = draft.assignment[ability];

  return (
    <Select
      value={slot === undefined ? NO_SCORE : String(slot)}
      onValueChange={(value) =>
        control.onChange({ assignment: place(draft, ability, value) })
      }
    >
      <SelectTrigger className="w-24">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_SCORE}>—</SelectItem>
        {available.map((score, index) => (
          <SelectItem key={`${score}-${index}`} value={String(index)}>
            {score}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PointBuyStepper({ ability, control }: AbilityValueControlProps) {
  const { draft } = control;
  const score = draft.pointBuyScores[ability];

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={score <= POINT_BUY_BOUNDS.min}
        onClick={() => control.onChange({ pointBuyScores: shift(draft, ability, -1) })}
      >
        −
      </Button>
      <span className="w-8 text-center tabular-nums">{score}</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canIncrease(score, control.spent)}
        onClick={() => control.onChange({ pointBuyScores: shift(draft, ability, 1) })}
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
  draft: CharacterDraft,
  ability: Ability,
  offset: number,
): CharacterDraft["pointBuyScores"] {
  return { ...draft.pointBuyScores, [ability]: draft.pointBuyScores[ability] + offset };
}

function place(
  draft: CharacterDraft,
  ability: Ability,
  value: string,
): CharacterDraft["assignment"] {
  if (value === NO_SCORE) return without(draft.assignment, ability);
  const slot = Number(value);
  const holder = ABILITIES.find((other) => draft.assignment[other] === slot);
  const freed = holder ? without(draft.assignment, holder) : draft.assignment;
  const swapped =
    holder && draft.assignment[ability] !== undefined
      ? { ...freed, [holder]: draft.assignment[ability] }
      : freed;

  return { ...swapped, [ability]: slot };
}

function without(
  assignment: CharacterDraft["assignment"],
  ability: Ability,
): CharacterDraft["assignment"] {
  const { [ability]: _removed, ...rest } = assignment;

  return rest;
}
