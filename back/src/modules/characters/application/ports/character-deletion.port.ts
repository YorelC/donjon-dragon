import type { CharacterId } from '../../domain/character-id';

export const CHARACTER_DELETION = Symbol('CHARACTER_DELETION');

/**
 * Supprimer un personnage emporte son journal de bord (spec 013), dans la même
 * transaction : aucun chapitre ne survit à la fiche qui le porte.
 */
export interface CharacterDeletionPort {
  deleteWithJournal(id: CharacterId): Promise<void>;
}
