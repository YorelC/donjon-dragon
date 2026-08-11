import {
  useDeleteCharacter,
  useUnassignCharacter,
} from "../queries/use-character-mutations";

export function useCharacterActions(campaignId: string) {
  const deleteCharacter = useDeleteCharacter(campaignId);
  const unassignCharacter = useUnassignCharacter(campaignId);

  return {
    onDelete: (characterId: string) => deleteCharacter.mutate(characterId),
    onUnassign: (characterId: string) => unassignCharacter.mutate(characterId),
  };
}
