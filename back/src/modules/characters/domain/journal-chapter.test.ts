import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { CharacterId } from './character-id';
import { assertRoomForChapter, JournalChapter, reorderChapters } from './journal-chapter';
import {
  JournalChapterModifiedElsewhereError,
  JournalFullError,
  JournalOrderMismatchError,
} from './journal-chapter.errors';
import { JournalChapterId } from './journal-chapter-id';
import { OwningCampaignId } from './owning-campaign-id';

const LATER = new Date(TEST_INSTANT.getTime() + 60_000);

function aChapter(position = 0, title = 'La taverne'): JournalChapter {
  return JournalChapter.create({
    campaignId: OwningCampaignId.create(randomUUID()),
    characterId: CharacterId.create(randomUUID()),
    title, position, now: TEST_INSTANT,
  });
}

describe('JournalChapter', () => {
  it('naît vide, à sa révision initiale', () => {
    const chapter = aChapter();

    expect(chapter.body).toBe('');
    expect(chapter.revision).toBe(0);
    expect(chapter.updatedAt).toBe(TEST_INSTANT.toISOString());
  });

  it('se réécrit en avançant sa révision et sa date', () => {
    const chapter = aChapter();

    chapter.rewrite({ title: 'Le forgeron', body: '- [ ] il ment' }, LATER);

    expect(chapter.snapshot()).toMatchObject({
      title: 'Le forgeron', body: '- [ ] il ment', revision: 1, updatedAt: LATER.toISOString(),
    });
  });

  it('refuse une réécriture partie d’une révision dépassée', () => {
    const chapter = aChapter();
    chapter.rewrite({ title: '', body: 'ailleurs' }, LATER);

    expect(() => chapter.assertRevision(0)).toThrow(JournalChapterModifiedElsewhereError);
  });

  it('change de place sans changer de révision', () => {
    const chapter = aChapter();

    chapter.moveTo(3);

    expect(chapter.position).toBe(3);
    expect(chapter.revision).toBe(0);
  });

  it('se restaure tel qu’il a été photographié', () => {
    const chapter = aChapter();

    expect(JournalChapter.restore(chapter.snapshot()).snapshot()).toEqual(chapter.snapshot());
  });
});

describe('assertRoomForChapter', () => {
  it('refuse un chapitre au-delà de la capacité', () => {
    expect(() => assertRoomForChapter(1, 2)).not.toThrow();
    expect(() => assertRoomForChapter(2, 2)).toThrow(JournalFullError);
  });
});

describe('reorderChapters', () => {
  it('range les chapitres dans l’ordre reçu', () => {
    const [first, second, third] = [aChapter(0), aChapter(1), aChapter(2)];

    const ordered = reorderChapters([first, second, third], [third.id, first.id, second.id]);

    expect(ordered.map((chapter) => chapter.id)).toEqual([third.id, first.id, second.id]);
    expect(ordered.map((chapter) => chapter.position)).toEqual([0, 1, 2]);
  });

  it('refuse un ordre qui oublie, répète ou invente un chapitre', () => {
    const [first, second] = [aChapter(0), aChapter(1)];
    const stranger = JournalChapterId.create(randomUUID());

    expect(() => reorderChapters([first, second], [first.id])).toThrow(JournalOrderMismatchError);
    expect(() => reorderChapters([first, second], [first.id, first.id]))
      .toThrow(JournalOrderMismatchError);
    expect(() => reorderChapters([first, second], [first.id, stranger]))
      .toThrow(JournalOrderMismatchError);
  });
});
