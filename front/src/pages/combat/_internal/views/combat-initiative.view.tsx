import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { Badge } from "@/shared/components/atoms/badge";
import { cn } from "@/shared/utils/utils";
import type { Combatant } from "../types/combat-schema";

interface CombatInitiativeViewProps {
  participants: Combatant[];
  turnOrder: string[];
  currentTurnIndex: number;
  round: number;
}

export function CombatInitiativeView({
  participants,
  turnOrder,
  currentTurnIndex,
  round,
}: CombatInitiativeViewProps) {
  const byId = new Map(participants.map((p) => [p.id, p]));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Initiative</span>
          <Badge variant="outline">Round {round}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {turnOrder.map((id, index) => {
          const combatant = byId.get(id);
          if (!combatant) return null;
          const isActive = index === currentTurnIndex;

          return (
            <div
              key={id}
              className={cn(
                "flex items-center justify-between rounded-md border p-2",
                isActive && "border-primary bg-primary/10",
              )}
            >
              <span className="font-medium">{combatant.name}</span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Init: {combatant.initiative}</span>
                <span>
                  PV: {combatant.hitPoints.current}/{combatant.hitPoints.max}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
