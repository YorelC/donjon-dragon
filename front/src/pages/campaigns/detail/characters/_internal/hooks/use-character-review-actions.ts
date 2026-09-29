import { useState } from "react";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import {
  useAcceptCharacterReview,
  useRefuseCharacterReview,
  useSubmitCharacterReview,
  useValidateCharacterReview,
} from "../queries/use-character-review";

export interface CharacterReviewActions {
  reason: string;
  isPending: boolean;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
  onAccept: () => void;
  onRefuse: () => void;
  onValidate: () => void;
}

export function useCharacterReviewActions(
  campaignId: string,
  character: CampaignCharacterListItem,
): CharacterReviewActions {
  const submit = useSubmitCharacterReview(campaignId);
  const accept = useAcceptCharacterReview(campaignId);
  const refuse = useRefuseCharacterReview(campaignId);
  const validate = useValidateCharacterReview(campaignId);
  const [reason, setReason] = useState("");
  const target = { characterId: character.id, expectedRevision: character.revision };

  return {
    reason, onReasonChange: setReason,
    onSubmit: () => submit.mutate(target),
    onAccept: () => accept.mutate(target),
    onRefuse: () => refuse.mutate({ ...target, reason }),
    onValidate: () => validate.mutate(target),
    isPending: [submit, accept, refuse, validate].some((command) => command.isPending),
  };
}
