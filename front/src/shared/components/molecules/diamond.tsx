import type { ReactNode } from "react";
import { cn } from "@/shared/utils/utils";

/**
 * Le losange est la seule icône du système : la charte ne prévoit pas de jeu
 * d'icônes. `tick` sert de filet, `box` de case à cocher, `count` de vignette
 * de compteur et `badge` de médaillon à initiales.
 */
const DIAMOND_SIZES = {
  tick: "size-[5px]",
  box: "size-3",
  count: "size-[17px]",
  badge: "size-[34px]",
} as const;

const DIAMOND_CONTENT_SIZES = {
  tick: "text-meta",
  box: "text-meta",
  count: "text-[10.5px] font-semibold",
  badge: "text-[13px]",
} as const;

const DIAMOND_TONES = {
  idle: "border-gold/28 text-ink-idle",
  active: "border-gold/85 text-gold-selected",
  filled: "border-gold/85 bg-gold/80 text-gold-selected",
  stamp: "border-gold/85 bg-gold/85 text-background",
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
        <span className={cn("diamond-content", DIAMOND_CONTENT_SIZES[size])}>
          {children}
        </span>
      ) : null}
    </div>
  );
}

export { Diamond };
