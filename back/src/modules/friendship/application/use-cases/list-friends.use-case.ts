import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  FRIEND_DIRECTORY,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';
import { friendIdFor } from '../../domain/friendship.entity';

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
    const friendships = await this.friendshipRepo.listAcceptedForUser(dto.userId);

    const friends: AcceptedFriend[] = [];
    for (const f of friendships) {
      const friend = await this.directory.findById(friendIdFor(f, dto.userId));
      if (friend) {
        friends.push({ friendshipId: f.id, friend });
      }
    }

    return friends;
  }
}
