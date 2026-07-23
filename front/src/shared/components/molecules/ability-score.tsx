"use client"

import * as React from "react"
import { Button } from "@/shared/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card"
import { cn } from "@/shared/utils/utils"

// Types
type AbilityName = "FOR" | "DEX" | "CON" | "INT" | "SAG" | "CHA"

interface AbilityScoreProps {
  name: AbilityName
  value: number
  label?: string
  showRollButton?: boolean
  onRoll?: (name: AbilityName, value: number) => void
  className?: string
}

function getModifier(value: number): number {
  return Math.floor((value - 10) / 2)
}

function formatModifier(modifier: number): string {
  if (modifier >= 0) {
    return `+${modifier}`
  }
  return `${modifier}`
}

const abilityLabels: Record<AbilityName, string> = {
  FOR: "Force",
  DEX: "Dextérité",
  CON: "Constitution",
  INT: "Intelligence",
  SAG: "Sagesse",
  CHA: "Charisme",
}

function AbilityScore({
  name,
  value,
  label = abilityLabels[name],
  showRollButton = true,
  onRoll,
  className,
}: AbilityScoreProps) {
  const modifier = getModifier(value)

  const handleRoll = () => {
    if (onRoll) {
      onRoll(name, value)
    }
  }

  const colorMap: Record<AbilityName, string> = {
    FOR: "text-rose-500",
    DEX: "text-amber-500",
    CON: "text-emerald-500",
    INT: "text-blue-500",
    SAG: "text-teal-500",
    CHA: "text-purple-500",
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {showRollButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRoll}
            className="h-6 w-6"
            title={`Lancer un dé pour ${label}`}
          >
            <span className="text-lg font-bold">d20</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-3xl">{value}</span>
              <span className="text-sm text-muted-foreground">({formatModifier(modifier)})</span>
            </div>
          </div>
          <div className={`font-bold text-xl ${colorMap[name]}`}>
            {name}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { AbilityScore, getModifier, type AbilityName }
