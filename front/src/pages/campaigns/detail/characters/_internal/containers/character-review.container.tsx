import { useState } from "react";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import {
  useAcceptCharacterReview,
  useRefuseCharacterReview,
  useSubmitCharacterReview,
} from "../queries/use-character-review";
import { CharacterReviewActionsView } from "../views/character-review-actions.view";

interface CharacterReviewContainerProps {
  campaignId: string;
  character: Exclude<CampaignCharacterListItem, { projection: "pool" }>;
}

export function CharacterReviewContainer(props: CharacterReviewContainerProps) {
  const submit = useSubmitCharacterReview(props.campaignId);
  const accept = useAcceptCharacterReview(props.campaignId);
  const refuse = useRefuseCharacterReview(props.campaignId);
  const [reason, setReason] = useState("");
  const target = { characterId: props.character.id, expectedRevision: props.character.revision };
  return <CharacterReviewActionsView
    character={props.character} reason={reason} onReasonChange={setReason}
    onSubmit={() => submit.mutate(target)} onAccept={() => accept.mutate(target)}
    onRefuse={() => refuse.mutate({ ...target, reason })}
    isPending={submit.isPending || accept.isPending || refuse.isPending}
  />;
}
