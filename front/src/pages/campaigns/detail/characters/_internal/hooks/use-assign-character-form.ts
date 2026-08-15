import { useState } from "react";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useAssignCharacter } from "../queries/use-character-mutations";

export interface AssignCharacterFormState {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerDisplayName: string;
  onChangeDisplayName: (value: string) => void;
  playerOptions: string[];
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function useAssignCharacterForm(
  campaignId: string,
  characterId: string,
): AssignCharacterFormState {
  const [open, setOpen] = useState(false);
  const [playerDisplayName, setPlayerDisplayName] = useState("");
  const { data: campaign } = useCampaignDetail(campaignId);
  const assign = useAssignCharacter(campaignId);
  const onSubmit = () =>
    assign.mutate({ characterId, playerDisplayName }, { onSuccess: () => setOpen(false) });

  return {
    open,
    onOpenChange: setOpen,
    playerDisplayName,
    onChangeDisplayName: setPlayerDisplayName,
    playerOptions: campaign?.players.map((player) => player.displayName) ?? [],
    onSubmit,
    isSubmitting: assign.isPending,
  };
}
