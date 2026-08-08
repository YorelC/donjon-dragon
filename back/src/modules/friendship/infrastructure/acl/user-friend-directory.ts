import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '@modules/user/application/ports/user-repository.port';
import { toPublicUser } from '@modules/user/domain/user.entity';
import type { FriendDirectoryPort } from '../../application/ports/friend-directory.port';

/**
 * SEUL fichier du module amitié autorisé à connaître le module user.
 * Il absorbe ici la traduction User -> PublicUser pour que rien de `user`
 * ne remonte dans application/ ni domain/.
 */
@Injectable()
export class UserFriendDirectory implements FriendDirectoryPort {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async findById(id: string): Promise<PublicUser | null> {
    const user = await this.userRepo.findById(id);
    return user ? toPublicUser(user) : null;
  }

  async findByDisplayName(displayName: string): Promise<PublicUser | null> {
    const user = await this.userRepo.findByDisplayName(displayName);
    return user ? toPublicUser(user) : null;
  }

  async search(query: string, limit: number): Promise<PublicUser[]> {
    const users = await this.userRepo.searchByDisplayName(query, limit);
    return users.map(toPublicUser);
  }
}
