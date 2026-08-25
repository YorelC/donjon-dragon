import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { UserId } from '@kernel/domain/user-id';

import { friendshipPairKey } from './friendship-pair-key';

describe('friendshipPairKey', () => {
  it('donne la même clé dans les deux sens', () => {
    const alice = UserId.create(randomUUID());
    const bob = UserId.create(randomUUID());

    expect(friendshipPairKey(alice, bob)).toBe(friendshipPairKey(bob, alice));
  });
});
