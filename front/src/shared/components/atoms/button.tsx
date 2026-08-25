import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/shared/utils/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border font-display text-xs tracking-label whitespace-nowrap uppercase transition-[color,border-color,background-color] duration-[.18s] outline-none focus-visible:border-gold/60 disabled:pointer-events-none disabled:border-gold/14 disabled:bg-white/[.01] disabled:text-ink-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-gold/50 bg-gold/10 text-gold-title hover:bg-gold/16",
        destructive:
          "border-destructive/55 bg-destructive/10 text-destructive hover:border-destructive/80",
        outline:
          "border-gold/22 text-gold/85 hover:border-gold/55 disabled:text-ink-disabled-soft",
        secondary:
          "border-gold/14 bg-surface text-ink-idle hover:border-gold/45 hover:text-gold-selected",
        ghost:
          "border-transparent text-gold/85 hover:bg-gold/8 hover:text-gold-selected",
        link: "border-transparent text-gold-link hover:text-gold-link-hover",
      },
      size: {
        default: "h-9 px-[18px] has-[>svg]:px-3",
        xs: "h-6 gap-1 px-2 text-meta has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
