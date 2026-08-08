import type { PendingReceivedCount } from '@donjon-dragon/shared/friendship-schema';

import type { FriendshipRepositoryPort } from '../ports/friendship.repository.port';

export interface CountPendingReceivedDto {
  userId: string;
}

export class CountPendingReceivedUseCase {
  constructor(private readonly friendshipRepo: FriendshipRepositoryPort) {}

  async execute(dto: CountPendingReceivedDto): Promise<PendingReceivedCount> {
    const count = await this.friendshipRepo.countPendingReceived(dto.userId);
    return { count };
  }
}