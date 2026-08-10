import { Inject, Injectable } from '@nestjs/common';
import { SEARCH_PAGE_SIZE, type UserSearchResult } from '@donjon-dragon/shared/friendship-schema';
import type { ActorId } from '@kernel/domain/actor-id';

import {
  FRIEND_DIRECTORY,
  type FriendDirectoryPort,
} from '../ports/friend-directory.port';
import { toUserSummary } from '../friendship.mapper';

export interface SearchUsersDto {
  userId: ActorId;
  query: string;
  page: number;
}

@Injectable()
export class SearchUsersUseCase {
  constructor(
    @Inject(FRIEND_DIRECTORY)
    private readonly directory: FriendDirectoryPort,
  ) {}

  async execute(dto: SearchUsersDto): Promise<UserSearchResult> {
    const page = await this.directory.search(dto.query, dto.page, SEARCH_PAGE_SIZE);

    // On s'exclut soi-même des résultats. Le filtre porte sur l'id, disponible
    // dans l'annuaire, avant que le mapper ne le retire de la réponse.
    const items = page.items.filter((user) => user.id !== dto.userId).map(toUserSummary);
    return { items, hasMore: page.hasMore };
  }
}
