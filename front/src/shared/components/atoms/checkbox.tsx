"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/shared/utils/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-3 shrink-0 rotate-45 border border-gold/28 transition-[border-color,background-color] duration-[.18s] outline-none hover:border-gold/55 focus-visible:border-gold/60 disabled:cursor-not-allowed disabled:border-gold/14 aria-invalid:border-destructive/70 data-[state=checked]:border-gold/85 data-[state=checked]:bg-gold/80",
        className
      )}
      {...props}
    />
  )
}

export { Checkbox }
