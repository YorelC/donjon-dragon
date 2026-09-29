import type { CharacterDeletionPort } from '../application/ports/character-deletion.port';
import type { CharacterId } from '../domain/character-id';
import type { InMemoryCharacterRepository } from './in-memory-character.repository';
import type { InMemoryJournalChapterRepository } from './in-memory-journal-chapter.repository';

export class InMemoryCharacterDeletion implements CharacterDeletionPort {
  constructor(
    private readonly characters: InMemoryCharacterRepository,
    private readonly chapters: InMemoryJournalChapterRepository,
  ) {}

  async deleteWithJournal(id: CharacterId): Promise<void> {
    this.chapters.deleteByCharacter(id);
    await this.characters.deleteById(id);
  }
}
