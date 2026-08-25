import * as React from "react"

import { cn } from "@/shared/utils/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full border border-input bg-white/[.02] px-3.5 py-2.5 text-[15px]/[1.6] text-foreground transition-[border-color] duration-[.18s] outline-none placeholder:text-ink-faint focus-visible:border-gold/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-gold/14 disabled:text-ink-disabled aria-invalid:border-destructive/70",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
