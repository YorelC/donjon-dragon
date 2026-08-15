import { Button } from "@/shared/components/atoms/button";

interface ChoiceButtonProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Une option d'une barre de choix du builder : méthode de génération, plan de
 * bonus, liste de sorts, caractéristique d'incantation. Elle porte son nom pour
 * que les lignes de ces listes ne soient pas anonymes.
 */
export function ChoiceButtonView({ label, selected, onSelect }: ChoiceButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "outline"}
      onClick={onSelect}
    >
      {label}
    </Button>
  );
}
