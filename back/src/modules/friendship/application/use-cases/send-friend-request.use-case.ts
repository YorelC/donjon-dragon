import { Inject, Injectable } from '@nestjs/common';
import type { Friendship as FriendshipResponse } from '@donjon-dragon/shared/friendship-schema';
import { UserId } from '@kernel/domain/user-id';

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
import { Friendship } from '../../domain/friendship';
import { toFriendshipResponse } from '../friendship.mapper';

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

  async execute(dto: SendFriendRequestDto): Promise<FriendshipResponse> {
    const requesterId = UserId.create(dto.requesterId);
    const recipientId = await this.resolveRecipient(dto.displayName);

    const friendship = Friendship.request(requesterId, recipientId);
    await this.assertNoExistingRelation(requesterId, recipientId);

    await this.friendshipRepo.save(friendship);

    return toFriendshipResponse(friendship);
  }

  private async resolveRecipient(displayName: string): Promise<UserId> {
    const recipient = await this.directory.findByDisplayName(displayName);
    if (!recipient) throw new RecipientNotFoundError();

    return UserId.create(recipient.id);
  }

  private async assertNoExistingRelation(
    requesterId: UserId,
    recipientId: UserId,
  ): Promise<void> {
    const existing = await this.friendshipRepo.findBetween(requesterId, recipientId);
    if (existing?.status === 'pending') throw new FriendRequestAlreadyExistsError();
    if (existing?.status === 'accepted') throw new AlreadyFriendsError();
  }
}
