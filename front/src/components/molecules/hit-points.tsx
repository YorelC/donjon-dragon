"use client"

import * as React from "react"
import { Progress } from "@/components/atoms/progress"
import { cn } from "@/lib/utils"

// Types
interface HitPointsProps {
  current: number
  max: number
  showNumbers?: boolean
  className?: string
}

function HitPoints({ current, max, showNumbers = true, className }: HitPointsProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100))

  // Déterminer la couleur selon les seuils
  let progressColor = "bg-green-500" // > 50%
  if (percentage <= 50) {
    progressColor = "bg-orange-500" // > 25%
  }
  if (percentage <= 25) {
    progressColor = "bg-red-500" // ≤ 25%
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showNumbers && (
        <div className="flex justify-between text-sm font-medium">
          <span className="text-muted-foreground">Points de vie</span>
          <span className={percentage <= 25 ? "text-red-500" : percentage <= 50 ? "text-orange-500" : "text-green-500"}>
            {current} / {max}
          </span>
        </div>
      )}
      <Progress value={percentage} className={`h-2.5 ${progressColor}`} />
    </div>
  )
}

export { HitPoints }
