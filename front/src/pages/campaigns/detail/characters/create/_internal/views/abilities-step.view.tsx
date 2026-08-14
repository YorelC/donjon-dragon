import type { Ability, AbilityRoll } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Label } from "@/shared/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/atoms/select";
import { ABILITY_LABELS } from "../types/wizard-draft";
import type { WizardDraft } from "../types/wizard-draft";

const ABILITIES = Object.keys(ABILITY_LABELS) as Ability[];

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

export function AbilitiesStepView({ step, draft, onChange }: AbilitiesStepViewProps) {
  return (
    <div className="grid gap-4">
      <RollBanner step={step} />
      {step.roll ? (
        <AssignmentGrid roll={step.roll} draft={draft} onChange={onChange} />
      ) : null}
    </div>
  );
}

function RollBanner({ step }: { step: AbilitiesStep }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={step.onRoll} disabled={step.isRolling}>
        {step.isRolling ? "Les dés roulent..." : "Lancer les dés"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Quatre d6, on garde les trois meilleurs, six fois. Le tirage se fait sur le
        serveur.
      </p>
      {step.roll ? <RollDetail roll={step.roll} /> : null}
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

interface AssignmentGridProps {
  roll: AbilityRoll;
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

function AssignmentGrid({ roll, draft, onChange }: AssignmentGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ABILITIES.map((ability) => (
        <AbilitySlot
          key={ability}
          ability={ability}
          roll={roll}
          draft={draft}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

interface AbilitySlotProps extends AssignmentGridProps {
  ability: Ability;
}

function AbilitySlot({ ability, roll, draft, onChange }: AbilitySlotProps) {
  return (
    <div className="grid gap-1.5">
      <Label>{ABILITY_LABELS[ability]}</Label>
      <Select
        value={valueOf(draft, ability)}
        onValueChange={(value) => onChange({ assignment: assign(draft, ability, value) })}
      >
        <SelectTrigger>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {availableFor(roll, draft, ability).map((option) => (
            <SelectItem key={option.slot} value={String(option.slot)}>
              {option.total}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Chaque valeur du tirage ne sert qu'une fois : on adresse les emplacements par
 * leur rang, pas par leur total — deux 14 sont deux emplacements distincts.
 */
interface RollSlot {
  slot: number;
  total: number;
}

function availableFor(roll: AbilityRoll, draft: WizardDraft, ability: Ability): RollSlot[] {
  const taken = new Set(
    Object.entries(draft.assignment)
      .filter(([key]) => key !== ability)
      .map(([, slot]) => slot),
  );

  return roll.totals
    .map((total, slot) => ({ slot, total }))
    .filter((option) => !taken.has(option.slot));
}

function valueOf(draft: WizardDraft, ability: Ability): string {
  const slot = draft.assignment[ability];

  return slot === undefined ? "" : String(slot);
}

function assign(draft: WizardDraft, ability: Ability, value: string) {
  return { ...draft.assignment, [ability]: Number(value) };
}
