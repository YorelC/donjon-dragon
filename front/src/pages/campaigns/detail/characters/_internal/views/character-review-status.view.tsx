import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";

const REVIEW_LABELS = {
  draft: "Brouillon",
  submitted: "En attente de validation",
  refused: "À corriger",
  accepted: "Acceptée",
} as const;

export function CharacterReviewStatusView({
  character,
}: {
  character: CampaignCharacterListItem;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Badge variant="outline">{REVIEW_LABELS[character.review.status]}</Badge>
      <RejectionReason character={character} />
    </div>
  );
}

/** Tronqué pour garder la carte sur sa hauteur fixe ; le survol le montre entier. */
function RejectionReason({
  character,
}: {
  character: CampaignCharacterListItem;
}) {
  if (!character.review.lastRejectionReason) {
    return null;
  }

  const reason = `Motif : ${character.review.lastRejectionReason}`;

  return (
    <span className="muted-text-xs truncate" title={reason}>
      {reason}
    </span>
  );
}
