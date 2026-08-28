import { Diamond } from "@/shared/components/molecules/diamond";

const MAX_DISPLAYED_COUNT = 9;

interface CountBadgeViewProps {
  count: number;
}

/**
 * Vignette de compteur : un losange doré frappé du nombre. Au-delà de neuf le
 * losange n'a plus la place, d'où le « 9+ » et l'intitulé accessible qui le dit.
 */
function CountBadge({ count }: CountBadgeViewProps) {
  return (
    <span aria-label={toCountLabel(count)}>
      <Diamond size="count" tone="stamp">
        {toCountText(count)}
      </Diamond>
    </span>
  );
}

function toCountText(count: number): string {
  return count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : `${count}`;
}

function toCountLabel(count: number): string {
  return count > MAX_DISPLAYED_COUNT
    ? `Plus de ${MAX_DISPLAYED_COUNT} demandes en attente`
    : `${count} demandes en attente`;
}

export { CountBadge };
