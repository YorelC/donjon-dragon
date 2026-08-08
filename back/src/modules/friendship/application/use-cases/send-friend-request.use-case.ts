import { Inject, Injectable } from '@nestjs/common';
import type { Friendship } from '@donjon-dragon/shared/friendship-schema';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  FRIEND_DIRECTORY,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';
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
    @Inject(FRIEND_DIRECTORY)
    private readonly directory: FriendDirectoryPort,
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
  ) {}

  async execute(dto: SendFriendRequestDto): Promise<Friendship> {
    const recipient = await this.directory.findByDisplayName(dto.displayName);
    if (!recipient) throw new RecipientNotFoundError();

    const friendship = createFriendRequest(dto.requesterId, recipient.id);

    const existing = await this.friendshipRepo.findBetween(dto.requesterId, recipient.id);
    if (existing?.status === 'pending') throw new FriendRequestAlreadyExistsError();
    if (existing?.status === 'accepted') throw new AlreadyFriendsError();

    return this.friendshipRepo.save(friendship);
  }
}
