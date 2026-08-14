import type { AbilityMethod, AbilityRoll } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Separator } from "@/shared/components/atoms/separator";
import { availableScores, type WizardDraft } from "../types/wizard-draft";
import { AbilityAssignmentView } from "./ability-assignment.view";
import { PointBuyView } from "./point-buy.view";

const METHODS: { key: AbilityMethod; label: string; hint: string }[] = [
  {
    key: "standardArray",
    label: "Valeurs standard",
    hint: "15, 14, 13, 12, 10, 8 — à répartir comme vous voulez.",
  },
  {
    key: "pointBuy",
    label: "Acquisition par points",
    hint: "27 points à dépenser, des scores de 8 à 15.",
  },
  {
    key: "roll",
    label: "Lancer les dés",
    hint: "Quatre d6, on garde les trois meilleurs, six fois. Le tirage se fait sur le serveur.",
  },
];

export interface AbilitiesStep {
  roll: AbilityRoll | null;
  isRolling: boolean;
  onRoll: () => void;
}

interface AbilitiesStepViewProps {
  step: AbilitiesStep;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

export function AbilitiesStepView(props: AbilitiesStepViewProps) {
  return (
    <div className="grid gap-4">
      <MethodPicker {...props} />
      <Separator />
      <MethodContent {...props} />
    </div>
  );
}

function MethodPicker({ draft, onChange }: AbilitiesStepViewProps) {
  const current = METHODS.find((method) => method.key === draft.abilityMethod);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {METHODS.map((method) => (
          <Button
            key={method.key}
            type="button"
            size="sm"
            variant={draft.abilityMethod === method.key ? "default" : "outline"}
            onClick={() => onChange({ abilityMethod: method.key, assignment: {} })}
          >
            {method.label}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{current?.hint}</p>
    </div>
  );
}

function MethodContent(props: AbilitiesStepViewProps) {
  if (props.draft.abilityMethod === "pointBuy") {
    return <PointBuyView draft={props.draft} onChange={props.onChange} />;
  }
  if (props.draft.abilityMethod === "standardArray") {
    return (
      <AbilityAssignmentView
        available={availableScores(props.draft, [])}
        draft={props.draft}
        onChange={props.onChange}
      />
    );
  }

  return <RollMethod {...props} />;
}

function RollMethod({ step, draft, onChange }: AbilitiesStepViewProps) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={step.onRoll} disabled={step.isRolling}>
          {step.isRolling ? "Les dés roulent..." : step.roll ? "Relancer" : "Lancer les dés"}
        </Button>
        {step.roll ? <RollDetail roll={step.roll} /> : null}
      </div>
      {step.roll ? (
        <AbilityAssignmentView
          available={availableScores(draft, step.roll.totals)}
          draft={draft}
          onChange={onChange}
        />
      ) : null}
    </div>
  );
}

function RollDetail({ roll }: { roll: AbilityRoll }) {
  return (
    <div className="flex w-full flex-wrap gap-2">
      {roll.totals.map((total, index) => (
        <Badge key={`${total}-${index}`} variant="outline">
          {total} <span className="ml-1 opacity-60">({roll.dice[index]?.join("+")})</span>
        </Badge>
      ))}
    </div>
  );
}
