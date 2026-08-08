import { describe, it, expect, beforeEach } from 'vitest';
import { aUser } from '@modules/user/testing/user.fixture';
import { toPublicUser } from '@modules/user/application/user.mapper';
import {
  CannotFriendSelfError,
  RecipientNotFoundError,
  FriendRequestAlreadyExistsError,
  AlreadyFriendsError,
} from '../../domain/friendship.errors';
import { Friendship } from '../../domain/friendship';
import { accept, refuse } from '../../testing/friendship.fixture';
import { InMemoryFriendDirectory } from '../../testing/in-memory-friend-directory';
import { InMemoryFriendshipRepository } from '../../testing/in-memory-friendship.repository';
import { SendFriendRequestUseCase } from './send-friend-request.use-case';

describe('SendFriendRequestUseCase', () => {
  let useCase: SendFriendRequestUseCase;
  let directory: InMemoryFriendDirectory;
  let friendshipRepo: InMemoryFriendshipRepository;
  let alice: ReturnType<typeof aUser>;
  let bob: ReturnType<typeof aUser>;

  beforeEach(async () => {
    directory = new InMemoryFriendDirectory();
    friendshipRepo = new InMemoryFriendshipRepository();
    useCase = new SendFriendRequestUseCase(directory, friendshipRepo);

    alice = aUser({
      email: 'alice@example.com',
      displayName: 'alice',
      passwordHash: 'hashedpw',
    });
    bob = aUser({
      email: 'bob@example.com',
      displayName: 'bob',
      passwordHash: 'hashedpw',
    });

    await directory.save(toPublicUser(alice));
    await directory.save(toPublicUser(bob));
  });

  it('envoie une demande d amitié vers un utilisateur existant', async () => {
    const result = await useCase.execute({
      requesterId: alice.id.value,
      displayName: 'bob',
    });

    expect(result.status).toBe('pending');
    expect(result.requesterId).toBe(alice.id.value);
    expect(result.recipientId).toBe(bob.id.value);
  });

  it('lève CannotFriendSelfError si requester == recipient', async () => {
    await expect(
      useCase.execute({
        requesterId: alice.id.value,
        displayName: 'alice',
      }),
    ).rejects.toThrow(CannotFriendSelfError);
  });

  it('lève RecipientNotFoundError si displayName n existe pas', async () => {
    await expect(
      useCase.execute({
        requesterId: alice.id.value,
        displayName: 'nonexistent',
      }),
    ).rejects.toThrow(RecipientNotFoundError);
  });

  it('lève FriendRequestAlreadyExistsError si une demande pending existe déjà', async () => {
    await useCase.execute({
      requesterId: alice.id.value,
      displayName: 'bob',
    });

    await expect(
      useCase.execute({
        requesterId: alice.id.value,
        displayName: 'bob',
      }),
    ).rejects.toThrow(FriendRequestAlreadyExistsError);
  });

  it('lève AlreadyFriendsError si déjà amis (status accepted)', async () => {
    const req = await useCase.execute({
      requesterId: alice.id.value,
      displayName: 'bob',
    });

    // On rejoue la vraie transition plutôt que de forcer un statut : le domaine
    // n'accepte plus qu'on lui impose un état de l'extérieur.
    await friendshipRepo.save(accept(Friendship.restore(req), bob.id.value));

    await expect(
      useCase.execute({
        requesterId: alice.id.value,
        displayName: 'bob',
      }),
    ).rejects.toThrow(AlreadyFriendsError);
  });

  it('permet de renvoyer une demande après refus (overwrite refused)', async () => {
    const req1 = await useCase.execute({
      requesterId: alice.id.value,
      displayName: 'bob',
    });

    await friendshipRepo.save(refuse(Friendship.restore(req1), bob.id.value));

    const req2 = await useCase.execute({
      requesterId: alice.id.value,
      displayName: 'bob',
    });

    expect(req2.status).toBe('pending');
    expect(req2.id).not.toBe(req1.id);
  });
});
