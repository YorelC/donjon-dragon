import { Inject, Injectable } from '@nestjs/common';
import type { CampaignCommandResult } from '@donjon-dragon/shared/campaign-schema';
import {
  PromoteCampaignMemberUseCase,
  type PromoteCampaignMemberDto,
} from '@modules/campaigns/application/use-cases/promote-campaign-member.use-case';

import { CHARACTER_REPOSITORY, type CharacterRepositoryPort } from '../ports/character.repository.port';
import { unassignCampaignMember } from './unassign-campaign-member.use-case';

@Injectable()
export class PromoteCampaignMemberWithCharacterUseCase {
  constructor(
    private readonly promote: PromoteCampaignMemberUseCase,
    @Inject(CHARACTER_REPOSITORY) private readonly characters: CharacterRepositoryPort,
  ) {}

  execute(dto: PromoteCampaignMemberDto): Promise<CampaignCommandResult> {
    return this.promote.execute(
      dto,
      (request) => unassignCampaignMember(this.characters, request),
    );
  }
}
