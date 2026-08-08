import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import type { FriendshipRepositoryPort } from '../ports/friendship.repository.port';
import type { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { friendIdFor } from '../../domain/friendship.entity';
import { toPublicUser } from '@modules/user/domain/user.entity';

export interface ListFriendsDto {
  userId: string;
}

export interface AcceptedFriend {
  friendshipId: string;
  friend: PublicUser;
}

export class ListFriendsUseCase {
  constructor(
    private readonly friendshipRepo: FriendshipRepositoryPort,
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
