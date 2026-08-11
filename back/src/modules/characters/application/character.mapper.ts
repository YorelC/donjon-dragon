import type { Character as CharacterDto } from '@donjon-dragon/shared/character-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { Character } from '../domain/character';
import type { CharacterDirectoryPort, CharacterDirectoryUser } from './ports/character-directory.port';

/**
 * Agrégat → contrat HTTP. `createdByMe` remplace tout id de créateur : le
 * client sait seulement s'il a lui-même créé cette fiche. `assignedPlayer`
 * arrive déjà résolu : le use-case fait une lecture d'annuaire pour toute la
 * liste, le mapper ne fait qu'y piocher — même découpage que campaigns.
 */
export function toCharacterDto(
  character: Character,
  viewerId: UserId,
  assignedPlayer: CharacterDirectoryUser | null,
): CharacterDto {
  const sheet = character.sheet;

  return {
    id: character.id.value,
    campaignId: character.campaignId.value,
    name: sheet.name.value,
    race: sheet.race.value,
    characterClass: sheet.characterClass.value,
    abilityScores: sheet.abilityScores.snapshot(),
    createdByMe: character.createdBy.equals(viewerId),
    assignedTo: assignedPlayer ? { displayName: assignedPlayer.displayName } : null,
  };
}

/** Résout `assignedTo` dans l'annuaire avant de mapper — un seul appelant. */
export async function toCharacterDtoResolved(
  directory: CharacterDirectoryPort,
  character: Character,
  viewerId: UserId,
): Promise<CharacterDto> {
  const assignedTo = character.assignedTo;
  const assignedPlayer = assignedTo ? await directory.findById(assignedTo.value) : null;

  return toCharacterDto(character, viewerId, assignedPlayer);
}
