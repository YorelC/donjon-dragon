import type { CharacterId } from '../../domain/character-id';
import type { JournalChapter } from '../../domain/journal-chapter';
import type { JournalChapterId } from '../../domain/journal-chapter-id';

export const JOURNAL_CHAPTER_REPOSITORY = Symbol('JOURNAL_CHAPTER_REPOSITORY');

/** Une ligne du sommaire : tout sauf le texte, qui peut peser 20 000 caractères. */
export interface JournalChapterSummaryRecord {
  id: string;
  title: string;
  position: number;
  revision: number;
  updatedAt: string;
}

/**
 * Les lectures du journal. Les écritures passent par le port de commande, qui
 * porte reçu et audit. Aucune lecture ne filtre sur l'appelant : les use-cases
 * décident qui lit, une fois le personnage chargé.
 */
export interface JournalChapterRepositoryPort {
  /** Les chapitres du personnage, dans l'ordre du journal. */
  listByCharacter(characterId: CharacterId): Promise<JournalChapter[]>;
  /** Le même ordre, sans charger les textes. */
  listSummariesByCharacter(characterId: CharacterId): Promise<JournalChapterSummaryRecord[]>;
  findByCharacterAndId(
    characterId: CharacterId,
    id: JournalChapterId,
  ): Promise<JournalChapter | null>;
}
