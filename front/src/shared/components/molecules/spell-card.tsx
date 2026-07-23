"use client"

import * as React from "react"
import { Button } from "@/shared/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/shared/components/atoms/card"
import { Badge } from "@/shared/components/atoms/badge"
import { cn } from "@/shared/utils/utils"

// Types
type SpellSchool = "ENCHANTEMENT" | "ILLUSION" | "ÉVOCATION" | "NÉCROMANCIE" | "TRANSMUTATION" | "ABJURATION" | "DIVINATION" | "CONJURATION"

interface Spell {
  name: string
  level: number
  school: SpellSchool
  castTime: string
  range: string
  components: string
  duration: string
  description: string
  higherLevels?: string
}

const schoolColors: Record<SpellSchool, string> = {
  ENCHANTEMENT: "bg-pink-500",
  ILLUSION: "bg-indigo-500",
  ÉVOCATION: "bg-red-500",
  NÉCROMANCIE: "bg-slate-600",
  TRANSMUTATION: "bg-green-500",
  ABJURATION: "bg-blue-500",
  DIVINATION: "bg-yellow-500",
  CONJURATION: "bg-teal-500",
}

const schoolShort: Record<SpellSchool, string> = {
  ENCHANTEMENT: "ENC",
  ILLUSION: "ILL",
  ÉVOCATION: "ÉVO",
  NÉCROMANCIE: "NÉC",
  TRANSMUTATION: "TRA",
  ABJURATION: "ABJ",
  DIVINATION: "DIV",
  CONJURATION: "CON",
}

interface SpellCardProps {
  spell: Spell
  onCast?: (spell: Spell) => void
  className?: string
}

function SpellLevelBadge({ level }: { level: number }) {
  const levelMap = ["Cantrip", "1er", "2e", "3e", "4e", "5e", "6e", "7e", "8e", "9e"]
  const levelText = levelMap[Math.min(level, 9)] || `${level}e`

  let levelColor = "bg-gray-500"
  if (level === 0) levelColor = "bg-amber-400"
  else if (level <= 2) levelColor = "bg-emerald-500"
  else if (level <= 4) levelColor = "bg-blue-500"
  else if (level <= 6) levelColor = "bg-purple-500"
  else levelColor = "bg-rose-600"

  return (
    <Badge className={cn("text-xs", levelColor)}>
      {levelText}
    </Badge>
  )
}

function SpellCard({ spell, onCast, className }: SpellCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const handleCast = () => {
    if (onCast) {
      onCast(spell)
    }
  }

  return (
    <Card className={cn("w-full max-w-md overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{spell.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <SpellLevelBadge level={spell.level} />
              <Badge
                variant="outline"
                className={cn("text-xs border px-2 py-0.5", schoolColors[spell.school])}
              >
                {schoolShort[spell.school]}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations techniques */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground">Temps d'incantation:</span>
            <p>{spell.castTime}</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground">Portée:</span>
            <p>{spell.range}</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground">Composantes:</span>
            <p>{spell.components}</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground">Durée:</span>
            <p>{spell.duration}</p>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-lg bg-card/50 p-3 text-sm text-muted-foreground">
          <p className="leading-relaxed">{spell.description}</p>
        </div>

        {/* Niveaux supérieurs */}
        {spell.higherLevels && isExpanded && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Niveaux supérieurs: </span>
            <p className="mt-1 text-muted-foreground">{spell.higherLevels}</p>
          </div>
        )}

        {/* Bouton afficher/cacher niveaux supérieurs */}
        {spell.higherLevels && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 text-xs"
          >
            {isExpanded ? "Masquer les niveaux supérieurs" : "Afficher les niveaux supérieurs"}
          </Button>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button onClick={handleCast} className="w-full">
          Lancer le sort
        </Button>
      </CardFooter>
    </Card>
  )
}

export { SpellCard, type Spell, schoolColors, schoolShort }
