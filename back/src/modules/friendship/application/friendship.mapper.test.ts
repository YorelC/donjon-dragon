import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { Friendship } from '../domain/friendship';
import { toFriendRequestResponse, toUserSummary } from './friendship.mapper';

const alice = UserId.create(randomUUID());
const bob = UserId.create(randomUUID());

describe('toFriendRequestResponse', () => {
  it('ne divulgue pas l identité système des participants', () => {
    const response = toFriendRequestResponse(aRequest());

    expect(response).not.toHaveProperty('requesterId');
    expect(response).not.toHaveProperty('recipientId');
  });

  /**
   * La reponse se construit par spread du snapshot, et TypeScript ne signale pas
   * une propriete excedentaire arrivee par la : seul ce test empeche une mecanique
   * de persistance de fuir dans le contrat.
   */
  it('ne divulgue pas la révision d agrégat', () => {
    expect(toFriendRequestResponse(aRequest())).not.toHaveProperty('revision');
  });

  it('garde le handle de la ressource et son état', () => {
    const friendship = aRequest();

    const response = toFriendRequestResponse(friendship);

    expect(response.id).toBe(friendship.id.value);
    expect(response.status).toBe(friendship.status);
  });
});

describe('toUserSummary', () => {
  it('réduit un utilisateur à son pseudo', () => {
    expect(toUserSummary({ id: alice.value, displayName: 'alice' })).toEqual({
      displayName: 'alice',
    });
  });
});

function aRequest(): Friendship {
  return Friendship.request(alice, bob, TEST_INSTANT);
}
