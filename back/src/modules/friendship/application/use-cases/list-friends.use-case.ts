import { Inject, Injectable } from '@nestjs/common';
import type { UserSummary } from '@donjon-dragon/shared/user-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  FRIEND_DIRECTORY,
  type DirectoryUser,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';
import { toUserSummary } from '../friendship.mapper';
import { indexDirectoryUsers } from '../directory-index';
import type { Friendship } from '../../domain/friendship';

export interface ListFriendsDto {
  userId: ActorId;
}

export interface AcceptedFriend {
  friendshipId: string;
  friend: UserSummary;
}

@Injectable()
export class ListFriendsUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepo: FriendshipRepositoryPort,
    @Inject(FRIEND_DIRECTORY)
    private readonly directory: FriendDirectoryPort,
  ) {}

  async execute(dto: ListFriendsDto): Promise<AcceptedFriend[]> {
    const userId = UserId.create(dto.userId);
    const friendships = await this.friendshipRepo.listAcceptedForUser(userId);
    const friends = await indexDirectoryUsers(
      this.directory,
      friendships.map((friendship) => friendship.friendIdFor(userId).value),
    );

    return friendships.flatMap((friendship) =>
      this.describe(friendship, friends.get(friendship.friendIdFor(userId).value)),
    );
  }

  // Un ami introuvable dans l'annuaire disparaît de la liste plutôt que de la faire
  // échouer : le compte a pu être supprimé sans que l'amitié le soit.
  private describe(
    friendship: Friendship,
    friend: DirectoryUser | undefined,
  ): AcceptedFriend[] {
    if (!friend) return [];
    return [{ friendshipId: friendship.id.value, friend: toUserSummary(friend) }];
  }
}
