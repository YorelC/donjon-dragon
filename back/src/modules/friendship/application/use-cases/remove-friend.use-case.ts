import { Inject, Injectable } from '@nestjs/common';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import { FriendshipId } from '../../domain/friendship-id';
import { FriendshipNotFoundError } from '../../domain/friendship.errors';

export interface RemoveFriendDto {
  userId: string;
  friendshipId: string;
}

@Injectable()
export class RemoveFriendUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
  ) {}

  async execute(dto: RemoveFriendDto): Promise<void> {
    const id = FriendshipId.create(dto.friendshipId);

    const friendship = await this.friendshipRepo.findById(id);
    if (!friendship) throw new FriendshipNotFoundError();

    friendship.assertInvolves(UserId.create(dto.userId));

    await this.friendshipRepo.deleteById(id);
  }
}
