import { Inject, Injectable } from '@nestjs/common';
import type { PendingReceivedCount } from '@donjon-dragon/shared/friendship-schema';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';

export interface CountPendingReceivedDto {
  userId: string;
}

@Injectable()
export class CountPendingReceivedUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
  ) {}

  async execute(dto: CountPendingReceivedDto): Promise<PendingReceivedCount> {
    const count = await this.friendshipRepo.countPendingReceived(dto.userId);
    return { count };
  }
}