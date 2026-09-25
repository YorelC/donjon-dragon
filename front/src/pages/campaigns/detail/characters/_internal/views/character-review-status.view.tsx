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
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Badge variant="outline">{REVIEW_LABELS[character.review.status]}</Badge>
      <RejectionReason character={character} />
    </div>
  );
}

function RejectionReason({
  character,
}: {
  character: CampaignCharacterListItem;
}) {
  if (character.projection === "pool" || !character.review.lastRejectionReason) {
    return null;
  }

  return (
    <span className="muted-text-xs break-words">
      Motif : {character.review.lastRejectionReason}
    </span>
  );
}
