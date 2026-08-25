import type {
  CharacterAssignmentCommandResult,
  CharacterAssignmentSummary,
} from '@donjon-dragon/shared/character-schema';

import type { CharacterDirectoryPort } from './ports/character-directory.port';
import type { Character } from '../domain/character';

export async function toAssignmentResult(
  directory: CharacterDirectoryPort,
  character: Character,
  previousCharacter: Character | null,
): Promise<CharacterAssignmentCommandResult> {
  return {
    campaignId: character.campaignId.value,
    character: await toSummary(directory, character),
    previousCharacter: previousCharacter
      ? await toSummary(directory, previousCharacter)
      : null,
  };
}

async function toSummary(
  directory: CharacterDirectoryPort,
  character: Character,
): Promise<CharacterAssignmentSummary> {
  const user = character.assignedTo
    ? await directory.findById(character.assignedTo.value)
    : null;
  return {
    id: character.id.value,
    revision: character.revision,
    assignedTo: user ? { displayName: user.displayName } : null,
  };
}
