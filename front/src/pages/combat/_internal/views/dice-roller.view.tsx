import { useState } from "react";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/atoms/select";
import { Badge } from "@/shared/components/atoms/badge";
import { DiceTypeEnum, type DiceType } from "../types/combat-schema";
import type { RollDiceResult } from "../queries/use-dice";

interface DiceRollerViewProps {
  onRoll: (payload: { diceType: DiceType; count: number; modifier: number }) => void;
  result?: RollDiceResult | null;
  isRolling?: boolean;
}

export function DiceRollerView({ onRoll, result, isRolling }: DiceRollerViewProps) {
  const [diceType, setDiceType] = useState<DiceType>("d20");
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Lancer de dés</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-1.5">
            <Label>Dé</Label>
            <Select value={diceType} onValueChange={(value) => setDiceType(value as DiceType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DiceTypeEnum.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Nombre</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Modificateur</Label>
            <Input
              type="number"
              value={modifier}
              onChange={(e) => setModifier(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <Button
          className="w-full"
          disabled={isRolling}
          onClick={() => onRoll({ diceType, count, modifier })}
        >
          {isRolling ? "Lancer..." : "Lancer les dés"}
        </Button>

        {result && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {result.count}
                {result.die}
                {result.modifier !== 0 && `${result.modifier > 0 ? "+" : ""}${result.modifier}`}
              </p>
              <Badge variant="outline">Total: {result.total}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Lancers: [{result.rolls.join(", ")}]</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
