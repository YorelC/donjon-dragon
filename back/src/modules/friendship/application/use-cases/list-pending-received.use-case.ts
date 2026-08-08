import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import type { FriendshipRepositoryPort } from '../ports/friendship.repository.port';
import type { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { toPublicUser } from '@modules/user/domain/user.entity';

export interface ListPendingReceivedDto {
  userId: string;
}

export interface PendingReceivedFriendship extends Friendship {
  requester: ReturnType<typeof toPublicUser>;
}

export class ListPendingReceivedUseCase {
  constructor(
    private readonly friendshipRepo: FriendshipRepositoryPort,
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
