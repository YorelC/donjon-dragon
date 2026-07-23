"use client"

import * as React from "react"
import { ScrollArea } from "@/shared/components/atoms/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/atoms/alert"
import { Badge } from "@/shared/components/atoms/badge"
import { cn } from "@/shared/utils/utils"

// Types
type CombatEventType = "damage" | "heal" | "attack" | "save" | "crit" | "fail"

interface CombatEvent {
  id: string
  timestamp: string
  type: CombatEventType
  source: string
  target: string
  message: string
  value?: number
}

interface CombatLogProps {
  events: CombatEvent[]
  maxEvents?: number
  className?: string
  showTimestamps?: boolean
}

function CombatLog({ events, maxEvents = 50, showTimestamps = true, className }: CombatLogProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new events are added
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector("[data-slot='scroll-area-viewport']")
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [events])

  // Get event type color
  const getEventTypeColor = (type: CombatEventType) => {
    switch (type) {
      case "crit":
        return "text-green-600 dark:text-green-400"
      case "fail":
        return "text-red-600 dark:text-red-400"
      case "damage":
        return "text-rose-600 dark:text-rose-400"
      case "heal":
        return "text-emerald-600 dark:text-emerald-400"
      case "attack":
        return "text-blue-600 dark:text-blue-400"
      case "save":
        return "text-amber-600 dark:text-amber-400"
      default:
        return "text-foreground"
    }
  }

  const getBadgeVariant = (type: CombatEventType) => {
    switch (type) {
      case "crit":
        return "default" as const
      case "fail":
        return "destructive" as const
      case "damage":
        return "outline" as const
      case "heal":
        return "secondary" as const
      case "attack":
        return "outline" as const
      case "save":
        return "outline" as const
      default:
        return "outline" as const
    }
  }

  const getAlertVariant = (type: CombatEventType) => {
    switch (type) {
      case "crit":
        return "default" as const
      case "fail":
        return "destructive" as const
      default:
        return "default" as const
    }
  }

  // Format the event display
  const formatEventMessage = (event: CombatEvent) => {
    let parts = []

    if (event.source) {
      parts.push(`<span class="font-semibold">${event.source}</span>`)
    }

    if (event.target && event.source) {
      parts.push(`→ <span class="font-semibold text-muted-foreground">${event.target}</span>`)
    }

    parts.push(`: ${event.message}`)

    if (event.value !== undefined) {
      if (event.type === "damage" || event.type === "crit") {
        parts.push(` <span class="font-bold text-rose-500">-${event.value} PV</span>`)
      } else if (event.type === "heal") {
        parts.push(` <span class="font-bold text-emerald-500">+${event.value} PV</span>`)
      } else if (event.value > 0) {
        parts.push(` <span class="font-bold">${event.value}</span>`)
      }
    }

    return parts.join(" ")
  }

  return (
    <div className={cn("w-full", className)}>
      <ScrollArea ref={scrollAreaRef} className="h-96 rounded-md border bg-card">
        <div className="p-4 space-y-3">
          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Aucun événement de combat pour le moment</p>
            </div>
          )}
          {events.slice(0, maxEvents).map((event) => (
            <Alert
              key={event.id}
              variant={getAlertVariant(event.type)}
              className="py-2"
            >
              {showTimestamps && (
                <div className="absolute right-2 top-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {event.timestamp}
                  </Badge>
                </div>
              )}
              <AlertTitle className={cn("flex items-center gap-2 text-sm", getEventTypeColor(event.type))}>
                <Badge variant={getBadgeVariant(event.type)} className="text-[10px]">
                  {event.type.toUpperCase()}
                </Badge>
                <span dangerouslySetInnerHTML={{ __html: formatEventMessage(event) }} />
              </AlertTitle>
            </Alert>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export { CombatLog, type CombatEvent, type CombatEventType }
