import { Injectable } from '@nestjs/common';

import { GetUserProfileUseCase } from '@modules/user/application/use-cases/get-user-profile.use-case';
import type {
  DirectoryPage,
  DirectoryUser,
  FriendDirectoryPort,
} from '../../application/ports/friend-directory.port';

/**
 * SEUL fichier du module amitié qui connaît le module user.
 *
 * Il délègue aux use-cases de user, jamais à son repository : friendship est en
 * lecture seule sur cet agrégat, et n'a aucun moyen d'y écrire.
 */
@Injectable()
export class UserFriendDirectory implements FriendDirectoryPort {
  constructor(private readonly getUserProfile: GetUserProfileUseCase) {}

  async findById(id: string): Promise<DirectoryUser | null> {
    return this.getUserProfile.identityById(id);
  }

  async findByIds(ids: string[]): Promise<DirectoryUser[]> {
    return this.getUserProfile.identitiesByIds(ids);
  }

  async findByDisplayName(displayName: string): Promise<DirectoryUser | null> {
    return this.getUserProfile.identityByDisplayName(displayName);
  }

  async search(query: string, page: number, limit: number): Promise<DirectoryPage> {
    return this.getUserProfile.searchIdentities(query, page, limit);
  }
}
