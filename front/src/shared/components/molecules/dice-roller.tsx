"use client"

import * as React from "react"
import { Button } from "@/shared/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/shared/components/atoms/card"
import { Input } from "@/shared/components/atoms/input"
import { ScrollArea } from "@/shared/components/atoms/scroll-area"
import { Badge } from "@/shared/components/atoms/badge"
import { cn } from "@/shared/utils/utils"

// Types
interface RollResult {
  id: string
  diceType: number
  quantity: number
  modifier: number
  rolls: number[]
  total: number
  timestamp: string
  crit?: "success" | "fail"
}

interface DiceButtonProps {
  diceType: number
  onClick: (type: number) => void
  label?: string
}

function DiceButton({ diceType, onClick, label }: DiceButtonProps) {
  const labelMap = {
    4: "D4",
    6: "D6",
    8: "D8",
    10: "D10",
    12: "D12",
    20: "D20",
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onClick(diceType)}
      className="flex-1 h-12 text-lg font-semibold"
    >
      {label || labelMap[diceType as keyof typeof labelMap] || `D${diceType}`}
    </Button>
  )
}

function DiceRoller() {
  const [diceType, setDiceType] = React.useState(20)
  const [quantity, setQuantity] = React.useState(1)
  const [modifier, setModifier] = React.useState(0)
  const [lastResult, setLastResult] = React.useState<RollResult | null>(null)
  const [history, setHistory] = React.useState<RollResult[]>([])

  const rollDice = () => {
    const rolls = []
    for (let i = 0; i < quantity; i++) {
      rolls.push(Math.floor(Math.random() * diceType) + 1)
    }

    const total = rolls.reduce((a, b) => a + b, 0) + modifier

    // Critique automatique pour D20
    let crit: "success" | "fail" | undefined
    if (diceType === 20 && rolls.includes(20)) {
      crit = "success"
    } else if (diceType === 20 && rolls.includes(1) && quantity === 1) {
      crit = "fail"
    }

    const result: RollResult = {
      id: Date.now().toString(),
      diceType,
      quantity,
      modifier,
      rolls,
      total,
      timestamp: new Date().toLocaleTimeString(),
      crit,
    }

    setLastResult(result)
    setHistory((prev) => [result, ...prev].slice(0, 20))
  }

  const diceTypes = [4, 6, 8, 10, 12, 20]

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Lancer de dés</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Boutons de types de dés */}
        <div className="grid grid-cols-3 gap-2">
          {diceTypes.map((type) => (
            <DiceButton
              key={type}
              diceType={type}
              label={type === 20 ? "D20" : undefined}
              onClick={setDiceType}
            />
          ))}
        </div>

        {/* Contrôles */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Quantité:</span>
            <Input
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Modificateur:</span>
            <Input
              type="number"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <Badge variant="secondary" className="text-xs">
              Bonus/Malus
            </Badge>
          </div>
        </div>

        {/* Résultat */}
        {lastResult && (
          <div className={`rounded-lg border p-4 ${lastResult.crit ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {lastResult.quantity}D{lastResult.diceType} {lastResult.modifier !== 0 && `${lastResult.modifier > 0 ? "+" : ""}${lastResult.modifier}`}
                </p>
                <p className="text-2xl font-bold mt-1">{lastResult.total}</p>
              </div>
              {lastResult.crit && (
                <Badge variant={lastResult.crit === "success" ? "default" : "destructive"} className="text-xs">
                  {lastResult.crit === "success" ? "Critique !" : "Échec critique"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Lancers: [{lastResult.rolls.join(", ")}]
            </p>
          </div>
        )}

        {/* Bouton lancer */}
        <Button onClick={rollDice} className="w-full h-12 text-lg">
          Lancer
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <p className="text-sm font-medium">Historique récent:</p>
        <ScrollArea className="h-32 w-full">
          <div className="space-y-2 pr-2">
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Aucun lancer pour le moment</p>
            )}
            {history.map((roll) => (
              <div key={roll.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-8 justify-center">
                    D{roll.diceType}
                  </Badge>
                  <span className="text-muted-foreground">{roll.timestamp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    [{roll.rolls.join(", ")}{roll.modifier !== 0 && `${roll.modifier > 0 ? "+" : ""}${roll.modifier}`}]
                  </span>
                  <span className="font-semibold">{roll.total}</span>
                  {roll.crit && (
                    <Badge
                      variant={roll.crit === "success" ? "default" : "destructive"}
                      className="text-[10px] px-1"
                    >
                      {roll.crit === "success" ? "CRIT" : "ECHEC"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardFooter>
    </Card>
  )
}

export { DiceRoller }
