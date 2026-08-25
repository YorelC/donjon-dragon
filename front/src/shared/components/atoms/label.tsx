import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/shared/utils/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "field-label flex items-center gap-2 leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-ink-disabled peer-disabled:cursor-not-allowed peer-disabled:text-ink-disabled",
        className
      )}
      {...props}
    />
  )
}

export { Label }
