import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { CharacterAssignContainer } from "../containers/character-assign.container";
import type { CharacterAssignmentTarget } from "../queries/use-character-mutations";

interface AssignmentActionsProps {
  character: Extract<CampaignCharacterListItem, { projection: "gameMaster" }>;
  campaignId: string;
  onUnassign: (target: CharacterAssignmentTarget) => void;
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
        expectedRevision={character.revision}
      />
    );
  }

  return (
    <Button
      variant="outline" size="sm"
      onClick={() => onUnassign({
        characterId: character.id, expectedRevision: character.revision,
      })}
    >
      Libérer
    </Button>
  );
}
