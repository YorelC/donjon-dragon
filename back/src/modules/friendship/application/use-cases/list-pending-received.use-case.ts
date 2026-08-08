import { Inject, Injectable } from '@nestjs/common';
import type { Friendship as FriendshipResponse } from '@donjon-dragon/shared/friendship-schema';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  FRIEND_DIRECTORY,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';
import { toFriendshipResponse } from '../friendship.mapper';

export interface ListPendingReceivedDto {
  userId: string;
}

export interface PendingReceivedFriendship extends FriendshipResponse {
  requester: PublicUser;
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

    const result: PendingReceivedFriendship[] = [];
    for (const friendship of friendships) {
      const requester = await this.directory.findById(friendship.requesterId.value);
      if (requester) {
        result.push({ ...toFriendshipResponse(friendship), requester });
      }
    }

    return result;
  }
}
