import { Inject, Injectable } from '@nestjs/common';
import type { CampaignCommandResult } from '@donjon-dragon/shared/campaign-schema';
import {
  LeaveCampaignUseCase,
  type LeaveCampaignDto,
} from '@modules/campaigns/application/use-cases/leave-campaign.use-case';

import { CHARACTER_REPOSITORY, type CharacterRepositoryPort } from '../ports/character.repository.port';
import { unassignCampaignMember } from './unassign-campaign-member.use-case';

@Injectable()
export class LeaveCampaignWithCharacterUseCase {
  constructor(
    private readonly leave: LeaveCampaignUseCase,
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
  ) {}

  execute(dto: LeaveCampaignDto): Promise<CampaignCommandResult> {
    return this.leave.execute(
      dto,
      (request) => unassignCampaignMember(this.characters, request),
    );
  }
}
