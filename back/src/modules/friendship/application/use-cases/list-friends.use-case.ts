import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import {
  FRIENDSHIP_REPOSITORY,
  type FriendshipRepositoryPort,
} from '../ports/friendship.repository.port';
import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@modules/user/application/ports/user-repository.port';
import { friendIdFor } from '../../domain/friendship.entity';
import { toPublicUser } from '@modules/user/domain/user.entity';

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
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(dto: ListFriendsDto): Promise<AcceptedFriend[]> {
    const friendships = await this.friendshipRepo.listAcceptedForUser(dto.userId);

    const friends: AcceptedFriend[] = [];
    for (const f of friendships) {
      const friendId = friendIdFor(f, dto.userId);
      const user = await this.userRepo.findById(friendId);
      if (user) {
        friends.push({
          friendshipId: f.id,
          friend: toPublicUser(user),
        });
      }
    }

    return friends;
  }
}
