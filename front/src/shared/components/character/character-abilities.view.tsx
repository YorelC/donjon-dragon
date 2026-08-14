import type { Ability, ComputedCharacter } from "@donjon-dragon/shared";
import { Card, CardContent } from "@/shared/components/atoms/card";
import { formatValue } from "./character-vitals.view";

const ABILITY_LABELS: Record<Ability, string> = {
  strength: "Force",
  dexterity: "Dextérité",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Sagesse",
  charisma: "Charisme",
};

const ABILITIES = Object.keys(ABILITY_LABELS) as Ability[];

interface CharacterAbilitiesViewProps {
  sheet: ComputedCharacter;
}

export function CharacterAbilitiesView({ sheet }: CharacterAbilitiesViewProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {ABILITIES.map((ability) => (
        <AbilityCard key={ability} ability={ability} sheet={sheet} />
      ))}
    </div>
  );
}

interface AbilityCardProps {
  ability: Ability;
  sheet: ComputedCharacter;
}

function AbilityCard({ ability, sheet }: AbilityCardProps) {
  const { score, modifier } = sheet.abilities[ability];
  const save = sheet.savingThrows[ability];

  return (
    <Card>
      <CardContent className="grid gap-0.5 p-3 text-center">
        <p className="text-xs uppercase text-muted-foreground">
          {ABILITY_LABELS[ability]}
        </p>
        <p className="text-2xl font-semibold">{score}</p>
        <p className="text-sm">{formatValue(modifier, true)}</p>
        <p className="text-xs text-muted-foreground">
          JS {formatValue(save.modifier, true)}
          {save.proficient ? " ●" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
