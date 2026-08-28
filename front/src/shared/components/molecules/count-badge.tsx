import { Diamond } from "@/shared/components/molecules/diamond";

const MAX_DISPLAYED_COUNT = 9;

interface CountBadgeViewProps {
  count: number;
  /** Ce qui est compté, au pluriel : deux compteurs se côtoient dans le bandeau. */
  pending: string;
}

/**
 * Vignette de compteur : un losange doré frappé du nombre. Au-delà de neuf le
 * losange n'a plus la place, d'où le « 9+ » et l'intitulé accessible qui le dit.
 */
function CountBadge({ count, pending }: CountBadgeViewProps) {
  return (
    <span aria-label={toCountLabel(count, pending)}>
      <Diamond size="count" tone="stamp">
        {toCountText(count)}
      </Diamond>
    </span>
  );
}

function toCountText(count: number): string {
  return count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : `${count}`;
}

function toCountLabel(count: number, pending: string): string {
  return count > MAX_DISPLAYED_COUNT
    ? `Plus de ${MAX_DISPLAYED_COUNT} ${pending} en attente`
    : `${count} ${pending} en attente`;
}

export { CountBadge };
