import type { CharacterId } from '../../domain/character-id';
import type { JournalChapter } from '../../domain/journal-chapter';
import type { JournalChapterId } from '../../domain/journal-chapter-id';

export const JOURNAL_CHAPTER_REPOSITORY = Symbol('JOURNAL_CHAPTER_REPOSITORY');

/**
 * Les lectures du journal. Les écritures passent par le port de commande, qui
 * porte reçu et audit. Aucune lecture ne filtre sur l'appelant : les use-cases
 * décident qui lit, une fois le personnage chargé.
 */
export interface JournalChapterRepositoryPort {
  /** Les chapitres du personnage, dans l'ordre du journal. */
  listByCharacter(characterId: CharacterId): Promise<JournalChapter[]>;
  findByCharacterAndId(
    characterId: CharacterId,
    id: JournalChapterId,
  ): Promise<JournalChapter | null>;
}
