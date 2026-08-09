import { Inject, Injectable } from '@nestjs/common';
import type { FriendRequest } from '@donjon-dragon/shared/friendship-schema';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import { FriendshipId } from '../../domain/friendship-id';
import { FriendshipNotFoundError } from '../../domain/friendship.errors';
import { toFriendRequestResponse } from '../friendship.mapper';

export interface AcceptFriendRequestDto {
  friendshipId: string;
  actingUserId: string;
}

@Injectable()
export class AcceptFriendRequestUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
  ) {}

  async execute(dto: AcceptFriendRequestDto): Promise<FriendRequest> {
    const friendship = await this.friendshipRepo.findById(
      FriendshipId.create(dto.friendshipId),
    );
    if (!friendship) throw new FriendshipNotFoundError();

    // L'agrégat porte la règle : seul le destinataire d'une demande 'pending'.
    friendship.accept(UserId.create(dto.actingUserId));
    await this.friendshipRepo.save(friendship);

    return toFriendRequestResponse(friendship);
  }
}
