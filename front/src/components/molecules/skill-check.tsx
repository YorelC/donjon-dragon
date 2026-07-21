"use client"

import * as React from "react"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Badge } from "@/components/atoms/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { cn } from "@/lib/utils"

// Types
interface SkillCheckProps {
  skillName: string
  bonus: number
  className?: string
  onRoll?: (skillName: string, total: number, advantage: boolean, disadvantage: boolean) => void
}

interface RollResult {
  d20: number
  total: number
  advantage: boolean
  disadvantage: boolean
  crit?: "success" | "fail"
}

function SkillCheck({ skillName, bonus, className, onRoll }: SkillCheckProps) {
  const [result, setResult] = React.useState<RollResult | null>(null)
  const [advantage, setAdvantage] = React.useState(false)
  const [disadvantage, setDisadvantage] = React.useState(false)

  const handleRoll = () => {
    let d20: number
    let crit: "success" | "fail" | undefined = undefined

    if (advantage && disadvantage) {
      // Les deux s'annulent (règle optionnelle)
      d20 = Math.floor(Math.random() * 20) + 1
    } else if (advantage) {
      const roll1 = Math.floor(Math.random() * 20) + 1
      const roll2 = Math.floor(Math.random() * 20) + 1
      d20 = Math.max(roll1, roll2)
    } else if (disadvantage) {
      const roll1 = Math.floor(Math.random() * 20) + 1
      const roll2 = Math.floor(Math.random() * 20) + 1
      d20 = Math.min(roll1, roll2)
    } else {
      d20 = Math.floor(Math.random() * 20) + 1
    }

    // Critique automatique
    if (d20 === 20) crit = "success"
    else if (d20 === 1) crit = "fail"

    const total = d20 + bonus

    const newResult: RollResult = {
      d20,
      total,
      advantage,
      disadvantage,
      crit,
    }

    setResult(newResult)

    if (onRoll) {
      onRoll(skillName, total, advantage, disadvantage)
    }
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{skillName}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Bonus: {bonus >= 0 ? `+${bonus}` : bonus}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélecteur d'avantage/désavantage */}
        <div className="flex items-center gap-2">
          <Select
            value={advantage ? "advantage" : disadvantage ? "disadvantage" : "normal"}
            onValueChange={(value) => {
              setAdvantage(value === "advantage")
              setDisadvantage(value === "disadvantage")
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="advantage">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-medium">Avantage</span>
                  <Badge variant="outline" className="text-[10px]">2d20 max</Badge>
                </div>
              </SelectItem>
              <SelectItem value="disadvantage">
                <div className="flex items-center gap-2">
                  <span className="text-rose-500 font-medium">Désavantage</span>
                  <Badge variant="outline" className="text-[10px]">2d20 min</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bouton lancer */}
        <Button onClick={handleRoll} className="w-full h-12 text-lg">
          Lancer le dé
        </Button>

        {/* Résultat */}
        {result && (
          <div
            className={cn(
              "rounded-lg border p-4 text-center transition-all",
              result.crit === "success"
                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                : result.crit === "fail"
                  ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  : "bg-card border-border"
            )}
          >
            <div className="text-sm text-muted-foreground mb-2">Résultat du lancer</div>
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">Dé</span>
                <span className="text-2xl font-bold">{result.d20}</span>
              </div>
              {result.advantage && !result.disadvantage && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Supérieur</span>
                  <span className="text-2xl font-bold text-emerald-500">↑</span>
                </div>
              )}
              {!result.advantage && result.disadvantage && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Inférieur</span>
                  <span className="text-2xl font-bold text-rose-500">↓</span>
                </div>
              )}
              {(result.advantage && result.disadvantage) && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Annulé</span>
                  <span className="text-2xl font-bold text-amber-500">=</span>
                </div>
              )}
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold">{result.total}</span>
              <span className="text-sm text-muted-foreground">
                = {result.d20} + {bonus >= 0 ? `+${bonus}` : bonus}
              </span>
            </div>
            {result.crit && (
              <Badge
                variant={result.crit === "success" ? "default" : "destructive"}
                className="mt-2"
              >
                {result.crit === "success" ? "Réussite critique !" : "Échec critique"}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { SkillCheck }
