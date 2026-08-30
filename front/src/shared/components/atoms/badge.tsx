import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/shared/utils/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-[7px] overflow-hidden border px-3 py-1.5 text-xs tracking-value whitespace-nowrap transition-[color,border-color,background-color] duration-[.18s] focus-visible:border-gold/60 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-gold/24 bg-gold/5 text-ink-help",
        secondary: "border-gold/14 bg-surface text-ink-idle",
        destructive: "border-destructive/55 bg-destructive/10 text-destructive",
        outline: "border-gold/24 text-gold-value",
        stamp:
          "border-gold/24 bg-gold/5 px-[11px] py-[5px] text-overline tracking-title text-gold-value uppercase",
        ghost: "border-transparent text-ink-help [a&]:hover:text-gold-selected",
        link: "border-transparent text-gold-link [a&]:hover:text-gold-link-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
