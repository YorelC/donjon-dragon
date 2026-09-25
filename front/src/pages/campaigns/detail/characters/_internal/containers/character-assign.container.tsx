import { useAssignCharacterForm } from "../hooks/use-assign-character-form";
import { CharacterAssignView } from "../views/character-assign.view";

interface CharacterAssignContainerProps {
  campaignId: string;
  characterId: string;
  expectedRevision: number;
}

export function CharacterAssignContainer({
  campaignId,
  characterId,
  expectedRevision,
}: CharacterAssignContainerProps) {
  const assign = useAssignCharacterForm(campaignId, characterId, expectedRevision);

  return <CharacterAssignView assign={assign} />;
}
