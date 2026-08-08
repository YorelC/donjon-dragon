import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';
import { toPublicUser } from '../user.mapper';

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async byId(id: string): Promise<PublicUser | null> {
    const user = await this.userRepo.findById(id);
    return user ? toPublicUser(user) : null;
  }

  async byDisplayName(displayName: string): Promise<PublicUser | null> {
    const user = await this.userRepo.findByDisplayName(displayName);
    return user ? toPublicUser(user) : null;
  }

  async searchByDisplayName(query: string, limit: number): Promise<PublicUser[]> {
    const users = await this.userRepo.searchByDisplayName(query, limit);
    return users.map(toPublicUser);
  }
}
