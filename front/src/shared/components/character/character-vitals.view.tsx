import type { ComputedCharacter, ResolvedValue } from "@donjon-dragon/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";

interface CharacterVitalsViewProps {
  sheet: ComputedCharacter;
}

/**
 * Les valeurs dérivées, chacune avec ses origines. Une CA de 16 sans « Cotte de
 * mailles » à côté est un nombre que le joueur ne peut pas vérifier.
 */
export function CharacterVitalsView({ sheet }: CharacterVitalsViewProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <VitalCard label="Points de vie" value={sheet.maxHitPoints} />
      <VitalCard label="Classe d'armure" value={sheet.armorClass} />
      <VitalCard label="Initiative" value={sheet.initiative} signed />
      <VitalCard label="Vitesse" value={sheet.speed} unit=" m" />
    </div>
  );
}

interface VitalCardProps {
  label: string;
  value: ResolvedValue;
  signed?: boolean;
  unit?: string;
}

function VitalCard({ label, value, signed, unit }: VitalCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">
          {formatValue(value.value, signed)}
          {unit ?? ""}
        </p>
        <p className="text-xs text-muted-foreground">{value.sources.join(" · ")}</p>
      </CardContent>
    </Card>
  );
}

export function formatValue(value: number, signed?: boolean): string {
  return signed && value >= 0 ? `+${value}` : String(value);
}
