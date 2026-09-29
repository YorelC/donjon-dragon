import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { useCharacterReviewActions } from "../hooks/use-character-review-actions";
import { CharacterReviewActionsView } from "../views/character-review-actions.view";

interface CharacterReviewContainerProps {
  campaignId: string;
  character: CampaignCharacterListItem;
}

export function CharacterReviewContainer(props: CharacterReviewContainerProps) {
  const review = useCharacterReviewActions(props.campaignId, props.character);
  return <CharacterReviewActionsView character={props.character} review={review} />;
}
