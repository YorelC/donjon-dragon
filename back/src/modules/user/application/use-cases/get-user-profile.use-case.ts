import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';
import { DisplayName } from '../../domain/display-name';
import { toPublicUser, toUserIdentity, type UserIdentity } from '../user.mapper';

/**
 * Lectures de l'agrégat User.
 *
 * `ownProfile` renvoie le profil complet — c'est l'utilisateur qui se regarde
 * lui-même. Les autres méthodes servent aux modules voisins et ne rendent qu'une
 * `UserIdentity` : de quoi désigner et afficher, jamais l'email ni l'état du compte.
 */
@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async ownProfile(id: string): Promise<PublicUser | null> {
    const user = await this.userRepo.findById(UserId.create(id));
    return user ? toPublicUser(user) : null;
  }

  async identityById(id: string): Promise<UserIdentity | null> {
    const user = await this.userRepo.findById(UserId.create(id));
    return user ? toUserIdentity(user) : null;
  }

  async identityByDisplayName(displayName: string): Promise<UserIdentity | null> {
    const user = await this.userRepo.findByDisplayName(
      DisplayName.create(displayName),
    );
    return user ? toUserIdentity(user) : null;
  }

  /** Recherche floue : la requête est un fragment libre, pas un pseudo valide. */
  async searchIdentities(query: string, limit: number): Promise<UserIdentity[]> {
    const users = await this.userRepo.searchByDisplayName(query, limit);
    return users.map(toUserIdentity);
  }
}
