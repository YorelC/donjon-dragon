import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@modules/user/application/ports/user-repository.port';
import { toPublicUser } from '@modules/user/domain/user.entity';

export interface SearchUsersDto {
  userId: string;
  query: string;
}

@Injectable()
export class SearchUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(dto: SearchUsersDto): Promise<PublicUser[]> {
    const results = await this.userRepo.searchByDisplayName(dto.query, 20);

    return results.filter((u) => u.id !== dto.userId).map(toPublicUser);
  }
}
