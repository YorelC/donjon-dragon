import { Inject, Injectable } from '@nestjs/common';
import type { CampaignCharacterListItem } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CHARACTER_DIRECTORY,
  type CharacterDirectoryPort,
} from '../ports/character-directory.port';
import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import { toCharacterListItem } from '../character-list.mapper';
import { CharacterNotFoundError } from '../../domain/character.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export interface ListCampaignCharactersDto {
  campaignId: string;
  actorId: ActorId;
}

/**
 * Les personnages de la campagne sous une projection calculée pour le lecteur.
 * Les champs privés ne franchissent jamais la frontière HTTP avant filtrage.
 */
@Injectable()
export class ListCampaignCharactersUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
  ) {}

  async execute(dto: ListCampaignCharactersDto): Promise<CampaignCharacterListItem[]> {
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new CharacterNotFoundError();

    const viewerId = UserId.create(dto.actorId);
    const characters = await this.characterRepo.findByCampaignId(
      OwningCampaignId.create(dto.campaignId),
    );

    return Promise.all(
      characters.map((character) =>
        toCharacterListItem(this.directory, character, viewerId, role.isGameMaster),
      ),
    );
  }
}
