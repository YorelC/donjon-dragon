import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import type { FriendshipRepositoryPort } from '../03-domain/friendship.repository.port';
import type { UserRepositoryPort } from '../../user/03-domain/user.repository.port';
import {
  AlreadyFriendsError,
  RecipientNotFoundError,
  FriendRequestAlreadyExistsError,
} from '../03-domain/friendship.errors';
import { createFriendRequest } from '../03-domain/friendship.entity';

export interface SendFriendRequestDto {
  requesterId: string;
  displayName: string;
}

export class SendFriendRequestUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly friendshipRepo: FriendshipRepositoryPort,
  ) {}

  async execute(dto: SendFriendRequestDto): Promise<Friendship> {
    const recipient = await this.userRepo.findByDisplayName(dto.displayName);
    if (!recipient) throw new RecipientNotFoundError();

    const friendship = createFriendRequest(dto.requesterId, recipient.id);

    const existing = await this.friendshipRepo.findBetween(dto.requesterId, recipient.id);
    if (existing?.status === 'pending') throw new FriendRequestAlreadyExistsError();
    if (existing?.status === 'accepted') throw new AlreadyFriendsError();

    return this.friendshipRepo.save(friendship);
  }
}
