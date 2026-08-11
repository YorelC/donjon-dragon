import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { accept, pendingRequest, refuse } from '../../testing/friendship.fixture';
import { AreFriendsUseCase } from './are-friends.use-case';

describe('AreFriendsUseCase', () => {
  let useCase: AreFriendsUseCase;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: string;
  let bob: string;

  beforeEach(() => {
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new AreFriendsUseCase(friendshipRepo);
    alice = randomUUID();
    bob = randomUUID();
  });

  it('dit vrai pour une amitié acceptée', async () => {
    await friendshipRepo.save(accept(pendingRequest(alice, bob), bob));

    expect(await useCase.execute({ userId: alice, otherUserId: bob })).toBe(true);
  });

  it('reste vrai dans l autre sens : une amitié acceptée est symétrique', async () => {
    await friendshipRepo.save(accept(pendingRequest(alice, bob), bob));

    expect(await useCase.execute({ userId: bob, otherUserId: alice })).toBe(true);
  });

  it('dit faux pour une demande encore en attente', async () => {
    await friendshipRepo.save(pendingRequest(alice, bob));

    expect(await useCase.execute({ userId: alice, otherUserId: bob })).toBe(false);
  });

  it('dit faux pour une demande refusée', async () => {
    await friendshipRepo.save(refuse(pendingRequest(alice, bob), bob));

    expect(await useCase.execute({ userId: alice, otherUserId: bob })).toBe(false);
  });

  it('dit faux quand aucune relation n existe', async () => {
    expect(await useCase.execute({ userId: alice, otherUserId: bob })).toBe(false);
  });
});
