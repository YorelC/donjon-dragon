import { UserMinus } from "lucide-react";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { CharacterAssignContainer } from "../containers/character-assign.container";
import type { CharacterAssignmentTarget } from "../queries/use-character-mutations";
import { IconAction } from "./icon-action.view";

interface AssignmentActionsProps {
  character: Extract<CampaignCharacterListItem, { projection: "gameMaster" }>;
  campaignId: string;
  onUnassign: (target: CharacterAssignmentTarget) => void;
}

const UNASSIGN_LABEL = "Libérer";

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
    <IconAction label={UNASSIGN_LABEL}>
      <Button
        variant="outline" size="icon-sm" aria-label={UNASSIGN_LABEL}
        onClick={() => onUnassign({
          characterId: character.id, expectedRevision: character.revision,
        })}
      >
        <UserMinus />
      </Button>
    </IconAction>
  );
}
