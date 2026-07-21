"use client"

import * as React from "react"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/atoms/card"
import { Badge } from "@/components/atoms/badge"
import { cn } from "@/lib/utils"

// Types
type ItemType = "arme" | "armure" | "consommable" | "objets_magique" | "autre"

interface Item {
  id?: string
  name: string
  type: ItemType
  rarity: "commun" | "peu_commun" | "rare" | "très_rare" | "légendaire" | "mythique"
  description: string
  properties?: {
    damage?: string
    armorClass?: number
    weight?: string
    properties?: string[]
    quantity?: number
  }
}

const rarityColors: Record<Item["rarity"], string> = {
  commun: "bg-gray-400",
  peu_commun: "bg-green-500",
  rare: "bg-blue-500",
  très_rare: "bg-purple-500",
  légendaire: "bg-amber-500",
  mythique: "bg-rose-600",
}

const rarityLabels: Record<Item["rarity"], string> = {
  commun: "Commun",
  peu_commun: "Peu commun",
  rare: "Rare",
  très_rare: "Très rare",
  légendaire: "Légendaire",
  mythique: "Mythique",
}

const typeIcons: Record<ItemType, string> = {
  arme: "⚔️",
  armure: "🛡️",
  consommable: "🧪",
  objets_magique: "🔮",
  autre: "📦",
}

interface ItemCardProps {
  item: Item
  onUse?: (item: Item) => void
  className?: string
  showHeader?: boolean
}

function ItemCard({ item, onUse, className, showHeader = true }: ItemCardProps) {
  const handleUse = () => {
    if (onUse) {
      onUse(item)
    }
  }

  return (
    <Card className={cn("w-full max-w-sm overflow-hidden", className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <Badge className={cn("text-xs", rarityColors[item.rarity])}>
              {rarityLabels[item.rarity]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {typeIcons[item.type]} {item.type.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Description */}
        <div className="rounded-lg bg-card/50 p-3 text-sm text-muted-foreground">
          <p className="leading-relaxed">{item.description}</p>
        </div>

        {/* Propriétés techniques */}
        {item.properties && (
          <div className="space-y-2 text-sm">
            {item.properties.damage && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Dégâts:</span>
                <span className="font-semibold">{item.properties.damage}</span>
              </div>
            )}
            {item.properties.armorClass !== undefined && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Classe d'armure:</span>
                <span className="font-semibold">{item.properties.armorClass}</span>
              </div>
            )}
            {item.properties.weight && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Poids:</span>
                <span className="font-semibold">{item.properties.weight}</span>
              </div>
            )}
            {item.properties.quantity !== undefined && (
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">Quantité:</span>
                <span className="font-semibold">{item.properties.quantity}</span>
              </div>
            )}
            {item.properties.properties && item.properties.properties.length > 0 && (
              <div className="space-y-1">
                <span className="font-medium text-muted-foreground">Propriétés:</span>
                <div className="flex flex-wrap gap-1">
                  {item.properties.properties.map((prop, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px]">
                      {prop}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button onClick={handleUse} className="w-full">
          {item.type === "consommable" ? "Utiliser" : "Équiper"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export { ItemCard, type Item, type ItemType, rarityColors, rarityLabels }
