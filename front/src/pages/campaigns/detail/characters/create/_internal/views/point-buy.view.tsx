import type { Ability } from "@donjon-dragon/shared";
import { POINT_BUY_BOUNDS, POINT_BUY_BUDGET, POINT_BUY_COSTS } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Label } from "@/shared/components/atoms/label";
import {
  ABILITIES,
  ABILITY_LABELS,
  pointBuySpent,
  type WizardDraft,
} from "../types/wizard-draft";

interface PointBuyViewProps {
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

/**
 * L'achat de points : 27 points, des scores de 8 à 15, et un coût qui casse à
 * 14. Un incrément qui ferait dépasser le budget est simplement désactivé —
 * plutôt que de laisser composer un achat que le serveur refusera.
 */
export function PointBuyView({ draft, onChange }: PointBuyViewProps) {
  const spent = pointBuySpent(draft);

  return (
    <div className="grid gap-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        Points restants
        <Badge variant={spent > POINT_BUY_BUDGET ? "destructive" : "outline"}>
          {POINT_BUY_BUDGET - spent} / {POINT_BUY_BUDGET}
        </Badge>
      </p>
      {ABILITIES.map((ability) => (
        <PointBuyRow key={ability} ability={ability} spent={spent} draft={draft} onChange={onChange} />
      ))}
    </div>
  );
}

interface PointBuyRowProps extends PointBuyViewProps {
  ability: Ability;
  spent: number;
}

function PointBuyRow({ ability, spent, draft, onChange }: PointBuyRowProps) {
  const score = draft.pointBuyScores[ability];

  return (
    <div className="grid gap-1.5 sm:grid-cols-[10rem_1fr] sm:items-center">
      <Label>{ABILITY_LABELS[ability]}</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={score <= POINT_BUY_BOUNDS.min}
          onClick={() => onChange({ pointBuyScores: shift(draft, ability, -1) })}
        >
          −
        </Button>
        <span className="w-8 text-center tabular-nums">{score}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canIncrease({ score, spent })}
          onClick={() => onChange({ pointBuyScores: shift(draft, ability, 1) })}
        >
          +
        </Button>
        <span className="text-xs text-muted-foreground">
          coût {POINT_BUY_COSTS[score] ?? 0}
        </span>
      </div>
    </div>
  );
}

function canIncrease({ score, spent }: { score: number; spent: number }): boolean {
  if (score >= POINT_BUY_BOUNDS.max) return false;
  const extra = (POINT_BUY_COSTS[score + 1] ?? 0) - (POINT_BUY_COSTS[score] ?? 0);

  return spent + extra <= POINT_BUY_BUDGET;
}

function shift(
  draft: WizardDraft,
  ability: Ability,
  offset: number,
): WizardDraft["pointBuyScores"] {
  return { ...draft.pointBuyScores, [ability]: draft.pointBuyScores[ability] + offset };
}
