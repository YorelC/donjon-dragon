import { Inject, Injectable } from '@nestjs/common';
import type { CampaignCommandResult } from '@donjon-dragon/shared/campaign-schema';
import {
  ExcludeCampaignMemberUseCase,
  type ExcludeCampaignMemberDto,
} from '@modules/campaigns/application/use-cases/exclude-campaign-member.use-case';

import { CHARACTER_REPOSITORY, type CharacterRepositoryPort } from '../ports/character.repository.port';
import { unassignCampaignMember } from './unassign-campaign-member.use-case';

@Injectable()
export class ExcludeCampaignMemberWithCharacterUseCase {
  constructor(
    private readonly exclude: ExcludeCampaignMemberUseCase,
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
  ) {}

  execute(dto: ExcludeCampaignMemberDto): Promise<CampaignCommandResult> {
    return this.exclude.execute(
      dto,
      (request) => unassignCampaignMember(this.characters, request),
    );
  }
}
