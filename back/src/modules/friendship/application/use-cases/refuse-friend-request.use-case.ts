import { Inject, Injectable } from '@nestjs/common';
import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import { FriendshipNotFoundError } from '../../domain/friendship.errors';
import { refuseFriendRequest } from '../../domain/friendship.entity';

export interface RefuseFriendRequestDto {
  friendshipId: string;
  actingUserId: string;
}

@Injectable()
export class RefuseFriendRequestUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
  ) {}

  async execute(dto: RefuseFriendRequestDto): Promise<Friendship> {
    const friendship = await this.friendshipRepo.findById(dto.friendshipId);
    if (!friendship) throw new FriendshipNotFoundError();

    const updated = refuseFriendRequest(friendship, dto.actingUserId);
    return this.friendshipRepo.save(updated);
  }
}
