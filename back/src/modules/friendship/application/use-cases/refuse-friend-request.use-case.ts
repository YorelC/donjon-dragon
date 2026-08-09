import { Inject, Injectable } from '@nestjs/common';
import type { FriendRequest } from '@donjon-dragon/shared/friendship-schema';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import { FriendshipId } from '../../domain/friendship-id';
import { FriendshipNotFoundError } from '../../domain/friendship.errors';
import { toFriendRequestResponse } from '../friendship.mapper';

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

  async execute(dto: RefuseFriendRequestDto): Promise<FriendRequest> {
    const friendship = await this.friendshipRepo.findById(
      FriendshipId.create(dto.friendshipId),
    );
    if (!friendship) throw new FriendshipNotFoundError();

    friendship.refuse(UserId.create(dto.actingUserId));
    await this.friendshipRepo.save(friendship);

    return toFriendRequestResponse(friendship);
  }
}
