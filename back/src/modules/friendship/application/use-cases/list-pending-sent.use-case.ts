import { Inject, Injectable } from '@nestjs/common';
import type { FriendRequest } from '@donjon-dragon/shared/friendship-schema';
import type { UserSummary } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  FRIEND_DIRECTORY,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';
import { toFriendRequestResponse, toUserSummary } from '../friendship.mapper';

export interface ListPendingSentDto {
  userId: string;
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

    const result: PendingSentFriendship[] = [];
    for (const friendship of friendships) {
      const recipient = await this.directory.findById(friendship.recipientId.value);
      if (recipient) {
        result.push({
          ...toFriendRequestResponse(friendship),
          recipient: toUserSummary(recipient),
        });
      }
    }

    return result;
  }
}
