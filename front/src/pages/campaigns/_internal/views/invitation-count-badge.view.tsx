import { Badge } from "@/shared/components/atoms/badge";

const MAX_DISPLAYED_COUNT = 9;

interface InvitationCountBadgeViewProps {
  count: number;
}

export function InvitationCountBadgeView({
  count,
}: InvitationCountBadgeViewProps) {
  return (
    <Badge variant="default" aria-label={toCountLabel(count)}>
      {count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : count}
    </Badge>
  );
}

function toCountLabel(count: number): string {
  return count > MAX_DISPLAYED_COUNT
    ? `Plus de ${MAX_DISPLAYED_COUNT} demandes de campagne en attente`
    : `${count} demandes de campagne en attente`;
}
