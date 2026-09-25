import { describe, expect, it, vi } from 'vitest';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { anActor } from '@kernel/testing/actor.fixture';

import { CharacterReviewController } from './character-review.controller';

const CAMPAIGN_ID = '550e8400-e29b-41d4-a716-446655440000';
const CHARACTER_ID = '660e8400-e29b-41d4-a716-446655440001';
const USER = { userId: anActor('770e8400-e29b-41d4-a716-446655440002') };
const KEY = 'review-command';
const command = () => ({ execute: vi.fn() });

describe('CharacterReviewController', () => {
  it('transmet le refus avec l identité du jeton et son motif', async () => {
    const submit = command();
    const accept = command();
    const refuse = command();
    const controller = new CharacterReviewController(submit as never, accept as never, refuse as never);

    await controller.refuseCharacter(
      USER, CAMPAIGN_ID, CHARACTER_ID, { expectedRevision: 2, reason: 'À corriger' }, KEY,
    );

    expect(refuse.execute).toHaveBeenCalledWith({
      campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID, actorId: USER.userId,
      expectedRevision: 2, idempotencyKey: KEY, reason: 'À corriger',
    });
  });
});

describe('CharacterReviewController — protection des routes', () => {
  const ROUTES = ['submitCharacter', 'acceptCharacter', 'refuseCharacter'] as const;

  it('ne déclare aucun accès public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, CharacterReviewController)).toBeUndefined();
    ROUTES.forEach((route) => {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, CharacterReviewController.prototype[route]))
        .toBeUndefined();
    });
  });

  it('couvre toutes les routes', () => {
    const handlers = Object.getOwnPropertyNames(CharacterReviewController.prototype)
      .filter((name) => name !== 'constructor');
    expect(handlers.sort()).toEqual([...ROUTES].sort());
  });
});
