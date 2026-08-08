import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';
import { toPublicUser } from '../user.mapper';

/**
 * Le hash sort du module, mais seul et nommé : c'est le strict nécessaire pour
 * que auth vérifie un mot de passe. Le reste du profil est déjà sérialisé, donc
 * aucun appelant n'a à manipuler l'entité User complète.
 */
export interface UserCredentials {
  profile: PublicUser;
  passwordHash: string;
}

@Injectable()
export class GetUserCredentialsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(email: string): Promise<UserCredentials | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return null;

    return { profile: toPublicUser(user), passwordHash: user.passwordHash };
  }
}
