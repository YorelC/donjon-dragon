import type { FriendshipRepositoryPort } from '../03-domain/friendship.repository.port';
import {
  FriendshipNotFoundError,
  NotFriendshipParticipantError,
} from '../03-domain/friendship.errors';
import { involvesUser } from '../03-domain/friendship.entity';

export interface RemoveFriendDto {
  userId: string;
  friendshipId: string;
}

export class RemoveFriendUseCase {
  constructor(private readonly friendshipRepo: FriendshipRepositoryPort) {}

  async execute(dto: RemoveFriendDto): Promise<void> {
    const friendship = await this.friendshipRepo.findById(dto.friendshipId);
    if (!friendship) throw new FriendshipNotFoundError();

    if (!involvesUser(friendship, dto.userId)) throw new NotFriendshipParticipantError();

    await this.friendshipRepo.deleteById(dto.friendshipId);
  }
}
