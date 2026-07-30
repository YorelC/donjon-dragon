import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { Badge } from "@/shared/components/atoms/badge";
import type { Character } from "../types/character-schema";

const STAT_LABELS: Record<keyof Character["stats"], string> = {
  strength: "Force",
  dexterity: "Dextérité",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Sagesse",
  charisma: "Charisme",
};

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface CharacterSheetViewProps {
  character: Character;
}

export function CharacterSheetView({ character }: CharacterSheetViewProps) {
  const statKeys = Object.keys(STAT_LABELS) as (keyof Character["stats"])[];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{character.name}</span>
          <Badge variant="outline">Niveau {character.level}</Badge>
        </CardTitle>
        <p className="muted-text">
          {character.race} · {character.class}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 text-sm">
          <span>PV: {character.hitPoints}</span>
          <span>CA: {character.armorClass}</span>
          <span>Bonus de maîtrise: +{character.proficiencyBonus}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {statKeys.map((key) => (
            <div key={key} className="rounded-md border p-2 text-center">
              <div className="muted-text-xs">{STAT_LABELS[key]}</div>
              <div className="text-lg font-bold">{character.stats[key]}</div>
              <div className="muted-text-xs">{modifier(character.stats[key])}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
