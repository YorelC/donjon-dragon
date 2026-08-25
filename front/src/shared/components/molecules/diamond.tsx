import type { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";

/**
 * Le losange est la seule icône du système : la charte ne prévoit pas de jeu
 * d'icônes. `tick` sert de filet, `box` de case à cocher, `badge` de vignette.
 */
const DIAMOND_SIZES = {
  tick: "size-[5px]",
  box: "size-3",
  badge: "size-[34px]",
} as const;

const DIAMOND_TONES = {
  idle: "border-gold/28 text-ink-idle",
  active: "border-gold/85 text-gold-selected",
  filled: "border-gold/85 bg-gold/80 text-gold-selected",
} as const;

interface DiamondProps {
  size?: keyof typeof DIAMOND_SIZES;
  tone?: keyof typeof DIAMOND_TONES;
  children?: ReactNode;
}

function Diamond({ size = "box", tone = "idle", children }: DiamondProps) {
  return (
    <div
      aria-hidden={children ? undefined : true}
      className={cn("diamond border", DIAMOND_SIZES[size], DIAMOND_TONES[tone])}
    >
      {children ? (
        <span className="diamond-content text-[13px]">{children}</span>
      ) : null}
    </div>
  );
}

export { Diamond };
