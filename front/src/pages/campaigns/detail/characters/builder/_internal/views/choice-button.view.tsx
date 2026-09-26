import { Button } from "@/shared/components/atoms/button";
import type { ChoiceActions } from "@/shared/components/molecules/choice-tile";

interface ChoiceButtonProps {
  label: string;
  selected: boolean;
  actions: ChoiceActions;
}

/**
 * Une option d'une barre de choix du builder : méthode de génération, plan de
 * bonus, don, liste de sorts, caractéristique d'incantation. Retenue, elle prend
 * l'or plein ; au repos, la surface neutre des options de la maquette.
 */
export function ChoiceButtonView({ label, selected, actions }: ChoiceButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "secondary"}
      aria-pressed={selected}
      className="h-auto min-h-8 grow py-1.5 whitespace-normal"
      onClick={actions.select}
      onMouseEnter={actions.preview}
      onFocus={actions.preview}
    >
      {label}
    </Button>
  );
}
