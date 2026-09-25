import {
  type CharacterAssignmentTarget,
  useDeleteCharacter,
  useUnassignCharacter,
} from "../queries/use-character-mutations";

export function useCharacterActions(campaignId: string) {
  const deleteCharacter = useDeleteCharacter(campaignId);
  const unassignCharacter = useUnassignCharacter(campaignId);

  return {
    onDelete: (characterId: string) => deleteCharacter.mutate(characterId),
    onUnassign: (target: CharacterAssignmentTarget) => unassignCharacter.mutate(target),
  };
}
