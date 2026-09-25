import { describe, expect, it, vi } from 'vitest';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { anActor } from '@kernel/testing/actor.fixture';

import { CharacterPersonalDetailsController } from './character-personal-details.controller';

const CAMPAIGN_ID = '550e8400-e29b-41d4-a716-446655440000';
const CHARACTER_ID = '660e8400-e29b-41d4-a716-446655440001';
const USER = { userId: anActor('770e8400-e29b-41d4-a716-446655440002') };

describe('CharacterPersonalDetailsController', () => {
  it('transmet seulement le corps validé et l identité du jeton', async () => {
    const update = { execute: vi.fn() };
    const controller = new CharacterPersonalDetailsController(update as never);

    await controller.execute(
      USER, CAMPAIGN_ID, CHARACTER_ID,
      { age: 34, weightKg: 19, description: null, expectedRevision: 3 }, 'details-command',
    );

    expect(update.execute).toHaveBeenCalledWith({
      campaignId: CAMPAIGN_ID, characterId: CHARACTER_ID, actorId: USER.userId,
      age: 34, weightKg: 19, description: null, expectedRevision: 3,
      idempotencyKey: 'details-command',
    });
  });

  it('ne déclare aucun accès public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, CharacterPersonalDetailsController)).toBeUndefined();
    expect(Reflect.getMetadata(
      IS_PUBLIC_KEY, CharacterPersonalDetailsController.prototype.execute,
    )).toBeUndefined();
  });
});
