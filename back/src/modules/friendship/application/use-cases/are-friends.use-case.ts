import { Inject, Injectable } from '@nestjs/common';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import { FRIENDSHIP_STATUS } from '../../domain/friendship-status';

/**
 * Prédicat symétrique sur deux utilisateurs : aucun des deux n'est la cible
 * d'une décision d'autorisation, d'où deux `string` et non un `ActorId`. Le
 * module qui interroge ce prédicat garde la responsabilité de savoir qui agit.
 */
export interface AreFriendsDto {
  userId: string;
  otherUserId: string;
}

/**
 * Surface publique de `friendship` pour les modules en aval : ils demandent le
 * fait, jamais la relation. Sans lui, `campaigns` devrait lister tous les amis
 * pour en chercher un seul.
 */
@Injectable()
export class AreFriendsUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
  ) {}

  async execute(dto: AreFriendsDto): Promise<boolean> {
    const friendship = await this.friendshipRepo.findBetween(
      UserId.create(dto.userId),
      UserId.create(dto.otherUserId),
    );

    return friendship?.status === FRIENDSHIP_STATUS.accepted;
  }
}
