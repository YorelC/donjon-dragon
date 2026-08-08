import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import type { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { toPublicUser } from '@modules/user/domain/user.entity';

export interface SearchUsersDto {
  userId: string;
  query: string;
}

export class SearchUsersUseCase {
  constructor(private readonly userRepo: UserRepositoryPort) {}

  async execute(dto: SearchUsersDto): Promise<PublicUser[]> {
    const results = await this.userRepo.searchByDisplayName(dto.query, 20);

    return results.filter((u) => u.id !== dto.userId).map(toPublicUser);
  }
}
