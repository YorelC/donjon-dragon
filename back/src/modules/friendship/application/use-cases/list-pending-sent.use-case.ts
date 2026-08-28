import { Inject, Injectable } from '@nestjs/common';
import type { FriendRequest } from '@donjon-dragon/shared/friendship-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import type { UserSummary } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  FRIEND_DIRECTORY,
  type DirectoryUser,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';
import { toFriendRequestResponse, toUserSummary } from '../friendship.mapper';
import { indexDirectoryUsers } from '../directory-index';
import type { Friendship } from '../../domain/friendship';

export interface ListPendingSentDto {
  userId: ActorId;
}

export interface PendingSentFriendship extends FriendRequest {
  recipient: UserSummary;
}

@Injectable()
export class ListPendingSentUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
    @Inject(FRIEND_DIRECTORY)
    private readonly directory: FriendDirectoryPort,
  ) {}

  async execute(dto: ListPendingSentDto): Promise<PendingSentFriendship[]> {
    const friendships = await this.friendshipRepo.listPendingSent(
      UserId.create(dto.userId),
    );

    const recipients = await indexDirectoryUsers(
      this.directory,
      friendships.map((friendship) => friendship.recipientId.value),
    );

    return friendships.flatMap((friendship) =>
      this.describe(friendship, recipients.get(friendship.recipientId.value)),
    );
  }

  // Un destinataire introuvable dans l'annuaire disparaît de la liste plutôt que de
  // la faire échouer : le compte a pu être supprimé sans que la demande le soit.
  private describe(
    friendship: Friendship,
    recipient: DirectoryUser | undefined,
  ): PendingSentFriendship[] {
    if (!recipient) return [];
    return [
      { ...toFriendRequestResponse(friendship), recipient: toUserSummary(recipient) },
    ];
  }
}
