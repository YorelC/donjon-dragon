import { describe, it, expect, beforeEach } from 'vitest';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { anActor } from '@kernel/testing/actor.fixture';
import { aUser } from '@modules/user/testing/user.fixture';
import { toUserIdentity } from '@modules/user/application/user.mapper';
import {
  CannotFriendSelfError,
  RecipientNotFoundError,
  FriendRequestAlreadyExistsError,
  AlreadyFriendsError,
} from '../../domain/friendship.errors';
import { FriendshipId } from '../../domain/friendship-id';
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
    useCase = new SendFriendRequestUseCase(
      directory,
      friendshipRepo,
      new FixedClock(),
    );

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

    await directory.save(toUserIdentity(alice));
    await directory.save(toUserIdentity(bob));
  });

  it('envoie une demande d amitié vers un utilisateur existant', async () => {
    const result = await useCase.execute({
      requesterId: anActor(alice.id.value),
      displayName: 'bob',
    });

    expect(result.status).toBe('pending');
    expect(result.id).toBeTruthy();
    // Les identifiants des deux parties ne partent PAS dans la reponse ; c'est
    // l'agregat persiste qui les porte.
    expect(result).not.toHaveProperty('requesterId');
    expect(result).not.toHaveProperty('recipientId');

    const stored = await friendshipRepo.findById(FriendshipId.create(result.id));
    expect(stored?.requesterId.value).toBe(alice.id.value);
    expect(stored?.recipientId.value).toBe(bob.id.value);
  });

  it('lève CannotFriendSelfError si requester == recipient', async () => {
    await expect(
      useCase.execute({
        requesterId: anActor(alice.id.value),
        displayName: 'alice',
      }),
    ).rejects.toThrow(CannotFriendSelfError);
  });

  it('lève RecipientNotFoundError si displayName n existe pas', async () => {
    await expect(
      useCase.execute({
        requesterId: anActor(alice.id.value),
        displayName: 'nonexistent',
      }),
    ).rejects.toThrow(RecipientNotFoundError);
  });

  it('lève FriendRequestAlreadyExistsError si une demande pending existe déjà', async () => {
    await useCase.execute({
      requesterId: anActor(alice.id.value),
      displayName: 'bob',
    });

    await expect(
      useCase.execute({
        requesterId: anActor(alice.id.value),
        displayName: 'bob',
      }),
    ).rejects.toThrow(FriendRequestAlreadyExistsError);
  });

  it('lève AlreadyFriendsError si déjà amis (status accepted)', async () => {
    const req = await useCase.execute({
      requesterId: anActor(alice.id.value),
      displayName: 'bob',
    });

    // On relit l'agrégat par le handle que le client possède, puis on rejoue la
    // vraie transition : le domaine n'accepte plus qu'on lui impose un état, et la
    // réponse ne contient plus de quoi le reconstruire.
    await friendshipRepo.save(accept(await stored(req.id), bob.id.value));

    await expect(
      useCase.execute({
        requesterId: anActor(alice.id.value),
        displayName: 'bob',
      }),
    ).rejects.toThrow(AlreadyFriendsError);
  });

  it('permet de renvoyer une demande après refus (overwrite refused)', async () => {
    const req1 = await useCase.execute({
      requesterId: anActor(alice.id.value),
      displayName: 'bob',
    });

    await friendshipRepo.save(refuse(await stored(req1.id), bob.id.value));

    const req2 = await useCase.execute({
      requesterId: anActor(alice.id.value),
      displayName: 'bob',
    });

    expect(req2.status).toBe('pending');
    expect(req2.id).not.toBe(req1.id);
  });

  async function stored(friendshipId: string) {
    const friendship = await friendshipRepo.findById(
      FriendshipId.create(friendshipId),
    );
    if (!friendship) throw new Error(`friendship ${friendshipId} absent du repo`);

    return friendship;
  }
});
