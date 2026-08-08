import { Inject, Injectable } from '@nestjs/common';
import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  FriendshipNotFoundError,
  NotFriendshipParticipantError,
} from '../../domain/friendship.errors';
import { involvesUser } from '../../domain/friendship.entity';

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
    const friendship = await this.friendshipRepo.findById(dto.friendshipId);
    if (!friendship) throw new FriendshipNotFoundError();

    if (!involvesUser(friendship, dto.userId)) throw new NotFriendshipParticipantError();

    await this.friendshipRepo.deleteById(dto.friendshipId);
  }
}
