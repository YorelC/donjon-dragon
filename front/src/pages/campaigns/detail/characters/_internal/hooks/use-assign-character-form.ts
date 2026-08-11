import { useState } from "react";
import { useAssignCharacter } from "../queries/use-character-mutations";

export interface AssignCharacterFormState {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerDisplayName: string;
  onChangeDisplayName: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function useAssignCharacterForm(
  campaignId: string,
  characterId: string,
): AssignCharacterFormState {
  const [open, setOpen] = useState(false);
  const [playerDisplayName, setPlayerDisplayName] = useState("");
  const assign = useAssignCharacter(campaignId);
  const onSubmit = () =>
    assign.mutate({ characterId, playerDisplayName }, { onSuccess: () => setOpen(false) });

  return {
    open,
    onOpenChange: setOpen,
    playerDisplayName,
    onChangeDisplayName: setPlayerDisplayName,
    onSubmit,
    isSubmitting: assign.isPending,
  };
}
