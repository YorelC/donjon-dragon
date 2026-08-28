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

export interface ListPendingReceivedDto {
  userId: ActorId;
}

export interface PendingReceivedFriendship extends FriendRequest {
  requester: UserSummary;
}

@Injectable()
export class ListPendingReceivedUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
    @Inject(FRIEND_DIRECTORY)
    private readonly directory: FriendDirectoryPort,
  ) {}

  async execute(dto: ListPendingReceivedDto): Promise<PendingReceivedFriendship[]> {
    const friendships = await this.friendshipRepo.listPendingReceived(
      UserId.create(dto.userId),
    );

    const requesters = await indexDirectoryUsers(
      this.directory,
      friendships.map((friendship) => friendship.requesterId.value),
    );

    return friendships.flatMap((friendship) =>
      this.describe(friendship, requesters.get(friendship.requesterId.value)),
    );
  }

  // Un demandeur introuvable dans l'annuaire disparaît de la liste plutôt que de la
  // faire échouer : le compte a pu être supprimé sans que la demande le soit.
  private describe(
    friendship: Friendship,
    requester: DirectoryUser | undefined,
  ): PendingReceivedFriendship[] {
    if (!requester) return [];
    return [
      { ...toFriendRequestResponse(friendship), requester: toUserSummary(requester) },
    ];
  }
}
