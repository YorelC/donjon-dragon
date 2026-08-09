import { Inject, Injectable } from '@nestjs/common';
import type { FriendRequest } from '@donjon-dragon/shared/friendship-schema';
import { UserId } from '@kernel/domain/user-id';
import { CLOCK, type Clock } from '@kernel/application/clock.port';

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
import { FRIENDSHIP_STATUS } from '../../domain/friendship-status';
import { toFriendRequestResponse } from '../friendship.mapper';

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
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: SendFriendRequestDto): Promise<FriendRequest> {
    const requesterId = UserId.create(dto.requesterId);
    const recipientId = await this.resolveRecipient(dto.displayName);

    const friendship = Friendship.request(requesterId, recipientId, this.clock.now());
    await this.assertNoExistingRelation(requesterId, recipientId);

    await this.friendshipRepo.save(friendship);

    return toFriendRequestResponse(friendship);
  }

  /**
   * Le pseudo est ce que le client envoie ; l'id ne sert qu'ici, pour construire
   * l'agrégat. Il ne repart pas dans la réponse.
   */
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
    if (existing?.status === FRIENDSHIP_STATUS.pending) {
      throw new FriendRequestAlreadyExistsError();
    }
    if (existing?.status === FRIENDSHIP_STATUS.accepted) {
      throw new AlreadyFriendsError();
    }
  }
}
