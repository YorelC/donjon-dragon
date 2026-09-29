import { Inject, Injectable } from '@nestjs/common';
import { GetCampaignMembershipsUseCase } from '@modules/campaigns/application/use-cases/get-campaign-memberships.use-case';
import type { ActorId } from '@kernel/domain/actor-id';

import {
  CHARACTER_DELETION,
  type CharacterDeletionPort,
} from '../ports/character-deletion.port';
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
    @Inject(CHARACTER_DELETION) private readonly deletion: CharacterDeletionPort,
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

    character.assertDeletableBy(context);
    await this.deletion.deleteWithJournal(character.id);
  }
}
