import { Inject, Injectable } from '@nestjs/common';
import type { FriendRequest } from '@donjon-dragon/shared/friendship-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';
import { CLOCK, type Clock } from '@kernel/application/clock.port';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import { FriendshipId } from '../../domain/friendship-id';
import { FriendshipNotFoundError } from '../../domain/friendship.errors';
import { toFriendRequestResponse } from '../friendship.mapper';

export interface AcceptFriendRequestDto {
  friendshipId: string;
  actingUserId: ActorId;
}

@Injectable()
export class AcceptFriendRequestUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: AcceptFriendRequestDto): Promise<FriendRequest> {
    const friendship = await this.friendshipRepo.findById(
      FriendshipId.create(dto.friendshipId),
    );
    if (!friendship) throw new FriendshipNotFoundError();

    // L'agrégat porte la règle : seul le destinataire d'une demande 'pending'.
    friendship.accept(UserId.create(dto.actingUserId), this.clock.now());
    await this.friendshipRepo.save(friendship);

    return toFriendRequestResponse(friendship);
  }
}
