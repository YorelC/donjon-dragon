import type {
  CharacterAssignmentCommandResult,
  CharacterAssignmentSummary,
} from '@donjon-dragon/shared/character-schema';

import type { CharacterDirectoryUser } from './ports/character-directory.port';
import type { Character } from '../domain/character';

/** Les joueurs concernes, deja lus par le use-case : le mapper n'interroge rien. */
export type AssignedPlayers = Map<string, CharacterDirectoryUser>;

export function toAssignmentResult(
  players: AssignedPlayers,
  character: Character,
  previousCharacter: Character | null,
): CharacterAssignmentCommandResult {
  return {
    campaignId: character.campaignId.value,
    character: toSummary(players, character),
    previousCharacter: previousCharacter ? toSummary(players, previousCharacter) : null,
  };
}

function toSummary(
  players: AssignedPlayers,
  character: Character,
): CharacterAssignmentSummary {
  const user = character.assignedTo
    ? players.get(character.assignedTo.value)
    : undefined;
  return {
    id: character.id.value,
    revision: character.revision,
    assignedTo: user ? { displayName: user.displayName } : null,
  };
}
