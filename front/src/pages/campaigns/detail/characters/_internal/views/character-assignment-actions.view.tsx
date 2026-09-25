import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { CharacterAssignContainer } from "../containers/character-assign.container";

interface AssignmentActionsProps {
  character: CampaignCharacterListItem;
  campaignId: string;
  onUnassign: (characterId: string) => void;
}

/** Attribuer un personnage libre, ou libérer celui qui est déjà pris. */
export function AssignmentActions({
  character,
  campaignId,
  onUnassign,
}: AssignmentActionsProps) {
  if (character.assignmentStatus === "available") {
    return (
      <CharacterAssignContainer
        campaignId={campaignId}
        characterId={character.id}
      />
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => onUnassign(character.id)}>
      Libérer
    </Button>
  );
}
