import type { Ability } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Label } from "@/shared/components/atoms/label";
import { ABILITIES, ABILITY_LABELS, type WizardDraft } from "../types/wizard-draft";

interface AbilityAssignmentViewProps {
  available: readonly number[];
  draft: WizardDraft;
  onChange: (patch: Partial<WizardDraft>) => void;
}

/**
 * Répartir six valeurs sur six caractéristiques.
 *
 * Chaque valeur ne sert qu'une fois, mais rien n'est définitif : cliquer sur une
 * valeur déjà prise l'ÉCHANGE avec sa caractéristique actuelle, et un second
 * clic sur sa propre valeur la libère. La version précédente rendait toute
 * erreur irrattrapable.
 */
export function AbilityAssignmentView(props: AbilityAssignmentViewProps) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Cliquez sur une valeur pour l'attribuer. Une valeur déjà prise change de
        caractéristique, un second clic la libère.
      </p>
      {ABILITIES.map((ability) => (
        <AbilityRow key={ability} ability={ability} {...props} />
      ))}
    </div>
  );
}

interface AbilityRowProps extends AbilityAssignmentViewProps {
  ability: Ability;
}

function AbilityRow({ ability, available, draft, onChange }: AbilityRowProps) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[10rem_1fr] sm:items-center">
      <Label>{ABILITY_LABELS[ability]}</Label>
      <div className="flex flex-wrap gap-2">
        {available.map((score, slot) => (
          <Button
            key={`${score}-${slot}`}
            type="button"
            size="sm"
            variant={draft.assignment[ability] === slot ? "default" : "outline"}
            onClick={() => onChange({ assignment: place(draft, ability, slot) })}
          >
            {score}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Pose un rang sur une caractéristique. Si ce rang appartenait à une autre, les
 * deux échangent — sinon le joueur devrait tout défaire pour intervertir deux
 * valeurs.
 */
function place(
  draft: WizardDraft,
  ability: Ability,
  slot: number,
): WizardDraft["assignment"] {
  if (draft.assignment[ability] === slot) return without(draft.assignment, ability);

  const holder = ABILITIES.find((other) => draft.assignment[other] === slot);
  const freed = holder ? without(draft.assignment, holder) : draft.assignment;
  const swapped =
    holder && draft.assignment[ability] !== undefined
      ? { ...freed, [holder]: draft.assignment[ability] }
      : freed;

  return { ...swapped, [ability]: slot };
}

function without(
  assignment: WizardDraft["assignment"],
  ability: Ability,
): WizardDraft["assignment"] {
  const { [ability]: _removed, ...rest } = assignment;

  return rest;
}
