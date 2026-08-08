import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@modules/user/domain/user.entity';
import {
  CannotFriendSelfError,
  RecipientNotFoundError,
  FriendRequestAlreadyExistsError,
  AlreadyFriendsError,
} from '../../domain/friendship.errors';
import { InMemoryUserRepository } from '@modules/user/infrastructure/persistence/in-memory-user.repository';
import { InMemoryFriendshipRepository } from '../../infrastructure/persistence/in-memory-friendship.repository';
import { SendFriendRequestUseCase } from './send-friend-request.use-case';

describe('SendFriendRequestUseCase', () => {
  let useCase: SendFriendRequestUseCase;
  let userRepo: InMemoryUserRepository;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof createUser>;
  let bob: ReturnType<typeof createUser>;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new SendFriendRequestUseCase(userRepo, friendshipRepo);

    alice = createUser({
      email: 'alice@example.com',
      displayName: 'alice',
      passwordHash: 'hashedpw',
    });
    bob = createUser({
      email: 'bob@example.com',
      displayName: 'bob',
      passwordHash: 'hashedpw',
    });

    await userRepo.save(alice);
    await userRepo.save(bob);
  });

  it('envoie une demande d amitié vers un utilisateur existant', async () => {
    const result = await useCase.execute({
      requesterId: alice.id,
      displayName: 'bob',
    });

    expect(result.status).toBe('pending');
    expect(result.requesterId).toBe(alice.id);
    expect(result.recipientId).toBe(bob.id);
  });

  it('lève CannotFriendSelfError si requester == recipient', async () => {
    await expect(
      useCase.execute({
        requesterId: alice.id,
        displayName: 'alice',
      }),
    ).rejects.toThrow(CannotFriendSelfError);
  });

  it('lève RecipientNotFoundError si displayName n existe pas', async () => {
    await expect(
      useCase.execute({
        requesterId: alice.id,
        displayName: 'nonexistent',
      }),
    ).rejects.toThrow(RecipientNotFoundError);
  });

  it('lève FriendRequestAlreadyExistsError si une demande pending existe déjà', async () => {
    await useCase.execute({
      requesterId: alice.id,
      displayName: 'bob',
    });

    await expect(
      useCase.execute({
        requesterId: alice.id,
        displayName: 'bob',
      }),
    ).rejects.toThrow(FriendRequestAlreadyExistsError);
  });

  it('lève AlreadyFriendsError si déjà amis (status accepted)', async () => {
    const req = await useCase.execute({
      requesterId: alice.id,
      displayName: 'bob',
    });

    await friendshipRepo.save({
      ...req,
      status: 'accepted',
      updatedAt: new Date().toISOString(),
    });

    await expect(
      useCase.execute({
        requesterId: alice.id,
        displayName: 'bob',
      }),
    ).rejects.toThrow(AlreadyFriendsError);
  });

  it('permet de renvoyer une demande après refus (overwrite refused)', async () => {
    const req1 = await useCase.execute({
      requesterId: alice.id,
      displayName: 'bob',
    });

    await friendshipRepo.save({
      ...req1,
      status: 'refused',
      updatedAt: new Date().toISOString(),
    });

    const req2 = await useCase.execute({
      requesterId: alice.id,
      displayName: 'bob',
    });

    expect(req2.status).toBe('pending');
    expect(req2.id).not.toBe(req1.id);
  });
});
