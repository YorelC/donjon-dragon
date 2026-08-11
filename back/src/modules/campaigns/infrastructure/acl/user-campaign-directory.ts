import { Injectable } from '@nestjs/common';

import { GetUserProfileUseCase } from '@modules/user/application/use-cases/get-user-profile.use-case';
import type {
  CampaignDirectoryPort,
  DirectoryUser,
} from '../../application/ports/campaign-directory.port';

/**
 * SEUL fichier du module campagne qui connaît le module user.
 *
 * Il délègue aux use-cases de user, jamais à son repository : campaigns est en
 * lecture seule sur cet agrégat, et n'a aucun moyen d'y écrire.
 */
@Injectable()
export class UserCampaignDirectory implements CampaignDirectoryPort {
  constructor(private readonly getUserProfile: GetUserProfileUseCase) {}

  async findById(id: string): Promise<DirectoryUser | null> {
    return this.getUserProfile.identityById(id);
  }

  async findByDisplayName(displayName: string): Promise<DirectoryUser | null> {
    return this.getUserProfile.identityByDisplayName(displayName);
  }

  async findManyByIds(ids: string[]): Promise<DirectoryUser[]> {
    return this.getUserProfile.identitiesByIds(ids);
  }
}
