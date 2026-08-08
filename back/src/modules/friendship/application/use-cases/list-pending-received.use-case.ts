import { Inject, Injectable } from '@nestjs/common';
import type { Friendship } from '@donjon-dragon/shared/friendship-schema';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  FRIEND_DIRECTORY,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';

export interface ListPendingReceivedDto {
  userId: string;
}

export interface PendingReceivedFriendship extends Friendship {
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
    const friendships = await this.friendshipRepo.listPendingReceived(dto.userId);

    const result: PendingReceivedFriendship[] = [];
    for (const f of friendships) {
      const requester = await this.directory.findById(f.requesterId);
      if (requester) {
        result.push({ ...f, requester });
      }
    }

    return result;
  }
}
