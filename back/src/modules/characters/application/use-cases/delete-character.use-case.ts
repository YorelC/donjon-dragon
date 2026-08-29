import { Inject, Injectable } from '@nestjs/common';
import { GetCampaignMembershipsUseCase } from '@modules/campaigns/application/use-cases/get-campaign-memberships.use-case';
import type { ActorId } from '@kernel/domain/actor-id';

import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import { loadCampaignCharacter, resolveAccessContext } from '../character.lookup';

export interface DeleteCharacterDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
}

@Injectable()
export class DeleteCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    private readonly memberships: GetCampaignMembershipsUseCase,
  ) {}

  async execute(dto: DeleteCharacterDto): Promise<void> {
    const character = await loadCampaignCharacter(
      this.characterRepo, dto.campaignId, dto.characterId,
    );
    const context = await resolveAccessContext(this.memberships, {
      campaignId: dto.campaignId,
      actorId: dto.actorId,
      createdBy: character.createdBy,
    });

    character.assertEditableBy(context);
    await this.characterRepo.deleteById(character.id);
  }
}
