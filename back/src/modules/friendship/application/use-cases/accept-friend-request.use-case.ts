import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import type { FriendshipRepositoryPort } from '../ports/friendship.repository.port';
import { FriendshipNotFoundError } from '../../domain/friendship.errors';
import { acceptFriendRequest } from '../../domain/friendship.entity';

export interface AcceptFriendRequestDto {
  friendshipId: string;
  actingUserId: string;
}

export class AcceptFriendRequestUseCase {
  constructor(private readonly friendshipRepo: FriendshipRepositoryPort) {}

  async execute(dto: AcceptFriendRequestDto): Promise<Friendship> {
    const friendship = await this.friendshipRepo.findById(dto.friendshipId);
    if (!friendship) throw new FriendshipNotFoundError();

    const updated = acceptFriendRequest(friendship, dto.actingUserId);
    return this.friendshipRepo.save(updated);
  }
}
