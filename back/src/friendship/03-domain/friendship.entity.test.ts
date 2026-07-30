// RED first — comportement du domaine friendship pinné avant l'implémentation.
import { describe, it, expect } from 'vitest';

import {
  createFriendRequest,
  acceptFriendRequest,
  refuseFriendRequest,
  involvesUser,
  friendIdFor,
} from './friendship.entity';
import {
  CannotFriendSelfError,
  FriendRequestNotPendingError,
  NotRequestRecipientError,
} from './friendship.errors';

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const C = '33333333-3333-3333-3333-333333333333';

describe('createFriendRequest', () => {
  it('crée une demande pending de A vers B', () => {
    const f = createFriendRequest(A, B);
    expect(f.requesterId).toBe(A);
    expect(f.recipientId).toBe(B);
    expect(f.status).toBe('pending');
    expect(f.id).toMatch(/[0-9a-f-]{36}/);
    expect(f.createdAt).toBe(f.updatedAt);
  });

  it('refuse une demande vers soi-même', () => {
    expect(() => createFriendRequest(A, A)).toThrow(CannotFriendSelfError);
  });
});

describe('acceptFriendRequest', () => {
  it('passe le statut à accepted quand le recipient accepte', () => {
    const pending = createFriendRequest(A, B);
    const accepted = acceptFriendRequest(pending, B);
    expect(accepted.status).toBe('accepted');
    expect(accepted.id).toBe(pending.id);
  });

  it('refuse si ce n’est pas le recipient qui accepte', () => {
    const pending = createFriendRequest(A, B);
    expect(() => acceptFriendRequest(pending, A)).toThrow(NotRequestRecipientError);
    expect(() => acceptFriendRequest(pending, C)).toThrow(NotRequestRecipientError);
  });

  it('refuse si la demande n’est plus pending', () => {
    const accepted = acceptFriendRequest(createFriendRequest(A, B), B);
    expect(() => acceptFriendRequest(accepted, B)).toThrow(FriendRequestNotPendingError);
  });
});

describe('refuseFriendRequest', () => {
  it('passe le statut à refused quand le recipient refuse', () => {
    const refused = refuseFriendRequest(createFriendRequest(A, B), B);
    expect(refused.status).toBe('refused');
  });

  it('refuse si ce n’est pas le recipient', () => {
    expect(() => refuseFriendRequest(createFriendRequest(A, B), A)).toThrow(
      NotRequestRecipientError,
    );
  });
});

describe('involvesUser / friendIdFor', () => {
  it('détecte la participation dans les deux sens', () => {
    const f = createFriendRequest(A, B);
    expect(involvesUser(f, A)).toBe(true);
    expect(involvesUser(f, B)).toBe(true);
    expect(involvesUser(f, C)).toBe(false);
  });

  it('renvoie l’autre participant', () => {
    const f = createFriendRequest(A, B);
    expect(friendIdFor(f, A)).toBe(B);
    expect(friendIdFor(f, B)).toBe(A);
  });
});
