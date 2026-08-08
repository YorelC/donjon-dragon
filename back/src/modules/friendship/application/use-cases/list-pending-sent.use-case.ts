import { Inject, Injectable } from '@nestjs/common';
import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@modules/user/application/ports/user-repository.port';
import { toPublicUser } from '@modules/user/domain/user.entity';

export interface ListPendingSentDto {
  userId: string;
}

export interface PendingSentFriendship extends Friendship {
  recipient: ReturnType<typeof toPublicUser>;
}

@Injectable()
export class ListPendingSentUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(dto: ListPendingSentDto): Promise<PendingSentFriendship[]> {
    const friendships = await this.friendshipRepo.listPendingSent(dto.userId);

    const result: PendingSentFriendship[] = [];
    for (const f of friendships) {
      const recipient = await this.userRepo.findById(f.recipientId);
      if (recipient) {
        result.push({
          ...f,
          recipient: toPublicUser(recipient),
        });
      }
    }

    return result;
  }
}
