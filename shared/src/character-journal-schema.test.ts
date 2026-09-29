import { describe, expect, it } from 'vitest';

import {
  CHARACTER_JOURNAL_RULES,
  CreateJournalChapterSchema,
  ReorderJournalChaptersSchema,
  UpdateJournalChapterSchema,
} from './character-journal-schema';

const CHAPTER_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('character-journal-schema', () => {
  it('accepte un titre vide : il s’affiche « Sans titre »', () => {
    expect(CreateJournalChapterSchema.parse({ title: '  ' })).toEqual({ title: '' });
  });

  it('refuse un titre au-delà de la borne', () => {
    const title = 'a'.repeat(CHARACTER_JOURNAL_RULES.titleMax + 1);
    expect(CreateJournalChapterSchema.safeParse({ title }).success).toBe(false);
  });

  it('garde les espaces du Markdown et borne le texte', () => {
    const update = { title: 'La taverne', body: '  - [ ] indice\n', expectedRevision: 0 };
    expect(UpdateJournalChapterSchema.parse(update).body).toBe('  - [ ] indice\n');
    const body = 'a'.repeat(CHARACTER_JOURNAL_RULES.bodyMax + 1);
    expect(UpdateJournalChapterSchema.safeParse({ ...update, body }).success).toBe(false);
  });

  it('refuse un champ inconnu dans une commande', () => {
    const update = { title: '', body: '', expectedRevision: 0, position: 3 };
    expect(UpdateJournalChapterSchema.safeParse(update).success).toBe(false);
  });

  it('borne l’ordre au nombre maximal de chapitres', () => {
    const chapterIds = Array.from(
      { length: CHARACTER_JOURNAL_RULES.maxChapters + 1 }, () => CHAPTER_ID,
    );
    expect(ReorderJournalChaptersSchema.safeParse({ chapterIds }).success).toBe(false);
  });
});
