import type { UserId } from '@kernel/domain/user-id';

import type { Character } from './character';
import { CharacterNotFoundError } from './character.errors';
import { JournalNotWritableError } from './journal-chapter.errors';

export type JournalAccess = 'reader' | 'writer';

/** L'appelant, qualifié par son rôle ACTUEL dans la campagne du personnage. */
export interface JournalReader {
  actorId: UserId;
  actorIsGameMaster: boolean;
}

/**
 * Spec 013 : le journal suit la visibilité de la fiche. Son joueur assigné
 * l'écrit ; un MJ le lit, et ne l'écrit que si le personnage n'a pas de joueur.
 * Tout autre appelant reçoit la même absence que pour la fiche.
 */
export function journalAccessOf(character: Character, reader: JournalReader): JournalAccess {
  if (character.assignedTo?.equals(reader.actorId)) return 'writer';
  if (!reader.actorIsGameMaster) throw new CharacterNotFoundError();
  return character.assignedTo ? 'reader' : 'writer';
}

export function assertJournalWriter(access: JournalAccess): void {
  if (access !== 'writer') throw new JournalNotWritableError();
}
