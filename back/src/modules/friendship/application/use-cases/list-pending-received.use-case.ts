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

export interface ListPendingReceivedDto {
  userId: string;
}

export interface PendingReceivedFriendship extends Friendship {
  requester: ReturnType<typeof toPublicUser>;
}

@Injectable()
export class ListPendingReceivedUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(dto: ListPendingReceivedDto): Promise<PendingReceivedFriendship[]> {
    const friendships = await this.friendshipRepo.listPendingReceived(dto.userId);

    const result: PendingReceivedFriendship[] = [];
    for (const f of friendships) {
      const requester = await this.userRepo.findById(f.requesterId);
      if (requester) {
        result.push({
          ...f,
          requester: toPublicUser(requester),
        });
      }
    }

    return result;
  }
}
