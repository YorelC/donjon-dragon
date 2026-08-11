import { Injectable } from '@nestjs/common';

import { GetUserProfileUseCase } from '@modules/user/application/use-cases/get-user-profile.use-case';
import type {
  CharacterDirectoryPort,
  CharacterDirectoryUser,
} from '../../application/ports/character-directory.port';

/** SEUL fichier du module characters qui connaît le module user. */
@Injectable()
export class UserCharacterDirectory implements CharacterDirectoryPort {
  constructor(private readonly getUserProfile: GetUserProfileUseCase) {}

  async findById(id: string): Promise<CharacterDirectoryUser | null> {
    return this.getUserProfile.identityById(id);
  }

  async findByDisplayName(displayName: string): Promise<CharacterDirectoryUser | null> {
    return this.getUserProfile.identityByDisplayName(displayName);
  }
}
