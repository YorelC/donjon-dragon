import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import {
  FRIEND_DIRECTORY,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';

export interface SearchUsersDto {
  userId: string;
  query: string;
}

const SEARCH_RESULT_LIMIT = 20;

@Injectable()
export class SearchUsersUseCase {
  constructor(
    @Inject(FRIEND_DIRECTORY)
    private readonly directory: FriendDirectoryPort,
  ) {}

  async execute(dto: SearchUsersDto): Promise<PublicUser[]> {
    const results = await this.directory.search(dto.query, SEARCH_RESULT_LIMIT);

    return results.filter((user) => user.id !== dto.userId);
  }
}
