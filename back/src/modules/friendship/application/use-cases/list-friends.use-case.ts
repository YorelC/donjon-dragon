import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  FRIEND_DIRECTORY,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';

export interface ListFriendsDto {
  userId: string;
}

export interface AcceptedFriend {
  friendshipId: string;
  friend: PublicUser;
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

    const friends: AcceptedFriend[] = [];
    for (const friendship of friendships) {
      const friend = await this.directory.findById(
        friendship.friendIdFor(userId).value,
      );
      if (friend) {
        friends.push({ friendshipId: friendship.id.value, friend });
      }
    }

    return friends;
  }
}
