import { describe, expect, it, vi } from 'vitest';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { anActor } from '@kernel/testing/actor.fixture';

import { CharacterJournalController } from './character-journal.controller';

const CAMPAIGN_ID = '550e8400-e29b-41d4-a716-446655440000';
const CHARACTER_ID = '660e8400-e29b-41d4-a716-446655440001';
const CHAPTER_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER = { userId: anActor('770e8400-e29b-41d4-a716-446655440002') };
const HANDLERS = [
  'getJournal', 'getChapter', 'createChapter', 'updateChapter', 'deleteChapter', 'reorderChapters',
] as const;

describe('CharacterJournalController', () => {
  it('transmet le corps validé, la cible de l’URL et l’identité du jeton', async () => {
    const update = { execute: vi.fn() };
    const controller = controllerWith({ update });

    await controller.updateChapter(
      USER, CAMPAIGN_ID, CHARACTER_ID, CHAPTER_ID,
      { title: 'La taverne', body: 'texte', expectedRevision: 2 }, 'save-command',
    );

    expect(update.execute).toHaveBeenCalledWith({
      campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID, chapterId: CHAPTER_ID,
      actorId: USER.userId, title: 'La taverne', body: 'texte', expectedRevision: 2,
      idempotencyKey: 'save-command',
    });
  });

  it('ne déclare aucun accès public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, CharacterJournalController)).toBeUndefined();
    HANDLERS.forEach((handler) => {
      expect(Reflect.getMetadata(
        IS_PUBLIC_KEY, CharacterJournalController.prototype[handler],
      )).toBeUndefined();
    });
  });
});

function controllerWith(useCases: { update: { execute: () => unknown } }) {
  const unused = { execute: vi.fn() };
  return new CharacterJournalController(
    unused as never, unused as never, unused as never,
    useCases.update as never, unused as never, unused as never,
  );
}
