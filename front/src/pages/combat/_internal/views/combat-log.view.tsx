import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { ScrollArea } from "@/shared/components/atoms/scroll-area";
import { Badge } from "@/shared/components/atoms/badge";
import type { CombatLogEntry } from "../types/combat-schema";

interface CombatLogViewProps {
  entries: CombatLogEntry[];
}

export function CombatLogView({ entries }: CombatLogViewProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Journal de combat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2 pr-2">
            {entries.length === 0 && (
              <p className="text-sm italic text-muted-foreground">Aucun événement pour le moment</p>
            )}
            {entries.map((entry, index) => (
              <div key={index} className="flex items-start justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Round {entry.round}</Badge>
                  <span>
                    <span className="font-semibold">{entry.actorId}</span> · {entry.action}
                  </span>
                </div>
                <span className="text-muted-foreground">{entry.result}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
