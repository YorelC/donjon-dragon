import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/shared/utils/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center border border-gold/28 transition-[border-color,background-color] duration-[.18s] outline-none focus-visible:border-gold/60 disabled:cursor-not-allowed disabled:border-gold/14 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:border-gold/75 data-[state=checked]:bg-gold/16 data-[state=unchecked]:bg-surface",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=checked]:bg-gold/85 data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-gold/28"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
