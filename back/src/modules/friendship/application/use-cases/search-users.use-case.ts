import { Inject, Injectable } from '@nestjs/common';
import type { UserSummary } from '@donjon-dragon/shared/user-schema';

import {
  FRIEND_DIRECTORY,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';
import { toUserSummary } from '../friendship.mapper';

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

  async execute(dto: SearchUsersDto): Promise<UserSummary[]> {
    const results = await this.directory.search(dto.query, SEARCH_RESULT_LIMIT);

    // On s'exclut soi-même des résultats. Le filtre porte sur l'id, disponible
    // dans l'annuaire, avant que le mapper ne le retire de la réponse.
    return results.filter((user) => user.id !== dto.userId).map(toUserSummary);
  }
}
