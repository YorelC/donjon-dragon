import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@/shared/utils/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "size-3 shrink-0 rotate-45 border border-gold/28 transition-[border-color] duration-[.18s] outline-none hover:border-gold/55 focus-visible:border-gold/60 disabled:cursor-not-allowed disabled:border-gold/14 aria-invalid:border-destructive/70 data-[state=checked]:border-gold/85",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="block size-full bg-gold/80"
      />
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
