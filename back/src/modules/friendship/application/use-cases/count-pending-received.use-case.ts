import { Inject, Injectable } from '@nestjs/common';
import type { PendingReceivedCount } from '@donjon-dragon/shared/friendship-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';

export interface CountPendingReceivedDto {
  userId: ActorId;
}

@Injectable()
export class CountPendingReceivedUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
  ) {}

  async execute(dto: CountPendingReceivedDto): Promise<PendingReceivedCount> {
    const count = await this.friendshipRepo.countPendingReceived(
      UserId.create(dto.userId),
    );

    return { count };
  }
}
