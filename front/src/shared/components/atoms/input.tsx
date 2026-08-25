import * as React from "react"

import { cn } from "@/shared/utils/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({
  className,
  type,
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 border border-input bg-white/[.02] px-3.5 py-2.5 text-[15px] text-foreground transition-[border-color] duration-[.18s] outline-none selection:bg-gold/25 selection:text-gold-selected file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-ink-faint disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-gold/14 disabled:text-ink-disabled",
        "focus-visible:border-gold/60",
        "aria-invalid:border-destructive/70",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
