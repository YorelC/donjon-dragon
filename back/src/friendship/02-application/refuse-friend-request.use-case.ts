import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import type { FriendshipRepositoryPort } from '../03-domain/friendship.repository.port';
import { FriendshipNotFoundError } from '../03-domain/friendship.errors';
import { refuseFriendRequest } from '../03-domain/friendship.entity';

export interface RefuseFriendRequestDto {
  friendshipId: string;
  actingUserId: string;
}

export class RefuseFriendRequestUseCase {
  constructor(private readonly friendshipRepo: FriendshipRepositoryPort) {}

  async execute(dto: RefuseFriendRequestDto): Promise<Friendship> {
    const friendship = await this.friendshipRepo.findById(dto.friendshipId);
    if (!friendship) throw new FriendshipNotFoundError();

    const updated = refuseFriendRequest(friendship, dto.actingUserId);
    return this.friendshipRepo.save(updated);
  }
}
