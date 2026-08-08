import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';
import { DisplayName } from '../../domain/display-name';
import { toPublicUser } from '../user.mapper';

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async byId(id: string): Promise<PublicUser | null> {
    const user = await this.userRepo.findById(UserId.create(id));
    return user ? toPublicUser(user) : null;
  }

  async byDisplayName(displayName: string): Promise<PublicUser | null> {
    const user = await this.userRepo.findByDisplayName(
      DisplayName.create(displayName),
    );
    return user ? toPublicUser(user) : null;
  }

  /** Recherche floue : la requête est un fragment libre, pas un pseudo valide. */
  async searchByDisplayName(query: string, limit: number): Promise<PublicUser[]> {
    const users = await this.userRepo.searchByDisplayName(query, limit);
    return users.map(toPublicUser);
  }
}
