import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import type { CharacterComposition } from "../types/character-composition";

interface NameStepViewProps {
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

/** La dernière étape : le personnage est déjà complet, il ne lui manque qu'un nom. */
export function NameStepView({ composition, onChange }: NameStepViewProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="character-name">Nom du personnage</Label>
      <Input
        id="character-name"
        value={composition.name}
        onChange={(event) => onChange({ name: event.target.value })}
        autoFocus
      />
    </div>
  );
}
