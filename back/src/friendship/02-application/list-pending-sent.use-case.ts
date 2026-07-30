import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import type { FriendshipRepositoryPort } from '../03-domain/friendship.repository.port';
import type { UserRepositoryPort } from '../../user/03-domain/user.repository.port';
import { toPublicUser } from '../../user/03-domain/user.entity';

export interface ListPendingSentDto {
  userId: string;
}

export interface PendingSentFriendship extends Friendship {
  recipient: ReturnType<typeof toPublicUser>;
}

export class ListPendingSentUseCase {
  constructor(
    private readonly friendshipRepo: FriendshipRepositoryPort,
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
