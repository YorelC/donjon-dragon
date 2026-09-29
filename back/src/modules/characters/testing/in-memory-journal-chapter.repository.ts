import type { JournalChapterRepositoryPort } from '../application/ports/journal-chapter.repository.port';
import type { CharacterId } from '../domain/character-id';
import { JournalChapter, type JournalChapterSnapshot } from '../domain/journal-chapter';
import type { JournalChapterId } from '../domain/journal-chapter-id';

export class InMemoryJournalChapterRepository implements JournalChapterRepositoryPort {
  private readonly chapters = new Map<string, JournalChapterSnapshot>();

  async listByCharacter(characterId: CharacterId): Promise<JournalChapter[]> {
    return [...this.chapters.values()]
      .filter((chapter) => chapter.characterId === characterId.value)
      .sort(byJournalOrder)
      .map((snapshot) => JournalChapter.restore(structuredClone(snapshot)));
  }

  async findByCharacterAndId(
    characterId: CharacterId,
    id: JournalChapterId,
  ): Promise<JournalChapter | null> {
    const snapshot = this.chapters.get(id.value);
    if (snapshot?.characterId !== characterId.value) return null;
    return JournalChapter.restore(structuredClone(snapshot));
  }

  /** Hors port : ce que les doubles d'écriture appellent. */
  save(chapter: JournalChapter): void {
    this.chapters.set(chapter.id.value, chapter.snapshot());
  }

  revisionOf(id: JournalChapterId): number | null {
    return this.chapters.get(id.value)?.revision ?? null;
  }

  delete(id: JournalChapterId): void {
    this.chapters.delete(id.value);
  }

  deleteByCharacter(characterId: CharacterId): void {
    [...this.chapters.values()]
      .filter((chapter) => chapter.characterId === characterId.value)
      .forEach((chapter) => this.chapters.delete(chapter.id));
  }
}

function byJournalOrder(left: JournalChapterSnapshot, right: JournalChapterSnapshot): number {
  return left.position - right.position || left.createdAt.localeCompare(right.createdAt);
}
