import { Inject, Injectable } from '@nestjs/common';
import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@modules/user/application/ports/user-repository.port';
import {
  AlreadyFriendsError,
  RecipientNotFoundError,
  FriendRequestAlreadyExistsError,
} from '../../domain/friendship.errors';
import { createFriendRequest } from '../../domain/friendship.entity';

export interface SendFriendRequestDto {
  requesterId: string;
  displayName: string;
}

@Injectable()
export class SendFriendRequestUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
    @Inject(FRIENDSHIP_REPOSITORY)
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
