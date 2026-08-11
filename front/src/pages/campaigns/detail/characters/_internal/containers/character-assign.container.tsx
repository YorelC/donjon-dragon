import { useAssignCharacterForm } from "../hooks/use-assign-character-form";
import { CharacterAssignView } from "../views/character-assign.view";

interface CharacterAssignContainerProps {
  campaignId: string;
  characterId: string;
}

export function CharacterAssignContainer({
  campaignId,
  characterId,
}: CharacterAssignContainerProps) {
  const assign = useAssignCharacterForm(campaignId, characterId);

  return <CharacterAssignView assign={assign} />;
}
