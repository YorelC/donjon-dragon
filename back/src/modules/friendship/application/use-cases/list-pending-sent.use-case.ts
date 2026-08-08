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

export interface ListPendingSentDto {
  userId: string;
}

export interface PendingSentFriendship extends Friendship {
  recipient: PublicUser;
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
    const friendships = await this.friendshipRepo.listPendingSent(dto.userId);

    const result: PendingSentFriendship[] = [];
    for (const f of friendships) {
      const recipient = await this.directory.findById(f.recipientId);
      if (recipient) {
        result.push({ ...f, recipient });
      }
    }

    return result;
  }
}
